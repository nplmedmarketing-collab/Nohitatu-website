import cv2
import os
import shutil
import re

cap = cv2.VideoCapture("images/careers-video/hero-team-02.fixed.mp4")
cap.set(cv2.CAP_PROP_POS_FRAMES, 100)
ok, fr = cap.read()
cap.release()
assert ok

os.makedirs("_backups/logo-replace", exist_ok=True)
src = "images/careers-video/hero-team-02-collage-fixed.jpg"
if os.path.exists(src):
    shutil.copy2(src, "_backups/logo-replace/hero-team-02-collage-fixed.jpg.bak")
cv2.imwrite(src, fr, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
print("updated collage still", os.path.getsize(src))

for p in [
    "images/careers-video/hero-team-02.fixed.mp4",
    "images/careers-video/hero-team-02-fixed.mp4",
    "images/careers-video/hero-team-02-collage-fixed.jpg",
    "_backups/logo-replace/hero-team-02.mp4.bak",
    "images/nohitatu-logo.png",
]:
    print(os.path.getsize(p) if os.path.exists(p) else "MISSING", p)

html = open("Careers.html", encoding="utf-8").read()
print("HTML refs:", re.findall(r"hero-team-02[^\s\"']*", html)[:6])
