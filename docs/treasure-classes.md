# Monster treasure

Monster loot uses three separate steps in `src/treasure.js`: **no-drop → category and treasure base → quality**. Existing saves need no migration. Merchants, quest rewards and existing items retain their own rules.

## No-drop and multiplayer

Regular solo enemies have a 62.5% no-drop chance. On a successful roll, they choose gold (35%) or one equipment item (65%). Champions use a 20% starting no-drop chance, then drop gold plus equipment. Bosses always drop gold plus equipment. Campaign bosses also retain a fixed trophy when their level qualifies for its base; that reward is not a Magic Find roll.

For living players in the recipient's area, the exponent is:

`1 + floor(nearby party members + other players / 2)`

The recipient is excluded from both additional-player counts. Nearby party members must be within 30 world units of the slain enemy; others in the area count at half strength. Counts cap at eight. No-drop is `0.625 ^ exponent` (champions: `0.2 ^ exponent`).

| Players, without nearby party bonuses | Regular no-drop |
| --- | --- |
| 1–2 | 62.50% |
| 3–4 | 39.06% |
| 5–6 | 24.41% |
| 7–8 | 15.26% |

Two nearby party members including the recipient give 39.06%; eight give 2.33%. Dead characters and other areas do not increase drops. Private loot is rolled independently for eligible living recipients. Each uses their own Magic Find. This preserves the game's personal-loot design rather than using Diablo II's shared ground loot.

## Treasure classes

Each base has an explicit minimum monster level. Examples: leather and falchions at 1, sallets at 3, chain and greatswords at 5, kite shields at 7, plate at 9. Exceptional variants require the base threshold plus 11; elite variants require it plus 23. The TC label groups levels in threes, but each entry still obeys the exact monster-level threshold.

Slots are selected before bases, keeping rings and pendants scarce. Early armour heavily favours leather. Eligible standard/exceptional/elite variants have relative weights 70/25/5. Magic Find cannot alter these weights or eligibility. Act I's existing compressed stat-growth curve remains in place; it does not determine treasure-class eligibility.

Set pieces must match the selected base's slot and appearance, and meet the set's minimum monster level. Legendary (the game's unique tier) requires monster level 12 or higher, in addition to the chosen base's threshold. High-tier legendary bases therefore cannot drop early.

## Quality and Magic Find

Quality checks run Legendary → Set → Rare → Magic → Common. Baseline chances per check are:

- Legendary: 0.05%, from monster level 12.
- Set: 0.8%, only when an eligible matching set exists.
- Rare: 0.8% below monster level 12; 8% at 12–19; 11% from 20.
- Magic: 26%.

Champions multiply the Legendary/Set/Rare checks by 1.25, bosses by 2. Each check is conditional on failing higher-quality checks; these are not additive final probabilities.

Magic Find multiplies a check by `1 + effective MF / 100`. Magic uses full MF. Rare uses `MF × 600 / (MF + 600)`, Set uses a 500 cap, Legendary uses a 250 cap. Each individual check caps at 95%.

Fortune suffixes and Prospector's prefixes provide MF. Only identified, usable equipped items contribute; backpack and stash items do not. The character ledger and item tooltips show the stat.

MF does not affect no-drop, gold, base selection, jewellery frequency, or treasure-class thresholds. Rune and inventory-charm drop systems are not present yet; the quality helper explicitly excludes their categories from MF. The existing `charm` equipment slot is a pendant/amulet, whose frequency is unchanged while its quality can improve like other equipment.
