/**
 * Google Apps Script — receives everything the website sends and files it
 * into this spreadsheet:
 *
 *   RSVPs        → the first sheet (unchanged)
 *   Quiz scores  → a "Quiz Scores" sheet
 *   Party photos → a "Party Photos" sheet, with the image saved to Drive
 *
 * It also answers GET /exec?action=leaderboard with the top quiz scores.
 *
 * Setup instructions are in SETUP.md. IMPORTANT: after editing this file you
 * must re-deploy — Deploy → Manage deployments → pencil → Version: New
 * version → Deploy. Otherwise the site keeps hitting the old code.
 */

// Drive folders for uploaded images.
const PHOTO_FOLDER_NAME = "Engagement RSVP Photos";
const PARTY_FOLDER_NAME = "Engagement Party Photos";

const QUIZ_SHEET = "Quiz Scores";
const PARTY_SHEET = "Party Photos";

const LEADERBOARD_SIZE = 10;

// ===================================================================
//  RECEIVING
// ===================================================================

function doPost(e) {
  // Guests all hit this at once at a party; serialise the appends so two
  // submissions can't land on the same row.
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const data = JSON.parse(e.postData.contents);

    switch (data.type) {
      case "quiz":
        saveQuizScore_(data);
        break;
      case "photo":
        savePartyPhoto_(data);
        break;
      default:
        saveRsvp_(data);
    }

    return json_({ result: "success" });
  } catch (err) {
    return json_({ result: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function saveRsvp_(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  // Add a header row the first time.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp", "First Name", "Last Name", "Attending", "Additional Guests", "Food Allergies", "Waymo Code", "Wishes", "Photo",
    ]);
  }

  let photoLink = "";
  if (data.photoData) {
    photoLink = savePhotoToDrive_(
      data.photoData,
      data.photoType,
      (data.firstName || "guest") + "-" + (data.photoName || "photo"),
      PHOTO_FOLDER_NAME
    );
  }

  sheet.appendRow([
    new Date(),
    safeText_(data.firstName),
    safeText_(data.lastName),
    safeText_(data.attending),
    safeText_(data.guests),
    safeText_(data.allergies),
    safeText_(data.waymo),
    safeText_(data.wishes),
    photoLink,
  ]);
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

function savePartyPhoto_(data) {
  const sheet = getOrCreateSheet_(PARTY_SHEET, ["Timestamp", "Name", "Photo"]);

  const who = (data.name || "guest").replace(/[^\w\- ]/g, "").trim() || "guest";
  const stamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd-HHmmss"
  );

  const photoLink = data.photoData
    ? savePhotoToDrive_(
        data.photoData,
        data.photoType,
        who + "-" + stamp + ".jpg",
        PARTY_FOLDER_NAME
      )
    : "";

  sheet.appendRow([new Date(), safeText_(data.name), photoLink]);
}

// ===================================================================
//  LEADERBOARD
// ===================================================================

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : "";

  if (action === "leaderboard") {
    return json_(leaderboard_());
  }

  return json_({ result: "ok" });
}

function leaderboard_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(QUIZ_SHEET);
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

function savePhotoToDrive_(base64, mimeType, filename, folderName) {
  const folder = getOrCreateFolder_(folderName);
  const bytes = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(bytes, mimeType || "image/jpeg", filename);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function getOrCreateFolder_(name) {
  const existing = DriveApp.getFoldersByName(name);
  return existing.hasNext() ? existing.next() : DriveApp.createFolder(name);
}

function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
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
