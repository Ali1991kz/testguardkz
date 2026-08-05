/* =========================================================
   TestGuard — script.js (ПИН-КОД ЖӘНЕ ПРОКТОРИНГ ҚОСЫЛҒАН)
   ========================================================= */

const CONFIG = {
  // ⚠️ Маңызды: Гугл Apps Script-тен алған сілтемеңіз
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwL7Xg4O1mTR_JhGkCUj4TXa6NywGPKjCA5nUtsHdx0X96wIGdLJ7vDZeqm_XKzR-OiVw/exec",
  MAX_FULLSCREEN_EXITS: 3,
  MAX_TAB_SWITCHES: 3,
  MAX_PRINTSCREEN_WARNINGS: 3,
  AUTOSAVE_KEY: "testguard_autosave_v1",
  DEVICE_TOKEN_KEY: "testguard_device_token_v1",
  OFFLINE_QUEUE_KEY: "testguard_offline_queue_v1",
  ENABLE_FACE_DETECTION: false
};

/* --- СҰРАҚТАР БАЗАСЫ (20 сұрақ) --- */
const TEST_DATA = {
  "testInfo": {
    "title": "Информатика. Тексеру жұмысы",
    "durationMinutes": 30,
    "shuffleQuestions": false,
    "shuffleAnswers": true,
    "questionsCount": 20
  },
  "questionBank": [
    // 1-ДЕҢГЕЙ: Оңай
    { "id": "q1", "question": "Ақпараттың ең кіші өлшем бірлігі қандай?", "answers": ["Бит", "Байт", "Мегабайт", "Пиксель"], "correctIndex": 0 },
    { "id": "q2", "question": "Компьютердің «миы» деп қай құрылғыны атайды?", "answers": ["Процессор", "Қатты диск", "Жедел жады", "Монитор"], "correctIndex": 0 },
    { "id": "q3", "question": "Ақпаратты шығару құрылғысын табыңыз.", "answers": ["Принтер", "Пернетақта", "Тышқан (Маус)", "Сканер"], "correctIndex": 0 },
    { "id": "q4", "question": "Пернетақта (Keyboard) қандай құрылғыға жатады?", "answers": ["Енгізу құрылғысы", "Шығару құрылғысы", "Сақтау құрылғысы", "Өңдеу құрылғысы"], "correctIndex": 0 },
    { "id": "q5", "question": "Өшірілген файлдар уақытша қайда сақталады?", "answers": ["Себетте (Корзина)", "Жұмыс үстелінде", "Құжаттарда", "Жедел жадыда"], "correctIndex": 0 },

    // 2-ДЕҢГЕЙ: Орташа
    { "id": "q6", "question": "Операциялық жүйені көрсетіңіз.", "answers": ["Windows", "Microsoft Word", "Google Chrome", "Python"], "correctIndex": 0 },
    { "id": "q7", "question": "Электрондық кестелермен жұмыс істеуге арналған бағдарламаны көрсетіңіз.", "answers": ["Microsoft Excel", "Microsoft Word", "MS Paint", "PowerPoint"], "correctIndex": 0 },
    { "id": "q8", "question": "1 Мегабайтта неше Килобайт бар?", "answers": ["1024", "1000", "8", "10"], "correctIndex": 0 },
    { "id": "q9", "question": "Компьютерді өшіргенде ақпарат қай жадыдан толық жойылады?", "answers": ["Жедел жадыдан (RAM)", "Қатты дискіден (HDD/SSD)", "Флешкадан", "Тұрақты жадыдан (ROM)"], "correctIndex": 0 },
    { "id": "q10", "question": "Браузер дегеніміз не?", "answers": ["Интернеттегі веб-парақшаларды көруге арналған бағдарлама", "Мәтін жазатын құрылғы", "Вирустарды жоятын бағдарлама", "Компьютердің жады"], "correctIndex": 0 },

    // 3-ДЕҢГЕЙ: Күрделірек
    { "id": "q11", "question": "Алгоритм дегеніміз не?", "answers": ["Іс-әрекеттің тізбектей орындалу реті", "Компьютердің құрылғысы", "Графикалық редактор", "Вирусқа қарсы бағдарлама"], "correctIndex": 0 },
    { "id": "q12", "question": "Дүниежүзілік ғаламтор желісіндегі веб-сайттардың мекенжайы көбінесе қандай хаттамадан басталады?", "answers": ["http / https", "www", "com", "html"], "correctIndex": 0 },
    { "id": "q13", "question": "LAN (Local Area Network) қандай желі түріне жатады?", "answers": ["Жергілікті желі", "Ауқымды желі", "Сымсыз желі", "Аймақтық желі"], "correctIndex": 0 },
    { "id": "q14", "question": "Мәтіндік құжаттардың кеңейтілімін (форматын) көрсетіңіз.", "answers": [".docx", ".mp3", ".jpg", ".avi"], "correctIndex": 0 },
    { "id": "q15", "question": "Ондық санау жүйесіндегі «10» саны екілік санау жүйесінде қалай жазылады?", "answers": ["1010", "1001", "1100", "1111"], "correctIndex": 0 },

    // 4-ДЕҢГЕЙ: Ең күрделі
    { "id": "q16", "question": "Python бағдарламалау тілінде экранға мәлімет шығару үшін қандай функция қолданылады?", "answers": ["print()", "input()", "echo()", "cout"], "correctIndex": 0 },
    { "id": "q17", "question": "Дерекқордағы (База данных) бір жазбаны бірегей түрде анықтайтын кілт қалай аталады?", "answers": ["Бастапқы кілт (Primary Key)", "Сыртқы кілт", "Қосымша кілт", "Индекс"], "correctIndex": 0 },
    { "id": "q18", "question": "HTML құжатында гиперсілтеме жасау үшін қай тег қолданылады?", "answers": ["<a>", "<img>", "<link>", "<href>"], "correctIndex": 0 },
    { "id": "q19", "question": "Ақпаратты шифрлаумен және қорғаумен айналысатын ғылым саласы:", "answers": ["Криптография", "Кибернетика", "Стеганография", "Топология"], "correctIndex": 0 },
    { "id": "q20", "question": "Компьютерлік желілерде құрылғыларды бірегей сәйкестендіру үшін қолданылатын 32 биттік мекенжай қалай аталады?", "answers": ["IPv4 мекенжайы", "MAC мекенжайы", "URL мекенжайы", "DNS мекенжайы"], "correctIndex": 0 }
  ]
};

const state = {
  student: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  startTime: null,
  durationSeconds: 30 * 60,
  remainingSeconds: 30 * 60,
  timerHandle: null,
  fullscreenExitCount: 0,
  tabSwitchCount: 0,
  printscreenCount: 0,
  devtoolsWarned: false,
  eventLog: [],
  submitted: false,
  cameraStream: null,
  screenStream: null
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function showScreen(id) {
  $$(".screen").forEach((el) => (el.style.display = "none"));
  const el = document.getElementById(id);
  if (el) el.style.display = "block";
}

/* --- БАПТАУЛАРДЫ ГУГЛ ТАБЛИЦАДАН ОҚУ --- */
async function fetchSettings() {
  if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.startsWith("PASTE_")) return null;
  try {
    const url = `${CONFIG.APPS_SCRIPT_URL}?action=getSettings`;
    const res = await fetch(url, { method: "GET" });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Баптауларды оқу қателігі:", err);
    return null;
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const fullName = $("#inputFullName").value.trim();
  const grade = $("#inputGrade").value.trim();
  const idLast4 = $("#inputIdLast4").value.trim();

  if (!fullName || !grade || !idLast4) {
    setLoginError("Барлық өрісті толтырыңыз.");
    return;
  }
  if (!/^\d{4}$/.test(idLast4)) {
    setLoginError("ID/ЖСН соңғы 4 саны тек цифрлардан тұруы керек.");
    return;
  }

  setLoginLoading(true);
  const studentKey = `${fullName.toLowerCase().replace(/\s+/g, "_")}_${grade}_${idLast4}`;

  // Оқушы бұрын тапсырған ба, соны тексереміз
  try {
    const already = await checkAlreadySubmitted(studentKey);
    if (already) {
      setLoginLoading(false);
      showScreen("screenAlreadySubmitted");
      return;
    }
  } catch (err) {
    logEvent("Google Sheets тексеру сәтсіз: " + err.message);
  }

  state.student = { fullName, grade, idLast4, key: studentKey };
  
  // startTest функциясын шақырамыз (ішінде ПИН-код пен Камера тексеріледі)
  startTest();
}

function setLoginError(msg) {
  const el = $("#loginError");
  if (el) {
    el.textContent = msg;
    el.style.display = msg ? "block" : "none";
  }
}

function setLoginLoading(isLoading) {
  const btn = $("#btnStartTest");
  if (btn) {
    btn.disabled = isLoading;
    btn.textContent = isLoading ? "Тексерілуде..." : "Тестті бастау";
  }
}

async function checkAlreadySubmitted(studentKey) {
  if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.startsWith("PASTE_")) return false;
  const url = `${CONFIG.APPS_SCRIPT_URL}?action=checkSubmission&key=${encodeURIComponent(studentKey)}`;
  const res = await fetch(url, { method: "GET" });
  const data = await res.json();
  return !!data.alreadySubmitted;
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadQuestions() {
  const data = TEST_DATA;
  state.durationSeconds = (data.testInfo.durationMinutes || 30) * 60;
  state.remainingSeconds = state.durationSeconds;

  let pool = data.questionBank.map((q) => ({ ...q }));
  if (data.testInfo.shuffleAnswers) {
    pool = pool.map((q) => {
      const order = shuffleArray(q.answers.map((_, i) => i));
      const newAnswers = order.map((i) => q.answers[i]);
      const newCorrectIndex = order.indexOf(q.correctIndex);
      return { ...q, answers: newAnswers, correctIndex: newCorrectIndex };
    });
  }
  if (data.testInfo.shuffleQuestions) {
    pool = shuffleArray(pool);
  }
  const count = data.testInfo.questionsCount || pool.length;
  state.questions = pool.slice(0, count);
}

function startTimer() {
  state.timerHandle = setInterval(() => {
    state.remainingSeconds--;
    renderTimer();
    autosave();
    if (state.remainingSeconds <= 0) {
      clearInterval(state.timerHandle);
      submitTest("timeout");
    }
  }, 1000);
}

function renderTimer() {
  const m = Math.floor(state.remainingSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(state.remainingSeconds % 60).toString().padStart(2, "0");
  const el = $("#timerDisplay");
  if (el) {
    el.textContent = `⏱ ${m}:${s}`;
    el.classList.toggle("warning", state.remainingSeconds <= 60);
  }
}

function renderProgress() {
  const pct = ((state.currentIndex + 1) / state.questions.length) * 100;
  if ($("#progressBar")) $("#progressBar").style.width = pct + "%";
  if ($("#questionCounter")) $("#questionCounter").textContent = `Сұрақ ${state.currentIndex + 1} / ${state.questions.length}`;
}

function renderQuestion() {
  const q = state.questions[state.currentIndex];
  if ($("#questionText")) $("#questionText").textContent = q.question;
  const list = $("#answerList");
  if (!list) return;
  list.innerHTML = "";
  q.answers.forEach((answer, idx) => {
    const div = document.createElement("div");
    div.className = "answer-option" + (state.answers[q.id] === idx ? " selected" : "");
    div.innerHTML = `<span class="bullet"></span><span>${answer}</span>`;
    div.addEventListener("click", () => selectAnswer(q.id, idx));
    list.appendChild(div);
  });
  renderProgress();
  if ($("#btnPrev")) $("#btnPrev").disabled = state.currentIndex === 0;
  if ($("#btnNext")) $("#btnNext").textContent = state.currentIndex === state.questions.length - 1 ? "Аяқтау" : "Келесі";
}

function selectAnswer(questionId, idx) {
  state.answers[questionId] = idx;
  autosave();
  renderQuestion();
}

function goNext() {
  if (state.currentIndex === state.questions.length - 1) {
    const unanswered = state.questions.filter((q) => state.answers[q.id] === undefined).length;
    if (confirm(unanswered > 0 ? `Сіз ${unanswered} сұраққа жауап бермедіңіз. Тестті аяқтауды растайсыз ба?` : "Тестті аяқтауды растайсыз ба?")) {
      submitTest("manual");
    }
  } else {
    state.currentIndex++;
    renderQuestion();
  }
}

function goPrev() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderQuestion();
  }
}

function logEvent(text) {
  state.eventLog.push({ time: new Date().toISOString(), text });
  autosave();
}

function showWarning(title, text, autoHideMs = 2500) {
  const overlay = $("#warningOverlay");
  if (!overlay) return;
  if ($("#warningTitle")) $("#warningTitle").textContent = title;
  if ($("#warningText")) $("#warningText").textContent = text;
  overlay.classList.add("show");
  if (autoHideMs) setTimeout(() => overlay.classList.remove("show"), autoHideMs);
}

function requestFullscreen() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (req) req.call(el).catch(() => {});
}

function setupFullscreenGuard() {
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && state.startTime && !state.submitted) {
      state.fullscreenExitCount++;
      logEvent(`Fullscreen режимінен шықты (${state.fullscreenExitCount}/${CONFIG.MAX_FULLSCREEN_EXITS})`);
      if (state.fullscreenExitCount >= CONFIG.MAX_FULLSCREEN_EXITS) {
        submitTest("fullscreen_violation");
      } else {
        showWarning("Fullscreen режимінен шықтыңыз!", `Бұл ${state.fullscreenExitCount}-рет.`);
        setTimeout(requestFullscreen, 600);
      }
    }
  });
}

function setupTabSwitchGuard() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.startTime && !state.submitted) registerTabSwitch("вкладка ауыстырылды");
  });
  window.addEventListener("blur", () => {
    if (state.startTime && !state.submitted) registerTabSwitch("терезе фокустан шықты");
  });
}

function registerTabSwitch(reason) {
  state.tabSwitchCount++;
  if (state.tabSwitchCount >= CONFIG.MAX_TAB_SWITCHES) {
    submitTest("tab_switch_violation");
  } else {
    showWarning("Басқа бетке өттіңіз!", `Бұл ${state.tabSwitchCount}-рет.`);
  }
}

function setupCopyProtection() {
  ["copy", "cut", "paste", "contextmenu"].forEach((evt) => {
    document.addEventListener(evt, (e) => {
      if (state.startTime && !state.submitted) e.preventDefault();
    });
  });
}

function autosave() {
  try {
    localStorage.setItem(CONFIG.AUTOSAVE_KEY, JSON.stringify(state));
  } catch (e) {}
}

function clearAutosave() {
  localStorage.removeItem(CONFIG.AUTOSAVE_KEY);
}

function computeResult() {
  let correct = 0;
  state.questions.forEach((q) => {
    if (state.answers[q.id] === q.correctIndex) correct++;
  });
  return { correct, wrong: state.questions.length - correct, total: state.questions.length, percent: Math.round((correct / state.questions.length) * 100) };
}

async function submitTest(reason) {
  if (state.submitted) return;
  state.submitted = true;
  clearInterval(state.timerHandle);
  
  if (state.cameraStream) state.cameraStream.getTracks().forEach((t) => t.stop());
  if (state.screenStream) state.screenStream.getTracks().forEach((t) => t.stop());

  const result = computeResult();
  const payload = {
    action: "submitResult",
    date: new Date().toLocaleDateString("kk-KZ"),
    time: new Date().toLocaleTimeString("kk-KZ"),
    fullName: state.student.fullName,
    grade: state.student.grade,
    idLast4: state.student.idLast4,
    studentKey: state.student.key,
    score: result.correct,
    percent: result.percent,
    correct: result.correct,
    wrong: result.wrong,
    total: result.total,
    durationSec: state.startTime ? Math.round((Date.now() - state.startTime) / 1000) : null,
    submitReason: reason
  };

  try {
    if (CONFIG.APPS_SCRIPT_URL && !CONFIG.APPS_SCRIPT_URL.startsWith("PASTE_")) {
      await fetch(CONFIG.APPS_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    }
  } catch (err) {}

  clearAutosave();
  showScreen("screenResult");
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  if ($("#resultScore")) $("#resultScore").textContent = `${result.correct} / ${result.total}`;
  if ($("#resultPercent")) $("#resultPercent").textContent = `${result.percent}%`;
  if ($("#resultCorrect")) $("#resultCorrect").textContent = result.correct;
  if ($("#resultWrong")) $("#resultWrong").textContent = result.wrong;
}

function renderReviewScreen() {
  const list = $("#reviewList");
  if (!list) return;
  list.innerHTML = "";
  
  state.questions.forEach((q, index) => {
    const studentAnsIdx = state.answers[q.id];
    const isCorrect = studentAnsIdx === q.correctIndex;
    const studentAnsText = studentAnsIdx !== undefined ? q.answers[studentAnsIdx] : "Жауап берілмеді";
    const correctAnsText = q.answers[q.correctIndex];

    const div = document.createElement("div");
    div.style.borderBottom = "1px solid #e2e8f0";
    div.style.paddingBottom = "12px";
    div.style.marginBottom = "12px";
    div.style.lineHeight = "1.5";

    let html = `<strong>Сұрақ ${index + 1}:</strong> ${q.question}<br>`;
    
    if (isCorrect) {
      html += `<span style="color: #16a34a; font-weight: bold;">✓ Сіздің жауабыңыз (Дұрыс): ${studentAnsText}</span>`;
    } else {
      html += `<span style="color: #ef4444; font-weight: bold;">✗ Сіздің жауабыңыз: ${studentAnsText}</span><br>`;
      html += `<span style="color: #16a34a; font-weight: bold;">✓ Дұрыс жауап: ${correctAnsText}</span>`;
    }
    
    div.innerHTML = html;
    list.appendChild(div);
  });
  
  showScreen("screenReview");
}

/* =========================================================
   1. ПИН-КОД ТЕКСЕРУ ЖӘНЕ 2. КАМЕРА/ЭКРАН БӨЛІСУ ФУНКЦИЯСЫ
   ========================================================= */
async function startTest() {
  // --- 1-БӨЛІМ: ГУГЛ КЕСТЕ СІЛТЕМЕСІ АРҚЫЛЫ ПИН-КОДТЫ ТЕКСЕРУ ---
  try {
    const settings = await fetchSettings();

    // Егер Гугл кестеде ПИН-код сақталған болса (бос болмаса):
    if (settings && settings.pin && settings.pin.toString().trim() !== "") {
      const userPin = prompt("🔑 Мұғалім берген ПИН-кодты енгізіңіз:");

      if (userPin === null) {
        setLoginLoading(false);
        return; // Оқушы бас тартса ("Отмена" басса)
      }

      if (userPin.trim() !== settings.pin.toString().trim()) {
        alert("❌ ПИН-код қате! Мұғалімнен дұрыс кодты сұраңыз.");
        setLoginLoading(false);
        return; // ПИН-код қате болса тест басталмайды
      }
    }

    // Егер мұғалім тест ұзақтығын (уақытты) өзгерткен болса:
    if (settings && settings.duration && !isNaN(settings.duration) && Number(settings.duration) > 0) {
      TEST_DATA.testInfo.durationMinutes = parseInt(settings.duration, 10);
    }

  } catch (err) {
    console.error("Баптауларды жүктеу қатесі:", err);
    alert("⚠️ Серверден ПИН-кодты тексеру мүмкін болмады. Интернетті тексеріңіз.");
    setLoginLoading(false);
    return;
  }

  // --- 2-БӨЛІМ: КАМЕРА ЖӘНЕ ЭКРАНДЫ БӨЛІСУ ТАЛАБЫ ---
  try {
    const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    state.cameraStream = camStream;
    if ($("#cameraPreviewVideo")) $("#cameraPreviewVideo").srcObject = camStream;
    if ($("#cameraPreview")) $("#cameraPreview").style.display = "block";
    
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    state.screenStream = screenStream;

    screenStream.getVideoTracks()[0].addEventListener('ended', () => {
      if (!state.submitted) {
        alert("Сіз экранды бөлісуді тоқтаттыңыз. Тест автоматты түрде аяқталды!");
        submitTest("screen_share_stopped");
      }
    });

  } catch (err) {
    alert("Ескерту: Тестті бастау үшін Камера мен Экранды бөлісуге рұқсат беру міндетті! Парақшаны жаңартып, қайта көріңіз.");
    setLoginLoading(false);
    return;
  }

  // --- 3-БӨЛІМ: ТЕСТТІ ІСКЕ ҚОСУ ---
  await loadQuestions();
  state.startTime = Date.now();
  showScreen("screenQuiz");
  requestFullscreen();
  startTimer();
  renderTimer();
  renderQuestion();
}

function init() {
  setupFullscreenGuard();
  setupTabSwitchGuard();
  setupCopyProtection();
  
  if ($("#loginForm")) $("#loginForm").addEventListener("submit", handleLoginSubmit);
  if ($("#btnNext")) $("#btnNext").addEventListener("click", goNext);
  if ($("#btnPrev")) $("#btnPrev").addEventListener("click", goPrev);
  if ($("#btnRestartInfo")) $("#btnRestartInfo").addEventListener("click", () => location.reload());
  
  const btnReview = $("#btnReviewMistakes");
  if (btnReview) btnReview.addEventListener("click", renderReviewScreen);
  
  const btnBack = $("#btnBackToResult");
  if (btnBack) btnBack.addEventListener("click", () => showScreen("screenResult"));
  
  showScreen("screenLogin");
}

document.addEventListener("DOMContentLoaded", init);
