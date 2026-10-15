"""Rebuild site logos from cover art: transparent bg, no white emboss/drop-shadow."""
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

# Soft shadows / emboss on the cover art sit in this luminance band.
SHADOW_LUM = 105  # anything lighter (and not brand-red) is discarded
BG_DIST = 28  # near-white background distance cutoff


def is_brand_red(r, g, b):
    return r >= 95 and r > g + 30 and r > b + 30 and g < 170


def unpremultiply_white(r, g, b, a):
    """Recover FG color assuming the pixel was blended onto white."""
    if a <= 0:
        return 0, 0, 0
    if a >= 255:
        return r, g, b
    af = a / 255.0

    def u(c):
        return max(0, min(255, int(round((c - 255 * (1 - af)) / af))))

    return u(r), u(g), u(b)


src = Image.open(SRC).convert("RGBA")
sp = src.load()
W, H = src.size
work = Image.new("RGBA", (W, H), (0, 0, 0, 0))
wp = work.load()

for y in range(H):
    for x in range(W):
        r, g, b, _ = sp[x, y]
        dist = math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2)
        lum = 0.299 * r + 0.587 * g + 0.114 * b

        if dist <= BG_DIST:
            continue  # background

        if is_brand_red(r, g, b):
            # Keep red; alpha from how far from white (soft edge)
            a = 255 if dist >= 60 else max(1, int(round(255 * dist / 60)))
            nr, ng, nb = unpremultiply_white(r, g, b, a)
            # If decontam washes it out, keep original red
            if not is_brand_red(nr, ng, nb):
                nr, ng, nb = r, g, b
            wp[x, y] = (nr, ng, nb, a)
            continue

        # Drop light emboss / soft grey drop-shadow entirely
        if lum >= SHADOW_LUM:
            continue

        # Charcoal ink — opacity from darkness (farther from white = more opaque)
        a = 255 if dist >= 90 else max(1, int(round(255 * (dist / 90))))
        nr, ng, nb = unpremultiply_white(r, g, b, a)
        nlum = 0.299 * nr + 0.587 * ng + 0.114 * nb
        # Reject recovered near-white / pale fringe
        if nlum >= SHADOW_LUM:
            continue
        # Keep recovered ink in charcoal range; clamp if needed
        if nlum > 90:
            # pull toward typical ink ~ (58,68,80)
            t = (nlum - 58) / max(1, nlum)
            nr = int(round(nr * (1 - 0.55 * t) + 58 * 0.55 * t))
            ng = int(round(ng * (1 - 0.55 * t) + 68 * 0.55 * t))
            nb = int(round(nb * (1 - 0.55 * t) + 80 * 0.55 * t))
        wp[x, y] = (nr, ng, nb, a)

bbox = work.getbbox()
if not bbox:
    raise SystemExit("empty after clean")
pad = 4
l, t, r2, b2 = bbox
l, t = max(0, l - pad), max(0, t - pad)
r2, b2 = min(W, r2 + pad), min(H, b2 + pad)
logo = work.crop((l, t, r2, b2))

# Final pass: kill any remaining pale non-red
p = logo.load()
w, h = logo.size
killed = 0
for y in range(h):
    for x in range(w):
        r, g, b, a = p[x, y]
        if a == 0:
            continue
        if is_brand_red(r, g, b):
            continue
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        if lum >= 95:
            p[x, y] = (0, 0, 0, 0)
            killed += 1

path = os.path.join(ROOT, "nohitatu-logo.png")
pathw = os.path.join(ROOT, "nohitatu-logo_white.png")
logo.save(path, "PNG", optimize=True)
logo.save(pathw, "PNG", optimize=True)

# Verify
pale = mid = 0
max_nonred = 0
for y in range(h):
    for x in range(w):
        r, g, b, a = p[x, y]
        if a < 40:
            continue
        if is_brand_red(r, g, b):
            continue
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        max_nonred = max(max_nonred, lum)
        if lum >= 140:
            pale += 1
        elif lum >= 100:
            mid += 1

print("size", logo.size, "killed", killed)
print("pale>=140", pale, "mid>=100", mid, "max_nonred_lum", round(max_nonred, 1))
print("md5", hashlib.md5(open(path, "rb").read()).hexdigest()[:12])
print("corner", p[0, 0])

os.makedirs(PREV, exist_ok=True)
for bgname, bg in [
    ("dark", (40, 44, 54)),
    ("purple", (95, 75, 145)),
    ("light", (250, 250, 252)),
]:
    canvas = Image.new("RGB", (w + 80, h + 80), bg)
    canvas.paste(logo, (40, 40), logo)
    out = os.path.join(PREV, f"preview-clean-{bgname}.jpg")
    canvas.save(out, quality=95)
    print("wrote", out)
