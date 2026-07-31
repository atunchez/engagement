// ===================================================================
//  LEADERBOARD
//  Guests reach this from the tab bar on their own phones. It also works on
//  a big screen if there is one — press F for fullscreen.
//
//  Refreshes every BOARD_POLL_MS, and stops entirely while the page is in a
//  background tab, so a phone left open all afternoon isn't polling for hours.
// ===================================================================

const bEl = {
  played: document.getElementById("played"),
  list: document.getElementById("list"),
  you: document.getElementById("you"),
  stats: document.getElementById("stats"),
  status: document.getElementById("status"),
  release: document.getElementById("release"),
};

const BOARD_ROWS = 10;

// Who's looking, so their own row can be marked. Written by quiz.js when they
// post a score; absent if they haven't played on this phone.
function me() {
  try {
    const saved = JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY) || "null");
    return saved && saved.name ? saved : null;
  } catch (err) {
    return null;
  }
}

let boardTimer = null;

function startBoard() {
  if (boardTimer) return;
  refresh();
  boardTimer = setInterval(refresh, BOARD_POLL_MS);
}

function stopBoard() {
  clearInterval(boardTimer);
  boardTimer = null;
}

if (!isConfigured()) {
  bEl.status.textContent = "config.js isn't filled in yet";
} else {
  startBoard();
  // No point polling a page nobody's looking at.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopBoard();
    else startBoard();
  });
}

async function refresh() {
  try {
    const [rows, answerRows, released] = await Promise.all([
      getLeaderboard(BOARD_ROWS),
      getAllAnswers(),
      getAnswersReleased(),
    ]);

    renderList(rows);
    renderStats(tallyAnswers(answerRows), answerRows.length);

    bEl.played.textContent =
      answerRows.length === 1
        ? "1 person has played"
        : answerRows.length + " people have played";

    bEl.release.textContent = released
      ? "answers released"
      : "answers still sealed";
    bEl.release.className = "board__release" + (released ? " is-open" : "");

    bEl.status.textContent = "live";
    bEl.status.classList.remove("is-error");
  } catch (err) {
    // Keep whatever's on screen — a blank TV is worse than slightly stale.
    bEl.status.textContent = "reconnecting…";
    bEl.status.classList.add("is-error");
  }
}

function renderList(rows) {
  if (!rows.length) return;

  bEl.list.innerHTML = "";

  const you = me();
  let marked = false;

  rows.forEach((row, i) => {
    const li = document.createElement("li");
    li.className = "board__row" + (i === 0 ? " is-first" : "");

    // Mark the viewer's own row — first match on name and score, so two
    // guests sharing a first name don't both light up.
    if (!marked && you && row.name === you.name && Number(row.score) === Number(you.score)) {
      li.classList.add("is-you");
      marked = true;
    }

    const rank = document.createElement("span");
    rank.className = "board__rank";
    rank.textContent = i + 1;

    const name = document.createElement("span");
    name.className = "board__name";
    name.textContent = row.name;

    const score = document.createElement("span");
    score.className = "board__score";
    score.textContent = row.score;

    li.append(rank, name, score);
    bEl.list.appendChild(li);
  });

  // If they played but didn't make the cut, still show them where they are.
  if (you && !marked) {
    bEl.you.textContent =
      "You scored " + you.score + " — not in the top " + BOARD_ROWS + " yet.";
    bEl.you.hidden = false;
  } else {
    bEl.you.hidden = true;
  }
}

// Which questions tripped people up. Showing the hit rate gives nothing
// away — it says how many got it right, never what the answer was.
function renderStats(tally, playerCount) {
  const entries = Object.keys(tally)
    .map((k) => {
      const q = Number(k);
      const t = tally[k];
      return {
        q: q,
        question: QUESTIONS[q] ? QUESTIONS[q].question : "Question " + (q + 1),
        rate: t.total ? t.right / t.total : 0,
        right: t.right,
        total: t.total,
      };
    })
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5);

  if (!entries.length || !playerCount) return;

  bEl.stats.innerHTML = "";

  entries.forEach((e) => {
    const wrap = document.createElement("div");
    wrap.className = "board__stat";

    const label = document.createElement("p");
    label.className = "board__stat-q";
    label.textContent = e.question;

    const bar = document.createElement("div");
    bar.className = "board__bar";
    const fill = document.createElement("span");
    fill.style.width = Math.round(e.rate * 100) + "%";
    bar.appendChild(fill);

    const count = document.createElement("p");
    count.className = "board__stat-n";
    count.textContent =
      e.right === 0
        ? "nobody got this one"
        : e.right + " of " + e.total + " got it (" + Math.round(e.rate * 100) + "%)";

    wrap.append(label, bar, count);
    bEl.stats.appendChild(wrap);
  });
}

// F for fullscreen — easier than hunting through browser menus at a party.
document.addEventListener("keydown", (e) => {
  if (e.key !== "f" && e.key !== "F") return;
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen();
});
