from collections import deque

from PIL import Image
import sys

src = sys.argv[1]
out = sys.argv[2]
# White detection: lower = more aggressive trim (default 18)
threshold = int(sys.argv[3]) if len(sys.argv) > 3 else 18


def is_background_white(r, g, b, t):
    return r >= 255 - t and g >= 255 - t and b >= 255 - t


def crop_to_content(im, t):
    rgb = im.convert('RGB')
    w, h = rgb.size
    pixels = rgb.load()

    min_x, min_y, max_x, max_y = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            if not is_background_white(r, g, b, t):
                found = True
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if not found:
        return rgb
    return rgb.crop((min_x, min_y, max_x + 1, max_y + 1))


def flood_transparent_white(im, t):
    """Remove white only if connected to image edge (keeps inner white spade)."""
    rgba = im.convert('RGBA')
    w, h = rgba.size
    px = rgba.load()

    visited = [[False] * w for _ in range(h)]
    q = deque()

    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or visited[y][x]:
            continue
        visited[y][x] = True
        r, g, b, a = px[x, y]
        if not is_background_white(r, g, b, t):
            continue
        px[x, y] = (r, g, b, 0)
        q.append((x + 1, y))
        q.append((x - 1, y))
        q.append((x, y + 1))
        q.append((x, y - 1))

    return rgba


def peel_white_touching_transparent(im, t):
    """Remove white pixels that touch transparency (outer ring), keep enclosed spade."""
    rgba = im.convert('RGBA')
    w, h = rgba.size
    px = rgba.load()
    changed = True
    while changed:
        changed = False
        to_clear = []
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a == 0 or not is_background_white(r, g, b, t):
                    continue
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                        to_clear.append((x, y))
                        break
        for x, y in to_clear:
            r, g, b, _ = px[x, y]
            px[x, y] = (r, g, b, 0)
            changed = True
    return rgba


im = Image.open(src)
cropped = crop_to_content(im, threshold)
transparent = flood_transparent_white(cropped, threshold)
transparent = peel_white_touching_transparent(transparent, threshold)
transparent.save(out, 'PNG', optimize=True)
print(f"trimmed {im.size} -> {transparent.size} (RGBA, edge white removed)")
