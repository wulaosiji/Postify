// DOM元素
const markdownInput = document.getElementById('markdownInput');
const questionInput = document.getElementById('questionInput');
const copyTextBtn = document.getElementById('copyTextBtn');
const previewModal = document.getElementById('previewModal');
const previewText = document.getElementById('previewText');
const copyFinalBtn = document.getElementById('copyFinalBtn');
const previewContent = document.getElementById('previewContent');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const clearBtn = document.getElementById('clearBtn');
const pasteBtn = document.getElementById('pasteBtn');
const undoBtn = document.getElementById('undoBtn');
const likeBtn = document.getElementById('likeBtn');
const shareBtn = document.getElementById('shareBtn');
const likeCountSpan = document.querySelector('.like-count');

// 导出长图相关的DOM元素
const exportImageBtn = document.getElementById('exportImageBtn');
const imagePreviewModal = document.getElementById('imagePreviewModal');
const imagePreview = document.getElementById('imagePreview');
const saveImageBtn = document.getElementById('saveImageBtn');

// 存储清空前的内容
let lastContent = {
    question: '',
    markdown: ''
};

let lastInput = '';
let lastQuestion = '';

// 历史记录
let history = [];
let currentStep = -1;

// 主题切换功能
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    showToast(newTheme === 'dark' ? '已切换到深色模式' : '已切换到浅色模式');
}

// 保存当前状态到历史记录
function saveToHistory() {
    // 删除当前步骤之后的所有历史记录
    if (currentStep < history.length - 1) {
        history = history.slice(0, currentStep + 1);
    }
    
    // 保存当前状态
    history.push({
        markdown: markdownInput.value,
        question: questionInput.value
    });
    
    currentStep = history.length - 1;
    
    // 限制历史记录长度
    if (history.length > 50) {
        history.shift();
        currentStep--;
    }
    
    // 启用/禁用撤销按钮
    undoBtn.disabled = currentStep <= 0;
}

// 撤销功能
function undo() {
    if (currentStep > 0) {
        currentStep--;
        const state = history[currentStep];
        markdownInput.value = state.markdown;
        questionInput.value = state.question;
        updatePreview();
        showToast('已撤销');
    }
}

// 更新按钮状态
async function updateButtonStates() {
    // 更新清空按钮状态
    const hasContent = markdownInput.value.trim() !== '' || questionInput.value.trim() !== '';
    clearBtn.disabled = !hasContent;
    clearBtn.classList.toggle('disabled', !hasContent);
    
    // 更新粘贴按钮状态
    try {
        const clipboardText = await navigator.clipboard.readText();
        pasteBtn.disabled = !clipboardText;
        pasteBtn.classList.toggle('disabled', !clipboardText);
    } catch (err) {
        // 如果无法访问剪贴板，则保持启用状态
        pasteBtn.disabled = false;
        pasteBtn.classList.remove('disabled');
    }
}

// 点赞功能
let likeCount = parseInt(localStorage.getItem('postify-likes') || '0');

// 初始化点赞状态
function updateLikeButtonState() {
    // 每20次点赞增加一个等级，最大5级（100次）
    const level = Math.min(5, Math.ceil(likeCount / 20));
    
    // 计算填充百分比，在整20的倍数时设为100%
    let fillPercent;
    if (likeCount % 20 === 0 && likeCount > 0) {
        fillPercent = 100;
    } else {
        fillPercent = ((likeCount % 20) / 20) * 100;
    }
    
    // 设置等级和填充百分比
    likeBtn.setAttribute('data-like-level', level.toString());
    likeBtn.style.setProperty('--fill-percent', `${fillPercent}%`);
    
    // 添加动画类
    likeBtn.classList.add('animate');
    setTimeout(() => {
        likeBtn.classList.remove('animate');
    }, 300);
}

// 获取当前点赞等级的提示信息
function getLikeMessage(count) {
    if (count > 100) {
        return '已达到最大点赞数 ❤️';
    }
    
    // 只在达到特定阶段时显示消息
    if (count === 1) {
        return '感谢点赞 ❤️';
    }
    
    // 检查是否达到各个阶段
    if (count <= 20) {
        if (count === 20) {
            return '完成第一阶段：Yellow 💛';
        }
    } else if (count <= 40) {
        if (count === 40) {
            return '完成第二阶段：风吹麦浪 💛';
        }
    } else if (count <= 60) {
        if (count === 60) {
            return '完成第三阶段：橙梦 🧡';
        }
    } else if (count <= 80) {
        if (count === 80) {
            return '完成第四阶段：酒红色的心 ❤️';
        }
    } else if (count <= 100) {
        if (count === 100) {
            return '完成最终阶段：蓝夜 💙';
        }
    }
    
    return '';  // 如果不是特定节点，返回空字符串
}

// 初始化所有功能
function initializeFeatures() {
    // 初始化点赞状态
    updateLikeButtonState();
    
    // 点赞按钮点击事件
    likeBtn.addEventListener('click', () => {
        // 限制最大点赞次数为100
        if (likeCount >= 100) {
            showToast('已达到最大点赞数 ❤️');
            return;
        }
        
        likeCount++;
        localStorage.setItem('postify-likes', likeCount.toString());
        
        // 更新点赞状态
        updateLikeButtonState();
        
        // 显示点赞效果
        const message = getLikeMessage(likeCount);
        if (message) {  // 只有当有消息时才显示
            showToast(message);
        }
        
        // 添加点击动画
        likeBtn.style.transform = 'scale(0.8)';
        setTimeout(() => {
            likeBtn.style.transform = '';
        }, 200);
    });

    // 分享功能
    shareBtn.addEventListener('click', async () => {
        const shareUrl = 'https://postify.cc';
        const shareText = '发现一个超好用的AI对话分享工具！' + shareUrl;
        
        try {
            // 优先使用原生分享API
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'Postify - From AI to Social',
                        text: shareText,
                        url: shareUrl
                    });
                    showToast('感谢分享 🙏');
                } catch (shareError) {
                    console.error('Share API failed:', shareError);
                    // 如果分享API失败，尝试复制文本
                    await fallbackCopy(shareText);
                }
            } else {
                // 如果不支持原生分享，尝试复制文本
                await fallbackCopy(shareText);
            }
            
            // 添加分享按钮动画效果
            animateShareButton();
            
        } catch (err) {
            console.error('Share failed:', err);
            showToast('感谢分享 🙏');
        }
    });

    // 辅助函数：后备复制方法
    async function fallbackCopy(text) {
        try {
            // 创建临时输入框
            const textarea = document.createElement('textarea');
            textarea.value = text;
            // 设置样式使其不可见
            textarea.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
            document.body.appendChild(textarea);
            
            if (navigator.userAgent.match(/ipad|iphone/i)) {
                // iOS设备特殊处理
                const range = document.createRange();
                range.selectNodeContents(textarea);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                textarea.setSelectionRange(0, text.length);
            } else {
                // 其他设备
                textarea.select();
            }
            
            // 尝试复制
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (successful) {
                showToast('文本已复制，快去分享给朋友吧！');
            } else {
                throw new Error('复制失败');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            showToast('感谢分享 🙏');
        }
    }

    // 分享按钮动画
    function animateShareButton() {
        shareBtn.classList.add('shared');
        shareBtn.style.transform = 'scale(0.8)';
        setTimeout(() => {
            shareBtn.style.transform = '';
            setTimeout(() => {
                shareBtn.classList.remove('shared');
            }, 1000);
        }, 200);
    }
}

// 初始化所有事件监听
function initializeEventListeners() {
    // 主题切换
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // 清空和撤销
    clearBtn.addEventListener('click', clearContent);
    undoBtn.addEventListener('click', undo);
    
    // 复制和粘贴
    pasteBtn.addEventListener('click', handlePaste);
    copyTextBtn.addEventListener('click', () => {
        const markdown = markdownInput.value.trim();
        if (!markdown) {
            showToast('没有可预览的文字');
            return;
        }
        const plainText = markdownToPlainText(markdown);
        showPreviewModal(plainText);
        
        // 添加按钮点击效果
        copyTextBtn.classList.add('clicked');
        setTimeout(() => {
            copyTextBtn.classList.remove('clicked');
        }, 400);
    });
    copyFinalBtn.addEventListener('click', () => {
        copyText(previewText.value);
    });
    
    // 模态框点击关闭
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal || e.target === previewText) {
            hidePreviewModal();
        }
    });
    
    // 输入监听
    markdownInput.addEventListener('input', () => {
        saveToHistory();
        saveToLocalStorage();
        updateButtonStates();
    });
    
    questionInput.addEventListener('input', () => {
        saveToHistory();
        saveToLocalStorage();
        updateButtonStates();
    });
    
    // 剪贴板变化监听
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            updateButtonStates();
        }
    });

    // 导出长图按钮点击事件
    exportImageBtn.addEventListener('click', handleExportImage);
    
    // 保存图片按钮点击事件
    saveImageBtn.addEventListener('click', handleSaveImage);
    
    // 图片预览模态框点击关闭
    imagePreviewModal.addEventListener('click', (e) => {
        if (e.target === imagePreviewModal) {
            hideImagePreviewModal();
        }
    });
}

// 在页面加载完成后初始化
window.addEventListener('load', () => {
    initializeFeatures();
    initializeEventListeners();
    initTheme();
    
    const savedContent = localStorage.getItem('postify-content');
    if (savedContent) {
        try {
            const data = JSON.parse(savedContent);
            questionInput.value = data.question || '';
            markdownInput.value = data.markdown || '';
            if (data.currentAI) {
                currentAI = data.currentAI;
                // 更新UI选中状态
                document.querySelectorAll('.ai-option').forEach(opt => {
                    opt.classList.toggle('selected', opt.dataset.ai === currentAI);
                });
            }
            // 保存初始状态到历史记录
            saveToHistory();
        } catch (e) {
            // 兼容旧版本的存储格式
            markdownInput.value = savedContent;
            // 保存初始状态到历史记录
            saveToHistory();
        }
    }
    
    // 初始状态下禁用撤销按钮
    undoBtn.disabled = true;
    
    // 初始化其他按钮状态
    updateButtonStates();
});

// AI助手配置
const AI_ASSISTANTS = {
    kimi: {
        name: 'Kimi 智能助手',
        logo: 'assets/logos/Kimi.png'
    },
    deepseek: {
        name: 'DeepSeek',
        logo: 'assets/logos/deepseek.png'
    },
    doubao: {
        name: '豆包',
        logo: 'assets/logos/doubao.png'
    },
    yuanbao: {
        name: '元宝',
        logo: 'assets/logos/yuanbao.png'
    }
};

// 当前选中的AI助手
let currentAI = '';

// Markdown配置
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && Prism.languages[lang]) {
            try {
                return Prism.highlight(code, Prism.languages[lang], lang);
            } catch (e) {
                console.error('Prism highlight error:', e);
                return code;
            }
        }
        return code;
    },
    langPrefix: 'language-',
    breaks: true,
    gfm: true
});

// 自定义Markdown渲染器
const renderer = new marked.Renderer();
renderer.hr = () => '<div style="width: 100%; height: 1px; background: #E8E8E8; margin: 24px 0;"></div>';
marked.setOptions({ renderer });

// 工具函数：显示Toast提示
function showToast(message, duration = 2000) {
    // 移除现有的toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        document.body.removeChild(existingToast);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 显示动画
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, -20px)';
    });
    
    // 自动隐藏
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 0)';
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// Markdown转纯文本
function markdownToPlainText(markdown) {
    if (!markdown) return '';
    
    // 预处理：标准化换行符和空格，并清理所有markdown格式
    let text = markdown.replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n')  // 预处理连续空行
        .replace(/\t/g, '    ')      // 统一tab为空格
        .replace(/\*\*([^*]+?)\*\*/g, '$1')  // 移除加粗标记
        .replace(/\*([^*]+?)\*/g, '$1')      // 移除斜体标记
        .replace(/`([^`]+?)`/g, '$1')        // 移除代码标记
        .replace(/\[([^\]]+?)\]\([^)]+?\)/g, '$1')  // 移除链接标记
        .replace(/\*\*/g, '')                // 清理任何剩余的**标记
        .replace(/\*/g, '');                 // 清理任何剩余的*标记
    
    // 1. 移除分隔线
    text = text.replace(/^---+$\n?/gm, '');
    
    // 2. 处理标题
    text = text
        .replace(/^#{1,6}\s+(\d+\.\s*)(.*?)$/gm, '$1$2')  // 处理带编号的标题
        .replace(/^#{1,6}\s+(.*?)$/gm, '$1');             // 处理普通标题
    
    // 3. 按行处理文本
    let lines = text.split('\n');
    let processedLines = [];
    let prevLineType = 'text';
    let prevLineContent = '';
    let inList = false;
    let lastListLevel = 0;
    let lastWasColon = false;
    let inSameList = false;
    let columnNames = [];  // 存储表头列名
    let isFirstTableRow = true;  // 标记是否是表格的第一行数据
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmedLine = line.trim();
        
        // 跳过空行
        if (!trimmedLine) {
            inList = false;
            lastListLevel = 0;
            lastWasColon = false;
            inSameList = false;
            continue;
        }
        
        // 检测标题
        if (trimmedLine.match(/^\d+\.\s+/) || trimmedLine.toLowerCase() === '总结') {
            processedLines.push(trimmedLine);
            prevLineType = 'title';
            prevLineContent = trimmedLine;
            inList = false;
            lastListLevel = 0;
            lastWasColon = false;
            inSameList = false;
            continue;
        }
        
        // 检测列表项
        if (trimmedLine.match(/^[-*]\s/)) {
            let indentLevel = line.match(/^\s*/)[0].length;
            let content = trimmedLine.replace(/^[-*]\s+/, '').trim();
            
            content = content
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\*(.*?)\*/g, '$1')
                .replace(/`([^`]+)`/g, '$1');
            
            if (indentLevel >= 2) {
                processedLines.push(`- ${content}`);
                prevLineType = 'list2';
                lastListLevel = 2;
                inSameList = true;
            } else {
                processedLines.push(`• ${content}`);
                prevLineType = 'list1';
                lastListLevel = 1;
                inList = true;
                inSameList = true;
            }
            
            prevLineContent = content;
            lastWasColon = content.endsWith('：');
            continue;
        }
        
        // 处理表格
        if (trimmedLine.startsWith('|')) {
            let cells = trimmedLine
                .split('|')
                .filter(cell => cell.trim())
                .map(cell => {
                    return cell.trim()
                        .replace(/\*\*([^*]+?)\*\*/g, '$1')
                        .replace(/\*([^*]+?)\*/g, '$1')
                        .replace(/`([^`]+?)`/g, '$1')
                        .replace(/\[([^\]]+?)\]\([^)]+?\)/g, '$1')
                        .replace(/\*\*/g, '')
                        .replace(/\*/g, '')
                        .trim();
                });
            
            // 跳过分隔行
            if (trimmedLine.match(/^\|[-:\s|]+\|$/)) {
                continue;
            }
            
            // 跳过表头行
            if (cells[0].toLowerCase() === '名称' || cells[0].toLowerCase() === 'name') {
                columnNames = cells.slice(1);  // 保存列名，供后续使用
                isFirstTableRow = true;  // 重置表格行计数
                continue;
            }
            
            // 处理数据行
            if (cells.length >= 2) {
                // 如果不是第一行数据，添加空行
                if (!isFirstTableRow) {
                    processedLines.push('');
                }
                
                // 计算当前表格内的序号
                let titleNumber = isFirstTableRow ? 1 : 2;
                isFirstTableRow = false;
                
                // 提取内容
                let content = cells[0];
                
                // 添加标题行（带序号）
                processedLines.push(`${titleNumber}. ${content}`);
                
                // 添加其他列作为列表项
                for (let i = 1; i < cells.length; i++) {
                    if (cells[i].trim()) {
                        let prefix = columnNames[i-1] ? `${columnNames[i-1]}：` : '';
                        processedLines.push(`• ${prefix}${cells[i].trim()}`);
                    }
                }
                
                prevLineType = 'table';
                lastWasColon = false;
                inSameList = false;
            }
            continue;
        }
        
        // 处理其他文本
        let processedLine = trimmedLine
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/^\s*>\s*(.*)$/g, '$1');
        
        processedLines.push(processedLine);
        prevLineType = 'text';
        prevLineContent = processedLine;
        inList = false;
        lastListLevel = 0;
        lastWasColon = processedLine.endsWith('：');
        inSameList = false;
    }
    
    // 4. 最终处理
    text = processedLines.join('\n')
        .replace(/\n+/g, '\n')  // 移除所有空行
        .replace(/([^：])(：)\s*\n+(?!$)/g, '$1$2\n')
        .trim();
    
    // 不在这里添加水印，而是在复制时添加
    return text;
}

// 复制到剪贴板功能
async function copyText(text) {
    try {
        // 获取问题内容
        const question = questionInput.value.trim();
        
        // 构建完整文本
        let fullText = text;
        if (question) {
            fullText = `问题：${question}\n回答：\n${text}`;
        }
        
        // 添加水印
        const textWithWatermark = fullText + '\n\nPostify.cc - 超好用的AI对话分享工具';
        await navigator.clipboard.writeText(textWithWatermark);
        
        // 添加按钮点击效果
        const copyBtn = document.getElementById('copyFinalBtn');
        copyBtn.classList.add('clicked');
        setTimeout(() => {
            copyBtn.classList.remove('clicked');
        }, 400);
        
        showToast('已复制到剪贴板');
        
        // 移除选中效果
        window.getSelection().removeAllRanges();
    } catch (err) {
        // 如果剪贴板API不可用，使用传统方法
        const question = questionInput.value.trim();
        let fullText = text;
        if (question) {
            fullText = `问题：${question}\n回答：\n${text}`;
        }
        
        previewText.value = fullText + '\n\nPostify.cc - 超好用的AI对话分享工具';
        previewText.select();
        document.execCommand('copy');
        
        // 添加按钮点击效果
        const copyBtn = document.getElementById('copyFinalBtn');
        copyBtn.classList.add('clicked');
        setTimeout(() => {
            copyBtn.classList.remove('clicked');
        }, 400);
        
        // 恢复原始预览内容
        previewText.value = text;
        // 移除选中效果
        window.getSelection().removeAllRanges();
        previewText.blur();
        showToast('已复制到剪贴板');
    }
}

// 显示预览模态框
function showPreviewModal(text) {
    // 移除水印后显示在预览框中
    const textWithoutWatermark = text.replace(/\n\nPostify\.cc - 超好用的AI对话分享工具$/, '');
    previewText.value = textWithoutWatermark;
    previewModal.style.display = 'block';
    
    // 设置文本框样式，允许选择
    previewText.style.cssText = `
        user-select: text;
        -webkit-user-select: text;
    `;
}

// 隐藏预览模态框
function hidePreviewModal() {
    previewModal.style.display = 'none';
}

// 检查当前颜色模式
function isDarkMode() {
    // 使用当前设置的主题而不是系统主题
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

// 监听系统颜色模式变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // 如果没有用户设置的主题，才跟随系统
    if (!localStorage.getItem('theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        // 如果预览模态框是打开的，重新生成图片
        if (imagePreviewModal.style.display === 'block') {
            generateImage();
        }
    }
});

// 添加设备检测函数
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 生成长图片
async function generateImage() {
    try {
        const markdown = markdownInput.value.trim();
        if (!markdown) {
            showToast('没有可预览的内容');
            return;
        }

        showToast('正在生成图片...');
        console.log('开始生成图片...');
        
        const isDark = isDarkMode();
        const fontSize = 16;

        // 创建样式表
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            .export-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 375px;
                min-height: 100px;
                background: ${isDark ? '#1a1a1a' : 'white'};
                font-family: -apple-system, system-ui, sans-serif;
                line-height: 1.8;
                border-radius: 16px;
                overflow: visible;
                font-size: ${fontSize}px;
            }
            .export-container * {
                box-sizing: border-box;
            }
            .export-header {
                display: flex;
                align-items: center;
                padding: 12px;
                background: ${isDark ? '#1a1a1a' : 'white'};
                border-bottom: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#F5F5F5'};
                min-height: 48px;
                width: 100%;
            }
            .export-content {
                padding: 12px;
                background: ${isDark ? '#1a1a1a' : 'white'};
                color: ${isDark ? '#e0e0e0' : '#333333'};
                font-size: ${fontSize}px;
                line-height: 1.8;
                width: 100%;
                min-height: 50px;
            }
            .export-content h1, 
            .export-content h2, 
            .export-content h3, 
            .export-content h4, 
            .export-content h5, 
            .export-content h6 {
                margin: 20px 0 10px;
                font-weight: 600;
                color: ${isDark ? '#e0e0e0' : '#1a1a1a'};
                font-size: ${fontSize * 1.2}px;
                line-height: 1.4;
            }
            .export-content p {
                margin: 10px 0;
                line-height: 1.8;
                color: ${isDark ? '#e0e0e0' : '#333333'};
            }
            .export-content ul,
            .export-content ol {
                padding-left: 20px;
                margin: 10px 0;
                color: ${isDark ? '#e0e0e0' : '#333333'};
            }
            .export-content li {
                margin: 8px 0;
            }
            .export-content code {
                background: ${isDark ? '#333333' : '#f5f5f7'};
                color: ${isDark ? '#e0e0e0' : '#1a1a1a'};
                padding: 2px 6px;
                border-radius: 4px;
                font-size: ${fontSize * 0.9}px;
                font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
            }
            .export-content pre {
                background: ${isDark ? '#333333' : '#f5f5f7'};
                padding: 12px;
                border-radius: 8px;
                overflow-x: auto;
            }
            .export-content pre code {
                background: none;
                padding: 0;
                border-radius: 0;
            }
            .export-content blockquote {
                margin: 10px 0;
                padding-left: 12px;
                border-left: 4px solid ${isDark ? '#333333' : '#f5f5f7'};
                color: ${isDark ? '#a0a0a0' : '#666666'};
            }
        `;
        document.head.appendChild(styleSheet);
        
        // 创建包装容器
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: 375px;
            height: auto;
            overflow: visible;
        `;
        document.body.appendChild(wrapper);
        
        // 创建主容器
        const container = document.createElement('div');
        container.className = 'export-container';
        wrapper.appendChild(container);

        // 创建头部
        const header = document.createElement('div');
        header.className = 'export-header';

        // 添加选中的AI助手图标并预加载
        const logo = new Image();
        await new Promise((resolve, reject) => {
            logo.onload = resolve;
            logo.onerror = reject;
            logo.src = AI_ASSISTANTS[currentAI].logo;
            logo.style.cssText = `
                width: 32px;
                height: 32px;
                margin-right: 12px;
                border-radius: 8px;
                flex-shrink: 0;
            `;
        }).catch(err => {
            console.warn('Logo加载失败，继续使用占位图');
        });

        header.appendChild(logo);
        
        // 添加标题
        const title = document.createElement('span');
        title.textContent = AI_ASSISTANTS[currentAI].name;
        title.style.cssText = `
            font-size: 16px;
            font-weight: 600;
            color: ${isDark ? '#e0e0e0' : '#000000'};
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;
        
        header.appendChild(title);
        container.appendChild(header);

        // 创建内容区域
        const content = document.createElement('div');
        content.className = 'export-content';

        // 添加问题（如果有）
        const question = questionInput.value.trim();
        if (question) {
            const questionDiv = document.createElement('div');
            questionDiv.style.cssText = `
                display: flex;
                align-items: flex-start;
                margin-bottom: 12px;
            `;

            // 添加用户头像
            const avatar = document.createElement('div');
            avatar.style.cssText = `
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: ${isDark ? '#333333' : '#f5f5f7'};
                margin-right: 12px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${fontSize * 0.9}px;
                color: ${isDark ? '#a0a0a0' : '#666666'};
                font-weight: 500;
            `;
            avatar.textContent = '我';

            // 添加问题文本
            const questionText = document.createElement('div');
            questionText.style.cssText = `
                flex: 1;
                font-size: ${fontSize}px;
                line-height: 1.8;
                padding-top: 4px;
                color: ${isDark ? '#e0e0e0' : '#333333'};
            `;
            questionText.textContent = question;

            questionDiv.appendChild(avatar);
            questionDiv.appendChild(questionText);
            content.appendChild(questionDiv);

            // 添加分隔线
            const divider = document.createElement('div');
            divider.style.cssText = `
                width: 100%;
                height: 1px;
                background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#F5F5F5'};
                margin: 12px 0;
            `;
            content.appendChild(divider);
        }
        
        // 将Markdown转换为HTML
        const html = marked.parse(markdown);
        content.innerHTML += html;
        
        container.appendChild(content);

        // 等待所有图片加载完成
        const images = content.getElementsByTagName('img');
        if (images.length > 0) {
            await Promise.all(Array.from(images).map(img => {
                return new Promise((resolve) => {
                    if (img.complete) {
                        resolve();
                    } else {
                        img.onload = resolve;
                        img.onerror = resolve;
                    }
                });
            }));
        }

        // 等待字体和样式加载
        await document.fonts.ready;
        
        // 等待DOM更新和布局计算
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 获取实际内容高度并设置容器高度
        const contentHeight = content.offsetHeight;
        const headerHeight = header.offsetHeight;
        const totalHeight = contentHeight + headerHeight;
        
        console.log('容器尺寸:', {
            width: container.offsetWidth,
            height: totalHeight,
            contentHeight,
            headerHeight
        });

        // 确保容器有正确的尺寸
        container.style.height = `${totalHeight}px`;
        wrapper.style.height = `${totalHeight}px`;

        // 确保html2canvas选项正确设置
        const canvasOptions = {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            logging: true,
            width: 375,
            height: totalHeight,
            windowWidth: 375,
            windowHeight: totalHeight,
            foreignObjectRendering: true,
            onclone: (clonedDoc) => {
                const clonedContainer = clonedDoc.querySelector('.export-container');
                if (clonedContainer) {
                    clonedContainer.style.position = 'relative';
                    clonedContainer.style.left = '0';
                    clonedContainer.style.opacity = '1';
                    clonedContainer.style.height = `${totalHeight}px`;
                    
                    // 确保所有子元素可见
                    Array.from(clonedContainer.getElementsByTagName('*')).forEach(el => {
                        el.style.opacity = '1';
                        if (el.tagName.toLowerCase() === 'img') {
                            el.style.display = 'inline-block';
                            el.style.maxWidth = '100%';
                            el.style.height = 'auto';
                        }
                    });
                }
            }
        };

        // 使用try-catch包装html2canvas调用
        let canvas;
        try {
            canvas = await html2canvas(container, canvasOptions);
            
            // 验证canvas尺寸
            if (canvas.width === 0 || canvas.height === 0) {
                throw new Error(`Canvas尺寸无效: ${canvas.width}x${canvas.height}`);
            }
            
            console.log('Canvas生成成功，尺寸:', {
                width: canvas.width,
                height: canvas.height
            });
            
            // 验证canvas内容
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            
            // 检查是否所有像素都是透明的
            const hasContent = pixels.some((value, index) => {
                return index % 4 === 3 && value !== 0;
            });
            
            if (!hasContent) {
                throw new Error('Canvas渲染内容为空');
            }
        } catch (canvasError) {
            console.error('Canvas生成失败:', canvasError);
            throw new Error('Canvas生成失败: ' + canvasError.message);
        }

        // 验证canvas是否正确生成
        if (!canvas || !canvas.getContext) {
            throw new Error('Canvas对象无效');
        }

        console.log('开始转换为图片数据...');
        
        // 使用try-catch包装toDataURL调用
        let imageData;
        try {
            imageData = canvas.toDataURL('image/png', 1.0);
            console.log('图片数据生成成功，数据长度:', imageData.length);
        } catch (dataUrlError) {
            console.error('转换为DataURL失败:', dataUrlError);
            throw new Error('图片数据生成失败: ' + dataUrlError.message);
        }

        // 详细验证图片数据
        if (!imageData) {
            throw new Error('图片数据为空');
        }

        if (typeof imageData !== 'string') {
            throw new Error(`图片数据类型错误: ${typeof imageData}`);
        }

        if (!imageData.startsWith('data:image/png;base64,')) {
            console.error('图片数据格式:', imageData.substring(0, 50));
            throw new Error('图片数据格式无效');
        }

        // 验证base64数据的有效性
        const base64Data = imageData.split(',')[1];
        if (!base64Data || base64Data.length === 0) {
            throw new Error('Base64数据无效');
        }

        console.log('图片数据验证通过');
        
        // 更新预览
        imagePreview.dataset.imageData = imageData;
        imagePreview.dataset.isSplitView = 'false';
        await showImagePreview(imageData);
        
    } catch (error) {
        console.error('生成图片失败:', error);
        showToast(`生成失败: ${error.message}`);
    } finally {
        // 清理临时元素
        const containers = document.querySelectorAll('div[style*="left: -9999px"]');
        containers.forEach(container => {
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });
        // 移除临时样式表
        if (styleSheet && styleSheet.parentNode) {
            styleSheet.parentNode.removeChild(styleSheet);
        }
    }
}

// 显示图片预览
async function showImagePreview(imageData) {
    return new Promise((resolve, reject) => {
        console.log('开始验证图片数据...');
        
        // 基础验证
        if (!imageData) {
            console.error('图片数据为空');
            showToast('图片数据为空，请重新生成');
            reject(new Error('图片数据为空'));
            return;
        }

        if (typeof imageData !== 'string') {
            console.error('图片数据类型错误:', typeof imageData);
            showToast('图片数据类型错误，请重新生成');
            reject(new Error('图片数据类型错误'));
            return;
        }

        // 详细的格式验证
        if (!imageData.startsWith('data:image/png;base64,')) {
            console.error('图片数据格式无效，实际格式:', imageData.substring(0, 50));
            showToast('图片数据格式无效，请重新生成');
            reject(new Error('图片数据格式无效'));
            return;
        }

        console.log('图片数据验证通过，开始加载图片...');

        // 重置预览容器样式
        imagePreview.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--preview-bg);
            border-radius: 12px;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 12px;
            -webkit-overflow-scrolling: touch;
        `;

        // 添加加载提示
        const loadingDiv = document.createElement('div');
        loadingDiv.textContent = '图片加载中...';
        loadingDiv.style.cssText = `
            color: var(--text-secondary);
            font-size: 14px;
            text-align: center;
        `;
        imagePreview.innerHTML = '';
        imagePreview.appendChild(loadingDiv);

        const img = new Image();
        
        img.onload = () => {
            try {
                console.log('图片加载成功:', {
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2)
                });

                imagePreview.innerHTML = '';
                img.style.cssText = `
                    max-width: 100%;
                    width: auto;
                    height: auto;
                    display: block;
                    margin: 0 auto;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, ${isDarkMode() ? '0.3' : '0.08'});
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                    -webkit-user-drag: none;
                `;
                imagePreview.appendChild(img);
                showImagePreviewModal();
                resolve();
            } catch (err) {
                console.error('显示预览失败:', err);
                showToast('显示预览失败: ' + err.message);
                reject(err);
            }
        };
        
        img.onerror = (error) => {
            console.error('图片加载失败:', {
                error,
                dataLength: imageData.length,
                dataStart: imageData.substring(0, 30) + '...'
            });
            imagePreview.innerHTML = `
                <div style="
                    color: var(--text-error);
                    text-align: center;
                    padding: 20px;
                ">
                    <div style="
                        font-size: 16px;
                        margin-bottom: 8px;
                        color: var(--text-primary);
                    ">图片加载失败</div>
                    <div style="
                        font-size: 14px;
                        color: var(--text-secondary);
                    ">请检查图片数据是否正确，或重新生成</div>
                </div>
            `;
            showToast('图片加载失败，请重试');
            reject(new Error('图片加载失败'));
        };
        
        // 设置超时处理
        const timeout = setTimeout(() => {
            if (!img.complete) {
                console.error('图片加载超时');
                img.src = ''; // 取消加载
                showToast('图片加载超时，请重试');
                reject(new Error('图片加载超时'));
            }
        }, 30000); // 30秒超时

        // 设置图片属性
        img.alt = "预览图片";
        
        // 保存原始的onload处理函数
        const originalOnload = img.onload;
        const originalOnerror = img.onerror;
        
        // 设置新的事件处理函数
        img.onload = function() {
            clearTimeout(timeout);
            if (originalOnload) {
                originalOnload.apply(this, arguments);
            }
        };
        
        img.onerror = function() {
            clearTimeout(timeout);
            if (originalOnerror) {
                originalOnerror.apply(this, arguments);
            }
        };
        
        img.src = imageData;  // 最后设置src触发加载
    });
}

// 辅助函数：复制图片数据到剪贴板
async function copyImageDataToClipboard(imageData) {
    try {
        const img = new Image();
        img.src = imageData;
        
        await new Promise((resolve) => {
            img.onload = resolve;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        
        if (!navigator.clipboard?.write) {
            showToast('当前浏览器不支持复制图片，请长按图片保存', 3000);
            return false;
        }

        const clipboardItem = new ClipboardItem({
            'image/png': blob
        });
        await navigator.clipboard.write([clipboardItem]);
        return true;
    } catch (err) {
        console.error('Copy image failed:', err);
        showToast('当前浏览器不支持复制图片，请长按图片保存', 3000);
        return false;
    }
}

// 复制图片到剪贴板
async function copyImageToClipboard() {
    try {
        const imageData = imagePreview.dataset.imageData;
        if (!imageData) {
            showToast('未找到图片');
            return;
        }

        // 判断是否为分屏预览模式
        if (imagePreview.dataset.isSplitView === 'true') {
            try {
                const images = JSON.parse(imageData);
                if (!images || images.length === 0) {
                    showToast('未找到图片');
                    return;
                }
                // 复制第一张分屏图片
                const success = await copyImageDataToClipboard(images[0]);
                if (success) {
                    showToast('已复制第一张图片到剪贴板');
                }
            } catch (err) {
                console.error('Parse split images failed:', err);
                showToast('复制失败，请重试');
            }
        } else {
            // 复制单张图片
            const success = await copyImageDataToClipboard(imageData);
            if (success) {
                showToast('已复制图片到剪贴板');
            }
        }
    } catch (err) {
        console.error('Copy failed:', err);
        showToast('复制失败，请重试', 3000);
    }
}

// 保存图片到相册
function saveImage() {
    try {
        const imageData = imagePreview.dataset.imageData;
        if (!imageData) {
            showToast('未找到图片');
            return;
        }

        // 判断是否为分屏预览模式
        if (imagePreview.dataset.isSplitView === 'true') {
            try {
                const images = JSON.parse(imageData);
                if (!images || images.length === 0) {
                    showToast('未找到图片');
                    return;
                }
                // 保存所有分屏图片
                images.forEach((imgData, index) => {
                    const link = document.createElement('a');
                    link.download = `${currentAI}-export-${index + 1}.png`;
                    link.href = imgData;
                    link.click();
                });
                showToast(`已保存 ${images.length} 张图片`);
            } catch (err) {
                console.error('Parse split images failed:', err);
                showToast('保存失败，请重试');
            }
        } else {
            // 保存单张图片
            const link = document.createElement('a');
            link.download = `${currentAI}-export.png`;
            link.href = imageData;
            link.click();
            showToast('已保存图片');
        }
    } catch (err) {
        console.error('Save failed:', err);
        showToast('保存失败，请重试');
    }
}

// 隐藏图片预览模态框
function hideImagePreviewModal() {
    imagePreviewModal.style.display = 'none';
    // 清理预览内容
    imagePreview.innerHTML = '';
}

// 显示图片预览模态框
function showImagePreviewModal() {
    imagePreviewModal.style.cssText = `
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(5px);
        z-index: 1000;
        transform: translateZ(0);
        isolation: isolate;
    `;
}

// AI助手选择器事件监听
document.querySelectorAll('.ai-option').forEach(option => {
    option.addEventListener('click', () => {
        // 移除其他选项的选中状态
        document.querySelectorAll('.ai-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        // 添加当前选项的选中状态
        option.classList.add('selected');
        // 更新当前选中的AI助手
        currentAI = option.dataset.ai;
        // 保存到localStorage
        saveToLocalStorage();
    });
});

// 自动保存到localStorage
function saveToLocalStorage() {
    try {
        const content = {
            question: questionInput.value,
            markdown: markdownInput.value,
            currentAI: currentAI
        };
        localStorage.setItem('postify-content', JSON.stringify(content));
    } catch (err) {
        console.error('Save to localStorage failed:', err);
    }
}

// 修改清空功能
function clearContent() {
    if (!markdownInput.value && !questionInput.value && likeCount === 0) {
        return; // 如果没有内容且点赞数为0，直接返回
    }
    
    // 保存当前状态到历史记录
    saveToHistory();
    
    // 清空输入区域
    markdownInput.value = '';
    questionInput.value = '';
    
    // 清空点赞数
    likeCount = 0;
    localStorage.setItem('postify-likes', '0');
    updateLikeButtonState();
    
    // 更新预览
    updatePreview();
    showToast('已清空所有内容和点赞');
    
    // 保存到本地存储
    saveToLocalStorage();
    
    // 更新按钮状态
    updateButtonStates();
}

// 修改粘贴功能
async function handlePaste() {
    try {
        // 首先检查是否支持 navigator.clipboard API
        if (!navigator.clipboard) {
            throw new Error('浏览器不支持剪贴板API');
        }

        // 请求剪贴板读取权限
        let text;
        try {
            text = await navigator.clipboard.readText();
        } catch (permissionError) {
            // 如果是权限错误，给出明确提示
            if (permissionError.name === 'NotAllowedError') {
                showToast('请允许访问剪贴板权限', 3000);
                return;
            }
            throw permissionError;
        }

        if (!text) {
            showToast('剪切板为空');
            return;
        }
        
        // 保存当前状态到历史记录
        saveToHistory();
        
        // 清空并粘贴新内容
        markdownInput.value = text;
        markdownInput.focus();
        
        // 保存到localStorage
        saveToLocalStorage();
        
        // 更新预览
        updatePreview();
        
        showToast('已粘贴内容');
        
        // 更新按钮状态
        updateButtonStates();
    } catch (err) {
        console.error('Paste failed:', err);
        // 提供更友好的错误提示
        if (err.message.includes('剪贴板API')) {
            showToast('当前浏览器不支持剪贴板功能，请使用快捷键(Ctrl+V)粘贴', 3000);
        } else {
            showToast('粘贴失败，请尝试使用快捷键(Ctrl+V)粘贴', 3000);
        }
    }
}

// 实时预览
function updatePreview() {
    const markdown = markdownInput.value;
    const html = marked.parse(markdown);
    previewContent.innerHTML = html;
}

// 修改 generateSplitImages 函数
async function generateSplitImages() {
    const markdown = markdownInput.value.trim();
    if (!markdown) {
        showToast('没有可预览的内容');
        return;
    }

    const isDark = isDarkMode();
    const isMobile = isMobileDevice();
    
    // 添加缺失的变量定义
    const renderScale = isMobile ? 4 : 6; // 移动端4倍，桌面端6倍缩放
    const maxCanvasHeight = 32767; // 浏览器canvas高度限制
    const segmentHeight = Math.floor(maxCanvasHeight / renderScale); // 每段的最大高度
    
    // 根据设备类型设置尺寸
    const containerWidth = isMobile ? 375 : 750;
    const containerHeight = isMobile ? 600 : 1000;
    const baseSize = containerWidth * 0.028 * 0.2;  // 缩小到原来的1/5
    const baseFontSize = Math.min(baseSize * 0.9, isMobile ? 2.4 : 2.8);  // 限制最大字体
    const headerFontSize = Math.min(baseSize * 1.2, isMobile ? 2.8 : 3.6);  // 限制标题字体
    const logoSize = Math.min(baseSize * 2.4, isMobile ? 24 : 36);  // logo保持原来大小
    const containerPadding = Math.min(baseSize * 1.6, isMobile ? 12 : 24);  // 保持原来内边距
    
    try {
        // 创建临时容器
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: ${containerWidth}px;
            background: ${isDark ? '#1a1a1a' : 'white'};
            font-family: -apple-system, system-ui, "SF Pro SC", "SF Pro Text", "PingFang SC", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;
            line-height: 1.2;
            border-radius: ${isMobile ? 12 : 24}px;
            overflow: visible;
            font-size: ${baseFontSize}px;
            opacity: 0;
            pointer-events: none;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            word-wrap: break-word;
            word-break: break-word;
            white-space: pre-wrap;
            letter-spacing: -0.2px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, ${isDark ? '0.3' : '0.08'});
        `;
        document.body.appendChild(container);

        // 创建头部
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            padding: ${containerPadding * 0.5}px ${containerPadding}px;
            background: ${isDark ? '#1a1a1a' : 'white'};
            border-bottom: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#F5F5F5'};
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            min-height: ${logoSize + containerPadding}px;
        `;

        // 添加选中的AI助手图标
        const logo = document.createElement('img');
        logo.src = AI_ASSISTANTS[currentAI].logo;
        logo.style.cssText = `
            width: ${logoSize}px;
            height: ${logoSize}px;
            margin-right: ${containerPadding}px;
            border-radius: 8px;
            flex-shrink: 0;
        `;

        // 添加标题
        const title = document.createElement('span');
        title.textContent = AI_ASSISTANTS[currentAI].name;
        title.style.cssText = `
            font-size: ${headerFontSize}px;
            font-weight: 600;
            color: ${isDark ? '#e0e0e0' : '#000000'};
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;

        header.appendChild(logo);
        header.appendChild(title);
        container.appendChild(header);

        // 创建内容区域
        const content = document.createElement('div');
        content.style.cssText = `
            padding: ${containerPadding}px;
            background: ${isDark ? '#1a1a1a' : 'white'};
            color: ${isDark ? '#e0e0e0' : '#333333'};
            font-size: ${baseFontSize}px;
            line-height: 1.8;
        `;

        // 添加问题（如果有）
        const question = questionInput.value.trim();
        if (question) {
            const questionDiv = document.createElement('div');
            questionDiv.style.cssText = `
                display: flex;
                align-items: flex-start;
                margin-bottom: ${containerPadding}px;
            `;

            // 添加用户头像
            const avatar = document.createElement('div');
            avatar.style.cssText = `
                width: ${logoSize}px;
                height: ${logoSize}px;
                border-radius: 50%;
                background: ${isDark ? '#333333' : '#f5f5f5'};
                margin-right: ${containerPadding}px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${baseFontSize * 0.9}px;
                color: ${isDark ? '#a0a0a0' : '#666666'};
                font-weight: 500;
            `;
            avatar.textContent = '我';

            // 添加问题文本
            const questionText = document.createElement('div');
            questionText.style.cssText = `
                flex: 1;
                font-size: ${baseFontSize}px;
                line-height: 1.8;
                padding-top: ${containerPadding * 0.2}px;
                color: ${isDark ? '#e0e0e0' : '#333333'};
            `;
            questionText.textContent = question;

            questionDiv.appendChild(avatar);
            questionDiv.appendChild(questionText);
            content.appendChild(questionDiv);

            // 添加分隔线
            const divider = document.createElement('div');
            divider.style.cssText = `
                width: 100%;
                height: 1px;
                background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#F5F5F5'};
                margin: ${containerPadding}px 0;
            `;
            content.appendChild(divider);
        }
        
        // 将Markdown转换为HTML
        const html = marked.parse(markdown);
        content.innerHTML += html;

        // 自定义样式
        const style = document.createElement('style');
        style.textContent = `
            h1, h2, h3, h4, h5, h6 { 
                margin: 20px 0 10px; 
                font-weight: 600;
                color: ${isDark ? '#e0e0e0' : '#1a1a1a'};
                font-size: ${baseFontSize * 1.2}px;
            }
            p { 
                margin: 10px 0; 
                line-height: 1.8;
                color: ${isDark ? '#e0e0e0' : '#333333'};
                font-size: ${baseFontSize}px;
            }
            ul, ol { 
                padding-left: 20px; 
                margin: 10px 0;
                color: ${isDark ? '#e0e0e0' : '#333333'};
                font-size: ${baseFontSize}px;
            }
            li { 
                margin: 8px 0;
                font-size: ${baseFontSize}px;
            }
            hr { 
                border: none; 
                height: 1px; 
                background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#E8E8E8'}; 
                margin: 24px 0; 
            }
            code {
                background: ${isDark ? '#333333' : '#f5f5f7'};
                color: ${isDark ? '#e0e0e0' : '#1a1a1a'};
                padding: 2px 6px;
                border-radius: 4px;
                font-size: ${baseFontSize * 0.9}px;
            }
        `;
        
        container.appendChild(style);
        container.appendChild(content);

        // 等待DOM更新
        await new Promise(resolve => setTimeout(resolve, 100));

        // 计算内容总高度
        const totalHeight = content.scrollHeight;
        const headerHeight = header.offsetHeight;
        const availableHeight = containerHeight - headerHeight;
        const numberOfScreens = Math.ceil(totalHeight / availableHeight);
        
        // 生成每个section的图片
        const images = [];
        for (let i = 0; i < numberOfScreens; i++) {
            // 创建新的section容器
            const sectionContainer = document.createElement('div');
            sectionContainer.style.cssText = `
                width: ${containerWidth}px;
                height: ${containerHeight}px;
                background: ${isDark ? '#1a1a1a' : 'white'};
                overflow: hidden;
                position: relative;
            `;
            
            // 添加头部
            sectionContainer.innerHTML = headerHtml;
            
            // 创建内容区域
            const sectionContent = document.createElement('div');
            sectionContent.style.cssText = `
                padding: ${containerPadding}px;
                background: ${isDark ? '#1a1a1a' : 'white'};
                color: ${isDark ? '#e0e0e0' : '#333333'};
                font-size: ${baseFontSize}px;
                line-height: 1.8;
                height: ${containerHeight - headerHeight}px;
                overflow: hidden;
                position: relative;
            `;
            
            // 克隆并设置内容偏移
            const contentClone = content.cloneNode(true);
            contentClone.style.marginTop = `-${i * availableHeight}px`;
            sectionContent.appendChild(contentClone);
            sectionContainer.appendChild(sectionContent);
            
            container.innerHTML = '';
            container.appendChild(sectionContainer);

            // 生成图片
            try {
                const canvas = await html2canvas(sectionContainer, {
                    scale: renderScale,  // 提高缩放比例以增加清晰度
                    useCORS: true,
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    logging: false,
                    width: containerWidth,
                    height: containerHeight,
                    onclone: (clonedDoc) => {
                        const clonedContainer = clonedDoc.querySelector('div');
                        if (clonedContainer) {
                            clonedContainer.style.position = 'relative';
                            clonedContainer.style.left = '0';
                        }
                    },
                    letterRendering: true,
                    allowTaint: true,
                    foreignObjectRendering: true
                });

                const imageData = canvas.toDataURL('image/png', 1.0);
                images.push(imageData);
            } catch (err) {
                console.error('Failed to generate section image:', err);
                continue;
            }
        }

        // 显示预览
        if (images.length > 0) {
            showSplitImagePreview(images);
        } else {
            showToast('生成图片失败，请重试');
        }
        
    } catch (error) {
        console.error('Split image generation failed:', error);
        showToast('生成分屏图片失败，请重试');
    } finally {
        // 清理临时容器
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    }
}

// 修改 showSplitImagePreview 函数
function showSplitImagePreview(images) {
    if (!images || images.length === 0) {
        showToast('没有可预览的图片');
        return;
    }

    // 重置预览容器
    imagePreview.innerHTML = '';
    
    // 更新数据集
    imagePreview.dataset.imageData = JSON.stringify(images);
    imagePreview.dataset.isSplitView = 'true';
    
    // 修改预览容器的滚动行为
    imagePreview.style.cssText = `
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
        overscroll-behavior: contain;
        padding: 0;
        margin: 0;
        width: 100%;
        height: 100%;
        position: relative;
    `;
    
    const isMobile = isMobileDevice();
    const previewPadding = isMobile ? 12 : 24;
    const previewGap = isMobile ? 12 : 24;
    const borderRadius = isMobile ? 12 : 24;
    const labelFontSize = isMobile ? 12 : 14;
    const labelPadding = isMobile ? '4px 8px' : '6px 12px';
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-content';
    previewContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: ${previewGap}px;
        padding: ${previewPadding}px;
        max-width: ${isMobile ? '100%' : '80%'};
        margin: 0 auto;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        perspective: 1000;
        -webkit-perspective: 1000;
    `;
    
    // 创建并添加所有图片
    images.forEach((imageData, index) => {
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = `
            position: relative;
            width: 100%;
            border-radius: ${borderRadius}px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, ${isDarkMode() ? '0.3' : '0.08'});
            background: ${isDarkMode() ? '#1a1a1a' : 'white'};
            transition: transform 0.2s ease;
            cursor: pointer;
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
            will-change: transform;
            
            &:hover {
                transform: translateY(-2px) translateZ(0);
            }
            
            &:active {
                transform: translateY(0) translateZ(0);
            }
        `;
        
        const img = document.createElement('img');
        img.src = imageData;
        img.alt = `预览图片 ${index + 1}`;
        img.style.cssText = `
            width: 100%;
            height: auto;
            display: block;
            object-fit: contain;
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
            will-change: transform;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        `;

        // 添加点击事件（支持双击关闭）
        let lastClick = 0;
        const doubleClickDelay = 300;
        
        imageContainer.addEventListener('click', (e) => {
            const currentTime = new Date().getTime();
            if (currentTime - lastClick < doubleClickDelay) {
                // 双击事件
                hideImagePreviewModal();
            }
            lastClick = currentTime;
            e.stopPropagation();
        });

        imageContainer.appendChild(img);
        
        // 添加页码标签
        const indexLabel = document.createElement('div');
        indexLabel.style.cssText = `
            position: absolute;
            top: ${previewPadding}px;
            right: ${previewPadding}px;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            padding: ${labelPadding};
            border-radius: ${borderRadius / 2}px;
            font-size: ${labelFontSize}px;
            font-weight: 500;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 2;
            display: flex;
            align-items: center;
            gap: 4px;
        `;
        
        // 添加页码图标
        const pageIcon = document.createElement('span');
        pageIcon.innerHTML = `
            <svg width="${labelFontSize}" height="${labelFontSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
        `;
        indexLabel.appendChild(pageIcon);
        
        // 添加页码文本
        const pageText = document.createElement('span');
        pageText.textContent = `${index + 1}/${images.length}`;
        indexLabel.appendChild(pageText);
        
        imageContainer.appendChild(indexLabel);
        
        // 添加复制按钮（仅在PC端显示）
        if (!isMobile) {
            const copyButton = document.createElement('button');
            copyButton.style.cssText = `
                position: absolute;
                bottom: ${previewPadding}px;
                right: ${previewPadding}px;
                background: rgba(0, 0, 0, 0.6);
                color: white;
                padding: ${labelPadding};
                border-radius: ${borderRadius / 2}px;
                font-size: ${labelFontSize}px;
                font-weight: 500;
                border: none;
                cursor: pointer;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                z-index: 2;
                display: flex;
                align-items: center;
                gap: 4px;
                opacity: 0;
                transition: opacity 0.2s ease;
            `;
            
            // 添加复制图标
            copyButton.innerHTML = `
                <svg width="${labelFontSize}" height="${labelFontSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>复制图片</span>
            `;
            
            // 显示/隐藏复制按钮
            imageContainer.addEventListener('mouseenter', () => {
                copyButton.style.opacity = '1';
            });
            
            imageContainer.addEventListener('mouseleave', () => {
                copyButton.style.opacity = '0';
            });
            
            // 复制按钮点击事件
            copyButton.addEventListener('click', async (e) => {
                e.stopPropagation();
                const success = await copyImageDataToClipboard(imageData);
                if (success) {
                    showToast(`已复制第 ${index + 1} 张图片`);
                }
            });
            
            imageContainer.appendChild(copyButton);
        }
        
        previewContainer.appendChild(imageContainer);
    });
    
    imagePreview.appendChild(previewContainer);
    imagePreviewModal.style.display = 'block';
}

// 创建备份
function createBackup() {
    try {
        const backupData = {
            markdown: markdownInput.value,
            question: questionInput.value,
            currentAI: currentAI,
            timestamp: new Date().toISOString(),
            theme: document.documentElement.getAttribute('data-theme'),
            version: '1.0'
        };
        
        // 转换为JSON字符串
        const backupString = JSON.stringify(backupData);
        
        // 创建Blob
        const blob = new Blob([backupString], { type: 'application/json' });
        
        // 创建下载链接
        const a = document.createElement('a');
        a.download = `postify-backup-${new Date().toISOString().slice(0,10)}.json`;
        a.href = URL.createObjectURL(blob);
        
        // 触发下载
        document.body.appendChild(a);
        a.click();
        
        // 清理
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        
        showToast('备份文件已下载');
    } catch (error) {
        console.error('创建备份失败:', error);
        showToast('创建备份失败，请重试');
    }
}

// 恢复备份
async function restoreBackup(file) {
    try {
        const text = await file.text();
        const backupData = JSON.parse(text);
        
        // 验证备份数据
        if (!backupData || typeof backupData !== 'object') {
            throw new Error('无效的备份文件格式');
        }
        
        // 恢复内容
        if (backupData.markdown !== undefined) {
            markdownInput.value = backupData.markdown;
        }
        
        if (backupData.question !== undefined) {
            questionInput.value = backupData.question;
        }
        
        // 恢复AI助手选择
        if (backupData.currentAI && AI_ASSISTANTS[backupData.currentAI]) {
            currentAI = backupData.currentAI;
            // 更新UI选中状态
            document.querySelectorAll('.ai-option').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.ai === currentAI);
            });
        }
        
        // 恢复主题
        if (backupData.theme) {
            document.documentElement.setAttribute('data-theme', backupData.theme);
            localStorage.setItem('theme', backupData.theme);
        }
        
        // 保存到本地存储
        saveToLocalStorage();
        
        // 更新预览
        updatePreview();
        
        showToast('备份已恢复');
    } catch (error) {
        console.error('恢复备份失败:', error);
        showToast('恢复备份失败：' + error.message);
    }
}

// 添加备份按钮点击事件
document.getElementById('backupBtn').addEventListener('click', createBackup);

// 添加恢复按钮和文件选择器
const restoreInput = document.createElement('input');
restoreInput.type = 'file';
restoreInput.accept = '.json';
restoreInput.style.display = 'none';
document.body.appendChild(restoreInput);

restoreInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        restoreBackup(file);
    }
    restoreInput.value = ''; // 清理选择，允许选择相同文件
});

document.getElementById('restoreBtn').addEventListener('click', () => {
    restoreInput.click();
});

// 处理导出长图
async function handleExportImage() {
    const markdown = markdownInput.value.trim();
    const question = questionInput.value.trim();
    
    if (!markdown) {
        showToast('没有可导出的内容');
        return;
    }
    
    // 创建预览容器
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';
    
    // 添加AI助手标题
    const headerDiv = document.createElement('div');
    headerDiv.className = 'preview-header';
    const currentAssistant = AI_ASSISTANTS[currentAI];
    headerDiv.innerHTML = `
        <img src="${currentAssistant.logo}" alt="${currentAssistant.name}">
        <span>${currentAssistant.name}</span>
    `;
    previewContainer.appendChild(headerDiv);
    
    // 添加内容
    const contentDiv = document.createElement('div');
    contentDiv.className = 'preview-content';
    
    // 如果有问题，添加问答布局
    if (question) {
        const qaDiv = document.createElement('div');
        qaDiv.className = 'qa-container';
        qaDiv.innerHTML = `
            <div class="qa-avatar">
                <img src="assets/avatars/user-avatar.png" alt="用户头像">
            </div>
            <div class="qa-content">
                <strong>问题：</strong>
                ${question}
            </div>
        `;
        contentDiv.appendChild(qaDiv);
    }
    
    // 添加回答内容
    const answerDiv = document.createElement('div');
    answerDiv.className = 'qa-container';
    answerDiv.innerHTML = `
        <div class="qa-avatar">
            <img src="${currentAssistant.logo}" alt="${currentAssistant.name}">
        </div>
        <div class="qa-content">
            ${question ? '<strong>回答：</strong>' : ''}
            ${marked.parse(markdown)}
        </div>
    `;
    contentDiv.appendChild(answerDiv);
    
    // 处理代码块
    contentDiv.querySelectorAll('pre code').forEach(block => {
        // 添加行号
        block.classList.add('line-numbers');
        
        // 获取语言
        const language = block.className.match(/language-(\w+)/)?.[1] || 'plaintext';
        block.parentElement.setAttribute('data-language', language);
        
        // 应用Prism.js高亮
        Prism.highlightElement(block);
    });
    
    previewContainer.appendChild(contentDiv);
    
    // 添加水印
    const watermark = document.createElement('div');
    watermark.className = 'preview-watermark';
    watermark.innerHTML = `
        <div style="display: flex; align-items: center;">
            <img src="assets/logos/postify.png" alt="Postify">
            <span>Postify.cc - 超好用的AI对话分享工具</span>
        </div>
    `;
    previewContainer.appendChild(watermark);
    
    // 清空预览区域并添加预览容器
    imagePreview.innerHTML = '';
    imagePreview.appendChild(previewContainer);
    
    // 显示预览模态框
    showImagePreviewModal();
    
    try {
        // 使用html2canvas生成图片
        const canvas = await html2canvas(previewContainer, {
            scale: 2, // 提高清晰度
            useCORS: true,
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-primary'),
            logging: false,
            onclone: function(clonedDoc) {
                // 确保克隆的文档中的代码块也被正确高亮
                clonedDoc.querySelectorAll('pre code').forEach(block => {
                    Prism.highlightElement(block);
                });
            }
        });
        
        // 将canvas转换为图片
        const img = new Image();
        img.src = canvas.toDataURL('image/png');
        
        // 存储图片数据用于保存
        imagePreview.dataset.imageData = img.src;
        
        // 移除预览容器，显示生成的图片
        imagePreview.innerHTML = '';
        imagePreview.appendChild(img);
        
    } catch (err) {
        console.error('Generate image failed:', err);
        showToast('生成图片失败，请重试');
        hideImagePreviewModal();
    }
}

// 处理保存图片
async function handleSaveImage() {
    const imageData = imagePreview.dataset.imageData;
    if (!imageData) {
        showToast('未找到图片');
        return;
    }
    
    try {
        // 将base64转换为blob
        const response = await fetch(imageData);
        const blob = await response.blob();
        
        // 使用原生的showSaveFilePicker API
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: `postify-${Date.now()}.png`,
                    types: [{
                        description: 'PNG图片',
                        accept: {'image/png': ['.png']},
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                showToast('图片已保存');
                return;
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Save with picker failed:', err);
                }
            }
        }
        
        // 降级方案：使用Blob URL
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `postify-${Date.now()}.png`;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        
        showToast('图片已保存');
    } catch (err) {
        console.error('Save image failed:', err);
        showToast('保存失败，请重试');
    }
}

// 显示图片预览模态框
function showImagePreviewModal() {
    imagePreviewModal.style.display = 'block';
}

// 隐藏图片预览模态框
function hideImagePreviewModal() {
    imagePreviewModal.style.display = 'none';
    // 清除预览内容
    imagePreview.innerHTML = '';
    imagePreview.dataset.imageData = '';
}