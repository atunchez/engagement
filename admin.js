// ===================================================================
//  ADMIN CONTROLS
//  Two switches, behind a Supabase Auth sign-in. No password lives in this
//  file — the sign-in is real, and the database only accepts changes from the
//  accounts listed in schema.sql.
// ===================================================================

const aScreens = {
  login: document.getElementById("screen-login"),
  panel: document.getElementById("screen-panel"),
};

const a = {
  loginForm: document.getElementById("loginForm"),
  loginStatus: document.getElementById("loginStatus"),
  who: document.getElementById("who"),
  answersState: document.getElementById("answersState"),
  answersHint: document.getElementById("answersHint"),
  answersBtn: document.getElementById("answersBtn"),
  collageState: document.getElementById("collageState"),
  collageHint: document.getElementById("collageHint"),
  collageBtn: document.getElementById("collageBtn"),
  panelStatus: document.getElementById("panelStatus"),
  signOutBtn: document.getElementById("signOutBtn"),
};

// What each switch means, in plain language, so there's no guessing at 9pm.
const COPY = {
  answers_released: {
    on: {
      state: "Released",
      hint: "Guests can see which ones they got wrong, with your stories.",
      action: "Seal them again",
    },
    off: {
      state: "Sealed",
      hint: "Guests get their score but not the answers. This is the starting state.",
      action: "Release the answers",
    },
  },
  collage_visible: {
    on: {
      state: "Up",
      hint: "The photo wall is showing on the camera page.",
      action: "Take the wall down",
    },
    off: {
      state: "Hidden",
      hint: "Photos are still being collected — they're just not displayed.",
      action: "Put the wall up",
    },
  },
};

showAdmin(loadSession() ? "panel" : "login");
if (loadSession()) refreshSwitches();

function showAdmin(name) {
  Object.values(aScreens).forEach((s) => s.classList.remove("is-active"));
  aScreens[name].classList.add("is-active");
}

function setStatusLine(el, message, isError) {
  el.textContent = message;
  el.classList.toggle("error", !!isError);
}

// ===== SIGN IN =====

a.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!isConfigured()) {
    setStatusLine(a.loginStatus, "config.js isn't filled in yet.", true);
    return;
  }

  const email = a.loginForm.querySelector('input[name="email"]').value.trim();
  const password = a.loginForm.querySelector('input[name="password"]').value;
  const submit = a.loginForm.querySelector(".form__submit");

  submit.disabled = true;
  setStatusLine(a.loginStatus, "Signing in…");

  try {
    await signIn(email, password);
    a.loginForm.reset();
    setStatusLine(a.loginStatus, "");
    showAdmin("panel");
    refreshSwitches();
  } catch (err) {
    setStatusLine(a.loginStatus, err.message, true);
  } finally {
    submit.disabled = false;
  }
});

a.signOutBtn.addEventListener("click", async () => {
  await signOut();
  showAdmin("login");
});

// ===== THE SWITCHES =====

async function refreshSwitches() {
  const session = loadSession();
  a.who.textContent = session && session.email ? "Signed in as " + session.email : "";

  setStatusLine(a.panelStatus, "Loading…");

  try {
    const s = await getSwitches();
    paint("answers_released", s.answers_released, a.answersState, a.answersHint, a.answersBtn);
    paint("collage_visible", s.collage_visible, a.collageState, a.collageHint, a.collageBtn);
    setStatusLine(a.panelStatus, "");
  } catch (err) {
    setStatusLine(a.panelStatus, err.message, true);
  }
}

function paint(field, value, stateEl, hintEl, btn) {
  const copy = COPY[field][value ? "on" : "off"];

  stateEl.textContent = copy.state;
  stateEl.className = "switch__state " + (value ? "is-on" : "is-off");
  hintEl.textContent = copy.hint;

  btn.textContent = copy.action;
  btn.disabled = false;
  btn.className = "switch__btn " + (value ? "is-on" : "is-off");

  // Replace the handler rather than stacking one up per refresh.
  btn.onclick = () => flip(field, !value, btn);
}

async function flip(field, next, btn) {
  btn.disabled = true;
  setStatusLine(a.panelStatus, "Saving…");

  try {
    await setSwitch(field, next);
    await refreshSwitches();
    setStatusLine(
      a.panelStatus,
      field === "answers_released"
        ? next
          ? "Answers released — guests see them within 20 seconds."
          : "Answers sealed again."
        : next
        ? "Wall is up."
        : "Wall is down."
    );
  } catch (err) {
    setStatusLine(a.panelStatus, err.message, true);
    // A dead session shouldn't leave them staring at a broken page.
    if (/sign in again|Not signed in/i.test(err.message)) {
      clearSession();
      showAdmin("login");
    } else {
      btn.disabled = false;
    }
  }
}
