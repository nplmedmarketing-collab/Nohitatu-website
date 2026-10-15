"""One-off: convert user-provided cover logo white bg -> transparent PNG site logos."""
from PIL import Image
import math
import os
import shutil
from datetime import datetime

ROOT = r"D:\Developer\Priyanka\Nohitatu website"
SRC = (
    r"C:\Users\Priyanka\AppData\Roaming\Cursor\User\workspaceStorage"
    r"\empty-window\images\nohitatu_cover-fb62301d-3d90-4b77-a7ef-17807116a163.png"
)
BACKUP_DIR = os.path.join(
    ROOT, "_backups", "logo-replace", "site-logo-" + datetime.now().strftime("%Y%m%d")
)
os.makedirs(BACKUP_DIR, exist_ok=True)

targets = [
    os.path.join(ROOT, "images", "nohitatu-logo.png"),
    os.path.join(ROOT, "images", "nohitatu-logo_white.png"),
]
for t in targets:
    if os.path.exists(t):
        dest = os.path.join(BACKUP_DIR, os.path.basename(t))
        shutil.copy2(t, dest)
        print("backed up", t, "->", dest)

im = Image.open(SRC).convert("RGBA")
px = im.load()
w, h = im.size
SOFT = 42  # Euclidean distance from pure white for soft fringe/shadows

out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
opx = out.load()
for y in range(h):
    for x in range(w):
        r, g, b, _ = px[x, y]
        dist = math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2)
        if dist <= 2:
            opx[x, y] = (0, 0, 0, 0)
        elif dist <= SOFT:
            alpha = int(round(255 * (dist / SOFT)))
            opx[x, y] = (r, g, b, max(0, min(255, alpha)))
        else:
            opx[x, y] = (r, g, b, 255)

bbox = out.getbbox()
if not bbox:
    raise SystemExit("empty image after transparency")
pad = 6
l, t, r2, b2 = bbox
l = max(0, l - pad)
t = max(0, t - pad)
r2 = min(w, r2 + pad)
b2 = min(h, b2 + pad)
cropped = out.crop((l, t, r2, b2))


def make_on_dark(src_img):
    """White wordmark + red accent for dark headers; preserve alpha."""
    img = Image.new("RGBA", src_img.size, (0, 0, 0, 0))
    sp = src_img.load()
    p = img.load()
    cw, ch = src_img.size
    for y in range(ch):
        for x in range(cw):
            r, g, b, a = sp[x, y]
            if a == 0:
                continue
            # keep brand red / brick
            if r >= 90 and r > g + 30 and r > b + 30:
                p[x, y] = (r, g, b, a)
                continue
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if lum >= 200:
                if a < 80:
                    continue
                p[x, y] = (255, 255, 255, max(0, min(255, int(a * 0.35))))
                continue
            p[x, y] = (255, 255, 255, a)
    return img


logo_light_bg = cropped
logo_dark_bg = make_on_dark(cropped)

out_light = os.path.join(ROOT, "images", "nohitatu-logo.png")
out_dark = os.path.join(ROOT, "images", "nohitatu-logo_white.png")
logo_light_bg.save(out_light, "PNG", optimize=True)
logo_dark_bg.save(out_dark, "PNG", optimize=True)

ref = os.path.join(BACKUP_DIR, "nohitatu-logo-from-cover-transparent.png")
logo_light_bg.save(ref, "PNG", optimize=True)

print("wrote", out_light, logo_light_bg.size, os.path.getsize(out_light))
print("wrote", out_dark, logo_dark_bg.size, os.path.getsize(out_dark))
print("backup dir", BACKUP_DIR)
print("aspect", round(logo_light_bg.size[0] / logo_light_bg.size[1], 3))

for path in (out_light, out_dark):
    im2 = Image.open(path).convert("RGBA")
    p2 = im2.load()
    ww, hh = im2.size
    whites = sum(
        1
        for y in range(hh)
        for x in range(ww)
        if p2[x, y][3] > 200 and p2[x, y][0] > 245 and p2[x, y][1] > 245 and p2[x, y][2] > 245
    )
    zeros = sum(1 for y in range(0, hh, 5) for x in range(0, ww, 5) if p2[x, y][3] == 0)
    print(
        os.path.basename(path),
        "near-white-opaque",
        whites,
        "sampled-transparent",
        zeros,
        "corner",
        p2[0, 0],
    )
