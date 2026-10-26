# The Forgotten Kingdom — The Broken Oath

An original isometric ARPG with single-player and optional LAN co-op for **desktop mouse and keyboard**. A soldier returns from visiting family to find King Alaric murdered, his son on the throne, and the royal garrisons corrupted by a stranger’s bargain. The survivors of Emberfall point the way toward Crownfall. There is no ghost of the king or divine guidance.

## Download and play

1. Sign into GitHub with access to this repository.
2. [Download the game ZIP](https://github.com/Yekimf/arpgprototype/archive/refs/heads/main.zip) and extract it.
3. Open **`forgotten-kingdom.html`** in a current desktop browser. To continue an existing offline character, keep using **`ashen-reliquary.html`** at its previous location; it is an identical updated copy.

The root HTML embeds all code, styles and runtime art. It works offline. Use a desktop viewport of at least 1024×720; 1280×720 or larger is recommended. Touch controls, phone layouts and the mobile test project have been removed. The HTTPS browser game is available at https://yekimf.github.io/arpgprototype/ after deployment. An optional local server hosts classic LAN multiplayer. Browser-hosted WebRTC multiplayer is also included and needs the one-time friends-service setup below; solo play still works directly from the HTML file.

## Version 0.67.0 — Character portraits on the online ladder

- Each realm ladder row now shows a painted character portrait beside rank, name, class and level. The portrait uses the same equipped-gear rendering as character select.
- Apply [005_online_ladder_portraits.sql](supabase/migrations/005_online_ladder_portraits.sql) to an existing Supabase project after 004. Only visible gear shape and appearance data are shared for the portrait; inventory, item stats and saves remain private.

## Version 0.66.0 — Stronger world contrast and Merrit’s stall

- The world canvas has stronger contrast and color separation without adding per-frame terrain processing. Wild and companion chickens are slightly larger, brighter, and have clearer contact shadows against dark ground.
- Merrit is now a mustached chicken at a textured market stall with a crooked **CHIKEN STUF** sign. The stall uses the same grounded shadow treatment as other buildings, and its larger shape can be clicked to open the chicken shop.
- **0.66.1:** Merrit’s mustache is positioned immediately under the beak, with smaller curls that stay on the face.

## Version 0.65.0 — Online realm ladder

- The online company hall has a **Ladder** tab beside Create and Join. It ranks the top 100 online characters by level and shows rank, character name, account display name, class and level.
- Ladder entries come from online character saves in Supabase. Apply [004_online_ladder.sql](supabase/migrations/004_online_ladder.sql) to an existing project before opening the new tab. The query returns only public ranking fields.

## Version 0.64.0 — Separate Chickendex and Inventory panels

- The **Chickens** button now sits beside Inventory in the bottom menu. Opening Chickendex also opens the real Inventory panel, placing the chicken's page on the left and the player's existing equipment and pack on the right. Both remain visible over the game at desktop sizes.
- The duplicate player inventory has been removed from Saddlebags. Drag an item from the actual Inventory pack into the chicken's grid, or drag it back to Inventory. Protected quest items and keepsakes stay with the player; the existing selling trip and payout still work.
- Each panel has its own close button. If Chickendex opened Inventory, closing Chickendex closes both; if Inventory was already open, closing Chickendex leaves it open.

## Version 0.63.0 — Chicken folio and drag transfers

- The Chickendex opens as a smaller, centered gothic popup with the game visible behind it. Its saddlebags page shows your inventory and your chosen chicken's bags side by side, with arrows to choose another chicken.
- Drag items from your inventory into the saddlebags to prepare a sale, or drag them back to keep them. Clicking an item still transfers it for keyboard and accessibility use. Quest items and keepsakes cannot be packed, and full bags leave items where they are.
- Sending a chicken to Orrin keeps the existing 30-second selling trip, saved payout, and buyback behavior.

## Version 0.62.0 — Chickens stay gone, names, and clearer hats

- Captured chickens leave the world after the crate closes. Wild chickens defeated in a battle also disappear. Neither returns when you walk away or revisit the area during the same game; a fresh world can have new wild chickens.
- Open **Chickendex → Pets** to give a collected chicken a nickname or restore its breed name. Names persist with that character and appear in battles and on multiplayer companions.
- Hats now use tighter artwork crops and larger placement over the chicken's head in the world, portraits, and battles.

## Version 0.61.0 — Shared multiplayer quest objectives

- Every player in a hosted company shares Act I objective kills and boss completions, without requiring party membership or proximity. Players elsewhere in the world receive the same counters, and late joiners catch up to objectives completed in that game.
- The host records actual objective deaths in a session ledger; importing an advanced character does not complete everybody else's quests. Repeated snapshots and stale character syncs cannot duplicate or erase that shared progress.
- Acceptance, sequential NPC conversations and reward claims remain personal. Each character returns to the quest giver and claims each reward once. XP, kill credit, flask recovery and private drops keep their existing nearby party rules.
- Shared progress merges into personal saves and unlocks Edrin after Aldren falls. A new hosted game has a fresh shared ledger; existing personal quest progress is retained.

## Version 0.60.1 — Achievement and chat spacing

- Achievement notifications sit above the full multiplayer chat history and input area. Solo placement stays the same; stash notifications also respect the chat clearance.

## Version 0.60.0 — Spatial trade windows

- Trading now opens a stone-framed trade sheet on the left and a separate equipment/backpack sheet on the right, leaving the world visible between them. The partner’s offer is above yours; each has a spatial 10×4 item grid, a nameplate, gold amount and confirmation seal.
- Click or right click backpack items to offer them; click your offered items to remove them. Drag between your backpack and offer as well. Offered items stay marked in the backpack until the trade completes. Hover or keyboard-focus items for gothic inspection tooltips.
- Items retain their inventory footprints and artwork. Overflow uses explicit pages, including offer pages, without scrolling items out of view. Equipped and quest items remain unavailable for trading; the twelve-item limit is retained.
- Edit gold, press **Update offer**, then **Confirm offer**. Both players must confirm the same authoritative revision. Changing either offer clears confirmations; cancellation, capacity checks and atomic item/gold transfer are preserved for Classic LAN and browser-hosted games.
- Checked layout and item bounds at 1024×720, 1280×720 and 1920×1080, browser account/trading flows, drag/right-click offers, confirmation resets and offline play.

## Version 0.59.0 — Company ledger and friends by name

- Replaced native rounded party meters with square inset life wells, aged stone cards and shield-shaped level badges. The company roster has clearer party/leader labels, readable location names, grouped actions and a party summary. Health updates without rebuilding the roster; the compact party list can scroll for a full eight-player company.
- Add friends by exact username, display name or existing friend code from the company hall. Requests still require acceptance. Names ignore letter case; use `@username` or a code when a display name is shared. Enter submits the request, with duplicate-submit protection and feedback.
- **Existing online deployments:** run [003_friend_names.sql](supabase/migrations/003_friend_names.sql) once in Supabase SQL Editor, after migrations 001 and 002, to enable name lookup. Existing friends and characters remain intact. Codes continue working with the previous database.
- Checked database permissions, duplicate names and pending requests, browser account/friend/host/trade flows, party UI at desktop resolutions, and both offline builds.

## Version 0.58.1 — Fresh worlds per game

- Pressing Play starts a new randomly seeded world in Emberfall, including for existing characters. Character progress, equipment, quests and waypoints remain saved.
- Revisiting an area during the same game keeps its layout, explored ground, enemies and loot. Town portals retain their round-trip destinations. Returning to the title and playing again creates a fresh world; pausing does not.
- Multiplayer continues to use one host-owned seed and area cache for everyone in the room.

## Version 0.58.0 — Solid scenery and the Tithe Granary

- Buildings, tree trunks, chests, carts, sack stacks, barrels, pillars and other solid scenery have ground footprints. Canopies, loose bones, wheat and ground litter remain passable. Threshing shelters block their posts while leaving their centres open.
- Spatially indexed collision is shared by pathfinding, movement and both multiplayer hosts. Fast movement checks small steps so characters cannot skip through thin obstacles; blocked enemy spawns relocate to nearby clear ground. Entrances, commanders, NPC approaches and service landings remain accessible.
- The Tithe Granary now has seeded storage yards with raised grain stores, open threshing shelters, loaded wagons, grain bins, sacks, sorting tables, barrels and straw piles. Broad wagon routes connect the yards and boss area.
- Replaced the granary's yellow-green floor treatment with original neutral packed-earth, wagon-yard, oak-board and sparse-chaff textures. New materials use the existing floor cache; the decoration atlas is embedded in both offline copies.
- Checked scenery collision, fast movement, seeded layouts and routes, companion courier behaviour, vendor interactions and click-to-move through a new granary yard.

## Version 0.57.1 — Globe alignment

- Removed inherited top padding that pushed the health and mana glass ten pixels below the centres of their sculpted frames, leaving an empty gap at the top.
- Checked both globes at full resources at 1024×720, 1280×720 and 1920×1080. Resource percentages, glass highlights and ornamental frames keep their existing behaviour.

## Version 0.57.0 — Gothic interface readability

- Audited pause/options, character, mastery, inventory, quests and chronicle at 1024×720, 1280×720 and 1920×1080, plus merchant and blacksmith controls. Button labels now wrap at word boundaries, stay centred inside their frames, and have more consistent font sizes and spacing.
- Increased the tiny mastery captions and skill labels, improved contrast for locked skill names, and compacted the mastery sidebar so the point counter remains visible at 720p. Skill details can scroll within their own panel.
- Equipment slots use clear slot names instead of overflowing “Empty · Body armor” captions. Equipment art, hover inspection and drag controls remain intact. Toolbar and vendor/forge action labels have more clearance from their decorative borders.
- Added original aged iron crown, guardian, divider and raven relief artwork to menu surfaces, including the pause screen, character ledger, controls and poultry menus. Ornaments use cached images and do not intercept clicks or animate while menus are idle.
- Browser checks exercise button text bounds, minimum label sizes, menu fit, keyboard navigation, vendor purchasing and forge controls. Both offline HTML copies are rebuilt.

## Version 0.56.0 — Painted boss attacks and unlocked passages

- Act I commanders now use distinct six-pose painted spear impacts, burning-chaff eruptions and thorn bursts. Sweep attacks lay artwork across the actual arc; shockwaves carry animated impacts along the expanding collision edge. These keep their painted dimensions instead of stretching a single shape through an attack.
- Added textured elemental impact materials for the other supported boss themes. Danger outlines remain visible before attacks; collision, damage and warning times remain governed by the existing encounter rules. Effects share the quality-dependent graphics budget and respect reduced motion.
- Stronghold exits are now grounded stone or timber passages, visible and barred before victory. After the commander falls, the doors open. Click to approach or walk through an unlocked passage to continue directly into the next region, using the existing area-loading screen. The last refuge passage leads back to Emberfall.
- Town portal spells remain available for round trips. Region transitions still load separate maps; this update improves physical passage and progression without claiming a seamless streamed world.

## Version 0.55.0 — Companions and multiplayer chicken duels

- Chickens now face their direction of travel. The atlas artwork faces left, and the world renderer mirrors it correctly for movement toward the right of the screen.
- Friends can see your selected following chicken, including its breed and hat. Companion positions interpolate with multiplayer movement. Chickens disappear for other players when sent to sell, left at the coop, or when their keeper leaves; cargo and private collection data are never broadcast with the follower.
- In Emberfall, right-click a friend's companion or choose **Company → Challenge chicken**. The other keeper must accept. The selected companions fight a friendly one-on-one Trial of Feathers using their levels, elemental moves, speed, status effects and move uses.
- Both keepers commit a move before the host resolves a round. Choices remain hidden until resolution. Exhausted move lists allow Struggle; withdrawing concedes the bout. Invitations expire after 45 seconds and rounds allow 60 seconds. Leaving or disconnecting forfeits an active duel.
- Sparring uses rested copies of both chickens. Permanent life, move uses, XP, points, hats and saddlebags remain unchanged; there are no wagers or duel rewards. Wild chicken battles still award their usual progression.
- Works with Classic LAN and browser-hosted multiplayer. Both players should reload the updated game.

## Version 0.54.0 — Long-distance multiplayer reliability

- Movement no longer waits in an ever-growing queue behind old replies. New positions replace unsent positions; hits and casts are retained. Host corrections compare against acknowledged movement rather than pulling the guest back toward a stale position.
- Unsent world snapshots coalesce under congestion, with replies and asset changes prioritized. Character sync runs every two seconds; explicit saves/trades still flush immediately. Duplicate kill acknowledgements no longer flood the command queue.
- Concurrent ICE/offer handling shares a single connection. Transient signaling failures retry; the initial ICE attempt retries once. Duplicate/old handshake messages are ignored and brief disconnections have a recovery window. Failed guests cannot release the host's online character lease or leave a ghost session during validation.
- Tested guest movement, chat, private accounts and trading with 500 ms of simulated round-trip delay. The transport bridge verifies application behavior; it does not certify real-world router traversal or relay service availability.
- For friends on different networks, enable a TURN relay. The included authenticated Edge Function now supports **managed Cloudflare TURN** as well as coturn. Follow [the relay setup guide](docs/browser-multiplayer.md#4-enable-cross-network-joining-with-a-turn-relay), then republish. No database migration is required.

## Version 0.53.0 — Treasure classes and Magic Find

- Regular solo monsters first roll a 62.5% chance to drop nothing. Living players in the same area reduce this chance, with nearby party members counting more. Gold is part of the drop roll instead of guaranteed on every kill.
- Monster level determines eligible base items and standard / exceptional / elite tiers. Magic Find never unlocks higher treasure classes or changes which base drops.
- Magic Find affixes now appear on gear and in the character ledger. They improve Magic, Rare, Set and Legendary quality, with diminishing returns on the higher qualities. Early equipment remains mostly common; jewellery stays scarce.
- Solo and both multiplayer hosts use the same rules. Multiplayer retains private loot; each recipient uses their own equipped Magic Find.
- See [drop rules and probabilities](docs/treasure-classes.md) for the exact tables and boss exceptions.

## Version 0.52.0 — Merchant inventory

- Orrin displays equipment, insight scrolls, life-flask refills and wooden crates together in a gothic 10×10 inventory grid. Items occupy their actual inventory dimensions; larger stocks use pages without scrolling.
- Hover for item details and prices. Right-click a vendor item to purchase it, or select it and use Buy. Supplies remain available for repeat purchases. A flask purchase still replenishes the existing flask immediately.
- Your equipment and backpack remain beside the vendor. Shift-click or drag your belongings to sell; buyback uses the same vendor grid. Stock refresh stays a separate service control.
- Checked purchasing, buyback, forge controls and both sheets at desktop sizes down to 1024×720.

## Version 0.51.1 — Rough stick crates

- Capture crates now use square, roughly lashed stick-cage artwork with thin bars, both in your inventory and in the throwing/catching animation. The caught state uses matching grey wood.
- The first chicken remains a guaranteed catch; no failure roll is applied. Existing capture odds are unchanged.

## Version 0.51.0 — Feathered companions and selling trips

- The selected chicken follows your character through outdoor areas and dungeons, navigates walkable paths and displays its hat. Choose a companion or send it back to the coop from the Pets tab.
- **Chickendex → Saddlebags** opens your pack alongside the selected chicken’s 6×4 cargo grid. Click items to transfer them. Quest items and marked keepsakes cannot be packed for sale.
- The sale button lists the exact cargo count and gold value. Your chicken takes a 30-second trip to Orrin, sells at normal vendor prices, and returns the gold automatically. It is unavailable for following or chicken battles while away. Each chicken has its own cargo and trip.
- Trips persist with the character, finish across reloads/offline time and pay once. Sold items enter Orrin’s eight-item buyback ledger. Chicken points remain separate from ordinary sale gold.

## Version 0.50.0 — The Quiet Coop

- Orrin sells unexplained Wooden Crates for 18 gold. Right-click a crate in your pack, then right-click a nearby chicken. The thrown crate shakes five times, releases stars and turns grey. Your first catch earns **I choose** and unlocks the **Chickendex**.
- Collect twelve painted chicken breeds across six elements. Choose a lead pet and right-click a wild chicken for a turn-based battle: move uses, elemental strengths, speed, status effects, switching, provisions, withdrawal, XP and levels up to 50. Moves unlock at levels 3, 6 and 12. Battles are against wild chickens, not other players.
- Merrit appears in a quiet corner of Emberfall after discovery. Wins and new breeds earn chicken points; his shop accepts only those points. Three of nine cosmetic hats rotate every two hours, alongside three battle supplies. Resting the flock is free. Hats appear on collection and battle portraits.
- All locked achievements hide their names, requirements and rewards behind question marks. Pet progress belongs to each character and travels with its existing saves/backups. Interrupted captures are recovered on reload. Captured birds are replaced when you leave their vicinity; defeated birds rest for two minutes in the current area.
- The collection holds 120 chickens. The normal single-player world pauses during poultry battles. Cooperative sessions continue for other players; pets and their battles are personal.

## Version 0.49.0 — Painted combat animations

- Replaced the primary skill shapes with 108 original painted poses across 18 animation styles: molten firebolts, fire eruptions, ice lances and nova, rock ruptures, lightning arcs and strikes, steel cuts, blood rending, spectral blades, defensive shields and ember auras.
- The 18 active skills use these animated paintings with frame interpolation, aligned ground contacts and projectile tips. Spear and dagger attacks retain thrust impacts. Frost, earth and persistent ground effects render beneath characters and walls; warnings retain their explicit targeting outlines.
- Damage, mana, contact timing, projectile collision and skill areas are unchanged. Both flask recovery effects and bow shots also use painted sprites.
- Performance quality limits painted draw calls and fire clusters; reduced motion uses a steady readable pose. All animation sheets are embedded in the offline HTML, adding about 1.4 MiB of compressed artwork with no extra network requests during combat.

## Version 0.48.0 — Quests, conversations and return portals

- Quests are assigned one at a time. Finish the objectives, then return to the giver to receive gold and experience and unlock the next assignment. Maelin gives the first two quests, Orrin the next two, and Garran the final two. Previously paid quests remain paid on older saves.
- Quest givers automatically deliver the current introduction or reward dialogue. Text reveals gradually, with conversation buttons hidden until you finish reading. Click or Space reveals the remaining text; click or Space again continues. Escape leaves without accepting or claiming unfinished dialogue.
- Town portal casts now leave visible paired portals. Click either end for repeated trips between Emberfall and your exact field location, preserving the expedition. Casting a new portal replaces the previous pair; character changes and reloading end that portal session.
- The levy commanders and thorn choir have matching named objectives, directional descriptions, visible nameplates and a separate gothic miniboss health bar.

## Version 0.47.1 — Gothic startup screen

The website and offline game now show an immediate dark archway and title while loading. The unfinished game HUD stays hidden until the main menu and its painted artwork are ready. Failed downloads show a retry button while preserving character saves.

## Version 0.47.0 — Voices of the broken oath

- The six Act I quests now connect the sheep raids, hunger levies and corrupted garrison to the people of Emberfall. Maelin, Orrin, Garran and Edrin have progress-sensitive greetings and optional conversation topics.
- Brief field memories and boss exchanges add context without pausing combat. Disable automatic dialogue in Options → Story observations and boss dialogue.
- Six optional field accounts can be inspected along the journey. Read them again in J → Accounts; each character keeps their own discoveries. They never block an entrance or take inventory space.
- Revised the prologue’s narration around the king’s betrayal and the loyalist’s return. Later quest revelations stay concealed until their region is reached.
- Calibrated enemy death sprites against their living silhouettes so they retain their size as the fall begins. Corpses keep the same grounded anchors throughout the animation.

## Version 0.46.0 — Combat contact, reactions and spell effects

- Basic attacks and offensive skills land at their animation contact point. Late presses during the last 220 ms of recovery buffer one intended action with its aimed point; held attacks do not replace that explicit choice. Daggers, unarmed attacks and ranged weapons have distinct basic attack cadences. Movement can resume after contact while the legs walk under the finishing upper-body pose.
- Evade cancels an unlanded strike or cast and can chain into a buffered attack as the roll ends. Its recovery is 2.2 seconds before recovery bonuses. Mana is committed when casting begins and remains spent if interrupted. Equipment panels, area transitions and character changes cancel pending strikes. WASD movement while holding an enemy attack continues attacking toward the cursor.
- Fast projectiles now sweep their whole travelled path, hit the first target they reach, stop at walls, and respect their remaining lifetime. Fire bolts and Thunder Spear have one direct target (Thunder Spear keeps its splash); Rime Lance and spectral lances can pierce three. Authoritative LAN/browser-host hostile shots use the same collision geometry.
- Short steel arcs and thrust streaks replace broad basic swing circles. Confirmed hits throw bone fragments, blood or iron sparks, with elemental variants and restrained critical accents. Enemy bodies briefly recoil while their feet/shadows and collision positions stay grounded. A small copper health-loss trail and broken targeting arcs make hits legible in dark areas; damage over time does not repeatedly flinch the target.
- Fire, frost, lightning and aether shots have distinct cores and tails. Cold novas raise jagged frost; quakes fracture the ground; chain lightning follows a stable branching path. Evading leaves dust rather than a magic ring. Particle trajectories stay consistent between frames, with smaller budgets in Performance and Reduce motion modes. Reduced motion disables enemy recoil; boss warning boundaries remain visible until contact.
- Existing characters, equipment, mastery allocations, skill bindings and campaign progress are preserved. Rebuilt standalone files; publish `main` through **Publish browser game** for the website. No service/database migration is required.

## Version 0.45.0 — WASD movement and custom key bindings

- Open **Escape → Options → Movement & key bindings**. Enable **WASD + click to move** or keep click movement. Arrow keys remain available in either mode. WASD follows screen directions at the normal movement speed, cancels a click path, and steers evade while a direction is held; attacks still aim at the cursor.
- Each movement mode keeps its own locally saved bindings. Click mode starts with Q/W/E/R skills; WASD starts with Q/E/R/F. Rebind all four skill slots, evade, both flasks and town portal, with optional keyboard alternatives for the selected LMB/RMB abilities for trackpads and laptops. Mouse buttons remain usable.
- Select a key box and press a key. Escape cancels; Backspace/Delete or the adjacent × clears it. Conflicts and reserved menu/movement keys are rejected with an explanation. **Reset this mode** restores only that mode’s bindings. HUD labels, Masteries assignment boxes, skill selection and the controls guide show the current keys.
- Held inputs stop on key release, text/chat focus, menus, cursor release, tab blur and character changes. Control preferences are device/browser settings shared by local and online characters; character saves, equipment and learned skills are unchanged. Existing settings retain click movement and Q/W/E/R.
- Rebuilt both standalone HTML files. Publish `main` through **Publish browser game** to update the website; no database migration is needed.

## Version 0.44.3 — Wrapped weapon grips and a separate rear carry

- One-handed melee grips now have a palm behind the actual handle and separate curled fingers/thumb in front. The handle remains visible between fingers, replacing the full opaque hand overlay. The arm bones end at the wrist; the palm connects that wrist to the measured grip.
- Rear swords, axes, maces, flails and daggers hang beside the body with a nearly level blade/head. The rear shoulder stays attached under its pauldron, and the shield-side forearm is visible on the inside of the shield. Longer spears retain an upward carry to fit their length.
- Added pixel checks that distinguish exposed handle pixels from finger coverage, plus arm-length, grip, facing and clipping regressions. Ranged and two-handed weapon poses are retained for their later references.

## Version 0.44.2 — Reference stance for one-handed melee weapons

- Existing swords, axes, maces, flails, daggers and one-handed spears use a relaxed hip grip, a gentle elbow bend and an upward/outward weapon angle based on the supplied knight-and-shield reference. The shield is held higher beside the torso.
- Walking keeps a stable carry pose. Slashes and thrusts start from and return to this ready stance while continuing to aim toward the attack target. Hands stay attached to the measured handles.
- Existing two-handed staves, heavy weapons, bows, crossbows and ranged wands retain their previous poses. No new weapon items or balance changes were added.

## Version 0.44.1 — Connected hands and corrected weapon grips

- Corrected the weapon anchors against the actual handle pixels. Several old grips sat in transparent space, and the bow gripped its string instead of its riser. Greatsword supporting hands now sit behind the guard, while staff/maul/crossbow supporting hands use their own measured positions.
- Replaced empty/occluded arm and hand cutouts with continuous textured sleeves, overlapping wrists and painted palms. Forearms and fingers remain visible when a pose crosses the torso. Gloves follow the palm, and the complete shield follows its hand rather than moving only its clipping mask.
- Added checks for solid handle pixels, every weapon's attack frames and facings, and visible hands/wrists across 816 weapon/facing/glove combinations. Combat balance and save formats are unchanged.

## Version 0.44.0 — Shared offline saves and layered player equipment

- The website can be prepared for offline play or installed as a desktop web app. Website and app share the existing single-player characters and stash in the same browser profile. Downloaded HTML saves can be moved once through the new title-screen **Local saves & offline play** backup/import menu. [Setup and migration](docs/shared-offline-saves.md).
- Reworked player composition with shared pose frames, direction-dependent layer order, independent arm attachments, wrist-mounted gloves/shields and fitted two-handed grips. Separate slashing, heavy, thrust, bow, crossbow, punch and cast poses retain the existing painted armor and set appearances. LAN/WebRTC peers carry their actual action timing and casting pose.
- Cached frames use a bounded pixel budget and include padding for raised weapons. Character portraits and creation share the compositor. The source artwork still consists of front/back paintings projected into sixteen facing sectors; a full sixteen-angle rendered art library remains future work. [Animation details](docs/player-animation.md).
- No database migration is needed. Publish `main` through **Publish browser game** to update the website, then prepare offline play while connected.

## Version 0.43.0 — Online character screens and the company hall

- Online entry follows account sign-in → the shared single-player character selection/creation screens → a dedicated online lobby. Clicking a saved online character or finishing online creation enters the lobby; it does not start a game or load a local character.
- The online roster uses the existing eight-character, two-column selection screen, equipment preview, deletion confirmation and full-screen camp creation scene. A compact region badge sits beside the roster. Region is a local preference shown to friends, not a dedicated regional server or character shard; gameplay still runs in the host browser.
- The company hall has separate Friends and Create/Join panes, friend codes/requests, host approvals and a small selected-character panel in the bottom corner. In-game settings, character creation controls and the large roster preview do not occupy the lobby. Joining remains restricted to accepted friends and host approval.
- Fixed online Escape/settings sizing and overlay order, compacted the online options sheet, and made Escape return from Settings to the pause menu before resuming. Save & return to lobby waits for the online save. Single-player options retain their font samples and practice tools.
- No additional database migration is needed beyond the existing account migration 002. Redeploy `main` through Publish browser game to update the website.

## Version 0.42.0 — Accounts and the online realm

- Username/password account registration, login, remembered sessions and sign-out. Passwords are handled by Supabase Auth; the browser stores session tokens, never passwords. Existing anonymous friends identities can secure the same identity with a username/password.
- Separate account-backed online character roster: fresh creation, level/equipment portraits, live character preview, eight entries per page, up to 20 characters, name-confirmed deletion and a dedicated friends/company tab.
- Hosting or joining a browser online company requires an owned online character. The host loads an approved guest's canonical account character. Local character imports cannot become online characters.
- Online progress, gear, skills, quests, gold and personal stash save to the account. Owner checks, revision checks and a session lease prevent stale writes and opening the same character twice. Leaving waits for the latest account save; failed saves retain the working character in the tab for retry.
- Single-player/Classic LAN characters and options stay local. Online play uses a separate save route and personal stash; local shared pages and local imports cannot transfer online equipment. Leaving online play restores the previous local character without replacing it.
- **Existing Supabase projects need migration 002 and Email/password settings updated before deployment.** Follow [online account setup](docs/online-accounts.md). Keep the existing public GitHub variables, run `002_accounts_online_characters.sql`, enable Email/password and signups, and disable email confirmation for this username-only design. Then redeploy `main`.

## Version 0.41.0 — Display names and browser-hosted friends

- Added a friends ledger with display names, unique friend codes, incoming requests, online/hosting status, rename and remove controls. Friends request to join a host; an on-screen badge leads to Accept/Decline. No invitation text needs to be exchanged.
- Browser hosts run the shared simulation and save host records in IndexedDB. Real WebRTC data channels carry characters, combat, chat, parties, private loot and atomic town trading. The classic Node LAN launcher remains available.
- Added private Supabase database tables and checked RPCs for identity, friends, presence and signaling, plus an optional short-lived TURN credentials function and a manual GitHub Pages deployment workflow.
- **The online service is not configured yet.** Complete the one-time [browser multiplayer setup](docs/browser-multiplayer.md) to enable it. After setup, players only open the HTTPS website. This repository contains no provisioned Supabase project or TURN relay.
- Display-name identities and characters stay in the current browser; no email/password is required. Different browser/site addresses have separate identities. Character export/import remains available under Classic LAN / Character transfer.

## Version 0.40.0 — Local multiplayer

- Host up to eight players on one computer; other desktop computers on the same Wi-Fi connect in their browsers. Shared seeded areas, visible equipped characters, enemy health, boss attacks and deaths run through the local host.
- Bring existing single-player characters, including their equipment, skills, quests and personal stash. Export/import files let characters move between the downloaded game and the LAN address without replacing other characters.
- Company and party text chat, invitations, party health frames, leader removal and nearby shared kill credit. Every eligible party member receives private item and gold drops; other players cannot take them.
- Town trading exchanges backpack items and gold together after both players confirm. Changing either offer resets confirmations. Full packs, cancellation, disconnects and failed host saves preserve ownership. The host journals character belongings to recover the latest committed exchange when an older export reconnects.

## Host and join a LAN game

1. Extract the complete game ZIP on the host computer and install **Node.js 20 or newer**. Players joining need only a desktop browser.
2. On Windows, double-click **`start-lan.bat`**. On macOS/Linux run **`./start-lan.sh`** from a terminal. Alternatively run `node server/lan-server.mjs` (or `npm run lan`). No dependency installation or build is required for the downloaded release.
3. Keep the host terminal open. Allow Node on the **private network** if the firewall asks. The host opens **`http://localhost:8787`**; friends open the host's Wi-Fi address printed in the terminal, such as `http://192.168.1.20:8787`. Use the same Wi-Fi, without guest/client isolation. No port forwarding is needed.
4. Choose **Local multiplayer** on the title screen, select or import a character, and **Create LAN game**. Friends refresh the company list and **Join**. A company can have an optional password.

### Bring a single-player character

Open the updated HTML at the same filename and location used for your existing saves, in the same browser. From **Local multiplayer**, choose the character and **Export character**. Open the LAN address, choose **Import character**, then confirm the import. Browser saves belong to their address, so the downloaded file and LAN page have separate character lists.

After playing, press **P → Save & leave LAN game**, then export from that page. Import the file in the original downloaded game and choose **Update matching character**. This updates that loyalist's progress and belongings while preserving other characters and shared stash pages. Personal storage travels with the character; shared stash pages stay in their original browser.

### Chat, parties, loot and trading

- **Enter** opens text chat; choose Company or Party, type and press Enter to send. Escape closes it. **P** opens the company roster. Invite another player, who accepts through their own roster. Party leaders can remove members; anyone can leave.
- Nearby party members in the same area share kill credit within 30 tiles and roll their own drops. Gold still auto-collects. Players outside your party keep their own kill credit. Ground loot belongs to its recipient and lasts for that host session.
- To trade, meet in **Emberfall**, within five tiles. Open P and choose **Trade**. Your partner accepts; both characters' belongings then lock until the trade ends. Select up to 12 backpack items and an amount of carried gold, click **Update offer**, review the partner's items, and both **Confirm offer**. Offer edits clear both confirmations. Equipment and personal stash items must be moved into the backpack first.
- Menus do not pause a multiplayer world. Practice/god-mode and dungeon regeneration controls are unavailable during LAN play. Save and leave before returning to solo.

The host keeps committed character records in **`.lan-data/characters.json`**. Keep this folder with the game and include it in backups. Closing the host ends its companies; start it again to create a new session. Character belongings persist, but enemies, rooms and uncollected ground loot reset. The LAN host is intended for trusted friends using their single-player characters.

For development, `LAN_PORT`, `LAN_DATA_DIR` and `LAN_GAME_FILE` override the port, save folder and served HTML. Run `npm test` for unit checks; with a running host, `LAN_TEST_URL=http://127.0.0.1:8787 GAME_URL=http://127.0.0.1:8787 npx playwright test tests/browser/lan-multiplayer.spec.js` checks two browser clients, private loot, chat, trading and character transfer.

## Version 0.37.0
- All equipment families have level and attribute requirements: light gear, heavy armour, agile weapons, caster weapons, jewellery, sets and boss trophies. Attributes display a base of 10 plus allocated points and origin bonuses. Might supports heavy gear, Dexterity agile gear, Will caster gear and Vitality belts/heavy plate; higher-level bases require more investment. Every origin can use its starting sword and shield.
- Right-click, double-click and drag-to-equip enforce the same rules. Tooltips show each requirement and the character’s current value, highlighting unmet values. Existing inventory, storage, vendor stock and equipped gear receive requirements. Ineligible equipped items stay recoverable in their slots, marked inactive; they grant no stats, set bonuses, model layers or weapon attacks until their requirements are met. Character levels, allocated points and items are preserved.
- Defense now uses the Diablo II weapon hit formula: `AR / (AR + Defense) × 2 × Attacker Level / (Attacker Level + Defender Level)`, clamped to 5–95%. Applied to player and enemy weapon attacks. Defense no longer reduces damage from landed hits. Shields check block separately; spells, area hazards and damage over time bypass the weapon accuracy roll. Dexterity and accuracy affixes increase attack rating. Evasion bonuses now increase defense rather than making a second avoidance roll.
- Added a character-sheet defense explanation, attack rating, equal-level hit-chance estimate, and target hover information. Inactive weapons correctly use bare hands and cannot power weapon techniques.
- Magic gear rolls one prefix and one suffix; higher rarities have larger affix budgets, without duplicate stats. Added regeneration suffix tiers, increased life regeneration, life/mana on kill, accuracy and defense affixes alongside existing mana regeneration, leech and skill modifiers. Commons remain unenchanted. Affix names/types appear in tooltips; fractional mana-regeneration rerolls preserve base contributions and recovery on kill respects reserved mana.

## Version 0.36.0
- Restored **The Last Herd** as Act I’s first quest: save Elin’s sheep from six risen royal soldiers in the fenced pasture. The journal, opening objective, Maelin’s changing dialogue and prologue now explain why the usurper’s army is starving the refuge. Expanded all six quest stories to connect Hadrin, Oswen’s grain levy, the thorn rituals and Edrin’s capture. Completed quests and partial pasture kills migrate without losing progress; gates still allow exploration without an errand requirement.
- Replaced enemy body rotation and compression with 42 separately painted death frames: six anatomical fall poses for each of the six enemy families and the thornbound boss. Skeletons leave exposed bone corpses and fallen equipment; flesh enemies leave prone bodies; chanters leave collapsed robes. Frames load during area preparation, share compact atlases and keep the existing bounded remains system.
- Martyr’s Pyre (the Righteous Fire style skill) applies continuous fire damage to the player through the damage handler. It burns for 30% maximum life per second before fire resistance and self-burn modifiers, ignores dodge, and can kill an unsustained character. Fire resistance, regeneration and flasks matter. Tooltips show self fire damage after resistance; god mode prevents it.
- Added curved glass reflections, edge refraction, liquid highlights and a self-burning rim to the life and mana globes. Replaced native stash number spinners with matching metal-and-brass arrow buttons; direct numeric entry and Shift-click increments remain available.
- Aligned the granary’s field gate with its travel threshold, cleared its wagon-road approach, joined it to the fence, and corrected its ground anchor. Arrival walks through a matching gate into the fields; fountain and supplies sit away from the opening.

## Version 0.35.1
- Enemies and bosses collapse into grounded corpses using their existing painted sprites. Flesh enemies leave dark blood pools and directional droplets, skeletal soldiers scatter bone fragments, and spirits dissolve into ash.
- Hits produce brief splashes; death produces a larger burst. Boss remains are larger. Fallen bodies and stains stay in their area when you return during the same session, and never block movement or item pickup.
- Player deaths show the equipped character falling before the revive menu fades in. Combat stops immediately; returning to town and reviving still work normally.
- Corpse counts, stain counts, particles and shared artwork caches have fixed limits. Terrain stays cached, distant remains are culled, and reduced motion removes particle sprays and animated falls. Remains are visual session state, not additional save data.
- Fixed older non-campaign character saves attempting to resume an unavailable dungeon object after character selection.

## Version 0.35.0
- Multiple independent character saves with automatic import of the previous single-character save. Creating a character preserves existing characters, their equipment, skills, quests, dungeon seeds and personal storage.
- Added a gothic character selection screen: two columns, eight characters per page, equipment portraits, a live selected-character preview, keyboard navigation, and create/delete/play controls. Deletion requires the character’s exact name; shared storage survives deletion.
- Stash opens as a separate left-hand inventory sheet with equipped gear and the backpack on the right. One personal page and three shared pages each have a 10×10 grid. Shared pages transfer equipment between characters; stored gold remains personal.
- Drag between grids, Shift/Ctrl-click to transfer, or right-click a stored item to withdraw it. Each page retains its own arrangement. The layout fits 1280×720 through larger desktop viewports.
- Character archive writes preserve previous data on storage failure and reject stale writes from another tab. Restricted browsers can keep multiple characters for the current session, with an explicit storage status. Existing single-save data remains compatible through an active-character copy.

## Version 0.34.1
- Rebuilt interior boundaries as connected, full-height stone walls attached to the exact floor edges on all four sides. Removed detached barricade blocks, giant oval wall shadows and exposed platform skirts. Foreground wall segments cut away near the player.
- Added room dressing: weapon racks, stores, fallen arms, royal banners and sconces in Marchgate; ossuaries, urns, candles and recessed wall niches in the redoubt. Wall geometry and decorations are prepared during loading and cached.
- Marchgate now starts at the entrance threshold with a short automatic walk inward, instead of appearing 21 tiles past the gate. Clicking a dungeon entrance walks to its threshold before transitioning; re-entering on foot also uses the entrance. The gate remains solid with a local cutaway where it obscures the guard.

## Version 0.34.0
- Focused the playable campaign on Act I: three regions and six combat quests, ending with Edrin’s rescue. Later acts are removed from travel, quests and the world map. Existing characters, items and old campaign history are preserved.
- Marchgate alone uses the monumental kingdom gate. The granary uses a wooden field entrance; Aldren’s redoubt uses a chapel crypt entrance. The regional map now shows the seven Act I locations.
- Distinct cached floor materials for Marchgate’s courts and slate halls, the granary’s stubble, muddy wagon lanes and barn boards, and the redoubt’s cracked burial slabs and inlaid sanctum. Blackthorn has a separate root-strewn forest floor.
- Expanded both later approaches to 128 squares. The granary has seven work yards and divided fields; the new 152-square chapel crypt has six connected wings and optional burial chambers. Two named veterans occupy each stronghold.
- Slower experience progression, diminishing experience from outleveled enemies, gentler equipment scaling, and separate enemy/loot tiers. Bosses no longer award bonus mastery points. Leveling still grants one mastery, one passive and five attributes; Might adds 0.4 weapon damage per point.
- Regional enemy levels are 1/5/9 outdoors and 3/7/11 in strongholds. Boss health is roughly 1,900/3,800/6,100, with faster movement; Hadrin, Oswen and Aldren have different attack themes. Existing overleveled characters are preserved; a new character gives the intended progression curve.

## Version 0.33.2

- Building, gate and farm structure shadows follow their painted foundations instead of detached oval blobs. Contact shadows are softly blended and cached, with no shadow work repeated for unchanged structures.
- Reduced the stash chest to 64×48, reduced its ground patch, and matched its click target to the smaller chest.

## Version 0.33.1

- Removed **F** interaction. Click characters, objects and item labels to talk, travel or pick up loot. The nearby interaction button remains clickable, and world prompts and the control guide now describe mouse actions.

## Version 0.33.0

- Six distinct common-enemy sprite families: skeletal spearmen, wolfhide axe raiders, undead crossbowmen, heavy levy butchers, robed thorn chanters and powder bombardiers. Combat roles and Act I quest enemies select matching bodies and weapons.
- 48 new painted frames cover front/rear views, alternating walking strides and attacks. Left/right reflection supplies four facing directions. Movement drives gait by distance travelled, with measured foot anchors and bounded frame caching. Weapons are painted into their wielders rather than added as floating line overlays.
- New sprites are embedded in both offline HTML files. Existing characters and boss artwork remain compatible.

## Version 0.32.0

- **2** drinks a mana flask. It uses 20 of 100 charges, restores mana over three seconds, gains charges in combat and regenerates slowly. Click its blue HUD bottle as an alternative. Recovery respects mana reserved by auras.
- Fixed passive atlas node graphics and click targets. Select a connected node and click **Inscribe**; allocation works with the captured cursor and persists in saves.
- Act I now has exactly six combat quests across three regions: **The Dead on the Kingsroad / Ruined Marchgate**, **Break the Levy / The Tithe Granary**, and **Silence the Thorn Choir / The First Fallen Knight** in the new **Blackthorn Hollow**. Defeat three warband leaders on each approach and its stronghold boss. The Last Herd, winter provisions and document-fetch quests are removed from Act I. No errands block travel. Aldren’s defeat frees Edrin and ends the act.
- Previous Act I saves map their fourth chapter to the new final region; defeated knights and later acts remain intact. Old Act I fetch items leave the pack. Existing unfinished field-account objectives are replaced with combat objectives.
- New material-specific paintings distinguish cloth hoods, sallets, great helms, leather/iron gloves and boots, and round/kite shields. Marchgate columns now use weathered stone artwork. Ground contact shadows, building foundations and farm sprite anchors tie structures to their terrain.

## Version 0.31.0

- Click any Q, W, E, R, LMB or RMB skill box to open a painted ability grid. Choose a learned skill, restore basic mouse attacks, or clear a keyboard slot. The Masteries page also has six clickable destination boxes; assignment dropdowns are removed.
- Both mouse attacks are configurable and saved. LMB uses the selected skill against enemies, clicks ground to walk, and Shift-click attacks in place. Holding a mouse button repeats attacks without repeatedly toggling auras.
- New original carved gargoyle, iron and bronze artwork surrounds the live life and mana globes.

## Version 0.30.0

- Press **N** for the Loyalist’s Chronicle: 25 achievements with progress tracking, one-time unlock notifications, cosmetic renown and selectable earned titles. Includes Minecraft-style milestones and playful references such as “Getting an Upgrade,” “Passive Aggressive,” and “Definitely Not the Cow Level.” Progress is stored per character; existing saves receive earned milestone credit.
- Four original six-piece sets (24 new items): The Last Kingsguard, The Ashen Vigil, Gravebloom Covenant, and Vestments of the Stormwarden. Each has unique item paintings and separate front/back armor artwork, visible piece by piece on the animated hero.
- Sets grant cumulative bonuses at 2, 4 and 6 distinct identified, working equipped pieces. Duplicate or broken pieces never inflate the count. Green set drops appear from area level 2 onward; later sets unlock at levels 4, 7 and 10, with better chances on elites and bosses. Scrolls and Edrin can identify them.
- The collection remembers discovered pieces after trade or storage, shows which are currently owned/equipped, and previews every set’s appearance and bonuses. Tooltips include set membership and active tiers. Existing characters and ordinary loot remain compatible.

## Version 0.29.0

- Click a visible ground-item label to approach and collect it. Gear uses label clicks; gold still collects automatically when walked over. Labels render above scenery, separate into rows when overlapping, and remain visible for the selected pickup. Full packs leave drops on the ground; manual movement cancels the approach.
- Outdoor areas have occasional scattered chickens with original cream/russet running sprites, safe roaming and deterministic placement. Nearby chickens grant the requested hidden, non-stacking damage and mana recovery benefit without changing the character sheet or adding buff icons.

## Version 0.28.0

- Replaced the simple empty-slot outlines with nine original stone-carved equipment impressions: helm, amulet, sword, cuirass, shield, gauntlets, belt, signet and boots.
- Muted impressions and discreet slot labels distinguish empty sockets from equipped colored item art and match the guardian relief. Both ring slots use the same signet engraving.

## Version 0.27.0

- Backpack expanded from 10×4 to 12×6: 72 cells, 80% more space. Existing items keep their positions and overflow is recovered when space allows.
- Inventory is wider, with smaller spaced equipment sockets revealing the guardian relief. The pack, wallet and controls fit the same desktop sheet; traders use the matching layout.
- Picking up items while inventory or a town service is open now refreshes the visible pack immediately. Items no longer wait for a move or drop to appear.

## Version 0.26.0

- All 30 mastery disciplines now have distinct painted skill icons, plus new basic attack, punch, flask, evade, portal and empty-slot artwork. The same paintings appear in the HUD, masteries, skill details and binding picker.
- Inventory equipment sits over a custom carved guardian relief, with dark readable sockets. Original raven-and-crown title artwork decorates inventory, stash, shops, character and mastery menus; character and service panels share the new stone artwork.
- The 36 paintings use one cached 768px atlas. Decorative art is static, bundled offline and leaves equipment hitboxes and square pack cells unchanged.

## Version 0.25.0

- Personal stash now uses a weathered oak and iron chest sprite.
- Scrolls of Insight stack to 20 in one cell, with quantity labels, automatic merging on pickup/purchase/transfer, and drag-to-combine. Existing saves compact safely; identification consumes one scroll and selling prices the full stack.
- Framed menu button labels are centered, with the pause shortcut separated from the label.
- Options includes four offline font trials: IM Fell English, EB Garamond, Cormorant Garamond, and Uncial Antiqua. Compare them live or open `font-samples.html` for a separate interactive sample sheet. Font licenses are in `src/fonts`.

## Version 0.24.0

- Waypoints are now weathered gothic fountains with carved tiers and gargoyle spouts. Clicking a dormant fountain awakens its animated water and saves its travel attunement; click again or use G to travel. Walking past a fountain no longer activates it.
- Activation persists across reloads, and previously attuned regional waypoints remain active. Emberfall stays available as the starting travel destination; its fountain starts dormant until first used. Chapter-specific fountains now display their own saved state correctly.

## Version 0.23.0

- Original iron-and-bronze tracery frames skill slots, mastery icons, inventory/service folios, quest seals and pause/options menus. The two small vector borders scale with panels, remain transparent over content, and do not intercept input.
- Cursor capture now starts at the visible pointer position instead of a stale screen-center coordinate. Relative mouse movement is calibrated to CSS pixels before capture to account for browser/display scaling. Fractional coordinates are retained, screen-edge clamping has no accumulated overshoot, and dragging the passive atlas continues beyond its edge.

## Version 0.22.0

- Measured grip/tip anchors for all 16 weapon paintings replace shared offsets. Weapons rotate around their handles; posed painted arms, gloves and fingers meet the grip. Two-handed weapons receive a supporting hand and empty weapon slots retain bare hands. Equipment and directional movement remain layered and cached.
- Eight armed attack poses now have windup, strike and recovery. Weapon family and attack speed set animation timing; melee damage, slash trails and ranged release occur at the strike. Skills accept a short input buffer near the end of recovery; dodge cancels pending basic strikes. Softer enemy hit flashes, restrained sparks and a single level-up notice improve readability. Attacking an overlapping enemy no longer loses its aim or misses at zero distance.
- Bosses use four named moves per theme, including telegraphed weapon cleaves, expanding waves, delayed seams, charges and lingering fields. Cleaves hit only their shown sector; waves hit at the moving ring; attacks leave casting/recovery windows. Enraged phases increase pattern pressure. The original crypt Warden also uses special attacks.
- Each campaign boss’s first victory drops an unidentified, named **magic weapon trophy** matching its weapon/theme, in addition to ordinary loot. Trophies have two enchantments and identify normally; these are not guaranteed legendaries. Boss defeat records prevent repeat trophy rewards. Their origin appears after identification.
- Darkened stone folios, worn iron skill frames, clearer mana-starved abilities, revised orb fittings and a more legible boss frame bring the UI closer to the world’s muted palette. Boss bars mark health phases and show the current move or weapon. No new runtime art files were added.

## Version 0.21.0

- Strongholds admit you without livestock, wagon provisions or field-account errands. Those quests are optional rewards and lore; their order is flexible. Main objectives and journal text point toward the garrison and its commander. Boss victories still advance chapters.
- Replaced the old procedural spider-like crawler with the painted undead soldier body and matching hitbox. Regional pursuers retain their lunge/venom behaviour and receive fitting names.
- The Atlas of Oaths now has **469 connected nodes**, 18 outer constellations, six cross-discipline passages and **12 keystones**. Engraved discipline symbols, constellation rings, jump controls and an overview make the atlas easier to explore. Old node IDs, allocations and point balances remain intact.
- Six new crown keystones alter skills or resources: longer blade processions, additional suns, frost projectile fans, extra thunderbolts, life for mana and spell ranks for higher costs. Each has a stated tradeoff.
- Added three level-12 arts, each requiring 12 points in its mastery: **Procession of Blades**, **The Falling Sun** and **Choir of Ruin**. Spectral orbiting swords, a delayed 950%-base fire strike and eight staggered thunderbolts have distinct effects and three specializations each. These attacks use substantial mana and cast cadence, with no cooldown. Recasting blades refreshes the single procession. Crown passives combine with specializations.

## Version 0.20.1

- Town ground now uses gritty earth, moss and worn dirt paths instead of the old blurry stone tiles. Native-detail viewport caching covers both the campaign town and older saves without increasing the whole forest terrain cache.

## Version 0.20.0

- Offensive skills have **no cooldown**. They spend mana and share an attack/cast cadence, so holding a key repeats the skill without firing every simulation tick. Basic attacks remain free. Inner Furnace, Will, regeneration affixes, mana leech, mana gained on hit and cost reduction support sustained casting.
- There are **15 active skills**: 12 attacks and 3 sustained auras. Added Riven Strike (bleeding), Rime Lance (chill/shatter), Thunder Spear (shock/splash), Oathbound Guard and Ember Trance. Guard reserves 25% mana; Trance reserves 30%. Auras have a short two-second reactivation lockout after deactivation, reduced by Temporal Flow. Martyr’s Pyre retains life-based self-burning and safety extinction.
- **13 skills have three specialization choices each**, unlocked at invested rank 2. Choices change actual projectile count, chain jumps, mana cost, area, damage, burning, self-burning, leech or mana return. The skill sheet shows effective rank and cost; gear does not unlock an unlearned skill.
- Added the **187-node Atlas of Oaths**: six connected disciplines, travel nodes, notables and six keystones with tradeoffs. Search, drag to pan, wheel or buttons to zoom, inspect a node and allocate from a connected path. Refunds cost five gold and cannot disconnect another allocated node. Every level grants **one mastery point, one passive point and five attributes**. Existing characters receive their earned passive points once; existing skills and gear remain.
- Passives support physical/elemental/spell damage, critical damage, bleeding, burning, chill, shock, area, duration, block, life, mana, regeneration, leech and skill ranks. Attack life leech and direct-hit mana leech recover over time, capped at 8% maximum life/sec and 10% maximum mana/sec. Damage over time does not repeatedly trigger leech or on-hit recovery.
- **16 weapon bases** have distinct painted inventory art, including daggers, greatswords, mauls, flails, staffs, wands, bows, crossbows, battle axes and sceptres. Caster weapons grant spell power; ranged weapons fire aimed basic projectiles. Equipping two-handed gear returns incompatible equipment to the pack atomically, and fails without changing equipment if the pack is full.
- Ordinary equipment rolls through early Act II are about **73% common, 26% magic, 0.8% rare and 0.02% legendary**. Rare equipment rolls rise to 3.5% in mid Act II, 8% later in that act and 11% in later acts. Legendary equipment rolls remain 0.02–0.08%; bosses double that small chance and guarantee at least magic equipment. These are chances per equipment roll, not per enemy kill.
- Mana regeneration, life regeneration, leech, mana gained on hit, skill ranks and cost reduction are weighted magical affixes rather than common-item rolls. Skill-rank affixes start in mid Act II. New legendary weapon and accessory properties support caster, leech, critical and bleeding builds. Old items retain their rolls.
- Added elemental projectile trails, cast motes, bleeding marks, frost fragments, sustained aura sigils and themed boss windups/impacts. Boss attack circles show a filling timing perimeter. Effects and damage text have bounded budgets; Performance quality reduces decorative particles.
- Dungeon layouts use the character’s saved seed. Marchgate varies chamber dimensions and positions, corridor widths and routes, barracks connections and side loops while preserving the monumental south-facing entrance. **Options → Regenerate dungeon layouts** advances a saved layout revision, clears dungeon instances and loose loot, and rebuilds the current dungeon at its entrance. Equipment, character progression, completed quests and defeated bosses remain intact; the overworld stays in place.
- Options also includes **God mode, Infinite mana, Free build allocation and 0.1×–10× outgoing damage** for testing. Testing toggles reset on reload. Build edits made while testing remain part of the saved character; passive connections still apply.

## Version 0.19.0

- Replaced primitive fences, signposts, lanterns and sheep with weathered, semi-realistic painted art. Roadside arrows and lantern brackets face along their road segments.
- Click a sign to read its directions and dry humour in a text-only popup. There are no floating sign labels or conversation buttons; Escape or clicking away closes the reading.
- New olive turf, moss, leaf litter and muddy road textures replace the opening forest’s stony ground. Low grass clumps share actor depth ordering and cover boots as you walk through them. A viewport cache preserves fine surface detail without retaining full-resolution terrain for the whole forest.
- Discovered roads form clear, continuous lines on both the minimap and Tab automap. Unexplored routes stay hidden.
- Elin’s pasture holds 22 sheep with natural proportions and coarse wool. They pause to graze and wander between nearby destinations; their movement is constrained inside the fence, including at the open entrance.

## Version 0.18.0

- Renamed the game **The Forgotten Kingdom**. The new title reads: “The king is dead. The oath remains.” The painted title landscape and story replay remain available.
- The opening Kingsroad is now a 224×224 forest. Emberfall has one east exit. Roads lead to Elin’s fenced livestock pasture, the stolen levy wagon, a watch camp, the forest waypoint and a much more distant Marchgate. Signposts and lit lanterns mark the routes.
- Identification scrolls are individual one-cell pack items. Right-click a scroll and click an unidentified item, or drag it onto the item. Escape cancels targeting. Purchases require pack space; old saved scroll counters migrate into physical items without losing scrolls.
- Recovered quest objects now have distinct names, shapes and inventory items: patrol orders, ledgers, charts, keys, seals and other chapter-specific objects. Winter provisions take a two-by-two space and leave the pack when returned to Maelin. Chapter tokens are archived after their boss falls.
- Bosses have more health and move and attack faster. Dungeons have a larger player light radius and visible ambient detail beyond it instead of pitch darkness.
- NPC conversations use consistently spaced text, aligned quest marks and plain rectangular buttons.
- Offline rendering caches lighting, fence segments and nearby scenery. The larger forest’s prepared terrain uses about 40 MiB. Balanced quality adapts world resolution when frames are slow; the interface stays sharp. Simulation advances in small steps to keep movement, attacks and recovery at their intended speed.
- The portable file is now **forgotten-kingdom.html**. The old **ashen-reliquary.html** filename remains an identical compatibility copy, and existing saves and settings are retained.

## Version 0.17.0

- The prologue now uses a wide 2.35:1 image frame with clean black letterboxing and small white subtitles beneath the artwork. Existing sepia illustrations are reframed for this composition.
- Scenes and sentence captions advance automatically, with simple image fades. Removed visible headings, buttons, progress bars and scene dots. **Escape** skips the prologue into town, or returns a story replay to the title menu.

## Version 0.16.0

- Enemies pursue and strike more reliably, ranged enemies lead moving targets, and bosses use faster patterns and a more aggressive second phase. Reduced automatic player damage and boss health to keep encounters active instead of relying on large health pools. Armour still helps, with less overwhelming damage reduction.
- Each level grants **one mastery point and five attribute points**. Previously earned and invested points remain intact.
- All terrain is prepared behind the loading screen, including indoor dungeons. A limited light radius makes dungeon surroundings dark; the automap still reveals through exploration.
- Widow’s Fields has new farm ground, wheat, orchard trees, hay, wagons and scarecrows. The Tithe Granary is a procedural open farm compound with a timber entrance, barns and grain stores, with its own harvest-themed boss attacks. Crows, hens and dungeon rats add quiet movement.
- Continuing from the menu always places the loyalist in Emberfall. Press **T** in town to open the departure menu and return to the expedition.

## Version 0.15.0

- Marchgate now stands across a longer forest road in a 128×128 opening wilderness. Town exits lead directly into nearby encounters. Optional errands reward saving Elin’s livestock and recovering the stolen winter provisions; they no longer block the gate. Quest progress and rewards persist.
- Inventory inspection has no equip/keep action bar. Right-click to equip or unequip, drag onto the equipment figure to equip, drag onto the playfield to drop, or drag into the trader’s sheet to sell. Shift-click sells at the merchant; Alt-click identifies. Dropped equipment stays on the ground until picked up by clicking its label.
- Early loot is mostly common gear; early body armour strongly favours leather and excludes plate. Rings and amulets are much rarer than chest armour. Later drops introduce heavier armour and stronger tiers.
- Masteries use an engraved tiered folio with selectable skill details and bindings. The character folio shares the inventory’s stone-and-iron frame, with an equipped portrait, attributes and grouped combat statistics.

## Version 0.14.0

- Removed the female character option and its art from the game for now. Existing female saves use the male model while retaining their progress and equipment.
- New characters start with only the service sword and buckler equipped. Body armour, helmet, gloves and boots start empty; the camp preview uses this same starting loadout. Earned equipment remains on existing characters.

## Version 0.13.1

- Repainted the female guard with a leaner silhouette, a defined waist, slimmer limbs and smaller shoulder plates. Leather, mail, plate and robes now have fitted panels and waist shaping suited to her build while keeping the worn royal-guard materials. Existing female saves use the updated artwork automatically.

## Version 0.13.0

- Character creation now offers male and female loyalists with a live camp preview. The female guard has her own painted equipment atlas, tied-back dark hair and a hooded starting look.
- Female movement, armed attacks, punches and equipment changes use her artwork. Character choice survives saving and reloading; older characters retain the male appearance and both choices have equal starting stats.

## Version 0.12.3

- The offhand arm now uses exposed arm artwork fitted to its shoulder, elbow and wrist instead of artwork obscured by the shield. Removing the shield leaves the arm and glove connected in front/rear views, walking and attacks, with the equipped armour material.

## Version 0.12.2

- Simplified walking to alternating vertical movement of the intact painted legs. Both walking boots use the idle right boot, mirrored on the left, without joint bending, toe shearing or arm swings.

## Version 0.12.1

- Walking boots now share the same toe direction instead of retaining the standing artwork’s separate foot angles. The ankle remains anchored to the shin, including mirrored and intermediate facings.

## Version 0.12.0

- The original painted guard now walks with a narrow stance, sixteen walk frames and sixteen directional poses. Idle retains its wider stance; equipment and combat artwork remain supported.
- Gold piles from defeated enemies have clearer coin graphics and labels. Walk over them to collect gold automatically; collected gold is saved immediately.

## Version 0.11.1

- Cleared scenery, timber fences and debris from the entire Marchgate gate apron; moved the supplies away from the approach.
- The interior now shows a full-size inner gatehouse behind the arrival point. Arrival follows the same northward direction as the exterior approach, with the return passage at the far end of the gate tunnel.
- Quest symbols use rough, chipped slate and muted bone-white markings. The quest window shares the inventory’s stone and iron styling and opens as a compact popup over live gameplay with J or its close button.

## Version 0.11

- Cursor capture uses Pointer Lock and a clamped, skinned virtual cursor for both mouse buttons, world aiming, item inspection and inventory actions. Ctrl+Esc releases it; the capture button near the minimap restores capture. Browsers reserve Escape as an additional release. Capture on entry can be disabled in Options, and unsupported browsers retain normal mouse controls. Text fields and native selects release capture for editing.
- The first Marchgate approach has a new monumental gatehouse, walled forecourt and forest approach. Inside is a 144×144 fortress with sixteen connected spaces: a long barbican, gatehouse, outer and inner courts, barracks, stores, cells and Hadrin’s command keep. Other strongholds retain their seeded layouts.
- J opens an illustrated quest book with six quest seals per act, act tabs, active/completed/locked states, objectives and recovered accounts. Quest topics in conversations show an exclamation mark and offer the quest book directly.
- Prologue controls now share the main menu’s sculpted iron-and-brass frames.

## Version 0.10.1

- All six prologue scenes now use sepia ink, rough cross-hatching, muted washes and weathered golden parchment, following the supplied visual reference. Each illustration fills the screen and fades in as one image; there is no drawing-on effect or framed cutout.
- The original story and optional captions, narration, pause and skip controls remain. Artwork is packed into the offline file (about 9.7 MiB for v0.10.1).

## Version 0.10

- Original illustrated crown-and-stone title logo, ruined-kingdom backdrop, subtle drifting mist and embers. Title effects stop when leaving the screen and respect reduced-motion settings.
- Painted iron-and-brass button frames across title, creation, pause, conversations and service menus. Text remains readable and accessible to keyboard navigation.
- Orrin and Garran open a separate service sheet alongside your full equipment and 10×4 backpack. Their item ledgers use six-item pages with previous/next controls; stock, buyback and equipped forge candidates do not scroll.
- Trading, inventory shortcuts and forge actions remain available while both sheets are open. Pages stay bounded after transactions, and Escape closes both sheets together.

## Version 0.9

- Walking uses separately jointed thighs, shins and feet, a planted stance, lifted recovery, longer directional strides, slight torso movement and depth ordering. The painted guard and original armed combat sheet are retained.
- Unarmed attacks use a six-pose elbow-driven jab and a closed fist, with the hit timed to extension. Gloves use fitted wrist landmarks and material details; the offhand glove sits behind the shield.
- Character creation is a camp scene with one male loyalist, a name and Begin journey. Calling and surcoat cards have been removed. Existing saved origins and attributes remain compatible; skills are still learned through all three masteries.
- Leather jerkins, mail hauberks, plate cuirasses and cloth vestments have separate painted inventory cutouts. Their visual family follows the same equipment look used by the player model, including legacy item names.
- Wilderness edges use visible timber barriers, a forest-floor backdrop and trees beyond the playable boundary. A solid garrison gate blocks walking through the keep arch; click the gate from the road to approach and enter.
- Click navigation uses diagonal routes with body clearance, no corner cutting, straight-line smoothing and reachable ground selection at blocked edges. Movement clamps to waypoints to prevent overshooting. World projection now aligns actor feet and click coordinates with the ground.

## Version 0.8

- Emberfall has roughly twice the enclosed ground, widely spaced services, an open central square, and four gates into the continuous wilderness. The legacy town uses the same expanded layout.
- Five acts now contain **four chapters each**: twenty approaches and twenty larger strongholds. Recover a field account before breaching each stronghold, defeat its commander, then read the aftermath to continue. Each province ends with its fallen knight. Act V ends with Brennan, Vaelor and the Wanderer.
- A saved **quest journal (J)** develops the coup through intercepted orders, witnesses, prisoners and the knights’ failures. Three commanders precede each knight; Edrin is rescued in Act I’s third chapter. Stage-specific waypoints and progression persist. Old saves retain defeated knights and unlocked acts.
- Fifteen named enemy variants across five regional rosters add spearmen, hounds, arbalists, drowned levies, witches, furnace troops, bombardiers, penitents, cantors and royal executioners. Painted archetypes share assets, with faction equipment overlays and different attack behavior: ranged bolts, delayed bombs, lunges and heavier melee attacks.
- The seven principal bosses use distinct alternating attacks, marked danger zones and stronger second phases. A dedicated boss bar shows the encounter name, health, phase and current named ability.
- Empty hands use a short, faster, single-target **punch**, shorter reach, a jab animation and fist icons. Sweeping Cut and Whirling Guard require a weapon.
- The interface uses darker leather, stone grain, worn iron borders and muted rust/brass colours across masteries, character screens, conversations and equipment services.
- A loading screen prepares the entire outdoor terrain and static scenery before play. World scenery stays visible; only the automap and enemy discovery depend on exploration. Outdoor ground uses half-resolution cached chunks to keep the complete region within a practical desktop memory budget.

The requested **two hours per act, with longer acts approaching four hours, remains a pacing target**. The new chapter content and progression are implemented, but those durations have not been established by human playtesting. There are no timers, mandatory waiting periods or repeated-kill quotas. Further encounters, bespoke area art and balance passes are needed to substantiate that playtime.

## Controls and shortcuts

| Action | Input |
| --- | --- |
| Move | Click / hold open ground; arrow keys; optional WASD in Options |
| Assigned left attack | Left-click an enemy; hold to repeat; optional keyboard alternative attacks in place |
| Strike in place | Shift + left click on the world |
| Selected mouse ability | Right click / hold; optional keyboard alternative |
| Main abilities | Q/W/E/R in click mode; Q/E/R/F in WASD mode; customizable |
| Assign ability | Click a skill, LMB or RMB box, then choose an ability; or click a destination box in Masteries |
| Life flask / mana flask / evade | 1 / 2 / Space by default; customizable |
| Talk / use a gate / collect nearby loot | Click the character, object or ground item label |
| Town portal | T by default, then hold still for three seconds |
| Inventory / masteries / character | I / K / C |
| Automap / kingdom map / quest journal | Tab / G / J |
| Loot labels | Hold Alt, or enable persistent labels in Options |
| Equip / unequip quickly | Shift + click an inventory or equipment item |
| Buy / sell quickly | Ctrl + click vendor stock or a carried item while trading |
| Transfer pack / stash | Ctrl + click in town |
| Identify a carried item | Alt + click; consumes a scroll |
| Arrange pack | S while an equipment service panel is open |
| Inspect | Hover; click to pin a long, scrollable description |
| Move an item | Drag to a pack cell or compatible equipment slot |
| Cancel a drag / close map / close panel / pause | Escape |

Use **Escape → Options → Movement & key bindings** to customize controls. Each movement mode remembers its own layout on this browser.

## Equipment, crafting and gold

The pack has **12×6 square cells**, and each stash page **10×10**. Item footprints, tall weapon/shield sockets and two ring slots preserve their proportions. Common items equip immediately. Enchanted dungeon loot needs identification; purchased equipment is identified. Edrin identifies carried items freely after his rescue.

Twenty equipment bases have distinct damage, reach, attack speed, armour, evasion, block or mana. Higher areas introduce exceptional and elite bases. Magic, rare and legendary items roll two, four and five properties, with prefix/suffix groups, displayed tiers and roll ranges. Fire, cold and storm resistance, regeneration, flask recovery and attack speed support different builds. Three legendary oath families remain available. The painted player changes by equipment family; individual named items share art within that family.

Garran repairs damaged equipment, salvages carried items for embers, reforges one rolled property, and tempers identified weapons and armour. Tempering adds five quality points, capped at 20%, and retains enchantments. Reforging preserves the base contribution to a stat and uses a generated property’s own roll range. Legacy items retain their compatible reforge behavior. Mark an item **Keep item** to protect it from sale and salvage.

Gold drops scale with enemies and area difficulty and gather automatically when nearby. Equipment appraisal accounts for rolled statistics as well as level and rarity. Orrin buys equipment, sells supplies and keeps eight recent sales for buyback. Pay to restock equipment for your current level. The stash has a deposit/withdraw interface for gold. Death costs 10% of **carried** gold; stored gold remains safe. Failed purchases, equipment swaps and bank transfers do not spend currency or lose items.

Life flasks hold 100 charges, spend 20 per use and have no cooldown. Each use restores 6% life immediately and 48% over three seconds; consecutive uses add to a capped recovery pool. Normal, elite and boss kills grant 6, 14 and 45 charges. Charges regenerate at 0.45 per second outdoors and 4 per second in town, improved by charge recovery modifiers.

Mana flasks use the same charge pool size and combat/passive recharge rules in a separate bottle. Each use restores 6% mana immediately and 50% over three seconds, capped by mana available after aura reservations. Use **2** or click the blue bottle.

## Skills and campaign

New characters begin at level 1 with a service sword, shield and basic attack. Each level grants one mastery point, one passive point and five attribute points. First, intermediate and advanced abilities unlock at levels 2, 4 and 8, with additional mastery investment requirements. Ironbound, Cinderweaver and Hollow Sage can be combined freely. Respecialization refunds learned ranks for gold.

Martyr’s Pyre, available at level 4 after three Cinderweaver points, burns nearby enemies using maximum life, mana and fire bonuses. It consumes 9% of maximum life per second before fire resistance and switches off at 5% life. Resistance, regeneration and flask recovery support it. Returning to town extinguishes it.

Emberfall is inside the open Kingsroad Wilds. Walk through the camp gates into the wilderness; accepting a quest does not teleport you. Follow the north road to Marchgate. The playable campaign contains three seeded wilderness/stronghold pairs and six combat quests, ending with Edrin’s rescue from Aldren in Blackthorn Hollow. Regional enemy levels are 1/5/9 outdoors and 3/7/11 indoors; loot tiers rise more slowly. Later acts are unavailable in this build. Old save data and equipment are preserved.

The kingdom map lists six regional waypoints for Act I and eight per later act, plus Emberfall. Click a gothic fountain to awaken it; travel from town or another fountain. Roadside provisions restore life, mana and flasks; clear another enemy before renewing the same cache. Act I records defeated warband leaders and bosses; its quest rewards cannot be repeated. Later provinces retain their field accounts and commander aftermaths.

This remains a campaign prototype. Areas share a painted scenery kit and procedural layouts. Common enemies use six painted body families with directional walking and attack frames. Later provinces share those role-based families. Strongholds have up to 22 rooms. Automated route tests use powerful fixtures to verify progression; they do not establish final combat balance or hours of gameplay.

## Saves

Characters save in the same browser and origin. Equipment, roll ranges, quality, keepsakes, pack placement, stash, banked gold, campaign progress and bindings persist. Settings use their own storage key. Reloading regenerates enemies and exploration at the saved area entrance, while defeated campaign bosses and discovered waypoints stay recorded.

Older characters retain their equipment and flask charges. Existing endless-crypt characters can continue that expedition; choose New character for the campaign. Beginning a new oath replaces that browser’s character. Restricted browsers that deny storage can still play the current session; a manual save reports that saving is unavailable.

## Development and verification

Requires Node 20.19+ or 22.12+; the prepared environment uses Node 24 and system Chromium.

```sh
npm ci --cache /tmp/arpg-npm-cache
npm run dev
npm test
npm run test:e2e
npm run test:standalone
```

Vite listens on all interfaces. `npm run build` creates the normal static build and **`dist/forgotten-kingdom.html`**, the portable build, plus the identical legacy filename **`dist/ashen-reliquary.html`**. The root HTML is the verified release copy. Opening `dist/index.html` alone is not the standalone distribution. The offline test uses an isolated, network-disabled document with storage denied because managed Chromium blocks direct `file:` navigation.

Unit checks cover procedural connectivity, progression, equipment transactions, charge recovery, aura damage, resistance, quality, keepsakes, appraisals, bank transfers, settings and the revised story. Unit route checks cover every chapter approach and stronghold. Desktop browser checks exercise creation, all six scenes, a complete field-task/commander/aftermath chapter, reload into the next chapter, the five act-ending knight encounters and final bosses, combat, equipment visuals, inventory bounds, services, shortcuts, dragging, map tracking, actual options changes and persistence. `CHROMIUM_PATH` selects another Chromium binary.

Runtime assets are committed; ordinary builds do not generate artwork. `npm run art:pack` rebuilds compressed scenery, equipment layers, parchment prologue scenes, sprite foot offsets and menu illustrations. The game uses cached painted sprites, not a runtime 3D engine. `npm run profile` samples town and stronghold rendering at 1440×900 with Chromium CPU throttled 4×; run it separately from other browser work. UI resolution stays native while Options controls world resolution. Sprite caches use compact image identities instead of embedding entire data URLs in cache keys.

The v0.20 portable HTML is about **12.6 MiB**. `npm run profile:offline` builds and samples the embedded HTML without network access, including a walk to the populated pasture. A controlled 1440×900 Chromium run with 4× CPU throttling measured:

| Area | Median frame | 95th percentile | Sampled JavaScript heap | Prepared terrain pixels |
| --- | --- | --- | --- | --- |
| Emberfall in the expanded forest | 46.8 ms | 71.6 ms | 33.5 MiB | 40.3 MiB |
| Marchgate | 52.9 ms | 72.2 ms | 35.0 MiB | 66.6 MiB |
| Pasture with grass and 22 sheep | 56.8 ms | 75.9 ms | 46.8 MiB | 40.3 MiB |

The sampled rates were 20.1 FPS in town, 18.1 FPS in Marchgate and 17.2 FPS in the populated pasture. These measurements include adaptive Balanced resolution, which reached 960×600 while keeping the interface native. They are constrained test-machine samples, not a sustained desktop performance guarantee. Balanced and High cache the new forest surface at native detail around the viewport; Performance uses the smaller prepared ground layer.

The entire opening region uses 784 prebuilt quarter-resolution chunks; Marchgate uses 324 half-resolution chunks. Neither terrain cache grows as the player walks. Automap discovery still follows exploration. Render quality and the frame ceiling remain adjustable in Options.
