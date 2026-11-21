# tomatttooo · 个人摄影网站

一个暗色优雅风格的摄影个人网站，包含首页、关于、作品集（可筛选）、拍摄灵感、格言、联系板块，以及照片参数卡工坊和两个小工具。

- 网站照片全部来自 `all the image/` 文件夹（17 张实拍照片，无占位图）
- 品牌标志为你的个人头像圆形裁切版 `assets/brand/avatar.png`（最大内切圆 · 原分辨率 PNG 无损），`assets/brand/favicon.png` 为 64px 网站图标

## 🛠 水印工坊（watermark.html）

页面风格与主页（index.html）完全统一（暗色番茄主题、同一导航、同款字体）。模板共 **8 款参数卡**：

| 模板 | 说明 |
| ---- | ---- |
| 参数叠层 | 经典摄影参数叠层：白字 + 左竖线直接叠在照片上 |
| 原创底栏 | 满宽米白底栏 + 品牌块 + 参数 |
| 两列底栏 | 米白条 + 品牌色块 + 两列参数 |
| 深色底栏 | 深色航空资料卡：深色条 + 品牌色左条，突出注册号/机型 |
| 铁路记录 | 米白条 + 细分隔线 + 中间大车次 |
| 玻璃浮层 | 轻量玻璃信息浮层：小圆角半透明信息条 |
| 虚化参数卡 | 全幅虚化照片背景 + 左侧参数列 + 右下品牌 |
| **专属底栏** | 与原创底栏同款布局，品牌块为你的圆形头像（tomatttooo.jpg）+ 红字标 |

### 字段体系（与参考站一致）

- **基础信息**：作品标题 / 摄影师 / 社交账号 / 拍摄日期（留空自动 EXIF 或今天）/ 拍摄地点 / 补充说明
- **拍摄参数**：相机（品牌型号库下拉，可自定义）/ 镜头 / 焦距 / 光圈 / 快门 / ISO
- **航空信息**：注册号 / 机型 / 航空公司 / 航班号（深色底栏使用，未填自动回退拍摄参数）
- **铁路信息**：车次 / 车型 / 机车号 / 线路 / 车站（铁路记录使用，未填自动回退拍摄参数）
- **排版与字体**：英文字体 / 字号比例 / 背景模糊 / 图片缩放 / 水平·垂直位置 / 文字水平·垂直对齐 / 文字块宽度 / 显示字段标签 / 显示品牌
- **输出设置**：尺寸预设 / 格式 / 质量

### 其他能力

- **三步工作流**：选择照片 → 选择模板 → 编辑导出（导入照片自动进入模板步）
- **📷 EXIF 自动识别**：自动读取相机/镜头/焦距/光圈/快门/ISO/拍摄日期并填入字段
- 品牌只有你自己（tomatttooo 文字 + 番茄红点缀），相机品牌体系已全部移除，相机为普通文本输入框
- 批量 ZIP（进度 + 取消）、预设保存/JSON 分享、设置自动保存、快捷键 Ctrl+S / Ctrl+Enter、按住看原图对比
- 全部本地处理，照片不上传

### 架构

- `js/watermark.js`：纯函数渲染引擎（`renderScene(ctx, W, H, img, st)`），预览 / 模板卡 / 批量共用一套代码
- `scripts/smoke-test.js`：Node 冒烟测试（7 模板渲染 + EXIF + CRC + ZIP），改代码后可运行验证

## 🧰 小工具

工具选择页：[tools.html](tools.html)，三个工具全部本地处理：

| 工具 | 说明 |
| ---- | ---- |
| [水印工坊](watermark.html) | 七款参数卡模板，EXIF 自动识别，批量 ZIP |
| [EXIF 查看器](exif.html) | 拖入照片查看相机、镜头、光圈、快门、ISO、拍摄时间，一键复制参数 |
| [画幅裁切](crop.html) | 按比例裁切（原图 / 1:1 / 4:3 / 3:2 / 16:9 / 9:16 / 4:5 / 5:4 / 2.35:1），拖动取景框，实时预览，导出尺寸可调 |
| [切图工具](split.html) | 九宫格 3×3 切图（裁正方形 / 原比例）、三格横切、二格横切（竖图不切），一键导出 ZIP |
| [图片压缩器](compress.html) | 批量压缩：按质量 / 目标大小（KB）/ 最长边，JPG·WebP 可选，单张或 ZIP 下载 |
| [格式转换器](convert.html) | JPG / PNG / WebP 互转，批量，质量可调，一键 ZIP |
| [色彩提取器](palette.html) | 提取照片主色调（前 8 色 + 占比），点色块复制色值，一键复制全部 |
| [拼图工具](collage.html) | 多图拼一张：横排/竖排/四宫格/六宫格/九宫格，间距背景可调，导出高清 JPG |
| [直方图查看器](histogram.html) | 亮度与 RGB 三通道直方图 + 曝光统计（平均亮度 / 过曝欠曝占比） |
| [旋转翻转工具](rotate.html) | 批量旋转 90/180 度、水平垂直镜像翻转，ZIP 导出 |
| [对比查看器](compare.html) | 两张照片滑块对比，拖动分割线查看前后差异 |
| [相框工具](frame.html) | 加白边/色边相框，按比例出图 |

小工具共用 `css/tools.css`，风格与主页一致。

> 性能说明：主页展示的是压缩后的网页版图片（`img/`，最长边 1600px，总计约 2.8MB），原图保留在 `all the image/`。新增照片后运行 `python scripts/build-images.py` 重新生成。旧版品牌 Logo 相关文件（`品牌水印/` 文件夹、`scripts/build-logos.py`、`js/user-logos.js`）已停用但保留在磁盘上。

## ✨ 趣味功能

| 功能 | 说明 |
| ---- | ---- |
| 🖱️ 鼠标聚光灯 | 首屏有一束柔光跟随鼠标移动（触屏设备自动隐藏） |
| 📊 真实 EXIF 参数 | 灯箱里显示每张照片**真实的** ISO / 快门 / 光圈 / 焦距（从原图提取，见 scripts/build-exif.py） |
| 🎲 拍摄灵感 | “今天拍点什么”板块随机抽取 24 个拍摄挑战 |
| ⬆ 回到顶部 | 页面下滑后右下角出现圆形按钮，一键平滑回顶 |

键盘操作：灯箱内 `←` / `→` 翻页，`Esc` 关闭。

## 文件结构

```
个人网站/
├── index.html          # 主页（改文字都在这里）
├── tools.html          # 工具选择页
├── watermark.html      # 水印工坊（七款参数卡）
├── exif.html           # EXIF 查看器
├── crop.html           # 画幅裁切工具
├── split.html          # 切图工具（九宫格 / 三格横切）
├── compress.html       # 图片压缩器（批量压缩）
├── convert.html        # 格式转换器（JPG/PNG/WebP）
├── palette.html        # 色彩提取器（主色调色板）
├── collage.html        # 拼图工具（多图拼一张）
├── histogram.html      # 直方图查看器（曝光分析）
├── rotate.html         # 旋转翻转工具
├── compare.html        # 对比查看器（前后滑块）
├── frame.html          # 相框工具
├── css/
│   ├── style.css       # 主页样式
│   ├── watermark.css   # 水印工坊样式
│   └── tools.css       # 工具选择页/小工具共用样式
├── js/
│   ├── main.js         # 主页交互（筛选 / 灯箱 / 动效）
│   ├── photo-exif.js   # 原图 EXIF 数据（由脚本生成，勿手改）
│   ├── watermark.js    # 水印工坊引擎
│   ├── exif.js         # EXIF 查看器
│   ├── crop.js         # 画幅裁切
│   ├── split.js        # 切图工具（九宫格 / 三格横切 / ZIP）
│   ├── compress.js     # 图片压缩器（质量 / 目标大小 / 尺寸）
│   ├── convert.js      # 格式转换器
│   ├── palette.js      # 色彩提取器
│   ├── collage.js      # 拼图工具
│   ├── histogram.js    # 直方图查看器
│   ├── rotate.js       # 旋转翻转工具
│   ├── compare.js      # 对比查看器
│   ├── frame.js        # 相框工具
│   └── preview-zoom.js # 预览缩放（滚轮 / 拖动平移）
├── assets/
│   └── brand/          # 头像圆形版 avatar.png + 网站图标 favicon.png
├── all the image/      # 你的实拍原图（大图，原样保留）
├── img/                # 网页预览版（最长边 1600px 压缩图，由脚本生成）
├── 品牌水印/           # 旧版品牌 Logo 原图（已停用，文件保留）
├── scripts/
│   ├── build-images.py # 主页图片压缩脚本（重新生成 img/）
│   ├── build-exif.py   # 原图 EXIF 提取脚本（重新生成 js/photo-exif.js）
│   ├── build-logos.py  # 旧版 Logo 处理脚本（已停用，保留备用）
│   └── smoke-test.js   # Node 冒烟测试
└── README.md           # 本说明
```

## 如何预览

双击 `index.html` 即可在浏览器打开。
也可以命令行启动本地服务器：

```powershell
python -m http.server 8000
```

然后访问 http://localhost:8000

## 换照片

1. 把新照片放进 `all the image/` 文件夹（建议长边 1600px 以上，格式 JPG/PNG）。
2. 打开 `index.html`，找到作品集部分的 `<figure class="card">` 块，把 `src="all%20the%20image/xxx.JPG"` 换成你的文件名（空格写成 `%20`）。
3. 修改 `alt` 文案、标题 `<h3>`。
4. 每个卡片都有 `data-category` 属性（landscape / portrait / street / still），对应筛选按钮，可以按需调整分类。
5. 顺手把卡片的 EXIF 参数改成真实数据：`data-iso`、`data-shutter`、`data-aperture`、`data-lens`。

> 网站已全部使用本地照片，离线可正常查看。若更换头像，重新运行一次圆形裁切即可（最大内切圆、PNG 无损），或直接告诉我。

## 常见修改

| 想改什么         | 改哪里                              |
| ---------------- | ------------------------------------ |
| 主题色（番茄红） | `css/style.css` 顶部的 `--accent`    |
| 首屏大标题/副标题 | `index.html` 的 `.hero__content` 部分 |
| 关于我的介绍文字 | `index.html` 的 `.about__text` 部分  |
| 联系方式的链接   | `index.html` 的 `.contact__links` 部分，替换 `href` |
| 拍摄灵感题库     | `js/main.js` 顶部的 `CHALLENGES` 数组 |
| 页脚版权文字     | `index.html` 的 `.footer` 部分       |

## 发布上线

把整个文件夹上传到任意静态托管即可，例如 GitHub Pages、Vercel、Netlify 或 Cloudflare Pages，无需任何构建步骤。
