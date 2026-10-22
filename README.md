# Ashen Reliquary — The Broken Oath

An original browser isometric ARPG for mouse/keyboard and touch. A loyal soldier returns from visiting family to find a beloved king murdered, his son on the throne, and the knights of the Round Table corrupted by a stranger’s bargain. The old king’s spirit and the forgotten gods guide the road to Crownfall.

## Download and play

1. Sign into GitHub with an account that has access to this repository.
2. [Download the game ZIP](https://github.com/Yekimf/arpgprototype/archive/refs/heads/main.zip) and extract it.
3. Open **`ashen-reliquary.html`** in Chrome, Edge, Firefox, or Safari on a computer.

The root HTML is the ready-to-play offline game; the other files are its editable source. It embeds the code, styles, artwork and interface. Mobile browsers that cannot execute downloaded HTML need the game served by a static website. Cloud onboarding does not supply a live localhost visualization or a public game URL.

Version 0.6 restores the original painted royal guard with rigid, opposing walking strides and equipment layers. The inventory uses grey marble, proportioned equipment sockets, two ring slots and square pack cells. Six panoramic ink illustrations fill the prologue screen. Life flasks use replenishing charges, and the reworked masteries include Martyr’s Pyre, a sustained self-burning aura. The cached world renderer and open 96×96 Kingsroad from version 0.5 remain in place.

## Begin a new oath

Choose **Begin your oath** (or **New character** for an existing save), enter a name, choose your former calling and surcoat, and swear the oath. Royal Vanguard, Sun-sworn Templar and King’s Outrider begin with different attribute distributions. Each served King Alaric. All can combine the three skill masteries.

The prologue shows Alaric refusing the visitor’s offer, Prince Vaelor’s betrayal, the corruption of the royal army, your return from visiting family, the old king’s guidance, and the road ahead. Its six full-screen panoramic illustrations accumulate individual ink strokes on stained paper, with dark outlines appearing before fine hatching. The artwork fills each viewport without a central frame. There is no narrative text panel. Optional captions show one sentence at a time; you can pause, advance or skip. Optional narration uses the browser’s available system speech voices.

New characters start at **level 1 with a basic weapon strike**, an empty QWER bar and no skill points. Each level grants **2 skill points and 5 attribute points**. Spend them in Masteries (K) and Character (C). First-tier abilities unlock at level 2, intermediate skills at level 4, and advanced skills at level 8. The deeper tiers also require 3 or 7 points invested in their mastery. Learning an active ability fills the first empty slot and gives the right mouse button its first spell.

| Attribute | Benefit per point |
| --- | --- |
| Might | +1.5 weapon damage |
| Vitality | +6 life and +0.25 armor |
| Will | +4 spirit and +0.08 spirit regeneration |
| Dexterity | +0.4% critical chance |

Ironbound, Cinderweaver and Hollow Sage contain 22 skills, including ten active abilities, with rank scaling and cross-mastery combinations. Respecialization costs gold and refunds purchased skill ranks. It clears skill bindings and returns the mouse spell to the basic strike.

Martyr’s Pyre unlocks at level 4 after three Cinderweaver points. Toggle it to scorch nearby enemies; maximum life, spirit and fire damage increase its damage. It consumes 9% of maximum life per second before fire resistance and turns itself off at 5% life. Fire resistance, regeneration and flask investment support this build. It does not reserve spirit. Town travel extinguishes it. Sweeping Cut, Shieldbreaker and Whirling Guard use grounded steel, dust and close melee sweeps; Consecrated Ground leaves a persistent burning patch. Frost and lightning effects use smaller, subdued traces and engraved skill glyphs.

Life flasks hold **100 charges**, spend **20 per use**, restore 6% life immediately and recover another 48% over three seconds. There is no cooldown; consecutive uses add recovery to a capped healing pool. Normal, elite and boss kills grant 6, 14 and 45 charges. Charges also regenerate slowly at 0.45 per second outdoors and 4 per second in town. Charge recovery affixes improve these rates. Old potion counts migrate into charges once, and fractional charges and active recovery are saved.

## The campaign

| Act | Wilderness | Stronghold | Corrupted knight |
| --- | --- | --- | --- |
| I — The Broken Oath | Kingsroad Wilds | Ruined Marchgate | Sir Aldren, the Thornbound |
| II — The Drowned Covenant | Mourning Fen | The Sunken Chapel | Sir Morcant, the Drowned |
| III — Ashes of the Round | Cinderfields | Red Watch Keep | Sir Gareth, the Iron Pyre |
| IV — The Silent Choir | Frostwold | Cathedral of Thorns | Dame Yseld, the Hollow Saint |
| V — The Usurper’s Crown | Crownfall Approach | Throne of Black Glass | Sir Brennan, the Last Oath |

Emberfall stands in the middle of the Kingsroad Wilds. Walk north, south, east or west through its palisade gates without loading another area. Accepting Maelin’s quest gives supplies and leaves you standing in the camp. Fields, groves, ponds and side routes surround it; follow the north road to Marchgate, then enter the procedural stronghold. A stronghold’s entrance also leads back outdoors. Each knight’s defeat releases its soul and opens the next act. In the final act, Brennan’s fall brings King Vaelor into battle, followed by the Veiled Wanderer in a separate stage. Breaking the bargain completes the campaign and presents its ending.

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
| Return to Emberfall | T; hold still for three seconds | Tap the small portal button marked T; hold still |
| Inventory / Masteries / Character | I / K / C | Buttons above the bottom HUD |
| Automap / world map | Tab / G | World-map side button; keyboard Tab if attached |
| Loot labels | Hold Alt | Nearby labels appear automatically |
| Pause / close a panel | Escape | Pause or panel × button |

The bottom HUD gives QWER four large sockets. Smaller LMB/RMB bindings and utility buttons sit beside the mana globe. Tarnished iron housings surround both liquid globes. The cursor is an original metal arrow, and projectiles and directional melee follow the aim point.

## Inventory and town services

The inventory is a grey marble equipment page in an angular iron frame. Weapons and shields occupy tall sockets, armour has its own three-cell height, and two rings can be worn independently. All item images retain their natural aspect ratio. Its text and controls remain at native screen size; equipment, pack and action rows reflow within the available viewport instead of shrinking the entire panel. The travel pack uses **10×4 cells**; the stash has **10×8 cells**. Different item types occupy different footprints. Short landscape screens place equipment and pack side by side.

Press I, Escape or × to close it. Hover for a floating stat and equipment comparison; tap to inspect on touch screens. Selected actions stay in the footer. Click to pin a tooltip; long descriptions scroll within it, and touch tooltips stop above the action footer. Drag to rearrange or equip, or double-click a carried item to equip it. Desktop inventory panels allow continued world play; touch inventory pauses combat. Legacy overflow is retained in a tray rather than discarded.

| Townsfolk | Services |
| --- | --- |
| Sister Maelin | Introduces the rescue quest, gives starting supplies once, restores life/spirit and flask charges, and rewards the first knight’s defeat once. |
| Orrin | Trades equipment, flask charges and identification scrolls; keeps the latest eight sales for buyback. |
| Garran | Repairs gear, salvages carried items into embers, and reforges a selected eligible magical affix. |
| Edrin | Returns after his rescue and identifies all carried relics freely. |

Common gear equips immediately. Only magic, rare and legendary dungeon loot starts unidentified, including correct handling of older saves with a false identification flag on common gear. Use a scroll or the rescued archivist before equipping it. Reforging spends gold and embers to reroll one eligible property, preserving the other properties and base item. A roll can improve or worsen. It also repairs the item and increases future reforge costs. Broken gear contributes half its base weapon damage or armor. Failed equipment swaps, transfers and purchases leave items and currency unchanged.

Equipment comes from 20 bases: swords, axes, maces, spears, leather, mail, plate, vestments, three headgear families, gloves, boots, shields and accessories. Bases provide distinct reach, attack speed, block, evasion, armour or spirit. Enchanted items roll one, three or four affixes according to rarity; affix tiers and level requirements rise with depth. Fire, frost and storm resistance, life regeneration, flask recovery and attack speed support different builds. Resistances cap at 75%, block at 60% and evasion at 50%. Three legendary oath families support fire devotion, sustain or damage. Reforging a generated affix retains the base contribution to that stat.

Equipping or removing armour, helmets, weapons, shields, boots and gloves changes the painted player. Belts, pendants and rings add smaller worn details. The crimson and iron surcoats remain available. Artwork is shared within material families; this is not a separate sprite for every named item. The original outfit retains the original painted attack sequence, and layered outfits use a planted arm swing with their equipped gear.

## Saves and current scope

Progress saves locally in the same browser and origin. It includes the character, attributes, skills, bindings, equipment, pack placement, stash, trades, quest flags, campaign act, defeated bosses and attuned waypoints. Area enemies, ground loot and exploration persist during a play session, including town visits. Reloading regenerates areas at the saved location’s entrance; completed campaign bosses and discovered waypoints remain recorded.

Older version-one characters retain their gear and learned skills and can continue their original endless-crypt expedition. Choose **New character** to begin the new story. The creator clearly marks replacement of the current browser save; it happens when you swear the new oath.

Click a townsperson, walk into conversation range, then choose Talk, Trade, Heal, Repair / Reforge or Identify as appropriate. Conversations appear as compact topic menus over the world. Edrin identifies all enchanted items from his menu after his rescue.

This is a single-player campaign prototype with five seeded wilderness/stronghold pairs, one service town, five named knight bosses and two final bosses. Areas share the painted terrain and scenery kit, with distinct names, story, progression and boss patterns. The cutscene uses animated ink illustrations. There is no multiplayer or account backend.

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

The build creates `dist/index.html` with adjacent assets and the portable `dist/ashen-reliquary.html`. Opening `dist/index.html` alone is not the standalone distribution. The portable build uses system fonts and requires no network or storage permission to run. Both builds use local system fonts and embedded art.

```sh
npm test
npm run test:e2e
npm run test:standalone
```

Unit checks also cover charge migration and regeneration, sustained aura damage and self-burning, fire resistance, dual rings, item families and base-preserving affix rerolls. Unit checks cover generated dungeon and campaign connectivity, progression and level gates, waypoints, campaign gates, combat stats, inventory placement and overflow, atomic trades, identification, reforging, repairs and quest rewards. Browser checks also verify actual sprite pixel changes after equipping six gear types, consecutive flask use, held aura input, full-screen panoramic canvas bounds and square inventory cells on narrow and short screens, and long pinned descriptions that leave equipment actions visible. Browser checks cover desktop/touch creation, all six opening scenes, actual leveling and skill/attribute spending, waypoint travel, UI bounds, combat controls, services, save restoration and a complete five-act campaign ending. Campaign routing tests use high-power saved equipment to check progression without measuring balance. Desktop-only input and duplicate full journeys are intentionally skipped in the mobile project.

The standalone check runs with networking disabled and denied storage, exercises the title/creation/prologue, town services, inventory, map, wilderness and basic combat, and verifies zero external HTTP requests or JavaScript errors. Managed cloud Chromium blocks direct `file:` navigation, so this check loads the HTML as an isolated document.

`CHROMIUM_PATH` can select another system Chromium executable. Each cloud task already has an isolated checkout; work directly in it without adding a Git worktree.

## Artwork and browser performance

Runtime WebP atlases and the six panoramic scenes are committed. Ordinary installation and builds do not require image generation or 3D tools. Source PNGs remain available for editing. The player uses cached painted layers with front/back views and mirrored facings; there is no runtime 3D renderer.

- `npm run art:pack` regenerates compressed scenery, painted equipment and combat sheets, marble, panoramic scenes and alpha-cropped item icon bounds.
- `npm run art:guard` repacks just the player, inventory and prologue assets.
- `node scripts/profile-browser.mjs` samples 120 animation frames in town and a stronghold at 1440×900 with Chromium’s CPU throttle set to 4×. Run it alone against the development server, not beside browser tests. FPS measures this headless environment and does not predict every device.

The world is capped at 1280×800 internal pixels, while text and interface remain native resolution. Ground tiles are baked into reusable chunks, wall variants and light textures are cached, distant enemies sleep, and nearby separation uses spatial buckets. Covered title screens and hidden tabs do not redraw the game world.

A local development-build Chromium sample at 1440×900 with CPU throttled 4× measured these idle scenes. These are render benchmarks, not combat FPS on every device. Both versions use the connected wilderness camp.

| Scene | Version 0.5 median frame | Version 0.6 median frame |
| --- | --- | --- |
| Town | 53.3 ms | 48.0 ms |
| Stronghold | 46.6 ms | 46.9 ms |

Version 0.6’s standalone HTML is approximately **10,906 KiB**, including all six panoramic illustrations and the painted equipment sheets (version 0.5 was 4,243 KiB). The sample reported approximately 66 MiB of JavaScript heap in the development build, compared with 28–31 MiB previously. Embedded artwork in development modules contributes to that figure; decoded canvases and browser GPU memory are separate. These larger illustrations do not redraw during ordinary world play.
