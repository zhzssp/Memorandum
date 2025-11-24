// ------------------------- 整个客户端的主入口，操控客户端的整体运行逻辑，同时与后端进行交互 -------------------------
const { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu, Notification } = require('electron');
const path = require('path');
const axios = require('axios');

// 配置axios默认设置
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8080';

// 创建一个全局的cookie存储
let sessionCookies = '';

// 获取Electron窗口的cookie并设置到axios请求中
async function getCookiesFromWindow() {
    if (mainWindow) {
        try {
            const cookies = await mainWindow.webContents.session.cookies.get({});
            console.log('All cookies from window:', cookies);

            const relevantCookies = cookies
                .filter(cookie =>
                    (cookie.domain.includes('localhost') || cookie.domain.includes('127.0.0.1') || cookie.domain === '') &&
                    (cookie.name === 'JSESSIONID' || cookie.name.includes('SESSION'))
                );

            console.log('Relevant cookies:', relevantCookies);

            const cookieString = relevantCookies
                .map(cookie => `${cookie.name}=${cookie.value}`)
                .join('; ');

            console.log('Cookie string:', cookieString);
            return cookieString;
        } catch (error) {
            console.error('Error getting cookies:', error);
            return '';
        }
    }
    return '';
}

let tray = null;
let mainWindow = null;
let intervalId1 = null; // 用于存储 setInterval 的 ID
let intervalId2 = null; // 用于存储 setInterval 的 ID

// 创建窗口
function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            // __dirname表示当前文件所在目录
            preload: path.join(__dirname, 'preload.js'),
            // 启用会话持久化
            partition: 'persist:main'
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
    console.log(`Checking notification for task: ${ddl_title}, deadline: ${deadline}`);

    const now = new Date();
    const deadlineDate = new Date(deadline); // 接收 LocalDateTime 字符串或时间戳

    const msUntilDue = deadlineDate.getTime() - now.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const threeDaysMs = 3 * oneDayMs;

    console.log(`Task: ${ddl_title}, ms until due: ${msUntilDue}`);
    let notification = null;

    if (msUntilDue <= 0) {
        console.log(`Sending overdue notification for task: ${ddl_title}`);
        notification = new Notification({
            title: 'DDL提醒: ' + ddl_title,
            body: '你的DDL已经过期啦!'
        });
    }

    else if (msUntilDue <= oneDayMs && msUntilDue > 0) {
        console.log(`Sending 1-day notification for task: ${ddl_title}`);
        notification = new Notification({
            title: 'DDL提醒: ' + ddl_title,
            body: '你的DDL一天内到期啦!'
        });
    }

    else if (msUntilDue <= threeDaysMs && msUntilDue > oneDayMs) {
        console.log(`Sending 3-day notification for task: ${ddl_title}`);
        notification = new Notification({
            title: 'DDL提醒: ' + ddl_title,
            body: '你的DDL三天内到期啦!'
        });
    }

    else {
        console.log(`No notification needed for task: ${ddl_title}`);
    }

    if (notification) {
        mainWindow.webContents.send('notification', ddl_title);
        notification.show();
    }
    return;
}

// 检查DDL是否到期
function checkTasksDue() {
    console.log('checkTasksDue called');
    // Electron 主进程的 Notification 不需要浏览器风格的权限请求
    if (typeof Notification.isSupported === 'function' && !Notification.isSupported()) {
        mainWindow.webContents.send('grant', 'System notifications are not supported in this environment');
        return;
    }
    try {
        mainWindow.webContents.send('grant', 'Notification ready');
    } catch (e) {
        mainWindow.webContents.send('grant', e);
    }
    // 执行check并通知的具体业务逻辑
    performTaskCheck();
}

// 执行任务检查的具体逻辑
let notifiedTasks = new Set(); // 避免重复通知
async function performTaskCheck() {
    console.log('Checking tasks due...');
    // console.log('Notification permission status:', Notification.permission);

    try {
        const cookies = await getCookiesFromWindow();
        console.log('Using cookies for due-dates:', cookies);

        const response = await axios.get('/due-dates', {
            withCredentials: true,
            headers: cookies ? {
                'Cookie': cookies
            } : {}
        });

        // 获取HTTP响应的数据段
        const tasks = response.data;
        console.log(`Found ${tasks.length} tasks:`, tasks);

        if (tasks && tasks.length > 0) {
            tasks.forEach(task => {
                // 此时是纯json对象，直接访问属性
                task_id = task.id;
                if(!notifiedTasks.has(task_id)) {
                    console.log('Processing task, id = ', task_id);
                    const deadline = new Date(task.deadline);
                    notifiedTasks.add(task_id);
                    sendDeadlineNotification(task.title, deadline);
                }
            });
        } else {
            console.warn('No tasks found');
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
        console.error('Error details:', error.response?.data || error.message);
    }
}

async function getLoginState() {
    try {
        // 更新全局cookie存储
        sessionCookies = await getCookiesFromWindow();
        console.log('Using cookies:', sessionCookies);

        // 使用axios的默认配置，但确保cookie正确传递
        const response = await axios.get('/user-logged-in', {
            withCredentials: true,
            headers: sessionCookies ? {
                'Cookie': sessionCookies
            } : {}
        });

        console.log('Login state response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching login state:', error);
        return false;
    }
}

// 先申请单实例锁
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    // 如果已有实例在运行，则退出当前新实例
    app.quit();
} else {
    // 监听第二次实例启动事件
    app.on('second-instance', (event, argv, workingDirectory) => {
        // 当用户再次打开应用时，让现有窗口显示出来
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// 当 Electron 初始化完成后调用
app.whenReady().then(() => {
    // Windows 需要设置 AppUserModelID 才能显示系统通知
    try {
        app.setAppUserModelId('Memorandum');
    } catch (e) {
        console.warn('Failed to set AppUserModelID:', e);
    }
    createTray();
    createWindow();

    // 定期检查登录状态和DDL
    const checkLoginAndDDL = () => {
        getLoginState().then(isLoggedIn => {
            console.log('Login state:', isLoggedIn);
            mainWindow.webContents.send('login-status', isLoggedIn);

            // 若用户登录成功，则允许检查DDL任务
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
    intervalId1 = setInterval(checkLoginAndDDL, 60000);
    // 每天清理一次已通知任务集合
    intervalId2 = setInterval(() => notifiedTasks.clear(), 24 * 60 * 60 * 1000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 退出应用时清理 setInterval
app.on('before-quit', () => {
    if (intervalId1) {
        clearInterval(intervalId1);
    }
    if (intervalId2) {
        clearInterval(intervalId2);
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


