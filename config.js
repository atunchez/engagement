// ===================================================================
//  SHARED CONFIG for the quiz and disposable-camera pages.
//
//  ENDPOINT must be the same Google Apps Script Web App URL that's in
//  script.js (the RSVP form). If you ever re-deploy the Apps Script and
//  the URL changes, update it in BOTH files.
// ===================================================================
const ENDPOINT = "https://script.google.com/macros/s/AKfycbwDLd3eaT5iMdo7cgOs1B8RPtrU7cSO2ktTY1G28qJkCToHwNX7aXH9-_WkfmH5ibyg/exec";

// Show the leaderboard on the quiz results screen. Set to false to hide it.
const SHOW_LEADERBOARD = true;

// Date burned into the corner of disposable-camera photos, in the order a
// real point-and-shoot prints it. Set to "" to stamp the actual date the
// photo is taken instead.
const STAMP_DATE = "'26  8 29";
