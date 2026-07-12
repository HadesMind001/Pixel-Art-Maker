# Pixel Art Maker

A pixel art editor built with Electron. Click cells to draw, drag to paint, and export your creations as PNG.

![RGB Theme](https://img.shields.io/badge/theme-RGB%20Neon-ff3366) ![Electron](https://img.shields.io/badge/electron-33-47848f) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Tools**: Pencil, Eraser, Fill Bucket, Eyedropper
- **Adjustable grid**: 4x4 to 64x64
- **Zoom**: 1x to 32x
- **35 color palette** with custom color picker
- **Recent colors** history
- **Export** to PNG
- **Keyboard shortcuts**: 1-4 for tools, Ctrl+S to save
- **Auto-save** to localStorage
- **RGB neon cyberpunk UI**

## Install

```bash
npm install
```

## Run

```bash
npm start
```

## Build Linux package

```bash
npm run build
```

Produces an AppImage and .deb in `dist/`.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Pencil |
| `2` | Eraser |
| `3` | Fill |
| `4` | Eyedropper |
| `Ctrl+S` | Download PNG |
| `Ctrl+N` | New canvas |

## Tech Stack

- **Electron** - Desktop app
- **Vanilla JS** - No frameworks
- **Canvas API** - Pixel rendering
- **CSS** - Glass morphism, RGB gradients, scanlines