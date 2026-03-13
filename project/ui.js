// ui.js - UI控制功能

// 表格显示切换
export function toggleTable(container, button) {
    if (!container.innerHTML.trim() || container.innerHTML.indexOf('table') === -1) {
        alert('请先点击“生成模拟数据”生成数据表格。');
        return;
    }
    if (container.style.display === 'none') {
        container.style.display = 'block';
        button.textContent = '📊 隐藏测量数据表格';
    } else {
        container.style.display = 'none';
        button.textContent = '📊 显示测量数据表格';
    }
}

// 协方差矩阵显示切换
export function toggleCovariance(container, button) {
    if (!container.innerHTML.trim()) {
        alert('请先点击“生成模拟数据”生成协方差矩阵。');
        return;
    }
    if (container.style.display === 'none') {
        container.style.display = 'block';
        button.textContent = '🔍 隐藏协方差矩阵';
    } else {
        container.style.display = 'none';
        button.textContent = '🔍 显示协方差矩阵';
    }
}

// 关联图显示切换
export function toggleCorrelation(container, button) {
    if (!container.innerHTML.trim()) {
        alert('请先点击“显示关联散点图”生成图形。');
        return;
    }
    if (container.style.display === 'none') {
        container.style.display = 'block';
        button.textContent = '📊 隐藏关联图';
    } else {
        container.style.display = 'none';
        button.textContent = '📊 显示关联图';
    }
}