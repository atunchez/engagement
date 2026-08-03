// ===================================================================
//  QUIZ ENGINE
//  Questions live in quiz-data.js. Keys and tunables live in config.js.
//  Network calls live in api.js.
//
//  Answers stay hidden until Alex flips `answers_released` in the Supabase
//  dashboard. Until then a guest sees "Locked in" and, at the end, their
//  score but not which ones they missed. Their picks are kept in this
//  browser, so once the answers drop they can see exactly what they got
//  wrong — with the stories attached.
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
  resumeBtn: document.getElementById("resumeBtn"),
  progressFill: document.getElementById("progressFill"),
  progressText: document.getElementById("progressText"),
  question: document.getElementById("questionText"),
  askPhotos: document.getElementById("askPhotos"),
  options: document.getElementById("options"),
  orderList: document.getElementById("orderList"),
  checkOrderBtn: document.getElementById("checkOrderBtn"),
  feedback: document.getElementById("feedback"),
  verdict: document.getElementById("verdict"),
  note: document.getElementById("note"),
  feedbackPhotos: document.getElementById("feedbackPhotos"),
  nextBtn: document.getElementById("nextBtn"),
  scoreLine: document.getElementById("scoreLine"),
  tierLabel: document.getElementById("tierLabel"),
  tierBlurb: document.getElementById("tierBlurb"),
  scoreForm: document.getElementById("scoreForm"),
  scoreStatus: document.getElementById("scoreStatus"),
  replayBtn: document.getElementById("replayBtn"),
  pending: document.getElementById("pending"),
  revealBtn: document.getElementById("revealBtn"),
  review: document.getElementById("review"),
  leaderboard: document.getElementById("leaderboard"),
  leaderboardList: document.getElementById("leaderboardList"),
};

let index = 0;
let score = 0;
let displayOrder = [];   // for "order" questions: item indices as shown
let detail = [];         // full per-question record, kept in this browser only
let answersReleased = false;
let releaseTimer = null;
let myName = "";         // whatever they posted under, for highlighting

el.title.textContent = QUIZ_TITLE;
el.intro.textContent = QUIZ_INTRO;

boot();

async function boot() {
  answersReleased = await resolveRelease();

  // Someone coming back after the answers dropped.
  const saved = loadSaved();
  if (saved) {
    el.resumeBtn.hidden = false;
    el.resumeBtn.textContent = answersReleased
      ? "See how you did"
      : "See your score";
  }
}

// Withheld by default: if the switch can't be read, don't leak answers.
async function resolveRelease() {
  // ?reveal=1 / ?reveal=0 previews either state without touching the
  // database — but ONLY when running locally. On the real site a guest could
  // otherwise unseal the answers just by editing the address bar.
  if (isLocalPreview()) {
    const override = new URLSearchParams(location.search).get("reveal");
    if (override === "1") return true;
    if (override === "0") return false;
  }

  // Local preview before Supabase is set up — show everything.
  if (!isConfigured()) return true;

  try {
    return await getAnswersReleased();
  } catch (err) {
    return false;
  }
}

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

// ===== QUESTIONS =====

function render() {
  const q = QUESTIONS[index];

  el.progressFill.style.width = ((index + 1) / QUESTIONS.length) * 100 + "%";
  el.progressText.textContent = `Question ${index + 1} of ${QUESTIONS.length}`;
  el.question.textContent = q.question;
  renderAskPhotos(q);

  el.feedback.hidden = true;
  el.options.innerHTML = "";
  el.orderList.innerHTML = "";

  if (q.type === "order") {
    el.options.hidden = true;
    el.orderList.hidden = false;
    el.checkOrderBtn.hidden = false;
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
  // Shuffled every time, so the correct answer's position in quiz-data.js
  // can't be used as a tell. Each button remembers which option it really is.
  shuffled(q.options.length).forEach((optIdx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.textContent = q.options[optIdx];
    btn.dataset.opt = optIdx;
    btn.addEventListener("click", () => answerChoice(q, optIdx));
    el.options.appendChild(btn);
  });
}

function answerChoice(q, chosen) {
  const right = chosen === q.correct;
  if (right) score += POINTS_PER_Q;

  detail.push({ q: index, right: right, chosen: chosen });

  // Buttons are in shuffled order, so go by which option each one holds
  // rather than its position on screen.
  Array.from(el.options.children).forEach((btn) => {
    const optIdx = Number(btn.dataset.opt);
    btn.disabled = true;

    if (!answersReleased) {
      // Show only what they picked — no hint as to whether it's right.
      btn.classList.add(optIdx === chosen ? "is-locked" : "is-dimmed");
      return;
    }
    if (optIdx === q.correct) btn.classList.add("is-correct");
    else if (optIdx === chosen) btn.classList.add("is-wrong");
    else btn.classList.add("is-dimmed");
  });

  giveFeedback(right, right ? "Correct." : "Not quite.", q);
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
      if (answersReleased) {
        row.classList.add(itemIdx === pos ? "is-correct" : "is-wrong");
      } else {
        row.classList.add("is-locked");
      }
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

  // Record the order they submitted, as item labels.
  detail.push({
    q: index,
    right: perfect,
    order: displayOrder.map((i) => q.items[i]),
  });

  el.checkOrderBtn.hidden = true;
  renderOrderRows(q, true);

  if (answersReleased && !perfect) {
    el.orderList.appendChild(realOrderLine(q));
  }

  giveFeedback(
    perfect,
    perfect ? "Perfect order." : `${rightSpots} of ${q.items.length} in the right spot.`,
    q
  );
}

function realOrderLine(q) {
  const p = document.createElement("p");
  p.className = "order__answer";
  p.innerHTML = "<strong>The real order:</strong> ";
  p.append(document.createTextNode(q.items.join(" → ")));
  return p;
}

// Builds a strip of one or two photos with an optional caption. Used for both
// kinds: askPhotos sit with the question and are always visible; answerPhotos
// belong to the reveal and stay hidden until the answers are released.
function photoStrip(paths, caption) {
  paths = paths || [];
  if (!paths.length) return null;

  const wrap = document.createElement("div");
  wrap.className = "shots" + (paths.length > 1 ? " shots--pair" : "");

  paths.forEach((entry) => {
    // An entry is either a plain path, or {src, caption} to caption just it.
    const src = typeof entry === "string" ? entry : entry.src;
    const own = typeof entry === "string" ? "" : entry.caption;

    const fig = document.createElement("figure");
    fig.className = "shots__shot";

    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.loading = "lazy";
    // A missing file shouldn't leave a broken icon in the middle of the story.
    img.addEventListener("error", () => fig.remove());

    fig.appendChild(img);

    if (own) {
      const cap = document.createElement("figcaption");
      cap.className = "shots__cap";
      cap.textContent = own;
      fig.appendChild(cap);
    }

    wrap.appendChild(fig);
  });

  if (caption) {
    const cap = document.createElement("figcaption");
    cap.className = "shots__caption";
    cap.textContent = caption;
    wrap.appendChild(cap);
  }

  return wrap;
}

// Shown with the question, sealed or not. Only put a photo here if it doesn't
// hand over the answer.
function renderAskPhotos(q) {
  el.askPhotos.innerHTML = "";
  el.askPhotos.hidden = true;

  const strip = photoStrip(q.askPhotos, q.askCaption);
  if (!strip) return;

  el.askPhotos.appendChild(strip);
  el.askPhotos.hidden = false;
}

function giveFeedback(right, verdict, q) {
  el.feedbackPhotos.innerHTML = "";
  el.feedbackPhotos.hidden = true;

  if (answersReleased) {
    el.verdict.textContent = verdict;
    el.verdict.className = "quiz__verdict " + (right ? "is-right" : "is-wrong");
    el.note.textContent = q.note || "";
    el.note.hidden = !q.note;

    const photos = photoStrip(q.answerPhotos, q.answerCaption);
    if (photos) {
      el.feedbackPhotos.appendChild(photos);
      el.feedbackPhotos.hidden = false;
    }
  } else {
    el.verdict.textContent = "Locked in.";
    el.verdict.className = "quiz__verdict is-locked";
    el.note.textContent = "";
    el.note.hidden = true;
  }

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
  save();
  showResult();
}

function showResult() {
  const percent = Math.round((score / TOTAL_POINTS) * 100);
  const tier =
    SCORE_TIERS.find((t) => percent >= t.min) || SCORE_TIERS[SCORE_TIERS.length - 1];

  el.scoreLine.innerHTML = "";
  el.scoreLine.append(document.createTextNode(String(score)));
  const outOf = document.createElement("small");
  outOf.textContent = " / " + TOTAL_POINTS;
  el.scoreLine.appendChild(outOf);

  el.tierLabel.textContent = tier.label;
  el.tierBlurb.textContent = tier.blurb;

  applyReleaseState();
  show("result");
}

// Called on the results screen, and again whenever the switch is polled.
function applyReleaseState() {
  el.pending.hidden = answersReleased;
  el.revealBtn.hidden = !answersReleased;

  if (answersReleased) {
    stopPolling();
  } else {
    startPolling();
  }
}

function startPolling() {
  if (releaseTimer || !isConfigured()) return;
  releaseTimer = setInterval(async () => {
    try {
      if (await getAnswersReleased()) {
        answersReleased = true;
        applyReleaseState();
      }
    } catch (err) {
      /* try again on the next tick */
    }
  }, RELEASE_POLL_MS);
}

function stopPolling() {
  clearInterval(releaseTimer);
  releaseTimer = null;
}

// ===== THE REVEAL =====

function renderReview() {
  const saved = loadSaved() || { detail: detail };
  const byQuestion = {};
  (saved.detail || []).forEach((d) => { byQuestion[d.q] = d; });

  el.review.innerHTML = "";

  const heading = document.createElement("h3");
  heading.textContent = "The answers";
  el.review.appendChild(heading);

  QUESTIONS.forEach((q, i) => {
    const d = byQuestion[i];

    const item = document.createElement("div");
    // No record means they never got to this one — neither right nor wrong.
    item.className =
      "review__item " + (!d ? "is-skipped" : d.right ? "is-right" : "is-wrong");

    const ask = document.createElement("p");
    ask.className = "review__q";
    ask.textContent = q.question;
    item.appendChild(ask);

    if (q.type === "order") {
      item.appendChild(
        reviewLine("You had", d && d.order ? d.order.join(" → ") : "—")
      );
      item.appendChild(reviewLine("Actually", q.items.join(" → ")));
    } else {
      item.appendChild(
        reviewLine(
          "You said",
          d && typeof d.chosen === "number" ? q.options[d.chosen] : "—"
        )
      );
      item.appendChild(reviewLine("Actually", q.options[q.correct]));
    }

    if (q.note) {
      const note = document.createElement("p");
      note.className = "review__note";
      note.textContent = q.note;
      item.appendChild(note);
    }

    const asked = photoStrip(q.askPhotos, q.askCaption);
    if (asked) item.appendChild(asked);

    const answered = photoStrip(q.answerPhotos, q.answerCaption);
    if (answered) item.appendChild(answered);

    el.review.appendChild(item);
  });

  el.review.hidden = false;
  el.review.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reviewLine(label, value) {
  const p = document.createElement("p");
  p.className = "review__line";
  const strong = document.createElement("strong");
  strong.textContent = label + ": ";
  p.append(strong, document.createTextNode(value));
  return p;
}

// ===== SAVING =====

function save() {
  try {
    localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({
        score: score,
        total: TOTAL_POINTS,
        detail: detail,
        // Set once they post, so the leaderboard can highlight their row.
        name: myName,
      })
    );
  } catch (err) {
    /* private browsing — the quiz still works, they just can't come back */
  }
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.total === TOTAL_POINTS ? parsed : null;
  } catch (err) {
    return null;
  }
}

// ===== POSTING THE SCORE =====

el.scoreForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Note: form.name is the form's own property, so reach for the field itself.
  const nameField = el.scoreForm.querySelector('input[name="name"]');
  const name = nameField.value.trim();
  if (!name) return;

  if (!isConfigured()) {
    el.scoreStatus.textContent =
      "Setup not finished — add your Supabase details in config.js.";
    el.scoreStatus.classList.add("error");
    return;
  }

  const submitBtn = el.scoreForm.querySelector(".form__submit");
  submitBtn.disabled = true;
  el.scoreStatus.classList.remove("error");
  el.scoreStatus.textContent = "Posting…";

  try {
    await postScore({
      name: name,
      score: score,
      total: TOTAL_POINTS,
      // Only whether each one was right — not what they picked.
      answers: detail.map((d) => ({ q: d.q, right: d.right })),
    });

    myName = name;
    save(); // remember the name too, so board.html can pick them out
    nameField.disabled = true;
    el.scoreStatus.textContent = "Posted. Go find us and argue about question 7.";
    loadLeaderboard(name);
  } catch (err) {
    el.scoreStatus.textContent = "Couldn't post your score — but you still played.";
    el.scoreStatus.classList.add("error");
    submitBtn.disabled = false;
  }
});

async function loadLeaderboard(you) {
  if (!isConfigured()) return;

  try {
    const rows = await getLeaderboard(10);
    if (!rows.length) return;

    el.leaderboardList.innerHTML = "";
    let youHighlighted = false;

    rows.forEach((row) => {
      const li = document.createElement("li");

      const nameEl = document.createElement("span");
      nameEl.textContent = row.name;

      const scoreEl = document.createElement("span");
      scoreEl.className = "lb__score";
      scoreEl.textContent = row.score + " / " + (row.total || TOTAL_POINTS);

      // Highlight the first row matching this player's name and score.
      if (!youHighlighted && you && row.name === you && Number(row.score) === score) {
        li.classList.add("is-you");
        youHighlighted = true;
      }

      li.append(nameEl, scoreEl);
      el.leaderboardList.appendChild(li);
    });

    el.leaderboard.hidden = false;
  } catch (err) {
    // The leaderboard is a nice-to-have; leave it hidden if it won't load.
  }
}

// ===== WIRING =====

el.startBtn.addEventListener("click", () => {
  index = 0;
  score = 0;
  detail = [];
  render();
  show("play");
});

el.resumeBtn.addEventListener("click", () => {
  const saved = loadSaved();
  if (!saved) return;
  score = saved.score;
  detail = saved.detail || [];
  showResult();
});

el.nextBtn.addEventListener("click", next);
el.checkOrderBtn.addEventListener("click", checkOrder);
el.revealBtn.addEventListener("click", renderReview);

el.replayBtn.addEventListener("click", () => {
  index = 0;
  score = 0;
  detail = [];
  el.scoreForm.reset();
  el.scoreForm.querySelector("input").disabled = false;
  el.scoreForm.querySelector(".form__submit").disabled = false;
  el.scoreStatus.textContent = "";
  el.scoreStatus.classList.remove("error");
  el.leaderboard.hidden = true;
  el.review.hidden = true;
  render();
  show("play");
});
