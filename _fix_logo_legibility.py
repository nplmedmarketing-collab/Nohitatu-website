"""
Rebuild site logos for legibility:
- nohitatu-logo.png        → charcoal ink + red (for light / white headers)
- nohitatu-logo_white.png  → clean white ink + red (for dark headers)
Both: transparent bg, no white emboss/drop-shadow fringe.
"""
from PIL import Image
import math
import os
import hashlib

SRC = (
    r"C:\Users\Priyanka\AppData\Roaming\Cursor\User\workspaceStorage"
    r"\empty-window\images\nohitatu_cover-fb62301d-3d90-4b77-a7ef-17807116a163.png"
)
ROOT = r"D:\Developer\Priyanka\Nohitatu website\images"
PREV = r"D:\Developer\Priyanka\Nohitatu website\_backups\logo-replace\site-logo-20261008"

# Typical ink from the cover art
INK = (58, 68, 80)
WHITE_INK = (255, 255, 255)


def is_brand_red(r, g, b):
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    return r >= 125 and r > g + 50 and r > b + 50 and g <= 125 and b <= 115 and lum <= 135


def extract_flat_logo(src_img):
    """Keep only solid ink + red; discard bg and soft grey emboss."""
    sp = src_img.load()
    W, H = src_img.size
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    op = out.load()

    for y in range(H):
        for x in range(W):
            r, g, b, _ = sp[x, y]
            dist = math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2)
            lum = 0.299 * r + 0.587 * g + 0.114 * b

            if dist < 40:
                continue  # white / near-white background

            if is_brand_red(r, g, b):
                op[x, y] = (r, g, b, 255)
                continue

            # Soft emboss / drop-shadow band — drop completely
            if lum > 98:
                continue

            # Charcoal wordmark / icon ink — flatten to consistent ink for crisp edges
            if dist >= 50:
                # Blend slightly toward measured ink for consistency, keep some local hue
                t = 0.65
                nr = int(round(r * (1 - t) + INK[0] * t))
                ng = int(round(g * (1 - t) + INK[1] * t))
                nb = int(round(b * (1 - t) + INK[2] * t))
                op[x, y] = (nr, ng, nb, 255)

    bbox = out.getbbox()
    if not bbox:
        raise SystemExit("empty logo mask")
    pad = 3
    l, t, r2, b2 = bbox
    cropped = out.crop(
        (max(0, l - pad), max(0, t - pad), min(W, r2 + pad), min(H, b2 + pad))
    )

    # Remove 1px speckles
    p = cropped.load()
    w, h = cropped.size
    snap = [[p[x, y] for x in range(w)] for y in range(h)]
    for y in range(h):
        for x in range(w):
            if snap[y][x][3] == 0:
                continue
            n = 0
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < w and 0 <= yy < h and snap[yy][xx][3] > 0:
                        n += 1
            if n <= 1:
                p[x, y] = (0, 0, 0, 0)

    return cropped


def make_on_dark(color_logo):
    """White wordmark + red accent for dark headers."""
    img = color_logo.copy()
    p = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = p[x, y]
            if a == 0:
                continue
            if is_brand_red(r, g, b):
                continue
            p[x, y] = (*WHITE_INK, a)
    return img


def soften_aa(img, rounds=1):
    """
    Add mild anti-alias on transparent edge neighbors using neighbor ink color,
    so edges look neat without a white halo (alpha-only fringe, same RGB as ink).
    """
    for _ in range(rounds):
        p = img.load()
        w, h = img.size
        snap = [[p[x, y] for x in range(w)] for y in range(h)]
        for y in range(h):
            for x in range(w):
                if snap[y][x][3] != 0:
                    continue
                # gather opaque neighbors
                cols = []
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        if dx == 0 and dy == 0:
                            continue
                        xx, yy = x + dx, y + dy
                        if 0 <= xx < w and 0 <= yy < h and snap[yy][xx][3] == 255:
                            cols.append(snap[yy][xx][:3])
                if len(cols) >= 2:
                    # average neighbor color, partial alpha
                    ar = sum(c[0] for c in cols) // len(cols)
                    ag = sum(c[1] for c in cols) // len(cols)
                    ab = sum(c[2] for c in cols) // len(cols)
                    # never introduce light AA — clamp luminance
                    lum = 0.299 * ar + 0.587 * ag + 0.114 * ab
                    if lum > 160 and not is_brand_red(ar, ag, ab):
                        ar, ag, ab = WHITE_INK if lum > 200 else INK
                    p[x, y] = (ar, ag, ab, 90)
    return img


os.makedirs(PREV, exist_ok=True)
src = Image.open(SRC).convert("RGBA")
color = extract_flat_logo(src)
# Slightly stronger charcoal for light-bg legibility
cp = color.load()
cw, ch = color.size
for y in range(ch):
    for x in range(cw):
        r, g, b, a = cp[x, y]
        if a == 0 or is_brand_red(r, g, b):
            continue
        # deepen ink a touch (~10%) toward darker slate for clearer reading on light
        cp[x, y] = (
            max(0, int(r * 0.88)),
            max(0, int(g * 0.88)),
            max(0, int(b * 0.90)),
            a,
        )

color = soften_aa(color, rounds=1)
on_dark = make_on_dark(color)
on_dark = soften_aa(on_dark, rounds=1)

path_color = os.path.join(ROOT, "nohitatu-logo.png")
path_white = os.path.join(ROOT, "nohitatu-logo_white.png")
color.save(path_color, "PNG", optimize=True)
on_dark.save(path_white, "PNG", optimize=True)

print("color", color.size, hashlib.md5(open(path_color, "rb").read()).hexdigest()[:12])
print("white", on_dark.size, hashlib.md5(open(path_white, "rb").read()).hexdigest()[:12])

# Previews: dark header sim + light header sim
for name, img, bg in [
    ("on-dark-header", on_dark, (55, 50, 75)),
    ("on-dark-gradient-top", on_dark, (70, 65, 85)),
    ("on-light-header", color, (250, 250, 252)),
]:
    w, h = img.size
    canvas = Image.new("RGBA", (w + 80, h + 80), bg + (255,))
    canvas.paste(img, (40, 40), img)
    out = os.path.join(PREV, f"preview-legible-{name}.png")
    canvas.save(out)
    print("wrote", out)
