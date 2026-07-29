/**
 * Google Apps Script for the PARTY PAGES ONLY — the quiz and the disposable
 * camera. This is a **separate script bound to a separate spreadsheet** from
 * the RSVP one, on purpose:
 *
 *   - It cannot touch the RSVP sheet. It never opens it and never looks it up.
 *   - Re-deploying it can't disturb the live RSVP form, which is collecting
 *     responses right now.
 *
 * Do NOT paste this into the RSVP spreadsheet's Apps Script editor. Create a
 * brand-new Sheet for it — SETUP.md walks through it.
 *
 * What it does:
 *   POST {type: "quiz",  …}  → appends a row to "Quiz Scores"
 *   POST {type: "photo", …}  → saves the image to Drive, logs it in "Photos"
 *   GET  ?action=leaderboard → returns the top scores as JSON
 */

// Drive folder for guest photos. Created on the first upload.
const PARTY_FOLDER_NAME = "Engagement Party Photos";

const QUIZ_SHEET = "Quiz Scores";
const PHOTO_SHEET = "Photos";

const LEADERBOARD_SIZE = 10;

// ===================================================================
//  RECEIVING
// ===================================================================

function doPost(e) {
  // Guests all submit within the same few minutes, so serialise the appends.
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === "quiz") {
      saveQuizScore_(data);
    } else if (data.type === "photo") {
      savePhoto_(data);
    } else {
      // Anything else isn't ours — an RSVP aimed at the wrong deployment,
      // most likely. Refuse it rather than filing it somewhere odd.
      return json_({ result: "ignored", message: "unknown type" });
    }

    return json_({ result: "success" });
  } catch (err) {
    return json_({ result: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function saveQuizScore_(data) {
  const sheet = getOrCreateSheet_(QUIZ_SHEET, [
    "Timestamp", "Name", "Score", "Out Of", "Percent",
  ]);

  sheet.appendRow([
    new Date(),
    safeText_(data.name),
    Number(data.score) || 0,
    Number(data.total) || 0,
    Number(data.percent) || 0,
  ]);
}

function savePhoto_(data) {
  const sheet = getOrCreateSheet_(PHOTO_SHEET, ["Timestamp", "Name", "Photo"]);

  let link = "";
  if (data.photoData) {
    const who = String(data.name || "guest").replace(/[^\w\- ]/g, "").trim() || "guest";
    const stamp = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd-HHmmss"
    );

    const bytes = Utilities.base64Decode(data.photoData);
    const blob = Utilities.newBlob(
      bytes,
      data.photoType || "image/jpeg",
      who + "-" + stamp + ".jpg"
    );

    const file = getOrCreateFolder_(PARTY_FOLDER_NAME).createFile(blob);
    link = file.getUrl();
  }

  sheet.appendRow([new Date(), safeText_(data.name), link]);
}

// ===================================================================
//  LEADERBOARD
// ===================================================================

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : "";
  if (action === "leaderboard") return json_(leaderboard_());
  return json_({ result: "ok" });
}

function leaderboard_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(QUIZ_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];

  // Columns: Timestamp | Name | Score | Out Of | Percent
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();

  return rows
    .filter(function (r) { return r[1] !== "" && r[1] != null; })
    .map(function (r) {
      return {
        name: String(r[1]),
        score: Number(r[2]) || 0,
        total: Number(r[3]) || 0,
        at: r[0] instanceof Date ? r[0].getTime() : 0,
      };
    })
    .sort(function (a, b) {
      // Highest score wins; ties go to whoever got there first.
      return b.score - a.score || a.at - b.at;
    })
    .slice(0, LEADERBOARD_SIZE)
    .map(function (r) {
      return { name: r.name, score: r.score, total: r.total };
    });
}

// ===================================================================
//  HELPERS
// ===================================================================

function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    // insertSheet() drops the new tab at the active position, so say where.
    sheet = ss.insertSheet(name, ss.getNumSheets());
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateFolder_(name) {
  const existing = DriveApp.getFoldersByName(name);
  return existing.hasNext() ? existing.next() : DriveApp.createFolder(name);
}

// Prevent Sheets from treating entries like "+1 …" or "=hi" as formulas.
function safeText_(value) {
  const v = value == null ? "" : String(value);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
