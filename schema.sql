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
drop policy if exists "anyone can read settings" on settings;
create policy "anyone can read settings"
  on settings for select to anon using (true);

-- ===== PHOTOS ====================================================

-- A private bucket: guests can add photos but cannot list or view anyone
-- else's. You see them in the dashboard under Storage → party-photos.
insert into storage.buckets (id, name, public)
  values ('party-photos', 'party-photos', false)
  on conflict (id) do nothing;

drop policy if exists "anyone can upload a party photo" on storage.objects;
create policy "anyone can upload a party photo"
  on storage.objects for insert to anon
  with check (bucket_id = 'party-photos');

-- Note: no select policy for anon, on purpose — the photos are yours.
-- If you'd rather show a live photo slideshow on the TV, say so and this
-- becomes a public bucket plus a read policy.
