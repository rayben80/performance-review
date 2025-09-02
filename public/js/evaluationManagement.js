// 평가 시스템 관리 모듈
console.log('📋 평가 시스템 모듈 로드');

// ==================== 평가 시스템 전역 변수 ====================
let currentEvaluationTab = 'dashboard';
let quantitativeItems = {};
let qualitativeItems = {};
let evaluationTargets = {};

// ==================== 평가 시스템 초기화 ====================
function initializeEvaluationManagement() {
    console.log('🎯 평가 시스템 초기화');
    
    // 평가 탭 이벤트 리스너 등록
    initializeEvaluationTabListeners();
    
    // 기본 데이터 로드
    loadEvaluationSettings();
    
    // 기본 탭 표시
    switchEvaluationTab('dashboard');
}

function initializeEvaluationTabListeners() {
    const tabButtons = [
        { id: 'tab-dashboard', tab: 'dashboard' },
        { id: 'tab-items', tab: 'items' },
        { id: 'tab-assignment', tab: 'assignment' },
        { id: 'tab-preview', tab: 'preview' }
    ];
    
    tabButtons.forEach(({ id, tab }) => {
        const button = document.getElementById(id);
        if (button) {
            button.removeAttribute('onclick');
            button.addEventListener('click', function(e) {
                e.preventDefault();
                switchEvaluationTab(tab);
            });
        }
    });
    
    // 평가 마법사 버튼들
    const wizardButtons = document.querySelectorAll('button[onclick*="startEvaluationWizard"]');
    wizardButtons.forEach(button => {
        const type = button.getAttribute('onclick').match(/'(\w+)'/)[1];
        button.removeAttribute('onclick');
        button.addEventListener('click', function(e) {
            e.preventDefault();
            startEvaluationWizard(type);
        });
    });
    
    // 빠른 추가 버튼들
    const quickAddButtons = [
        { selector: 'button[onclick*="quickAddQuantitativeItem"]', handler: quickAddQuantitativeItem },
        { selector: 'button[onclick*="quickAddQualitativeItem"]', handler: quickAddQualitativeItem }
    ];
    
    quickAddButtons.forEach(({ selector, handler }) => {
        const button = document.querySelector(selector);
        if (button) {
            button.removeAttribute('onclick');
            button.addEventListener('click', function(e) {
                e.preventDefault();
                handler();
            });
        }
    });
    
    // Sales 목표 버튼
    const salesTargetBtn = document.querySelector('button[onclick*="loadSalesTargets"]');
    if (salesTargetBtn) {
        salesTargetBtn.removeAttribute('onclick');
        salesTargetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loadSalesTargets();
        });
    }
    
    // 시뮬레이션 버튼
    const previewBtn = document.querySelector('button[onclick*="runEvaluationPreview"]');
    if (previewBtn) {
        previewBtn.removeAttribute('onclick');
        previewBtn.addEventListener('click', function(e) {
            e.preventDefault();
            runEvaluationPreview();
        });
    }
}

// ==================== 평가 탭 전환 ====================
function switchEvaluationTab(tab) {
    console.log('📋 평가 탭 전환:', tab);
    currentEvaluationTab = tab;
    
    // 모든 평가 탭 컨텐츠 숨기기
    const allContents = document.querySelectorAll('.evaluation-tab-content');
    allContents.forEach(content => {
        content.classList.add('hidden');
    });
    
    // 모든 평가 탭 버튼 비활성화
    const allButtons = document.querySelectorAll('#evaluationSettings .flex.border-b button');
    allButtons.forEach(button => {
        button.classList.remove('text-blue-600', 'bg-blue-50', 'border-blue-500');
        button.classList.remove('text-green-600', 'bg-green-50', 'border-green-500');
        button.classList.remove('text-purple-600', 'bg-purple-50', 'border-purple-500');
        button.classList.add('text-gray-500');
    });
    
    // 대상 탭 표시
    const targetContent = document.getElementById(`evaluation-${tab}`);
    if (targetContent) {
        targetContent.classList.remove('hidden');
    }
    
    // 대상 버튼 활성화
    const targetButton = document.getElementById(`tab-${tab}`);
    if (targetButton) {
        const colors = {
            dashboard: 'blue',
            items: 'green',
            assignment: 'purple',
            preview: 'indigo'
        };
        
        const color = colors[tab] || 'blue';
        targetButton.classList.remove('text-gray-500');
        targetButton.classList.add(`text-${color}-600`, `bg-${color}-50`, `border-${color}-500`);
    }
    
    // 탭별 데이터 로드
    loadEvaluationTabData(tab);
}

function loadEvaluationTabData(tab) {
    switch (tab) {
        case 'dashboard':
            updateEvaluationDashboard();
            break;
        case 'items':
            loadEvaluationItems();
            break;
        case 'assignment':
            loadAssignmentData();
            break;
        case 'preview':
            // 미리보기는 버튼 클릭시에만
            break;
    }
}

// ==================== 평가 설정 데이터 로드 ====================
function loadEvaluationSettings() {
    console.log('📊 평가 설정 로드');
    
    // 정량평가 항목 로드
    fetch('/api/evaluation/quantitative')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                quantitativeItems = data.items || {};
                updateQuantitativeDisplay();
            }
        })
        .catch(error => console.error('정량평가 항목 로드 실패:', error));
    
    // 정성평가 항목 로드
    fetch('/api/evaluation/qualitative')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                qualitativeItems = data.items || {};
                updateQualitativeDisplay();
            }
        })
        .catch(error => console.error('정성평가 항목 로드 실패:', error));
    
    // 평가 대상 설정 로드
    fetch('/api/evaluation/targets')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                evaluationTargets = data.targets || {};
                updateAssignmentDisplay();
            }
        })
        .catch(error => console.error('평가 대상 로드 실패:', error));
}

function updateEvaluationDashboard() {
    // 정량평가 개수 및 가중치
    const quantCount = Object.keys(quantitativeItems).length;
    const quantWeight = Object.values(quantitativeItems).reduce((sum, item) => sum + (item.weight || 0), 0);
    
    const quantCountEl = document.getElementById('quantitativeCount');
    const quantWeightEl = document.getElementById('quantitativeWeight');
    
    if (quantCountEl) quantCountEl.textContent = quantCount;
    if (quantWeightEl) quantWeightEl.textContent = quantWeight + '%';
    
    // 정성평가 개수
    const qualCount = Object.keys(qualitativeItems).length;
    const qualCountEl = document.getElementById('qualitativeCount');
    
    if (qualCountEl) qualCountEl.textContent = qualCount;
    
    // 조직 배정 현황
    const assignmentCount = Object.keys(evaluationTargets).length;
    const assignmentCountEl = document.getElementById('assignmentCount');
    
    if (assignmentCountEl) assignmentCountEl.textContent = assignmentCount;
}

function loadEvaluationItems() {
    updateQuantitativeDisplay();
    updateQualitativeDisplay();
}

function updateQuantitativeDisplay() {
    const container = document.getElementById('quantitativeItemsGrid');
    if (!container) return;
    
    const items = Object.values(quantitativeItems);
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6 text-gray-500">
                <i class="fas fa-chart-bar text-2xl mb-2"></i>
                <p>정량평가 항목이 없습니다.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="evaluation-item-card bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h4 class="font-medium text-blue-900">${item.name}</h4>
                    <p class="text-sm text-blue-700 mt-1">${item.description}</p>
                    <div class="flex items-center mt-2">
                        <span class="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">가중치: ${item.weight}%</span>
                    </div>
                </div>
                <div class="flex space-x-1 ml-2">
                    <button onclick="editQuantitativeItem('${item.id}')" class="p-1 text-blue-600 hover:bg-blue-200 rounded" title="수정">
                        <i class="fas fa-edit text-sm"></i>
                    </button>
                    <button onclick="deleteQuantitativeItem('${item.id}')" class="p-1 text-red-600 hover:bg-red-200 rounded" title="삭제">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // 새로 생성된 버튼들에 이벤트 리스너 추가
    addQuantitativeItemListeners();
}

function updateQualitativeDisplay() {
    const container = document.getElementById('qualitativeItemsGrid');
    if (!container) return;
    
    const items = Object.values(qualitativeItems);
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6 text-gray-500">
                <i class="fas fa-comments text-2xl mb-2"></i>
                <p>정성평가 항목이 없습니다.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="evaluation-item-card bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h4 class="font-medium text-green-900">${item.name}</h4>
                    <p class="text-sm text-green-700 mt-1">${item.description}</p>
                    <div class="flex items-center mt-2">
                        <span class="px-2 py-1 bg-green-600 text-white text-xs rounded-full">${item.scale}</span>
                    </div>
                </div>
                <div class="flex space-x-1 ml-2">
                    <button onclick="editQualitativeItem('${item.id}')" class="p-1 text-green-600 hover:bg-green-200 rounded" title="수정">
                        <i class="fas fa-edit text-sm"></i>
                    </button>
                    <button onclick="deleteQualitativeItem('${item.id}')" class="p-1 text-red-600 hover:bg-red-200 rounded" title="삭제">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // 새로 생성된 버튼들에 이벤트 리스너 추가
    addQualitativeItemListeners();
}

function addQuantitativeItemListeners() {
    // 수정 버튼들
    document.querySelectorAll('button[onclick*="editQuantitativeItem"]').forEach(button => {
        const itemId = button.getAttribute('onclick').match(/'([^']+)'/)[1];
        button.removeAttribute('onclick');
        button.addEventListener('click', (e) => {
            e.preventDefault();
            editQuantitativeItem(itemId);
        });
    });
    
    // 삭제 버튼들
    document.querySelectorAll('button[onclick*="deleteQuantitativeItem"]').forEach(button => {
        const itemId = button.getAttribute('onclick').match(/'([^']+)'/)[1];
        button.removeAttribute('onclick');
        button.addEventListener('click', (e) => {
            e.preventDefault();
            deleteQuantitativeItem(itemId);
        });
    });
}

function addQualitativeItemListeners() {
    // 수정 버튼들
    document.querySelectorAll('button[onclick*="editQualitativeItem"]').forEach(button => {
        const itemId = button.getAttribute('onclick').match(/'([^']+)'/)[1];
        button.removeAttribute('onclick');
        button.addEventListener('click', (e) => {
            e.preventDefault();
            editQualitativeItem(itemId);
        });
    });
    
    // 삭제 버튼들
    document.querySelectorAll('button[onclick*="deleteQualitativeItem"]').forEach(button => {
        const itemId = button.getAttribute('onclick').match(/'([^']+)'/)[1];
        button.removeAttribute('onclick');
        button.addEventListener('click', (e) => {
            e.preventDefault();
            deleteQualitativeItem(itemId);
        });
    });
}

// ==================== 평가 항목 관리 함수 ====================
function startEvaluationWizard(type) {
    console.log('🧙 평가 마법사 시작:', type);
    showNotification(`${type === 'quantitative' ? '정량' : '정성'}평가 마법사 기능은 곧 제공될 예정입니다.`, 'info');
}

function quickAddQuantitativeItem() {
    const name = prompt('정량평가 항목 이름을 입력하세요:');
    if (!name) return;
    
    const description = prompt('항목 설명을 입력하세요:');
    if (!description) return;
    
    const weight = prompt('가중치(%)를 입력하세요:', '10');
    if (!weight) return;
    
    const itemData = {
        name: name.trim(),
        description: description.trim(),
        weight: parseInt(weight)
    };
    
    fetch('/api/evaluation/quantitative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('정량평가 항목이 추가되었습니다.', 'success');
            quantitativeItems[data.item.id] = data.item;
            updateQuantitativeDisplay();
            updateEvaluationDashboard();
        } else {
            showNotification('항목 추가에 실패했습니다.', 'error');
        }
    })
    .catch(error => {
        console.error('정량평가 항목 추가 실패:', error);
        showNotification('네트워크 오류가 발생했습니다.', 'error');
    });
}

function quickAddQualitativeItem() {
    const name = prompt('정성평가 항목 이름을 입력하세요:');
    if (!name) return;
    
    const description = prompt('항목 설명을 입력하세요:');
    if (!description) return;
    
    const scale = prompt('평가 척도를 입력하세요 (예: 1-5점):', '1-5점');
    if (!scale) return;
    
    const itemData = {
        name: name.trim(),
        description: description.trim(),
        scale: scale.trim()
    };
    
    fetch('/api/evaluation/qualitative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('정성평가 항목이 추가되었습니다.', 'success');
            qualitativeItems[data.item.id] = data.item;
            updateQualitativeDisplay();
            updateEvaluationDashboard();
        } else {
            showNotification('항목 추가에 실패했습니다.', 'error');
        }
    })
    .catch(error => {
        console.error('정성평가 항목 추가 실패:', error);
        showNotification('네트워크 오류가 발생했습니다.', 'error');
    });
}

function editQuantitativeItem(itemId) {
    const item = quantitativeItems[itemId];
    if (!item) return;
    
    const name = prompt('항목 이름:', item.name);
    if (name === null) return;
    
    const description = prompt('항목 설명:', item.description);
    if (description === null) return;
    
    const weight = prompt('가중치(%):', item.weight);
    if (weight === null) return;
    
    const itemData = {
        itemId: itemId,
        name: name.trim(),
        description: description.trim(),
        weight: parseInt(weight)
    };
    
    fetch('/api/evaluation/quantitative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('정량평가 항목이 수정되었습니다.', 'success');
            quantitativeItems[itemId] = data.item;
            updateQuantitativeDisplay();
            updateEvaluationDashboard();
        } else {
            showNotification('항목 수정에 실패했습니다.', 'error');
        }
    })
    .catch(error => {
        console.error('정량평가 항목 수정 실패:', error);
        showNotification('네트워크 오류가 발생했습니다.', 'error');
    });
}

function editQualitativeItem(itemId) {
    const item = qualitativeItems[itemId];
    if (!item) return;
    
    const name = prompt('항목 이름:', item.name);
    if (name === null) return;
    
    const description = prompt('항목 설명:', item.description);
    if (description === null) return;
    
    const scale = prompt('평가 척도:', item.scale);
    if (scale === null) return;
    
    const itemData = {
        itemId: itemId,
        name: name.trim(),
        description: description.trim(),
        scale: scale.trim()
    };
    
    fetch('/api/evaluation/qualitative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('정성평가 항목이 수정되었습니다.', 'success');
            qualitativeItems[itemId] = data.item;
            updateQualitativeDisplay();
            updateEvaluationDashboard();
        } else {
            showNotification('항목 수정에 실패했습니다.', 'error');
        }
    })
    .catch(error => {
        console.error('정성평가 항목 수정 실패:', error);
        showNotification('네트워크 오류가 발생했습니다.', 'error');
    });
}

function deleteQuantitativeItem(itemId) {
    if (!confirm('이 정량평가 항목을 삭제하시겠습니까?')) return;
    
    fetch(`/api/evaluation/quantitative/${itemId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('정량평가 항목이 삭제되었습니다.', 'success');
            delete quantitativeItems[itemId];
            updateQuantitativeDisplay();
            updateEvaluationDashboard();
        } else {
            showNotification('항목 삭제에 실패했습니다.', 'error');
        }
    })
    .catch(error => {
        console.error('정량평가 항목 삭제 실패:', error);
        showNotification('네트워크 오류가 발생했습니다.', 'error');
    });
}

function deleteQualitativeItem(itemId) {
    if (!confirm('이 정성평가 항목을 삭제하시겠습니까?')) return;
    
    fetch(`/api/evaluation/qualitative/${itemId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('정성평가 항목이 삭제되었습니다.', 'success');
            delete qualitativeItems[itemId];
            updateQualitativeDisplay();
            updateEvaluationDashboard();
        } else {
            showNotification('항목 삭제에 실패했습니다.', 'error');
        }
    })
    .catch(error => {
        console.error('정성평가 항목 삭제 실패:', error);
        showNotification('네트워크 오류가 발생했습니다.', 'error');
    });
}

// ==================== Sales 목표 관련 ====================
function loadSalesTargets() {
    console.log('💰 Sales팀 목표 데이터 로드');
    
    const container = document.getElementById('salesTargetsContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><p>Sales팀 목표 데이터를 불러오는 중...</p></div>';
    
    fetch('/api/evaluation/sales-targets')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displaySalesTargets(data.salesTargets);
            } else {
                container.innerHTML = '<p class="text-red-600">Sales 목표 데이터 로드 실패</p>';
            }
        })
        .catch(error => {
            console.error('Sales 목표 로드 실패:', error);
            container.innerHTML = '<p class="text-red-600">네트워크 오류가 발생했습니다.</p>';
        });
}

function displaySalesTargets(salesTargets) {
    const container = document.getElementById('salesTargetsContainer');
    if (!container) return;
    
    const months = ['july', 'august', 'september', 'october', 'november', 'december'];
    const monthNames = ['7월', '8월', '9월', '10월', '11월', '12월'];
    
    let html = `
        <div class="mb-4">
            <h4 class="text-lg font-medium text-gray-900">${salesTargets.team} ${salesTargets.period} 목표</h4>
            <p class="text-sm text-gray-600">총 목표: ${salesTargets.totalTarget.toLocaleString()}천원</p>
        </div>
        
        <div class="space-y-6">
    `;
    
    salesTargets.members.forEach((member, index) => {
        html += `
            <div class="bg-gray-50 p-4 rounded-lg">
                <h5 class="font-medium text-gray-900 mb-3">${member.name}</h5>
                
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div class="bg-blue-100 p-3 rounded">
                        <div class="text-sm text-blue-800 font-medium">일반 SaaS</div>
                        <div class="text-lg font-bold text-blue-600">
                            ${Object.values(member.targets.general_saas).reduce((a, b) => a + b, 0).toLocaleString()}천원
                        </div>
                    </div>
                    
                    <div class="bg-green-100 p-3 rounded">
                        <div class="text-sm text-green-800 font-medium">공공 SaaS</div>
                        <div class="text-lg font-bold text-green-600">
                            ${Object.values(member.targets.public_saas).reduce((a, b) => a + b, 0).toLocaleString()}천원
                        </div>
                    </div>
                    
                    <div class="bg-purple-100 p-3 rounded">
                        <div class="text-sm text-purple-800 font-medium">신규 계약</div>
                        <div class="text-lg font-bold text-purple-600">
                            ${Object.values(member.targets.new_contracts).reduce((a, b) => a + b, 0)}건
                        </div>
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200">
                                <th class="text-left py-2">구분</th>
                                ${monthNames.map(month => `<th class="text-right py-2">${month}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-b border-gray-100">
                                <td class="py-2 font-medium">일반 SaaS</td>
                                ${months.map(month => `<td class="text-right py-2">${member.targets.general_saas[month].toLocaleString()}</td>`).join('')}
                            </tr>
                            <tr class="border-b border-gray-100">
                                <td class="py-2 font-medium">공공 SaaS</td>
                                ${months.map(month => `<td class="text-right py-2">${member.targets.public_saas[month].toLocaleString()}</td>`).join('')}
                            </tr>
                            <tr>
                                <td class="py-2 font-medium">신규 계약</td>
                                ${months.map(month => `<td class="text-right py-2">${member.targets.new_contracts[month]}건</td>`).join('')}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
    console.log('✅ Sales 목표 데이터 표시 완료');
}

// ==================== 배정 및 미리보기 ====================
function loadAssignmentData() {
    console.log('📋 평가 배정 데이터 로드');
    // 배정 관련 기능은 추후 구현
}

function updateAssignmentDisplay() {
    // 배정 현황 업데이트는 추후 구현
}

function runEvaluationPreview() {
    console.log('👀 평가 시뮬레이션 실행');
    
    const orgSelect = document.getElementById('previewOrganization');
    const resultContainer = document.getElementById('previewResult');
    
    if (!orgSelect || !resultContainer) return;
    
    const selectedOrg = orgSelect.value;
    
    resultContainer.innerHTML = `
        <div class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
            <p class="text-gray-600">시뮬레이션을 실행하는 중...</p>
        </div>
    `;
    
    setTimeout(() => {
        resultContainer.innerHTML = `
            <div class="bg-gray-50 p-6 rounded-lg">
                <h4 class="font-medium text-gray-900 mb-4">${selectedOrg === 'sales_team' ? 'Sales팀' : 'CX팀'} 평가 시뮬레이션 결과</h4>
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span>정량평가 항목:</span>
                        <span class="font-medium">${Object.keys(quantitativeItems).length}개</span>
                    </div>
                    <div class="flex justify-between">
                        <span>정성평가 항목:</span>
                        <span class="font-medium">${Object.keys(qualitativeItems).length}개</span>
                    </div>
                    <div class="flex justify-between">
                        <span>예상 소요 시간:</span>
                        <span class="font-medium">15-20분</span>
                    </div>
                </div>
                <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p class="text-sm text-blue-700">시뮬레이션이 완료되었습니다. 실제 평가를 시작하려면 평가 일정을 생성하세요.</p>
                </div>
            </div>
        `;
    }, 2000);
}

// ==================== 전역 함수 노출 ====================
window.initializeEvaluationManagement = initializeEvaluationManagement;
window.switchEvaluationTab = switchEvaluationTab;
window.startEvaluationWizard = startEvaluationWizard;
window.quickAddQuantitativeItem = quickAddQuantitativeItem;
window.quickAddQualitativeItem = quickAddQualitativeItem;
window.editQuantitativeItem = editQuantitativeItem;
window.editQualitativeItem = editQualitativeItem;
window.deleteQuantitativeItem = deleteQuantitativeItem;
window.deleteQualitativeItem = deleteQualitativeItem;
window.loadSalesTargets = loadSalesTargets;
window.runEvaluationPreview = runEvaluationPreview;
window.loadEvaluationSettings = loadEvaluationSettings;

console.log('✅ evaluationManagement.js 로드 완료');