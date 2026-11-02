"""Arrange exported front/rear idle frames like the supplied weapon reference.

Run after export-weapon-grip-sheets.mjs:
    python scripts/build-weapon-comparison.py /workspace/weapon-grip-sheets
"""
from pathlib import Path
import sys

from PIL import Image


source = Path(sys.argv[1] if len(sys.argv) > 1 else 'docs/previews/weapon-grip-sheets')
destination = Path(sys.argv[2] if len(sys.argv) > 2 else 'docs/previews')
destination.mkdir(parents=True, exist_ok=True)

cell_width, cell_height = 320, 225
frame_width, frame_height = 192, 176
render_scale = 1.35
scaled_size = (round(frame_width * render_scale), round(frame_height * render_scale))

for sex in ('male', 'female'):
    sheet = Image.new('RGB', (1280, 900), 'white')
    for index in range(16):
        matches = list(source.glob(f'{sex}-{index:02d}-*.png'))
        if len(matches) != 1:
            raise ValueError(f'Expected one sheet for {sex} weapon {index:02d}; found {matches}')
        sprites = Image.open(matches[0]).convert('RGBA')
        column, row = index % 4, index // 4
        for rear, center_x in ((False, 80), (True, 240)):
            frame_row = 0 if rear else 8
            frame = sprites.crop((0, frame_row * frame_height, frame_width,
                                  (frame_row + 1) * frame_height))
            frame = frame.resize(scaled_size, Image.Resampling.LANCZOS)
            left = column * cell_width + center_x - round(96 * render_scale)
            top = row * cell_height + 12
            sheet.paste(frame, (left, top), frame)
    path = destination / f'weapon-reference-comparison-{sex}.png'
    sheet.save(path)
    # The export ZIP includes these legacy preview names. Keep them in sync
    # with the current game renderer rather than shipping stale pose cards.
    sheet.save(destination / f'weapon-models-{sex}.png')
    print(path)
