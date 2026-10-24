# Website and offline single-player saves

The website can now run offline from its own address. In the same desktop Chrome
or Edge profile, the website and its installed app use exactly the same local
character archive and shared stash pages. No Supabase changes are required.

1. Publish the updated `main` using **Actions → Publish browser game → Run workflow**.
2. Open https://yekimf.github.io/arpgprototype/ while connected.
3. Choose **Local saves & offline play** on the title screen. Wait for **Offline
   play ready** before disconnecting. Use **Prepare / repair offline play** if needed.
4. Choose **Install offline app**, or use the browser's install option. Installation
   is optional: reopening the same website address also works offline after setup.
5. Close the other game window before switching between browser and installed app.

This shares saves on this computer and browser profile. It is not cloud storage
or automatic synchronization between computers. Clearing this site's browser data
also clears its characters. Keep an exported backup.

## Existing downloaded HTML characters

A downloaded `file://` HTML and an HTTPS website cannot directly share browser
storage. Move existing downloaded characters once:

1. Open the updated downloaded HTML at the **same filename and location** as your
   existing game so that it can read that file's existing saves. Both root HTML
   aliases are supplied in the download.
2. Open **Local saves & offline play → Export all local saves**. The JSON backup
   contains every local character, each personal stash, gold and the three shared
   stash pages. Account sessions and online characters are excluded.
3. On the website, open **Local saves & offline play → Import local saves**, select
   that JSON, review the character names and confirm.
4. Matching characters keep their website progress by default. Check **Replace
   matching characters** only when the backup contains the progress you want.
   Shared stash items are merged without discarding existing items.
5. Continue playing from the website or its offline app to keep one archive.

Older individual `.fk-character.json` exports from the character-transfer menu can
also be imported. They carry one character and its personal stash, but not the
shared stash. The import does not delete the original file's saved data.

A new copy of the downloaded HTML remains separate. Export/import is still needed
if you continue switching between downloaded files and the website.

## Updates and offline data

The offline cache contains the standalone game and app icons/manifest. It does
not cache authentication, API responses, online characters or the public online
service configuration. Online multiplayer still requires a connection.

After a new deployment, reopen the website while connected. If a new worker is
waiting, **Apply game update** in the local-save menu activates it and reloads.
Characters stay in the existing local archive; updating game files does not
replace them. A first installation or repair needs an internet connection.
