// GitHub 同步模組 - 所有工具共用
const GitHubSync = {
    getConfig() {
        return JSON.parse(localStorage.getItem('githubConfig') || '{}');
    },

    isConfigured() {
        const config = this.getConfig();
        return config.username && config.repo && config.token;
    },

    async saveToGitHub(filename, data) {
        const config = this.getConfig();
        if (!this.isConfigured()) {
            console.log('GitHub 未設定，僅使用本地儲存');
            return false;
        }

        const path = `data/${filename}`;
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
        
        try {
            // 先嘗試獲取現有文件的 SHA
            let sha = null;
            try {
                const getResponse = await fetch(
                    `https://api.github.com/repos/${config.username}/${config.repo}/contents/${path}`,
                    {
                        headers: {
                            'Authorization': `token ${config.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    sha = fileData.sha;
                }
            } catch (e) {
                // 文件不存在，這是正常的
            }

            // 創建或更新文件
            const body = {
                message: `Update ${filename} - ${new Date().toISOString()}`,
                content: content
            };
            if (sha) {
                body.sha = sha;
            }

            const response = await fetch(
                `https://api.github.com/repos/${config.username}/${config.repo}/contents/${path}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${config.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                }
            );

            if (response.ok) {
                console.log(`✅ 已同步到 GitHub: ${filename}`);
                return true;
            } else {
                console.error('GitHub 同步失敗:', await response.text());
                return false;
            }
        } catch (error) {
            console.error('GitHub 同步錯誤:', error);
            return false;
        }
    },

    async loadFromGitHub(filename) {
        const config = this.getConfig();
        if (!this.isConfigured()) {
            console.log('GitHub 未設定');
            return null;
        }

        const path = `data/${filename}`;
        
        try {
            const response = await fetch(
                `https://api.github.com/repos/${config.username}/${config.repo}/contents/${path}`,
                {
                    headers: {
                        'Authorization': `token ${config.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (response.ok) {
                const fileData = await response.json();
                const content = decodeURIComponent(escape(atob(fileData.content)));
                console.log(`✅ 已從 GitHub 載入: ${filename}`);
                return JSON.parse(content);
            } else if (response.status === 404) {
                console.log(`文件不存在: ${filename}`);
                return null;
            } else {
                console.error('GitHub 載入失敗:', response.status);
                return null;
            }
        } catch (error) {
            console.error('GitHub 載入錯誤:', error);
            return null;
        }
    },

    // 顯示同步狀態的 UI 元素
    createSyncStatusUI() {
        const div = document.createElement('div');
        div.id = 'github-sync-status';
        div.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 15px;
            background: rgba(0,0,0,0.8);
            color: #fff;
            border-radius: 8px;
            font-size: 12px;
            z-index: 9999;
            display: none;
        `;
        document.body.appendChild(div);
        return div;
    },

    showSyncStatus(message, isError = false) {
        let statusDiv = document.getElementById('github-sync-status');
        if (!statusDiv) {
            statusDiv = this.createSyncStatusUI();
        }
        statusDiv.style.display = 'block';
        statusDiv.style.background = isError ? 'rgba(244, 67, 54, 0.9)' : 'rgba(76, 175, 80, 0.9)';
        statusDiv.textContent = message;
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
};

// 返回指南頁的按鈕
function createBackToGuideButton() {
    const btn = document.createElement('a');
    btn.href = 'guide.html';
    btn.innerHTML = '← 返回指南';
    btn.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        padding: 8px 16px;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        text-decoration: none;
        border-radius: 6px;
        font-size: 14px;
        z-index: 9999;
        transition: background 0.3s;
    `;
    btn.onmouseover = () => btn.style.background = 'rgba(0, 0, 0, 0.9)';
    btn.onmouseout = () => btn.style.background = 'rgba(0, 0, 0, 0.7)';
    document.body.appendChild(btn);
}

// 頁面載入時自動添加返回按鈕
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBackToGuideButton);
} else {
    createBackToGuideButton();
}
