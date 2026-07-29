// ===================================================================
//  SHARED CONFIG for the quiz and disposable-camera pages.
//
//  These pages talk to their OWN Google Apps Script, bound to its OWN
//  spreadsheet — deliberately separate from the RSVP one, so nothing here
//  can write to your RSVP sheet. See "The party pages" in SETUP.md.
//
//  Paste the party Web App URL below. It must be a DIFFERENT URL from the
//  one in script.js.
// ===================================================================
const PARTY_ENDPOINT = "PASTE_THE_PARTY_WEB_APP_URL_HERE";

// Safety rail. This is the RSVP deployment's URL — the one thing the party
// pages must never post to, because that script would file a half-empty row
// in the RSVP sheet. If PARTY_ENDPOINT is ever set to this by accident, the
// quiz and camera refuse to send anything at all.
const RSVP_ENDPOINT_DO_NOT_USE =
  "https://script.google.com/macros/s/AKfycbwDLd3eaT5iMdo7cgOs1B8RPtrU7cSO2ktTY1G28qJkCToHwNX7aXH9-_WkfmH5ibyg/exec";

// Show the leaderboard on the quiz results screen. Set to false to hide it.
const SHOW_LEADERBOARD = true;

// Date burned into the corner of disposable-camera photos, in the order a
// real point-and-shoot prints it. Set to "" to stamp the actual date the
// photo is taken instead.
const STAMP_DATE = "'26  8 29";

// ===================================================================

// Returns the endpoint to post to, or null if it isn't safely configured.
// Both the quiz and the camera check this before sending anything.
function partyEndpoint() {
  if (!PARTY_ENDPOINT || PARTY_ENDPOINT.indexOf("PASTE") === 0) return null;
  if (PARTY_ENDPOINT === RSVP_ENDPOINT_DO_NOT_USE) {
    console.error(
      "PARTY_ENDPOINT is set to the RSVP deployment. Refusing to send — " +
        "deploy the separate party script and use its URL instead."
    );
    return null;
  }
  return PARTY_ENDPOINT;
}
