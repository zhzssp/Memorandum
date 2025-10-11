// ------------------------- 整个客户端的主入口，操控客户端的整体运行逻辑，同时与后端进行交互 -------------------------
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// 创建窗口函数
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // 加载 HTML 文件
    win.loadURL('http://172.19.56.143:8080');  // Spring Boot 后端在 8080 端口运行
}

// 当 Electron 初始化完成后调用
app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 退出时关闭应用
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
