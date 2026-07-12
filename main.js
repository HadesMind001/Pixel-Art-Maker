const { app, BrowserWindow, Menu, dialog, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 750,
        minWidth: 600,
        minHeight: 500,
        title: 'Pixel Art Maker',
        backgroundColor: '#1a1a2e',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'icon.png')
    });

    mainWindow.loadFile('index.html');

    const menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'New',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => mainWindow.webContents.send('menu-new')
                },
                {
                    label: 'Save PNG...',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => mainWindow.webContents.send('menu-save')
                },
                { type: 'separator' },
                {
                    label: 'Export Transparent PNG...',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => mainWindow.webContents.send('menu-export-transparent')
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'copy' },
                { role: 'paste' }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Zoom In',
                    accelerator: 'CmdOrCtrl+=',
                    click: () => mainWindow.webContents.send('menu-zoom-in')
                },
                {
                    label: 'Zoom Out',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => mainWindow.webContents.send('menu-zoom-out')
                },
                { type: 'separator' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About Pixel Art Maker',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About',
                            message: 'Pixel Art Maker',
                            detail: 'A simple pixel art editor.\n\nClick to draw, use tools to create your art!'
                        });
                    }
                }
            ]
        }
    ]);

    Menu.setApplicationMenu(menu);
    mainWindow.setMenuBarVisibility(true);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});