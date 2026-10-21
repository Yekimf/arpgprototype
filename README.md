# Ashen Reliquary — The Broken Oath

An original browser isometric ARPG for mouse/keyboard and touch. A loyal soldier returns from visiting family to find a beloved king murdered, his son on the throne, and the knights of the Round Table corrupted by a stranger’s bargain. The old king’s spirit and the forgotten gods guide the road to Crownfall.

## Download and play

1. Sign into GitHub with an account that has access to this repository.
2. [Download the game ZIP](https://github.com/Yekimf/arpgprototype/archive/refs/heads/main.zip) and extract it.
3. Open **`ashen-reliquary.html`** in Chrome, Edge, Firefox, or Safari on a computer.

The root HTML is the ready-to-play offline game; the other files are its editable source. It embeds the code, styles, artwork and interface. Mobile browsers that cannot execute downloaded HTML need the game served by a static website. Cloud onboarding does not supply a live localhost visualization or a public game URL.

Version 0.4 introduces a title screen, character creation, six-scene illustrated prologue, five-act campaign, wilderness routes, discoverable waypoints, world map, overlay automap, earned character progression, corrected walking art, sculpted globes, and a medieval inventory plate.

## Begin a new oath

Choose **Begin your oath** (or **New character** for an existing save), enter a name, choose your former calling and surcoat, and swear the oath. Royal Vanguard, Sun-sworn Templar and King’s Outrider begin with different attribute distributions. Each served King Alaric. All can combine the three skill masteries.

The prologue shows Alaric refusing the visitor’s offer, Prince Vaelor’s betrayal, the corruption of the royal army, your return from visiting family, the old king’s guidance, and the road ahead. Its painted scenes pan under captions; you can pause, advance or skip. Optional narration uses the browser’s available system speech voices.

New characters start at **level 1 with a basic weapon strike**, an empty QWER bar and no skill points. Each level grants **2 skill points and 5 attribute points**. Spend them in Masteries (K) and Character (C). First-tier abilities unlock at level 2, intermediate skills at level 4, and advanced skills at level 8. The deeper tiers also require 3 or 7 points invested in their mastery. Learning an active ability fills the first empty slot and gives the right mouse button its first spell.

| Attribute | Benefit per point |
| --- | --- |
| Might | +1.5 weapon damage |
| Vitality | +6 life and +0.25 armor |
| Will | +4 spirit and +0.08 spirit regeneration |
| Dexterity | +0.4% critical chance |

Ironbound, Cinderweaver and Hollow Sage contain 22 skills, including ten active abilities, with rank scaling and cross-mastery combinations. Respecialization costs gold and refunds purchased skill ranks. It clears skill bindings and returns the mouse spell to the basic strike.

## The campaign

| Act | Wilderness | Stronghold | Corrupted knight |
| --- | --- | --- | --- |
| I — The Broken Oath | Kingsroad Wilds | Ruined Marchgate | Sir Aldren, the Thornbound |
| II — The Drowned Covenant | Mourning Fen | The Sunken Chapel | Sir Morcant, the Drowned |
| III — Ashes of the Round | Cinderfields | Red Watch Keep | Sir Gareth, the Iron Pyre |
| IV — The Silent Choir | Frostwold | Cathedral of Thorns | Dame Yseld, the Hollow Saint |
| V — The Usurper’s Crown | Crownfall Approach | Throne of Black Glass | Sir Brennan, the Last Oath |

Emberfall leads first into the wilderness. Follow the winding road to the kingdom gate, then explore the connected procedural stronghold. Each knight’s defeat releases its soul and opens the next act. In the final act, Brennan’s fall brings King Vaelor into battle, followed by the Veiled Wanderer in a separate stage. Breaking the bargain completes the campaign and presents its ending.

The knights have different combat patterns: thorn projectiles, drowned volleys, fire hazards, frost attacks and marked oath strikes. The king calls his royal guard and brands the ground; the Wanderer releases radial soul barrages. Melee windups and ground warnings give time to evade.

King Alaric’s spirit appears in town and along the road. Each act has guidance from a different old god and a shrine that restores life, spirit and flasks. Defeat another enemy before renewing a shrine’s blessing. Freeing Aldren also rescues Edrin, who returns to Emberfall to identify relics.

Press **G** for the kingdom world map. Locked acts and unattuned waypoints remain unavailable. Walk near a runestone to attune it, then travel between attuned locations from town or another waypoint. **Tab** opens a translucent, explored-area automap over the world. Roads, exits, runestones, shrines and nearby threats have map markers.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move | Click / hold open ground; arrows also supported | Tap ground or use the joystick |
| Strike | Left-click an enemy; hold to repeat | Hold the sword button; automatic aim |
| Strike in place | Shift + left click | Hold the sword button |
| Selected mouse ability | Right click / hold | Use QWER touch slots for learned abilities |
| Main abilities | Q, W, E, R or click the four large sockets | Tap ability sockets |
| Change a binding | Right-click a QWER socket; click the small RMB socket; or assign in Masteries | Assign through Masteries |
| Evade | Space | Tap evade |
| Healing flask | 1 | Tap flask |
| Talk, use a waypoint, enter a gate | Click the object or press F nearby | Tap the object or interaction button |
| Return to Emberfall | T; hold still for three seconds | Tap Town portal; hold still |
| Inventory / Masteries / Character | I / K / C | Side buttons |
| Automap / world map | Tab / G | World-map side button; keyboard Tab if attached |
| Loot labels | Hold Alt | Nearby labels appear automatically |
| Pause / close a panel | Escape | Pause or panel × button |

The bottom HUD gives QWER four large sockets. Smaller LMB/RMB bindings and utility buttons sit beside the mana globe. Sculpted winged-knight housings surround both liquid globes. The cursor is an original metal arrow, and projectiles and directional melee follow the aim point.

## Inventory and town services

The inventory is a fixed medieval leather-and-metal plate. Its equipment sockets retain their proportions while the complete plate scales to fit. The travel pack uses **10×4 cells**; the stash has **10×8 cells**. Different item types occupy different footprints. Short landscape screens use a wider equipment-and-pack plate.

Press I, Escape or × to close it. Hover for a floating stat and equipment comparison; tap to inspect on touch screens. Selected actions stay in the footer. Drag to rearrange or equip, or double-click a carried item to equip it. Desktop inventory panels allow continued world play; touch inventory pauses combat. Legacy overflow is retained in a tray rather than discarded.

| Townsfolk | Services |
| --- | --- |
| Sister Maelin | Introduces the rescue quest, gives starting supplies once, restores life/spirit and flask charges, and rewards the first knight’s defeat once. |
| Orrin | Trades equipment, flask charges and identification scrolls; keeps the latest eight sales for buyback. |
| Garran | Repairs gear, salvages carried items into embers, and reforges a selected eligible magical affix. |
| Edrin | Returns after his rescue and identifies all carried relics freely. |

Magical dungeon loot starts unidentified. Use a scroll or the rescued archivist before equipping it. Reforging spends gold and embers to reroll one eligible property, preserving the other properties and base item. A roll can improve or worsen. It also repairs the item and increases future reforge costs. Broken gear contributes half its base weapon damage or armor. Failed equipment swaps, transfers and purchases leave items and currency unchanged.

## Saves and current scope

Progress saves locally in the same browser and origin. It includes the character, attributes, skills, bindings, equipment, pack placement, stash, trades, quest flags, campaign act, defeated bosses and attuned waypoints. Area enemies, ground loot and exploration persist during a play session, including town visits. Reloading regenerates areas at the saved location’s entrance; completed campaign bosses and discovered waypoints remain recorded.

Older version-one characters retain their gear and learned skills and can continue their original endless-crypt expedition. Choose **New character** to begin the new story. The creator clearly marks replacement of the current browser save; it happens when you swear the new oath.

This is a single-player campaign prototype with five procedural wilderness/stronghold pairs, one service town, five named knight bosses and two final bosses. Areas share the painted terrain and scenery kit, with distinct names, story, progression and boss patterns. The cutscene uses animated painted panels. There is no multiplayer or account backend.

## Development

Requires Node 20.19+ or 22.12+; the prepared cloud environment uses Node 24 and `/usr/bin/chromium`.

```sh
npm ci --cache /tmp/arpg-npm-cache
npm run dev
```

Vite listens on all interfaces. A phone on the same local network can use the host computer’s LAN address and port 5173. Production output can be served by any static web host:

```sh
npm run build
npm run preview
```

The build creates `dist/index.html` with adjacent assets and the portable `dist/ashen-reliquary.html`. Opening `dist/index.html` alone is not the standalone distribution. The portable build uses system fonts and requires no network or storage permission to run. The development site may optionally load Google Fonts and falls back to local fonts.

```sh
npm test
npm run test:e2e
npm run test:standalone
```

Unit checks cover generated dungeon and campaign connectivity, progression and level gates, waypoints, campaign gates, combat stats, inventory placement and overflow, atomic trades, identification, reforging, repairs and quest rewards. Browser checks cover desktop/touch creation, all six opening scenes, actual leveling and skill/attribute spending, waypoint travel, UI bounds, combat controls, services, save restoration and a complete five-act campaign ending. Campaign routing tests use high-power saved equipment to check progression without measuring balance. Desktop-only input and duplicate full journeys are intentionally skipped in the mobile project.

The standalone check runs with networking disabled and denied storage, exercises the title/creation/prologue, town services, inventory, map, wilderness and basic combat, and verifies zero external HTTP requests or JavaScript errors. Managed cloud Chromium blocks direct `file:` navigation, so this check loads the HTML as an isolated document.

`CHROMIUM_PATH` can select another system Chromium executable. Each cloud task already has an isolated checkout; work directly in it without adding a Git worktree.
