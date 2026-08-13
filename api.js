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
// opts: { id, kind: "film" | "original", ext, contentType, bucket }
async function uploadPhoto(body, who, opts) {
  const options = opts || {};
  const id = options.id || newPhotoId();
  const kind = options.kind || "film";
  const ext = (options.ext || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const bucket = options.bucket || PHOTO_BUCKET;

  const safeWho =
    String(who || "").replace(/[^\w-]/g, "").slice(0, 24).toLowerCase() || "guest";

  const path = safeWho + "/" + id + "-" + kind + "." + ext;

  const res = await fetch(
    SUPABASE_URL + "/storage/v1/object/" + bucket + "/" + path,
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

// ===== THE COLLAGE =================================================

// Guests can't list the bucket, so every developed photo gets a row here for
// the collage to read.
async function recordPhoto(path, who) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/photos", {
    method: "POST",
    headers: restHeaders({
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    }),
    body: JSON.stringify({ path: path, name: who || null }),
  });
  await failIfBad(res, "Adding your photo to the wall");
}

async function getPhotos(limit) {
  const res = await fetch(
    SUPABASE_URL + "/rest/v1/photos?select=path,name,created_at" +
      "&order=created_at.desc&limit=" + (limit || 60),
    { headers: restHeaders() }
  );
  await failIfBad(res, "Loading the photo wall");
  return res.json();
}

// Only works because party-photos is a public bucket.
function photoUrl(path) {
  return SUPABASE_URL + "/storage/v1/object/public/" + PHOTO_BUCKET + "/" + path;
}

// ===== ADMIN SIGN-IN (admin.html only) =============================
//
// Supabase Auth handles the password, so there's no secret in this file. A
// signed-in session is kept in localStorage and refreshed when it expires.

const SESSION_KEY = "engagement-admin-session-v1";

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch (err) {
    return null;
  }
}

function storeSession(session) {
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        // expires_in is seconds from now; keep an absolute time instead.
        expires_at: Date.now() + (session.expires_in || 3600) * 1000,
        email: session.user && session.user.email,
      })
    );
  } catch (err) {
    /* private browsing — they'll just have to sign in again */
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    /* nothing to clear */
  }
}

async function signIn(email, password) {
  const res = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, password: password }),
  });

  if (!res.ok) {
    let msg = "Sign-in failed.";
    try {
      const body = await res.json();
      // GoTrue says "Invalid login credentials" for both wrong email and
      // wrong password, which is the correct thing for it to do.
      msg = body.error_description || body.msg || body.message || msg;
    } catch (err) {
      /* keep the generic message */
    }
    throw new Error(msg);
  }

  const session = await res.json();
  storeSession(session);
  return session;
}

async function refreshSession(refreshToken) {
  const res = await fetch(
    SUPABASE_URL + "/auth/v1/token?grant_type=refresh_token",
    {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }
  );
  if (!res.ok) throw new Error("Session expired — sign in again.");

  const session = await res.json();
  storeSession(session);
  return session;
}

// Returns headers that act as the signed-in user, refreshing first if the
// token is close to expiring. Throws if there's no usable session.
async function adminHeaders() {
  let session = loadSession();
  if (!session || !session.access_token) throw new Error("Not signed in.");

  // 60s of slack, so a token can't expire mid-request.
  if (!session.expires_at || session.expires_at - Date.now() < 60000) {
    session = await refreshSession(session.refresh_token);
    session = loadSession();
  }

  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: "Bearer " + session.access_token,
  };
}

async function signOut() {
  const session = loadSession();
  clearSession();
  if (!session || !session.access_token) return;
  try {
    await fetch(SUPABASE_URL + "/auth/v1/logout", {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: "Bearer " + session.access_token,
      },
    });
  } catch (err) {
    // The local session is already gone, which is what matters here.
  }
}

// Both switches at once, so the admin page can show real current state.
async function getSwitches() {
  const res = await fetch(
    SUPABASE_URL + "/rest/v1/settings?select=answers_released,collage_visible,games_live&id=eq.1",
    { headers: restHeaders() }
  );
  await failIfBad(res, "Reading the switches");
  const rows = await res.json();
  if (!rows.length) throw new Error("The settings row is missing — see SETUP.md.");
  return rows[0];
}

// field: "answers_released" | "collage_visible"
async function setSwitch(field, value) {
  const body = {};
  body[field] = value;
  body.updated_at = new Date().toISOString();

  const res = await fetch(SUPABASE_URL + "/rest/v1/settings?id=eq.1", {
    method: "PATCH",
    headers: Object.assign(await adminHeaders(), {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify(body),
  });
  await failIfBad(res, "Flipping the switch");

  const rows = await res.json();
  // RLS returns an empty array rather than an error when a row is off-limits,
  // so an empty result here means "not allowed", not "worked".
  if (!rows.length) {
    throw new Error(
      "That account isn't allowed to change this. Check the email list in schema.sql."
    );
  }
  return rows[0];
}

async function getCollageVisible() {
  const res = await fetch(
    SUPABASE_URL + "/rest/v1/settings?select=collage_visible&id=eq.1",
    { headers: restHeaders() }
  );
  await failIfBad(res, "Checking the collage switch");
  const rows = await res.json();
  return rows.length ? rows[0].collage_visible === true : false;
}
