# AVENGERS: DOOMSDAY — arcade

A Doomsday-themed reskin of the remastered arcade shooter.
Same engine, different war: you are holding a line against an incursion.
Doom's Sentinels come through it, his coven of Latverian Witches arrives one
at a time, and Doom himself waits at wave ten.

The countdown on the menu runs to **18 December 2026**. It is a single
constant, `RELEASE`, at the top of `src/boot.js`.

> This repository is the Doomsday game on its own. It began as the
> `doomsday` branch of
> [marvel-women-assemble-remastered](https://github.com/Ragar23/marvel-women-assemble-remastered),
> where `main` is the Avengers remaster; nothing here is merged back into it.

## Play it

Live at **<https://ragar23.github.io/avengers-doomsday/>**.

To run it locally: no build step, no dependencies — it is plain HTML, CSS and JS.

```bash
git clone https://github.com/Ragar23/avengers-doomsday.git
cd avengers-doomsday
python3 -m http.server 5501   # or: npx serve .
```

Then open <http://localhost:5501>. Opening `index.html` directly with `file://`
mostly works too, but a local server is more reliable for the audio and font files.

> The START button stays disabled until every sprite has decoded, because the
> collision boxes are measured from `image.width` / `image.height`.

## Controls

| Key | Action |
| --- | --- |
| `↑` `↓` `←` `→` | Move |
| `S` | Shoot — hold to keep firing |
| `Space` | Ultimate — once the meter is full |
| `Esc` | Pause |
| `M` | Mute |
| `W` | Easter egg — the women assemble |

## What's in it

- **Four heroes that play differently**, each with an ultimate charged by kills
  and spent with `Space`:
  - **Thor** — and he is the only one who picks a weapon before the run.
    **Stormbreaker** never leaves his hand: holding `S` earths a bolt through
    the axe into whatever is nearest and jumps it along to the next two, so a
    line of Sentinels goes down together. **Mjolnir** is thrown instead —
    it seeks its own targets, strikes several and comes back, and he cannot
    throw again until he catches it. **God Blast** is the same either way:
    the sky goes out and a strike comes down on every enemy on screen.
  - **Cyclops** — a long optic blast from the visor that pierces everything in
    its path. **Optic Overload** is that same beam with the visor off: the
    same red, wider than he is tall, held open across the screen for three
    and a half seconds.
  - **Shuri** as Black Panther — kinetic claw pulses that carry only so far, so
    she has to close in, and she punches anything within reach. **Kinetic
    Blast** dumps the stored energy back out as one purple shockwave, and what
    the suit cannot spend in that instant stays wrapped around her for five
    seconds, burning anything that closes.
  - **Human Torch** — fireballs, and he only catches light while he is throwing
    them: hold `S` and the sprite runs a three-frame flame cycle. **Flame On**
    sets him alight for fifteen seconds without the key held: everything on
    screen burns at once, and anything that touches him afterwards burns too.

- **An incursion, not a health bar.** Two universes' Earths are meeting, and
  everything that gets past you brings the other one closer — it hangs in the
  sky the whole run, growing. At the top the two collide and it is over.
  Crossing a stage of it makes everything on screen faster, so the run gets
  harder *because* you are losing. The one way to give ground back is to take
  a whole wave without letting anything through, which pushes it away again.

- **A leaderboard everyone shares.** Ten best runs, read from and written to
  a Postgres table in Supabase, so a name typed on one phone shows up on
  everybody else's. The device's own `localStorage` board is still there and
  still written to, and it is what the screen falls back to when the shared
  board cannot be reached — it goes up first either way, so nobody waits on a
  request they cannot see, and the note under the board says which of the two
  they are looking at. A run is only asked for a name when it actually earned
  a place: being asked and then not appearing would be worse than not being
  asked.

  The key in `src/remote-scores.js` is Supabase's publishable key and is meant
  to be read off the page; what it may do is set by row-level security on the
  table, not by hiding it. Read the board, add a row, nothing else — there is
  no update policy and no delete policy, so a score cannot be edited or
  removed once posted, and the columns are bounded in the database rather than
  only in the client. The game runs in the browser, so a determined person can
  still post a score they did not earn; the table is built to limit the mess,
  not to pretend that is impossible.

- **Pausing is the way out.** `Esc` — or the button beside the screen —
  offers RESUME and MAIN MENU, because once a run had started there was no
  route back to the menu at all, and a phone has no key to press. `Q` quits
  outright.

- **Lives you earn back.** Three is what you start with and nowhere near
  enough to reach wave six on, so every 5,000 points is another one, up to
  five, and a rare **1UP** drop is one outright. A sliver under the life
  icons fills toward the next, so the milestone is something you can see
  coming rather than a surprise. A boss pays 1,000 a wave, which means
  clearing one is usually a life by itself.

- **Sentinels that fight back.** The fast ones line up on you, wind up, and
  commit. Gunners walk to a line, track you while they decide, lock, and burn
  a lane — the hairline they draw while charging is exactly where the beam
  lands, so getting hit is a decision you made. They hold their line for two
  shots and then come on, so ignoring one still costs you.

- **Sentinels** replace the space dogs — slower, heavier, and there are a lot
  of them, in three kinds. Weathered plate with two green optics burning out of
  it, the way the teaser has them, and the Prime at wave five is the same
  thing four times the size.
- **Doom fights in three phases**, entered on his health, each a different
  problem. He opens as a sorcerer. At two thirds he puts a leaded window
  between you and him — nothing reaches him until it is broken, and breaking
  it leaves him reeling and worth nearly double. At a third he stops calling
  for help altogether and starts pulling the other Earth in by hand, which
  turns the fight into a race he wins by default if you let it run.

- **The menu is one screen.** The hero, the rules and the controls are all
  on it at once with nothing to scroll past to reach START — three cards
  abreast on anything wide, and on a phone the heroes take a row with the
  other two sharing the next. Everything is sized against viewport height, so
  a short screen compresses instead of overflowing.

- **It plays on a phone**, and the controls have their own space rather than
  sitting on top of the picture. A four-way pad on one side, FIRE, ULT, W and
  pause on the other; in landscape they flank the screen, in portrait the
  picture goes up top and the deck fills what is left. Every control holds or
  presses the key it is labelled with, so touch and keyboard run down one
  path and the simulation has no idea a touchscreen exists. Movement is a
  stick rather than four arrows: four caps meant four small targets, where
  this is one the size of the whole circle, the knob follows the thumb, and
  it flies wherever you push rather than to the nearest eighth. The picture is sized around whatever the deck leaves, so
  nothing is ever cropped, and the page is locked against scrolling.

  The picture is sized from the screen it is on rather than from a number
  picked in advance: it asks for whatever width it needs to fill the height,
  the decks take what is left, and if that would leave them narrower than a
  thumb the picture gives ground until it does not. A phone as wide as a
  modern one has width over even then — a 16:9 picture at full height cannot
  use it — so that goes to the thumbs too rather than sitting at the edges
  with the game looking narrow in the middle of it. Only the controls dodge
  the notch and the home indicator; the picture is full bleed, because
  padding the whole screen by the safe area cost it a fifth of its width on
  an iPhone in landscape for no reason at all.

  Playing needs two thumbs, which is precisely what a browser reads as a
  pinch — so while a run is on screen the game refuses the zoom gestures
  outright, `touch-action` being no help at all here (iOS ignores it for page
  zoom). It refuses them *only* while playing: pinching the menu is how some
  people read it. The played screen is pinned with `position: fixed`, which
  is the visible area by definition, so there is no viewport-unit arithmetic
  to get wrong and nothing to rubber-band against. START asks for fullscreen
  where the browser has it, and the page carries a manifest and icons so
  adding it to a home screen opens it with no browser chrome at all — which
  is the steadiest it gets on an iPhone, where there is no Fullscreen API.

- **The Latverian Witches** arrive one at a time, named, with a health bar from
  the moment they appear, and they do not walk past you. Each holds a line
  partway across the screen and fights from it until it is put down, so the
  cheapest answer to a named elite is no longer to stand aside and pay the
  leak. Marvel confirmed the coven at SDCC but has not
  detailed their powers, so these are three distinct ideas built from the
  premise, named by coven title rather than invented as canon: **The Hexweaver**
  throws hexbolts from range, **The Veiled** blinks toward you, and **The
  Warden** carries a ward that soaks damage until it breaks open.
- **A boss every fifth wave** — a **Sentinel Prime** at wave 5, **Doctor Doom**
  at wave 10 with a five-bolt green wave, alternating after that.
- **The line-up** answering `W`: Reed Richards, Beast, Bucky Barnes, Mystique,
  Loki and Magneto.

- **Stan Lee wanders through.** Every twenty to fifty seconds he walks on from
  one side, stops in the middle to wave, and carries on out of frame.
- **Animation throughout.** The hero banks into turns and kicks back when firing,
  enemies bob and fade in and spin apart when killed, Thanos telegraphs his blasts
  and comes apart in slow motion, and every kill freezes the game for a few frames
  so the hit lands.

Everything worth arguing about — speeds, hit points, drop rates, wave sizes,
animation timings — is in the `CONFIG`, `HEROES`, `ENEMY_TYPES` and `WAVE_PLAN`
objects at the top of `index.js`. Speeds are in pixels per **second**, so the game plays identically on
a 60Hz laptop and a 120Hz display.

## How it is built today

| File | Contains |
| --- | --- |
| `index.html` | The three screens — menu, game, game over — and the `<canvas>` |
| `index.js` | Tuning, asset loading, input, waves, entities, collisions, effects, HUD, audio |
| `style.css` | The menu and game-over design, and the responsive canvas |
| `tools/` | `make-thor-sprite.py`, which draws `thor.png` and `lightning.png` |
| `images/` | Sprites and backgrounds |
| `assets/` | Music, sound effects and the `Marvel.ttf` font |

Everything runs off a single `requestAnimationFrame` loop driven by delta time, with
a state machine (`menu` / `playing` / `paused` / `gameover`) deciding what is on
screen.

> Because the game is ES modules, it must be served over HTTP — opening
> `index.html` from the filesystem will not work.

## Regenerating art and sound

Most of the art and all nine sound effects are generated, not hand-authored,
so they can be tweaked and rebuilt:

```bash
python3 tools/make_icons.py       # the home-screen icons
python3 tools/make_incursion.py   # the other Earth
python3 tools/make_menu_art.py    # the menu art, from the stills in images/src/
python3 tools/make_hires.py       # Thor and the Human Torch — needs Pillow
python3 tools/tint_shuri.py       # repaints the panther suit in her violet
python3 tools/make_doomsday.py    # the rest of the Doomsday cast
python3 tools/make_ironman.py
python3 tools/make_mjolnir.py
python3 tools/make_sounds.py      # stdlib only
```

`make_menu_art.py` works from the teaser frames kept in `images/src/`: it
crops the countdown burned into the backdrop still so the page's live clock
is the only one on screen, feathers the edges of the title lockup so it sits
in the page rather than on it, and brings six megabytes of PNG down to four
hundred kilobytes. Edit the originals under `src/` and re-run it.

`make_hires.py` draws on a 27x34 logical grid and upscales it, which is the
same density as the hand-drawn art it stands next to — the 104x96 builder in
`make_doomsday.py` could not reach it. Anything named in `images/handmade.txt`
is art someone drew by hand and every generator skips it; see that file before
swapping a sprite, particularly for the sets the game cross-fades between.

## Testing

`tools/smoke.js` drives the real game in a headless browser and checks that each
hero kills, each ultimate fires, the boss lives and dies, and the screens flow:

```bash
python3 -m http.server 8899 &
node tools/smoke.js
```

## What is next

See [`ROADMAP.md`](./ROADMAP.md) for the prioritised list of fixes and improvements —
starting with the bugs that are currently reachable during normal play.

## Credits

Built by [Raquel R. García](https://github.com/Ragar23). Marvel characters, artwork and
music belong to Marvel / Disney; this is a non-commercial fan project made for learning.
