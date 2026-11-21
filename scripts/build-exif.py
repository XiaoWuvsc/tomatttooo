# -*- coding: utf-8 -*-
"""
把 all the image/ 里每张原图的 EXIF 提取成 js/photo-exif.js
（相机 / 镜头 / 焦距 / 光圈 / 快门 / ISO / 拍摄时间），供主页灯箱显示真实参数
用法：python scripts/build-exif.py
"""
import os
import json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "all the image")
OUT_JS = os.path.join(ROOT, "js", "photo-exif.js")


def rat(v):
    if v is None:
        return None
    try:
        r = round(float(v), 3)
        return r if r > 0 else None
    except Exception:
        return None


def clean(v):
    if v is None:
        return ""
    return str(v).replace("\x00", "").strip()


def main():
    data = {}
    for f in sorted(os.listdir(SRC)):
        if f.lower() == "tomatttooo.jpg":
            continue
        if not f.lower().endswith((".jpg", ".jpeg")):
            continue
        path = os.path.join(SRC, f)
        try:
            im = Image.open(path)
            exif = im.getexif()
            exif_ifd = exif.get_ifd(0x8769) if hasattr(exif, "get_ifd") else {}
            iso = exif_ifd.get(0x8827)
            iso = int(iso) if isinstance(iso, int) else ""
            key = os.path.splitext(f)[0]
            data[key] = {
                "make": clean(exif.get(0x010F)),
                "model": clean(exif.get(0x0110)),
                "lens": clean(exif_ifd.get(0xA434)),
                "focal": rat(exif_ifd.get(0x920A)),
                "fnum": rat(exif_ifd.get(0x829D)),
                "exp": rat(exif_ifd.get(0x829A)),
                "iso": iso,
                "date": clean(exif_ifd.get(0x9003)),
            }
            print("OK:", key, "|", data[key]["model"], "|",
                  ("1/" + str(round(1 / data[key]["exp"])) + "s") if data[key]["exp"] else "-",
                  "| f/" + str(data[key]["fnum"]) if data[key]["fnum"] else "-",
                  "| ISO", data[key]["iso"],
                  "|", data[key]["focal"], "mm")
        except Exception as e:
            print("SKIP:", f, e)

    js = "window.PHOTO_EXIF = " + json.dumps(data, ensure_ascii=False) + ";"
    with open(OUT_JS, "w", encoding="utf-8") as fp:
        fp.write(js)
    print("\n生成:", OUT_JS, "共", len(data), "张")


if __name__ == "__main__":
    main()
