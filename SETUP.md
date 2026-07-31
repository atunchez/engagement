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
| `camera.html` | Guests take a photo, it gets developed to look like a disposable camera print, and it's sent to your private album |
| `board.html` | For the TV, not for guests. Live leaderboard plus which questions people are getting wrong. Open it on a laptop, cast it, press **F** for fullscreen, leave it running. |

### Before the party — fill in the questions

Open **`quiz-data.js`**. Every `TODO` is a placeholder. For each question:

- `type: "choice"` → write the question and four options, and set `correct`
  to the index of the right one (**0** is the first option, **1** the second…).
- `type: "order"` → list `items` in the **correct** order, earliest first.
  The quiz shuffles them for the guest and gives partial credit.
- `note` is the line shown after they answer. That's where the story goes.
  Delete the line if a question doesn't need one.

Add or remove questions freely — the scoring adjusts to however many there are.

### Set up Supabase (required — about 10 minutes, once)

The party pages use **Supabase**, not Google Sheets. It's a free hosted
Postgres database with file storage and a real API — which is what a
leaderboard guests keep refreshing actually needs. Your RSVP form is untouched
and keeps using its own Sheet and Apps Script.

1. Sign up at **[supabase.com](https://supabase.com)** and create a project.
   Any region near you.
2. In the project: **SQL Editor → New query**. Paste the entire contents of
   **`schema.sql`** and click **Run**. That creates the `scores` table, the
   answer-release switch, and a private photo bucket — with access rules that
   let guests post a score and a photo and do nothing else.
3. **Project Settings → API**, and copy two values:
   - **Project URL** (`https://xxxx.supabase.co`)
   - the **anon / public** key
4. Open **`config.js`** and paste them over the two `PASTE_…` placeholders.

That's it — no deployments, no re-deployments.

> **The anon key is meant to be public.** It's safe in this repo and in the
> browser. What it's allowed to do is fixed by the policies in `schema.sql`.
> **Never** put the `service_role` key here — that one bypasses every policy.

> ### ⚠️ Check this the morning of the party
>
> Free-tier Supabase projects **pause after about a week of no activity**. If
> you set this up weeks ahead and don't touch it, it will likely be asleep by
> Aug 29.
>
> Nothing is lost — you click **Resume** and it's back in a minute or two — but
> don't find out while guests are standing there. **On the morning of the
> party:** open the dashboard, confirm the project is running, then load
> `quiz.html` and post a test score. Delete the test row afterwards in the
> Table Editor.

### Releasing the answers — your switch

Until you flip it, guests answer, see "Locked in", and get their final score
without learning *which* ones they missed. Their picks are saved in their own
browser, so the moment you release, they can pull up exactly what they got
wrong with your stories attached.

**To release, from your phone:** Supabase dashboard → **Table Editor** →
`settings` → the single row → set **`answers_released`** to **true** → save.

> **Don't delete that row.** It's the switch. If it goes missing, the quiz
> stays sealed forever — safe, but you lose the ability to release. To get it
> back, run this in the SQL Editor (or just re-run all of `schema.sql`):
>
> ```sql
> insert into settings (id, answers_released)
>   values (1, false)
>   on conflict (id) do nothing;
> ```

Open quiz pages pick it up within about 20 seconds. Anyone who plays after that
sees answers immediately, so it winds down gracefully.

There's deliberately no admin page for this — flipping it from the website
would mean putting a password in public JavaScript. The dashboard needs no
secret at all.

### Where the photos go

Every photo is stored **twice**, so nothing is lost to the filter:

| File | What it is |
| --- | --- |
| `<id>-film.jpg` | The developed version, ~400KB. Uploads first. |
| `<id>-original.heic` (or `.jpg`) | Exactly what came off their phone, unmodified. Uploaded in the background afterwards, so nobody waits on a 10MB file over brewery wifi. |

They share an `id`, so the pair always matches up.

1. The guest picks or shoots a photo.
2. `camera.js` shrinks a copy to 1600px, applies the film look, stamps the date.
3. Both versions upload to the **`party-photos`** bucket.
4. You view them at **Storage → party-photos** in the dashboard. The bucket is
   **private** — guests can add photos but cannot browse anyone else's, and
   there are no public links.
5. "Save to my phone" is a plain local download and touches no server.

If the original fails to upload, or is over the 20MB cap in `camera.js`, the
guest never sees an error — they've already been thanked and the film version
is safely stored.

> **Watch your storage.** Originals are roughly 10× the size of the developed
> copies, so this adds up much faster than film-only would. Check the free
> tier's storage limit on your project's usage page early. If it's tight,
> lower `maxOriginalMB` in `camera.js` or set `keepOriginal: false`.

> Want a live photo slideshow on the TV? That needs a public bucket — a small
> change to `schema.sql` plus a gallery page. Ask and I'll build it.

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
