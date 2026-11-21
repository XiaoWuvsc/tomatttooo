# -*- coding: utf-8 -*-
"""
把 all the image/ 里的原图压缩成网页预览版（img/ 文件夹）
最长边 1600px · 渐进式 JPEG · 质量 82，原图保留不动
用法：python scripts/build-images.py
"""
import os
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "all the image")
OUT = os.path.join(ROOT, "img")
MAX_SIDE = 1600
QUALITY = 90
SKIP = {"tomatttooo.jpg"}  # 头像单独处理，不压缩


def main():
    os.makedirs(OUT, exist_ok=True)
    total_before = total_after = 0
    for f in sorted(os.listdir(SRC)):
        if f.lower() in SKIP:
            continue
        if not f.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        path = os.path.join(SRC, f)
        # 关键：应用 EXIF 旋转标记，竖构图照片保持竖构图
        im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
        w, h = im.size
        if max(w, h) > MAX_SIDE:
            s = MAX_SIDE / max(w, h)
            im = im.resize((max(1, int(w * s)), max(1, int(h * s))), Image.LANCZOS)
        name = os.path.splitext(f)[0] + ".jpg"
        out_path = os.path.join(OUT, name)
        im.save(out_path, "JPEG", quality=QUALITY, progressive=True, optimize=True)
        before = os.path.getsize(path)
        after = os.path.getsize(out_path)
        total_before += before
        total_after += after
        print(f"OK: {name}  {im.size[0]}x{im.size[1]}  {before//1024//1024}MB -> {after//1024}KB")

    print(f"\n总计: {total_before/1024/1024:.0f}MB -> {total_after/1024/1024:.1f}MB")


if __name__ == "__main__":
    main()
