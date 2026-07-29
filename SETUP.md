# Alex & Amanda Engagement Site — Setup

Everything here is **free**. Total time: about 15 minutes.

There are three parts:
1. Add your photos & party details
2. Connect the RSVP form to a Google Sheet
3. Put the site online

---

## 1. Add your photos & details

- Drop 4 nice photos of you two into the **`photos/`** folder, named
  `photo-1.jpg`, `photo-2.jpg`, `photo-3.jpg`, `photo-4.jpg`.
  (Any spot without a photo just shows a tasteful "Your photo here" placeholder.)
- Open **`index.html`** and edit the lines marked `TODO` to set your real
  **date, time, and location**.

---

## 2. Connect the RSVP form to a Google Sheet

1. Go to **[sheets.new](https://sheets.new)** to create a blank Google Sheet.
   Give it a name like "Engagement RSVPs".
2. In that Sheet's menu, click **Extensions → Apps Script**.
3. Delete whatever code is there, then **paste the entire contents of `Code.gs`**
   (the file in this folder) and click the **Save** (💾) icon.
4. Click **Deploy → New deployment**.
   - Click the gear ⚙️ next to "Select type" and choose **Web app**.
   - **Description:** anything (e.g. "RSVP receiver").
   - **Execute as:** *Me*.
   - **Who has access:** **Anyone**.  ← important
   - Click **Deploy**.
5. Google will ask you to **authorize** — click through, choose your account,
   click "Advanced" → "Go to (project) (unsafe)" → Allow. (This is normal for
   your own scripts.)
6. Copy the **Web app URL** it gives you (ends in `/exec`).
7. Open **`script.js`** and paste that URL between the quotes on the
   `RSVP_ENDPOINT` line, replacing `PASTE_YOUR_WEB_APP_URL_HERE`.

That's it — RSVPs will now appear as rows in your Sheet, and any uploaded
photos land in a Drive folder called "Engagement RSVP Photos" (linked in the Sheet).

> **If you ever edit `Code.gs` later**, you must re-deploy: **Deploy → Manage
> deployments → edit (pencil) → Version: New version → Deploy.**

---

## 3. Put the site online (Netlify — easiest)

1. Go to **[app.netlify.com/drop](https://app.netlify.com/drop)**.
2. Drag this whole **`engagement-site`** folder onto the page.
3. Done — it gives you a live link like `something-lovely.netlify.app`.
   Sign up (free) to keep it and rename the address.

You can later add a custom domain (like `alexandamanda.com`) from the Netlify
dashboard for ~$10–15/year if you want.

---

## Testing locally first (optional)

Just double-click `index.html` to preview the look in your browser. The RSVP
submit only works once the site is hosted (step 3) and the URL is set (step 2),
because browsers block the Google request from a local file.

---

## The party pages (quiz + disposable camera)

These live on the **`party-games`** branch and are **not** on `main` yet, so
nobody can play early. Two pages:

| Page | What it is |
| --- | --- |
| `quiz.html` | "How well do you know us?" — multiple choice plus drag-free timeline sorting, a score, and a leaderboard |
| `camera.html` | Guests take a photo, it gets developed to look like a disposable camera print, and it's sent to a Drive folder |

### Before the party — fill in the questions

Open **`quiz-data.js`**. Every `TODO` is a placeholder. For each question:

- `type: "choice"` → write the question and four options, and set `correct`
  to the index of the right one (**0** is the first option, **1** the second…).
- `type: "order"` → list `items` in the **correct** order, earliest first.
  The quiz shuffles them for the guest and gives partial credit.
- `note` is the line shown after they answer. That's where the story goes.
  Delete the line if a question doesn't need one.

Add or remove questions freely — the scoring adjusts to however many there are.

### Re-deploy the Apps Script (required — do this once)

`Code.gs` changed: it now also files quiz scores and party photos. Apps Script
keeps running the old code until you publish a new version:

**Extensions → Apps Script**, paste in the new `Code.gs`, Save, then
**Deploy → Manage deployments → pencil ✏️ → Version: New version → Deploy.**

You do *not* need a new URL — the existing one keeps working. Afterwards your
Sheet grows two new tabs (`Quiz Scores`, `Party Photos`) the first time each
one receives something.

> The Web App URL lives in **two** files now: `script.js` (RSVP) and
> `config.js` (quiz + camera). If you ever create a *new* deployment and the
> URL changes, update both.

### Previewing before it's live

```bash
cd engagement-site
python3 -m http.server 8000
```

Then open <http://localhost:8000/quiz.html>. Everything works, including
posting scores and photos (the RSVP/quiz/photo submits need `http://`, not a
double-clicked file). Test the camera page on your phone too — that's where
it'll actually be used.

### Going live on the day

```bash
git checkout main
git merge party-games
git push
```

GitHub Pages picks it up in a minute or two. That publishes the two pages plus
an **"At the Party"** section on the homepage that links to them.

### QR code for the tables

Point it at `https://atunchez.github.io/engagement/quiz.html` — the tab bar at
the top of the quiz carries people over to the camera, so one code is enough.
Any free QR generator works; print it big enough to scan from across a table.

---

## Quick troubleshooting

- **"Setup not finished" message** → you haven't pasted the Web App URL into `script.js`.
- **RSVP says thank you but nothing in the Sheet** → re-check step 2.4: "Who has
  access" must be **Anyone**, and make sure you deployed as a **Web app**.
- **Photos not saving** → the first submission with a photo triggers Drive
  authorization; make sure you completed step 2.5.
