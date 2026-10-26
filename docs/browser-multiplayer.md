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
**002_accounts_online_characters.sql**, then **003_friend_names.sql**. Existing installations with accounts already enabled run only 003.
The game now requires separate online characters; single-player imports remain
local. Anonymous sign-ins are no longer created by the game.

To enable username/display-name requests on an existing deployment, open Supabase
**SQL Editor → New query**, paste [003_friend_names.sql](../supabase/migrations/003_friend_names.sql),
and run it once. No characters, friends or saves are removed. In the company hall,
enter an exact username, display name or friend code and press **Send request** (or
Enter). Names are case insensitive. If several players share a display name, use
`@username` or the unique friend code. Existing friend codes still work without
this migration; name requests require it.

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

## 4. Enable cross-network joining with a TURN relay

**For friends on different home networks, configure a relay.** STUN only discovers
addresses; it cannot carry game traffic through routers that block a direct
connection. Supabase handles accounts and invitations; it is not itself a TURN
relay. Players still only open the website, and direct connections are used when
available. A relay carries encrypted WebRTC packets when needed.

### Managed relay: Cloudflare TURN (no server for you to run)

1. In [Cloudflare Realtime TURN](https://developers.cloudflare.com/realtime/turn/),
   create a TURN key. Keep its **key ID** and **API token**. The provider may charge
   for bandwidth; check its current pricing before enabling it.
2. In your **Supabase project → Edge Functions**, create `turn-credentials` and
   paste the complete contents of
   [`supabase/functions/turn-credentials/index.ts`](../supabase/functions/turn-credentials/index.ts).
   Deploy it. The function verifies the signed-in user with Supabase Auth itself.
   If gateway JWT verification rejects your project's new signing keys, disable
   gateway JWT verification for this function; keep its internal verification.
3. In **Supabase → Edge Functions → Secrets**, add:
   - `CLOUDFLARE_TURN_KEY_ID`: your TURN key ID.
   - `CLOUDFLARE_TURN_API_TOKEN`: your TURN API token.
   - `GAME_ORIGINS`: `https://yekimf.github.io` (no `/arpgprototype/` or trailing slash).
   Supabase provides `SUPABASE_URL` and `SUPABASE_ANON_KEY` automatically.
4. In **GitHub → arpgprototype → Settings → Secrets and variables → Actions →
   Variables**, set `FK_TURN_CREDENTIALS_URL` to:
   `https://YOUR_PROJECT.supabase.co/functions/v1/turn-credentials`.
5. Run **Actions → Publish browser game → Run workflow → main**. Both players
   reload the updated website, sign in and request/accept a new company connection.

The Cloudflare token belongs only in Supabase Secrets. Never put it in GitHub's
public browser configuration or the HTML. Browsers receive temporary credentials
valid for one hour, not the provider token. No database migration is needed.

### Existing coturn relay

The same Edge Function also supports coturn's `use-auth-secret` mode. Instead of
the Cloudflare secrets, set `TURN_SHARED_SECRET` and `TURN_URLS` (comma-separated
`turn:` / `turns:` URLs). Include TCP/TLS, preferably on port 443, for networks
that block UDP. Keep `GAME_ORIGINS` and the GitHub URL variable as above.

### Connection troubleshooting

- “Direct connections only” in the company hall means this build has no configured
  relay. Changing a repository variable needs another Publish workflow run.
- Check the Edge Function logs if it reports relay unavailability. It must return
  actual TURN URLs, a username and temporary credential for an authenticated user.
- The movement stream coalesces stale positions, retains hits/casts, and uses
  acknowledged positions for prediction corrections. Long-distance latency no
  longer adds an ever-growing queue of old movement commands.
- The handshake retries transient signaling failures and an initial ICE attempt.
  Brief disconnected states have a 30-second recovery window. A terminal failure
  requires Save & leave, then a fresh join request; game ownership does not migrate
  automatically if the host leaves. Keep the host's browser open and computer awake.

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

Run `NETWORK_TEST_LATENCY=250 npx playwright test tests/browser/friends-webrtc.spec.js`
to impose 250 ms in each direction on the test bridge. This checks the guest
walking away and returning, host agreement, chat, trading and saving at 500 ms RTT.
