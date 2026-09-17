import { audio, playMusic, unlockAudio } from "./audio.js";
import { countUp } from "./boot.js";
import { CONFIG } from "./config.js";
import { gameOverTitle, leaderboard, leaderboardList, leaderboardNote, nameForm, nameInput, pauseOverlay, showScreen, statCombo, statKills, statScore, statWave, touchPauseBtn } from "./dom.js";
import { draw } from "./render.js";
import { update } from "./sim.js";
import { isTouch, releaseAllInput } from "./input.js";
import { addScore, loadScores, NAME_LIMIT, qualifiesAgainst } from "./scores.js";
import { fetchBoard, postScore, remoteEnabled } from "./remote-scores.js";
import { fx, resetGame, run, sess } from "./state.js";
import { clamp } from "./util.js";

//=====================================================================//
export function frame(now) {
  if (sess.state !== "playing") return;
  //Floored at zero as well as capped. A negative delta — the clock stepping
  //back, or a requestAnimationFrame timestamp that does not share an origin
  //with performance.now() — makes `fx.hitStop -= realDt` count *up*, and the
  //loop then draws for ever inside the hit-stop branch without once calling
  //update(). The frame keeps painting, so it does not look like a hang.
  const realDt = clamp((now - sess.lastFrameTime) / 1000, 0, 0.05);
  sess.lastFrameTime = now;

  //Hit-stop: hold the world still for a few frames, but keep drawing so the
  //freeze reads as impact rather than a dropped frame.
  if (fx.hitStop > 0) {
    fx.hitStop -= realDt;
    draw();
    sess.animationId = requestAnimationFrame(frame);
    return;
  }

  //Slow motion for the boss death, easing back to full speed afterwards.
  if (fx.slowMo > 0) {
    fx.slowMo -= realDt;
    fx.timeScale = CONFIG.anim.slowMoScale;
  } else {
    fx.timeScale = Math.min(1, fx.timeScale + realDt * 1.8);
  }
  const dt = realDt * fx.timeScale;

  update(dt);
  //update() can end the run; don't draw a frame of a dead game
  if (sess.state === "playing") {
    draw();
    sess.animationId = requestAnimationFrame(frame);
  }
}

//A phone's address bar slides in and out as you play, resizing the viewport
//under the game every time. Fullscreen is the only way to stop it, and START
//is a user gesture, which is the only moment a browser will allow the
//request. Best-effort in every sense: Chrome on Android takes it, iPhone
//Safari does not support it at all, and nothing here depends on the answer —
//if it is refused the game is exactly as it was.
function goFullscreen() {
  if (!isTouch || document.fullscreenElement) return;
  const el = document.documentElement;
  const request =
    el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (!request) return;
  try {
    const result = request.call(el, { navigationUI: "hide" });
    if (result && typeof result.catch === "function") result.catch(() => {});
  } catch {
    /* refused; the run carries on in the space the browser gives us */
  }
}

export function startRun() {
  //Whatever was under a thumb when the last run ended is not held any more
  releaseAllInput();
  goFullscreen();
  //START is a gesture, which is the only time a phone will open the audio
  unlockAudio();
  resetGame();
  showScreen("game");
  sess.state = "playing";
  sess.lastFrameTime = performance.now();
  sess.animationId = requestAnimationFrame(frame);
  playMusic();
}

//The same button pauses and resumes, so it has to say which it is about to
//do. A phone has no Esc to fall back on if it gets this wrong.
function markPauseButton(paused) {
  if (!touchPauseBtn) return;
  touchPauseBtn.classList.toggle("is-paused", paused);
  //Built rather than assigned as markup. Nothing in this file writes HTML
  //from a string — the leaderboard puts a name someone typed on the screen,
  //and the safest rule is the one with no exceptions to remember.
  const glyph = document.createElement("b");
  glyph.textContent = paused ? "\u25B6" : "\u2759\u2759";
  const label = document.createElement("small");
  label.textContent = paused ? "resume" : "pause";
  touchPauseBtn.replaceChildren(glyph, label);
}

export function togglePause() {
  if (sess.state === "playing") {
    sess.state = "paused";
    if (sess.animationId !== null) cancelAnimationFrame(sess.animationId);
    sess.animationId = null;
    pauseOverlay.classList.add("is-visible");
    markPauseButton(true);
    audio.pause();
  } else if (sess.state === "paused") {
    sess.state = "playing";
    pauseOverlay.classList.remove("is-visible");
    markPauseButton(false);
    sess.lastFrameTime = performance.now();
    sess.animationId = requestAnimationFrame(frame);
    //Coming back from a pause is a gesture, and it is the moment a context
    //suspended while the tab was away can be opened again.
    unlockAudio();
    playMusic();
  }
}

//Leaving the game gives the browser back — the menu and the game-over panel
//are ordinary pages and should behave like them.
function leaveFullscreen() {
  if (!document.fullscreenElement) return;
  try {
    const result = document.exitFullscreen && document.exitFullscreen();
    if (result && typeof result.catch === "function") result.catch(() => {});
  } catch {
    /* nothing to do about it */
  }
}

//The way out of a run. There was no route back to the menu once one had
//started — on a phone especially, where there is no key to press — so
//pausing offers it, which is where anyone would look.
export function quitToMenu() {
  if (sess.state !== "playing" && sess.state !== "paused") return;
  if (sess.animationId !== null) cancelAnimationFrame(sess.animationId);
  sess.animationId = null;
  sess.state = "menu";
  releaseAllInput();
  pauseOverlay.classList.remove("is-visible");
  markPauseButton(false);
  showScreen("menu");
  leaveFullscreen();
  audio.pause();
}

export function endGame() {
  //The screen is about to change out from under whatever is being pressed,
  //which is exactly when a held key would otherwise survive into the next
  //run — the controls are hidden, so their pointerup never arrives.
  releaseAllInput();
  sess.state = "gameover";
  if (sess.animationId !== null) cancelAnimationFrame(sess.animationId);
  sess.animationId = null;
  pauseOverlay.classList.remove("is-visible");

  gameOverTitle.innerText =
    run.incursion >= CONFIG.incursion.max
      ? "THE EARTHS HAVE MET"
      : "HELL ANSWERS TO ME";
  countUp(statScore, run.score);
  countUp(statWave, run.wave, 0.6);
  countUp(statKills, run.kills, 0.75);
  countUp(statCombo, run.bestCombo, 0.6, "x");

  showScreen("gameover");
  leaveFullscreen();
  audio.pause();
  //Async now — it goes and asks for the shared board. It swallows its own
  //failures, and this catch is only here so a rejection can never reach the
  //console of a screen that is otherwise fine.
  presentBoard().catch(() => {});
}

//=====================================================================//
//  THE LEADERBOARD, on the screen you land on
//=====================================================================//
function drawBoard(rows, place = -1) {
  if (!leaderboard || !leaderboardList) return;
  leaderboard.hidden = rows.length === 0;
  leaderboardList.replaceChildren();
  rows.forEach((row, i) => {
    const li = document.createElement("li");
    li.className = i === place ? "is-yours" : "";
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = row.name;
    const what = document.createElement("span");
    what.className = "what";
    what.textContent = row.wave ? `WAVE ${row.wave}` : "";
    const points = document.createElement("b");
    points.textContent = row.score.toLocaleString("en-GB");
    li.append(who, what, points);
    leaderboardList.append(li);
  });
}

//Which board is on the screen, said plainly. Someone who has just typed
//their name deserves to know whether anyone else will see it.
function setNote(shared) {
  if (!leaderboardNote) return;
  leaderboardNote.textContent = shared
    ? "Every run, from everyone who has played."
    : "Kept on this device \u2014 the shared board could not be reached.";
}

//The name a run was saved under, cleaned the same way scores.js cleans it,
//so the row can be found again on a board that came back from the server.
function asSaved(name) {
  return String(name || "").trim().slice(0, NAME_LIMIT) || "ANON";
}

//Ask for a name only when the run actually earned a place.
async function presentBoard() {
  if (!nameForm) return;
  //The local board goes up first and without waiting for anything: a screen
  //that arrives filled and then improves reads better than one that sits
  //empty while a request it cannot see is outstanding.
  let board = loadScores();
  drawBoard(board);
  setNote(false);

  //Decided against the local board first, and decided now: nobody should
  //wait on a request they cannot see to find out whether they are being
  //asked for their name.
  const earnedHere = qualifiesAgainst(board, run.score);
  nameForm.hidden = !earnedHere;
  if (earnedHere) offerLastName();

  const shared = remoteEnabled ? await fetchBoard() : null;
  //TRY AGAIN and MAIN MENU are right there, and four seconds is long enough
  //to have used one of them. Do not draw on a screen that has moved on.
  if (sess.state !== "gameover") return;
  if (shared) {
    board = shared;
    drawBoard(board);
  }
  setNote(Boolean(shared));

  //The shared board can only widen the offer, never withdraw it. A run good
  //enough for this device is posted either way, so taking the form back
  //would remove the only chance to put a name to it — and a run that misses
  //the local board can still make the shared one, which is worth asking for.
  if (earnedHere) return;
  if (!shared || !qualifiesAgainst(board, run.score)) return;
  nameForm.hidden = false;
  offerLastName();
}

//Offer back whatever they used last time, so a regular does not retype it.
function offerLastName() {
  try {
    nameInput.value = window.localStorage.getItem(LAST_NAME) || "";
  } catch {
    nameInput.value = "";
  }
  //Focusing on a phone throws the keyboard up over the screen; let them tap.
  if (!isTouch) nameInput.focus();
}

const LAST_NAME = "doomsday.lastName";

if (nameForm) {
  nameForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    //The run goes to this device either way. The shared board is the part
    //that is allowed to fail, and a failed post should not also cost someone
    //their own record of the run.
    const { rows: mine, place: minePlace } = addScore(name, run.score, run.wave, sess.chosenHero);
    try {
      window.localStorage.setItem(LAST_NAME, name);
    } catch {
      /* not being able to remember the name costs nothing */
    }

    //Both of these happen before anything is sent. Taking the form away is
    //also what stops a second SAVE: a slow network is exactly when someone
    //presses it again, and the table has no delete policy to undo the
    //duplicate with.
    nameForm.hidden = true;
    drawBoard(mine, minePlace);
    if (!remoteEnabled) return;

    const posted = await postScore(name, run.score, run.wave, sess.chosenHero);
    const shared = posted ? await fetchBoard() : null;
    if (sess.state !== "gameover") return;
    if (!shared) {
      //Their own board still shows the run, and the note stops short of
      //claiming anyone else can see it.
      setNote(false);
      return;
    }
    const saved = asSaved(name);
    const score = Math.floor(run.score);
    setNote(true);
    drawBoard(shared, shared.findIndex((r) => r.name === saved && r.score === score));
  });
}

//=====================================================================//
//  AUDIO
