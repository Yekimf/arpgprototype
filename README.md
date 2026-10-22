# Ashen Reliquary — The Broken Oath

An original, single-player isometric ARPG for **desktop mouse and keyboard**. A soldier returns from visiting family to find King Alaric murdered, his son on the throne, and the royal garrisons corrupted by a stranger’s bargain. The survivors of Emberfall point the way toward Crownfall. There is no ghost of the king or divine guidance.

## Download and play

1. Sign into GitHub with access to this repository.
2. [Download the game ZIP](https://github.com/Yekimf/arpgprototype/archive/refs/heads/main.zip) and extract it.
3. Open **`ashen-reliquary.html`** in a current desktop browser.

The root HTML embeds all code, styles and runtime art. It works offline. Use a desktop viewport of at least 1024×720; 1280×720 or larger is recommended. Touch controls, phone layouts and the mobile test project have been removed. There is no executable installer, multiplayer server or public hosted preview.

## Version 0.7

- Six spare line illustrations replace the detailed, shaded prologue. Each drawing fades in as a whole on an uninterrupted paper background. Captions and browser narration remain optional; scenes can be paused, advanced or skipped. There is no simulated drawing animation.
- Maelin, Orrin, Garran and Edrin provide practical information. Objectives, road notes, quest conversations and the ending follow the revised story. Roadside provisions replace divine shrines. The old king remains part of the backstory, but never appears as a spirit.
- The HUD uses separate instruments over the world: life and mana globes, a flask beside life, QWER in the middle, LMB/RMB beside mana, and compact navigation tabs below. There is no full-width bottom rail.
- The corner minimap follows the player. **Tab** opens the larger, centered explored-area automap without pausing combat. **G** opens the kingdom map and discovered waypoints.
- Buildings use measured sprite foot offsets and smaller contact shadows. The existing painted equipment layers, rigid walking strides, cached terrain and bounded enemy simulation remain in place.
- Inventory, vendor, forge and stash use the same marble, dark sockets and metal borders. Long item descriptions scroll independently. A custom pointer drag retains the metal cursor instead of starting a native OS drag.
- Pause offers resume, options, controls, manual save and return to title. Options actually change render quality, frame ceiling, world brightness, map opacity, effects volume, sound, damage numbers, persistent loot labels and interface motion. Options are stored separately from the character.

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
| Automap / kingdom map | Tab / G |
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

Emberfall is inside the open Kingsroad Wilds. Walk through the camp gates into the wilderness; accepting a quest does not teleport you. Follow the north road to Marchgate. Five seeded wilderness/stronghold pairs lead through Aldren, Morcant, Gareth, Yseld and Brennan, then King Vaelor and the Veiled Wanderer. Each knight opens the next act. The kingdom map records attuned waypoints, which can be used from town or another waypoint. Roadside provisions restore life, mana and flasks; clear another enemy before renewing the same cache.

This remains a campaign prototype. Areas share a painted scenery kit, with distinct names, routes, progression and boss patterns. Tests use powerful fixtures to verify the full campaign route; they do not establish final combat or economy balance.

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

Unit checks cover procedural connectivity, progression, equipment transactions, charge recovery, aura damage, resistance, quality, keepsakes, appraisals, bank transfers, settings and the revised story. Desktop browser checks exercise creation, all six scenes, full campaign routing, combat, equipment visuals, inventory bounds, services, shortcuts, dragging, map tracking, actual options changes and persistence. `CHROMIUM_PATH` selects another Chromium binary.

Runtime assets are committed; ordinary builds do not generate artwork. `npm run art:pack` rebuilds compressed scenery, equipment layers, simple prologue scenes and sprite foot offsets. The game uses cached painted sprites, not a runtime 3D engine. `npm run profile` samples town and stronghold rendering at 1440×900 with Chromium CPU throttled 4×; run it separately from other browser work. UI resolution stays native while Options controls world resolution.

The v0.7 portable HTML is about **6.1 MiB**, down from 10.7 MiB in v0.6. On the same 4× CPU-throttled browser profile, town median frames measured 48.1 ms and stronghold frames 44.9 ms (v0.6: 48.0 / 46.9 ms); sampled heap fell from about 66 MiB to 41 MiB. These are constrained benchmark results, not a 60 FPS guarantee. The Performance quality setting and 30 FPS ceiling are available for slower desktops.
