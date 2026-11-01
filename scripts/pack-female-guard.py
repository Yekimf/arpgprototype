"""Adapt the painted guard sheets for the female loyalist without changing rig anchors.

The material texture stays painterly; only the torso silhouette and uncovered
head are repainted. Run with Pillow after repacking the original sheets.
"""
from PIL import Image, ImageDraw
from math import exp
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'src/art'


def sculpt(sheet, bare=False):
    cell = 320
    out = sheet.copy()
    for index in range(sheet.width // cell * (sheet.height // cell)):
        ox, oy = index % 4 * cell, index // 4 * cell
        source = sheet.crop((ox, oy, ox + cell, oy + cell))
        target = source.copy()
        # Large cupped breastplate over a narrow, belted waist; leave arms,
        # hands, shield, and legs at their original measured attachment points.
        for y in range(78, 219):
            chest = .23 * exp(-((y - 119) / 33) ** 2)
            waist = .25 * exp(-((y - 176) / 26) ** 2)
            scale = 1 + chest - waist
            row = source.crop((108, y, 254, y + 1))
            width = round(146 * scale)
            row = row.resize((width, 1), Image.Resampling.BICUBIC)
            target.paste(row, (181 - width // 2, y))
        draw = ImageDraw.Draw(target, 'RGBA')
        front = index % 2 == 0
        # Shaped breastplate / leather bodice seams follow each material's own
        # highlights and stay subtle in the game rather than reading as latex.
        if front:
            draw.arc((145, 97, 218, 143), 4, 171, fill=(24, 15, 11, 125), width=3)
            draw.arc((149, 94, 215, 136), 194, 355, fill=(222, 190, 139, 70), width=2)
            draw.line([(148, 146), (166, 165), (166, 189)], fill=(31, 23, 17, 105), width=3)
            draw.line([(222, 145), (209, 165), (209, 189)], fill=(31, 23, 17, 105), width=3)
        else:
            draw.line([(139, 113), (158, 165), (158, 188)], fill=(22, 16, 14, 95), width=3)
            draw.line([(226, 110), (211, 165), (211, 188)], fill=(22, 16, 14, 95), width=3)
        if bare and index in (2, 3, 14, 15):
            # Female head with dark loose hair, weathered skin and a stern gaze.
            # The profile remains inside the existing helmet/hood clip bounds.
            h = Image.new('RGBA', (cell, cell))
            d = ImageDraw.Draw(h, 'RGBA')
            if front:
                d.ellipse((157, 9, 222, 86), fill=(24, 19, 18, 238))
                d.polygon([(157, 38), (153, 102), (166, 96), (174, 57)], fill=(30, 24, 22, 230))
                d.polygon([(215, 30), (224, 91), (210, 95), (204, 56)], fill=(28, 22, 20, 225))
                d.ellipse((169, 23, 213, 76), fill=(141, 106, 76, 250), outline=(39, 28, 24, 240), width=2)
                d.ellipse((176, 29, 208, 71), fill=(164, 123, 86, 88))
                d.polygon([(167, 36), (172, 19), (198, 13), (216, 31), (203, 26), (184, 33), (175, 46)], fill=(35, 26, 22, 250))
                d.line([(178, 51), (186, 49)], fill=(35, 25, 22, 240), width=2)
                d.line([(196, 48), (204, 49)], fill=(35, 25, 22, 240), width=2)
                d.ellipse((182, 49, 185, 51), fill=(18, 18, 17, 255))
                d.ellipse((199, 48, 202, 50), fill=(18, 18, 17, 255))
                d.line([(191, 50), (188, 61), (194, 62)], fill=(75, 49, 38, 170), width=1)
                d.arc((185, 61, 200, 69), 10, 160, fill=(75, 39, 32, 190), width=2)
                for pts in [[(160, 30), (167, 52), (157, 89)], [(210, 19), (215, 52), (219, 91)], [(178, 21), (166, 45), (163, 78)]]:
                    d.line(pts, fill=(104, 69, 44, 110), width=2)
            else:
                d.ellipse((146, 5, 226, 97), fill=(25, 20, 19, 245))
                d.polygon([(152, 39), (149, 102), (174, 111), (172, 42)], fill=(35, 26, 23, 242))
                d.polygon([(208, 32), (219, 107), (230, 91), (220, 33)], fill=(31, 24, 21, 235))
                for x in (160, 171, 187, 201, 215):
                    d.line([(x, 19), (x + (x - 185) // 5, 92)], fill=(116, 75, 49, 85), width=2)
            target.alpha_composite(h)
        out.paste(target, (ox, oy))
    return out


original = Image.open(ROOT / 'guard-equipment.png').convert('RGBA').resize((1280, 1280), Image.Resampling.LANCZOS)
female = sculpt(original, bare=True)
female.save(ROOT / 'guard-female.png', optimize=True)
female.save(ROOT / 'runtime/guard-female.webp', 'WEBP', quality=89, method=6)
sets = Image.open(ROOT / 'set-models.png').convert('RGBA').resize((1280, 640), Image.Resampling.LANCZOS)
female_sets = sculpt(sets)
female_sets.save(ROOT / 'runtime/set-models-female.webp', 'WEBP', quality=89, method=6)
print('Packed female guard and fitted set armor.')

armor = Image.open(ROOT / 'armor-icons.png').convert('RGBA').resize((1024, 1024), Image.Resampling.LANCZOS)
female_armor = Image.new('RGBA', (1024, 1024))
for index in range(4):
    ox, oy = index % 2 * 512, index // 2 * 512
    cell = armor.crop((ox, oy, ox + 512, oy + 512))
    result = cell.copy()
    for y in range(130, 460):
        chest = .20 * exp(-((y - 265) / 90) ** 2)
        waist = .21 * exp(-((y - 388) / 65) ** 2)
        width = round(412 * (1 + chest - waist))
        band = cell.crop((50, y, 462, y + 1)).resize((width, 1), Image.Resampling.BICUBIC)
        ImageDraw.Draw(result).rectangle((20, y, 492, y), fill=(0, 0, 0, 0))
        result.paste(band, (256 - width // 2, y))
    female_armor.paste(result, (ox, oy))
female_armor.save(ROOT / 'runtime/armor-icons-female.webp', 'WEBP', quality=89, method=6)
print('Packed female armor inventory art.')
