// ===================================================================
//  TV LEADERBOARD
//  Open board.html on a laptop, cast it to the TV, press F for fullscreen.
//  It refreshes itself every BOARD_POLL_MS and never needs touching.
// ===================================================================

const bEl = {
  played: document.getElementById("played"),
  list: document.getElementById("list"),
  stats: document.getElementById("stats"),
  status: document.getElementById("status"),
  release: document.getElementById("release"),
};

const BOARD_ROWS = 8;

if (!isConfigured()) {
  bEl.status.textContent = "config.js isn't filled in yet";
} else {
  refresh();
  setInterval(refresh, BOARD_POLL_MS);
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

  rows.forEach((row, i) => {
    const li = document.createElement("li");
    li.className = "board__row" + (i === 0 ? " is-first" : "");

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
