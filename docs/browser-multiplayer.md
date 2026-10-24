# Browser hosting and display-name friends

Players only need the HTTPS game page. The host browser runs the shared world;
Supabase carries friends, presence and connection messages, never gameplay or
character files. Existing single-player saves, chat, private loot, parties and
trading work through the same simulation used by the classic LAN server.

The repository includes the implementation and database migration. **There is no
live Supabase project configured yet.** The game says “awaiting setup” until the
following one-time owner setup is completed. Players do not perform this setup.

## 1. Create the friends service

1. Create a Supabase project at https://supabase.com/dashboard. Choose a region
   near your players. Save your database password privately.
2. In **Authentication → Sign In / Providers**, enable **Anonymous Sign-Ins**.
   This creates an authenticated identity without an email or password. Leave
   other sign-in providers disabled if they are unnecessary.
3. Open **SQL Editor**, paste the complete contents of
   `supabase/migrations/001_browser_friends.sql`, and run it once. It creates
   private tables and checked RPCs; do not disable row-level security or grant
   direct table access.
4. From **Project Settings → API / API Keys**, copy the **project URL** and
   **public publishable key** (the legacy `anon` key also works). These two
   values belong in the game. **Never use a secret or service-role key.**

The service enforces friendship before joining, requires approval by the named
host of the current room, expires negotiation after two minutes and limits
request/message counts. Only the intended recipient can read connection
messages. Direct database access from game clients is denied. Friend codes are
random 12-character codes; display names can repeat.

## 2. Publish the browser game

An included GitHub Pages workflow avoids installing development tools:

1. In this GitHub repository, open **Settings → Pages** and choose
   **GitHub Actions** as the source. GitHub Pages availability/visibility depends
   on the repository and your GitHub plan; use another HTTPS static host if
   Pages is unavailable for this repository.
2. In **Settings → Secrets and variables → Actions → Variables**, add:
   - `FK_SUPABASE_URL`: the project URL.
   - `FK_SUPABASE_PUBLIC_KEY`: its public publishable/anon key.
   - `FK_TURN_CREDENTIALS_URL`: optional; see relay setup below.
3. Open **Actions → Publish browser game → Run workflow** on `main`.
   The deployment produces the HTTPS address. Everyone opens that same address.

For another static host, run `npm ci && npm run build` and deploy **dist/**.
Create a `browser-network.json` next to the hosted `index.html`:

```json
{
  "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
  "publishableKey": "YOUR_PUBLIC_PUBLISHABLE_KEY",
  "iceServers": [{"urls":"stun:stun.l.google.com:19302"}],
  "turnCredentialsUrl": ""
}
```

Alternatively fill `src/network-config.json` before building to embed these
public settings, including in the standalone HTML. A nonempty hosted
`browser-network.json` overrides embedded settings. It is read only when friends
are opened or a previously enabled friends identity reconnects; fresh solo play
makes no friends-service requests. HTTPS is required for browser hosting;
localhost works for development. Opening the file directly still supports solo
and the existing character export/import flow.

## 3. Play with display names

1. Open **Friends · Browser multiplayer**, choose a display name and enter the
   ledger. Your account and friend code are remembered in that browser.
2. Share your friend code. Your friend enters it, presses **Add friend**, and you
   accept their friend request.
3. Choose a character and press **Host browser game**. Your friend sees you as
   hosting and presses **Request to join**.
4. A request badge appears even with your ledger closed. Open it and press
   **Accept**. The browsers exchange connection details automatically.
5. **Enter** opens chat; **P** opens your company, parties and town trading.
   The host keeps the game tab open and active. Menus do not pause the world.

Up to eight players can join a company. Host saves use IndexedDB; characters
continue to save locally. The online service does not receive equipment or
character exports. Removing a friend prevents new join requests; an already
established game connection lasts until either player leaves.

To move a downloaded character to the new website, use **Classic LAN / Character
transfer → Export character** in the original HTML, and import it at the website.
After playing you can export back. Keep the original HTML at its existing path
and filename to access its browser saves. Different website addresses have
separate local saves and display-name identities.

Names alone do not recover an account: clearing site data or switching browsers
creates a new identity and code. Existing exported characters still import. This
first version deliberately has no email/password recovery or cloud character
saves. Duplicate display names are allowed; use the friend code to identify the
right person.

## 4. Relay support for difficult networks (recommended before a wider release)

Two computers on a normal Wi-Fi can usually connect directly. Some routers,
VPNs, guest Wi-Fi and carrier networks require TURN. A STUN server helps discover
addresses but cannot relay traffic. Direct-only connections are not guaranteed.

Use a managed TURN provider with short-lived credentials, or coturn configured
with `use-auth-secret` and a private shared secret. The optional included
Supabase Edge Function supports coturn's REST credential format:

1. Deploy `supabase/functions/turn-credentials/index.ts` as the `turn-credentials`
   Edge Function. It verifies the bearer token with Supabase Auth itself. If the
   project's gateway does not accept the new Auth signing keys, disable gateway
   JWT verification for this function; its internal user verification remains
   required and must not be removed.
2. Set Edge Function secrets:
   - `TURN_SHARED_SECRET`: the coturn shared secret.
   - `TURN_URLS`: comma-separated URLs such as
     `turn:relay.example.com:3478?transport=udp,turns:relay.example.com:5349?transport=tcp`.
   - `GAME_ORIGINS`: comma-separated allowed HTTPS origins, for example
     `https://yekimf.github.io`. Origins have no trailing path or slash.
3. Set `turnCredentialsUrl` / `FK_TURN_CREDENTIALS_URL` to
   `https://YOUR_PROJECT.supabase.co/functions/v1/turn-credentials`.

The shared secret stays in the function. Clients obtain credentials valid for
one hour. Budget for relay bandwidth if players use it; no relay is provisioned
or paid for by this repository. An external managed provider needs an equivalent
server-side credential endpoint, rather than embedding its private API key.

## Maintenance and verification

Keep Supabase updated, monitor Auth quotas/rate limits, and add CAPTCHA/bot
protection before public promotion. The in-app limits complement provider rate
limits; anonymous authentication is intended here for trusted friend groups.
Expired negotiation rows are removed when their participants heartbeat after a
day. For a larger public service schedule deletion of `social_joins` older than
one day; their signal rows cascade automatically. Friend records remain.

`npm test` checks the shared simulation, trade safety, transfer files, transport
framing, anonymous identity refresh, and SQL participant/approval rules. SQL
checks use PostgreSQL via PGlite with Supabase Auth boundaries supplied locally.
`GAME_URL=http://127.0.0.1:5174 npx playwright test tests/browser/friends-webrtc.spec.js`
checks the complete two-browser flow with the actual database migration behind
a local Auth/API fixture. Ordinary browsers use real WebRTC. Managed Chromium
that forbids non-proxied UDP uses a test-only channel bridge, with an annotation;
the separate real ICE test is explicitly skipped there. The cloud test browser
has this restriction. These checks do not verify an undeployed Supabase project,
a paid relay, or router-specific behavior. Run the real ICE check on an ordinary
browser/CI before public release.
