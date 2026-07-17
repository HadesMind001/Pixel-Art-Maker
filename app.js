const DEFAULT_COLORS = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff',
    '#884400', '#008844', '#880044', '#448800', '#444444',
    '#cccccc', '#ff8888', '#88ff88', '#8888ff', '#ffff88',
    '#ff88ff', '#88ffff', '#ffcc88', '#cc88ff', '#88ccff',
    '#aaaaaa', '#666666', '#ff4444', '#44ff44', '#4444ff',
    '#cccc44', '#cc44cc', '#44cccc', '#ffaa44', '#aa44ff',
];

const DEFAULT_GRID_SIZE = 16;
const DEFAULT_ZOOM = 16;
const MAX_RECENT_COLORS = 24;

let canvas = document.getElementById('pixelCanvas');
let ctx = canvas.getContext('2d');
let gridOverlay = document.getElementById('gridOverlay');
let gridOverlayCtx = gridOverlay.getContext('2d');

let gridSize = DEFAULT_GRID_SIZE;
let zoom = DEFAULT_ZOOM;
let currentColor = '#000000';
let currentTool = 'pencil';
let isDrawing = false;
let lastX = 0, lastY = 0;
let hoverX = -1, hoverY = -1;
let recentColors = [];

// Undo/Redo state
const MAX_HISTORY = 50;
let undoStack = {};
let redoStack = {};

// Onion skin state
let onionSkinEnabled = false;
let onionPrevOpacity = 30;
let onionNextOpacity = 30;

// Grid state
let gridVisible = true;
let gridOpacity = 12;

// Shape tool state
let shapeStartX = 0, shapeStartY = 0;
let shapeSnapshotData = null;

// Selection state
let selection = null;
let selectionStartX = 0, selectionStartY = 0;
let isDraggingSelection = false;
let selectionDragOffsetX = 0, selectionDragOffsetY = 0;
let selectionSnapshot = null;

// Symmetry state
let symmetryMode = 'none'; // 'none', 'horizontal', 'vertical', 'quad'

// Animation state
let frames = [];
let currentFrame = 0;
let isPlaying = false;
let playInterval = null;
let fps = 8;

const gridSizeInput = document.getElementById('gridSize');
const gridSizeValue = document.getElementById('gridSizeValue');
const zoomInput = document.getElementById('zoom');
const zoomValue = document.getElementById('zoomValue');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const exportGifBtn = document.getElementById('exportGifBtn');
const customColorInput = document.getElementById('customColor');
const addColorBtn = document.getElementById('addColorBtn');
const colorPalette = document.getElementById('colorPalette');
const recentColorsEl = document.getElementById('recentColors');
const coordsEl = document.getElementById('coords');
const currentSwatch = document.getElementById('currentSwatch');
const currentHex = document.getElementById('currentHex');

// Timeline elements
const prevFrameBtn = document.getElementById('prevFrameBtn');
const nextFrameBtn = document.getElementById('nextFrameBtn');
const playBtn = document.getElementById('playBtn');
const addFrameBtn = document.getElementById('addFrameBtn');
const dupFrameBtn = document.getElementById('dupFrameBtn');
const delFrameBtn = document.getElementById('delFrameBtn');
const fpsSlider = document.getElementById('fpsSlider');
const fpsValueEl = document.getElementById('fpsValue');
const frameCounter = document.getElementById('frameCounter');
const timelineFrames = document.getElementById('timelineFrames');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');

function init() {
    loadSettings();
    initColorPalette();
    initRecentColors();
    initFrames();
    setupEventListeners();
    loadFrameToCanvas();
    updateRecentColorsDisplay();
    selectColor(currentColor);
    updateToolButtons();
    document.getElementById('onionSkinBtn').classList.toggle('active', onionSkinEnabled);
    document.querySelectorAll('.onion-skin-control').forEach(el => {
        el.style.display = onionSkinEnabled ? 'flex' : 'none';
    });
    document.getElementById('onionPrevOpacity').value = onionPrevOpacity;
    document.getElementById('onionPrevValue').textContent = onionPrevOpacity + '%';
    document.getElementById('onionNextOpacity').value = onionNextOpacity;
    document.getElementById('onionNextValue').textContent = onionNextOpacity + '%';
    document.getElementById('gridToggleBtn').classList.toggle('active', !gridVisible);
    document.getElementById('gridOpacity').value = gridOpacity;
    document.getElementById('gridOpacityValue').textContent = gridOpacity + '%';
}

function loadSettings() {
    const savedGridSize = localStorage.getItem('pixelArtGridSize');
    const savedZoom = localStorage.getItem('pixelArtZoom');
    const savedColors = localStorage.getItem('pixelArtRecentColors');
    const savedColor = localStorage.getItem('pixelArtCurrentColor');
    const savedTool = localStorage.getItem('pixelArtCurrentTool');
    const savedFps = localStorage.getItem('pixelArtFps');
    const savedOnionSkin = localStorage.getItem('pixelArtOnionSkin');
    const savedOnionPrevOpacity = localStorage.getItem('pixelArtOnionPrevOpacity');
    const savedOnionNextOpacity = localStorage.getItem('pixelArtOnionNextOpacity');
    const savedGridVisible = localStorage.getItem('pixelArtGridVisible');
    const savedGridOpacity = localStorage.getItem('pixelArtGridOpacity');

    if (savedGridSize) gridSize = parseInt(savedGridSize);
    if (savedZoom) zoom = parseInt(savedZoom);
    if (savedColors) recentColors = JSON.parse(savedColors);
    if (savedColor) currentColor = savedColor;
    if (savedTool) currentTool = savedTool;
    if (savedFps) fps = parseInt(savedFps);
    if (savedOnionSkin !== null) onionSkinEnabled = savedOnionSkin === 'true';
    if (savedOnionPrevOpacity) onionPrevOpacity = parseInt(savedOnionPrevOpacity);
    if (savedOnionNextOpacity) onionNextOpacity = parseInt(savedOnionNextOpacity);
    if (savedGridVisible !== null) gridVisible = savedGridVisible === 'true';
    if (savedGridOpacity) gridOpacity = parseInt(savedGridOpacity);

    gridSizeInput.value = gridSize;
    gridSizeValue.textContent = gridSize;
    zoomInput.value = zoom;
    zoomValue.textContent = zoom + 'x';
    fpsSlider.value = fps;
    fpsValueEl.textContent = fps;
}

function saveSettings() {
    localStorage.setItem('pixelArtGridSize', gridSize);
    localStorage.setItem('pixelArtZoom', zoom);
    localStorage.setItem('pixelArtRecentColors', JSON.stringify(recentColors));
    localStorage.setItem('pixelArtCurrentColor', currentColor);
    localStorage.setItem('pixelArtCurrentTool', currentTool);
    localStorage.setItem('pixelArtFps', fps);
    localStorage.setItem('pixelArtOnionSkin', onionSkinEnabled);
    localStorage.setItem('pixelArtOnionPrevOpacity', onionPrevOpacity);
    localStorage.setItem('pixelArtOnionNextOpacity', onionNextOpacity);
    localStorage.setItem('pixelArtGridVisible', gridVisible);
    localStorage.setItem('pixelArtGridOpacity', gridOpacity);
    localStorage.setItem('pixelArtUndoStack', JSON.stringify(undoStack));
    localStorage.setItem('pixelArtRedoStack', JSON.stringify(redoStack));
}

// ─── Undo/Redo ──────────────────────────────────────────────

function getUndoStack(frameIndex) {
    if (!undoStack[frameIndex]) undoStack[frameIndex] = [];
    return undoStack[frameIndex];
}

function getRedoStack(frameIndex) {
    if (!redoStack[frameIndex]) redoStack[frameIndex] = [];
    return redoStack[frameIndex];
}

function pushUndoState() {
    const stack = getUndoStack(currentFrame);
    const frameData = [...frames[currentFrame]];
    stack.push(frameData);
    if (stack.length > MAX_HISTORY) stack.shift();
    redoStack[currentFrame] = [];
    saveSettings();
}

function undo() {
    if (isPlaying) stopPlayback();
    const stack = getUndoStack(currentFrame);
    if (stack.length === 0) return;
    const redoStackRef = getRedoStack(currentFrame);
    redoStackRef.push([...frames[currentFrame]]);
    const prevState = stack.pop();
    frames[currentFrame] = prevState;
    pixelData = [...frames[currentFrame]];
    renderCanvas();
    drawGridOverlay();
    renderTimeline();
    saveFrames();
    saveSettings();
}

function redo() {
    if (isPlaying) stopPlayback();
    const stack = getRedoStack(currentFrame);
    if (stack.length === 0) return;
    const undoStackRef = getUndoStack(currentFrame);
    undoStackRef.push([...frames[currentFrame]]);
    const nextState = stack.pop();
    frames[currentFrame] = nextState;
    pixelData = [...frames[currentFrame]];
    renderCanvas();
    drawGridOverlay();
    renderTimeline();
    saveFrames();
    saveSettings();
}

// ─── Frame Management ────────────────────────────────────

function createEmptyFrame() {
    return new Array(gridSize * gridSize).fill('#00000000');
}

function initFrames() {
    const saved = localStorage.getItem('pixelArtFrames');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (Array.isArray(data) && data.length > 0) {
                frames = data;
                currentFrame = 0;
                return;
            }
        } catch (e) {}
    }
    frames = [createEmptyFrame()];
    currentFrame = 0;
}

function saveFrames() {
    localStorage.setItem('pixelArtFrames', JSON.stringify(frames));
}

function getCurrentFrameData() {
    return frames[currentFrame];
}

function addFrame() {
    stopPlayback();
    frames.splice(currentFrame + 1, 0, createEmptyFrame());
    currentFrame++;
    loadFrameToCanvas();
    renderTimeline();
    saveFrames();
}

function duplicateFrame() {
    stopPlayback();
    const copy = [...frames[currentFrame]];
    frames.splice(currentFrame + 1, 0, copy);
    currentFrame++;
    loadFrameToCanvas();
    renderTimeline();
    saveFrames();
}

function deleteFrame() {
    if (frames.length <= 1) return;
    stopPlayback();
    frames.splice(currentFrame, 1);
    if (currentFrame >= frames.length) currentFrame = frames.length - 1;
    loadFrameToCanvas();
    renderTimeline();
    saveFrames();
}

function goToFrame(index) {
    if (index < 0 || index >= frames.length) return;
    saveCanvasToFrame();
    currentFrame = index;
    loadFrameToCanvas();
    renderTimeline();
}

function saveCanvasToFrame() {
    frames[currentFrame] = [...pixelData];
    saveFrames();
}

function loadFrameToCanvas() {
    pixelData = [...frames[currentFrame]];
    initCanvas();
    renderCanvas();
    drawGridOverlay();
    frameCounter.textContent = `${currentFrame + 1} / ${frames.length}`;
    renderTimeline();
}

function nextFrame() {
    saveCanvasToFrame();
    currentFrame = (currentFrame + 1) % frames.length;
    loadFrameToCanvas();
    renderTimeline();
}

function prevFrame() {
    saveCanvasToFrame();
    currentFrame = (currentFrame - 1 + frames.length) % frames.length;
    loadFrameToCanvas();
    renderTimeline();
}

// ─── Playback ────────────────────────────────────────────

function togglePlayback() {
    if (isPlaying) {
        stopPlayback();
    } else {
        startPlayback();
    }
}

function startPlayback() {
    saveCanvasToFrame();
    isPlaying = true;
    playBtn.classList.add('playing');
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';

    playInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % frames.length;
        loadFrameToCanvas();
        renderTimeline();
    }, 1000 / fps);
}

function stopPlayback() {
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
    }
    isPlaying = false;
    playBtn.classList.remove('playing');
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
}

function updateFps(newFps) {
    fps = newFps;
    fpsValueEl.textContent = fps;
    saveSettings();
    if (isPlaying) {
        stopPlayback();
        startPlayback();
    }
}

function toggleOnionSkin() {
    onionSkinEnabled = !onionSkinEnabled;
    document.getElementById('onionSkinBtn').classList.toggle('active', onionSkinEnabled);
    document.querySelectorAll('.onion-skin-control').forEach(el => {
        el.style.display = onionSkinEnabled ? 'flex' : 'none';
    });
    saveSettings();
    drawGridOverlay();
}

function toggleGrid() {
    gridVisible = !gridVisible;
    document.getElementById('gridToggleBtn').classList.toggle('active', !gridVisible);
    saveSettings();
    drawGridOverlay();
}

function toggleSymmetry() {
    const modes = ['none', 'horizontal', 'vertical', 'quad'];
    const currentIdx = modes.indexOf(symmetryMode);
    symmetryMode = modes[(currentIdx + 1) % modes.length];
    const btn = document.getElementById('symmetryBtn');
    btn.classList.toggle('active', symmetryMode !== 'none');
    btn.title = `Symmetry: ${symmetryMode} (X)`;
    saveSettings();
    drawGridOverlay();
}

// ─── Timeline Rendering ──────────────────────────────────

function renderTimeline() {
    timelineFrames.innerHTML = '';

    frames.forEach((frameData, i) => {
        const thumb = document.createElement('div');
        thumb.className = 'frame-thumb' + (i === currentFrame ? ' active' : '');

        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = gridSize;
        thumbCanvas.height = gridSize;
        const thumbCtx = thumbCanvas.getContext('2d');
        thumbCtx.imageSmoothingEnabled = false;

        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const color = frameData[y * gridSize + x];
                if (color && color !== '#00000000') {
                    thumbCtx.fillStyle = color;
                    thumbCtx.fillRect(x, y, 1, 1);
                }
            }
        }

        const num = document.createElement('span');
        num.className = 'frame-num';
        num.textContent = i + 1;

        const del = document.createElement('span');
        del.className = 'frame-delete';
        del.textContent = '\u00d7';
        del.addEventListener('click', (e) => {
            e.stopPropagation();
            frames.splice(i, 1);
            if (frames.length === 0) {
                frames = [createEmptyFrame()];
            }
            if (currentFrame >= frames.length) currentFrame = frames.length - 1;
            if (i === currentFrame || frames.length === 1) {
                loadFrameToCanvas();
            }
            renderTimeline();
            saveFrames();
        });

        thumb.appendChild(thumbCanvas);
        thumb.appendChild(num);
        thumb.appendChild(del);

        thumb.addEventListener('click', () => goToFrame(i));
        timelineFrames.appendChild(thumb);
    });

    frameCounter.textContent = `${currentFrame + 1} / ${frames.length}`;
}

// ─── GIF Export ──────────────────────────────────────────

function exportGif() {
    saveCanvasToFrame();

    const overlay = document.createElement('div');
    overlay.className = 'gif-export-overlay';
    overlay.innerHTML = `
        <div class="gif-export-modal">
            <h3>Exporting GIF</h3>
            <div class="progress-bar"><div class="progress-fill" id="gifProgress"></div></div>
            <div class="progress-text" id="gifProgressText">Encoding frame 0/${frames.length}...</div>
        </div>
    `;
    document.body.appendChild(overlay);

    const progressFill = document.getElementById('gifProgress');
    const progressText = document.getElementById('gifProgressText');

    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: gridSize,
        height: gridSize,
        workerScript: 'gif.worker.js'
    });

    const delay = Math.round(1000 / fps);

    frames.forEach((frameData) => {
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = gridSize;
        frameCanvas.height = gridSize;
        const frameCtx = frameCanvas.getContext('2d');
        frameCtx.imageSmoothingEnabled = false;

        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const color = frameData[y * gridSize + x];
                if (color && color !== '#00000000') {
                    frameCtx.fillStyle = color;
                    frameCtx.fillRect(x, y, 1, 1);
                }
            }
        }

        gif.addFrame(frameCanvas, { copy: true, delay: delay });
    });

    gif.on('progress', (p) => {
        const pct = Math.round(p * 100);
        progressFill.style.width = pct + '%';
        progressText.textContent = `Encoding... ${pct}%`;
    });

    gif.on('finished', (blob) => {
        overlay.remove();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pixel-art-${gridSize}x${gridSize}-${frames.length}f.gif`;
        a.click();
        URL.revokeObjectURL(url);
    });

    gif.render();
}

// ─── Sprite Sheet Export/Import ─────────────────────────────

function exportSpriteSheet() {
    saveCanvasToFrame();
    
    const cols = Math.ceil(Math.sqrt(frames.length));
    const rows = Math.ceil(frames.length / cols);
    
    const sheetCanvas = document.createElement('canvas');
    sheetCanvas.width = cols * gridSize;
    sheetCanvas.height = rows * gridSize;
    const sheetCtx = sheetCanvas.getContext('2d');
    sheetCtx.imageSmoothingEnabled = false;
    sheetCtx.fillStyle = '#00000000';
    sheetCtx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);
    
    frames.forEach((frameData, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = col * gridSize;
        const y = row * gridSize;
        
        for (let fy = 0; fy < gridSize; fy++) {
            for (let fx = 0; fx < gridSize; fx++) {
                const color = frameData[fy * gridSize + fx];
                if (color && color !== '#00000000') {
                    sheetCtx.fillStyle = color;
                    sheetCtx.fillRect(x + fx, y + fy, 1, 1);
                }
            }
        }
    });
    
    const dataUrl = sheetCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `sprite-sheet-${gridSize}x${gridSize}-${frames.length}f.png`;
    link.href = dataUrl;
    link.click();
}

function importSpriteSheet() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/gif';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const img = new Image();
        img.onload = () => {
            const cellSize = parseInt(prompt('Enter cell size (grid size per frame):', gridSize.toString()));
            if (!cellSize || cellSize <= 0) return;
            
            const cols = Math.floor(img.width / cellSize);
            const rows = Math.floor(img.height / cellSize);
            const totalFrames = cols * rows;
            
            if (totalFrames === 0) {
                alert('Image too small for the specified cell size!');
                return;
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const newFrames = [];
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const frameData = new Array(cellSize * cellSize).fill('#00000000');
                    const imageData = ctx.getImageData(col * cellSize, row * cellSize, cellSize, cellSize);
                    const pixels = imageData.data;
                    
                    for (let y = 0; y < cellSize; y++) {
                        for (let x = 0; x < cellSize; x++) {
                            const i = (y * cellSize + x) * 4;
                            const r = pixels[i];
                            const g = pixels[i + 1];
                            const b = pixels[i + 2];
                            const a = pixels[i + 3];
                            
                            if (a > 0) {
                                const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
                                frameData[y * cellSize + x] = hex;
                            }
                        }
                    }
                    newFrames.push(frameData);
                }
            }
            
            if (confirm(`Import ${newFrames.length} frames? This will replace current frames.`)) {
                stopPlayback();
                frames = newFrames;
                gridSize = cellSize;
                gridSizeInput.value = gridSize;
                gridSizeValue.textContent = gridSize;
                currentFrame = 0;
                loadFrameToCanvas();
                renderTimeline();
                saveFrames();
                saveSettings();
            }
        };
        img.src = URL.createObjectURL(file);
    };
    input.click();
}

// ─── Canvas ──────────────────────────────────────────────

function positionGridOverlay() {
    const container = document.getElementById('canvasContainer');
    const containerRect = container.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    gridOverlay.style.left = (canvasRect.left - containerRect.left) + 'px';
    gridOverlay.style.top = (canvasRect.top - containerRect.top) + 'px';
    gridOverlay.style.width = canvasRect.width + 'px';
    gridOverlay.style.height = canvasRect.height + 'px';
}

function initCanvas() {
    canvas.width = gridSize * zoom;
    canvas.height = gridSize * zoom;
    gridOverlay.width = gridSize * zoom;
    gridOverlay.height = gridSize * zoom;

    ctx.imageSmoothingEnabled = false;
    gridOverlayCtx.imageSmoothingEnabled = false;

    requestAnimationFrame(positionGridOverlay);
}

function initColorPalette() {
    colorPalette.innerHTML = '';
    DEFAULT_COLORS.forEach((color) => {
        const swatch = createColorSwatch(color);
        colorPalette.appendChild(swatch);
    });
}

function createColorSwatch(color) {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    swatch.dataset.color = color;
    swatch.title = color;
    swatch.addEventListener('click', () => selectColor(color));
    return swatch;
}

function initRecentColors() {
    if (recentColors.length === 0) {
        recentColors = DEFAULT_COLORS.slice(0, 8);
    }
}

function updateRecentColorsDisplay() {
    recentColorsEl.innerHTML = '';

    recentColors.forEach(color => {
        const swatch = createColorSwatch(color);
        recentColorsEl.appendChild(swatch);
    });

    while (recentColorsEl.children.length < MAX_RECENT_COLORS) {
        const empty = document.createElement('div');
        empty.className = 'color-swatch empty-swatch';
        recentColorsEl.appendChild(empty);
    }
}

function addToRecentColors(color) {
    if (color === 'eraser' || color === '#00000000') return;

    recentColors = recentColors.filter(c => c !== color);
    recentColors.unshift(color);
    if (recentColors.length > MAX_RECENT_COLORS) {
        recentColors.pop();
    }
    updateRecentColorsDisplay();
    saveSettings();
}

function updateCurrentColorPreview() {
    if (currentColor !== '#00000000') {
        currentSwatch.style.backgroundColor = currentColor;
        currentHex.textContent = currentColor.toUpperCase();
    }
}

function selectColor(color) {
    if (color === 'eraser') {
        selectTool('eraser');
        return;
    }

    currentColor = color;
    customColorInput.value = color;
    currentTool = 'pencil';

    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    document.querySelectorAll(`.color-swatch[data-color="${color}"]`).forEach(s => s.classList.add('active'));

    addToRecentColors(color);
    updateCurrentColorPreview();
    updateToolButtons();
    saveSettings();
}

function updateToolButtons() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === currentTool);
    });
}

function selectTool(tool) {
    if (tool === currentTool) return;
    commitSelection();
    currentTool = tool;

    if (tool === 'eraser') {
        canvas.style.cursor = 'cell';
    } else if (tool === 'eyedropper') {
        canvas.style.cursor = 'crosshair';
    } else if (tool === 'selection') {
        canvas.style.cursor = 'default';
    } else if (isShapeTool(tool)) {
        canvas.style.cursor = 'crosshair';
    } else {
        canvas.style.cursor = 'crosshair';
    }

    updateToolButtons();
    saveSettings();
}

function addCustomColor() {
    const color = customColorInput.value;
    selectColor(color);
}

function resizeAllFrames() {
    const oldGridSize = Math.sqrt(frames[0].length);
    if (oldGridSize === gridSize) return;

    frames = frames.map(frame => {
        const newData = createEmptyFrame();
        const minSize = Math.min(oldGridSize, gridSize);
        for (let y = 0; y < minSize; y++) {
            for (let x = 0; x < minSize; x++) {
                newData[y * gridSize + x] = frame[y * oldGridSize + x];
            }
        }
        return newData;
    });

    saveFrames();
}

function resizeCanvas() {
    saveCanvasToFrame();
    resizeAllFrames();
    loadFrameToCanvas();
}

function getCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((clientX - rect.left) * scaleX / zoom);
    const y = Math.floor((clientY - rect.top) * scaleY / zoom);
    return { x: Math.max(0, Math.min(gridSize - 1, x)), y: Math.max(0, Math.min(gridSize - 1, y)) };
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0] || e.changedTouches[0];
    if (e.type === 'touchstart') {
        startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
    } else if (e.type === 'touchmove') {
        draw({ clientX: touch.clientX, clientY: touch.clientY });
    }
}

function updateHover(e) {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    coordsEl.textContent = `${coords.x}, ${coords.y}`;
    if (coords.x !== hoverX || coords.y !== hoverY) {
        hoverX = coords.x;
        hoverY = coords.y;
        drawGridOverlay();
    }
}

function clearHover() {
    hoverX = -1;
    hoverY = -1;
    coordsEl.textContent = '\u2014';
    drawGridOverlay();
}

function startDrawing(e) {
    if (currentTool === 'eyedropper') {
        pickColor(e);
        return;
    }

    if (currentTool === 'selection') {
        startSelection(e);
        return;
    }

    isDrawing = true;
    pushUndoState();
    const coords = getCanvasCoords(e.clientX, e.clientY);
    lastX = coords.x;
    lastY = coords.y;

    if (isShapeTool(currentTool)) {
        shapeStartX = coords.x;
        shapeStartY = coords.y;
        shapeSnapshotData = [...pixelData];
    } else {
        drawPixel(coords.x, coords.y);
    }
}

function startSelection(e) {
    const coords = getCanvasCoords(e.clientX, e.clientY);

    if (selection && coords.x >= selection.x && coords.x < selection.x + selection.w &&
        coords.y >= selection.y && coords.y < selection.y + selection.h) {
        isDraggingSelection = true;
        selectionDragOffsetX = coords.x - selection.x;
        selectionDragOffsetY = coords.y - selection.y;
        selectionSnapshot = [...pixelData];
        pushUndoState();
    } else {
        commitSelection();
        selectionStartX = coords.x;
        selectionStartY = coords.y;
        isDrawing = true;
        selection = { x: coords.x, y: coords.y, w: 1, h: 1 };
    }
}

function commitSelection() {
    if (!selection) return;
    selection = null;
    selectionSnapshot = null;
    drawGridOverlay();
}

function deleteSelection() {
    if (!selection) return;
    pushUndoState();
    for (let y = selection.y; y < selection.y + selection.h; y++) {
        for (let x = selection.x; x < selection.x + selection.w; x++) {
            if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
                pixelData[y * gridSize + x] = '#00000000';
            }
        }
    }
    renderCanvas();
    drawGridOverlay();
    saveCanvasToFrame();
}

function copySelection() {
    if (!selection) return;
    const copied = [];
    for (let y = selection.y; y < selection.y + selection.h; y++) {
        for (let x = selection.x; x < selection.x + selection.w; x++) {
            if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
                copied.push(pixelData[y * gridSize + x]);
            } else {
                copied.push('#00000000');
            }
        }
    }
    window._clipboardSelection = { w: selection.w, h: selection.h, pixels: copied };
}

function pasteSelection() {
    if (!window._clipboardSelection) return;
    commitSelection();
    pushUndoState();
    const clip = window._clipboardSelection;
    selection = { x: 0, y: 0, w: clip.w, h: clip.h };
    for (let y = 0; y < clip.h; y++) {
        for (let x = 0; x < clip.w; x++) {
            const px = x;
            const py = y;
            if (px >= 0 && px < gridSize && py >= 0 && py < gridSize) {
                const color = clip.pixels[y * clip.w + x];
                if (color !== '#00000000') {
                    pixelData[py * gridSize + px] = color;
                }
            }
        }
    }
    renderCanvas();
    drawGridOverlay();
    saveCanvasToFrame();
}

function moveSelection(dx, dy) {
    if (!selection) return;
    selection.x = Math.max(0, Math.min(gridSize - selection.w, selection.x + dx));
    selection.y = Math.max(0, Math.min(gridSize - selection.h, selection.y + dy));
    drawGridOverlay();
}

function isShapeTool(tool) {
    return tool === 'line' || tool === 'rect' || tool === 'rectFill' || tool === 'circle' || tool === 'circleFill' || tool === 'ellipse' || tool === 'ellipseFill';
}

function draw(e) {
    if (!isDrawing) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);

    if (currentTool === 'selection') {
        if (isDraggingSelection) {
            selection.x = coords.x - selectionDragOffsetX;
            selection.y = coords.y - selectionDragOffsetY;
            selection.x = Math.max(0, Math.min(gridSize - selection.w, selection.x));
            selection.y = Math.max(0, Math.min(gridSize - selection.h, selection.y));
            drawGridOverlay();
        } else {
            const sx = Math.min(selectionStartX, coords.x);
            const sy = Math.min(selectionStartY, coords.y);
            const ex = Math.max(selectionStartX, coords.x);
            const ey = Math.max(selectionStartY, coords.y);
            selection = { x: sx, y: sy, w: ex - sx + 1, h: ey - sy + 1 };
            drawGridOverlay();
        }
        return;
    }

    if (isShapeTool(currentTool)) {
        pixelData = [...shapeSnapshotData];
        drawShape(shapeStartX, shapeStartY, coords.x, coords.y, currentTool);
        renderCanvas();
    } else if (currentTool === 'pencil' || currentTool === 'eraser') {
        drawLine(lastX, lastY, coords.x, coords.y);
    }

    lastX = coords.x;
    lastY = coords.y;
}

function drawShape(x0, y0, x1, y1, tool) {
    switch (tool) {
        case 'line':
            drawShapeLine(x0, y0, x1, y1);
            break;
        case 'rect':
            drawShapeRect(x0, y0, x1, y1, false);
            break;
        case 'rectFill':
            drawShapeRect(x0, y0, x1, y1, true);
            break;
        case 'circle':
            drawShapeEllipse(x0, y0, x1, y1, false);
            break;
        case 'circleFill':
            drawShapeEllipse(x0, y0, x1, y1, true);
            break;
        case 'ellipse':
            drawShapeEllipse(x0, y0, x1, y1, false);
            break;
        case 'ellipseFill':
            drawShapeEllipse(x0, y0, x1, y1, true);
            break;
    }
}

function drawShapeLine(x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0, y = y0;

    while (true) {
        setPixelColor(x, y, currentColor);
        if (x === x1 && y === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
    }
}

function drawShapeRect(x0, y0, x1, y1, filled) {
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);

    if (filled) {
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                setPixelColor(x, y, currentColor);
            }
        }
    } else {
        for (let x = minX; x <= maxX; x++) {
            setPixelColor(x, minY, currentColor);
            setPixelColor(x, maxY, currentColor);
        }
        for (let y = minY; y <= maxY; y++) {
            setPixelColor(minX, y, currentColor);
            setPixelColor(maxX, y, currentColor);
        }
    }
}

function drawShapeEllipse(x0, y0, x1, y1, filled) {
    const cx = Math.floor((x0 + x1) / 2);
    const cy = Math.floor((y0 + y1) / 2);
    const rx = Math.floor(Math.abs(x1 - x0) / 2);
    const ry = Math.floor(Math.abs(y1 - y0) / 2);

    if (rx === 0 && ry === 0) {
        setPixelColor(cx, cy, currentColor);
        return;
    }

    if (filled) {
        for (let y = -ry; y <= ry; y++) {
            for (let x = -rx; x <= rx; x++) {
                if ((x * x) / (rx * rx || 1) + (y * y) / (ry * ry || 1) <= 1) {
                    setPixelColor(cx + x, cy + y, currentColor);
                }
            }
        }
    } else {
        let x = 0, y = ry;
        let d1 = (ry * ry) - (rx * rx * ry) + (0.25 * rx * rx);
        let dx = 2 * ry * ry * x;
        let dy = 2 * rx * rx * y;

        while (dx < dy) {
            setPixelColor(cx + x, cy + y, currentColor);
            setPixelColor(cx - x, cy + y, currentColor);
            setPixelColor(cx + x, cy - y, currentColor);
            setPixelColor(cx - x, cy - y, currentColor);
            if (d1 < 0) { x++; dx += 2 * ry * ry; d1 += dx + ry * ry; }
            else { x++; y--; dx += 2 * ry * ry; dy -= 2 * rx * rx; d1 += dx - dy + ry * ry; }
        }

        let d2 = ((ry * ry) * ((x + 0.5) * (x + 0.5))) + ((rx * rx) * ((y - 1) * (y - 1))) - (rx * rx * ry * ry);
        while (y >= 0) {
            setPixelColor(cx + x, cy + y, currentColor);
            setPixelColor(cx - x, cy + y, currentColor);
            setPixelColor(cx + x, cy - y, currentColor);
            setPixelColor(cx - x, cy - y, currentColor);
            if (d2 > 0) { y--; dy -= 2 * rx * rx; d2 += rx * rx - dy; }
            else { y--; x++; dx += 2 * ry * ry; dy -= 2 * rx * rx; d2 += dx - dy + rx * rx; }
        }
    }
}

function setPixelColor(x, y, color) {
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
    pixelData[y * gridSize + x] = color;
}

function stopDrawing() {
    if (isDrawing && currentTool === 'selection') {
        isDraggingSelection = false;
        isDrawing = false;
        return;
    }
    if (isDrawing && currentTool === 'fill') {
        pushUndoState();
        fill(lastX, lastY);
    }
    if (isShapeTool(currentTool) && shapeSnapshotData) {
        shapeSnapshotData = null;
    }
    isDrawing = false;
    saveCanvasToFrame();
}

function drawPixel(x, y) {
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;

    const index = y * gridSize + x;
    const color = currentTool === 'eraser' ? '#00000000' : currentColor;

    if (pixelData[index] !== color) {
        pixelData[index] = color;
        renderPixel(x, y);
    }

    if (symmetryMode !== 'none' && currentTool !== 'eraser') {
        if (symmetryMode === 'horizontal' || symmetryMode === 'quad') {
            const mx = gridSize - 1 - x;
            if (mx !== x) {
                const mi = y * gridSize + mx;
                if (pixelData[mi] !== color) {
                    pixelData[mi] = color;
                    renderPixel(mx, y);
                }
            }
        }
        if (symmetryMode === 'vertical' || symmetryMode === 'quad') {
            const my = gridSize - 1 - y;
            if (my !== y) {
                const vi = my * gridSize + x;
                if (pixelData[vi] !== color) {
                    pixelData[vi] = color;
                    renderPixel(x, my);
                }
            }
        }
        if (symmetryMode === 'quad') {
            const mx = gridSize - 1 - x;
            const my = gridSize - 1 - y;
            if (mx !== x && my !== y) {
                const qi = my * gridSize + mx;
                if (pixelData[qi] !== color) {
                    pixelData[qi] = color;
                    renderPixel(mx, my);
                }
            }
        }
    }
}

function drawLine(x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0, y = y0;

    while (true) {
        drawPixel(x, y);
        if (x === x1 && y === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
    }
}

function fill(x, y) {
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;

    const targetColor = pixelData[y * gridSize + x];
    const fillColor = currentTool === 'eraser' ? '#00000000' : currentColor;

    if (targetColor === fillColor) return;

    const stack = [[x, y]];
    const visited = new Set();

    while (stack.length > 0) {
        const [cx, cy] = stack.pop();
        const key = `${cx},${cy}`;

        if (visited.has(key)) continue;
        if (cx < 0 || cx >= gridSize || cy < 0 || cy >= gridSize) continue;

        const index = cy * gridSize + cx;
        if (pixelData[index] !== targetColor) continue;

        visited.add(key);
        pixelData[index] = fillColor;
        renderPixel(cx, cy);

        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
}

function pickColor(e) {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const color = pixelData[coords.y * gridSize + coords.x];
    if (color !== '#00000000') {
        selectColor(color);
    }
}

function renderCanvas() {
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            renderPixel(x, y);
        }
    }
}

function renderPixel(x, y) {
    const index = y * gridSize + x;
    const color = pixelData[index];

    if (color === '#00000000') {
        const isEven = (x + y) % 2 === 0;
        ctx.fillStyle = isEven ? '#1e1e32' : '#1a1a2e';
    } else {
        ctx.fillStyle = color;
    }
    ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
}

function drawGridOverlay() {
    gridOverlayCtx.clearRect(0, 0, gridOverlay.width, gridOverlay.height);

    // Draw onion skin frames
    if (onionSkinEnabled) {
        drawOnionSkin();
    }

    if (gridVisible) {
        gridOverlayCtx.strokeStyle = `rgba(255,255,255,${gridOpacity / 100})`;
        gridOverlayCtx.lineWidth = 1;

        for (let x = 0; x <= gridSize; x++) {
            gridOverlayCtx.beginPath();
            gridOverlayCtx.moveTo(x * zoom + 0.5, 0);
            gridOverlayCtx.lineTo(x * zoom + 0.5, gridSize * zoom);
            gridOverlayCtx.stroke();
        }

        for (let y = 0; y <= gridSize; y++) {
            gridOverlayCtx.beginPath();
            gridOverlayCtx.moveTo(0, y * zoom + 0.5);
            gridOverlayCtx.lineTo(gridSize * zoom, y * zoom + 0.5);
            gridOverlayCtx.stroke();
        }
    }

    if (selection) {
        const sx = selection.x * zoom;
        const sy = selection.y * zoom;
        const sw = selection.w * zoom;
        const sh = selection.h * zoom;

        gridOverlayCtx.strokeStyle = '#ffffff';
        gridOverlayCtx.lineWidth = 2;
        gridOverlayCtx.setLineDash([4, 4]);
        gridOverlayCtx.lineDashOffset = -(Date.now() / 50) % 8;
        gridOverlayCtx.strokeRect(sx + 1, sy + 1, sw - 2, sh - 2);
        gridOverlayCtx.strokeStyle = '#000000';
        gridOverlayCtx.lineDashOffset = -(Date.now() / 50 + 4) % 8;
        gridOverlayCtx.strokeRect(sx + 1, sy + 1, sw - 2, sh - 2);
        gridOverlayCtx.setLineDash([]);
    }

    if (hoverX >= 0 && hoverX < gridSize && hoverY >= 0 && hoverY < gridSize) {
        gridOverlayCtx.fillStyle = 'rgba(255, 51, 102, 0.12)';
        gridOverlayCtx.fillRect(hoverX * zoom, hoverY * zoom, zoom, zoom);

        gridOverlayCtx.strokeStyle = 'rgba(255, 51, 102, 0.7)';
        gridOverlayCtx.lineWidth = 2;
        gridOverlayCtx.strokeRect(hoverX * zoom + 1, hoverY * zoom + 1, zoom - 2, zoom - 2);
    }

    if (selection) {
        requestAnimationFrame(() => drawGridOverlay());
    }

    if (symmetryMode !== 'none') {
        gridOverlayCtx.strokeStyle = 'rgba(51, 255, 204, 0.5)';
        gridOverlayCtx.lineWidth = 1;
        gridOverlayCtx.setLineDash([4, 4]);

        if (symmetryMode === 'horizontal' || symmetryMode === 'quad') {
            const cx = gridSize * zoom / 2;
            gridOverlayCtx.beginPath();
            gridOverlayCtx.moveTo(cx + 0.5, 0);
            gridOverlayCtx.lineTo(cx + 0.5, gridSize * zoom);
            gridOverlayCtx.stroke();
        }

        if (symmetryMode === 'vertical' || symmetryMode === 'quad') {
            const cy = gridSize * zoom / 2;
            gridOverlayCtx.beginPath();
            gridOverlayCtx.moveTo(0, cy + 0.5);
            gridOverlayCtx.lineTo(gridSize * zoom, cy + 0.5);
            gridOverlayCtx.stroke();
        }

        gridOverlayCtx.setLineDash([]);
    }
}

function drawOnionSkin() {
    const prevIndex = (currentFrame - 1 + frames.length) % frames.length;
    const nextIndex = (currentFrame + 1) % frames.length;

    if (frames.length <= 1) return;

    const prevFrame = frames[prevIndex];
    const nextFrame = frames[nextIndex];

    if (onionSkinPrevOpacity > 0) {
        drawFrameOnOverlay(prevFrame, onionSkinPrevOpacity, '#ff3366');
    }
    if (onionSkinNextOpacity > 0) {
        drawFrameOnOverlay(nextFrame, onionSkinNextOpacity, '#3366ff');
    }
}

function drawFrameOnOverlay(frameData, opacity, tintColor) {
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const color = frameData[y * gridSize + x];
            if (color && color !== '#00000000') {
                gridOverlayCtx.fillStyle = tintColor;
                gridOverlayCtx.globalAlpha = opacity;
                gridOverlayCtx.fillRect(x * zoom, y * zoom, zoom, zoom);
                gridOverlayCtx.globalAlpha = 1;
            }
        }
    }
}

function clearCanvas() {
    pushUndoState();
    pixelData.fill('#00000000');
    frames[currentFrame] = [...pixelData];
    renderCanvas();
    drawGridOverlay();
    saveFrames();
    renderTimeline();
}

function saveCanvasState() {
    saveCanvasToFrame();
}

function loadCanvasState() {
    // Handled by initFrames
}

function downloadCanvas() {
    saveCanvasToFrame();

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = gridSize;
    exportCanvas.height = gridSize;
    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.imageSmoothingEnabled = false;

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const color = pixelData[y * gridSize + x];
            if (color !== '#00000000') {
                exportCtx.fillStyle = color;
                exportCtx.fillRect(x, y, 1, 1);
            }
        }
    }

    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `pixel-art-${gridSize}x${gridSize}.png`;
    link.href = dataUrl;
    link.click();
}

function setupEventListeners() {
    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => selectTool(btn.dataset.tool));
    });

    gridSizeInput.addEventListener('input', (e) => {
        gridSize = parseInt(e.target.value);
        gridSizeValue.textContent = gridSize;
        stopPlayback();
        saveCanvasToFrame();
        resizeAllFrames();
        loadFrameToCanvas();
        saveSettings();
    });

    zoomInput.addEventListener('input', (e) => {
        zoom = parseInt(e.target.value);
        zoomValue.textContent = zoom + 'x';
        saveCanvasToFrame();
        loadFrameToCanvas();
        saveSettings();
    });

    clearBtn.addEventListener('click', clearCanvas);
    downloadBtn.addEventListener('click', downloadCanvas);
    exportGifBtn.addEventListener('click', exportGif);
    document.getElementById('exportSpriteSheetBtn').addEventListener('click', exportSpriteSheet);
    document.getElementById('importSpriteSheetBtn').addEventListener('click', importSpriteSheet);
    addColorBtn.addEventListener('click', addCustomColor);
    customColorInput.addEventListener('input', () => {
        currentColor = customColorInput.value;
    });

    document.getElementById('gridToggleBtn').addEventListener('click', toggleGrid);
    document.getElementById('gridOpacity').addEventListener('input', (e) => {
        gridOpacity = parseInt(e.target.value);
        document.getElementById('gridOpacityValue').textContent = gridOpacity + '%';
        saveSettings();
        drawGridOverlay();
    });

    document.getElementById('symmetryBtn').addEventListener('click', toggleSymmetry);

    // Canvas events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', (e) => {
        updateHover(e);
        draw(e);
    });
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', () => {
        stopDrawing();
        clearHover();
    });
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    window.addEventListener('resize', () => {
        drawGridOverlay();
        positionGridOverlay();
    });

    // Timeline controls
    prevFrameBtn.addEventListener('click', prevFrame);
    nextFrameBtn.addEventListener('click', nextFrame);
    playBtn.addEventListener('click', togglePlayback);
    addFrameBtn.addEventListener('click', addFrame);
    dupFrameBtn.addEventListener('click', duplicateFrame);
    delFrameBtn.addEventListener('click', deleteFrame);

    const onionSkinBtn = document.getElementById('onionSkinBtn');
    const onionPrevSlider = document.getElementById('onionPrevOpacity');
    const onionNextSlider = document.getElementById('onionNextOpacity');
    const onionPrevValueEl = document.getElementById('onionPrevValue');
    const onionNextValueEl = document.getElementById('onionNextValue');
    const onionSkinControls = document.querySelectorAll('.onion-skin-control');

    onionSkinBtn.addEventListener('click', toggleOnionSkin);
    onionPrevSlider.addEventListener('input', (e) => {
        onionPrevOpacity = parseInt(e.target.value);
        onionPrevValueEl.textContent = onionPrevOpacity + '%';
        saveSettings();
        drawGridOverlay();
    });
    onionNextSlider.addEventListener('input', (e) => {
        onionNextOpacity = parseInt(e.target.value);
        onionNextValueEl.textContent = onionNextOpacity + '%';
        saveSettings();
        drawGridOverlay();
    });

    fpsSlider.addEventListener('input', (e) => {
        updateFps(parseInt(e.target.value));
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        if (e.key >= '1' && e.key <= '9') {
            const tools = ['pencil', 'eraser', 'fill', 'eyedropper', 'line', 'rect', 'rectFill', 'circle', 'circleFill'];
            selectTool(tools[parseInt(e.key) - 1]);
        }

        if (e.key === '0') {
            selectTool('selection');
        }

        if (e.key === ' ') {
            e.preventDefault();
            togglePlayback();
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevFrame();
        }

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextFrame();
        }

        if (e.key === 'o' || e.key === 'O') {
            e.preventDefault();
            toggleOnionSkin();
        }

        if (e.key === 'g' || e.key === 'G') {
            e.preventDefault();
            toggleGrid();
        }

        if (e.key === 'x' || e.key === 'X') {
            e.preventDefault();
            toggleSymmetry();
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                redo();
            } else {
                undo();
            }
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            redo();
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            if (selection) {
                e.preventDefault();
                copySelection();
            }
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            if (window._clipboardSelection) {
                e.preventDefault();
                pasteSelection();
            }
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selection && currentTool === 'selection') {
                e.preventDefault();
                deleteSelection();
            }
        }

        if (e.key === 'Escape') {
            if (selection) {
                e.preventDefault();
                commitSelection();
            }
        }
    });
}

init();