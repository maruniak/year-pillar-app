// Year Pillar App — Step 1 (no build, pure JS)

const STEMS = [
  {code:"Jia", char:"甲", yinYang:"Yang", element:"Wood"},
  {code:"Yi",  char:"乙", yinYang:"Yin",  element:"Wood"},
  {code:"Bing",char:"丙", yinYang:"Yang", element:"Fire"},
  {code:"Ding",char:"丁", yinYang:"Yin",  element:"Fire"},
  {code:"Wu",  char:"戊", yinYang:"Yang", element:"Earth"},
  {code:"Ji",  char:"己", yinYang:"Yin",  element:"Earth"},
  {code:"Geng",char:"庚", yinYang:"Yang", element:"Metal"},
  {code:"Xin", char:"辛", yinYang:"Yin",  element:"Metal"},
  {code:"Ren", char:"壬", yinYang:"Yang", element:"Water"},
  {code:"Gui", char:"癸", yinYang:"Yin",  element:"Water"}
];

const BRANCHES = [
  {code:"Zi",   char:"子", animal:"Rat"},
  {code:"Chou", char:"丑", animal:"Ox"},
  {code:"Yin",  char:"寅", animal:"Tiger"},
  {code:"Mao",  char:"卯", animal:"Rabbit"},
  {code:"Chen", char:"辰", animal:"Dragon"},
  {code:"Si",   char:"巳", animal:"Snake"},
  {code:"Wu",   char:"午", animal:"Horse"},
  {code:"Wei",  char:"未", animal:"Goat"},
  {code:"Shen", char:"申", animal:"Monkey"},
  {code:"You",  char:"酉", animal:"Rooster"},
  {code:"Xu",   char:"戌", animal:"Dog"},
  {code:"Hai",  char:"亥", animal:"Pig"}
];

const TCM_PAIR = {
  "Wood":  ["LV","GB"],
  "Fire":  ["HT","SI"],
  "Earth": ["SP","ST"],
  "Metal": ["LU","LI"],
  "Water": ["KID","BL"]
};

const elBirthDate   = document.getElementById('birthDate');
const elBoundaryMode= document.getElementById('boundaryMode');
const elBoundaryDate= document.getElementById('boundaryDate');
const elBoundaryDateField = document.getElementById('boundaryDateField');
const elBoundaryHint = document.getElementById('boundaryHint');
const elBtnCalc = document.getElementById('btnCalc');

const elResultCard = document.getElementById('resultCard');
const elPillar  = document.getElementById('pillar');
const elYinYang = document.getElementById('yinYang');
const elElement = document.getElementById('element');
const elAnimal  = document.getElementById('animal');
const elCycle   = document.getElementById('cycleIndex');
const elTCM     = document.getElementById('tcm');
const elBoundaryUsed = document.getElementById('boundaryUsed');
const elJsonOut = document.getElementById('jsonOut');
const elBtnCopy = document.getElementById('btnCopy');

const elHistoryCard = document.getElementById('historyCard');
const elHistoryList = document.getElementById('historyList');
const elBtnClearHistory = document.getElementById('btnClearHistory');

function stripTime(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function parseDateInput(value) {
  if (!value) return null;
  const [y,m,d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m-1, d));
}

function defaultLiChunForYear(year) {
  // фиксированно 4 февраля
  return new Date(Date.UTC(year, 1, 4));
}

function getYearPillar(birthDate, mode, boundaryDateOpt) {
  const year = birthDate.getUTCFullYear();
  const boundaryDate = (mode === "LiChun")
    ? defaultLiChunForYear(year)
    : boundaryDateOpt;

  if (!boundaryDate) {
    throw new Error("Boundary date is required for the selected mode.");
  }

  const targetYear = (stripTime(birthDate) < stripTime(boundaryDate)) ? year - 1 : year;

  const cycleIndex  = ((targetYear - 1984) % 60 + 60) % 60 + 1;
  const stemIndex   = ((targetYear - 1984) % 10 + 10) % 10;
  const branchIndex = ((targetYear - 1984) % 12 + 12) % 12;

  const stem = STEMS[stemIndex];
  const branch = BRANCHES[branchIndex];
  const tcm = { element: stem.element, zangFuPair: TCM_PAIR[stem.element] };

  return { targetYear, cycleIndex, stem, branch, tcm, boundaryDate };
}

function updateBoundaryField() {
  const mode = elBoundaryMode.value;
  if (mode === "LiChun") {
    elBoundaryDateField.classList.add('hidden');
    elBoundaryDate.value = "";
    elBoundaryHint.textContent = "";
  } else if (mode === "CNY") {
    elBoundaryDateField.classList.remove('hidden');
    elBoundaryHint.textContent = "Введите дату Китайского Нового года для вашего календарного года рождения.";
  } else {
    elBoundaryDateField.classList.remove('hidden');
    elBoundaryHint.textContent = "Введите произвольную дату границы для выбранного календарного года рождения.";
  }
}

function addToHistory(entry) {
  const key = "yp_history";
  const arr = JSON.parse(localStorage.getItem(key) || "[]");
  arr.unshift(entry);
  const clipped = arr.slice(0,5);
  localStorage.setItem(key, JSON.stringify(clipped));
  renderHistory();
}

function renderHistory() {
  const key = "yp_history";
  const arr = JSON.parse(localStorage.getItem(key) || "[]");
  elHistoryList.innerHTML = "";
  if (!arr.length) {
    elHistoryCard.hidden = true;
    return;
  }
  elHistoryCard.hidden = false;
  for (const it of arr) {
    const li = document.createElement('li');
    li.textContent = `${it.input.birthDate} → ${it.pillarLabel} (граница: ${it.input.boundary.mode}${it.input.boundary.date ? " "+it.input.boundary.date : ""})`;
    elHistoryList.appendChild(li);
  }
}

elBoundaryMode.addEventListener('change', updateBoundaryField);
updateBoundaryField();
renderHistory();

elBtnCalc.addEventListener('click', () => {
  const birthDate = parseDateInput(elBirthDate.value);
  if (!birthDate) {
    alert("Укажите корректную дату рождения.");
    return;
  }
  const mode = elBoundaryMode.value;
  let boundaryDate = null;
  if (mode === "LiChun") {
    boundaryDate = defaultLiChunForYear(birthDate.getUTCFullYear());
  } else {
    boundaryDate = parseDateInput(elBoundaryDate.value);
    if (!boundaryDate) {
      alert("Укажите дату границы.");
      return;
    }
  }

  try {
    const res = getYearPillar(birthDate, mode, boundaryDate);
    const pillarLabel = `${res.stem.char}${res.branch.char} (${res.stem.code}-${res.branch.code})`;
    elPillar.textContent = pillarLabel;
    elYinYang.textContent = res.stem.yinYang;
    elElement.textContent = res.stem.element;
    elAnimal.textContent = res.branch.animal;
    elCycle.textContent = String(res.cycleIndex);
    elTCM.textContent = `${res.tcm.element} → ${res.tcm.zangFuPair.join("/")}`;
    elBoundaryUsed.textContent = `${mode} — ${res.boundaryDate.toISOString().slice(0,10)}`;

    const jsonObj = {
      input: {
        birthDate: elBirthDate.value,
        boundary: { mode, date: (mode === "LiChun" ? res.boundaryDate.toISOString().slice(0,10) : elBoundaryDate.value) }
      },
      computedYear: res.targetYear,
      cycleIndex: res.cycleIndex,
      stem: res.stem,
      branch: res.branch,
      tcm: res.tcm
    };
    elJsonOut.textContent = JSON.stringify(jsonObj, null, 2);
    elResultCard.hidden = false;

    addToHistory({ input: jsonObj.input, pillarLabel });
  } catch (e) {
    console.error(e);
    alert(e.message || "Ошибка расчёта.");
  }
});

elBtnCopy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(elJsonOut.textContent);
    elBtnCopy.textContent = "Скопировано!";
    setTimeout(() => elBtnCopy.textContent = "Скопировать JSON", 1200);
  } catch {
    alert("Не удалось скопировать в буфер.");
  }
});

elBtnClearHistory.addEventListener('click', () => {
  localStorage.removeItem("yp_history");
  renderHistory();
});
