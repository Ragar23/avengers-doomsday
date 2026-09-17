//=====================================================================//
//  THE BOARD EVERYONE SHARES
//
//  The local board in scores.js is still the one that always works. This is
//  the one other people can see, and it is allowed to fail: every call here
//  resolves to null rather than throwing, and every caller treats null as
//  "show the local board instead". A leaderboard is not worth a broken
//  game-over screen.
//
//  The key below is Supabase's publishable key. It is meant to be read off
//  the page — it carries no privileges of its own, and what it is allowed to
//  do is decided by row-level security on the table, not by keeping it
//  secret. Read the whole board; add a row; nothing else. There is no update
//  policy and no delete policy, so both are refused.
//=====================================================================//
import { BOARD_SIZE, NAME_LIMIT } from "./scores.js";
import { HEROES } from "./config.js";

const PROJECT = "https://klrddgfhtmebbuhqrjyo.supabase.co";
const KEY = "sb_publishable_-VohpYsS8imfrxk1djnoHA_tRxIom3B";
const TABLE = "doomsday_scores";

const ENDPOINT = `${PROJECT}/rest/v1/${TABLE}`;
export const remoteEnabled = Boolean(PROJECT && KEY);

//Long enough for a phone on a bad connection, short enough that nobody sits
//looking at a dead screen wondering whether it is coming.
const TIMEOUT = 4500;

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function call(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { ...init, headers, signal: controller.signal });
    return res.ok ? res : null;
  } catch {
    //Offline, blocked, aborted, CORS — all the same answer to the caller.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

//Every row here was typed by a stranger, so it is checked exactly as
//hard as the localStorage board is. The screen puts these in with
//textContent, so markup in a name is text and not markup — but the
//shape still has to be right or the sort and the render misbehave.
function clean(row) {
  if (!row || typeof row.name !== "string" || !Number.isFinite(Number(row.score))) return null;
  const name = row.name.slice(0, NAME_LIMIT);
  if (!name) return null;
  return {
    name,
    score: Math.max(0, Math.floor(Number(row.score))),
    wave: Number.isFinite(Number(row.wave)) ? Math.floor(Number(row.wave)) : 0,
    hero: typeof row.hero === "string" && HEROES[row.hero] ? row.hero : "",
    at: Date.parse(row.created_at) || 0,
  };
}

//The top of the board, or null if it could not be reached.
export async function fetchBoard(limit = BOARD_SIZE) {
  if (!remoteEnabled) return null;
  const query =
    `${ENDPOINT}?select=name,score,wave,hero,created_at` +
    `&order=score.desc,created_at.asc&limit=${limit}`;
  const res = await call(query, { method: "GET" });
  if (!res) return null;
  try {
    const rows = await res.json();
    if (!Array.isArray(rows)) return null;
    return rows.map(clean).filter(Boolean);
  } catch {
    return null;
  }
}

//true if the run is now on the board, false if it could not be posted.
export async function postScore(name, score, wave, hero) {
  if (!remoteEnabled) return false;
  const res = await call(ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      name: String(name || "").trim().slice(0, NAME_LIMIT) || "ANON",
      score: Math.max(0, Math.floor(score)),
      wave: Math.max(0, Math.floor(wave || 0)),
      hero: typeof hero === "string" ? hero.slice(0, 16) : "",
    }),
  });
  return Boolean(res);
}
