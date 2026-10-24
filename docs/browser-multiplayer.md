# Browser hosting and display-name friends

Players only need the HTTPS game page. The host browser runs the shared world;
Supabase stores accounts, friends, presence, connection messages and online
character snapshots. Live gameplay travels through WebRTC. Chat, private loot,
parties and trading use the same simulation as Classic LAN; single-player saves
remain separate and local.

The repository includes the implementation and database migration. Public service settings are supplied by the repository owner. The game says
“awaiting setup” if they have not been configured. Players do not perform this setup.

## 1. Create or update the account service

For the current username/password version, follow [online account setup](online-accounts.md).
Create the Supabase project, enable Email/password with signups allowed and email
confirmation disabled, then run **001_browser_friends.sql** followed by
**002_accounts_online_characters.sql**. Existing installations run only 002.
The game now requires separate online characters; single-player imports remain
local. Anonymous sign-ins are no longer created by the game.

Copy the project URL and public publishable/anon key from Project Settings → API.
Never use a secret or service-role key in the game.

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

## 3. Sign in and play online

1. Open **Online realm · Accounts & friends**. Create an account with a username,
   password and display name, or sign in to an existing account.
2. **Create new character** uses the single-player camp creation scene. Create or
   click a saved online loyalist to enter the company hall; **Create → Host online
   game** starts a company. Local characters stay in Single player / Classic LAN.
3. In the company hall’s **Friends** pane, share a friend code, send a request and
   accept it. Friends can then **Request to join**; the host presses **Accept**.
4. **Enter** opens chat and **P** opens parties/trading. Keep the host tab open and
   active. **Save & leave company** saves online progress before returning to
   the local title screen.

Online characters, progression and personal stashes save to the account. Friends
and account identities are stored by the service. Single-player characters,
shared storage and options stay in the browser. See [account details and save
rules](online-accounts.md). Character export/import is for local Single player /
Classic LAN characters and cannot promote them into the online realm.

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
framing, username/session refresh, and SQL participant/approval rules. SQL
checks use PostgreSQL via PGlite with Supabase Auth boundaries supplied locally.
`GAME_URL=http://127.0.0.1:5174 npx playwright test tests/browser/friends-webrtc.spec.js`
checks the complete two-browser flow with the actual database migration behind
a local Auth/API fixture. Ordinary browsers use real WebRTC. Managed Chromium
that forbids non-proxied UDP uses a test-only channel bridge, with an annotation;
the separate real ICE test is explicitly skipped there. The cloud test browser
has this restriction. These checks do not verify an undeployed Supabase project,
a paid relay, or router-specific behavior. Run the real ICE check on an ordinary
browser/CI before public release.
