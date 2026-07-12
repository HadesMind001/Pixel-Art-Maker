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
let pixelData = [];
let recentColors = [];
let hoverX = -1, hoverY = -1;

const gridSizeInput = document.getElementById('gridSize');
const gridSizeValue = document.getElementById('gridSizeValue');
const zoomInput = document.getElementById('zoom');
const zoomValue = document.getElementById('zoomValue');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const customColorInput = document.getElementById('customColor');
const addColorBtn = document.getElementById('addColorBtn');
const colorPalette = document.getElementById('colorPalette');
const recentColorsEl = document.getElementById('recentColors');
const coordsEl = document.getElementById('coords');
const currentSwatch = document.getElementById('currentSwatch');
const currentHex = document.getElementById('currentHex');

function init() {
    loadCanvasState();
    loadSettings();
    initColorPalette();
    initRecentColors();
    initCanvas();
    setupEventListeners();
    renderCanvas();
    drawGridOverlay();
    updateRecentColorsDisplay();
    selectColor(currentColor);
    updateToolButtons();
}

function loadSettings() {
    const savedGridSize = localStorage.getItem('pixelArtGridSize');
    const savedZoom = localStorage.getItem('pixelArtZoom');
    const savedColors = localStorage.getItem('pixelArtRecentColors');
    const savedColor = localStorage.getItem('pixelArtCurrentColor');
    const savedTool = localStorage.getItem('pixelArtCurrentTool');

    if (savedGridSize) gridSize = parseInt(savedGridSize);
    if (savedZoom) zoom = parseInt(savedZoom);
    if (savedColors) recentColors = JSON.parse(savedColors);
    if (savedColor) currentColor = savedColor;
    if (savedTool) currentTool = savedTool;

    gridSizeInput.value = gridSize;
    gridSizeValue.textContent = gridSize;
    zoomInput.value = zoom;
    zoomValue.textContent = zoom + 'x';
}

function saveSettings() {
    localStorage.setItem('pixelArtGridSize', gridSize);
    localStorage.setItem('pixelArtZoom', zoom);
    localStorage.setItem('pixelArtRecentColors', JSON.stringify(recentColors));
    localStorage.setItem('pixelArtCurrentColor', currentColor);
    localStorage.setItem('pixelArtCurrentTool', currentTool);
}

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

    pixelData = new Array(gridSize * gridSize).fill('#00000000');

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
    currentTool = tool;

    if (tool === 'eraser') {
        canvas.style.cursor = 'cell';
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

function resizeCanvas() {
    const oldData = [...pixelData];
    const oldSize = Math.sqrt(oldData.length);

    initCanvas();

    const minSize = Math.min(oldSize, gridSize);
    for (let y = 0; y < minSize; y++) {
        for (let x = 0; x < minSize; x++) {
            pixelData[y * gridSize + x] = oldData[y * oldSize + x];
        }
    }

    renderCanvas();
    drawGridOverlay();
    requestAnimationFrame(positionGridOverlay);
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
    coordsEl.textContent = '—';
    drawGridOverlay();
}

function startDrawing(e) {
    if (currentTool === 'eyedropper') {
        pickColor(e);
        return;
    }

    isDrawing = true;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    lastX = coords.x;
    lastY = coords.y;
    drawPixel(coords.x, coords.y);
}

function draw(e) {
    if (!isDrawing) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);

    if (currentTool === 'pencil' || currentTool === 'eraser') {
        drawLine(lastX, lastY, coords.x, coords.y);
    }

    lastX = coords.x;
    lastY = coords.y;
}

function stopDrawing() {
    if (isDrawing && currentTool === 'fill') {
        fill(lastX, lastY);
    }
    isDrawing = false;
}

function drawPixel(x, y) {
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;

    const index = y * gridSize + x;
    const color = currentTool === 'eraser' ? '#00000000' : currentColor;

    if (pixelData[index] !== color) {
        pixelData[index] = color;
        renderPixel(x, y);
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

    gridOverlayCtx.strokeStyle = 'rgba(255,255,255,0.12)';
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

    if (hoverX >= 0 && hoverX < gridSize && hoverY >= 0 && hoverY < gridSize) {
        gridOverlayCtx.fillStyle = 'rgba(255, 51, 102, 0.12)';
        gridOverlayCtx.fillRect(hoverX * zoom, hoverY * zoom, zoom, zoom);

        gridOverlayCtx.strokeStyle = 'rgba(255, 51, 102, 0.7)';
        gridOverlayCtx.lineWidth = 2;
        gridOverlayCtx.strokeRect(hoverX * zoom + 1, hoverY * zoom + 1, zoom - 2, zoom - 2);
    }
}

function clearCanvas() {
    pixelData.fill('#00000000');
    renderCanvas();
    drawGridOverlay();
    saveCanvasState();
}

function saveCanvasState() {
    localStorage.setItem('pixelArtCanvasData', JSON.stringify(pixelData));
}

function loadCanvasState() {
    const saved = localStorage.getItem('pixelArtCanvasData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            pixelData = data;
        } catch (e) {
            pixelData = [];
        }
    }
}

function downloadCanvas() {
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
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => selectTool(btn.dataset.tool));
    });

    gridSizeInput.addEventListener('input', (e) => {
        gridSize = parseInt(e.target.value);
        gridSizeValue.textContent = gridSize;
        resizeCanvas();
        saveSettings();
    });

    zoomInput.addEventListener('input', (e) => {
        zoom = parseInt(e.target.value);
        zoomValue.textContent = zoom + 'x';
        resizeCanvas();
        saveSettings();
    });

    clearBtn.addEventListener('click', clearCanvas);
    downloadBtn.addEventListener('click', downloadCanvas);
    addColorBtn.addEventListener('click', addCustomColor);
    customColorInput.addEventListener('input', () => {
        currentColor = customColorInput.value;
    });

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

    document.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= '4') {
            const tools = ['pencil', 'eraser', 'fill', 'eyedropper'];
            selectTool(tools[parseInt(e.key) - 1]);
        }
    });
}

init();

if (window.electronAPI) {
    window.electronAPI.onSave(() => downloadCanvas());
    window.electronAPI.onNew(() => clearCanvas());
    window.electronAPI.onExportTransparent(() => downloadCanvas());
    window.electronAPI.onZoomIn(() => {
        zoom = Math.min(32, zoom + 1);
        zoomInput.value = zoom;
        zoomValue.textContent = zoom + 'x';
        resizeCanvas();
        saveSettings();
    });
    window.electronAPI.onZoomOut(() => {
        zoom = Math.max(1, zoom - 1);
        zoomInput.value = zoom;
        zoomValue.textContent = zoom + 'x';
        resizeCanvas();
        saveSettings();
    });
}