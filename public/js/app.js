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
            renderSettings();
            updateEvaluationCounts();
            break;
        case 'dashboard':
            // 대시보드 데이터 업데이트
            updateDashboardStats();
            break;
        case 'evaluation':
            // 평가 폼 로드
            loadEvaluationForm();
            break;
        case 'selfEvaluation':
            // 자기평가 폼 생성
            generateSelfEvaluationForm();
            break;
        case 'reports':
            // 리포트 테이블 생성
            generateReportTable();
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

console.log('✅ 메인 애플리케이션이 로드되었습니다.');