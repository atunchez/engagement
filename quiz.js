// ===================================================================
//  QUIZ ENGINE
//  You shouldn't need to edit this file — the questions live in
//  quiz-data.js and the endpoint lives in config.js.
// ===================================================================

const POINTS_PER_Q = 10;
const TOTAL_POINTS = POINTS_PER_Q * QUESTIONS.length;

const screens = {
  start: document.getElementById("screen-start"),
  play: document.getElementById("screen-play"),
  result: document.getElementById("screen-result"),
};

const el = {
  title: document.getElementById("quizTitle"),
  intro: document.getElementById("quizIntro"),
  startBtn: document.getElementById("startBtn"),
  progressFill: document.getElementById("progressFill"),
  progressText: document.getElementById("progressText"),
  question: document.getElementById("questionText"),
  options: document.getElementById("options"),
  orderList: document.getElementById("orderList"),
  checkOrderBtn: document.getElementById("checkOrderBtn"),
  feedback: document.getElementById("feedback"),
  verdict: document.getElementById("verdict"),
  note: document.getElementById("note"),
  nextBtn: document.getElementById("nextBtn"),
  scoreLine: document.getElementById("scoreLine"),
  tierLabel: document.getElementById("tierLabel"),
  tierBlurb: document.getElementById("tierBlurb"),
  scoreForm: document.getElementById("scoreForm"),
  scoreStatus: document.getElementById("scoreStatus"),
  replayBtn: document.getElementById("replayBtn"),
  leaderboard: document.getElementById("leaderboard"),
  leaderboardList: document.getElementById("leaderboardList"),
};

let index = 0;
let score = 0;
let displayOrder = []; // for "order" questions: item indices as shown

el.title.textContent = QUIZ_TITLE;
el.intro.textContent = QUIZ_INTRO;

function show(name) {
  Object.values(screens).forEach((s) => s.classList.remove("is-active"));
  screens[name].classList.add("is-active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function shuffled(length) {
  const a = Array.from({ length }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Never hand someone the answer already sorted.
  const isSorted = a.every((v, i) => v === i);
  return isSorted && length > 1 ? shuffled(length) : a;
}

// ===== QUESTION RENDERING =====

function render() {
  const q = QUESTIONS[index];

  el.progressFill.style.width = ((index + 1) / QUESTIONS.length) * 100 + "%";
  el.progressText.textContent = `Question ${index + 1} of ${QUESTIONS.length}`;
  el.question.textContent = q.question;

  el.feedback.hidden = true;
  el.options.innerHTML = "";
  el.orderList.innerHTML = "";

  if (q.type === "order") {
    el.options.hidden = true;
    el.orderList.hidden = false;
    el.checkOrderBtn.hidden = false;
    el.checkOrderBtn.disabled = false;
    displayOrder = shuffled(q.items.length);
    renderOrderRows(q, false);
  } else {
    el.options.hidden = false;
    el.orderList.hidden = true;
    el.checkOrderBtn.hidden = true;
    renderChoices(q);
  }
}

function renderChoices(q) {
  q.options.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.textContent = text;
    btn.addEventListener("click", () => answerChoice(q, i));
    el.options.appendChild(btn);
  });
}

function answerChoice(q, chosen) {
  const right = chosen === q.correct;
  if (right) score += POINTS_PER_Q;

  Array.from(el.options.children).forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct) btn.classList.add("is-correct");
    else if (i === chosen) btn.classList.add("is-wrong");
    else btn.classList.add("is-dimmed");
  });

  giveFeedback(right, right ? "Correct." : "Not quite.", q.note);
}

function renderOrderRows(q, locked) {
  el.orderList.innerHTML = "";

  displayOrder.forEach((itemIdx, pos) => {
    const row = document.createElement("div");
    row.className = "order__row";

    const num = document.createElement("span");
    num.className = "order__num";
    num.textContent = pos + 1;

    const label = document.createElement("span");
    label.className = "order__label";
    label.textContent = q.items[itemIdx];

    row.append(num, label);

    if (locked) {
      row.classList.add(itemIdx === pos ? "is-correct" : "is-wrong");
    } else {
      const ctrls = document.createElement("span");
      ctrls.className = "order__ctrls";
      ctrls.append(
        moveButton(q, pos, -1, "▲", "Move up", pos === 0),
        moveButton(q, pos, 1, "▼", "Move down", pos === displayOrder.length - 1)
      );
      row.appendChild(ctrls);
    }

    el.orderList.appendChild(row);
  });
}

function moveButton(q, pos, dir, glyph, label, disabled) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "order__btn";
  b.textContent = glyph;
  b.setAttribute("aria-label", label);
  b.disabled = disabled;
  b.addEventListener("click", () => {
    const to = pos + dir;
    [displayOrder[pos], displayOrder[to]] = [displayOrder[to], displayOrder[pos]];
    renderOrderRows(q, false);
  });
  return b;
}

function checkOrder() {
  const q = QUESTIONS[index];
  const rightSpots = displayOrder.filter((itemIdx, pos) => itemIdx === pos).length;
  const perfect = rightSpots === q.items.length;

  score += Math.round((POINTS_PER_Q * rightSpots) / q.items.length);

  el.checkOrderBtn.hidden = true;
  renderOrderRows(q, true);

  if (!perfect) {
    const answer = document.createElement("p");
    answer.className = "order__answer";
    answer.innerHTML = "<strong>The real order:</strong> ";
    answer.append(document.createTextNode(q.items.join(" → ")));
    el.orderList.appendChild(answer);
  }

  giveFeedback(
    perfect,
    perfect
      ? "Perfect order."
      : `${rightSpots} of ${q.items.length} in the right spot.`,
    q.note
  );
}

function giveFeedback(right, verdict, note) {
  el.verdict.textContent = verdict;
  el.verdict.className = "quiz__verdict " + (right ? "is-right" : "is-wrong");
  el.note.textContent = note || "";
  el.note.hidden = !note;
  el.feedback.hidden = false;
  el.nextBtn.textContent = index === QUESTIONS.length - 1 ? "See my score" : "Next";
}

function next() {
  index++;
  if (index >= QUESTIONS.length) finish();
  else render();
}

// ===== RESULTS =====

function finish() {
  const percent = Math.round((score / TOTAL_POINTS) * 100);
  const tier = SCORE_TIERS.find((t) => percent >= t.min) || SCORE_TIERS[SCORE_TIERS.length - 1];

  el.scoreLine.innerHTML = "";
  el.scoreLine.append(document.createTextNode(String(score)));
  const outOf = document.createElement("small");
  outOf.textContent = " / " + TOTAL_POINTS;
  el.scoreLine.appendChild(outOf);

  el.tierLabel.textContent = tier.label;
  el.tierBlurb.textContent = tier.blurb;

  show("result");
}

el.scoreForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Note: form.name is the form's own property, so reach for the field itself.
  const nameField = el.scoreForm.querySelector('input[name="name"]');
  const name = nameField.value.trim();
  if (!name) return;

  const endpoint = partyEndpoint();
  if (!endpoint) {
    el.scoreStatus.textContent =
      "Setup not finished — add the party Web App URL in config.js.";
    el.scoreStatus.classList.add("error");
    return;
  }

  const submitBtn = el.scoreForm.querySelector(".form__submit");
  submitBtn.disabled = true;
  el.scoreStatus.classList.remove("error");
  el.scoreStatus.textContent = "Posting…";

  try {
    // text/plain avoids a CORS preflight, which Apps Script doesn't answer.
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        type: "quiz",
        name: name,
        score: score,
        total: TOTAL_POINTS,
        percent: Math.round((score / TOTAL_POINTS) * 100),
      }),
    });

    el.scoreForm.querySelector("input").disabled = true;
    el.scoreStatus.textContent = "Posted. Go find us and argue about question 7.";

    if (SHOW_LEADERBOARD) {
      // Give the Sheet a moment to record the row before we read it back.
      setTimeout(() => loadLeaderboard(name), 1500);
    }
  } catch (err) {
    el.scoreStatus.textContent = "Couldn't post your score — but you still played.";
    el.scoreStatus.classList.add("error");
    submitBtn.disabled = false;
  }
});

async function loadLeaderboard(you) {
  const endpoint = partyEndpoint();
  if (!endpoint) return;

  try {
    const res = await fetch(endpoint + "?action=leaderboard");
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) return;

    el.leaderboardList.innerHTML = "";
    let youHighlighted = false;

    rows.slice(0, 10).forEach((row) => {
      const li = document.createElement("li");

      const nameEl = document.createElement("span");
      nameEl.textContent = row.name;

      const scoreEl = document.createElement("span");
      scoreEl.className = "lb__score";
      scoreEl.textContent = row.score + " / " + (row.total || TOTAL_POINTS);

      // Highlight the first row that matches this player's name and score.
      if (!youHighlighted && you && row.name === you && Number(row.score) === score) {
        li.classList.add("is-you");
        youHighlighted = true;
      }

      li.append(nameEl, scoreEl);
      el.leaderboardList.appendChild(li);
    });

    el.leaderboard.hidden = false;
  } catch (err) {
    // Leaderboard is a nice-to-have; if it can't load, just leave it hidden.
  }
}

// ===== WIRING =====

el.startBtn.addEventListener("click", () => {
  index = 0;
  score = 0;
  render();
  show("play");
});

el.nextBtn.addEventListener("click", next);
el.checkOrderBtn.addEventListener("click", checkOrder);

el.replayBtn.addEventListener("click", () => {
  index = 0;
  score = 0;
  el.scoreForm.reset();
  el.scoreForm.querySelector("input").disabled = false;
  el.scoreForm.querySelector(".form__submit").disabled = false;
  el.scoreStatus.textContent = "";
  el.leaderboard.hidden = true;
  render();
  show("play");
});
