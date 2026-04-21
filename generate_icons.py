#!/usr/bin/env python3
import subprocess, sys

def install(pkg):
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', pkg, '--break-system-packages', '-q'])

try:
    from PIL import Image, ImageDraw
except ImportError:
    install('Pillow')
    from PIL import Image, ImageDraw

import os

os.makedirs('icons', exist_ok=True)

def make_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Blue circle background
    draw.ellipse([0, 0, size, size], fill='#378ADD')
    # White pin shape
    cx, cy = size // 2, size // 2
    r = int(size * 0.28)
    pin_top = int(size * 0.22)
    pin_cx = cx
    pin_cy = int(size * 0.42)
    draw.ellipse([pin_cx - r, pin_top, pin_cx + r, pin_top + r*2], fill='white')
    # Triangle bottom of pin
    points = [
        (pin_cx, int(size * 0.75)),
        (pin_cx - int(size * 0.17), int(size * 0.52)),
        (pin_cx + int(size * 0.17), int(size * 0.52)),
    ]
    draw.polygon(points, fill='white')
    # Inner dot
    ir = int(size * 0.09)
    draw.ellipse([pin_cx - ir, pin_cy - ir, pin_cx + ir, pin_cy + ir], fill='#378ADD')
    return img

for size in [192, 512]:
    icon = make_icon(size)
    icon.save(f'icons/icon-{size}.png')
    print(f'Generated icons/icon-{size}.png')

print('Done.')
