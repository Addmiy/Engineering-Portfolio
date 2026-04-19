# GYLIO V1 UI Revision

This revision refactors the GYLIO Expo React Native app into a more premium, minimalist, cinematic interface while preserving the original alarm, activation, lesson, calendar, task, and journal systems.

## Stack

- Expo, React Native, TypeScript, Expo Router
- Supabase JS client, Supabase Storage, Supabase Postgres
- AsyncStorage for local alarm, lesson, task, and journal persistence
- expo-notifications for the realistic alarm notification flow
- expo-video for remote fullscreen playback
- react-native-calendars for the calendar section

## Install

```bash
npm install
```

Expo SDK package versions move together. If Expo reports package mismatches after install, run:

```bash
npx expo install --fix
```

## Environment

Copy `.env.example` to `.env` and add your Supabase project values:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The app reads these with Expo public environment variables in `services/supabase.ts`.

## Supabase Storage

Create a storage bucket:

```text
gylio-videos
```

Store videos by trait:

```text
discipline/discipline_01.mp4
discipline/discipline_02.mp4
focus/focus_01.mp4
resilience/resilience_01.mp4
consistency/consistency_01.mp4
accountability/accountability_01.mp4
```

The app first requests a signed URL for playback. If your bucket is public, it can fall back to the public URL.

## Supabase Table

Create the `videos` table:

```sql
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  trait text not null,
  lesson_title text not null,
  lesson_text text not null,
  applied_today_text text,
  video_path text not null,
  duration_seconds integer,
  thumbnail_path text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create index videos_trait_active_idx
  on public.videos (trait, is_active);
```

Example row:

```sql
insert into public.videos (
  title,
  trait,
  lesson_title,
  lesson_text,
  applied_today_text,
  video_path,
  is_active
) values (
  'Discipline 01',
  'discipline',
  'Start before comfort',
  'Action must come before emotion.',
  'Begin before you feel ready.',
  'discipline/discipline_01.mp4',
  true
);
```

## Storage Policies

For a public bucket, allow read access to objects in `gylio-videos`.

For a private bucket, add policies that allow the app's anon role to select rows from `storage.objects` for this bucket and create signed URLs. Keep uploads restricted to the project owner.

Example read policy for public metadata access:

```sql
create policy "Public read active videos"
on public.videos
for select
to anon
using (is_active = true);
```

## Run

```bash
npm run start
```

Then press `i` for iOS Simulator, `a` for Android, or scan the QR code with Expo Go.

Local notifications are scheduled after saving an enabled alarm. Because mobile operating systems do not allow a third-party app to forcibly take over the phone at wake time, GYLIO opens the activation flow after the user taps the wake notification.

## App Flow

1. First launch opens the alarm setup screen.
2. The user sets a wake time, enables the alarm, and selects a trait.
3. The scheduled notification opens `/activation` when tapped.
4. Activation fetches an active Supabase `videos` row for the selected trait, creates a playable Storage URL, and streams it fullscreen.
5. On completion or continue, the linked lesson is saved locally for today.
6. The home screen displays the lesson, calendar, daily to-do list, and daily journal.
