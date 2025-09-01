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
// 현재 사용자 (localStorage에서 로드)
let currentUser = JSON.parse(localStorage.getItem('user') || '{}');

// 기본값 설정
if (!currentUser.role) {
    currentUser = {
        id: 'guest',
        name: '게스트',
        role: 'guest',
        email: ''
    };
}

// 데이터베이스 연결 확인 함수
async function checkDatabaseConnection() {
    try {
        const response = await fetch('/api/health');
        return response.ok;
    } catch (error) {
        console.log('D1 데이터베이스 연결 실패, LocalStorage 모드로 전환');
        return false;
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 클라우드사업본부 업무평가 시스템 시작');
    
    try {
        // 데이터베이스 연결 확인
        console.log('데이터베이스 연결 확인 중...');
        window.dbConnected = await checkDatabaseConnection();
        
        if (window.dbConnected) {
            console.log('✅ D1 데이터베이스 모드로 실행');
            // D1에서 데이터 로드
            await loadFromDatabase();
        } else {
            console.log('⚠️ LocalStorage 모드로 실행');
            // LocalStorage에서 데이터 로드
            loadFromStorage();
        }
        console.log('데이터 로드 완료');
        
        // 사용자 권한 확인 및 UI 설정 (데이터 로드 후)
        console.log('사용자 권한 초기화 중...');
        initializeUserPermissions();
        
        // UI 초기화
        console.log('UI 초기화 중...');
        initializeUI();
        
        // 탭 시스템 초기화
        console.log('탭 시스템 초기화 중...');
        initializeTabs();
        
        // 평가 시스템 초기화
        console.log('평가 시스템 초기화 중...');
        initializeEvaluationSystem();
        
        // 조직도 렌더링
        console.log('조직도 렌더링 중...');
        renderOrganizationChart();
        
        console.log('✅ 시스템 초기화 완료');
        
        // 데이터베이스 마이그레이션 버튼 표시 (LocalStorage 모드일 때)
        if (!window.dbConnected) {
            showDatabaseMigrationOption();
        }
    } catch (error) {
        console.error('초기화 중 오류 발생:', error);
    }
});

// 사용자 권한 초기화
function initializeUserPermissions() {
    console.log('사용자 권한 초기화 시작:', currentUser);
    
    // 현재 사용자의 관리자 권한 검증
    validateCurrentUserAdmin();
    
    // 현재 사용자 정보 표시
    updateUserInfo();
    
    // 권한에 따른 메뉴 제어 (지연 실행으로 DOM 로드 완료 후 실행)
    setTimeout(() => {
        updateMenuAccess();
        console.log('사용자 권한 초기화 완료');
    }, 500);
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
                // 관리자에게는 정상 스타일 유지 및 락 아이콘 제거
                tabButton.classList.remove('opacity-50', 'cursor-not-allowed');
                tabButton.title = '';
                
                // 락 아이콘 제거
                const lockIcon = tabButton.querySelector('.fa-lock');
                if (lockIcon) {
                    lockIcon.remove();
                }
                
                console.log(`관리자 메뉴 활성화: ${tabName}`);
            }
        }
    });
    
    console.log(`메뉴 접근 권한 업데이트 완료 (현재 역할: ${currentUser.role})`);
}

// 탭 접근 권한 확인
function checkTabPermission(tabName) {
    const adminOnlyTabs = ['settings', 'systemSettings'];
    
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
        console.log(`역할 변경: ${currentUser.role} → ${role}`);
        
        currentUser.role = role;
        currentUser.name = role === 'admin' ? '관리자' : '김직원';
        currentUser.email = role === 'admin' ? 'admin@company.com' : 'employee@company.com';
        
        // UI 업데이트
        updateUserInfo();
        
        // 메뉴 접근성 업데이트 (약간의 지연을 두어 DOM 업데이트 후 실행)
        setTimeout(() => {
            updateMenuAccess();
            console.log('메뉴 접근성 업데이트 완료');
        }, 100);
        
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
            try {
                const onclickAttr = this.getAttribute('onclick');
                if (onclickAttr) {
                    const match = onclickAttr.match(/showTab\\('([^']+)'\\)/);
                    if (match && match[1]) {
                        showTab(match[1]);
                    } else {
                        console.warn('Invalid tab name format in onclick:', onclickAttr);
                    }
                } else {
                    console.warn('No onclick attribute found on tab button');
                }
            } catch (error) {
                console.error('Error in tab button click handler:', error);
            }
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
            content.classList.add('hidden');
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
            activeContent.classList.remove('hidden');
            activeContent.classList.add('active');
        }
        
        // 탭별 특별 처리
        handleTabSpecialCases(tabName);
        
        console.log('탭 전환:', tabName, '(권한:', currentUser.role, ')');
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
            renderAdminList();
            break;
        case 'systemSettings':
            // 시스템 설정은 기본적으로 조직 설정 탭 표시
            console.log('시스템 설정 탭 로드');
            setTimeout(() => {
                if (typeof showSettingsTab === 'function') {
                    showSettingsTab('organization');
                } else {
                    console.warn('showSettingsTab 함수가 정의되지 않음');
                }
            }, 100);
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
        console.warn('evaluationItems container not found - 설정 탭이 아직 생성되지 않음');
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

// 에러 처리 개선
window.addEventListener('error', function(event) {
    try {
        if (event && event.error) {
            console.error('Global error:', event.error);
        } else {
            console.error('Unknown error occurred:', event);
        }
        
        // Toast 함수가 존재하는지 확인 후 호출
        if (typeof showToast === 'function') {
            showToast('시스템 오류가 발생했습니다. 페이지를 새로고침해주세요.', 'error');
        }
    } catch (e) {
        console.error('Error in error handler:', e);
    }
});

// Promise 에러 처리 추가
window.addEventListener('unhandledrejection', function(event) {
    try {
        console.warn('Unhandled promise rejection:', event.reason);
        event.preventDefault(); // 브라우저 콘솔에 표시되는 것을 방지
    } catch (e) {
        console.error('Error in promise rejection handler:', e);
    }
});

// 언로드 시 데이터 저장
window.addEventListener('beforeunload', function() {
    saveToStorage();
});

// 관리자 권한 확인 (다른 파일에서 사용하기 위한 전역 함수)
window.isAdmin = function() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'admin';
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
                
                <!-- 관리자 관리 -->
                <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">관리자 관리</h3>
                            <p class="text-sm text-gray-600 mt-1">시스템 관리자를 지정하거나 변경하세요</p>
                        </div>
                        <button onclick="showAdminManagementModal()" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm">
                            <i class="fas fa-user-cog mr-2"></i>관리자 설정
                        </button>
                    </div>
                    
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <h5 class="text-sm font-medium text-red-900 mb-2">🔐 관리자 권한 안내</h5>
                        <ul class="text-sm text-red-800 space-y-1">
                            <li>• <strong>관리자</strong>: 모든 메뉴 접근, 조직도 관리, 평가 설정 등</li>
                            <li>• <strong>일반 사용자</strong>: 대시보드, 평가 참여만 가능</li>
                            <li>• 관리자는 여러 명 지정 가능하며, 최소 1명은 유지되어야 합니다</li>
                            <li>• 현재 로그인된 사용자의 권한 변경시 즉시 적용됩니다</li>
                        </ul>
                    </div>
                    
                    <!-- 현재 관리자 목록 -->
                    <div id="adminList" class="space-y-2">
                        <!-- 동적으로 관리자 목록이 표시됩니다 -->
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

// 관리자 목록을 저장할 전역 변수
let adminUsers = [
    {
        id: 'admin',
        name: '관리자',
        email: 'admin@company.com',
        role: 'admin',
        assignedAt: new Date().toISOString()
    }
];

// 관리자 관리 모달 표시
function showAdminManagementModal() {
    if (!isAdmin()) {
        showToast('관리자 권한이 필요합니다.', 'error');
        return;
    }
    
    // 조직의 모든 구성원 가져오기
    const allMembers = [];
    Object.values(organizationData).forEach(org => {
        if (org.members) {
            org.members.forEach(member => {
                allMembers.push({
                    ...member,
                    orgName: org.name,
                    orgType: org.type
                });
            });
        }
    });
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-backdrop';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">👨‍💼 관리자 권한 관리</h3>
                <button onclick="closeModal(this)" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-6">
                <!-- 현재 관리자 목록 -->
                <div>
                    <h4 class="font-medium text-gray-900 mb-3">현재 관리자 (${adminUsers.length}명)</h4>
                    <div class="space-y-2" id="currentAdmins">
                        ${adminUsers.map(admin => `
                            <div class="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div class="flex items-center space-x-3">
                                    <i class="fas fa-user-shield text-red-600"></i>
                                    <div>
                                        <span class="font-medium text-gray-900">${admin.name}</span>
                                        <div class="text-sm text-gray-600">${admin.email || '이메일 없음'}</div>
                                        <div class="text-xs text-gray-500">지정일: ${formatDateTime(admin.assignedAt)}</div>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    ${admin.id === currentUser.id ? 
                                        '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">현재 로그인</span>' : 
                                        `<button onclick="removeAdmin('${admin.id}')" class="text-red-600 hover:text-red-800 text-sm">
                                            <i class="fas fa-user-minus"></i> 해제
                                        </button>`
                                    }
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- 조직 구성원에서 관리자 추가 -->
                <div>
                    <h4 class="font-medium text-gray-900 mb-3">조직 구성원에서 관리자 지정</h4>
                    ${allMembers.length > 0 ? `
                        <div class="space-y-2 max-h-60 overflow-y-auto">
                            ${allMembers.map(member => {
                                const isAdmin = adminUsers.some(admin => admin.email === member.email);
                                return `
                                    <div class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div class="flex items-center space-x-3">
                                            <i class="fas fa-user text-gray-600"></i>
                                            <div>
                                                <span class="font-medium text-gray-900">${member.name}</span>
                                                <div class="text-sm text-gray-600">${member.email || '이메일 없음'}</div>
                                                <div class="text-xs text-gray-500">${member.orgName} (${member.position || '직급 없음'})</div>
                                            </div>
                                        </div>
                                        <div>
                                            ${isAdmin ? 
                                                '<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">관리자</span>' :
                                                `<button onclick="addAdminFromMember('${member.id}', '${member.name}', '${member.email || ''}')" 
                                                         class="text-blue-600 hover:text-blue-800 text-sm">
                                                    <i class="fas fa-user-plus"></i> 관리자 지정
                                                </button>`
                                            }
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `
                        <div class="text-center text-gray-500 py-8">
                            <i class="fas fa-users text-2xl mb-2"></i>
                            <p>등록된 조직 구성원이 없습니다.</p>
                            <p class="text-sm">먼저 조직도를 구성해주세요.</p>
                        </div>
                    `}
                </div>
                
                <!-- 직접 관리자 추가 -->
                <div>
                    <h4 class="font-medium text-gray-900 mb-3">직접 관리자 추가</h4>
                    <form onsubmit="addDirectAdmin(event)">
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
                                <input type="text" name="adminName" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       placeholder="관리자 이름">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">이메일 *</label>
                                <input type="email" name="adminEmail" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       placeholder="admin@company.com">
                            </div>
                        </div>
                        <button type="submit" 
                                class="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                            <i class="fas fa-user-plus mr-2"></i>관리자 추가
                        </button>
                    </form>
                </div>
            </div>
            
            <div class="flex justify-end mt-6">
                <button onclick="closeModal(this)" 
                        class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                    닫기
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 조직 구성원을 관리자로 지정
function addAdminFromMember(memberId, memberName, memberEmail) {
    if (!memberEmail) {
        showToast('이메일이 없는 구성원은 관리자로 지정할 수 없습니다.', 'error');
        return;
    }
    
    // 이미 관리자인지 확인
    const existingAdmin = adminUsers.find(admin => admin.email === memberEmail);
    if (existingAdmin) {
        showToast('이미 관리자로 지정된 사용자입니다.', 'warning');
        return;
    }
    
    const newAdmin = {
        id: generateId('admin'),
        name: memberName,
        email: memberEmail,
        role: 'admin',
        assignedAt: new Date().toISOString(),
        source: 'member'
    };
    
    adminUsers.push(newAdmin);
    saveToStorage();
    
    // 모달 새로고침
    closeModal(document.querySelector('.modal-backdrop'));
    showAdminManagementModal();
    
    showToast(`${memberName}님을 관리자로 지정했습니다.`, 'success');
}

// 직접 관리자 추가
function addDirectAdmin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const name = formData.get('adminName').trim();
    const email = formData.get('adminEmail').trim();
    
    // 이메일 중복 확인
    const existingAdmin = adminUsers.find(admin => admin.email === email);
    if (existingAdmin) {
        showToast('이미 등록된 이메일입니다.', 'error');
        return;
    }
    
    const newAdmin = {
        id: generateId('admin'),
        name: name,
        email: email,
        role: 'admin',
        assignedAt: new Date().toISOString(),
        source: 'direct'
    };
    
    adminUsers.push(newAdmin);
    saveToStorage();
    
    // 모달 새로고침
    closeModal(document.querySelector('.modal-backdrop'));
    showAdminManagementModal();
    
    showToast(`${name}님을 관리자로 추가했습니다.`, 'success');
}

// 관리자 해제
function removeAdmin(adminId) {
    const admin = adminUsers.find(a => a.id === adminId);
    if (!admin) return;
    
    // 최소 1명의 관리자는 유지
    if (adminUsers.length <= 1) {
        showToast('최소 1명의 관리자는 유지되어야 합니다.', 'error');
        return;
    }
    
    if (confirm(`${admin.name}님의 관리자 권한을 해제하시겠습니까?`)) {
        adminUsers = adminUsers.filter(a => a.id !== adminId);
        saveToStorage();
        
        // 현재 사용자가 해제된 경우 일반 사용자로 전환
        if (admin.email === currentUser.email) {
            switchUserRole('user');
        }
        
        // 모달 새로고침
        closeModal(document.querySelector('.modal-backdrop'));
        showAdminManagementModal();
        
        showToast(`${admin.name}님의 관리자 권한이 해제되었습니다.`, 'info');
    }
}

// 현재 관리자 목록 렌더링 (설정 탭에서)
function renderAdminList() {
    const container = document.getElementById('adminList');
    if (!container) return;
    
    container.innerHTML = adminUsers.map(admin => `
        <div class="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center space-x-3">
                <i class="fas fa-user-shield text-red-600"></i>
                <div>
                    <span class="font-medium text-gray-900">${admin.name}</span>
                    <div class="text-sm text-gray-600">${admin.email}</div>
                    <div class="text-xs text-gray-500">지정일: ${formatDateTime(admin.assignedAt)}</div>
                </div>
            </div>
            <div>
                ${admin.id === currentUser.id ? 
                    '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">현재 로그인</span>' : 
                    '<span class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">관리자</span>'
                }
            </div>
        </div>
    `).join('');
}

// 사용자 권한 확인 함수 업그레이드
function checkUserPermission(userEmail) {
    return adminUsers.some(admin => admin.email === userEmail);
}

// 로그인한 사용자가 관리자인지 확인하는 향상된 함수
function validateCurrentUserAdmin() {
    if (currentUser.email) {
        const isRealAdmin = adminUsers.some(admin => admin.email === currentUser.email);
        if (!isRealAdmin && currentUser.role === 'admin') {
            // 관리자 목록에 없는데 관리자로 설정된 경우 일반 사용자로 전환
            currentUser.role = 'user';
            updateUserInfo();
            updateMenuAccess();
            showToast('관리자 권한이 해제되었습니다.', 'warning');
            saveToStorage();
        }
    }
}

// 데이터베이스 마이그레이션 UI 표시
function showDatabaseMigrationOption() {
    // LocalStorage에 데이터가 있는지 확인
    const hasLocalData = localStorage.getItem('evaluationItems') || 
                        localStorage.getItem('organizationData') || 
                        localStorage.getItem('adminUsers');

    if (hasLocalData) {
        const migrationBanner = document.createElement('div');
        migrationBanner.className = 'fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-sm z-50';
        migrationBanner.innerHTML = `
            <div class="flex items-start space-x-3">
                <i class="fas fa-database text-yellow-600 mt-1"></i>
                <div>
                    <h4 class="font-semibold text-yellow-900 mb-1">데이터베이스 업그레이드</h4>
                    <p class="text-sm text-yellow-800 mb-3">LocalStorage 데이터를 영구 데이터베이스로 이전할 수 있습니다.</p>
                    <div class="flex space-x-2">
                        <button onclick="migrateToDB()" class="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700">
                            이전하기
                        </button>
                        <button onclick="backupLocalData()" class="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600">
                            백업만
                        </button>
                        <button onclick="closeMigrationBanner()" class="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400">
                            나중에
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(migrationBanner);
        window.migrationBanner = migrationBanner;
    }
}

// 데이터베이스 마이그레이션 실행
async function migrateToDB() {
    try {
        const success = await dataMigration.migrateFromLocalStorage();
        if (success) {
            closeMigrationBanner();
            // 페이지 새로고침하여 D1 모드로 전환
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    } catch (error) {
        showToast('마이그레이션 실패: ' + error.message, 'error');
    }
}

// LocalStorage 데이터 백업
function backupLocalData() {
    dataMigration.backupLocalStorage();
}

// 마이그레이션 배너 닫기
function closeMigrationBanner() {
    if (window.migrationBanner) {
        window.migrationBanner.remove();
        window.migrationBanner = null;
    }
}

console.log('✅ 메인 애플리케이션이 로드되었습니다.');