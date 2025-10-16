document.addEventListener('DOMContentLoaded', function () {
    const contextMenu = document.getElementById('contextMenu');
    const memoItems = document.querySelectorAll('.memo-item');
    let currentMemoId = null;

    // 为每个memo项添加右键事件监听器
    memoItems.forEach(item => {
        item.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            currentMemoId = this.getAttribute('data-memo-id');

            // 显示右键菜单
            contextMenu.style.display = 'block';
            contextMenu.style.left = e.pageX + 'px';
            contextMenu.style.top = e.pageY + 'px';
        });
    });

    // 删除按钮事件
    document.getElementById('deleteBtn').addEventListener('click', function () {
        if (currentMemoId) {
            deleteMemo(currentMemoId);
        }
        hideContextMenu();
    });

    // 取消按钮事件
    document.getElementById('cancelBtn').addEventListener('click', function () {
        hideContextMenu();
    });

    // 点击其他地方隐藏菜单
    document.addEventListener('click', function (e) {
        if (!contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    });

    // 隐藏右键菜单
    function hideContextMenu() {
        contextMenu.style.display = 'none';
        currentMemoId = null;
    }

    // 删除memo的函数
    function deleteMemo(memoId) {
        // 获取CSRF token
        const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content') ||
            document.querySelector('input[name="_csrf"]')?.value;

        fetch(`/memo/delete/${memoId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }
            })
            .then(data => {
                if (data === 'success') {
                    // 删除成功后重新加载页面
                    location.reload();
                } else {
                    alert('删除失败: ' + data);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('删除失败: ' + error.message);
            });
    }
});