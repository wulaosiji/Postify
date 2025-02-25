// DOM元素
const markdownInput = document.getElementById('markdownInput');
const questionInput = document.getElementById('questionInput');
const copyTextBtn = document.getElementById('copyTextBtn');
const exportImageBtn = document.getElementById('exportImageBtn');
const splitImageBtn = document.getElementById('splitImageBtn');
const previewModal = document.getElementById('previewModal');
const imagePreviewModal = document.getElementById('imagePreviewModal');
const previewText = document.getElementById('previewText');
const copyFinalBtn = document.getElementById('copyFinalBtn');
const copyImageBtn = document.getElementById('copyImageBtn');
const saveImageBtn = document.getElementById('saveImageBtn');
const imagePreview = document.getElementById('imagePreview');
const menuBtn = document.getElementById('menuBtn');
const aiMenu = document.getElementById('aiMenu');
const previewContent = document.getElementById('previewContent');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const clearBtn = document.getElementById('clearBtn');
const pasteBtn = document.getElementById('pasteBtn');
const undoBtn = document.getElementById('undoBtn');
const likeBtn = document.getElementById('likeBtn');
const shareBtn = document.getElementById('shareBtn');
const likeCountSpan = document.querySelector('.like-count');

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
        const shareText = '发现一个超好用的AI助手对话分享工具！' + shareUrl;
        
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

// 在页面加载完成后初始化所有功能
window.addEventListener('load', () => {
    initializeFeatures();
    
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
    
    // 运行测试
    console.log('开始运行转换测试...');
    const testResult = testMarkdownToPlainText();
    console.log('测试完成，结果：', testResult ? '全部通过' : '存在失败项');
});

// 监听输入变化
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

// 监听剪贴板变化
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        updateButtonStates();
    }
});

// 事件监听
themeToggleBtn.addEventListener('click', toggleTheme);
clearBtn.addEventListener('click', clearContent);
undoBtn.addEventListener('click', undo);
pasteBtn.addEventListener('click', handlePaste);

// 初始化主题
initTheme();

// AI助手配置
const AI_ASSISTANTS = {
    postify: {
        name: 'Postify: From AI to Social',
        logo: 'assets/logos/postify.png'
    },
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
let currentAI = 'postify';

// Markdown配置
marked.setOptions({
    breaks: true,
    gfm: true
});

// 自定义Markdown渲染器
const renderer = new marked.Renderer();
renderer.hr = () => '<div style="width: 100%; height: 1px; background: #E8E8E8; margin: 24px 0;"></div>';
marked.setOptions({ renderer });

// 工具函数：显示Toast提示
function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 显示动画
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });
    
    // 自动隐藏
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
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
    
    // 5. 添加水印（前面加一个空行）
    text += '\n\nPostify.cc - 超好用的AI助手对话分享工具';
    
    return text;
}

// 复制到剪贴板功能
async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('已复制到剪贴板');
        // 移除选中效果
        window.getSelection().removeAllRanges();
    } catch (err) {
        // 如果剪贴板API不可用，使用传统方法
        previewText.value = text;
        previewText.select();
        document.execCommand('copy');
        // 移除选中效果
        window.getSelection().removeAllRanges();
        previewText.blur();
        showToast('已复制到剪贴板');
    }
}

// 显示预览模态框
function showPreviewModal(text) {
    previewText.value = text;
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

// 生成长图片
async function generateImage() {
    const markdown = markdownInput.value.trim();
    if (!markdown) {
        showToast('没有可预览的长图');
        return;
    }

    const isDark = isDarkMode();
    const fontSize = 16; // 使用固定字号
    
    // 创建临时容器
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        left: -9999px;
        width: 375px;
        background: ${isDark ? '#1a1a1a' : 'white'};
        font-family: -apple-system, system-ui, sans-serif;
        line-height: 1.8;
        border-radius: 16px;
        overflow: hidden;
        font-size: ${fontSize}px;
    `;

    // 创建头部
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        align-items: center;
        padding: 16px 20px;
        background: ${isDark ? '#1a1a1a' : 'white'};
        border-bottom: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#F5F5F5'};
    `;

    // 添加选中的AI助手图标
    const logo = document.createElement('img');
    logo.src = AI_ASSISTANTS[currentAI].logo;
    logo.style.cssText = `
        width: 32px;
        height: 32px;
        margin-right: 8px;
        border-radius: 8px;
    `;

    // 添加标题
    const title = document.createElement('span');
    title.textContent = AI_ASSISTANTS[currentAI].name;
    title.style.cssText = `
        font-size: 16px;
        font-weight: 500;
        color: ${isDark ? '#e0e0e0' : '#000000'};
    `;

    header.appendChild(logo);
    header.appendChild(title);
    container.appendChild(header);

    // 创建内容区域
    const content = document.createElement('div');
    content.style.cssText = `
        padding: 20px;
        background: ${isDark ? '#1a1a1a' : 'white'};
        color: ${isDark ? '#e0e0e0' : '#333333'};
        font-size: ${fontSize}px;
        line-height: 1.8;
    `;

    // 添加问题（如果有）
    const question = questionInput.value.trim();
    if (question) {
        const questionDiv = document.createElement('div');
        questionDiv.style.cssText = `
            display: flex;
            align-items: flex-start;
            margin-bottom: 20px;
        `;

        // 添加用户头像
        const avatar = document.createElement('div');
        avatar.style.cssText = `
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${isDark ? '#333333' : '#f5f5f5'};
            margin-right: 12px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
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
            margin: 20px 0;
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
            font-size: ${fontSize * 1.2}px;
        }
        p { 
            margin: 10px 0; 
            line-height: 1.8;
            color: ${isDark ? '#e0e0e0' : '#333333'};
            font-size: ${fontSize}px;
        }
        ul, ol { 
            padding-left: 20px; 
            margin: 10px 0;
            color: ${isDark ? '#e0e0e0' : '#333333'};
            font-size: ${fontSize}px;
        }
        li { 
            margin: 8px 0;
            font-size: ${fontSize}px;
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
            font-size: ${fontSize * 0.9}px;
        }
    `;
    
    container.appendChild(style);
    container.appendChild(content);
    document.body.appendChild(container);
    
    try {
        // 使用html2canvas生成图片
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            logging: false,
            onclone: (clonedDoc) => {
                const clonedContainer = clonedDoc.querySelector('div');
                if (clonedContainer) {
                    clonedContainer.style.position = 'relative';
                    clonedContainer.style.left = '0';
                }
            }
        });
        
        // 生成图片数据
        const image = canvas.toDataURL('image/png');
        
        // 先更新数据集
        imagePreview.dataset.imageData = image;
        imagePreview.dataset.isSplitView = 'false';
        
        // 显示预览
        showImagePreview(image);
        
    } catch (err) {
        showToast('生成失败，请重试');
        console.error('Export failed:', err);
    } finally {
        document.body.removeChild(container);
    }
}

// 显示图片预览
function showImagePreview(imageData) {
    const img = document.createElement('img');
    img.src = imageData;
    img.alt = "预览图片";
    
    // 添加双击事件
    let lastClick = 0;
    const doubleClickDelay = 300; // 双击判定时间间隔
    
    img.addEventListener('click', (e) => {
        const currentTime = new Date().getTime();
        if (currentTime - lastClick < doubleClickDelay) {
            // 双击事件
            hideImagePreviewModal();
        }
        lastClick = currentTime;
        e.stopPropagation(); // 阻止事件冒泡
    });
    
    imagePreview.innerHTML = '';
    imagePreview.appendChild(img);
    imagePreviewModal.style.display = 'block';
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
}

// 事件监听
copyTextBtn.addEventListener('click', () => {
    const markdown = markdownInput.value.trim();
    if (!markdown) {
        showToast('没有可预览的文字');
        return;
    }
    const plainText = markdownToPlainText(markdown);
    showPreviewModal(plainText);
});

copyFinalBtn.addEventListener('click', () => {
    copyText(previewText.value);
});

exportImageBtn.addEventListener('click', generateImage);

splitImageBtn.addEventListener('click', generateSplitImages);

copyImageBtn.addEventListener('click', copyImageToClipboard);

saveImageBtn.addEventListener('click', saveImage);

// 点击模态框背景或预览区域关闭
previewModal.addEventListener('click', (e) => {
    // 如果点击的是暗色背景或文本框本身，则关闭预览
    if (e.target === previewModal || e.target === previewText) {
        hidePreviewModal();
    }
});

// 添加图片预览模态框的点击事件
imagePreviewModal.addEventListener('click', (e) => {
    // 只有点击模态框背景时才关闭
    if (e.target === imagePreviewModal) {
        hideImagePreviewModal();
    }
});

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
    const data = {
        question: questionInput.value,
        markdown: markdownInput.value,
        currentAI: currentAI
    };
    localStorage.setItem('postify-content', JSON.stringify(data));
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
    const containerWidth = 375; // 修改为与长图一致的宽度
    const containerHeight = 600; // 保持2:3比例
    const fontSize = 16; // 使用与长图一致的字号
    
    try {
        // 创建临时容器
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: ${containerWidth}px;
            background: ${isDark ? '#1a1a1a' : 'white'};
            font-family: -apple-system, system-ui, sans-serif;
            line-height: 1.8;
            border-radius: 16px;
            overflow: hidden;
            font-size: ${fontSize}px;
            opacity: 0;
            pointer-events: none;
        `;
        document.body.appendChild(container);

        // 创建头部HTML
        const headerHtml = `
            <div style="display: flex; align-items: center; padding: 16px 20px; background: ${isDark ? '#1a1a1a' : 'white'}; border-bottom: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#F5F5F5'};">
                <img src="${AI_ASSISTANTS[currentAI].logo}" style="width: 32px; height: 32px; margin-right: 8px; border-radius: 8px;" crossorigin="anonymous">
                <span style="font-size: 16px; font-weight: 500; color: ${isDark ? '#e0e0e0' : '#000000'};">
                    ${AI_ASSISTANTS[currentAI].name}
                </span>
            </div>
        `;

        // 将Markdown转换为HTML
        const markdownHtml = marked.parse(markdown);
        
        // 创建临时内容容器来计算总高度
        const tempContent = document.createElement('div');
        tempContent.style.cssText = `
            padding: 20px;
            background: ${isDark ? '#1a1a1a' : 'white'};
            color: ${isDark ? '#e0e0e0' : '#333333'};
            font-size: ${fontSize}px;
            line-height: 1.8;
            width: ${containerWidth}px;
        `;

        // 添加问题（如果有）
        const question = questionInput.value.trim();
        if (question) {
            const questionHtml = `
                <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                    <div style="
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: ${isDark ? '#333333' : '#f5f5f5'};
                        margin-right: 12px;
                        flex-shrink: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        color: ${isDark ? '#a0a0a0' : '#666666'};
                        font-weight: 500;
                    ">我</div>
                    <div style="
                        flex: 1;
                        font-size: ${fontSize}px;
                        line-height: 1.8;
                        padding-top: 4px;
                        color: ${isDark ? '#e0e0e0' : '#333333'};
                    ">${question}</div>
                </div>
                <div style="
                    width: 100%;
                    height: 1px;
                    background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#F5F5F5'};
                    margin: 20px 0;
                "></div>
            `;
            tempContent.innerHTML = questionHtml;
        }

        // 添加Markdown内容
        tempContent.innerHTML += markdownHtml;
        
        // 添加自定义样式
        const style = document.createElement('style');
        style.textContent = `
            h1, h2, h3, h4, h5, h6 { 
                margin: 20px 0 10px; 
                font-weight: 600;
                color: ${isDark ? '#e0e0e0' : '#1a1a1a'};
                font-size: ${fontSize * 1.2}px;
            }
            p { 
                margin: 10px 0; 
                line-height: 1.8;
                color: ${isDark ? '#e0e0e0' : '#333333'};
                font-size: ${fontSize}px;
            }
            ul, ol { 
                padding-left: 20px; 
                margin: 10px 0;
                color: ${isDark ? '#e0e0e0' : '#333333'};
                font-size: ${fontSize}px;
            }
            li { 
                margin: 8px 0;
                font-size: ${fontSize}px;
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
                font-size: ${fontSize * 0.9}px;
            }
            blockquote {
                margin: 16px 0;
                padding-left: 16px;
                border-left: 4px solid ${isDark ? '#333333' : '#f5f5f7'};
                color: ${isDark ? '#a0a0a0' : '#666666'};
            }
            pre {
                background: ${isDark ? '#333333' : '#f5f5f7'};
                padding: 16px;
                border-radius: 8px;
                overflow-x: auto;
                margin: 16px 0;
            }
            pre code {
                background: none;
                padding: 0;
                font-size: ${fontSize * 0.9}px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 16px 0;
            }
            th, td {
                border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#E8E8E8'};
                padding: 8px;
                text-align: left;
            }
            th {
                background: ${isDark ? '#333333' : '#f5f5f7'};
            }
        `;
        container.appendChild(style);
        container.appendChild(tempContent);
        
        // 计算内容总高度
        const totalHeight = tempContent.scrollHeight;
        const availableHeight = containerHeight - 70; // 减去头部高度
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
                padding: 20px;
                background: ${isDark ? '#1a1a1a' : 'white'};
                color: ${isDark ? '#e0e0e0' : '#333333'};
                font-size: ${fontSize}px;
                line-height: 1.8;
                height: ${containerHeight - 70}px;
                overflow: hidden;
            `;
            
            // 设置内容偏移
            const contentClone = tempContent.cloneNode(true);
            contentClone.style.marginTop = `-${i * availableHeight}px`;
            sectionContent.appendChild(contentClone);
            
            sectionContainer.appendChild(sectionContent);
            container.innerHTML = '';
            container.appendChild(sectionContainer);

            // 生成图片
            try {
                const canvas = await html2canvas(sectionContainer, {
                    scale: 2,
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
                            clonedContainer.style.opacity = '1';
                        }
                    }
                });

                const imageData = canvas.toDataURL('image/png');
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
    
    // 确保滚动行为
    imagePreview.style.overflowY = 'auto';
    imagePreview.style.webkitOverflowScrolling = 'touch';
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-content';
    previewContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px;
    `;
    
    // 创建并添加所有图片
    images.forEach((imageData, index) => {
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = `
            position: relative;
            width: 100%;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            background: ${isDarkMode() ? '#1a1a1a' : 'white'};
        `;
        
        const img = document.createElement('img');
        img.src = imageData;
        img.alt = `预览图片 ${index + 1}`;
        img.style.cssText = `
            width: 100%;
            height: auto;
            display: block;
            object-fit: contain;
        `;

        // 添加双击事件
        let lastClick = 0;
        const doubleClickDelay = 300; // 双击判定时间间隔
        
        img.addEventListener('click', (e) => {
            const currentTime = new Date().getTime();
            if (currentTime - lastClick < doubleClickDelay) {
                // 双击事件
                hideImagePreviewModal();
            }
            lastClick = currentTime;
            e.stopPropagation(); // 阻止事件冒泡
        });

        imageContainer.appendChild(img);
        
        // 添加页码标签
        const indexLabel = document.createElement('div');
        indexLabel.style.cssText = `
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            backdrop-filter: blur(4px);
            z-index: 2;
        `;
        indexLabel.textContent = `${index + 1}/${images.length}`;
        imageContainer.appendChild(indexLabel);
        
        previewContainer.appendChild(imageContainer);
    });
    
    imagePreview.appendChild(previewContainer);
    imagePreviewModal.style.display = 'block';
}

// 菜单切换
menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    aiMenu.classList.toggle('active');
});

// 点击其他区域关闭菜单
document.addEventListener('click', (e) => {
    if (!aiMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        aiMenu.classList.remove('active');
    }
});

// 添加测试函数
function testMarkdownToPlainText() {
    const testCases = [
        {
            name: '测试完整文档',
            input: `井英科技（上海井英科技有限公司）是一家专注于商业短视频创作与营销的科技公司，成立于2020年4月，总部位于上海闵行区。公司通过结合人工智能（AI）技术与SaaS平台，为广告主和创作者提供人机协同的短视频生产解决方案，旨在提升内容创作效率及营销效果。以下是其核心信息梳理：

---

### **1. 公司定位与核心业务** 
- **定位**：短视频营销解决方案供应商，致力于构建"人机协同创作"的标准化平台，覆盖从内容生产到营销变现的全链条服务。
- **核心产品**：
  - **元内容生态**：将短视频拆解为脚本、配音、场景等独立模块（"元内容"），供创作者自由组合生成新内容，提升标准化与效率。
  - **人机协同创作工具**：AI辅助完成视频制作环节（如脚本生成、数字人建模），创作者仅需专注创意构思，降低人工成本。
  - **内容价值预估工具**：通过数据反馈优化内容价值分配，保障创作者收益并提升广告主ROI（投资回报率）。`
        }
    ];

    let allTestsPassed = true;
    
    testCases.forEach((testCase, index) => {
        console.log(`\n运行测试 ${index + 1}: ${testCase.name}`);
        console.log('\n转换结果：\n');
        console.log(markdownToPlainText(testCase.input));
    });
    
    return allTestsPassed;
}