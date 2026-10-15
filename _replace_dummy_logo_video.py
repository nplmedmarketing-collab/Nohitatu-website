"""
Replace stacked white dummy NOHITATU logos on orange walls in hero-team-02.mp4.
Uses orange-panel detection + white stacked-logo profile (fast, low false positives).
Writes images/careers-video/hero-team-02-fixed.mp4 then swaps into place when possible.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC_VIDEO = os.path.join(ROOT, "images", "careers-video", "hero-team-02.mp4")
BACKUP = os.path.join(ROOT, "_backups", "logo-replace", "hero-team-02.mp4.bak")
OUT_VIDEO = os.path.join(ROOT, "images", "careers-video", "hero-team-02-fixed.mp4")
LOGO_PATH = os.path.join(ROOT, "images", "nohitatu-logo.png")
PREVIEW_DIR = os.path.join(ROOT, "_tmp_frames")


def make_white_logo(path: str) -> Image.Image:
    logo = Image.open(path).convert("RGBA")
    arr = np.array(logo)
    mask = arr[:, :, 3] > 20
    out = arr.copy()
    out[mask, 0] = 255
    out[mask, 1] = 255
    out[mask, 2] = 255
    return Image.fromarray(out, "RGBA")


def stacked_white_bbox(white: np.ndarray) -> tuple[int, int, int, int] | None:
    """Return bbox of stacked white logo content, or None if profile doesn't look like icon+text."""
    if white.sum() < 120 * 255:
        return None
    # vertical projection
    col = (white > 0).sum(axis=0)
    row = (white > 0).sum(axis=1)
    xs = np.where(col > 0)[0]
    ys = np.where(row > 0)[0]
    if len(xs) < 12 or len(ys) < 12:
        return None
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    bw, bh = x1 - x0 + 1, y1 - y0 + 1
    if bw < 18 or bh < 16:
        return None
    aspect = bw / bh
    # stacked icon+text is roughly square to moderately wide
    if aspect < 0.55 or aspect > 2.6:
        return None
    # density
    crop = white[y0 : y1 + 1, x0 : x1 + 1] > 0
    dens = crop.mean()
    if dens < 0.06 or dens > 0.55:
        return None
    # two-band vertical profile: icon (upper) + text (lower)
    rh = crop.shape[0]
    mid = rh // 2
    upper = crop[:mid].mean()
    lower = crop[mid:].mean()
    if upper < 0.04 or lower < 0.03:
        return None
    # text band often wider/shallower — allow either order but require both bands
    return x0, y0, bw, bh


def find_logo_regions(bgr: np.ndarray) -> list[tuple[int, int, int, int]]:
    """Return list of (x,y,w,h) global boxes for dummy logos on orange walls."""
    H, W = bgr.shape[:2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    orange = cv2.inRange(hsv, (4, 95, 95), (30, 255, 255))
    orange = cv2.morphologyEx(orange, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8), iterations=2)
    cnts, _ = cv2.findContours(orange, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    regions = []
    for c in cnts:
        area = cv2.contourArea(c)
        # wall panels are mid-sized; skip tiny blobs and huge floods
        if area < 900 or area > 45000:
            continue
        x, y, bw, bh = cv2.boundingRect(c)
        # panel-ish aspect
        if bw < 28 or bh < 24:
            continue
        pad = 8
        x0, y0 = max(0, x - pad), max(0, y - pad)
        x1, y1 = min(W, x + bw + pad), min(H, y + bh + pad)
        roi = bgr[y0:y1, x0:x1]
        orange_roi = orange[y0:y1, x0:x1]
        orange_d = cv2.dilate(orange_roi, np.ones((7, 7), np.uint8), iterations=2)
        white = cv2.inRange(roi, (160, 160, 160), (255, 255, 255))
        white = cv2.bitwise_and(white, orange_d)
        # clean speckles
        white = cv2.morphologyEx(white, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
        bb = stacked_white_bbox(white)
        if bb is None:
            continue
        lx, ly, lw, lh = bb
        # global coords
        gx, gy = x0 + lx, y0 + ly
        # expand slightly for erase
        gx2 = max(0, gx - 4)
        gy2 = max(0, gy - 3)
        gw2 = min(W - gx2, lw + 8)
        gh2 = min(H - gy2, lh + 6)
        regions.append((gx2, gy2, gw2, gh2))

    # NMS
    regions = sorted(regions, key=lambda r: r[2] * r[3], reverse=True)
    kept = []
    for r in regions:
        x, y, w, h = r
        hit = False
        for kx, ky, kw, kh in kept:
            ix1, iy1 = max(x, kx), max(y, ky)
            ix2, iy2 = min(x + w, kx + kw), min(y + h, ky + kh)
            inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
            if inter > 0.3 * min(w * h, kw * kh):
                hit = True
                break
        if not hit:
            kept.append(r)
    return kept


def paste_logo(bgr: np.ndarray, logo: Image.Image, x: int, y: int, w: int, h: int) -> None:
    H, W = bgr.shape[:2]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + w), min(H, y + h)
    roi = bgr[y0:y1, x0:x1]
    white = cv2.inRange(roi, (140, 140, 140), (255, 255, 255))
    erase = cv2.dilate(white, np.ones((3, 3), np.uint8), iterations=2)
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    orange = cv2.inRange(hsv, (4, 90, 90), (32, 255, 255))
    sample = (orange > 0) & (white == 0)
    fill = (
        np.median(roi[sample], axis=0).astype(np.uint8)
        if sample.sum() >= 8
        else np.array([35, 105, 225], dtype=np.uint8)
    )
    for ch in range(3):
        chn = roi[:, :, ch]
        chn[erase > 0] = fill[ch]
        roi[:, :, ch] = chn
    roi[:] = cv2.inpaint(roi, erase, 2, cv2.INPAINT_TELEA)

    target_w = max(20, int(w * 1.08))
    target_h = max(8, int(target_w * (86 / 327)))
    if target_h > max(10, int(h * 0.92)):
        target_h = max(8, int(h * 0.88))
        target_w = max(20, int(target_h * (327 / 86)))
    lw = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    arr = np.array(lw)
    lh2, lw2 = arr.shape[:2]
    cx = (x1 - x0) / 2.0
    cy = (y1 - y0) / 2.0
    px = int(round(cx - lw2 / 2))
    py = int(round(cy - lh2 / 2))
    sx0, sy0 = max(0, -px), max(0, -py)
    dx0, dy0 = max(0, px), max(0, py)
    dx1, dy1 = min(roi.shape[1], px + lw2), min(roi.shape[0], py + lh2)
    sx1, sy1 = sx0 + (dx1 - dx0), sy0 + (dy1 - dy0)
    if dx1 > dx0 and dy1 > dy0:
        patch = arr[sy0:sy1, sx0:sx1]
        alpha = patch[:, :, 3:4].astype(np.float32) / 255.0
        base = roi[dy0:dy1, dx0:dx1].astype(np.float32)
        overlay = patch[:, :, :3][:, :, ::-1].astype(np.float32)
        roi[dy0:dy1, dx0:dx1] = (overlay * alpha + base * (1 - alpha)).astype(np.uint8)
    bgr[y0:y1, x0:x1] = roi


def process_frame(bgr: np.ndarray, logo: Image.Image) -> tuple[np.ndarray, int]:
    regs = find_logo_regions(bgr)
    out = bgr.copy()
    for x, y, w, h in regs:
        paste_logo(out, logo, x, y, w, h)
    return out, len(regs)


def encode_frames(frame_dir: str, fps: float, out_path: str) -> None:
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    pattern = os.path.join(frame_dir, "frame_%05d.png")
    subprocess.check_call(
        [
            ffmpeg,
            "-y",
            "-framerate",
            str(fps),
            "-i",
            pattern,
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-crf",
            "18",
            "-preset",
            "medium",
            "-movflags",
            "+faststart",
            out_path,
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def main() -> None:
    os.makedirs(os.path.dirname(BACKUP), exist_ok=True)
    if not os.path.exists(BACKUP):
        shutil.copy2(SRC_VIDEO, BACKUP)
        print("created backup", BACKUP)
    else:
        print("using backup", BACKUP)

    source = BACKUP
    logo = make_white_logo(LOGO_PATH)
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    logo.save(os.path.join(PREVIEW_DIR, "logo_white_derived.png"))

    # Probe first
    cap = cv2.VideoCapture(source)
    for i in (80, 100, 120):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ok, fr = cap.read()
        regs = find_logo_regions(fr)
        fixed, n = process_frame(fr, logo)
        print(f"probe f{i}: regions={regs} n={n}")
        dbg = fr.copy()
        for x, y, w, h in regs:
            cv2.rectangle(dbg, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.imwrite(os.path.join(PREVIEW_DIR, f"probe_boxes_{i}.jpg"), dbg)
        cv2.imwrite(os.path.join(PREVIEW_DIR, f"probe_fixed_{i}.jpg"), fixed)
        cv2.imwrite(os.path.join(PREVIEW_DIR, f"probe_central_{i}.jpg"), fixed[240:360, 480:720])
    cap.release()

    cap = cv2.VideoCapture(source)
    nframes = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 24.0)
    print(f"processing {nframes} @ {fps}")

    with tempfile.TemporaryDirectory(prefix="ht02v3_") as td:
        total = 0
        touched = 0
        for i in range(nframes):
            ok, frame = cap.read()
            if not ok:
                break
            fixed, nrepl = process_frame(frame, logo)
            total += nrepl
            if nrepl:
                touched += 1
            cv2.imwrite(os.path.join(td, f"frame_{i:05d}.png"), fixed)
            if (i + 1) % 40 == 0 or i + 1 == nframes:
                print(f"  {i+1}/{nframes} placements={total} frames={touched}")
        cap.release()
        print(f"done placements={total} frames={touched}")
        if os.path.exists(OUT_VIDEO):
            try:
                os.remove(OUT_VIDEO)
            except OSError:
                pass
        encode_frames(td, fps, OUT_VIDEO)
        print("wrote", OUT_VIDEO, os.path.getsize(OUT_VIDEO))

    # Try to install as hero-team-02.mp4
    installed = False
    try:
        if os.path.exists(SRC_VIDEO):
            os.remove(SRC_VIDEO)
        shutil.copy2(OUT_VIDEO, SRC_VIDEO)
        installed = True
        print("installed ->", SRC_VIDEO)
    except OSError as e:
        print("could not overwrite original (locked):", e)
        print("fixed file available at:", OUT_VIDEO)


if __name__ == "__main__":
    main()
