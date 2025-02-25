const fs = require('fs');

// 读取测试文件
const markdown = fs.readFileSync('test.md', 'utf8');

// Markdown转纯文本函数
function markdownToPlainText(markdown) {
    if (!markdown) return '';
    
    // 预处理：标准化换行符
    let text = markdown.replace(/\r\n/g, '\n');
    
    // 移除所有Markdown语法标记
    text = text
        // 移除分隔线
        .replace(/^-{3,}$/gm, '')
        
        // 移除标题标记并保留内容
        .replace(/^###\s+\*\*(.*?)\*\*\s*$/gm, '$1')
        .replace(/^####\s+\*\*(.*?)\*\*[:：]\s*$/gm, '$1：')
        .replace(/^#{1,6}\s+(.*?)$/gm, '$1')
        
        // 处理加粗和斜体
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        
        // 处理代码块和链接
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        
        // 处理表格，转换为更直观的格式
        .replace(/\|(.*?)\|/g, function(match) {
            // 移除表格边框和空格
            let cells = match.split('|')
                .filter(cell => cell.trim())
                .map(cell => cell.trim());
            
            // 如果是表头分隔行（包含 -），则跳过
            if (cells.every(cell => /^[-:\s]+$/.test(cell))) {
                return '';
            }
            
            // 返回格式化后的行
            return cells.join('  |  ');
        })
        .replace(/^([^|\n]+)\s+\|\s+([^|\n]+)$/gm, '【$1】$2')  // 将表格行转换为更易读的格式
        
        // 处理列表（包括缩进）
        .replace(/^\s*[-*+]\s+[-*+]\s+(.*?)$/gm, '- $1')  // 二级列表
        .replace(/^\s{2,}[-*+]\s+(.*?)$/gm, '- $1')  // 处理缩进的列表项
        .replace(/^\s*[-*+]\s+(.*?)$/gm, '• $1')  // 一级列表
        .replace(/^\s*(\d+)\.\s+\*\*(.*?)\*\*\s*$/gm, '$1. $2')
        .replace(/^\s*(\d+)\.\s+(.*?)$/gm, '$1. $2')
        
        // 处理缩进
        .replace(/^(\s{2,})(.*?)$/gm, '$2')
        
        // 清理多余空白
        .replace(/\s+$/gm, '')
        .replace(/^\s+/gm, '')
        
        // 处理段落格式
        .replace(/\n{3,}/g, '\n\n')
        
        // 特殊处理冒号
        .replace(/([^：])(：)(?!\n)/g, '$1$2\n')
        .replace(/：\n\n/g, '：\n')
        
        // 处理列表项间距
        .replace(/^(\d+\.  .*)\n(?=\d+\.)/gm, '$1\n')
        .replace(/^(•  .*)\n(?=•)/gm, '$1\n')
        .replace(/^(-  .*)\n(?=-)/gm, '$1\n')
        
        // 最终清理
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // 添加水印
    text += '\n\nPostify.cc - 超好用的AI助手对话分享工具';

    return text;
}

// 转换并输出结果
console.log('转换结果：\n');
console.log(markdownToPlainText(markdown)); 