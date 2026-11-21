# -*- coding: utf-8 -*-
"""
把 品牌水印/ 文件夹里的品牌 Logo 处理成内嵌数据文件 js/user-logos.js
处理步骤：去白底 / 去浅色噪点 / 连通域去噪 / 裁边 / 压缩到最长边 600px / base64
用法：python scripts/build-logos.py
新增品牌 Logo 后运行本脚本即可，无需改其他代码。
"""
import os, io, base64, json
from PIL import Image
import numpy as np
from collections import deque

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "品牌水印")
OUT = os.path.join(ROOT, "js", "user-logos.js")

# (品牌 key, 相对路径, 显示名, 处理模式)
# 模式：std=常规 | whitebg=去白底 | alpha=去浅色噪点(纯黑图形) | biggest=只留最大连通块 | whiten=保留红色其余变白(用于黑底条)
FILES = [
    ("sony",  r"sony\索尼黑色alpha标.png",  "SONY α 标志", "alpha"),
    ("sony",  r"sony\索尼黑色标志.png",     "SONY 字标",   "std"),
    ("nikon", r"nikon\尼康黄色徽标.png",    "尼康黄色徽标", "biggest"),
    ("nikon", r"nikon\尼康黑色文字徽标.png", "尼康黑色字标", "std"),
    ("canon", r"佳能\佳能红色标志.png",     "佳能字标",    "std"),
    ("hassy", r"哈苏\哈苏文字标.png",      "哈苏字标",    "std"),
    ("leica", r"徕卡\徕卡圆形标（非矢量图！）.jpg", "徕卡圆形标·白描", "whiten"),
    ("leica", r"徕卡\徕卡圆形标（非矢量图！）.jpg", "徕卡圆形标·原色", "whitebg"),
    ("ricoh", r"理光\Ricoh 2009 (new) Logo Vector.svg .png", "理光字标", "std"),
    ("fuji",  r"富士\Fujifilm Yeni Logo Vector.svg .png", "富士字标", "std"),
]


def components(mask):
    h, w = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    comps = []
    for y in range(h):
        for x in range(w):
            if mask[y, x] and not visited[y, x]:
                q = deque([(y, x)])
                visited[y, x] = True
                comp = []
                while q:
                    cy, cx = q.popleft()
                    comp.append((cy, cx))
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not visited[ny, nx]:
                                visited[ny, nx] = True
                                q.append((ny, nx))
                comps.append(comp)
    return comps


def process(path, mode):
    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if mode == "whitebg" and r >= 240 and g >= 240 and b >= 240 and a > 60:
                px[x, y] = (0, 0, 0, 0)
            elif mode == "alpha" and r >= 160 and g >= 160 and b >= 160:
                px[x, y] = (0, 0, 0, 0)
            elif a < 60:
                px[x, y] = (r, g, b, 0)

    if mode == "whiten":
        # 洪水填充：与边缘连通的白底 → 透明
        q = deque()
        seen = set()
        for xx in range(w):
            for yy in (0, h - 1):
                r, g, b, a = px[xx, yy]
                if a > 0 and r >= 235 and g >= 235 and b >= 235:
                    q.append((xx, yy))
                    seen.add((xx, yy))
        for yy in range(h):
            for xx in (0, w - 1):
                if (xx, yy) not in seen:
                    r, g, b, a = px[xx, yy]
                    if a > 0 and r >= 235 and g >= 235 and b >= 235:
                        q.append((xx, yy))
                        seen.add((xx, yy))
        while q:
            xx, yy = q.popleft()
            px[xx, yy] = (0, 0, 0, 0)
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = xx + dx, yy + dy
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen:
                    r, g, b, a = px[nx, ny]
                    if a > 0 and r >= 235 and g >= 235 and b >= 235:
                        seen.add((nx, ny))
                        q.append((nx, ny))
        # 剩余不透明像素：红色保留（徕卡红点/红环），其余变白（用于黑底条）
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a >= 60:
                    if r > 120 and g < 110 and b < 110:
                        px[x, y] = (r, g, b, a)
                    else:
                        px[x, y] = (255, 255, 255, a)

    arr = np.array(im)
    mask = arr[:, :, 3] > 100
    comps = components(mask)
    keep = np.zeros_like(mask, dtype=bool)
    if mode == "biggest":
        comps = sorted(comps, key=len, reverse=True)
        if comps:
            for cy, cx in comps[0]:
                keep[cy, cx] = True
    else:
        for comp in comps:
            if len(comp) >= 64:
                for cy, cx in comp:
                    keep[cy, cx] = True
    arr[~keep, 3] = 0
    im = Image.fromarray(arr)

    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    W, H = im.size
    if max(W, H) > 1100:
        s = 1100 / max(W, H)
        im = im.resize((max(1, int(W * s)), max(1, int(H * s))), Image.LANCZOS)

    buf = io.BytesIO()
    im.save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def main():
    groups = {}
    for brand, rel, name, mode in FILES:
        p = os.path.join(SRC, rel)
        if not os.path.exists(p):
            print("跳过（不存在）:", rel)
            continue
        uri = process(p, mode)
        groups.setdefault(brand, []).append({"name": name, "uri": uri})
        print("OK:", brand, name)

    js = ("// 本文件由 scripts/build-logos.py 从 品牌水印 文件夹自动生成，请勿手改\n"
          "window.BRAND_LOGO_FILES = " + json.dumps(groups, ensure_ascii=False, indent=2) + ";\n")
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(js)
    print("已写入:", OUT, f"({len(js) // 1024} KB)")


if __name__ == "__main__":
    main()
