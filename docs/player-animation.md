# Layered player animation

The guard now uses a composition system inspired by classic sprite ARPGs. This is
original artwork and code, not Diablo II assets or file formats.

`player-animation.js` selects fixed pose frames for idle, sixteen-frame walking,
slashes, heavy two-handed swings, thrusts, bows, crossbows, fists and casting.
The body and all equipment use the same action, facing and frame index. Walking
still advances by distance traveled, preventing animation speed from drifting
from movement speed. Existing narrow foot tracks and mirrored idle boot artwork
are retained, without twisting or independently rotating the feet.

`guard-sprites.js` composes legs, torso, head, arms, hands, shield and weapon. The
composition order changes by facing so that far arms pass behind the torso and
near arms cover it. Equipment is not swapped between hands by a final character
flip. Gloves follow the solved wrists; shields follow the off-hand attachment;
weapon paintings rotate about measured grips. Two-handed grips are fitted inside
both arms' reachable regions before either elbow is solved. Bow and crossbow
poses are separate from melee poses. The renderer also distinguishes casting
from weapon attacks, including on remote LAN/WebRTC player poses.

Finished frames are cached with their appearance, direction, clip and frame. The
cache has a 32 MiB pixel budget per guard instance. Padded frames allow long
weapons and raised hands to extend beyond the body; portraits and creation use
the same compositor and adjusted frame anchors.

## Artwork limitation

The existing equipment paintings supply **front and back source views**, not
sixteen independently painted perspectives. The system quantizes sixteen facing
sectors, projects those source layers, and orders them per direction. It does not
yet provide Diablo II's complete, separately rendered sixteen-angle animation
library. Dedicated side and intermediate-angle body/equipment sheets can replace
those source views without changing character saves or equipment statistics.

Current dodge opacity and player death/corpse presentation are retained; this
change does not add separate authored block, hit-recovery or death sprite sheets.
