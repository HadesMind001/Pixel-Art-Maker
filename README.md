# Pixel Art Maker

A pixel art editor with animation support, built with Electron. Draw, animate, and export GIFs.

![RGB Theme](https://img.shields.io/badge/theme-RGB%20Neon-ff3366) ![Electron](https://img.shields.io/badge/electron-33-47848f) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Tools**: Pencil, Eraser, Fill Bucket, Eyedropper
- **Animation timeline**: Add, duplicate, delete frames with thumbnails
- **Playback**: Play/pause animation with adjustable FPS (1-24)
- **Export**: Save as PNG or animated GIF
- **Adjustable grid**: 4x4 to 64x64
- **Zoom**: 1x to 32x
- **35 color palette** with custom color picker
- **Recent colors** history
- **Keyboard shortcuts**
- **Auto-save** frames and settings to localStorage
- **RGB neon cyberpunk UI** with glass morphism

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

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Pencil |
| `2` | Eraser |
| `3` | Fill |
| `4` | Eyedropper |
| `Space` | Play/Pause animation |
| `←` `→` | Previous/Next frame |
| `Ctrl+S` | Save PNG |
| `Ctrl+G` | Export GIF |
| `Ctrl+N` | New canvas |

## How to Animate

1. Draw your first frame on the canvas
2. Click **+** in the timeline to add a new frame
3. Draw the next frame (or click the duplicate button)
4. Repeat for each frame
5. Click **Play** to preview, or **Export GIF** to save

## Tech Stack

- **Electron** - Desktop app
- **gif.js** - GIF encoding
- **Vanilla JS** - No frameworks
- **Canvas API** - Pixel rendering
- **CSS** - Glass morphism, RGB gradients, scanlines