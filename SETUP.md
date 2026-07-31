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
| `board.html` | Leaderboard plus which questions people are getting wrong. Linked from the tab bar, so guests can check standings on their own phones. Never shows answers — only how many got each one right — so it's safe while the quiz is sealed. Works on a big screen too if there is one: press **F** for fullscreen. |

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

**To release, from your phone:** open **`admin.html`**, sign in, tap
**Release the answers**. See "Your controls page" below.

(The dashboard still works as a fallback: **Table Editor** → `settings` → the
single row → set **`answers_released`** to **true** → save.)

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

They share an `id`, so the pair always matches up — but they live in **two
different buckets**, which is the important part:

| Bucket | Holds | Visibility |
| --- | --- | --- |
| `party-photos` | the developed `-film.jpg` versions | **public** — required, because the wall displays them |
| `party-originals` | the untouched `-original.*` files | **private** — never displayed, never linked |

They're split deliberately. If both copies sat in one public bucket, anyone who
saw `abc-film.jpg` could ask for `abc-original.heic` and get the full-resolution
file. Separating them means going public only ever exposes the small,
grainy, date-stamped version.

Guests also **cannot list** either bucket. The wall works off a `photos` table
that only ever holds paths to developed versions.

1. The guest picks or shoots a photo.
2. `camera.js` shrinks a copy to 1600px, applies the film look, stamps the date.
3. The developed copy goes to `party-photos` and a row goes in `photos`.
4. The original goes to `party-originals` in the background.
5. "Save to my phone" is a plain local download and touches no server.

If the original fails to upload, or is over the 20MB cap in `camera.js`, the
guest never sees an error — they've already been thanked and the film version
is safely stored.

> **Watch your storage.** Originals are roughly 10× the size of the developed
> copies, so this adds up much faster than film-only would. Check the free
> tier's storage limit on your project's usage page early. If it's tight,
> lower `maxOriginalMB` in `camera.js` or set `keepOriginal: false`.

### The Wall — your second switch

Under the upload box on `camera.html`, guests see a collage of the developed
photos everyone has sent, newest first. It's **off by default**.

**To put it up:** Table Editor → `settings` → set **`collage_visible`** to
**true**. **To take it down:** set it back to `false`.

> **Turning the wall off hides it; it does not revoke access.** Anyone who
> already copied a photo's URL can still open it, because `party-photos` is a
> public bucket. To *actually* cut off access after the party: **Storage →
> party-photos → bucket settings → turn off Public.** The originals were never
> public, so they need nothing.

### Your controls page

**`admin.html`** is both switches on one page, behind a real sign-in. Not
linked from anywhere and marked `noindex`, so guests won't stumble onto it.

**Set it up once (about 5 minutes):**

1. **Authentication → Users → Add user.** Use your email, pick a password,
   and tick **Auto Confirm User** so there's no confirmation email to chase.
2. **Turn off public signups.** Authentication → **Sign In / Providers** →
   Email → switch off **Allow new users to sign up**. Without this, a stranger
   could register an account.
3. Check that the email you used appears in the **ADMIN ACCESS** list near the
   bottom of `schema.sql`. If it doesn't, edit it and re-run the file. Want
   Amanda to have her own login? Add her as a user and add her email there too.
4. On your iPhone: open `admin.html` in Safari, sign in, then **Share → Add to
   Home Screen.** It opens like an app, and the session is remembered.

**Two layers keep guests out of it.** Signups are off, so they can't get an
account. And the database only accepts switch changes from the specific emails
listed in `schema.sql` — so even an account that somehow got created can't
change anything.

> If `admin.html` says *"That account isn't allowed to change this"*, the email
> you signed in with isn't in that list in `schema.sql`. Add it and re-run.

### Taking a photo down, mid-party

Someone will eventually send something they regret. Three options, fastest
first:

**Everything, right now.** `settings` → `collage_visible` → `false`. The whole
wall disappears within 20 seconds. Use this if you need a moment to sort out
which photo is the problem.

**One photo, keeping the file.** Table Editor → **`photos`** → sort by
`created_at` descending → delete the row. It leaves the wall immediately but
the image stays in Storage, so you still have it.

**One photo, deleting it outright.** Storage → **party-photos** → find it →
delete the file. Do it this way when you're not sure which row is which:
**Storage shows thumbnails and the table doesn't.** The wall drops any tile
whose image won't load, so it disappears on the next refresh even with its row
still in the table.

The path tells you who sent it — files are stored under the name they typed,
like `priya/abc123-film.jpg` — so you can usually find the right row by name
and timestamp.

> **Deleting the film version doesn't delete the original.** Those live in
> `party-originals` under the same id. If someone asks you to *really* get rid
> of a photo, delete it from both buckets.

> **Guests can't delete their own photos** — there's no delete policy, so the
> website can't remove anything. They have to ask you. Worth knowing if someone
> comes up mid-party asking for one to come down.

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
