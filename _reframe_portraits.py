"""Analyze and reframe Basker/Vanitha portraits to match Swetha's framing."""
from __future__ import annotations

import shutil
from pathlib import Path

import numpy as np
from PIL import Image

IMG_DIR = Path(r"D:\Developer\Priyanka\Nohitatu website\images")
OUT_SIZE = 1024


def subject_mask(arr: np.ndarray, corner_frac: float = 0.08) -> np.ndarray:
    """Adaptive subject mask: off-white backgrounds (Swetha) and pure white."""
    h, w = arr.shape[:2]
    cw, ch = max(1, int(w * corner_frac)), max(1, int(h * corner_frac))
    corners = np.concatenate(
        [
            arr[:ch, :cw].reshape(-1, 3),
            arr[:ch, -cw:].reshape(-1, 3),
            arr[-ch:, :cw].reshape(-1, 3),
            arr[-ch:, -cw:].reshape(-1, 3),
        ],
        axis=0,
    )
    bg = np.percentile(corners, 90, axis=0).astype(np.float32)
    dist = np.linalg.norm(arr.astype(np.float32) - bg, axis=2)
    from_white = 255.0 - arr.min(axis=2).astype(np.float32)
    return (dist > 18) | (from_white > 22)


def subject_bbox(img: Image.Image):
    arr = np.asarray(img.convert("RGB"))
    mask = subject_mask(arr)
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def analyze(path: Path) -> dict:
    img = Image.open(path)
    w, h = img.size
    bb = subject_bbox(img)
    if bb is None:
        return {"file": path.name, "canvas": (w, h), "bbox": None}
    l, t, r, b = bb
    sw, sh = r - l + 1, b - t + 1
    return {
        "file": path.name,
        "canvas": (w, h),
        "bbox": (l, t, r, b),
        "subject_wh": (sw, sh),
        "fill_pct": (sw * sh) / (w * h) * 100,
        "headroom_pct": t / h * 100,
        "left_margin_pct": l / w * 100,
        "right_margin_pct": (w - 1 - r) / w * 100,
        "bottom_margin_pct": (h - 1 - b) / h * 100,
        "subject_aspect": sw / sh,
        "width_fill_pct": sw / w * 100,
        "height_fill_pct": sh / h * 100,
    }


def print_stats(label: str, s: dict) -> None:
    print(f"\n=== {label}: {s['file']} ===")
    print(f"  canvas: {s['canvas'][0]}x{s['canvas'][1]}")
    if s.get("bbox") is None:
        print("  (no subject found)")
        return
    print(f"  bbox (l,t,r,b): {s['bbox']}")
    print(f"  subject size: {s['subject_wh'][0]}x{s['subject_wh'][1]}")
    print(f"  subject fill (bbox area): {s['fill_pct']:.2f}%")
    print(f"  width fill: {s['width_fill_pct']:.2f}%")
    print(f"  height fill: {s['height_fill_pct']:.2f}%")
    print(f"  headroom: {s['headroom_pct']:.2f}%")
    print(f"  left/right margin: {s['left_margin_pct']:.2f}% / {s['right_margin_pct']:.2f}%")
    print(f"  bottom margin: {s['bottom_margin_pct']:.2f}%")
    print(f"  subject aspect (w/h): {s['subject_aspect']:.3f}")


def extract_subject(img: Image.Image) -> Image.Image:
    """Crop tight to subject with a tiny pad."""
    bb = subject_bbox(img)
    if bb is None:
        raise RuntimeError("No subject found")
    l, t, r, b = bb
    pad = 2
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(img.width - 1, r + pad)
    b = min(img.height - 1, b + pad)
    return img.convert("RGBA").crop((l, t, r + 1, b + 1))


def reframe_to_match(src_path: Path, ref: dict, out_size: int = OUT_SIZE) -> Image.Image:
    """
    Place subject on white square canvas matching Swetha's relative framing.

    Primary: headroom + height fill (face/shoulder vertical framing).
    Cap width fill so broader-shouldered subjects aren't edge-tight.
    """
    src = Image.open(src_path).convert("RGBA")
    subject = extract_subject(src)
    sw, sh = subject.size

    canvas_w = canvas_h = out_size
    target_headroom = ref["headroom_pct"] / 100.0
    target_hf = ref["height_fill_pct"] / 100.0
    target_wf = ref["width_fill_pct"] / 100.0
    # Allow slightly wider than Swetha (broader shoulders) but keep side air
    max_wf = max(target_wf * 1.12, 0.90)

    scale = (target_hf * canvas_h) / sh
    if sw * scale > max_wf * canvas_w:
        scale = (max_wf * canvas_w) / sw

    new_w = max(1, int(round(sw * scale)))
    new_h = max(1, int(round(sh * scale)))
    subject_resized = subject.resize((new_w, new_h), Image.Resampling.LANCZOS)

    y = int(round(target_headroom * canvas_h))
    if y + new_h > canvas_h:
        y = max(0, canvas_h - new_h)

    # When height-matched like Swetha, pin to bottom (Swetha bottom margin ~0)
    if new_h >= target_hf * canvas_h * 0.98:
        y = canvas_h - new_h
        min_head = int(round(target_headroom * canvas_h * 0.85))
        if y < min_head:
            y = min_head
            avail = canvas_h - y
            if new_h > avail:
                scale2 = avail / new_h
                new_w = max(1, int(round(new_w * scale2)))
                new_h = max(1, int(round(new_h * scale2)))
                subject_resized = subject.resize((new_w, new_h), Image.Resampling.LANCZOS)
                y = canvas_h - new_h
                if y < 0:
                    y = 0

    x = (canvas_w - new_w) // 2

    canvas = Image.new("RGBA", (canvas_w, canvas_h), (255, 255, 255, 255))
    canvas.paste(subject_resized, (x, y), subject_resized)
    out = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))
    out.paste(canvas, mask=canvas.split()[-1])
    return out


def main():
    swetha_path = IMG_DIR / "swetha-portrait.png"
    targets = ["basker-portrait.png", "vanitha-portrait.png"]

    before = {"swetha-portrait.png": analyze(swetha_path)}
    for n in targets:
        backup = IMG_DIR / n.replace("-portrait.png", "-portrait.orig.png")
        src = IMG_DIR / n
        if not backup.exists():
            if src.exists() and src.stat().st_size > 0:
                shutil.copy2(src, backup)
                print(f"Backed up {src.name} -> {backup.name}")
            else:
                raise SystemExit(f"Missing backup and empty/missing source for {n}")
        else:
            print(f"Backup already exists: {backup.name}")
        before[n] = analyze(backup)

    print("\nBEFORE (Swetha=current, Basker/Vanitha=.orig)")
    for n in ["swetha-portrait.png", *targets]:
        print_stats("BEFORE", before[n])

    swetha = before["swetha-portrait.png"]
    written = []
    for n in targets:
        backup = IMG_DIR / n.replace("-portrait.png", "-portrait.orig.png")
        out_path = IMG_DIR / n
        reframed = reframe_to_match(backup, swetha, out_size=OUT_SIZE)
        tmp = out_path.with_suffix(".tmp.png")
        reframed.save(tmp, format="PNG", optimize=True)
        # copyfile is more reliable than Path.replace on Windows when viewers lock the dest
        shutil.copyfile(tmp, out_path)
        tmp.unlink(missing_ok=True)
        written.append(str(out_path))
        print(f"Wrote {out_path} ({out_path.stat().st_size} bytes)")

    after = {n: analyze(IMG_DIR / n) for n in ["swetha-portrait.png", *targets]}
    print("\nAFTER")
    for n in ["swetha-portrait.png", *targets]:
        print_stats("AFTER", after[n])

    print("\n--- SUMMARY fill% / headroom% / Wfill% / Hfill% ---")
    for n in ["swetha-portrait.png", *targets]:
        b, a = before[n], after[n]
        print(
            f"{n}: BEFORE fill={b['fill_pct']:.1f}% head={b['headroom_pct']:.1f}% "
            f"Wf={b['width_fill_pct']:.1f}% Hf={b['height_fill_pct']:.1f}% "
            f"| AFTER fill={a['fill_pct']:.1f}% head={a['headroom_pct']:.1f}% "
            f"Wf={a['width_fill_pct']:.1f}% Hf={a['height_fill_pct']:.1f}%"
        )

    print("\nFiles written:")
    for p in written:
        print(f"  {p}")


if __name__ == "__main__":
    main()
