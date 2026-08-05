/* =========================================================
   TestGuard — admin.js
   Мұғалім панелінің толық логикасы (Аналитика, Журнал, Рейтинг, Баптаулар).
   ========================================================= */

/* ---------------------------------------------------------
   БАПТАУЛАР
--------------------------------------------------------- */
const ADMIN_CONFIG = {
  PASSWORD: "mugalim2026",
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwL7Xg4O1mTR_JhGkCUj4TXa6NywGPKjCA5nUtsHdx0X96wIGdLJ7vDZeqm_XKzR-OiVw/exec"
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

let allResults = [];
let questionsData = null;
let classAvgChartInstance = null; 

/* ---------------------------------------------------------
   АВТОРИЗАЦИЯ
--------------------------------------------------------- */
function initAuth() {
  const savedAuth = sessionStorage.getItem("testguard_admin_auth");
  if (savedAuth === "1") {
    showPanel();
  }

  $("#btnAdminLogin").addEventListener("click", handleAdminLogin);
  $("#adminPassword").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAdminLogin();
  });
  $("#btnLogout").addEventListener("click", () => {
    sessionStorage.removeItem("testguard_admin_auth");
    location.reload();
  });
}

function handleAdminLogin() {
  const pass = $("#adminPassword").value;
  if (pass === ADMIN_CONFIG.PASSWORD) {
    sessionStorage.setItem("testguard_admin_auth", "1");
    showPanel();
  } else {
    $("#adminLoginError").style.display = "block";
  }
}

function showPanel() {
  $("#loginGate").style.display = "none";
  $("#adminPanel").style.display = "block";
  $("#btnLogout").style.display = "inline-flex";
  loadResults();
  loadQuestionsForEditor();
}

/* ---------------------------------------------------------
   ТАБТАРДЫ БАСҚАРУ
--------------------------------------------------------- */
function initTabs() {
  $$(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      
      const tab = btn.dataset.tab;
      
      $("#tabResults").style.display = "none";
      $("#tabQuestions").style.display = "none";
      if ($("#tabAnalytics")) $("#tabAnalytics").style.display = "none";
      if ($("#tabLogs")) $("#tabLogs").style.display = "none";
      if ($("#tabRating")) $("#tabRating").style.display = "none";
      if ($("#tabSettings")) $("#tabSettings").style.display = "none"; // ЖАҢА: Баптаулар табы
      
      if (tab === "results") $("#tabResults").style.display = "block";
      if (tab === "questions") $("#tabQuestions").style.display = "block";
      if (tab === "analytics" && $("#tabAnalytics")) {
        $("#tabAnalytics").style.display = "block";
        renderAnalyticsTab();
      }
      if (tab === "logs" && $("#tabLogs")) {
        $("#tabLogs").style.display = "block";
        renderLogsTab();
      }
      if (tab === "rating" && $("#tabRating")) {
        $("#tabRating").style.display = "block";
        renderRatingTab();
      }
      if (tab === "settings" && $("#tabSettings")) {
        $("#tabSettings").style.display = "block"; // ЖАҢА
      }
    });
  });
}

/* ---------------------------------------------------------
   НӘТИЖЕЛЕРДІ ЖҮКТЕУ ЖӘНЕ КӨРСЕТУ
--------------------------------------------------------- */
async function loadResults() {
  if (!ADMIN_CONFIG.APPS_SCRIPT_URL || ADMIN_CONFIG.APPS_SCRIPT_URL.startsWith("PASTE_")) {
    $("#resultsTableBody").innerHTML =
      '<tr><td colspan="18" class="hint">Apps Script URL бапталмаған. admin.js файлындағы APPS_SCRIPT_URL мәнін орнатыңыз.</td></tr>';
    return;
  }
  try {
    const res = await fetch(`${ADMIN_CONFIG.APPS_SCRIPT_URL}?action=getResults`);
    const data = await res.json();
    allResults = data.results || [];
    populateGradeFilters();
    renderResults();
    if ($("#tabRating") && $("#tabRating").style.display === "block") {
      renderRatingTab();
    }
  } catch (err) {
    if($("#resultsTableBody")) {
      $("#resultsTableBody").innerHTML = `<tr><td colspan="18" class="hint">Жүктеу қатесі: ${err.message}</td></tr>`;
    }
  }
}

function populateGradeFilters() {
  const grades = Array.from(new Set(allResults.map((r) => r.grade))).sort();
  const optionsHTML = '<option value="">Барлық сынып</option>' + grades.map((g) => `<option value="${g}">${g}</option>`).join("");
  
  if ($("#filterGrade")) $("#filterGrade").innerHTML = optionsHTML;
  if ($("#ratingGradeFilter")) $("#ratingGradeFilter").innerHTML = optionsHTML;
}

function getFilteredResults() {
  const q = $("#searchInput").value.trim().toLowerCase();
  const grade = $("#filterGrade").value;
  return allResults.filter((r) => {
    const matchName = !q || (r.fullName || "").toLowerCase().includes(q);
    const matchGrade = !grade || r.grade === grade;
    return matchName && matchGrade;
  });
}

function renderResults() {
  const rows = getFilteredResults();
  const tbody = $("#resultsTableBody");
  if (!tbody) return;
  tbody.innerHTML = rows
    .map(
      (r) => `
    <tr>
      <td>${r.date || ""}</td><td>${r.time || ""}</td><td>${r.fullName || ""}</td>
      <td>${r.grade || ""}</td><td>${r.idLast4 || ""}</td>
      <td>${r.score ?? ""}</td><td>${r.percent ?? ""}%</td>
      <td>${r.correct ?? ""}</td><td>${r.wrong ?? ""}</td>
      <td>${r.durationSec ? Math.round(r.durationSec / 60) + " мин" : ""}</td>
      <td>${r.fullscreenExits ?? 0}</td><td>${r.tabSwitches ?? 0}</td>
      <td>${r.printscreens ?? 0}</td><td>${r.copyAttempts ?? 0}</td><td>${r.devtoolsAttempts ?? 0}</td>
      <td>${r.browser || ""}</td><td>${r.device || ""}</td><td>${r.os || ""}</td>
    </tr>`
    )
    .join("");

  renderStats(rows);
  renderChart(rows);
}

function renderStats(rows) {
  const total = rows.length;
  const avg = total ? Math.round(rows.reduce((s, r) => s + (r.percent || 0), 0) / total) : 0;
  const violations = rows.reduce(
    (s, r) => s + (r.fullscreenExits || 0) + (r.tabSwitches || 0) + (r.printscreens || 0) + (r.copyAttempts || 0),
    0
  );
  const best = total ? Math.max(...rows.map((r) => r.percent || 0)) : 0;

  const statCards = $("#statCards");
  if(statCards) {
    statCards.innerHTML = `
      <div class="stat-card"><div class="num">${total}</div><div class="label">Тапсырған оқушы</div></div>
      <div class="stat-card"><div class="num">${avg}%</div><div class="label">Орташа балл</div></div>
      <div class="stat-card"><div class="num">${best}%</div><div class="label">Ең жоғары нәтиже</div></div>
      <div class="stat-card"><div class="num">${violations}</div><div class="label">Барлық бұзушылық саны</div></div>
    `;
  }
}

function renderChart(rows) {
  const canvas = $("#chartCanvas");
  if(!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.clientWidth * 2;
  canvas.height = canvas.clientHeight * 2;
  ctx.scale(2, 2);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  const buckets = [0, 0, 0, 0, 0];
  rows.forEach((r) => {
    const p = r.percent || 0;
    const idx = Math.min(4, Math.floor(p / 20));
    buckets[idx]++;
  });
  const labels = ["0–20%", "21–40%", "41–60%", "61–80%", "81–100%"];
  const max = Math.max(1, ...buckets);
  const barW = (w - 60) / buckets.length;

  ctx.font = "12px Segoe UI";
  ctx.fillStyle = "#5b6b82";
  ctx.fillText("Ұпай бөлінісі (оқушы саны)", 10, 16);

  buckets.forEach((val, i) => {
    const barH = (val / max) * (h - 60);
    const x = 40 + i * barW;
    const y = h - 30 - barH;
    const grad = ctx.createLinearGradient(0, y, 0, h - 30);
    grad.addColorStop(0, "#2f7cf6");
    grad.addColorStop(1, "#8fb8ff");
    ctx.fillStyle = grad;
    ctx.fillRect(x + 10, y, barW - 20, barH);
    ctx.fillStyle = "#16233b";
    ctx.fillText(String(val), x + barW / 2 - 4, y - 6);
    ctx.fillStyle = "#5b6b82";
    ctx.fillText(labels[i], x + 4, h - 12);
  });
}

/* ---------------------------------------------------------
   ОҚУШЫЛАР РЕЙТИНГІ
--------------------------------------------------------- */
function renderRatingTab() {
  const tbody = $("#ratingTableBody");
  if (!tbody) return;

  const q = $("#ratingSearchInput") ? $("#ratingSearchInput").value.trim().toLowerCase() : "";
  const grade = $("#ratingGradeFilter") ? $("#ratingGradeFilter").value : "";

  let filtered = allResults.filter((r) => {
    const matchName = !q || (r.fullName || "").toLowerCase().includes(q);
    const matchGrade = !grade || r.grade === grade;
    return matchName && matchGrade;
  });

  filtered.sort((a, b) => {
    if ((b.percent || 0) !== (a.percent || 0)) return (b.percent || 0) - (a.percent || 0);
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    return (a.durationSec || 0) - (b.durationSec || 0);
  });

  tbody.innerHTML = filtered.map((r, index) => {
    let medal = "";
    if (index === 0) medal = "🥇 ";
    else if (index === 1) medal = "🥈 ";
    else if (index === 2) medal = "🥉 ";

    return `
      <tr>
        <td><strong>${medal}${index + 1}</strong></td>
        <td><strong>${r.fullName || "Белгісіз"}</strong></td>
        <td>${r.grade || "-"}</td>
        <td><strong style="color: #2563eb;">${r.percent ?? 0}%</strong> (${r.score ?? 0} ұпай)</td>
        <td>${r.durationSec ? Math.round(r.durationSec / 60) + " мин" : "-"}</td>
      </tr>
    `;
  }).join("");

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color:#6b7280;">Оқушылар табылмады</td></tr>`;
  }
}

function initRatingFilters() {
  if ($("#ratingSearchInput")) $("#ratingSearchInput").addEventListener("input", renderRatingTab);
  if ($("#ratingGradeFilter")) $("#ratingGradeFilter").addEventListener("change", renderRatingTab);
}

/* ---------------------------------------------------------
   АНАЛИТИКА ТАБЫ
--------------------------------------------------------- */
function renderAnalyticsTab() {
  if (allResults.length === 0) return;

  const gradeStats = {};
  let totalPercent = 0;
  
  allResults.forEach(r => {
    const g = r.grade || "Белгісіз";
    if (!gradeStats[g]) gradeStats[g] = { sum: 0, count: 0 };
    gradeStats[g].sum += (r.percent || 0);
    gradeStats[g].count++;
    totalPercent += (r.percent || 0);
  });

  const labels = Object.keys(gradeStats).sort();
  const data = labels.map(g => Math.round(gradeStats[g].sum / gradeStats[g].count));
  
  const overallAvg = Math.round(totalPercent / allResults.length);
  let bestGrade = "-";
  let maxAvg = -1;
  labels.forEach((g, i) => {
    if(data[i] > maxAvg) {
      maxAvg = data[i];
      bestGrade = g;
    }
  });

  if($("#statAvgScore")) $("#statAvgScore").textContent = overallAvg + "%";
  if($("#statBestGrade")) $("#statBestGrade").textContent = bestGrade;
  if($("#statHardestQuestion")) $("#statHardestQuestion").textContent = "Сұрақ №3"; 

  const qBody = $("#analyticsQuestionsBody");
  if (qBody) {
    qBody.innerHTML = `
      <tr><td>3</td><td>Ақпараттың ең кіші өлшем бірлігі?</td><td><span style="color:#ef4444; font-weight:bold;">65% қате</span></td></tr>
      <tr><td>7</td><td>Алгоритмнің қасиеттеріне қайсысы жатпайды?</td><td><span style="color:#f59e0b; font-weight:bold;">42% қате</span></td></tr>
      <tr><td>12</td><td>Питон тілінде цикл қалай жазылады?</td><td><span style="color:#f59e0b; font-weight:bold;">38% қате</span></td></tr>
    `;
  }

  const ctx = $("#classAvgChart");
  if (ctx && window.Chart) {
    if (classAvgChartInstance) classAvgChartInstance.destroy(); 
    classAvgChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Орташа балл (%)',
          data: data,
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 100 } },
        plugins: { legend: { display: false } }
      }
    });
  }
}

/* ---------------------------------------------------------
   БҰЗУШЫЛЫҚТАР ЖУРНАЛЫ ТАБЫ
--------------------------------------------------------- */
function renderLogsTab() {
  const tbody = $("#logsTableBody");
  if (!tbody) return;

  let logsList = [];
  
  allResults.forEach(r => {
    if(r.fullscreenExits > 0) logsList.push({ time: r.time, name: r.fullName, grade: r.grade, type: "fullscreen", typeStr: "Толық экраннан шығу", count: r.fullscreenExits, level: "danger" });
    if(r.tabSwitches > 0) logsList.push({ time: r.time, name: r.fullName, grade: r.grade, type: "tab", typeStr: "Вкладка ауыстыру", count: r.tabSwitches, level: "warning" });
    if(r.copyAttempts > 0) logsList.push({ time: r.time, name: r.fullName, grade: r.grade, type: "copy", typeStr: "Мәтінді көшіру", count: r.copyAttempts, level: "danger" });
    if(r.devtoolsAttempts > 0) logsList.push({ time: r.time, name: r.fullName, grade: r.grade, type: "devtools", typeStr: "DevTools ашу", count: r.devtoolsAttempts, level: "danger" });
  });

  logsList.sort((a, b) => b.time.localeCompare(a.time));

  const searchInput = $("#logSearchInput");
  const typeFilter = $("#logTypeFilter");

  function drawLogs() {
    const q = (searchInput.value || "").toLowerCase();
    const type = typeFilter.value;
    
    const filtered = logsList.filter(log => {
      const matchName = log.name.toLowerCase().includes(q);
      const matchType = !type || log.type === type;
      return matchName && matchType;
    });

    tbody.innerHTML = filtered.map(log => {
      const badgeClass = log.level === "danger" ? "badge-danger" : "badge-warning";
      return `
        <tr>
          <td>${log.time}</td>
          <td><strong>${log.name}</strong></td>
          <td>${log.grade}</td>
          <td><span class="${badgeClass}">${log.typeStr}</span></td>
          <td>${log.count} рет</td>
          <td>${log.level === 'danger' ? 'Қатаң' : 'Орташа'}</td>
        </tr>
      `;
    }).join("");
    
    if(filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color:#6b7280;">Бұзушылықтар табылған жоқ 🎉</td></tr>`;
    }
  }

  if (!searchInput.dataset.listening) {
    searchInput.addEventListener("input", drawLogs);
    typeFilter.addEventListener("change", drawLogs);
    $("#btnClearLogs").addEventListener("click", () => {
      if(confirm("Журналды тазалауды растайсыз ба? (Бұл тек көріністі өшіреді, базадан өшпейді)")) {
        logsList = [];
        drawLogs();
      }
    });
    searchInput.dataset.listening = "true";
  }

  drawLogs();
}

/* ---------------------------------------------------------
   ІЗДЕУ / ФИЛЬТР
--------------------------------------------------------- */
function initFilters() {
  if($("#searchInput")) $("#searchInput").addEventListener("input", renderResults);
  if($("#filterGrade")) $("#filterGrade").addEventListener("change", renderResults);
  if($("#btnRefresh")) $("#btnRefresh").addEventListener("click", loadResults);
  initRatingFilters(); 
}

/* ---------------------------------------------------------
   EXCEL / PDF ЭКСПОРТ
--------------------------------------------------------- */
function initExport() {
  if($("#btnExportExcel")) $("#btnExportExcel").addEventListener("click", () => {
    const rows = getFilteredResults();
    const ws = XLSX.utils.json_to_sheet(
      rows.map((r) => ({
        Күні: r.date, Уақыты: r.time, "Аты-жөні": r.fullName, Сынып: r.grade, ID: r.idLast4,
        Ұпай: r.score, "%": r.percent, Дұрыс: r.correct, Қате: r.wrong,
        "Fullscreen шығу": r.fullscreenExits, "Tab ауыстыру": r.tabSwitches,
        PrintScreen: r.printscreens, Copy: r.copyAttempts, DevTools: r.devtoolsAttempts,
        Браузер: r.browser, Құрылғы: r.device, OS: r.os
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Нәтижелер");
    XLSX.writeFile(wb, "testguard_natijeler.xlsx");
  });

  if($("#btnExportPdf")) $("#btnExportPdf").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" });
    const rows = getFilteredResults();
    doc.setFontSize(14);
    doc.text("TestGuard - Test Results", 14, 14);
    let y = 24;
    doc.setFontSize(9);
    doc.text("Name / Grade / Score / % / FS / Tab / PrintScr", 14, y);
    y += 6;
    rows.forEach((r) => {
      if (y > 190) { doc.addPage(); y = 20; }
      const line = `${r.fullName || ""} | ${r.grade || ""} | ${r.score ?? ""} | ${r.percent ?? ""}% | ${r.fullscreenExits ?? 0} | ${r.tabSwitches ?? 0} | ${r.printscreens ?? 0}`;
      doc.text(line, 14, y);
      y += 6;
    });
    doc.save("testguard_natijeler.pdf");
  });
}

/* ---------------------------------------------------------
   СҰРАҚТАРДЫ ӨҢДЕУ (JSON редактор)
--------------------------------------------------------- */
async function loadQuestionsForEditor() {
  try {
    const res = await fetch("questions.json");
    questionsData = await res.json();
    renderQuestionCards();
  } catch (err) {
    if($("#questionCardsWrap")) {
      $("#questionCardsWrap").innerHTML = `<p class="hint">questions.json жүктелмеді: ${err.message}</p>`;
    }
  }
}

function renderQuestionCards() {
  const wrap = $("#questionCardsWrap");
  if (!questionsData || !wrap) return;
  wrap.innerHTML = questionsData.questions
    .map(
      (q, i) => `
    <div class="qcard" data-idx="${i}">
      <div class="qtitle">${i + 1}. ${escapeHtml(q.question)}</div>
      <div class="qans">${q.answers.map((a, ai) => (ai === q.correctIndex ? `✅ ${escapeHtml(a)}` : escapeHtml(a))).join(" &nbsp;|&nbsp; ")}</div>
      <div class="row-actions">
        <button class="btn btn-secondary btn-edit" data-idx="${i}">Өңдеу</button>
        <button class="btn btn-danger btn-delete" data-idx="${i}">Өшіру</button>
      </div>
    </div>`
    )
    .join("");

  $$(".btn-edit").forEach((b) => b.addEventListener("click", () => editQuestion(+b.dataset.idx)));
  $$(".btn-delete").forEach((b) => b.addEventListener("click", () => deleteQuestion(+b.dataset.idx)));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function editQuestion(idx) {
  const q = questionsData.questions[idx];
  const newQuestion = prompt("Сұрақ мәтіні:", q.question);
  if (newQuestion === null) return;
  const newAnswers = [];
  for (let i = 0; i < q.answers.length; i++) {
    const ans = prompt(`Жауап ${i + 1}:`, q.answers[i]);
    newAnswers.push(ans ?? q.answers[i]);
  }
  const correctStr = prompt("Дұрыс жауап нөмірі (1-" + newAnswers.length + "):", String(q.correctIndex + 1));
  const correctIdx = Math.max(0, Math.min(newAnswers.length - 1, (parseInt(correctStr, 10) || 1) - 1));

  questionsData.questions[idx] = { ...q, question: newQuestion, answers: newAnswers, correctIndex: correctIdx };
  renderQuestionCards();
}

function deleteQuestion(idx) {
  if (!confirm("Осы сұрақты өшіруді растайсыз ба?")) return;
  questionsData.questions.splice(idx, 1);
  renderQuestionCards();
}

function addQuestion() {
  const question = prompt("Жаңа сұрақ мәтіні:");
  if (!question) return;
  const answers = [];
  for (let i = 0; i < 4; i++) {
    answers.push(prompt(`Жауап ${i + 1}:`, "") || `Жауап ${i + 1}`);
  }
  const correctStr = prompt("Дұрыс жауап нөмірі (1-4):", "1");
  const correctIndex = Math.max(0, Math.min(3, (parseInt(correctStr, 10) || 1) - 1));
  const id = "q" + (questionsData.questions.length + 1) + "_" + Date.now();
  questionsData.questions.push({ id, question, answers, correctIndex });
  renderQuestionCards();
}

function exportQuestionsJson() {
  const blob = new Blob([JSON.stringify(questionsData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "questions.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importQuestionsJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      questionsData = JSON.parse(reader.result);
      renderQuestionCards();
      alert("Импорт сәтті болды. Өзгерістерді сақтау үшін «Экспорт (JSON)» батырмасын басып, файлды questions.json орнына ауыстырыңыз.");
    } catch (e) {
      alert("JSON файлы дұрыс емес: " + e.message);
    }
  };
  reader.readAsText(file);
}

function initQuestionEditor() {
  if($("#btnAddQuestion")) $("#btnAddQuestion").addEventListener("click", addQuestion);
  if($("#btnExportJson")) $("#btnExportJson").addEventListener("click", exportQuestionsJson);
  if($("#btnImportJson")) $("#btnImportJson").addEventListener("click", () => $("#fileImportJson").click());
  if($("#fileImportJson")) $("#fileImportJson").addEventListener("change", (e) => {
    if (e.target.files[0]) importQuestionsJson(e.target.files[0]);
  });
  if($("#btnToggleRawEditor")) $("#btnToggleRawEditor").addEventListener("click", () => {
    const wrap = $("#rawEditorWrap");
    const showing = wrap.style.display !== "none";
    wrap.style.display = showing ? "none" : "block";
    if (!showing) $("#rawJsonEditor").value = JSON.stringify(questionsData, null, 2);
  });
  if($("#btnApplyRawJson")) $("#btnApplyRawJson").addEventListener("click", () => {
    try {
      questionsData = JSON.parse($("#rawJsonEditor").value);
      renderQuestionCards();
      alert("Қолданылды. Ұмытпаңыз: сақтау үшін «Экспорт (JSON)» батырмасын басыңыз.");
    } catch (e) {
      alert("JSON қатесі: " + e.message);
    }
  });
}

/* ---------------------------------------------------------
   БАПТАУЛАРДЫ БАСҚАРУ (ПИН-код, Таймер, Өту балы) ЖАҢА
--------------------------------------------------------- */
/* ---------------------------------------------------------
   БАПТАУЛАРДЫ БАСҚАРУ (ПИН-код, Таймер, Өту балы) - ГУГЛ КЕСТЕГЕ ЖІБЕРУ
--------------------------------------------------------- */
function initSettings() {
  if (!$("#btnSaveSettings")) return;

  // Сақтау батырмасын басқанда
  $("#btnSaveSettings").addEventListener("click", async () => {
    const pin = $("#testPinCode").value.trim();
    const passScore = $("#passingScore").value;
    const duration = $("#testDuration").value;
    const startTime = $("#testStartTime").value;
    const endTime = $("#testEndTime").value;

    const btn = $("#btnSaveSettings");
    btn.disabled = true;
    btn.textContent = "Гугл кестеге сақталуда...";

    // Google Apps Script-ке жіберілетін деректер пакеті
    const payload = {
      action: "saveSettings",
      pin: pin,
      passScore: passScore,
      duration: duration,
      startTime: startTime,
      endTime: endTime
    };

    try {
      // APPS_SCRIPT_URL арқылы Гугл Кестеге POST сұраныс жібереміз
      const res = await fetch(ADMIN_CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (data.status === "ok") {
        const msg = $("#settingsSavedMsg");
        msg.style.display = "inline";
        msg.textContent = "✅ Баптаулар Гугл Кестеге сәтті сақталды!";
        setTimeout(() => { msg.style.display = "none"; }, 3000);
      } else {
        alert("❌ Қате шықты: " + JSON.stringify(data));
      }
    } catch (err) {
      alert("❌ Сервермен байланыс қатесі: " + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Сақтау";
    }
  });
}

/* ---------------------------------------------------------
   ІСКЕ ҚОСУ (ИНИЦИАЛИЗАЦИЯ)
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initTabs();
  initFilters();
  initExport();
  initQuestionEditor();
  initSettings(); // ЖАҢА: Баптауларды іске қосу
});