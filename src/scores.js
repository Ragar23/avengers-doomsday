import { HEROES } from "./config.js";

//=====================================================================//
//  THE LEADERBOARD
//
//  Kept in localStorage. This is no longer the only board — remote-scores.js
//  holds the one everyone shares — but it is the one that cannot fail, so it
//  stays: it is what the screen falls back to when the network does not
//  answer, and what a run is written to regardless.
//=====================================================================//
const KEY = "doomsday.scores.v1";
export const BOARD_SIZE = 10;
export const NAME_LIMIT = 12;

//A run has to be worth something to take a place, or the board fills with
//nothing on the first evening.
export const MIN_SCORE = 500;

export function loadScores() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    //Anything malformed is dropped rather than trusted: this is the one
    //input the game takes from outside itself.
    return parsed
      .filter((row) => row && typeof row.name === "string" && Number.isFinite(row.score))
      .map((row) => ({
        name: row.name.slice(0, NAME_LIMIT),
        score: Math.max(0, Math.floor(row.score)),
        wave: Number.isFinite(row.wave) ? Math.floor(row.wave) : 0,
        hero: typeof row.hero === "string" && HEROES[row.hero] ? row.hero : "",
        at: Number.isFinite(row.at) ? row.at : 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, BOARD_SIZE);
  } catch {
    //Private browsing, a full quota, a corrupted value: no board, no crash
    return [];
  }
}

function save(rows) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* the run still counted, it just will not be remembered */
  }
}

//Does this run earn a place? Used to decide whether to ask for a name at all
//— being asked and then not appearing would be worse than not being asked.
export function qualifies(score) {
  return qualifiesAgainst(loadScores(), score);
}

//The same rule, asked of whichever board is actually on the screen — which
//is the shared one when it could be reached, and the local one when it
//could not. Being asked for a name has to agree with what is being shown.
export function qualifiesAgainst(rows, score) {
  if (score < MIN_SCORE) return false;
  if (rows.length < BOARD_SIZE) return true;
  return score > rows[rows.length - 1].score;
}

export function addScore(name, score, wave, hero) {
  const clean = String(name || "").trim().slice(0, NAME_LIMIT) || "ANON";
  const row = { name: clean, score: Math.floor(score), wave, hero, at: Date.now() };
  const rows = loadScores();
  rows.push(row);
  rows.sort((a, b) => b.score - a.score || a.at - b.at);
  const kept = rows.slice(0, BOARD_SIZE);
  save(kept);
  //Which line is theirs, so the screen can point at it
  return { rows: kept, place: kept.indexOf(row) };
}

export function bestScore() {
  const rows = loadScores();
  return rows.length ? rows[0] : null;
}

export function clearScores() {
  save([]);
}
