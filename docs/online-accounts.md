# Username/password accounts and separate online characters

## Update an existing Supabase project

1. In Supabase **Authentication → Sign In / Providers**, enable **Email** and
   **Allow new users to sign up**. Turn **Confirm email OFF** for this username-only
   login design. The game does not ask players for an email address.
2. Run **`supabase/migrations/002_accounts_online_characters.sql`** in the SQL
   Editor. It requires the already-installed `001_browser_friends.sql`. If this
   is a new project, run **001, then 002**, once each.
3. Redeploy the current `main` using **Actions → Publish browser game → Run
   workflow**. The existing `FK_SUPABASE_URL` and `FK_SUPABASE_PUBLIC_KEY`
   repository variables still apply. No new secret belongs in the game.
4. Open **Online realm · Accounts & friends** and create an account. Use a
   username of 3–20 lowercase letters, numbers or underscores, starting with a
   letter, and a password of at least 10 characters. Usernames are case-insensitive;
   display names can be changed independently.

Supabase Auth hashes and verifies passwords. The browser remembers the session
and refresh token, never the password. Because Supabase's password provider uses
email identifiers, the game maps a normalized username to
`username@accounts.forgotten-kingdom.invalid`. This is an internal identifier;
no mail is sent. Email confirmation must be disabled. A real email/recovery
workflow is not implemented, so keep the password safe. An administrator can
reset it through Supabase Auth if necessary. Keep provider rate limits enabled
and add bot protection before promoting a public service.

An existing anonymous friends identity can choose **Create an account** in the
same browser and attach a username/password. This keeps its friend code and
friendships. Signing into another account instead shows that account's roster.
Anonymous sign-in is no longer used for new players. It can be disabled after
legacy users have secured their accounts.

## Character rules

- **Single player and Classic LAN:** existing characters, their shared stash and
  options stay local. Signing in/out never replaces them or uploads their saves.
- **Online realm:** choose **Create online character**. Characters start at level
  one with the normal sword/shield and no armour. The database creates the fresh
  save; it does not accept a single-player import as character creation.
- The online roster is separate, with equipment portraits, a live preview, eight
  entries per page, and up to 20 characters per account. Deleting requires the
  exact character name and cannot delete a character currently in use.
- Host and join both require an owned online character. The host loads an approved
  guest's character from the account service, rather than trusting an imported
  character payload. Classic LAN remains available for local characters.
- Online characters have a personal stash. Local shared stash pages are hidden
  and inaccessible while playing online. Online and local equipment cannot be
  transferred through those pages or through the local import menu.
- Character progress, gear, skills, quests, gold and personal stash save to the
  account. The current browser holds an in-memory working copy and the host
  keeps a session journal in IndexedDB. These are not single-player saves.
- Online saves use ownership checks, revision checks and a 90-second session
  lease. A second tab/device cannot open the same active character. After a crash,
  allow up to 90 seconds for the previous session to expire.
- Use **P → Save & leave company** before closing. Leaving waits for the latest
  account save; a failed cloud save keeps the working character in the tab so it
  can retry. Reloading/closing during an unsaved connection outage can lose the
  most recent progress. The online realm needs internet for account saves.

The host still runs combat in its browser, with private loot and local atomic
trades. Account saves are periodic owner-authenticated snapshots, not a dedicated
competitive game server. Browser-hosted play is intended for trusted groups;
this system does not promise cheat-proof characters or a globally atomic cloud
transaction across two accounts if a browser disappears during a trade.

## Verification

Unit tests run the real migrations in PostgreSQL via PGlite, supplying the Auth
boundary locally. They cover account registration, anonymous rejection, fresh
creation, owner-only access, session conflicts, stale saves, local-save injection,
name-confirmed deletion and approved-peer access. Browser checks cover separate
rosters, online hosting/trading, restoration of untouched local characters, bad
password handling, logout and signing back into the same roster in a fresh
browser. The managed cloud browser uses the documented RTC test bridge because
it blocks non-proxied UDP. Real Supabase Auth settings and live ICE connectivity
must be checked on the deployed project and a normal browser.
