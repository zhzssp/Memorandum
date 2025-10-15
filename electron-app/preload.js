// --------------------- 渲染进程，可以与主进程进行通信，同时输出到控制台 ---------------------
const { ipcRenderer } = require('electron');

// 在这里可以处理与主进程的通信
window.addEventListener('DOMContentLoaded', () => {
    // 主进程可以根据消息做一些处理
    console.log("Renderer process loaded!");
    // 监听主进程发送的日志消息
    ipcRenderer.on('login-status', (event, message) => {
        console.log('Received login status from main process:', message);
    });

    ipcRenderer.on('notification', (event, message) => {
        console.log('Sent notification from main process:', message);
    });

    ipcRenderer.on('grant', (event, message) => {
        console.log('Get grant information >', message);
    });
});
