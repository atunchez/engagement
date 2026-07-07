/**
 * Google Apps Script — receives RSVPs from the website and writes them
 * into this spreadsheet. Photos are saved to a Drive folder and linked.
 *
 * Setup instructions are in SETUP.md.
 */

// Name of the Drive folder where uploaded photos will be stored.
const PHOTO_FOLDER_NAME = "Engagement RSVP Photos";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Add a header row the first time.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", "First Name", "Last Name", "Attending", "Additional Guests", "Wishes", "Photo",
      ]);
    }

    let photoLink = "";
    if (data.photoData) {
      const folder = getOrCreatePhotoFolder_();
      const bytes = Utilities.base64Decode(data.photoData);
      const blob = Utilities.newBlob(
        bytes,
        data.photoType || "image/jpeg",
        (data.firstName || "guest") + "-" + (data.photoName || "photo")
      );
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      photoLink = file.getUrl();
    }

    sheet.appendRow([
      new Date(),
      data.firstName || "",
      data.lastName || "",
      data.attending || "",
      data.guests || "",
      data.wishes || "",
      photoLink,
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ result: "success" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreatePhotoFolder_() {
  const existing = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  return existing.hasNext() ? existing.next() : DriveApp.createFolder(PHOTO_FOLDER_NAME);
}
