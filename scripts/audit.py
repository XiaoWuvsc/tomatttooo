# -*- coding: utf-8 -*-
"""全站体检：引用完整性 + 残留检查"""
import io, sys, os, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

root = r"E:\dswork\个人网站"
issues = []

# 1) 每个 HTML 的本地引用是否存在
for dirpath, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d not in ("品牌水印", "all the image", "img")]
    for f in files:
        if not f.endswith(".html"):
            continue
        p = os.path.join(dirpath, f)
        t = open(p, encoding="utf-8").read()
        base = os.path.dirname(p)
        refs = re.findall(r'(?:href|src)="([^"#][^"]*)"', t)
        for r in refs:
            if r.startswith(("http", "mailto:", "data:", "javascript:")):
                continue
            rp = r.split("?")[0]
            full = os.path.normpath(os.path.join(base, rp))
            if not os.path.exists(full):
                issues.append(f"{f}: 引用缺失 -> {r}")

# 2) index.html 图片引用
p = os.path.join(root, "index.html")
t = open(p, encoding="utf-8").read()
for m in re.findall(r'src="(img/[^"]+)"', t):
    full = os.path.normpath(os.path.join(root, m))
    if not os.path.exists(full):
        issues.append(f"index.html: 图片缺失 -> {m}")

# 3) 残留检查：已删除文件/名称
for name in ["mosaic", "test-avatar", "test-icons", "test-pixel", "胶片", "film-toggle", "点赞", "放大镜", "loupe"]:
    for dirpath, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in ("品牌水印", "all the image", "img", ".git")]
        for f in files:
            fp = os.path.join(dirpath, f)
            if f.endswith((".html", ".js", ".css")):
                tt = open(fp, encoding="utf-8").read()
                if name in tt and name not in ("胶片",):
                    issues.append(f"{os.path.relpath(fp, root)}: 残留关键词 -> {name}")

# 4) Emoji 残留（HTML 文本节点外，属性内也查）
emoji_re = re.compile("[\U0001F000-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF]")
for dirpath, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d not in ("品牌水印", "all the image", "img")]
    for f in files:
        if not f.endswith((".html", ".js")):
            continue
        p = os.path.join(dirpath, f)
        t = open(p, encoding="utf-8").read()
        # 排除 icons.js（图标库定义）与 theme-toggle 按钮文字(💧已删)等合法使用
        if f in ("icons.js",):
            continue
        hits = emoji_re.findall(t)
        if hits:
            issues.append(f"{os.path.relpath(p, root)}: Emoji 残留 {len(hits)} 个 -> {' '.join(hits[:6])}")

print("=" * 40)
if issues:
    for i in issues:
        print("⚠️", i)
else:
    print("✅ 无引用缺失、无残留、无多余 Emoji")
