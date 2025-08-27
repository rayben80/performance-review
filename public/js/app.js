/**
 * 클라우드사업본부 업무평가 시스템 - 메인 애플리케이션
 */

// 전역 변수
let evaluationItems = [];
let quantitativeItems = [];
let qualitativeItems = [];
let organizationData = {};
let evaluationData = {};
let currentEvaluationType = 'quantitative';
let currentUser = {
    id: 'admin',
    name: '관리자',
    role: 'admin', // 'admin' 또는 'user'
    email: 'admin@company.com'
};

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 클라우드사업본부 업무평가 시스템 시작');
    
    // 사용자 권한 확인 및 UI 설정
    initializeUserPermissions();
    
    // 데이터 로드
    loadFromStorage();
    
    // UI 초기화
    initializeUI();
    
    // 탭 시스템 초기화
    initializeTabs();
    
    // 평가 시스템 초기화
    initializeEvaluationSystem();
    
    // 조직도 렌더링
    renderOrganizationChart();
    
    console.log('✅ 시스템 초기화 완료');
});

// 사용자 권한 초기화
function initializeUserPermissions() {
    // 현재 사용자 정보 표시
    updateUserInfo();
    
    // 권한에 따른 메뉴 제어
    updateMenuAccess();
}

// 사용자 정보 업데이트
function updateUserInfo() {
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    
    if (userNameElement) {
        userNameElement.textContent = currentUser.name;
    }
    
    if (userRoleElement) {
        const roleText = currentUser.role === 'admin' ? '관리자' : '일반 사용자';
        const roleColor = currentUser.role === 'admin' ? 'text-red-600' : 'text-blue-600';
        userRoleElement.innerHTML = `<span class="${roleColor} font-semibold">${roleText}</span>`;
    }
}

// 메뉴 접근 권한 업데이트
function updateMenuAccess() {
    // 관리자 전용 메뉴 목록
    const adminOnlyTabs = ['settings'];
    
    adminOnlyTabs.forEach(tabName => {
        const tabButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
        if (tabButton) {
            if (currentUser.role !== 'admin') {
                // 일반 사용자에게는 비활성화 스타일 적용
                tabButton.classList.add('opacity-50', 'cursor-not-allowed');
                tabButton.title = '관리자 권한이 필요합니다';
                
                // 아이콘 추가로 권한 표시
                const lockIcon = '<i class="fas fa-lock ml-1 text-xs"></i>';
                if (!tabButton.innerHTML.includes('fa-lock')) {
                    tabButton.innerHTML += lockIcon;
                }
            } else {
                // 관리자에게는 정상 스타일 유지
                tabButton.classList.remove('opacity-50', 'cursor-not-allowed');
                tabButton.title = '';
            }
        }
    });
}

// 탭 접근 권한 확인
function checkTabPermission(tabName) {
    const adminOnlyTabs = ['settings'];
    
    // 관리자 전용 탭인지 확인
    if (adminOnlyTabs.includes(tabName)) {
        return currentUser.role === 'admin';
    }
    
    // 일반 탭은 모든 사용자 접근 가능
    return true;
}

// 사용자 역할 변경 (개발/테스트용)
function switchUserRole(role) {
    if (role === 'admin' || role === 'user') {
        currentUser.role = role;
        currentUser.name = role === 'admin' ? '관리자' : '김직원';
        currentUser.email = role === 'admin' ? 'admin@company.com' : 'employee@company.com';
        
        // UI 업데이트
        updateUserInfo();
        updateMenuAccess();
        
        // 현재 설정 탭에 있고 권한이 없으면 대시보드로 이동
        const currentTab = document.querySelector('.tab-content.active');
        if (currentTab && currentTab.id === 'settings' && role !== 'admin') {
            showTab('dashboard');
        }
        
        showToast(`${role === 'admin' ? '관리자' : '일반 사용자'} 모드로 변경되었습니다.`, 'info');
        saveToStorage();
    }
}

// UI 초기화
function initializeUI() {
    // 사이드바 토글
    initializeSidebar();
    
    // 기본 탭 활성화
    showTab('dashboard');
    
    // 조직 관리 모드 기본값 설정
    switchOrgMode('excel');
    
    // 평가 유형 기본값 설정
    switchEvaluationType('quantitative');
}

// 사이드바 초기화
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const miniToggle = document.getElementById('miniToggle');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('hidden');
        });
    }
    
    if (miniToggle) {
        miniToggle.addEventListener('click', function() {
            sidebar.classList.toggle('hidden');
        });
    }
}

// 탭 시스템 초기화
function initializeTabs() {
    const tabButtons = document.querySelectorAll('[onclick^="showTab"]');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('onclick').match(/showTab\\('([^']+)'\\)/)[1];
            showTab(tabName);
        });
    });
}

// 탭 표시
function showTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // 관리자 권한 확인
    if (!checkTabPermission(tabName)) {
        showToast('관리자 권한이 필요한 메뉴입니다.', 'error');
        return;
    }
    
    try {
        // 모든 탭 버튼 비활성화
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active', 'bg-blue-600', 'text-white');
            btn.classList.add('text-gray-600', 'hover:text-gray-900');
        });
        
        // 모든 탭 콘텐츠 숨기기
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // 선택된 탭 버튼 활성화
        const activeButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
        if (activeButton) {
            activeButton.classList.remove('text-gray-600', 'hover:text-gray-900');
            activeButton.classList.add('active', 'bg-blue-600', 'text-white');
        }
        
        // 선택된 탭 콘텐츠 표시
        const activeContent = document.getElementById(tabName);
        if (activeContent) {
            activeContent.classList.add('active');
        }
        
        // 탭별 특별 처리
        handleTabSpecialCases(tabName);
        
        console.log('Tab switched successfully to:', tabName);
    } catch (error) {
        console.error('Error switching tab:', error);
    }
}

// 탭별 특별 처리
function handleTabSpecialCases(tabName) {
    switch(tabName) {
        case 'settings':
            // 설정 탭 활성화시 렌더링
            createSettingsContent();
            renderSettings();
            updateEvaluationCounts();
            break;
        case 'dashboard':
            // 대시보드 데이터 업데이트
            updateDashboardStats();
            break;
        case 'evaluation':
            // 평가 폼 로드
            createEvaluationContent();
            break;
        case 'selfEvaluation':
            // 자기평가 폼 생성
            createSelfEvaluationContent();
            generateSelfEvaluationForm();
            break;
        case 'reports':
            // 리포트 테이블 생성
            createReportsContent();
            break;
    }
}

// 평가 시스템 초기화
function initializeEvaluationSystem() {
    // 기본 평가 항목이 없으면 생성
    if (evaluationItems.length === 0) {
        evaluationItems = [
            {
                id: 1,
                name: "업무 성과",
                description: "담당 업무의 목표 달성도 및 품질",
                weight: 30,
                type: "quantitative"
            },
            {
                id: 2, 
                name: "협업 능력",
                description: "팀워크 및 의사소통 능력",
                weight: 25,
                type: "quantitative"
            },
            {
                id: 3,
                name: "전문성",
                description: "업무 관련 지식 및 기술 수준",
                weight: 25,
                type: "quantitative"
            },
            {
                id: 4,
                name: "개선 제안",
                description: "업무 개선 및 혁신 제안 능력",
                weight: 20,
                type: "qualitative"
            }
        ];
        
        // 정량/정성 항목 분리
        quantitativeItems = evaluationItems.filter(item => item.type === 'quantitative');
        qualitativeItems = evaluationItems.filter(item => item.type === 'qualitative');
        
        saveToStorage();
    }
}

// 대시보드 통계 업데이트
function updateDashboardStats() {
    const stats = {
        totalOrgs: Object.keys(organizationData).length,
        totalMembers: 0,
        totalEvaluations: Object.keys(evaluationData).length,
        completedEvaluations: 0
    };
    
    // 총 구성원 수 계산
    Object.values(organizationData).forEach(org => {
        if (org.members) {
            stats.totalMembers += org.members.length;
        }
    });
    
    // 완료된 평가 수 계산
    Object.values(evaluationData).forEach(evaluation => {
        if (evaluation.status === 'completed') {
            stats.completedEvaluations++;
        }
    });
    
    // UI 업데이트
    updateStatsUI(stats);
}

// 통계 UI 업데이트
function updateStatsUI(stats) {
    const elements = {
        totalOrgs: document.getElementById('totalOrgs'),
        totalMembers: document.getElementById('totalMembers'), 
        totalEvaluations: document.getElementById('totalEvaluations'),
        completedEvaluations: document.getElementById('completedEvaluations')
    };
    
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            elements[key].textContent = formatNumber(stats[key]);
        }
    });
}

// 설정 렌더링
function renderSettings() {
    const container = document.getElementById('evaluationItems');
    if (!container) {
        console.warn('evaluationItems container not found');
        return;
    }
    container.innerHTML = '';

    const currentItems = currentEvaluationType === 'quantitative' ? quantitativeItems : qualitativeItems;
    
    currentItems.forEach((item, index) => {
        const itemElement = createEvaluationItemElement(item, index);
        container.appendChild(itemElement);
    });
}

// 평가 항목 요소 생성
function createEvaluationItemElement(item, index) {
    const div = document.createElement('div');
    div.className = 'evaluation-item bg-white p-4 rounded-lg border border-gray-200 shadow-sm';
    div.innerHTML = `
        <div class="flex items-center justify-between mb-2">
            <h4 class="font-medium text-gray-900">${item.name}</h4>
            <div class="flex space-x-2">
                <button onclick="moveItem(${index}, -1)" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-chevron-up"></i>
                </button>
                <button onclick="moveItem(${index}, 1)" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-chevron-down"></i>
                </button>
                <button onclick="deleteItem(${index})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <p class="text-sm text-gray-600 mb-2">${item.description}</p>
        ${item.type === 'quantitative' ? `<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">가중치: ${item.weight}%</span>` : `<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">정성평가</span>`}
    `;
    return div;
}

// 평가 항목 이동
function moveItem(index, direction) {
    const items = currentEvaluationType === 'quantitative' ? quantitativeItems : qualitativeItems;
    const newIndex = index + direction;
    
    if (newIndex < 0 || newIndex >= items.length) return;
    
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    
    // 전역 evaluationItems도 업데이트
    updateGlobalEvaluationItems();
    saveToStorage();
    renderSettings();
    showToast('항목 순서가 변경되었습니다.', 'success');
}

// 평가 항목 삭제
function deleteItem(index) {
    const items = currentEvaluationType === 'quantitative' ? quantitativeItems : qualitativeItems;
    const item = items[index];
    
    if (!confirm(`"${item.name}" 항목을 삭제하시겠습니까?`)) return;
    
    items.splice(index, 1);
    updateGlobalEvaluationItems();
    saveToStorage();
    renderSettings();
    updateEvaluationCounts();
    showToast('항목이 삭제되었습니다.', 'info');
}

// 전역 평가 항목 업데이트
function updateGlobalEvaluationItems() {
    evaluationItems = [...quantitativeItems, ...qualitativeItems];
}

// 평가 유형 전환
function switchEvaluationType(type) {
    currentEvaluationType = type;
    
    // 탭 스타일 업데이트
    document.querySelectorAll('.eval-type-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.getElementById(type + 'Tab');
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // 콘텐츠 업데이트
    renderSettings();
    updateCurrentTypeDisplay(type);
}

// 현재 평가 유형 표시 업데이트
function updateCurrentTypeDisplay(type) {
    const typeText = type === 'quantitative' ? '정량평가 항목' : '정성평가 항목';
    const typeDesc = type === 'quantitative' ? '점수 기반 객관적 평가' : '서술형 기반 주관적 평가';
    
    const currentTypeElement = document.getElementById('currentEvalType');
    if (currentTypeElement) {
        currentTypeElement.textContent = typeText;
        const descElement = currentTypeElement.nextElementSibling;
        if (descElement) {
            descElement.textContent = typeDesc;
        }
    }
}

// 평가 항목 수 업데이트
function updateEvaluationCounts() {
    const quantitativeCount = document.getElementById('quantitativeCount');
    const qualitativeCount = document.getElementById('qualitativeCount');
    
    if (quantitativeCount) {
        quantitativeCount.textContent = quantitativeItems.length + '개';
    }
    if (qualitativeCount) {
        qualitativeCount.textContent = qualitativeItems.length + '개';
    }
}

// 새 평가 항목 추가
function addEvaluationItemByType() {
    const itemName = prompt(`새로운 ${currentEvaluationType === 'quantitative' ? '정량평가' : '정성평가'} 항목 이름을 입력하세요:`);
    if (!itemName || !itemName.trim()) return;
    
    const newItem = {
        id: Date.now(),
        name: itemName.trim(),
        description: '',
        weight: currentEvaluationType === 'quantitative' ? 20 : 0,
        type: currentEvaluationType,
        createdAt: new Date().toISOString()
    };
    
    if (currentEvaluationType === 'quantitative') {
        quantitativeItems.push(newItem);
    } else {
        qualitativeItems.push(newItem);
    }
    
    updateGlobalEvaluationItems();
    saveToStorage();
    renderSettings();
    updateEvaluationCounts();
    showToast(`"${itemName}" 항목이 추가되었습니다.`, 'success');
}

// 자기평가 폼 생성
function generateSelfEvaluationForm() {
    const container = document.getElementById('selfEvaluationItems');
    if (!container) {
        console.warn('selfEvaluationItems container not found');
        return;
    }
    container.innerHTML = '';

    evaluationItems.forEach((item, index) => {
        const itemElement = createSelfEvaluationItem(item, index);
        container.appendChild(itemElement);
    });

    updateSelfEvaluationStats();
}

// 자기평가 항목 생성
function createSelfEvaluationItem(item, index) {
    const div = document.createElement('div');
    div.className = 'bg-gray-50 p-6 rounded-lg border border-gray-200';
    
    if (item.type === 'quantitative') {
        div.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <h4 class="font-medium text-gray-900 mb-2">${item.name}</h4>
                    <p class="text-sm text-gray-600">${item.description}</p>
                    <span class="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">가중치: ${item.weight}%</span>
                </div>
            </div>
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">점수 (1-5점)</label>
                    <select name="score_${item.id}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">점수 선택</option>
                        <option value="5">5점 (매우 우수)</option>
                        <option value="4">4점 (우수)</option>
                        <option value="3">3점 (보통)</option>
                        <option value="2">2점 (미흡)</option>
                        <option value="1">1점 (매우 미흡)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">상세 설명</label>
                    <textarea name="comment_${item.id}" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="구체적인 사례나 근거를 작성해주세요"></textarea>
                </div>
            </div>
        `;
    } else {
        div.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <h4 class="font-medium text-gray-900 mb-2">${item.name}</h4>
                    <p class="text-sm text-gray-600">${item.description}</p>
                    <span class="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">정성평가</span>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">서술형 답변</label>
                <textarea name="comment_${item.id}" rows="5" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="자세히 기술해주세요"></textarea>
            </div>
        `;
    }
    
    return div;
}

// 자기평가 통계 업데이트
function updateSelfEvaluationStats() {
    const totalItems = evaluationItems.length;
    const quantitativeCount = quantitativeItems.length;
    const qualitativeCount = qualitativeItems.length;
    
    const statsElement = document.getElementById('evaluationStats');
    if (statsElement) {
        statsElement.innerHTML = `
            <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                    <div class="text-2xl font-bold text-blue-600">${totalItems}</div>
                    <div class="text-sm text-gray-600">총 평가항목</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-green-600">${quantitativeCount}</div>
                    <div class="text-sm text-gray-600">정량평가</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-purple-600">${qualitativeCount}</div>
                    <div class="text-sm text-gray-600">정성평가</div>
                </div>
            </div>
        `;
    }
}

// 에러 처리
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    showToast('시스템 오류가 발생했습니다. 페이지를 새로고침해주세요.', 'error');
});

// 언로드 시 데이터 저장
window.addEventListener('beforeunload', function() {
    saveToStorage();
});

// 관리자 권한 확인 (다른 파일에서 사용하기 위한 전역 함수)
function isAdmin() {
    return currentUser.role === 'admin';
}

// 현재 사용자 정보 반환
function getCurrentUser() {
    return { ...currentUser }; // 복사본 반환
}

// 설정 탭 콘텐츠 생성
function createSettingsContent() {
    const settingsTab = document.getElementById('settings');
    if (settingsTab && settingsTab.innerHTML.trim() === '') {
        settingsTab.innerHTML = `
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-900 mb-2">설정 관리</h2>
                <p class="text-gray-600">평가 항목과 조직도를 관리하세요</p>
            </div>
            
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <!-- 평가 항목 설정 -->
                <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">평가 항목 관리</h3>
                        <button onclick="addEvaluationItemByType()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                            <i class="fas fa-plus mr-2"></i>항목 추가
                        </button>
                    </div>
                    
                    <!-- 평가 유형 탭 -->
                    <div class="flex border-b border-gray-200 mb-4">
                        <button onclick="switchEvaluationType('quantitative')" 
                                id="quantitativeTab" 
                                class="eval-type-tab px-4 py-2 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-gray-900 active">
                            📊 정량평가
                        </button>
                        <button onclick="switchEvaluationType('qualitative')" 
                                id="qualitativeTab" 
                                class="eval-type-tab px-4 py-2 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-gray-900">
                            📝 정성평가
                        </button>
                    </div>
                    
                    <!-- 현재 평가 유형 표시 -->
                    <div class="mb-4">
                        <h4 id="currentEvalType" class="font-medium text-gray-900">정량평가 항목</h4>
                        <span class="text-sm text-gray-600">점수 기반 객관적 평가</span>
                        <div class="flex space-x-4 mt-2 text-sm">
                            <span>정량평가: <span id="quantitativeCount" class="font-medium">0개</span></span>
                            <span>정성평가: <span id="qualitativeCount" class="font-medium">0개</span></span>
                        </div>
                    </div>
                    
                    <!-- 평가 항목 목록 -->
                    <div id="evaluationItems" class="space-y-3">
                        <!-- 동적으로 생성됨 -->
                    </div>
                </div>
                
                <!-- 조직도 관리 -->
                <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">조직도 관리</h3>
                            <p class="text-sm text-gray-600 mt-1">엑셀 업로드 또는 수동 입력으로 조직을 관리하세요</p>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="downloadOrgTemplate()" class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
                                <i class="fas fa-download mr-2"></i>템플릿 다운로드
                            </button>
                            <button onclick="downloadCurrentOrg()" class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                                <i class="fas fa-file-excel mr-2"></i>현재 조직도 다운로드
                            </button>
                            <label for="orgFileUpload" class="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm cursor-pointer">
                                <i class="fas fa-upload mr-2"></i>엑셀 업로드
                            </label>
                            <input type="file" id="orgFileUpload" accept=".xlsx,.xls" style="display: none;" onchange="uploadOrgChart(this)">
                        </div>
                    </div>

                    <!-- 조직 관리 탭 -->
                    <div class="border-b border-gray-200 mb-4">
                        <nav class="-mb-px flex space-x-8">
                            <button onclick="switchOrgMode('excel')" 
                                    id="excelModeTab" 
                                    class="org-mode-tab py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600">
                                📊 엑셀 관리
                            </button>
                            <button onclick="switchOrgMode('manual')" 
                                    id="manualModeTab" 
                                    class="org-mode-tab py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                                ✍️ 수동 입력
                            </button>
                        </nav>
                    </div>

                    <!-- Excel Mode -->
                    <div id="excelMode" class="org-mode-content">
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h5 class="text-sm font-medium text-blue-900 mb-2">📋 엑셀 업로드 가이드</h5>
                            <ul class="text-sm text-blue-800 space-y-1">
                                <li>• <strong>템플릿 다운로드</strong>: 빈 조직도 템플릿을 받아 작성하세요</li>
                                <li>• <strong>현재 조직도 다운로드</strong>: 기존 데이터가 포함된 엑셀 파일을 받아 수정하세요</li>
                                <li>• <strong>필수 컬럼</strong>: 부서, 팀, 파트, 이름, 직급, 이메일</li>
                                <li>• <strong>파일 형식</strong>: .xlsx 또는 .xls 파일만 지원</li>
                            </ul>
                        </div>
                    </div>

                    <!-- Manual Mode -->
                    <div id="manualMode" class="org-mode-content" style="display: none;">
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <h5 class="text-sm font-medium text-green-900 mb-3">✍️ 수동 조직도 입력</h5>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button onclick="showAddDepartmentModal()" 
                                        class="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    <i class="fas fa-building mr-2"></i>부서 추가
                                </button>
                                <button onclick="showAddTeamModal()" 
                                        class="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                    <i class="fas fa-users mr-2"></i>팀 추가
                                </button>
                                <button onclick="showAddMemberModal()" 
                                        class="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                    <i class="fas fa-user-plus mr-2"></i>구성원 추가
                                </button>
                            </div>
                            <div class="mt-3 text-sm text-green-700">
                                <p>• 부서 → 팀 → 구성원 순서로 생성하는 것을 권장합니다</p>
                                <p>• 각 항목을 클릭하면 상세 입력 폼이 나타납니다</p>
                            </div>
                        </div>
                    </div>

                    <!-- 조직도 표시 -->
                    <div id="organizationChart" class="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                        <div id="orgChartList" class="space-y-3">
                            <!-- 조직도가 동적으로 표시됩니다 -->
                        </div>
                        <div id="emptyOrgMessage" class="text-center text-gray-500 py-8">
                            <i class="fas fa-sitemap text-4xl mb-4 opacity-50"></i>
                            <p>조직도를 구성해보세요.</p>
                            <p class="text-sm">엑셀 업로드 또는 수동 입력으로 시작하세요!</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// 다른 탭들의 콘텐츠 생성 함수들
function createEvaluationContent() {
    const evalTab = document.getElementById('evaluation');
    if (evalTab && evalTab.innerHTML.trim() === '') {
        evalTab.innerHTML = `
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-900 mb-2">타인 평가</h2>
                <p class="text-gray-600">팀원들을 평가해주세요</p>
            </div>
            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <p class="text-gray-600">타인 평가 기능은 현재 개발 중입니다.</p>
            </div>
        `;
    }
}

function createSelfEvaluationContent() {
    const selfEvalTab = document.getElementById('selfEvaluation');
    if (selfEvalTab && selfEvalTab.innerHTML.trim() === '') {
        selfEvalTab.innerHTML = `
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-900 mb-2">자기 평가</h2>
                <p class="text-gray-600">자신의 성과를 평가해주세요</p>
            </div>
            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">자기평가 작성</h3>
                    <div class="flex space-x-2">
                        <button onclick="saveSelfEvaluationDraft()" class="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                            <i class="fas fa-save mr-2"></i>임시저장
                        </button>
                        <button onclick="previewSelfEvaluation()" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                            <i class="fas fa-eye mr-2"></i>미리보기
                        </button>
                    </div>
                </div>
                
                <div id="evaluationStats" class="mb-6">
                    <!-- 평가 통계가 동적으로 표시됩니다 -->
                </div>
                
                <div id="selfEvaluationItems" class="space-y-6">
                    <!-- 동적으로 평가 항목들이 생성됩니다 -->
                </div>
            </div>
        `;
    }
}

function createReportsContent() {
    const reportsTab = document.getElementById('reports');
    if (reportsTab && reportsTab.innerHTML.trim() === '') {
        reportsTab.innerHTML = `
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-900 mb-2">평가 결과</h2>
                <p class="text-gray-600">평가 결과를 확인하고 분석하세요</p>
            </div>
            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <p class="text-gray-600">평가 결과 기능은 현재 개발 중입니다.</p>
            </div>
        `;
    }
}

// 더미 함수들 (실제 구현은 필요시 추가)
function loadEvaluationForm() {
    console.log('평가 폼 로드');
}

function generateReportTable() {
    console.log('리포트 테이블 생성');
}

function saveSelfEvaluationDraft() {
    showToast('임시저장 기능은 준비 중입니다.', 'info');
}

function previewSelfEvaluation() {
    showToast('미리보기 기능은 준비 중입니다.', 'info');
}

console.log('✅ 메인 애플리케이션이 로드되었습니다.');