// covariance.js - 协方差计算与矩阵渲染

// 计算样本协方差矩阵 (L x L)
export function computeSampleCovariance(dataMatrix, n) {
    const L = dataMatrix.length;
    // 计算每个物体的均值
    const means = [];
    for (let j = 0; j < L; j++) {
        means.push(dataMatrix[j].reduce((a, b) => a + b, 0) / n);
    }

    // 初始化协方差矩阵
    let cov = Array(L).fill().map(() => Array(L).fill(0));

    for (let k = 0; k < n; k++) {
        const dev = [];
        for (let j = 0; j < L; j++) {
            dev.push(dataMatrix[j][k] - means[j]);
        }
        for (let i = 0; i < L; i++) {
            for (let j = 0; j < L; j++) {
                cov[i][j] += dev[i] * dev[j];
            }
        }
    }

    // 除以 n
    for (let i = 0; i < L; i++) {
        for (let j = 0; j < L; j++) {
            cov[i][j] /= n;
        }
    }
    return cov;
}

// 计算理论协方差矩阵
export function computeTheoryCovariance(th, err, sysErr, m, L) {
    const errVar = (err * err) / m;
    const sysErrVar = sysErr * sysErr;
    const thSq = th * th;
    
    let cov = Array(L).fill().map(() => Array(L).fill(0));
    
    for (let i = 0; i < L; i++) {
        for (let j = 0; j < L; j++) {
            const delta = (i === j) ? 1 : 0;
            cov[i][j] = delta * errVar * (1 + sysErrVar) + sysErrVar * thSq;
        }
    }
    return cov;
}

// 从协方差矩阵计算关联系数矩阵
export function computeCorrelationMatrix(cov) {
    const L = cov.length;
    let corr = Array(L).fill().map(() => Array(L).fill(0));
    
    for (let i = 0; i < L; i++) {
        for (let j = 0; j < L; j++) {
            const stdI = Math.sqrt(cov[i][i]);
            const stdJ = Math.sqrt(cov[j][j]);
            if (stdI > 0 && stdJ > 0) {
                corr[i][j] = cov[i][j] / (stdI * stdJ);
            } else {
                corr[i][j] = 0;
            }
        }
    }
    return corr;
}

// 渲染协方差矩阵
export function renderCovarianceMatrices(container, th, err, sysErr, m, covActual, L) {
    // 理论协方差矩阵
    const errVar = (err * err) / m;
    const sysErrVar = sysErr * sysErr;
    const thSq = th * th;
    
    let theoryHtml = `
        <div class="covariance-matrix">
            <h3>📊 理论协方差 Σ (基于输入)</h3>
            <table>
                <thead><tr><th></th>${Array(L).fill().map((_, i) => `<th>物体${i+1}</th>`).join('')}</tr></thead>
                <tbody>
    `;
    
    for (let i = 0; i < L; i++) {
        theoryHtml += `<tr><th>物体${i+1}</th>`;
        for (let j = 0; j < L; j++) {
            const delta = (i === j) ? 1 : 0;
            const theoryCov = delta * errVar * (1 + sysErrVar) + sysErrVar * thSq;
            theoryHtml += `<td>${theoryCov.toFixed(6)}</td>`;
        }
        theoryHtml += '</tr>';
    }
    theoryHtml += '</tbody></table></div>';

    // 实际协方差矩阵
    let actualHtml = `
        <div class="covariance-matrix">
            <h3>🔍 实际样本协方差 (由数据计算)</h3>
            <table>
                <thead><tr><th></th>${Array(L).fill().map((_, i) => `<th>物体${i+1}</th>`).join('')}</tr></thead>
                <tbody>
    `;
    for (let i = 0; i < L; i++) {
        actualHtml += `<tr><th>物体${i+1}</th>`;
        for (let j = 0; j < L; j++) {
            actualHtml += `<td>${covActual[i][j].toFixed(6)}</td>`;
        }
        actualHtml += '</tr>';
    }
    actualHtml += '</tbody></table></div>';

    const n = document.getElementById('n').value;
    const formulaHtml = `
        <div class="formula">
            <h3>📐 计算公式</h3>
            <p><strong>理论协方差</strong> (含系统误差)：<code>Σᵢⱼ = δᵢⱼ · (σ²/m) · (1 + σ_s²) + σ_s² · μ²</code></p>
            <p>其中 σ 为测量误差，σ_s 为系统误差标准差，μ 为理论值，m 为平均次数</p>
            <p><strong>实际协方差</strong> (基于生成数据)：cov(x,y) = ⟨xy⟩ − ⟨x⟩⟨y⟩ (有偏估计，除 n)</p>
            <p>当前参数：μ = ${th.toFixed(3)}, σ = ${err.toFixed(3)}, σ_s = ${sysErr.toFixed(3)}, m = ${m}, n = ${n}, L = ${L}</p>
        </div>
    `;

    container.innerHTML = `
        <div class="covariance-matrices">${theoryHtml}${actualHtml}</div>
        ${formulaHtml}
    `;
}