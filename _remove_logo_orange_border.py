"""Remove the light/white fringe around the orange mark in site logos."""
from PIL import Image
import os
from collections import Counter

ROOT = r"d:\Developer\Priyanka\Nohitatu website\images"
BACKUP = os.path.join(ROOT, "_logo-backup")
os.makedirs(BACKUP, exist_ok=True)


def is_red(r, g, b, a, amin=140):
    if a < amin:
        return False
    return r >= 115 and r > g + 40 and r > b + 40 and g <= 140 and b <= 130


def is_fringe(r, g, b, a):
    """Light / pinkish emboss pixels that read as a white border around orange."""
    if a < 15:
        return False
    if is_red(r, g, b, a):
        return False
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    if lum >= 165 and r >= g and r >= b:
        return True
    if lum >= 145 and r > g + 15 and r > b + 15 and g >= 140:
        return True
    return False


def near_red(px, w, h, x, y, rad=2):
    for dy in range(-rad, rad + 1):
        for dx in range(-rad, rad + 1):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                rr, gg, bb, aa = px[nx, ny]
                if is_red(rr, gg, bb, aa):
                    return True
    return False


def dominant_red(img):
    px = img.load()
    w, h = img.size
    c = Counter()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_red(r, g, b, a, amin=200):
                c[(r, g, b)] += 1
    if not c:
        return (176, 74, 58)
    return c.most_common(1)[0][0]


def clean_logo(path, out_path):
    img = Image.open(path).convert("RGBA")
    base = os.path.basename(path)
    bak = os.path.join(BACKUP, base.replace(".png", "") + ".pre-orange-border.png")
    if not os.path.exists(bak):
        img.save(bak)
    w, h = img.size
    px = img.load()
    red = dominant_red(img)
    changed = 0

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_fringe(r, g, b, a) and near_red(px, w, h, x, y, 2):
                px[x, y] = (red[0], red[1], red[2], 255)
                changed += 1

    snap = [[px[x, y] for x in range(w)] for y in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = snap[y][x]
            if a >= 40:
                continue
            has_red = False
            has_solid = False
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < w and 0 <= ny < h):
                    continue
                rr, gg, bb, aa = snap[ny][nx]
                if is_red(rr, gg, bb, aa):
                    has_red = True
                elif aa >= 200:
                    has_solid = True
            if has_red and has_solid:
                px[x, y] = (red[0], red[1], red[2], 255)
                changed += 1

    img.save(out_path)
    print(f"{base}: recolored {changed} fringe/gap pixels -> orange {red}")


def main():
    for name in ("nohitatu-logo.png", "nohitatu-logo_white.png"):
        p = os.path.join(ROOT, name)
        clean_logo(p, p)
    fav = os.path.join(ROOT, "favicon", "favicon.png")
    if os.path.exists(fav):
        clean_logo(fav, fav)
    print("done")


if __name__ == "__main__":
    main()
