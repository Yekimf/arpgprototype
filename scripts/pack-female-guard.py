"""Pack the supplied female guard sheet and fitted armor variants.

Requires Pillow. The 4x4 guard-female.png is source artwork: keep its cell
layout, transparent gutters, and 1254x1254 proportions when replacing it.
"""
from PIL import Image, ImageDraw
from math import exp
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'src/art'

# Keep the supplied character art intact. The runtime atlas must be 4x4 with
# 320-pixel cells because the guard renderer measures all parts in that space.
female = Image.open(ROOT / 'guard-female.png').convert('RGBA')
if female.width != female.height:
    raise ValueError('The female guard sheet must be square with four equal columns.')
female.resize((1280, 1280), Image.Resampling.LANCZOS).save(
    ROOT / 'runtime/guard-female.webp', 'WEBP', quality=89, method=6
)

# Set armor has its own painted sheet. Adapt its chest and waist to the
# female silhouette while retaining the original material and set markings.
sets = Image.open(ROOT / 'set-models.png').convert('RGBA').resize((1280, 640), Image.Resampling.LANCZOS)
female_sets = sets.copy()
for index in range(8):
    ox, oy = index % 4 * 320, index // 4 * 320
    cell = sets.crop((ox, oy, ox + 320, oy + 320))
    result = cell.copy()
    draw = ImageDraw.Draw(result)
    for y in range(78, 219):
        chest = .23 * exp(-((y - 119) / 33) ** 2)
        waist = .25 * exp(-((y - 176) / 26) ** 2)
        width = round(146 * (1 + chest - waist))
        band = cell.crop((108, y, 254, y + 1)).resize((width, 1), Image.Resampling.BICUBIC)
        draw.rectangle((91, y, 266, y), fill=(0, 0, 0, 0))
        result.paste(band, (181 - width // 2, y))
    female_sets.paste(result, (ox, oy))
female_sets.save(ROOT / 'runtime/set-models-female.webp', 'WEBP', quality=89, method=6)

# Inventory breastplates use the same material paintings, reshaped so the
# chest reads fuller and the belt follows the narrower waist.
armor = Image.open(ROOT / 'armor-icons.png').convert('RGBA').resize((1024, 1024), Image.Resampling.LANCZOS)
female_armor = Image.new('RGBA', (1024, 1024))
for index in range(4):
    ox, oy = index % 2 * 512, index // 2 * 512
    cell = armor.crop((ox, oy, ox + 512, oy + 512))
    result = cell.copy()
    draw = ImageDraw.Draw(result)
    for y in range(130, 460):
        chest = .20 * exp(-((y - 265) / 90) ** 2)
        waist = .21 * exp(-((y - 388) / 65) ** 2)
        width = round(412 * (1 + chest - waist))
        band = cell.crop((50, y, 462, y + 1)).resize((width, 1), Image.Resampling.BICUBIC)
        draw.rectangle((20, y, 492, y), fill=(0, 0, 0, 0))
        result.paste(band, (256 - width // 2, y))
    female_armor.paste(result, (ox, oy))
female_armor.save(ROOT / 'runtime/armor-icons-female.webp', 'WEBP', quality=89, method=6)
print('Packed supplied female guard and fitted armor art.')
