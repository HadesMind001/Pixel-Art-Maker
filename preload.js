const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onSave: (callback) => ipcRenderer.on('menu-save', callback),
    onNew: (callback) => ipcRenderer.on('menu-new', callback),
    onExportTransparent: (callback) => ipcRenderer.on('menu-export-transparent', callback),
    onZoomIn: (callback) => ipcRenderer.on('menu-zoom-in', callback),
    onZoomOut: (callback) => ipcRenderer.on('menu-zoom-out', callback)
});