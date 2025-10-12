// ------------------------- 整个客户端的主入口，操控客户端的整体运行逻辑，同时与后端进行交互 -------------------------
const { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu } = require('electron');
const path = require('path');

let tray = null;
let mainWindow = null;

// 创建窗口函数
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            // __dirname表示当前文件所在目录
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // 加载 HTML 文件 -- 使用ngrok提供临时域名
    // win.loadURL('https://shella-subpolygonal-linsey.ngrok-free.dev');
    // Spring Boot 后端在 8080 端口运行
    win.loadURL('http://localhost:8080');
    // 绑定主窗口
    mainWindow = win;

    // 当窗口关闭时，将窗口隐藏到系统托盘 --> 只能在系统托盘关闭
    mainWindow.on('close', (event) => {
        event.preventDefault();  // 阻止窗口关闭
        mainWindow.hide();       // 隐藏窗口
    });
}

function createTray() {
  // 托盘图标路径
  const iconPath = path.join(__dirname, 'icon.ico');

  // 使用托盘图标
  tray = new Tray(nativeImage.createFromPath(iconPath));

  // 创建右键菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开备忘录',
      click: () => {
        if (mainWindow) {
          mainWindow.show(); // 显示窗口
        }
      }
    },
    {
      label: '退出',
      click: () => {
        tray.destroy();
        app.quit(); // 退出应用
      }
    }
  ]);

  // 右键点击托盘图标时，显示菜单
  tray.setContextMenu(contextMenu);

  // 单击托盘图标时，显示窗口
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  // 鼠标右键点击托盘图标时，显示菜单
  tray.on('right-click', () => {
    tray.popUpContextMenu(contextMenu);
  });
}

// 当 Electron 初始化完成后调用
app.whenReady().then(() => {
    createTray();
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
