# 弥散渐变生成器

一个本地运行的弥散渐变生成器，支持自定义画布比例、颜色、RGB 数值、弥散数量、弥散大小和拖拽位置，并可导出 PNG 或复制 CSS 渐变代码。

## 直接使用

推荐下载 Release 里的 `diffusion-gradient-generator-web.zip`，解压后双击 `index.html` 即可使用。

Web 版不需要安装，不需要启动服务，也不会触发 macOS 对未公证 `.app` 的“已损坏”拦截。

## macOS App 版

如果需要独立窗口，可以下载 `diffusion-gradient-generator-mac.zip`，解压后双击 `弥散渐变生成器.app`。

如果 macOS 首次打开提示安全限制，右键点击应用，选择“打开”。

如果从 GitHub 下载后提示“应用已损坏”，这是 macOS Gatekeeper 对未经过 Apple Developer ID 公证应用的拦截。可以在终端执行：

```bash
xattr -dr com.apple.quarantine /Applications/弥散渐变生成器.app
```

如果应用没有放在 `/Applications`，把命令里的路径替换成实际 `.app` 路径。

要让 `.app` 从 GitHub 下载后在所有 Mac 上完全无提示打开，需要 Apple Developer ID 证书签名并通过 Apple notarization。当前仓库里的 `.app` 只做了 ad-hoc signing。

## 功能

- 多种画布比例：`16:9`、`4:3`、`3:4`、`3:2`、`2:3`、`1:1`、`iPhone`
- 常用配色色卡和随机色卡
- 弥散数量增减
- 每个弥散独立 RGB、颜色、大小和位置
- 拖动画布上的控制点调整弥散位置
- 导出 PNG
- 复制 CSS 背景代码

## 从源码打包

需要 macOS Command Line Tools。

```bash
cd apple-diffusion-gradient-app
./native/build-mac-app.sh
```

打包后会生成：

```text
弥散渐变生成器.app
```

构建脚本会自动执行 ad-hoc code signing。若要做到下载后完全无安全提示，需要使用 Apple Developer ID 证书签名并通过 Apple notarization。

## 本地网页预览

可以直接打开 `index.html`，或启动本地静态服务：

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```
