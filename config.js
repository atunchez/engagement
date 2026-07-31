// ===================================================================
//  SHARED CONFIG for the party pages (quiz + disposable camera).
//
//  These pages use Supabase — their own database, completely separate from
//  the RSVP form, which still uses its Google Sheet and script.js. Nothing
//  here can touch your RSVP sheet.
//
//  Fill in the two values below from your Supabase project:
//    Dashboard → Project Settings → API
//  See "The party pages" in SETUP.md.
// ===================================================================

const SUPABASE_URL = "https://qibonxsmiybrmbbotbwd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_zdzKqU2-bGHMBG04kfS2jQ_2_1bVa3p";

// The publishable key is meant to be public — it's safe in this file and in
// the repo. What it's allowed to do is fixed by the row-level security
// policies in schema.sql: post a score, read the leaderboard, upload a photo.
// Nothing else — verified: it cannot edit or delete a score, cannot flip the
// answer switch, and cannot read back any photo.
//
// Never put a "secret" key here (the old name was service_role); those
// bypass every policy.

// ===================================================================

// Storage bucket for guest photos.
const PHOTO_BUCKET = "party-photos";

// How often the quiz checks whether you've released the answers (ms).
const RELEASE_POLL_MS = 20000;

// How often the TV leaderboard refreshes (ms).
const BOARD_POLL_MS = 8000;

// Date burned into the corner of disposable-camera photos: month day year,
// the party date. Set to "" to stamp whatever date the photo is taken.
const STAMP_DATE = "8 29 '26";

// ===================================================================

// True when the page is being previewed off a local machine rather than the
// real site. Used to gate preview-only shortcuts so guests can't reach them.
// Covers localhost and the 192.168.x.x / 10.x.x.x addresses you'd use to open
// the site on your phone over home wifi.
function isLocalPreview() {
  const h = location.hostname;
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "" ||
    /^192\.168\./.test(h) ||
    /^10\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  );
}

// True once both values above have been filled in.
function isConfigured() {
  return (
    SUPABASE_URL.indexOf("PASTE") === -1 &&
    SUPABASE_ANON_KEY.indexOf("PASTE") === -1 &&
    SUPABASE_URL.indexOf("supabase.co") !== -1
  );
}
