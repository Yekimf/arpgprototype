# 3D character prototype

The `Character3D` stage in `src/character-3d.js` builds male and female guards with a continuous skinned anatomical body. The
hm08 mesh and adult head morphs come from MakeHuman assets explicitly released
as CC0. No MakeHuman application code is used. Equipment meshes, cloth and
material maps are authored for this game.

The orthographic camera uses the world's 2:1 ground projection. Facing is derived
from the actual world vector with 64 sampled viewing angles; there is no final sprite flip. A transparent WebGL
canvas is drawn at the actor's existing place in the world draw order. The same
stage handles the player, co-op appearances and the source pose used for player
remains. Buildings, enemies and terrain retain their current renderers.

A pelvis/chest/head hierarchy carries leg and arm joints. Arms use a two-bone
solve with an outward elbow pole. Weapons attach to a hand bone; supporting hands
use points in the same weapon's local coordinates. Real mesh depth determines
whether equipment is hidden by the body. Bowstrings follow the drawing hand.
Walking is driven by existing distance-based walk phase; attacks and casts use
the existing animation duration without changing combat timing or damage.

Equipment geometry is selected from `appearanceOf`, including armor, helm,
weapon, shield, boots and gloves. Two-handed equipment hides the shield. Armor
set parts tint the cuirass; individual set ornamentation and cosmetic trinkets
are not fully modeled. Menus and inventory portraits retain painted art.

The stage initializes lazily, keeps at most four model appearances, and disposes
geometry, material and texture resources on eviction. Meshes with the same material are batched within each joint. A bounded 44-frame
cache (under 24 MiB of RGBA pixels) reuses runtime-rendered animation poses to
avoid repeated GPU readback. Idle poses also reuse the last WebGL output. Context loss or unavailable WebGL falls back to the
painted compositor; context restoration allows 3D rendering again. The model
setting persists independently of character saves.

Three.js is bundled locally, including its MIT notice in the standalone HTML.
There are no runtime CDN, model or texture downloads. A future authored glTF
model can replace the procedural body while keeping the renderer bridge,
equipment appearance data and animation input contract.

`tests/browser/character-3d.spec.js` checks 384 combinations of sex, weapon,
facing and action, actual supporting-hand registration, rendered front/rear
occlusion, style switching/persistence and unavailable-WebGL fallback.

## Gothic appearance and lighting

`guard-anatomy.js` binds the prepared anatomical surface to 14 skin bones, fits
it to the equipment rig, and keeps the head, hands, elbows and knees continuous.
The adult head forms and generated frontal face albedo are baked by
`scripts/build-guard-anatomy.py` (Python + Pillow) into the bundled geometry.
Body triangles inside a closed cuirass are hidden to prevent garment penetration.

`gothic-materials.js` supplies deterministic albedo, bump and roughness maps for
skin, hair, mail, cloth, leather, wood and metal. The stage uses a restrained
environment reflection, a shadow-casting directional light, hemisphere fill and
a warm point light near braziers. Crypts use a cooler, dimmer lighting profile.
Light direction and strength are quantized in cached pose keys. The ground
shadow fades at the edge rather than ending at the receiving plane boundary.

Source assets and CC0 notices are in `src/art/source`. The generated face atlas
is a texture source, not a screenshot of the 3D model. Menus, terrain and NPCs
keep their existing painted artwork.
