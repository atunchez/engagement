// ===================================================================
//  PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL BETWEEN THE QUOTES BELOW
//  (see SETUP.md, step 3). It looks like:
//  https://script.google.com/macros/s/AKfy..../exec
// ===================================================================
const RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycbwDLd3eaT5iMdo7cgOs1B8RPtrU7cSO2ktTY1G28qJkCToHwNX7aXH9-_WkfmH5ibyg/exec";

const form = document.getElementById("rsvp-form");
const status = document.getElementById("form-status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  status.classList.remove("error");

  if (RSVP_ENDPOINT.startsWith("PASTE")) {
    status.textContent = "Setup not finished — add your Web App URL in script.js.";
    status.classList.add("error");
    return;
  }

  const submitBtn = form.querySelector(".form__submit");
  submitBtn.disabled = true;
  status.textContent = "Sending…";

  try {
    const data = {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      attending: form.attending.value,
      guests: form.guests.value.trim(),
      allergies: form.allergies.value.trim(),
      wishes: form.wishes.value.trim(),
    };

    // text/plain avoids a CORS preflight, which Apps Script doesn't answer.
    await fetch(RSVP_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
    });

    // With no-cors we can't read the response, so we assume success.
    form.reset();
    status.textContent = "Thank you! Your RSVP has been received 💛";
  } catch (err) {
    status.textContent = "Something went wrong — please try again.";
    status.classList.add("error");
  } finally {
    submitBtn.disabled = false;
  }
});
