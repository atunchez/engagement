// ===================================================================
//  Reveals the "At the Party" section on the homepage once the games are
//  switched on, so going live on the day is a toggle rather than a deploy.
//
//  Deliberately tiny and standalone: the RSVP page shouldn't depend on the
//  party pages' code, and if this fails for any reason the section simply
//  stays hidden.
// ===================================================================

(function () {
  const section = document.getElementById("party");
  if (!section || typeof isConfigured !== "function" || !isConfigured()) return;

  fetch(SUPABASE_URL + "/rest/v1/settings?select=games_live&id=eq.1", {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + SUPABASE_ANON_KEY,
    },
  })
    .then((res) => (res.ok ? res.json() : []))
    .then((rows) => {
      if (rows.length && rows[0].games_live === true) section.hidden = false;
    })
    .catch(() => {
      /* leave it hidden */
    });
})();
