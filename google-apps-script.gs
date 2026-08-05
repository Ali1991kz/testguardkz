/**
 * TestGuard — Google Apps Script backend
 * -----------------------------------------------------------
 * Бұл скрипт Google Sheets-пен байланыс орнатады:
 *   - Оқушының алдын ала тапсырғанын тексереді (checkSubmission)
 *   - Жаңа нәтижені сақтайды (submitResult)
 *   - Мұғалім панеліне барлық нәтижелерді қайтарады (getResults)
 *
 * Орнату нұсқаулығы README.md файлында толық берілген.
 */

const SHEET_NAME = "Results";

const COLUMNS = [
  "date", "time", "fullName", "grade", "idLast4", "studentKey",
  "score", "percent", "correct", "wrong", "total", "durationSec",
  "fullscreenExits", "tabSwitches", "printscreens", "copyAttempts",
  "devtoolsAttempts", "eventLog", "submitReason", "browser", "os", "device", "ip"
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/* ---------------- GET сұраныстары ---------------- */
function doGet(e) {
  const action = e.parameter.action;
  let result;

  if (action === "checkSubmission") {
    result = { alreadySubmitted: checkSubmission_(e.parameter.key) };
  } else if (action === "getResults") {
    result = { results: getAllResults_() };
  } else {
    result = { error: "Белгісіз action параметрі" };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- POST сұраныстары ---------------- */
function doPost(e) {
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOutput_({ error: "JSON парсинг қатесі" });
  }

  if (payload.action === "submitResult") {
    // Қайталап тапсыруды болдырмау үшін тағы да тексереміз
    if (checkSubmission_(payload.studentKey)) {
      return jsonOutput_({ status: "duplicate", message: "Бұл оқушы бұрын тапсырған" });
    }
    appendResult_(payload);
    return jsonOutput_({ status: "ok" });
  }

  return jsonOutput_({ error: "Белгісіз action параметрі" });
}

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- Көмекші функциялар ---------------- */
function checkSubmission_(studentKey) {
  if (!studentKey) return false;
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  const keyCol = COLUMNS.indexOf("studentKey");
  for (let i = 1; i < data.length; i++) {
    if (data[i][keyCol] === studentKey) return true;
  }
  return false;
}

function appendResult_(payload) {
  const sheet = getSheet_();
  const row = COLUMNS.map((col) => {
    if (col === "ip") return "—"; // Apps Script клиент IP-ін бермейді
    return payload[col] !== undefined ? payload[col] : "";
  });
  sheet.appendRow(row);
}

function getAllResults_() {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    COLUMNS.forEach((col, idx) => (obj[col] = data[i][idx]));
    rows.push(obj);
  }
  return rows;
}
