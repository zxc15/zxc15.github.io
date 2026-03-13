// main.js - 主程序，整合所有模块
import { computeSampleCovariance, renderCovarianceMatrices, computeTheoryCovariance, computeCorrelationMatrix } from './covariance.js';
import { toggleTable, toggleCovariance, toggleCorrelation } from './ui.js';
import { randomNormal } from './random.js';

// 获取DOM元素引用
const LInput = document.getElementById('L');
const thInput = document.getElementById('th');
const errInput = document.getElementById('err');
const sysErrInput = document.getElementById('sys_err');
const nInput = document.getElementById('n');
const mInput = document.getElementById('m');
const generateBtn = document.getElementById('generateBtn');
const toggleTableBtn = document.getElementById('toggleTableBtn');
const toggleCovarianceBtn = document.getElementById('toggleCovarianceBtn');
const toggleMatrixTypeBtn = document.getElementById('toggleMatrixTypeBtn');
const showCorrelationBtn = document.getElementById('showCorrelationBtn');
const toggleCorrelationBtn = document.getElementById('toggleCorrelationBtn');
const corrXInput = document.getElementById('corrX');
const corrYInput = document.getElementById('corrY');
const tableContainer = document.getElementById('table-container');
const covarianceContainer = document.getElementById('covariance-container');
const correlationContainer = document.getElementById('correlation-container');
const correlationCanvas = document.getElementById('correlationChart');
const correlationNote = document.getElementById('correlationNote');
const chiCanvasActual = document.getElementById('chiSquareChartActual');
const chiCanvasTheory = document.getElementById('chiSquareChartTheory');
const chiCanvasSimple = document.getElementById('chiSquareChartSimple');

// 全局存储当前数据矩阵和协方差矩阵
let currentDataMatrix = null;
let currentTh = null;
let currentErr = null;
let currentSysErr = null;
let currentM = null;
let currentCovActual = null;
let currentCovTheory = null;
let currentL = null;
let currentMatrixType = 'covariance'; // 'covariance' 或 'correlation'

// 生成系统误差随机数（正态分布，均值0，标准差sysErr）
function randomSysError(sysErr) {
    return sysErr * randomNormal();
}

// 计算每次测量的卡方值（使用实际协方差矩阵）
function computeChiSquaresActual(dataMatrix, th, covActual) {
    const n = dataMatrix[0].length;
    const L = dataMatrix.length;
    const chiSquares = [];

    const invCov = math.inv(covActual);

    for (let i = 0; i < n; i++) {
        const r = [];
        for (let j = 0; j < L; j++) {
            r.push(dataMatrix[j][i] - th);
        }

        let chi = 0;
        for (let j = 0; j < L; j++) {
            for (let k = 0; k < L; k++) {
                chi += r[j] * invCov[j][k] * r[k];
            }
        }
        chiSquares.push(chi / L);
    }
    return chiSquares;
}

// 计算每次测量的卡方值（使用理论协方差矩阵）
function computeChiSquaresTheory(dataMatrix, th, theoryCov) {
    const n = dataMatrix[0].length;
    const L = dataMatrix.length;
    const chiSquares = [];

    const invCov = math.inv(theoryCov);

    for (let i = 0; i < n; i++) {
        const r = [];
        for (let j = 0; j < L; j++) {
            r.push(dataMatrix[j][i] - th);
        }

        let chi = 0;
        for (let j = 0; j < L; j++) {
            for (let k = 0; k < L; k++) {
                chi += r[j] * invCov[j][k] * r[k];
            }
        }
        chiSquares.push(chi / L);
    }
    return chiSquares;
}

// 计算每次测量的简单卡方值：Σ(R_i²/σ_i²)/L
function computeChiSquaresSimple(dataMatrix, th, err, m) {
    const n = dataMatrix[0].length;
    const L = dataMatrix.length;
    const chiSquares = [];
    
    // 考虑平均次数 m 后的测量方差
    const variance = (err * err) / m;

    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < L; j++) {
            const r = dataMatrix[j][i] - th;
            sum += (r * r) / variance;
        }
        chiSquares.push(sum / L);
    }
    return chiSquares;
}

function drawHistogram(canvas, chiSquares, title) {
    if (!canvas) return;
    if (typeof echarts === 'undefined') {
        console.error('ECharts 未加载，请检查网络');
        return;
    }

    const binCount = 30;
    const min = Math.min(...chiSquares);
    const max = Math.max(...chiSquares);
    const binWidth = (max - min) / binCount || 1;
    const bins = Array(binCount).fill(0);
    const binRanges = [];

    for (let i = 0; i < binCount; i++) {
        const start = min + i * binWidth;
        const end = start + binWidth;
        binRanges.push(`${start.toFixed(2)}~${end.toFixed(2)}`);
    }

    chiSquares.forEach(value => {
        let index = Math.floor((value - min) / binWidth);
        if (index === binCount) index = binCount - 1;
        bins[index]++;
    });

    // 计算平均卡方值
    const meanChi = chiSquares.reduce((a, b) => a + b, 0) / chiSquares.length;

    let myChart = echarts.getInstanceByDom(canvas);
    if (!myChart) {
        myChart = echarts.init(canvas);
    }

    const option = {
        title: { 
            text: `${title}\n平均卡方值: ${meanChi.toFixed(4)}`, 
            left: 'center',
            textStyle: {
                fontSize: 14
            }
        },
        tooltip: {},
        xAxis: {
            type: 'category',
            data: binRanges,
            name: '平均卡方值区间',
            axisLabel: { rotate: 30 }
        },
        yAxis: {
            type: 'value',
            name: '频数',
            min: 0
        },
        series: [{
            name: '频数',
            type: 'bar',
            data: bins,
            itemStyle: {
                color: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }
        }]
    };

    myChart.setOption(option);
}
// 绘制关联散点图
function drawCorrelationChart(dataMatrix, xIndex, yIndex, th) {
    if (!correlationCanvas) return;
    if (typeof echarts === 'undefined') {
        console.error('ECharts 未加载，请检查网络');
        return;
    }

    // 检查输入的物体编号是否有效
    const L = dataMatrix.length;
    if (xIndex < 1 || xIndex > L || yIndex < 1 || yIndex > L) {
        correlationNote.textContent = `错误：物体编号必须在 1 到 ${L} 之间`;
        return;
    }

    const n = dataMatrix[0].length;
    const points = [];
    
    // 收集数据点
    for (let i = 0; i < n; i++) {
        points.push([
            dataMatrix[xIndex - 1][i],
            dataMatrix[yIndex - 1][i]
        ]);
    }

    // 计算相关系数
    const xData = dataMatrix[xIndex - 1];
    const yData = dataMatrix[yIndex - 1];
    const xMean = xData.reduce((a, b) => a + b, 0) / n;
    const yMean = yData.reduce((a, b) => a + b, 0) / n;
    
    let cov = 0, xVar = 0, yVar = 0;
    for (let i = 0; i < n; i++) {
        const xDiff = xData[i] - xMean;
        const yDiff = yData[i] - yMean;
        cov += xDiff * yDiff;
        xVar += xDiff * xDiff;
        yVar += yDiff * yDiff;
    }
    const correlation = cov / Math.sqrt(xVar * yVar);

    // 计算数据范围，确保横纵坐标轴范围一致
    const allData = [...xData, ...yData];
    const minValue = Math.min(...allData);
    const maxValue = Math.max(...allData);
    // 稍微扩展一点范围，让点不至于贴在边缘
    const padding = (maxValue - minValue) * 0.05;
    const axisMin = minValue - padding;
    const axisMax = maxValue + padding;

    let myChart = echarts.getInstanceByDom(correlationCanvas);
    if (!myChart) {
        myChart = echarts.init(correlationCanvas);
    }

    const option = {
        title: {
            text: `物体${xIndex} vs 物体${yIndex} (相关系数: ${correlation.toFixed(4)})`,
            left: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: '物体X: {c[0]}<br/>物体Y: {c[1]}'
        },
        xAxis: {
            type: 'value',
            name: `物体${xIndex} 测量值`,
            nameLocation: 'middle',
            nameGap: 25,
            axisLabel: { 
                rotate: 30 
            },
            min: axisMin,
            max: axisMax
        },
        yAxis: {
            type: 'value',
            name: `物体${yIndex} 测量值`,
            nameLocation: 'middle',
            nameGap: 35,
            min: axisMin,
            max: axisMax
        },
        series: [
            {
                name: '测量点',
                type: 'scatter',
                data: points,
                symbolSize: 5,
                itemStyle: {
                    color: 'rgba(54, 162, 235, 0.7)'
                }
            },
            {
                name: '中心值',
                type: 'scatter',
                data: [[th, th]],
                symbolSize: 8,  // 稍微调大一点更明显
                symbol: 'circle',
                itemStyle: {
                    color: 'red',
                    borderColor: 'darkred',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '中心值',
                    color: 'red',
                    fontSize: 12,
                    fontWeight: 'bold'
                }
            },
            {
                name: '均值点',
                type: 'scatter',
                data: [[xMean, yMean]],
                symbolSize: 8,  // 稍微调大一点更明显
                symbol: 'diamond',
                itemStyle: {
                    color: 'green',
                    borderColor: 'darkgreen',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    position: 'bottom',
                    formatter: '均值',
                    color: 'green',
                    fontSize: 12,
                    fontWeight: 'bold'
                }
            }
        ],
        grid: {
            left: '12%',    // 稍微增加左边距，给y轴名称留空间
            right: '8%',
            bottom: '15%',
            top: '15%',
            containLabel: false,  // 改为false，让绘图区域真正受left/right控制
            backgroundColor: '#f8f8f8'  // 可选：添加背景色更容易看到网格区域
        },
        // 添加这个配置确保坐标轴比例一致
        dataZoom: [
            {
                type: 'inside',
                xAxisIndex: 0,
                yAxisIndex: 0
            }
        ],
        // 强制横纵坐标轴比例一致的关键配置
        aspect: 1  // ECharts 5.0+ 支持，设置纵横比
    };

    myChart.setOption(option);
    
    // 如果上面的 aspect 不生效，可以尝试下面的方法：
    // 获取容器尺寸并强制重绘
    setTimeout(() => {
        const container = correlationCanvas;
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        if (width && height) {
            myChart.resize({
                width: width,
                height: width  // 强制高度等于宽度，确保正方形
            });
        }
    }, 100);
    
    // 更新提示信息
    correlationNote.textContent = `物体${xIndex} vs 物体${yIndex} 散点图 (共 ${n} 个测量点)`;
}

// 切换矩阵显示类型（协方差/关联系数）
function toggleMatrixType() {
    if (!currentCovActual || !currentCovTheory) {
        alert('请先点击“生成模拟数据”生成数据。');
        return;
    }

    if (currentMatrixType === 'covariance') {
        currentMatrixType = 'correlation';
        toggleMatrixTypeBtn.textContent = '切换到协方差矩阵';
        
        // 计算关联系数矩阵
        const corrActual = computeCorrelationMatrix(currentCovActual);
        const corrTheory = computeCorrelationMatrix(currentCovTheory);
        
        // 渲染关联系数矩阵
        renderCorrelationMatrices(covarianceContainer, currentTh, currentErr, currentSysErr, currentM, corrActual, corrTheory, currentL);
    } else {
        currentMatrixType = 'covariance';
        toggleMatrixTypeBtn.textContent = '切换到关联系数矩阵';
        
        // 重新渲染协方差矩阵
        renderCovarianceMatrices(covarianceContainer, currentTh, currentErr, currentSysErr, currentM, currentCovActual, currentL);
    }
}

// 渲染关联系数矩阵
function renderCorrelationMatrices(container, th, err, sysErr, m, corrActual, corrTheory, L) {
    // 理论关联系数矩阵
    let theoryHtml = `
        <div class="covariance-matrix">
            <h3>📊 理论关联系数矩阵 (基于输入)</h3>
            <table>
                <thead><tr><th></th>${Array(L).fill().map((_, i) => `<th>物体${i+1}</th>`).join('')}</tr></thead>
                <tbody>
    `;
    
    for (let i = 0; i < L; i++) {
        theoryHtml += `<tr><th>物体${i+1}</th>`;
        for (let j = 0; j < L; j++) {
            theoryHtml += `<td>${corrTheory[i][j].toFixed(6)}</td>`;
        }
        theoryHtml += '</tr>';
    }
    theoryHtml += '</tbody></table></div>';

    // 实际关联系数矩阵
    let actualHtml = `
        <div class="covariance-matrix">
            <h3>🔍 实际关联系数矩阵 (由数据计算)</h3>
            <table>
                <thead><tr><th></th>${Array(L).fill().map((_, i) => `<th>物体${i+1}</th>`).join('')}</tr></thead>
                <tbody>
    `;
    for (let i = 0; i < L; i++) {
        actualHtml += `<tr><th>物体${i+1}</th>`;
        for (let j = 0; j < L; j++) {
            actualHtml += `<td>${corrActual[i][j].toFixed(6)}</td>`;
        }
        actualHtml += '</tr>';
    }
    actualHtml += '</tbody></table></div>';

    const n = document.getElementById('n').value;
    const formulaHtml = `
        <div class="formula">
            <h3>📐 计算公式</h3>
            <p><strong>关联系数</strong>：<code>ρᵢⱼ = Vᵢⱼ / √(Vᵢᵢ·Vⱼⱼ)</code></p>
            <p>其中 V 为协方差矩阵，ρ 的取值范围为 [-1, 1]</p>
            <p><strong>理论协方差</strong> (含系统误差)：<code>Σᵢⱼ = δᵢⱼ · (σ²/m) · (1 + σ_s²) + σ_s² · μ²</code></p>
            <p>当前参数：μ = ${th.toFixed(3)}, σ = ${err.toFixed(3)}, σ_s = ${sysErr.toFixed(3)}, m = ${m}, n = ${n}, L = ${L}</p>
        </div>
    `;

    container.innerHTML = `
        <div class="covariance-matrices">${theoryHtml}${actualHtml}</div>
        ${formulaHtml}
    `;
}

// 计算一列数据的样本标准差（无偏估计，除以 n-1）
function sampleStd(arr) {
    const n = arr.length;
    if (n < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / n;
    const sqDiff = arr.reduce((acc, val) => acc + (val - mean) ** 2, 0);
    return Math.sqrt(sqDiff / (n - 1));
}

function generateData() {
    // 读取输入
    const L = parseInt(LInput.value, 10);
    const th = parseFloat(thInput.value);
    const err = parseFloat(errInput.value);
    const sysErrPercent = parseFloat(sysErrInput.value);
    const sysErr = sysErrPercent / 100;  // 转换为实际小数值
    const n = parseInt(nInput.value, 10);
    const m = parseInt(mInput.value, 10);

    if (isNaN(L) || L < 1 || isNaN(th) || isNaN(err) || isNaN(sysErrPercent) || isNaN(n) || n < 1 || isNaN(m) || m < 1) {
        alert('请输入有效的数字，且物体数量、测量次数和平均次数至少为1。');
        return;
    }

    // 生成原始数据：dataMatrix[j][i] 表示第 j 个物体第 i 次测量值
    const dataMatrix = [];
    for (let j = 0; j < L; j++) {
        const data = [];
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let k = 0; k < m; k++) {
                sum += th + err * randomNormal();
            }
            data.push(sum / m);
        }
        dataMatrix.push(data);
    }

    // 应用系统误差：exnew_i = ex_i + sigma_i * ex_i
    for (let i = 0; i < n; i++) {
        const sigma = randomSysError(sysErr);
        for (let j = 0; j < L; j++) {
            dataMatrix[j][i] = dataMatrix[j][i] + sigma * dataMatrix[j][i];
        }
    }

    // 保存数据供关联图和矩阵切换使用
    currentDataMatrix = dataMatrix;
    currentTh = th;
    currentErr = err;
    currentSysErr = sysErr;
    currentM = m;
    currentL = L;

    // --- 构建表格（只显示测量值）---
    let tableRows = '';
    for (let i = 0; i < n; i++) {
        let row = `<tr><td>${i + 1}</td>`;
        for (let j = 0; j < L; j++) {
            const val = dataMatrix[j][i];
            row += `<td>${val.toFixed(3)}</td>`;
        }
        row += '</tr>';
        tableRows += row;
    }

    // 添加标准差行
    let stdRow = '<tr class="std-row"><td>标准差</td>';
    for (let j = 0; j < L; j++) {
        const std = sampleStd(dataMatrix[j]);
        stdRow += `<td>${std.toFixed(3)}</td>`;
    }
    stdRow += '</tr>';
    tableRows += stdRow;

    // 构建表头（每个物体只有一列）
    let headerCols = '';
    for (let j = 0; j < L; j++) {
        headerCols += `<th>物体${j + 1}</th>`;
    }

    let tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>测量次数</th>
                    ${headerCols}
                </tr>
            </thead>
            <tbody>${tableRows}</tbody>
        </table>
    `;

    tableContainer.innerHTML = tableHtml;

    // 计算实际协方差矩阵 (L x L)
    currentCovActual = computeSampleCovariance(dataMatrix, n);
    
    // 计算理论协方差矩阵
    currentCovTheory = computeTheoryCovariance(th, err, sysErr, m, L);

    // 重置矩阵类型为协方差
    currentMatrixType = 'covariance';
    toggleMatrixTypeBtn.textContent = '切换到关联系数矩阵';

    // 渲染协方差矩阵
    renderCovarianceMatrices(covarianceContainer, th, err, sysErr, m, currentCovActual, L);

    // 计算三种卡方值并绘制直方图
    const chiSquaresActual = computeChiSquaresActual(dataMatrix, th, currentCovActual);
    const chiSquaresTheory = computeChiSquaresTheory(dataMatrix, th, currentCovTheory);
    const chiSquaresSimple = computeChiSquaresSimple(dataMatrix, th, err, m);
    
    drawHistogram(chiCanvasActual, chiSquaresActual, '使用实际协方差矩阵');
    drawHistogram(chiCanvasTheory, chiSquaresTheory, '使用理论协方差矩阵');
    drawHistogram(chiCanvasSimple, chiSquaresSimple, '使用独立测量误差');

    // 重置表格隐藏状态
    tableContainer.style.display = 'none';
    toggleTableBtn.textContent = '📊 显示测量数据表格';

    // 重置协方差矩阵隐藏状态
    covarianceContainer.style.display = 'none';
    toggleCovarianceBtn.textContent = '🔍 显示矩阵';
    
    // 重置关联图隐藏状态
    correlationContainer.style.display = 'none';
    toggleCorrelationBtn.textContent = '📊 显示关联图';
}

// 显示关联散点图
function showCorrelation() {
    if (!currentDataMatrix) {
        alert('请先点击“生成模拟数据”生成数据。');
        return;
    }
    
    const xIndex = parseInt(corrXInput.value, 10);
    const yIndex = parseInt(corrYInput.value, 10);
    
    drawCorrelationChart(currentDataMatrix, xIndex, yIndex, currentTh);
    
    // 如果关联图是隐藏的，自动显示
    if (correlationContainer.style.display === 'none') {
        correlationContainer.style.display = 'block';
        toggleCorrelationBtn.textContent = '📊 隐藏关联图';
    }
}

// 绑定事件
generateBtn.addEventListener('click', generateData);
toggleTableBtn.addEventListener('click', () => toggleTable(tableContainer, toggleTableBtn));
toggleCovarianceBtn.addEventListener('click', () => toggleCovariance(covarianceContainer, toggleCovarianceBtn));
toggleMatrixTypeBtn.addEventListener('click', toggleMatrixType);
showCorrelationBtn.addEventListener('click', showCorrelation);
toggleCorrelationBtn.addEventListener('click', () => toggleCorrelation(correlationContainer, toggleCorrelationBtn));

window.addEventListener('load', generateData);