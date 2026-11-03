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
composition order changes by facing. In front views, the forearms and palms draw
before the weapon, and curled fingers/thumb draw over its handle. In rear views,
the complete equipment and grip group draws before the legs, torso and head.
Opaque body and cloak pixels hide overlapping weapons and hands; exposed tips
and hands outside that silhouette stay visible. This applies to one-handed and
two-handed equipment in both idle and attack poses.
Equipment is not swapped between hands by a final character
flip. Complete textured limb silhouettes join shoulder, elbow, wrist and palm. Bare,
leather and steel hands overlap the sleeve at the wrist; source-space crops
calibrate the painted texture rather than determine whether the limb exists.
The female model has independently measured head, torso, cloak and leg masks.
Her leather torso, sleeves and boots use the same unarmed source painting, so
pieces from differently positioned armor paintings cannot cut into her silhouette.
Female upper-arm and bracer cutouts follow their own source joints, and overlap
at elbows; they are not translated male cutouts.
Gloves follow the solved wrists; the complete shield follows the off-hand
attachment; weapon paintings rotate about grips measured inside opaque handles.
Two-handed grips are fitted inside
both arms' reachable regions before either elbow is solved. Supporting hands use
weapon-specific points in the same painting, including a greatsword grip behind
the guard and a crossbow foregrip. Both the maximum reach and minimum elbow-fold
radius are enforced, preventing stretched elbows in close staff wind-ups. The bow hand holds the riser while the drawing
hand moves toward its string. The bowstring is drawn between the limb tips and
the drawing hand each frame, replacing the static string in the item painting. Bow and crossbow poses are separate from melee poses. The renderer also distinguishes casting
from weapon attacks, including on remote LAN/WebRTC player poses.

Finished frames are cached with their appearance, direction, clip and frame. The
cache has a 96 MiB pixel budget per guard instance. Each logical 192×176 frame
rasterizes to 384×352 pixels. High render quality preserves display density up to
2×, capped at a 3840×2400 world canvas; Balanced and Performance retain their
smaller budgets. Padded frames allow long
weapons and raised hands to extend beyond the body; portraits and creation use
the same compositor and adjusted frame anchors.

## One-handed reference stance

`one-handed-pose.js` supplies the carry and melee transitions for the existing
one-handed swords, axes, maces, flails, daggers and spears. The front weapon hand rests
beside the hip with a gentle bend at the elbow; the blade or head points outward
and upward. The rear reference uses a lower, more vertical arm and a nearly
level short weapon. Long spears keep a steeper carry so they remain in frame. The shield hand is raised to
hold its shield beside the torso. Without a shield the off hand stays relaxed.
Walking adds a small carry motion; slash/thrust clips return to the same ready
pose. Weapon angles take the shortest turn toward the aimed strike.

The profile is selected before the existing pose generator. Ranged weapons,
casting, fists and all two-handed weapons continue through their original paths.
The existing staves remain two-handed. No one-handed staff item was introduced.

## Artwork limitation

The existing equipment paintings supply **front and back source views**, not
sixteen independently painted perspectives. The system quantizes sixteen facing
sectors, projects those source layers, and orders them per direction. It does not
yet provide Diablo II's complete, separately rendered sixteen-angle animation
library. Dedicated side and intermediate-angle body/equipment sheets can replace
those source views without changing character saves or equipment statistics.

Current dodge opacity and player death/corpse presentation are retained; this
change does not add separate authored block, hit-recovery or death sprite sheets.

## Grip regression checks

`tests/player-animation.test.js` checks a solid three-by-three pixel patch under
every grip in the real runtime weapon atlas and verifies supporting-hand
registration for all attack frames and facings. Browser checks render every
weapon plus bare fists in sixteen directions, with bare/leather/steel hands,
checking hand/wrist opacity and that changing gloves changes visible front palm
pixels. Rear grips can be hidden by the cloak. A separate rendered pixel comparison
checks that opaque rear torso pixels hide weapons while front overlaps and
exposed weapon tips remain visible for both characters and idle/attack poses. These replace the previous contact sheet's weak whole-sprite pixel count
as the main protection against missing or detached hands.

## Wrapped one-handed grip

`weapon-grip-art.js` draws the palm/heel first, the original weapon painting next,
and individual curled fingers plus the opposing thumb last. The fingers follow
the handle axis; the heel follows the anatomical wrist. Bare hands and both
glove materials retain painted texture. This depth split applies to both one-handed and two-handed grips. The forearm
renders before the palm so it cannot overpaint a held handle.

The wrist solver subtracts the painted palm length from the forearm measurement
before solving the two arm bones. The contact point remains the measured handle
anchor, while the wrist sits ten source pixels toward the arm. This prevents
the rear elbow from flaring outward just to place a palm-sized arm endpoint.

The browser depth check compares palm-only, palm-plus-weapon and fully wrapped
renders. It requires both unchanged exposed handle pixels and pixels changed by
overlapping fingers, so another opaque whole-hand stamp cannot pass.

`tests/browser/female-continuity.spec.js` renders all eight female arm segments
in isolation to check for transparent cuts, then flood-fills 120 complete poses
to check that elbows, wrists, knees and ankles remain connected to the torso.
It also checks independently measured shoulder, scarf and cloth landmarks.
