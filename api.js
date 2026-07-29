// ===================================================================
//  Thin wrapper over the Supabase REST API.
//
//  Deliberately no SDK — plain fetch keeps this site build-free, the same
//  way the rest of it works. Every call here is constrained by the row-level
//  security policies in schema.sql.
// ===================================================================

function restHeaders(extra) {
  return Object.assign(
    {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + SUPABASE_ANON_KEY,
    },
    extra || {}
  );
}

async function failIfBad(res, what) {
  if (res.ok) return;
  let detail = "";
  try {
    detail = " — " + (await res.text()).slice(0, 200);
  } catch (err) {
    /* nothing useful to add */
  }
  throw new Error(what + " failed (" + res.status + ")" + detail);
}

// ===== QUIZ SCORES =================================================

// answers: [{q: <index>, right: <bool>}, …]
async function postScore(entry) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/scores", {
    method: "POST",
    headers: restHeaders({
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    }),
    body: JSON.stringify({
      name: entry.name,
      score: entry.score,
      total: entry.total,
      answers: entry.answers,
    }),
  });
  await failIfBad(res, "Posting your score");
}

async function getLeaderboard(limit) {
  const query =
    "?select=name,score,total,created_at" +
    "&order=score.desc,created_at.asc" +
    "&limit=" + (limit || 10);

  const res = await fetch(SUPABASE_URL + "/rest/v1/scores" + query, {
    headers: restHeaders(),
  });
  await failIfBad(res, "Loading the leaderboard");
  return res.json();
}

// Every guest's per-question results, for the "only 3 of you knew this" stat.
async function getAllAnswers() {
  const res = await fetch(
    SUPABASE_URL + "/rest/v1/scores?select=answers&answers=not.is.null",
    { headers: restHeaders() }
  );
  await failIfBad(res, "Loading answer stats");
  return res.json();
}

// Rolls those up into { questionIndex: {right, total} }.
function tallyAnswers(rows) {
  const tally = {};
  rows.forEach(function (row) {
    (row.answers || []).forEach(function (a) {
      if (!tally[a.q]) tally[a.q] = { right: 0, total: 0 };
      tally[a.q].total++;
      if (a.right) tally[a.q].right++;
    });
  });
  return tally;
}

// ===== THE ANSWER-RELEASE SWITCH ===================================

async function getAnswersReleased() {
  const res = await fetch(
    SUPABASE_URL + "/rest/v1/settings?select=answers_released&id=eq.1",
    { headers: restHeaders() }
  );
  await failIfBad(res, "Checking the answer switch");
  const rows = await res.json();
  return rows.length ? rows[0].answers_released === true : false;
}

// ===== PHOTOS ======================================================

function newPhotoId() {
  return window.crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + String(Math.random()).slice(2, 8);
}

// Each photo is stored twice — the developed version and the untouched
// original — sharing one id so the pair stays matched:
//   <name>/<id>-film.jpg
//   <name>/<id>-original.heic
//
// opts: { id, kind: "film" | "original", ext, contentType }
async function uploadPhoto(body, who, opts) {
  const options = opts || {};
  const id = options.id || newPhotoId();
  const kind = options.kind || "film";
  const ext = (options.ext || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase();

  const safeWho =
    String(who || "").replace(/[^\w-]/g, "").slice(0, 24).toLowerCase() || "guest";

  const path = safeWho + "/" + id + "-" + kind + "." + ext;

  const res = await fetch(
    SUPABASE_URL + "/storage/v1/object/" + PHOTO_BUCKET + "/" + path,
    {
      method: "POST",
      headers: restHeaders({
        "Content-Type": options.contentType || "image/jpeg",
      }),
      body: body,
    }
  );
  await failIfBad(res, "Sending your photo");
  return { id: id, path: path };
}
