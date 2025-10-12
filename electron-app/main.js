// ------------------------- 整个客户端的主入口，操控客户端的整体运行逻辑，同时与后端进行交互 -------------------------
const { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu } = require('electron');
const path = require('path');
const axios = require('axios');

let tray = null;
let mainWindow = null;
let intervalId = null; // 用于存储 setInterval 的 ID

// 创建窗口
function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
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
    // 打开开发者工具，查看控制台输出 -- 失效?
    win.webContents.openDevTools();

    // 当窗口关闭时，将窗口隐藏到系统托盘 --> 只能在系统托盘关闭
    mainWindow.on('close', (event) => {
        event.preventDefault();  // 阻止窗口关闭
        mainWindow.hide();       // 隐藏窗口
    });
}

// 设置系统托盘
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
                mainWindow.destroy(); // 销毁窗口
                tray.destroy(); // 销毁托盘图标
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

// 发送桌面通知
function sendDeadlineNotification(ddl_title, deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);

    // 暂时只比较年月日部分
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deadlineDay = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());

    const delta_time = deadlineDay - today; // 计算剩余天数，单位为毫秒
    const delta_days = Math.ceil(delta_time / (1000 * 60 * 60 * 24)); // 转换为天数

    // 如果剩余时间少于等于 1 天，发送提醒通知
    if (delta_days <= 1 && delta_days >= 0) {
        const notification = new Notification({
            title: 'DDL提醒: ' + ddl_title,
            body: '你的DDL一天内到期啦!'
        });

        notification.show();
    }
    else if (delta_days < 0) {
        const notification = new Notification({
            title: 'DDL提醒: ' + ddl_title,
            body: '你的DDL已经过期啦!'
        });

        notification.show();
    }
    else return;
}

// 检查DDL是否到期
function checkTasksDue() {
    if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log("Notification permission granted");
            } else {
                console.log("Notification permission denied");
                return; // 如果用户拒绝通知权限，则不继续执行
            }
        });
    }
    console.log('Checking tasks due...');
    axios.get('http://localhost:8080/due-dates') // 获取后端所有任务的到期信息
        .then(response => {
            const tasks = response.data;

            tasks.forEach(task => {
                const deadline = new Date(task.deadline);
                sendDeadlineNotification(task.title, deadline);
            });
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
        });
}

function getLoginState() {
    return axios.get('http://localhost:8080/user-logged-in')
        .then(response => response.data)
        .catch(error => {
            console.error('Error fetching login state:', error);
            return false;
        });
}

// 当 Electron 初始化完成后调用
app.whenReady().then(() => {
    createTray();
    createWindow();

    // 定期检查登录状态和DDL
    const checkLoginAndDDL = () => {
        getLoginState().then(isLoggedIn => {
            console.log('Login state:', isLoggedIn);
            mainWindow.webContents.send('log-message', isLoggedIn);

            // 用户登录成功后，检查DDL任务
            if (isLoggedIn) {
                checkTasksDue();
            }
        }).catch(error => {
            console.error('Error checking login state:', error);
        });
    };

    // 立即检查一次
    checkLoginAndDDL();

    // 每30秒检查一次登录状态和DDL
    intervalId = setInterval(checkLoginAndDDL, 30000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 退出应用时清理 setInterval
app.on('before-quit', () => {
    if (intervalId) {
        clearInterval(intervalId); // 清除定时器
    }
});

// 捕获未处理的同步错误
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    app.quit();  // 终止进程
});

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at promise:', promise, 'reason:', reason);
    app.quit();  // 终止进程
});


