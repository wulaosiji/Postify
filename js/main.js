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

// 创建一个对象来存储所有模态框相关的元素
const modalElements = {
    singleImageModal: null,
    splitImageModal: null,
    singleImagePreview: null,
    splitImagePreview: null,
    copySingleImageBtn: null,
    saveSingleImageBtn: null,
    copySplitImageBtn: null,
    saveSplitImageBtn: null
};

// 创建模态框元素
modalElements.singleImageModal = document.createElement('div');
modalElements.singleImageModal.id = 'singleImageModal';
modalElements.singleImageModal.className = 'modal';
modalElements.singleImageModal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h3>预览 - 长图导出</h3>
            <div class="modal-actions">
                <button id="copySingleImageBtn" class="btn secondary">复制图片</button>
                <button id="saveSingleImageBtn" class="btn primary">保存图片</button>
            </div>
        </div>
        <div class="modal-body image-preview-body">
            <div id="singleImagePreview" class="image-preview"></div>
        </div>
    </div>
`;

modalElements.splitImageModal = document.createElement('div');
modalElements.splitImageModal.id = 'splitImageModal';
modalElements.splitImageModal.className = 'modal';
modalElements.splitImageModal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h3>预览 - 分屏切图</h3>
            <div class="modal-actions">
                <button id="copySplitImageBtn" class="btn secondary">复制图片</button>
                <button id="saveSplitImageBtn" class="btn primary">保存图片</button>
            </div>
        </div>
        <div class="modal-body image-preview-body">
            <div id="splitImagePreview" class="image-preview"></div>
        </div>
    </div>
`;

// 添加到 body
document.body.appendChild(modalElements.singleImageModal);
document.body.appendChild(modalElements.splitImageModal);

// 初始化模态框元素
function initializeModalElements() {
    // 获取所有模态框相关的元素
    modalElements.singleImagePreview = document.getElementById('singleImagePreview');
    modalElements.splitImagePreview = document.getElementById('splitImagePreview');
    modalElements.copySingleImageBtn = document.getElementById('copySingleImageBtn');
    modalElements.saveSingleImageBtn = document.getElementById('saveSingleImageBtn');
    modalElements.copySplitImageBtn = document.getElementById('copySplitImageBtn');
    modalElements.saveSplitImageBtn = document.getElementById('saveSplitImageBtn');

    // 为图片添加跨域支持
    const handleImageLoad = (img) => {
        img.crossOrigin = 'anonymous';
        img.setAttribute('data-original-src', img.src);
        // 如果是相对路径，添加完整域名
        if (img.src.startsWith('/')) {
            img.src = window.location.origin + img.src;
        }
        // 添加时间戳防止缓存
        img.src = img.src + (img.src.includes('?') ? '&' : '?') + 'timestamp=' + new Date().getTime();
    };

    // 处理所有图片元素
    document.querySelectorAll('img').forEach(handleImageLoad);

    // 添加错误处理
    const handleImageError = (img) => {
        console.error('图片加载失败:', img.src);
        showToast('图片加载失败，请检查网络连接');
    };

    // 为所有图片添加错误处理
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', () => handleImageError(img));
    });
}

// 在 DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeModalElements);

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
function updateButtonStates() {
    // 更新清空按钮状态
    const hasContent = markdownInput.value.trim() !== '' || questionInput.value.trim() !== '';
    clearBtn.disabled = !hasContent;
    clearBtn.classList.toggle('disabled', !hasContent);
    
    // 粘贴按钮始终启用
    pasteBtn.disabled = false;
    pasteBtn.classList.remove('disabled');
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
});

// 监听输入变化
markdownInput.addEventListener('input', () => {
    saveToHistory();
    saveToLocalStorage();
    updateButtonStates();
});

// 添加粘贴事件监听
markdownInput.addEventListener('paste', (e) => {
    // 保存当前状态到历史记录
    saveToHistory();
    
    // 更新后自动保存并更新预览
    setTimeout(() => {
        saveToLocalStorage();
        updatePreview();
        updateButtonStates();
        showToast('已粘贴内容');
    }, 0);
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

// 修改AI助手配置
const AI_ASSISTANTS = {
    postify: {
        name: 'Postify.cc',
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

// 在生成图片时获取 AI 助手信息的安全方法
function getAIAssistantInfo() {
    if (!AI_ASSISTANTS[currentAI]) {
        console.warn(`未找到 ${currentAI} 的配置信息，使用默认值`);
        return {
            name: 'Postify.cc',
            logo: 'assets/logos/postify.png'
        };
    }
    return AI_ASSISTANTS[currentAI];
}

// 处理图片加载错误
function handleLogoError(logoElement) {
    console.warn('Logo 加载失败，使用默认样式');
    logoElement.style.display = 'none';
    logoElement.parentElement.style.background = '#f5f5f7';
    logoElement.parentElement.textContent = 'AI';
}

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
    // 预处理：标准化换行符
    let text = markdown.replace(/\r\n/g, '\n');
    
    text = text
        // 处理标题，保留原有冒号
        .replace(/^#{1,6}\s+\*\*(.*?)\*\*[:：]?\s*$/gm, '$1')
        .replace(/^#{1,6}\s+(.*?)[:：]?\s*$/gm, '$1')
        
        // 处理强调语法
        .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除加粗
        .replace(/\*([^*]+)\*/g, '$1') // 移除斜体
        .replace(/`([^`]+)`/g, '$1') // 移除代码
        
        // 处理链接
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        
        // 处理有序列表（包括嵌套）
        .replace(/^(\s*)\d+\.\s+\*\*(.*?)\*\*\s*$/gm, (match, indent, content) => {
            const num = match.match(/\d+/)[0];
            return num + '.  ' + content;
        })
        .replace(/^(\s*)\d+\.\s+(.*?)$/gm, (match, indent, content) => {
            const num = match.match(/\d+/)[0];
            return num + '.  ' + content;
        })
        
        // 处理无序列表（包括嵌套）
        .replace(/^(\s*)[-*+]\s+(.*?)$/gm, (match, indent, content) => {
            return '•  ' + content;
        })
        
        // 处理缩进的非列表项
        .replace(/^(\s+)([^•\d].*?)$/gm, (match, indent, content) => {
            if (!content.trim()) return '';
            return content;
        })
        
        // 清理空白行和格式化段落
        .replace(/\n{2,}/g, '\n') // 先将所有多行变成单行
        .replace(/^\s+|\s+$/gm, '') // 清理每行首尾空白
        
        // 特殊处理冒号和标题
        .replace(/([^：])：(?!\n)/g, '$1：\n') // 确保冒号后有换行（但不处理已有换行的情况）
        .replace(/：\n\s*\n/g, '：\n') // 删除冒号后的多余空行
        .replace(/^(讨论.*?)：$/gm, '$1：') // 特殊处理"讨论"开头的标题
        
        // 处理列表项的格式和间距
        .replace(/^(\d+\.)\s*/gm, '$1  ') // 确保数字后有两个空格
        .replace(/^•\s*/gm, '•  ') // 确保圆点后有两个空格
        
        // 最终清理和格式化
        .replace(/^[\s\u200B]+|[\s\u200B]+$/g, '') // 清理整个文本的首尾空白
        .replace(/\n{3,}/g, '\n') // 先将多个空行压缩为单行
        
        // 处理特殊段落格式
        .replace(/讨论方向：\n+/g, '讨论方向：\n') // 确保"讨论方向："后只有一个换行
        .replace(/讨论背景：\n+/g, '讨论背景：\n') // 确保"讨论背景："后只有一个换行
        
        // 处理段落和列表的间距
        .replace(/([^：\n])\n([^1-5•\n])/g, '$1\n$2') // 调整非列表段落之间的换行
        .replace(/([^：\n])\n+([1-5]\.|•)/g, '$1\n$2') // 移除段落和列表之间的多余空行
        .replace(/(\d+\.  .*)\n(?=\d+\.)/g, '$1\n') // 确保有序列表项之间没有空行
        .replace(/(•  .*)\n(?=•)/g, '$1\n') // 确保无序列表项之间没有空行
        
        // 最后的格式微调
        .replace(/^(.+)：$/gm, '$1：') // 确保冒号结尾的行没有换行
        .replace(/：\n\n+/g, '：\n') // 确保冒号后没有多余空行
        .replace(/(\d+\.  .*)\n\n+(?=[^1-5•])/g, '$1\n') // 移除列表项后的多余空行
        .replace(/(•  .*)\n\n+(?=[^1-5•])/g, '$1\n') // 移除无序列表项后的多余空行
        .replace(/\n{2,}$/g, '\n'); // 清理文本末尾的多余换行

    return text;
}

// 测试用例
const testInput = `结合AIPPT、ChatDOC、ChatExcel和AirTable的特点和功能，可以构思以下讨论主题：

### **讨论主题：AI工具在办公自动化与效率提升中的应用与挑战**

#### **讨论背景：**
随着AI技术的快速发展，办公场景中的自动化和智能化工具不断涌现。AIPPT、ChatDOC、ChatExcel和AirTable等工具分别在演示制作、文档处理、数据分析和项目管理中展现了强大的功能。这些工具不仅提高了工作效率，还改变了传统办公的模式。

#### **讨论方向：**
1. **AI工具的功能与应用场景**
   - AIPPT、ChatDOC、ChatExcel和AirTable分别在哪些办公场景中表现出色？例如，ChatExcel通过自然语言交互帮助用户快速处理Excel表格。
   - 这些工具如何帮助企业和个人提升工作效率和创造力？

2. **AI工具的用户体验与易用性**
   - ChatDOC和ChatExcel等工具的操作方式简单易上手，用户无需复杂的学习过程即可快速上手。
   - 如何进一步优化这些工具的用户体验，使其更符合不同用户群体的需求？

3. **数据安全与隐私保护**
   - 在使用AI工具处理文档和数据时，数据安全和隐私保护是关键问题。例如，ChatDOC对用户数据进行加密存储，确保用户数据的安全。
   - 企业和个人在使用这些工具时，应如何确保数据的合规性和安全性？

4. **AI工具的局限性与挑战**
   - 尽管AI工具在效率提升方面表现出色，但生成的内容可能存在质量参差不齐的问题，例如缺乏深度或创新性。
   - 如何通过技术优化和人工干预，解决AI工具在内容质量和准确性方面的挑战？

5. **未来展望：AI工具的融合与创新**
   - 随着AI技术的不断发展，未来这些工具可能会实现更深度的融合。例如，将ChatExcel的数据分析功能与AIPPT的演示制作功能结合，为用户提供更全面的解决方案。
   - 企业和开发者如何通过技术创新，推动AI工具在更多场景中的应用？

通过以上讨论方向，可以深入探讨AI工具在办公自动化中的应用价值、用户体验、数据安全以及未来发展方向，为AI技术在办公场景中的进一步发展提供有价值的见解。`;

// 运行测试
console.log("转换结果：");
console.log("-------------------");
console.log(markdownToPlainText(testInput));

// 添加水印到内容
function addWatermark(container) {
    const watermark = document.createElement('div');
    watermark.className = 'watermark';
    watermark.innerHTML = `
        <img src="assets/logos/postify.png" alt="Postify">
        <span>Postify.cc - 超好用的AI助手对话分享工具</span>
    `;
    container.appendChild(watermark);
}

// 修改复制文本函数
async function copyText(text) {
    try {
        const watermark = '\n\nPostify.cc - 超好用的AI助手对话分享工具';
        let finalText = '';
        const question = questionInput.value.trim();
        
        if (question) {
            finalText = `问题：${question}\n回答：\n${text}${watermark}`;
        } else {
            finalText = text + watermark;
        }
        
        await navigator.clipboard.writeText(finalText);
        showToast('已复制到剪贴板');
        window.getSelection().removeAllRanges();
    } catch (err) {
        console.error('Copy failed:', err);
        showToast('复制失败，请重试');
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

// 修改临时容器创建函数
function createOffscreenContainer(width) {
    // 创建一个独立的离屏容器
    const offscreenContainer = document.createElement('div');
    const uniqueId = `temp-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 设置严格的样式隔离
    offscreenContainer.style.cssText = `
        position: fixed !important;
        left: -9999px !important;
        top: -9999px !important;
        width: ${width}px !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        overflow: hidden !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        z-index: -9999 !important;
        transform: translateZ(0) !important;
        contain: strict !important;
        isolation: isolate !important;
        display: block !important;
    `;

    // 创建实际的内容容器
    const container = document.createElement('div');
    container.id = uniqueId;
    container.style.cssText = `
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: auto !important;
        transform: none !important;
        contain: strict !important;
        isolation: isolate !important;
    `;
    
    offscreenContainer.appendChild(container);
    document.body.appendChild(offscreenContainer);

    return {
        container,
        cleanup: () => {
            if (document.body.contains(offscreenContainer)) {
                document.body.removeChild(offscreenContainer);
            }
        }
    };
}

// 修改清理临时容器函数
function cleanupTemporaryContainers() {
    // 清理所有临时容器
    const tempContainers = document.querySelectorAll('[id^="temp-container-"]');
    tempContainers.forEach(container => {
        const parentContainer = container.parentElement;
        if (parentContainer && document.body.contains(parentContainer)) {
            document.body.removeChild(parentContainer);
        }
    });
}

// 添加错误检查和日志记录函数
function logError(error, context) {
    console.error(`[${context}] 错误:`, error);
    console.error('错误堆栈:', error.stack);
    
    // 根据错误类型返回用户友好的错误消息
    let userMessage = '操作失败，请重试';
    
    if (error.message.includes('canvas')) {
        if (error.message.includes('tainted')) {
            userMessage = '图片加载失败，请检查图片来源是否支持跨域访问';
        } else {
            userMessage = '图片处理失败，请检查图片格式是否正确';
        }
    } else if (error.message.includes('split')) {
        userMessage = '分屏处理失败，请检查内容格式';
    } else if (error.message.includes('initialization')) {
        userMessage = '初始化失败，请刷新页面重试';
    }
    
    showToast(userMessage);
}

// 修改生成图片函数的错误处理
async function generateImage() {
    cleanupTemporaryContainers();
    let tempContainer = null;
    
    try {
        console.log('开始生成长图...');
        const markdown = markdownInput.value.trim();
        if (!markdown) {
            throw new Error('empty_content');
        }

        showToast('正在生成长图...');
        
        // 验证必要的元素是否存在
        if (!modalElements.singleImagePreview) {
            throw new Error('initialization_failed');
        }

        const containerWidth = 375;
        console.log('创建临时容器...');
        const { container, cleanup } = createOffscreenContainer(containerWidth);
        tempContainer = container;
        if (!tempContainer) {
            throw new Error('temp_container_failed');
        }

        // 记录关键步骤
        console.log('准备渲染内容...');
        const isDark = isDarkMode();
        const fontSize = 16;
        const contentPadding = 20;
        const headerHeight = 65;

        // 创建实际内容容器
        console.log('创建内容容器...');
        const contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = `
            width: 100%;
            background: ${isDark ? '#1a1a1a' : 'white'};
            border-radius: 16px;
            overflow: visible;
            opacity: 1;
            visibility: visible;
        `;
        tempContainer.appendChild(contentWrapper);

        // 添加基础样式
        const baseStyle = document.createElement('style');
        baseStyle.textContent = `
            h1, h2, h3, h4, h5, h6 { 
                margin: 16px 0 12px;
                font-weight: 600;
                line-height: 1.3;
                color: ${isDark ? '#e0e0e0' : '#333333'};
            }
            h1 { font-size: ${fontSize * 1.4}px; }
            h2 { font-size: ${fontSize * 1.3}px; }
            h3 { font-size: ${fontSize * 1.2}px; }
            h4, h5, h6 { font-size: ${fontSize * 1.1}px; }
            
            p { 
                margin: 8px 0;
                line-height: 1.6;
                text-align: justify;
                color: ${isDark ? '#e0e0e0' : '#333333'};
            }
            
            ul, ol { 
                padding-left: 1.5em;
                margin: 8px 0;
                color: ${isDark ? '#e0e0e0' : '#333333'};
            }
            
            li { 
                margin: 4px 0;
                line-height: 1.6;
            }
            
            li > ul, li > ol {
                margin: 4px 0;
            }
            
            pre {
                margin: 12px 0;
                padding: 12px;
                background: ${isDark ? '#2a2a2a' : '#f5f5f7'};
                border-radius: 8px;
                overflow-x: auto;
            }
            
            code {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                font-size: ${fontSize * 0.9}px;
                background: ${isDark ? '#333333' : '#f5f5f7'};
                padding: 2px 4px;
                border-radius: 4px;
                color: ${isDark ? '#e0e0e0' : '#333333'};
            }
            
            pre code {
                background: none;
                padding: 0;
            }
            
            blockquote {
                margin: 12px 0;
                padding: 0 12px;
                color: ${isDark ? '#a0a0a0' : '#666666'};
                border-left: 4px solid ${isDark ? '#404040' : '#e8e8e8'};
                font-style: italic;
            }
            
            img {
                max-width: 100%;
                border-radius: 8px;
                margin: 12px 0;
            }
            
            hr {
                border: none;
                height: 1px;
                background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e8e8e8'};
                margin: 16px 0;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 12px 0;
                font-size: ${fontSize}px;
                background: ${isDark ? '#2a2a2a' : '#f5f5f7'};
                border-radius: 8px;
                overflow: hidden;
            }
            
            th, td {
                padding: 8px 12px;
                text-align: left;
                border: 1px solid ${isDark ? '#404040' : '#e8e8e8'};
                color: ${isDark ? '#e0e0e0' : '#333333'};
            }
            
            th {
                background: ${isDark ? '#333333' : '#ecedf0'};
                font-weight: 600;
                white-space: nowrap;
            }
            
            tr:hover td {
                background: ${isDark ? '#333333' : '#ecedf0'};
            }
            
            *:first-child {
                margin-top: 0;
            }
            
            *:last-child {
                margin-bottom: ${contentPadding}px;
            }

            .question-text {
                text-indent: 0 !important;
            }
        `;
        contentWrapper.appendChild(baseStyle);

        // 创建头部
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            padding: 12px 16px;
            background: ${isDark ? '#1a1a1a' : 'white'};
            border-bottom: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#F5F5F5'};
            height: ${headerHeight}px;
            box-shadow: 0 1px 0 ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
        `;

        const logoWrapper = document.createElement('div');
        logoWrapper.style.cssText = `
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            flex-shrink: 0;
            border-radius: 8px;
            background: ${isDark ? '#2a2a2a' : '#f5f5f7'};
            overflow: hidden;
            box-sizing: border-box;
            padding: 4px;
        `;

        const logo = document.createElement('img');
        logo.src = getAIAssistantInfo().logo;
        logo.crossOrigin = 'anonymous';
        logo.onerror = () => handleLogoError(logo);
        logo.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
            border-radius: 4px;
        `;

        const title = document.createElement('span');
        title.textContent = getAIAssistantInfo().name;
        title.style.cssText = `
            font-size: 16px;
            font-weight: 500;
            color: ${isDark ? '#e0e0e0' : '#000000'};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 40px;
        `;

        logoWrapper.appendChild(logo);
        header.appendChild(logoWrapper);
        header.appendChild(title);
        contentWrapper.appendChild(header);

        // 创建内容区域
        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
            padding: ${contentPadding}px;
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
                font-size: 14px;
                color: ${isDark ? '#a0a0a0' : '#666666'};
                font-weight: 500;
            `;
            avatar.textContent = '我';

            const questionText = document.createElement('div');
            questionText.className = 'question-text';
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
            contentContainer.appendChild(questionDiv);

            const divider = document.createElement('div');
            divider.style.cssText = `
                width: 100%;
                height: 1px;
                background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#F5F5F5'};
                margin: 20px 0;
            `;
            contentContainer.appendChild(divider);
        }

        // 将Markdown转换为HTML并添加到内容容器
        const htmlContent = marked.parse(markdown);
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = htmlContent;
        contentDiv.style.cssText = `
            color: ${isDark ? '#e0e0e0' : '#333333'};
        `;
        contentContainer.appendChild(contentDiv);
        contentWrapper.appendChild(contentContainer);

        // 在内容容器最后添加水印
        addWatermark(contentContainer);

        // 等待内容渲染
        console.log('等待内容渲染...');
        await new Promise(resolve => setTimeout(resolve, 800));

        // 使用html2canvas生成图片
        console.log('开始生成图片...');
        const canvas = await html2canvas(contentWrapper, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            logging: true,
            onclone: function(clonedDoc) {
                console.log('克隆DOM完成');
                const clonedWrapper = clonedDoc.querySelector('div');
                if (!clonedWrapper) {
                    console.error('未找到克隆的容器元素');
                    return;
                }
                clonedWrapper.style.position = 'static';
                clonedWrapper.style.left = '0';
                clonedWrapper.style.top = '0';
                clonedWrapper.style.transform = 'none';
                clonedWrapper.style.visibility = 'visible';
                clonedWrapper.style.opacity = '1';
            }
        }).catch(err => {
            console.error('html2canvas生成失败:', err);
            throw new Error(`图片生成失败: ${err.message}`);
        });

        // 生成图片数据
        console.log('转换为图片数据...');
        const image = canvas.toDataURL('image/png');
        if (!image || image === 'data:,') {
            throw new Error('图片数据生成失败');
        }
        
        // 更新数据集
        console.log('更新预览数据...');
        imagePreview.dataset.imageData = image;
        imagePreview.dataset.isSplitView = 'false';
        
        // 显示预览
        console.log('显示预览...');
        showImagePreview(image);
        
    } catch (error) {
        let errorMessage = '生成失败';
        
        switch(error.message) {
            case 'empty_content':
                errorMessage = '没有可预览的内容';
                break;
            case 'initialization_failed':
                errorMessage = '初始化失败，请刷新页面重试';
                break;
            case 'temp_container_failed':
                errorMessage = '临时容器创建失败，请刷新页面重试';
                break;
            default:
                if (error.message.includes('tainted')) {
                    errorMessage = '图片加载失败，请检查图片来源';
                } else if (error.message.includes('canvas')) {
                    errorMessage = '图片处理失败，请检查内容格式';
                }
        }
        
        logError(error, 'generateImage');
        showToast(errorMessage);
        
    } finally {
        // 清理临时容器
        console.log('清理临时资源...');
        if (tempContainer && tempContainer.cleanup) {
            tempContainer.cleanup();
        }
        cleanupTemporaryContainers();
        
        // 确保主界面按钮恢复正常
        requestAnimationFrame(() => {
            cleanupTemporaryContainers();
        });
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

// 修改保存图片函数
function saveImage() {
    try {
        const imageData = imagePreview.dataset.imageData;
        if (!imageData) {
            showToast('未找到图片');
            return;
        }

        if (imagePreview.dataset.isSplitView === 'true') {
            try {
                const images = JSON.parse(imageData);
                if (!images || images.length === 0) {
                    showToast('未找到图片');
                    return;
                }
                
                // 创建一个隐藏的下载链接列表
                const downloadLinks = images.map((imgData, index) => {
                    const link = document.createElement('a');
                    link.download = `${currentAI}-export-${index + 1}.png`;
                    link.href = imgData;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    return link;
                });

                // 依次触发下载
                downloadLinks.forEach((link, index) => {
                    setTimeout(() => {
                        link.click();
                        document.body.removeChild(link);
                    }, index * 500); // 每500ms下载一张
                });

                showToast(`正在保存 ${images.length} 张图片`);
            } catch (err) {
                console.error('Save split images failed:', err);
                showToast('保存失败，请重试');
            }
        } else {
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
    
    // 清理所有临时容器
    cleanupTemporaryContainers();
    
    // 重置预览容器
    imagePreview.innerHTML = '';
    imagePreview.style = '';
    
    // 确保主界面按钮恢复正常
    requestAnimationFrame(() => {
        cleanupTemporaryContainers();
    });
}

// 安全地添加事件监听器的辅助函数
function safeAddEventListener(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(eventType, handler);
        console.log(`Successfully bound ${eventType} event to ${elementId}`);
    } else {
        console.warn(`Element ${elementId} not found, skipping ${eventType} event binding`);
    }
}

// 初始化所有事件监听器
function initializeEventListeners() {
    // 定义所有需要的事件绑定
    const eventBindings = [
        { id: 'copyTextBtn', event: 'click', handler: handleCopyText },
        { id: 'splitImageBtn', event: 'click', handler: handleSplitImage },
        { id: 'exportImageBtn', event: 'click', handler: handleExportImage },
        { id: 'copyFinalBtn', event: 'click', handler: handleCopyFinal }
    ];

    // 安全地绑定每个事件
    eventBindings.forEach(binding => {
        safeAddEventListener(binding.id, binding.event, binding.handler);
    });
}

// 等待 DOM 加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEventListeners);
} else {
    // 如果 DOM 已经加载完成，直接初始化
    initializeEventListeners();
}

// 修改原有的处理函数，添加安全检查
function handleCopyText(e) {
    e?.preventDefault();
    const input = document.getElementById('markdownInput');
    if (!input) {
        console.error('Markdown input element not found');
        showToast('无法找到输入框');
        return;
    }
    // ... 原有的复制逻辑
}

function handleSplitImage(e) {
    e?.preventDefault();
    const input = document.getElementById('markdownInput');
    if (!input) {
        console.error('Markdown input element not found');
        showToast('无法找到输入框');
        return;
    }
    // ... 原有的分屏逻辑
}

function handleExportImage(e) {
    e?.preventDefault();
    const input = document.getElementById('markdownInput');
    if (!input) {
        console.error('Markdown input element not found');
        showToast('无法找到输入框');
        return;
    }
    // ... 原有的导出逻辑
}

function handleCopyFinal(e) {
    e?.preventDefault();
    const preview = document.getElementById('previewText');
    if (!preview) {
        console.error('Preview text element not found');
        showToast('无法找到预览文本');
        return;
    }
    // ... 原有的复制逻辑
}

// 通用的 Toast 提示函数
function showToast(message, type = 'error') {
    console.log(`[Toast] ${type}: ${message}`);
    // 如果有专门的 toast 组件，在这里调用
    alert(message); // 临时使用 alert 作为替代
}

async function handleSplitImage() {
    cleanupTemporaryContainers(); // 确保开始前清理
    try {
        const markdownInput = document.getElementById('markdownInput');
        if (!markdownInput) {
            console.error('找不到输入框元素');
            return;
        }

        const markdown = markdownInput.value.trim();
        if (!markdown) {
            showToast('没有可预览的内容');
            return;
        }

        showToast('正在生成分屏图片...');
        
        // 添加日志
        console.log('开始创建临时容器');
        const { container, cleanup } = createOffscreenContainer(375);
        if (!container) {
            throw new Error('临时容器创建失败');
        }

        console.log('开始生成图片');
        const images = await generateSplitImages(container);
        if (!images || images.length === 0) {
            throw new Error('图片生成失败');
        }

        showSplitImagePreview(images);
    } catch (err) {
        console.error('Split image failed:', err);
        showToast('生成失败: ' + (err.message || '请重试'));
    } finally {
        cleanupTemporaryContainers();
    }
}

// 添加事件监听器
document.addEventListener('DOMContentLoaded', function() {
    const splitImageBtn = document.getElementById('splitImageBtn');
    if (splitImageBtn) {
        splitImageBtn.addEventListener('click', handleSplitImage);
    }
});

// 清空内容函数
function clearContent() {
    // 保存当前内容到历史记录
    lastContent = {
        question: questionInput.value,
        markdown: markdownInput.value
    };
    
    // 清空输入框
    questionInput.value = '';
    markdownInput.value = '';
    
    // 更新本地存储
    saveToLocalStorage();
    
    // 更新按钮状态
    updateButtonStates();
    
    // 添加已清空效果
    clearBtn.classList.add('cleared');
    setTimeout(() => {
        clearBtn.classList.remove('cleared');
    }, 1000);
    
    showToast('已清空内容');
}

// 保存到本地存储函数
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