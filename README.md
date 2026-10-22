# Ashen Reliquary — The Broken Oath

An original, single-player isometric ARPG for **desktop mouse and keyboard**. A soldier returns from visiting family to find King Alaric murdered, his son on the throne, and the royal garrisons corrupted by a stranger’s bargain. The survivors of Emberfall point the way toward Crownfall. There is no ghost of the king or divine guidance.

## Download and play

1. Sign into GitHub with access to this repository.
2. [Download the game ZIP](https://github.com/Yekimf/arpgprototype/archive/refs/heads/main.zip) and extract it.
3. Open **`ashen-reliquary.html`** in a current desktop browser.

The root HTML embeds all code, styles and runtime art. It works offline. Use a desktop viewport of at least 1024×720; 1280×720 or larger is recommended. Touch controls, phone layouts and the mobile test project have been removed. There is no executable installer, multiplayer server or public hosted preview.

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
- Wilderness edges use visible timber barriers, a forest-floor backdrop and trees beyond the playable boundary. A solid garrison gate blocks walking through the keep arch; approach from the road and press F to enter after recovering the chapter account.
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
| Move | Click / hold open ground; arrow keys also work |
| Basic attack | Left-click an enemy; hold to repeat |
| Strike in place | Shift + left click on the world |
| Selected mouse ability | Right click / hold |
| Main abilities | Q, W, E, R |
| Assign ability | Right-click a QWER socket; click the RMB socket; or assign in Masteries |
| Flask / evade | 1 / Space |
| Talk / use a gate / collect nearby loot | Click the object or press F nearby |
| Town portal | T, then hold still for three seconds |
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

## Equipment, crafting and gold

The pack has **10×4 square cells**, and the stash **10×8**. Item footprints, tall weapon/shield sockets and two ring slots preserve their proportions. Common items equip immediately. Enchanted dungeon loot needs identification; purchased equipment is identified. Edrin identifies carried items freely after his rescue.

Twenty equipment bases have distinct damage, reach, attack speed, armour, evasion, block or mana. Higher areas introduce exceptional and elite bases. Magic, rare and legendary items roll two, four and five properties, with prefix/suffix groups, displayed tiers and roll ranges. Fire, cold and storm resistance, regeneration, flask recovery and attack speed support different builds. Three legendary oath families remain available. The painted player changes by equipment family; individual named items share art within that family.

Garran repairs damaged equipment, salvages carried items for embers, reforges one rolled property, and tempers identified weapons and armour. Tempering adds five quality points, capped at 20%, and retains enchantments. Reforging preserves the base contribution to a stat and uses a generated property’s own roll range. Legacy items retain their compatible reforge behavior. Mark an item **Keep item** to protect it from sale and salvage.

Gold drops scale with enemies and area difficulty and gather automatically when nearby. Equipment appraisal accounts for rolled statistics as well as level and rarity. Orrin buys equipment, sells supplies and keeps eight recent sales for buyback. Pay to restock equipment for your current level. The stash has a deposit/withdraw interface for gold. Death costs 10% of **carried** gold; stored gold remains safe. Failed purchases, equipment swaps and bank transfers do not spend currency or lose items.

Life flasks hold 100 charges, spend 20 per use and have no cooldown. Each use restores 6% life immediately and 48% over three seconds; consecutive uses add to a capped recovery pool. Normal, elite and boss kills grant 6, 14 and 45 charges. Charges regenerate at 0.45 per second outdoors and 4 per second in town, improved by charge recovery modifiers.

## Skills and campaign

New characters begin at level 1 with a service sword and basic attack. Each level grants two skill points and five attribute points. First, intermediate and advanced abilities unlock at levels 2, 4 and 8, with additional mastery investment requirements. Ironbound, Cinderweaver and Hollow Sage can be combined freely. Respecialization refunds learned ranks for gold.

Martyr’s Pyre, available at level 4 after three Cinderweaver points, burns nearby enemies using maximum life, mana and fire bonuses. It consumes 9% of maximum life per second before fire resistance and switches off at 5% life. Resistance, regeneration and flask recovery support it. Returning to town extinguishes it.

Emberfall is inside the open Kingsroad Wilds. Walk through the camp gates into the wilderness; accepting a quest does not teleport you. Follow the north road to Marchgate. Twenty seeded wilderness/stronghold pairs lead through five provinces. Each act has a separate enemy roster and four chapters. Three garrison commanders lead to Aldren, Morcant, Gareth, Yseld or Brennan. Each fallen knight opens the next act; the final chapter then leads to King Vaelor and the Veiled Wanderer. Act starting area levels are 1, 10, 20, 30 and 40, rising by two per chapter. Item requirements now follow area level so later-act drops remain equipable within the level cap.

The kingdom map lists all eight waypoints for each province. Attune them by visiting; use them from town or another waypoint. Roadside provisions restore life, mana and flasks; clear another enemy before renewing the same cache. The journal records completed field tasks and commander aftermaths once, without repeat rewards.

This remains a campaign prototype. Areas share a painted scenery kit and procedural layouts. Enemy variants reuse three painted body archetypes. Strongholds have up to 22 rooms. Automated route tests use powerful fixtures to verify progression; they do not establish final combat balance or hours of gameplay.

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

Vite listens on all interfaces. `npm run build` creates the normal static build and **`dist/ashen-reliquary.html`**, the portable build. The root HTML is the verified release copy. Opening `dist/index.html` alone is not the standalone distribution. The offline test uses an isolated, network-disabled document with storage denied because managed Chromium blocks direct `file:` navigation.

Unit checks cover procedural connectivity, progression, equipment transactions, charge recovery, aura damage, resistance, quality, keepsakes, appraisals, bank transfers, settings and the revised story. Unit route checks cover every chapter approach and stronghold. Desktop browser checks exercise creation, all six scenes, a complete field-task/commander/aftermath chapter, reload into the next chapter, the five act-ending knight encounters and final bosses, combat, equipment visuals, inventory bounds, services, shortcuts, dragging, map tracking, actual options changes and persistence. `CHROMIUM_PATH` selects another Chromium binary.

Runtime assets are committed; ordinary builds do not generate artwork. `npm run art:pack` rebuilds compressed scenery, equipment layers, parchment prologue scenes, sprite foot offsets and menu illustrations. The game uses cached painted sprites, not a runtime 3D engine. `npm run profile` samples town and stronghold rendering at 1440×900 with Chromium CPU throttled 4×; run it separately from other browser work. UI resolution stays native while Options controls world resolution. Sprite caches use compact image identities instead of embedding entire data URLs in cache keys.

The portable v0.10 HTML is about **7.2 MiB**, including all new menu art. The previous v0.9 production-build sample at 1440×900 with 4× CPU throttling measured:

| Area | Median frame | 95th percentile | Sampled JavaScript heap |
| --- | --- | --- | --- |
| Emberfall | 54.3 ms | 70.6 ms | 19.4 MiB |
| Marchgate | 60.2 ms | 77.5 ms | 17.6 MiB |

Outdoor terrain uses 144 prebuilt half-resolution chunks, approximately 30 MiB of pixel storage in addition to JavaScript heap. These constrained samples represent about 18 / 16 FPS under throttling; render quality and the frame ceiling remain adjustable in Options. They do not establish sustained performance on a particular desktop.
