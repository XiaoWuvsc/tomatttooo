# -*- coding: utf-8 -*-
"""把 deploy 打包成 zip（UTF-8 文件名，宝塔可直接在线解压）"""
import io, sys, os, zipfile
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

root = r"E:\dswork\个人网站"
src = os.path.join(root, "deploy")
out = os.path.join(root, "tomatttooo-宝塔部署包.zip")
if os.path.exists(out):
    os.remove(out)

with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for dirpath, dirs, files in os.walk(src):
        for f in files:
            full = os.path.join(dirpath, f)
            rel = os.path.relpath(full, src)
            z.write(full, rel)

size = os.path.getsize(out) / 1024 / 1024
print("打包完成:", out, "%.2f MB" % size)
