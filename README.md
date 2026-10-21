# Ashen Reliquary

A playable, original isometric action RPG for desktop and mobile browsers. Begin in Emberfall, a weathered sanctuary beneath a ruined monastery. Prepare your equipment, follow Sister Maelin’s quest, rescue a missing archivist, and descend through procedural dungeons.

This is a single-player vertical slice, inspired by the deliberate character building and itemization of Diablo II, the active defenses and telegraphed combat of modern ARPGs, and the freedom to combine masteries in Grim Dawn. All names, artwork, code, and setting are original. It is not a recreation of those games or a full commercial-scale ARPG.

## Download and play

1. Sign into GitHub with an account that has access to this repository.
2. [Download the game ZIP](https://github.com/Yekimf/arpgprototype/archive/refs/heads/main.zip) and extract it.
3. Open **`ashen-reliquary.html`** in Chrome, Edge, Firefox, or Safari on a computer.

Version 0.3 adds a closable inventory HUD with hover comparisons, click-to-move, QWER abilities, left/right mouse combat, a themed cursor, and hero animations. The root HTML file is the ready-to-play standalone build; the remaining files are the editable game source. Touch controls appear on mobile. Mobile browsers that cannot execute downloaded HTML need the game served by a static website.

## Run

Requires Node.js 20.19+ or 22.12+ (Node 24 works).

```sh
npm ci
npm run dev
```

The dev server listens on all interfaces, so a phone on the same network can use the host computer's LAN address and port 5173. In a hosted environment, use its forwarded development port. Serve the production output on any static web host:

```sh
npm run build
npm run preview
```

The build also creates **`dist/ashen-reliquary.html`**, a self-contained copy of the game. Copy or download that single file and open it in a desktop browser; it needs no installation, server, or network connection. It embeds the game code, styles, painted art atlases, and favicon and uses system fonts. The detailed art makes the file about 10 MB. Mobile browsers that do not execute downloaded HTML can play the same file when served by a static host.

Cloud onboarding does not provide a live localhost visualization. A running server in the cloud machine is not automatically a public game URL. For the embedded message “An error occurred inside the visualization,” use the standalone file or a static host instead. The ordinary `dist/index.html` requires its adjacent `assets` folder and HTTP serving; opening that file alone is not the portable build.

If your cloud machine's home directory is read-only, use `npm ci --cache /tmp/arpg-npm-cache`. No backend, API credentials, database, or external assets are required. Google Fonts is an optional enhancement with built-in serif and sans-serif fallbacks.

## Play

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move | Click / hold open ground; arrows also supported | Virtual joystick; tap open ground |
| Aim / attack | Left-click enemy; Shift + left-click in place; right-click spell | Hold the sword button; automatic aim |
| Abilities | Q, W, E, R; click hotbar | Tap hotbar abilities |
| Dodge / invulnerability | Space | Tap evade arrow |
| Heal | 1 | Tap flask |
| Talk to townsfolk | Click an NPC; F nearby; town service buttons | Tap an NPC or town service button |
| Enter the crypt | Crypt gate or Enter the crypt button | Tap the gate or Enter the crypt button |
| Return to town | T, then hold still for 3 seconds | Tap Town portal, then hold still |
| Loot | Walk nearby; F | Walk nearby |
| Descend | F near the open rift; click rift | Walk into or tap the rift |
| Masteries / inventory / character | K / I / C | Side buttons |
| Loot labels / map zoom | Hold Alt / M | Nearby labels shown automatically |
| Pause / help | Escape / ? button | Top buttons |

Town service buttons walk your character to the selected NPC. Combat abilities are disabled in the sanctuary. A return portal takes three seconds and is interrupted by movement or damage. Visiting town preserves the current expedition until the page is reloaded.

## Emberfall and its people

| Townsfolk | Services and progression |
| --- | --- |
| Sister Maelin | Introduces the rescue quest, gives one-time starting supplies, restores life/spirit and at least three flask charges for free. Rewards the first Warden’s defeat with 120 gold and three ember shards. |
| Orrin | Sells identified equipment, healing flask charges, and scrolls of insight. Buys unwanted equipment and retains the latest eight sales for buyback at the original sale price. |
| Garran | Repairs equipped gear, salvages inventory items into ember shards, and reforges a chosen eligible magical property. |
| Edrin | Initially missing. Defeating the first Warden rescues him; he then appears in Emberfall and identifies all carried relics for free. |

Maelin’s first supplies include 50 gold, two ember shards, two identification scrolls, and an unidentified talisman. Magical dungeon loot starts unidentified and cannot be equipped until revealed. Use a scroll before Edrin is rescued. Revealing an item exposes its actual name and properties.

## Equipment, inventory, and reforging

The paper doll has nine equipment slots: weapon, body armor, helmet, off hand, gloves, belt, boots, amulet, and ring. Gear affects actual combat statistics. The travel pack holds **10 × 6 cells**; the personal town stash holds **10 × 8 cells**. Weapons, armor, and accessories occupy different footprints.

Press I to toggle the screen-fitting inventory HUD; Escape or its × button closes it. Desktop panels dock to the right while the world remains playable; on narrow phone screens the inventory pauses play. Hover an item for a floating stat and equipment comparison tooltip. Tap to inspect on mobile. Selected item actions remain in the panel footer without scrolling.

On desktop, drag an item to move it within a grid or into the matching equipment slot. Double-click a carried item to equip it. On mobile, tap an item, inspect its comparison, and use the equip/store/withdraw buttons. Auto arrange packs large items first. A failed swap or transfer leaves items and currency unchanged. Full packs leave dropped loot on the ground.

At Garran’s forge, select a carried or equipped identified item and an eligible magical property. Reforging consumes gold and ember shards and rerolls that property; it may improve or worsen. The item’s identity, rarity, base statistics, and other properties remain intact. Reforging also repairs it and increases the gold cost of future rerolls. Salvaging destroys an item for materials. Repairs consume gold and restore durability; a broken item provides half its base damage or armor.

Right-click a QWER hotbar slot to choose a learned ability. Click the RMB hotbar icon to choose your right-mouse spell. New ability bindings persist in saves.

Four mastery points are available immediately. Start with Rift Cleave, Ember Bolt, Frost Nova, and the innate Spirit Lance. Learn passives or improve active skills, then assign learned skills to four QWER slots. Three and seven points invested in a mastery unlock its deeper tiers. Masteries can be freely mixed. Respecialization refunds purchased ranks for gold and preserves the three starting abilities.

Life recovers slowly out of combat; spirit regenerates continuously. Healing flasks restore 55% life, have a four-second cooldown, and replenish from level-ups, dungeon transitions, and occasional enemy drops. The Warden telegraphs its ground slam: evade before impact. Defeating it grants mastery points, a rare-or-better item, and access to a stronger floor.

## Implemented systems

- Four-frame hero walk and attack animations, directional facing, enemy attack lunges, casting light, evade afterimages, and a themed metal arrow cursor.
- Detailed painted sprite atlases, aged stone and earth textures, warm firelight, weathered town buildings, and gothic dungeon scenery rendered in Canvas 2D.
- A safe starting town, NPC dialogue and services, a rescue quest, free identification unlocked by the boss, and a channeled return portal.
- Seeded, connected rooms and corridors, exploration fog, minimap, tombs, braziers, columns, and ambient effects.
- Real-time melee, piercing projectiles, damage over time, area attacks, lightning chains, slowing effects, gravity wells, critical hits, armor mitigation, and dodge invulnerability.
- Three masteries, 21 mastery skills plus an innate projectile, ten active abilities, rank scaling, tier requirements, passive synergies, cooldown reduction, and cross-mastery damage bonuses.
- Skeleton, crawler, and ranged wraith AI; elite packs; a telegraphed boss; increasing enemy power with depth.
- Nine equipment slots, four item rarities, randomized affixes, unidentified loot, item comparisons, spatial inventory and stash, drag-and-drop, trade, buyback, repairs, reforging, salvage, and gold.
- Experience, levels, skill points, flasks, death and recovery, and infinite seeded dungeon progression.
- Browser-local character saves and optional synthesized combat sound.
- Responsive HUD and multi-touch movement and combat.

## Saves and scope

The browser saves character progression, equipment, inventory and placement, stash, gold, shards, scrolls, merchant stock, buyback, quest flags, current zone, depth, and dungeon seed every five seconds and after important actions. While the page remains open, a town visit preserves the expedition’s enemies, loot, and explored map. Reloading starts a fresh expedition at the entrance of the saved depth; enemy kills, exploration, and ground loot are not persisted. Saves stay on the same browser and origin. The character panel offers a confirmed reset.

Existing version-one saves retain their character, gear, and mastery progress and gain the new town features. Previously identified gear remains identified. Oversized legacy inventories are preserved in an overflow tray, where items can be equipped, sold, or moved into the stash. No items are silently deleted.

Current scope is one town, one dungeon art setting, three enemy archetypes, one boss archetype, and procedurally repeated floors. There is no multiplayer, account backend, full campaign, or player trading. The realistic artwork uses pre-rendered sprites and texture atlases; the hero has four-frame walking and sword attack cycles, with front/back poses and mirroring for four facings. Enemy attacks lunge, spells glow, and evades leave fading afterimages.

## Validation

```sh
npm test
npm run test:e2e
npm run build
npm run test:standalone
```

Unit checks cover 100 dungeon seeds, boss reachability, collision, masteries, combat statistics, spatial placement, save migration and overflow, atomic failures, identification, trading, reforging, repair, one-time quest rewards, and reachable town services. Playwright covers inventory and tooltip bounds at desktop, portrait phone, and landscape sizes, hover comparisons, click-to-move, QWER and mouse casting, cursor aiming, actual enemy-click melee damage, animation frames, desktop and mobile touch controls, skill assignment, equipment, stash and save persistence, NPC services, drag-and-drop, buyback, repairs, reforging, quest rewards, identification, portal round trips, and an expedition that defeats a Warden and descends. Some scenarios use saved test characters and high-power equipment to keep the checks focused on functionality. They do not measure balance. Desktop-only keyboard/mouse checks and the duplicate full expedition are intentionally skipped in the mobile project; touch input and town services are tested separately.

Playwright uses `/usr/bin/chromium` by default. Set `CHROMIUM_PATH` to your Chromium executable if it differs. Run the tests with a system Chromium installed.

The standalone check loads the bundled HTML as an isolated document with networking disabled, waits for the art to load, tests town movement, accepting the guide quest, mastery allocation, dungeon departure, and ability casting, and verifies zero external HTTP requests or JavaScript errors. Direct `file:` navigation cannot be tested in the managed cloud Chromium because its browser policy blocks local file URLs.

## Code

- `src/game.js`: testable dungeon generation, collision, items, masteries, and stat calculations.
- `src/settlement.js`: town layout, inventory placement, item and currency transactions, reforging, and quest state.
- `src/town-ui.js`: NPC services, item comparisons, and drag-and-drop.
- `src/inventory-hud.js` and `src/hud.css`: screen-fitting inventory and service panels, floating item tooltips, and themed cursor.
- `src/main.js`: game loop, combat, AI, controls, progression, panels, and persistence.
- `src/renderer.js`: isometric rendering, effects, lighting, and minimap.
- `src/style.css` and `src/town.css`: responsive interface and touch controls.
- `src/art/`: original generated world, inventory, and hero animation sprite atlases. All three atlases are embedded in the portable game.

Each cloud task already uses an isolated checkout. Work in this repository directly; no additional Git worktree is needed.
