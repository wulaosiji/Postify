const testMarkdown = `井英科技（上海井英科技有限公司）是一家专注于商业短视频创作与营销的科技公司，成立于2020年4月，总部位于上海闵行区。公司通过结合人工智能（AI）技术与SaaS平台，为广告主和创作者提供人机协同的短视频生产解决方案，旨在提升内容创作效率及营销效果。以下是其核心信息梳理：

---

### **1. 公司定位与核心业务** 
- **定位**：短视频营销解决方案供应商，致力于构建"人机协同创作"的标准化平台，覆盖从内容生产到营销变现的全链条服务。
- **核心产品**：
  - **元内容生态**：将短视频拆解为脚本、配音、场景等独立模块（"元内容"），供创作者自由组合生成新内容，提升标准化与效率。
  - **人机协同创作工具**：AI辅助完成视频制作环节（如脚本生成、数字人建模），创作者仅需专注创意构思，降低人工成本。
  - **内容价值预估工具**：通过数据反馈优化内容价值分配，保障创作者收益并提升广告主ROI（投资回报率）。`;

function markdownToPlainText(markdown) {
    if (!markdown) return '';
    
    // 预处理：标准化换行符
    let text = markdown.replace(/\r\n/g, '\n');
    
    // 1. 移除分隔线
    text = text.replace(/^---+$\n?/gm, '');
    
    // 2. 处理标题
    text = text
        // 处理带编号的标题：### **1. xxx**
        .replace(/^#{1,6}\s+\*\*(\d+\.\s*)(.*?)\*\*\s*$/gm, '$1$2')
        // 处理普通加粗标题：### **xxx**
        .replace(/^#{1,6}\s+\*\*(.*?)\*\*\s*$/gm, '$1')
        // 处理普通标题：### xxx
        .replace(/^#{1,6}\s+(.*?)$/gm, '$1');
    
    // 3. 按行处理文本
    let lines = text.split('\n');
    let processedLines = [];
    let prevLineType = 'text'; // text, list1, list2, title
    let prevLineContent = '';
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmedLine = line.trim();
        
        // 跳过空行
        if (!trimmedLine) {
            // 在段落之间添加空行
            if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
                processedLines.push('');
            }
            inList = false;
            continue;
        }
        
        // 检测标题
        if (trimmedLine.match(/^\d+\.\s+/)) {
            // 确保标题前有空行
            if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
                processedLines.push('');
            }
            processedLines.push(trimmedLine);
            prevLineType = 'title';
            prevLineContent = trimmedLine;
            inList = false;
            continue;
        }
        
        // 检测列表项
        if (trimmedLine.match(/^[-*]\s/)) {
            let indentLevel = line.match(/^\s*/)[0].length;
            let content = trimmedLine.replace(/^[-*]\s+/, '').trim();
            
            // 移除内部的 markdown 格式
            content = content
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\*(.*?)\*/g, '$1')
                .replace(/`([^`]+)`/g, '$1');
            
            // 根据缩进确定列表级别
            if (indentLevel >= 2) {
                // 如果上一行是一级列表项且以冒号结尾，添加换行
                if (prevLineType === 'list1' && prevLineContent.endsWith('：')) {
                    processedLines.push('');
                }
                processedLines.push(`- ${content}`);
                prevLineType = 'list2';
            } else {
                // 如果不在列表中或上一行不是一级列表项，添加空行
                if ((!inList || prevLineType !== 'list1') && 
                    processedLines.length > 0 && 
                    processedLines[processedLines.length - 1] !== '') {
                    processedLines.push('');
                }
                processedLines.push(`• ${content}`);
                prevLineType = 'list1';
                inList = true;
            }
            prevLineContent = content;
            continue;
        }
        
        // 处理表格
        if (trimmedLine.startsWith('|')) {
            // 跳过分隔行
            if (trimmedLine.match(/^\|[-:\s|]+\|$/)) {
                continue;
            }
            
            // 提取表格内容
            let cells = trimmedLine
                .split('|')
                .filter(cell => cell.trim())
                .map(cell => cell.trim());
            
            if (cells.length >= 2) {
                processedLines.push(`【${cells[0]}】${cells[1]}`);
                prevLineType = 'table';
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
        
        // 如果不是紧跟在列表后面，且上一行不是空行，添加空行
        if (prevLineType !== 'list2' && 
            processedLines.length > 0 && 
            processedLines[processedLines.length - 1] !== '') {
            processedLines.push('');
        }
        
        processedLines.push(processedLine);
        prevLineType = 'text';
        prevLineContent = processedLine;
        inList = false;
    }
    
    // 4. 最终处理
    text = processedLines.join('\n')
        // 移除连续的空行
        .replace(/\n{3,}/g, '\n\n')
        // 确保冒号后有换行
        .replace(/([^：])(：)(?!\n)/g, '$1$2\n')
        .trim();
    
    // 5. 添加水印
    text += '\n\nPostify.cc - 超好用的AI助手对话分享工具';
    
    return text;
}

// 运行测试
console.log('转换结果：\n');
console.log(markdownToPlainText(testMarkdown)); 