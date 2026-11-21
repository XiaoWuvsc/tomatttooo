# -*- coding: utf-8 -*-
"""生成部署目录 deploy/：只包含线上需要的文件"""
import io, sys, os, shutil
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

root = r"E:\dswork\个人网站"
deploy = os.path.join(root, "deploy")

if os.path.exists(deploy):
    shutil.rmtree(deploy)
os.makedirs(deploy)

# 需要的文件
for name in os.listdir(root):
    p = os.path.join(root, name)
    if os.path.isfile(p) and name.endswith(".html"):
        shutil.copy2(p, os.path.join(deploy, name))

shutil.copytree(os.path.join(root, "css"), os.path.join(deploy, "css"))
shutil.copytree(os.path.join(root, "img"), os.path.join(deploy, "img"))
os.makedirs(os.path.join(deploy, "js"))
for f in os.listdir(os.path.join(root, "js")):
    if f in ("user-logos.js",):   # 旧品牌 Logo 数据（1MB，未使用）
        continue
    shutil.copy2(os.path.join(root, "js", f), os.path.join(deploy, "js", f))

shutil.copytree(os.path.join(root, "assets"), os.path.join(deploy, "assets"))

total = 0
for dirpath, dirs, files in os.walk(deploy):
    for f in files:
        total += os.path.getsize(os.path.join(dirpath, f))
print("deploy 目录已生成, 总大小: %.1f MB, 文件数:" % (total / 1024 / 1024), sum(len(fs) for _, _, fs in os.walk(deploy)))
