-- ===================================================================
--  Database for the party pages (quiz + disposable camera).
--
--  Run this ONCE, in the Supabase dashboard: SQL Editor → New query →
--  paste all of this → Run. See SETUP.md for the walkthrough.
--
--  This has nothing to do with the RSVP form, which keeps using its own
--  Google Sheet and Apps Script.
-- ===================================================================

-- ===== QUIZ SCORES ===============================================

create table if not exists scores (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(trim(name)) between 1 and 40),
  score       int  not null check (score >= 0),
  total       int  not null check (total > 0),
  -- Which option each guest picked, so the reveal can say "only 3 of you
  -- knew this one". Shape: [{"q": 0, "right": true}, …]
  answers     jsonb
);

create index if not exists scores_leaderboard_idx
  on scores (score desc, created_at asc);

alter table scores enable row level security;

-- Guests post their own score and read the leaderboard. That's all they can
-- do — there's no update or delete policy, so a row can't be altered or
-- removed from the website.
drop policy if exists "anyone can post a score" on scores;
create policy "anyone can post a score"
  on scores for insert to anon with check (true);

drop policy if exists "anyone can read scores" on scores;
create policy "anyone can read scores"
  on scores for select to anon using (true);

-- ===== THE ANSWER-RELEASE SWITCH =================================

create table if not exists settings (
  id                int primary key default 1 check (id = 1),
  answers_released  boolean not null default false,
  updated_at        timestamptz not null default now()
);

insert into settings (id, answers_released)
  values (1, false)
  on conflict (id) do nothing;

alter table settings enable row level security;

-- Everyone can READ the switch. Deliberately no update policy: the website
-- cannot flip it, only you can, from the Supabase dashboard. That way there's
-- no admin password living in public JavaScript.
-- Note both roles: a signed-in user is `authenticated`, which does NOT inherit
-- `anon`'s policies. Without authenticated here, admin.html can update the row
-- but can't read it back, which looks exactly like a permission failure.
drop policy if exists "anyone can read settings" on settings;
create policy "anyone can read settings"
  on settings for select to anon, authenticated using (true);

-- ===== PHOTOS ====================================================
--
-- Two buckets, on purpose:
--
--   party-photos     PUBLIC.  The developed, film-look versions. These are
--                             what the collage on camera.html displays, so
--                             they have to be readable without a secret key.
--   party-originals  PRIVATE. The untouched full-resolution originals off
--                             people's phones. Never displayed, never public.
--
-- They're separate because the two copies of a photo share an id. If they
-- lived in one public bucket, anyone who saw <id>-film.jpg could just ask for
-- <id>-original.heic and get the full-res file.

insert into storage.buckets (id, name, public)
  values ('party-photos', 'party-photos', true)
  on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
  values ('party-originals', 'party-originals', false)
  on conflict (id) do update set public = false;

drop policy if exists "anyone can upload a party photo" on storage.objects;
create policy "anyone can upload a party photo"
  on storage.objects for insert to anon
  with check (bucket_id in ('party-photos', 'party-originals'));

-- No select policy on storage.objects, even for the public bucket: guests
-- can't LIST what's in there. The collage works off the photos table below,
-- which only ever holds paths to developed versions.

-- ===== THE COLLAGE ===============================================

-- One row per developed photo, so the collage has something to read without
-- needing permission to list the bucket.
create table if not exists photos (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  path        text not null,
  name        text
);

create index if not exists photos_recent_idx on photos (created_at desc);

alter table photos enable row level security;

drop policy if exists "anyone can add a photo row" on photos;
create policy "anyone can add a photo row"
  on photos for insert to anon with check (true);

drop policy if exists "anyone can read photo rows" on photos;
create policy "anyone can read photo rows"
  on photos for select to anon using (true);

-- Your switch for the collage, same idea as answers_released: flip it on for
-- the party, off afterwards.
alter table settings
  add column if not exists collage_visible boolean not null default false;

-- ===== ADMIN ACCESS (for admin.html) =============================
--
-- Lets you flip both switches from admin.html after signing in, instead of
-- driving the dashboard on your phone. Guests can't: the anon role has no
-- update policy, so this only applies to a signed-in account.
--
-- The protection here is that **new signups are disabled** in Authentication →
-- Sign In / Providers → Email, so yours is the only account that exists. Keep
-- it that way.
--
-- This used to be pinned to a specific email address. That's stricter, but it
-- fails confusingly when the string doesn't exactly match the account, so it's
-- not worth it for a two-person site. To pin it anyway, replace using (true)
-- with:
--     using ((auth.jwt() ->> 'email') in ('you@example.com'))

drop policy if exists "only the couple can flip the switches" on settings;
drop policy if exists "signed-in users can flip the switches" on settings;
create policy "signed-in users can flip the switches"
  on settings for update to authenticated
  using (true)
  with check (id = 1);
