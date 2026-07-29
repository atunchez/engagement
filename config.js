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

const SUPABASE_URL = "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE"; // https://xxxx.supabase.co
const SUPABASE_ANON_KEY = "PASTE_YOUR_SUPABASE_ANON_KEY_HERE";

// The "anon" key is meant to be public — it's safe in this file and in the
// repo. What it's allowed to do is fixed by the row-level security policies
// in schema.sql: post a score, read the leaderboard, upload a photo. Nothing
// else. Never put the service_role key here; that one bypasses every policy.

// ===================================================================

// Storage bucket for guest photos.
const PHOTO_BUCKET = "party-photos";

// How often the quiz checks whether you've released the answers (ms).
const RELEASE_POLL_MS = 20000;

// How often the TV leaderboard refreshes (ms).
const BOARD_POLL_MS = 8000;

// Date burned into the corner of disposable-camera photos, in the order a
// real point-and-shoot prints it. Set to "" to stamp the actual date the
// photo is taken instead.
const STAMP_DATE = "'26  8 29";

// ===================================================================

// True once both values above have been filled in.
function isConfigured() {
  return (
    SUPABASE_URL.indexOf("PASTE") !== 0 &&
    SUPABASE_ANON_KEY.indexOf("PASTE") !== 0 &&
    SUPABASE_URL.indexOf("supabase.co") !== -1
  );
}
