// 클라우드사업본부 업무평가 시스템 - 메인 애플리케이션
console.log('🚀 앱 초기화 시작');

// ==================== 전역 변수 및 설정 ====================
let currentUser = null;
let currentRole = 'user';
let isInitialized = false;

// ==================== DOM 로드 완료 후 실행 ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM 로드 완료 - 이벤트 리스너 등록 시작');
    
    // 1. 인증 체크
    if (!checkAuth()) {
        return;
    }
    
    // 2. 이벤트 리스너 등록
    initializeEventListeners();
    
    // 3. 초기 UI 설정
    initializeUI();
    
    console.log('✅ 앱 초기화 완료');
    isInitialized = true;
});

// ==================== 인증 관련 함수 ====================
function checkAuth() {
    console.log('🔐 인증 상태 확인');
    const user = localStorage.getItem('user');
    if (!user) {
        console.log('❌ 로그인 정보 없음 - 로그인 페이지로 리디렉션');
        window.location.href = '/';
        return false;
    }
    
    try {
        currentUser = JSON.parse(user);
        currentRole = currentUser.role || 'user';
        console.log('✅ 로그인 확인:', currentUser.name, '역할:', currentRole);
        
        // 사용자 정보 표시
        updateUserDisplay();
        setupRoleBasedUI();
        
        return true;
    } catch (error) {
        console.error('❌ 사용자 정보 파싱 오류:', error);
        localStorage.removeItem('user');
        window.location.href = '/';
        return false;
    }
}

function updateUserDisplay() {
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    
    if (userNameEl && userRoleEl) {
        userNameEl.textContent = currentUser.name;
        const roleNames = {
            'admin': '관리자',
            'user': '사용자', 
            'admin_user': '관리자겸사용자'
        };
        userRoleEl.textContent = roleNames[currentRole] || '사용자';
    }
}

function logout() {
    console.log('🚪 로그아웃 처리');
    localStorage.removeItem('user');
    
    showNotification('로그아웃되었습니다.', 'info');
    
    setTimeout(() => {
        window.location.href = '/';
    }, 1000);
}

function switchUserRole(newRole) {
    console.log('👤 사용자 역할 전환:', currentRole, '->', newRole);
    
    if (currentUser.role !== 'admin' && currentUser.role !== 'admin_user' && newRole === 'admin') {
        showNotification('관리자 권한이 없습니다.', 'error');
        return;
    }
    
    currentRole = newRole;
    setupRoleBasedUI();
    showTab('dashboard');
    showNotification(`${newRole === 'admin' ? '관리자' : '사용자'} 모드로 전환되었습니다.`, 'success');
}

// ==================== UI 초기화 ====================
function initializeUI() {
    console.log('🎨 UI 초기화');
    
    // 기본 탭 활성화
    showTab('dashboard');
    
    // 관리자인 경우 데이터 로드
    if (isAdmin()) {
        loadAdminDashboardData();
    } else {
        loadUserDashboardData();
    }
}

function setupRoleBasedUI() {
    console.log('🔧 권한별 UI 설정:', currentRole);
    
    const adminSidebar = document.getElementById('adminSidebar');
    const userSidebar = document.getElementById('userSidebar');
    
    if (isAdmin()) {
        // 관리자 UI 표시
        if (adminSidebar) adminSidebar.classList.remove('hidden');
        if (userSidebar) userSidebar.classList.add('hidden');
        
        // 관리자겸사용자 특별 표시
        if (currentRole === 'admin_user') {
            updateAdminModeIndicator();
        }
    } else {
        // 일반 사용자 UI 표시
        if (userSidebar) userSidebar.classList.remove('hidden');
        if (adminSidebar) adminSidebar.classList.add('hidden');
    }
}

function updateAdminModeIndicator() {
    const indicator = document.querySelector('#adminSidebar .bg-red-50, #adminSidebar .bg-orange-50');
    if (indicator && currentRole === 'admin_user') {
        indicator.innerHTML = 
            '<p class="text-sm font-medium text-orange-800">' +
                '<i class="fas fa-users-cog mr-2"></i>관리자겸사용자 모드' +
            '</p>' +
            '<p class="text-xs text-orange-600 mt-1">관리 권한 + 평가 대상자</p>';
        indicator.className = 'mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg';
    }
}

// ==================== 이벤트 리스너 초기화 ====================
function initializeEventListeners() {
    console.log('🔗 이벤트 리스너 등록');
    
    // 사이드바 탭 버튼들
    initializeTabListeners();
    
    // 헤더 버튼들
    initializeHeaderListeners();
    
    // 시스템 설정 탭 버튼들
    initializeSettingsListeners();
    
    // 평가 시스템 탭 버튼들
    initializeEvaluationListeners();
    
    // 조직 관리 이벤트
    initializeOrganizationListeners();
    
    // 사용자 관리 이벤트
    initializeUserManagementListeners();
}

function initializeTabListeners() {
    // 관리자 사이드바 탭 버튼들
    const adminTabButtons = [
        { selector: '#adminSidebar button[onclick*="dashboard"]', tab: 'dashboard' },
        { selector: '#adminSidebar button[onclick*="evaluationManagement"]', tab: 'evaluationManagement' },
        { selector: '#adminSidebar button[onclick*="allReports"]', tab: 'allReports' },
        { selector: '#adminSidebar button[onclick*="systemSettings"]', tab: 'systemSettings' }
    ];
    
    // 사용자 사이드바 탭 버튼들
    const userTabButtons = [
        { selector: '#userSidebar button[onclick*="dashboard"]', tab: 'dashboard' },
        { selector: '#userSidebar button[onclick*="selfEvaluation"]', tab: 'selfEvaluation' },
        { selector: '#userSidebar button[onclick*="peerEvaluation"]', tab: 'peerEvaluation' },
        { selector: '#userSidebar button[onclick*="myReports"]', tab: 'myReports' },
        { selector: '#userSidebar button[onclick*="notifications"]', tab: 'notifications' }
    ];
    
    // onclick 속성 제거하고 addEventListener 추가
    [...adminTabButtons, ...userTabButtons].forEach(({ selector, tab }) => {
        const element = document.querySelector(selector);
        if (element) {
            // onclick 속성 제거
            element.removeAttribute('onclick');
            
            // 새로운 이벤트 리스너 추가
            element.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('🎯 탭 클릭:', tab);
                showTab(tab);
            });
        }
    });
}

function initializeHeaderListeners() {
    // 권한 전환 버튼들
    const adminBtn = document.querySelector('button[onclick*="switchUserRole(\'admin\')"]');
    const userBtn = document.querySelector('button[onclick*="switchUserRole(\'user\')"]');
    const logoutBtn = document.querySelector('button[onclick*="logout"]');
    
    if (adminBtn) {
        adminBtn.removeAttribute('onclick');
        adminBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchUserRole('admin');
        });
    }
    
    if (userBtn) {
        userBtn.removeAttribute('onclick');
        userBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchUserRole('user');
        });
    }
    
    if (logoutBtn) {
        logoutBtn.removeAttribute('onclick');
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // 사이드바 토글
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            const sidebar = isAdmin() ? document.getElementById('adminSidebar') : document.getElementById('userSidebar');
            if (sidebar) {
                sidebar.classList.toggle('hidden');
            }
        });
    }
}

function initializeSettingsListeners() {
    const settingsButtons = [
        { selector: 'button[onclick*="showSettingsTab(\'organization\')"]', tab: 'organization' },
        { selector: 'button[onclick*="showSettingsTab(\'evaluation\')"]', tab: 'evaluation' },
        { selector: 'button[onclick*="showSettingsTab(\'users\')"]', tab: 'users' },
        { selector: 'button[onclick*="showSettingsTab(\'schedule\')"]', tab: 'schedule' }
    ];
    
    settingsButtons.forEach(({ selector, tab }) => {
        const element = document.querySelector(selector);
        if (element) {
            element.removeAttribute('onclick');
            element.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('⚙️ 설정 탭 클릭:', tab);
                showSettingsTab(tab);
            });
        }
    });
}

function initializeEvaluationListeners() {
    // 평가 시스템 내 탭 버튼들은 함수가 정의된 후에 등록
    // (evaluationManagement.js에서 처리)
}

function initializeOrganizationListeners() {
    // 조직 관리 관련 이벤트들
    const refreshBtn = document.querySelector('button[onclick*="refreshOrganization"]');
    const initBtn = document.querySelector('button[onclick*="initializeRealOrganization"]');
    
    if (refreshBtn) {
        refreshBtn.removeAttribute('onclick');
        refreshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            refreshOrganization();
        });
    }
    
    if (initBtn) {
        initBtn.removeAttribute('onclick');
        initBtn.addEventListener('click', (e) => {
            e.preventDefault();
            initializeRealOrganization();
        });
    }
}

function initializeUserManagementListeners() {
    // 사용자 관리 관련 이벤트들은 별도 모듈에서 처리
}

// ==================== 유틸리티 함수 ====================
function isAdmin() {
    return currentRole === 'admin' || currentRole === 'admin_user';
}

function showNotification(message, type = 'info') {
    console.log('📢 알림:', type, message);
    
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification p-4 rounded-lg shadow-lg text-white max-w-sm`;
    
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    notification.className += ` ${colors[type] || colors.info}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="${icons[type] || icons.info} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ==================== 탭 관리 함수 ====================
function showTab(tabName) {
    console.log('🎯 탭 전환:', tabName);
    
    // 모든 탭 컨텐츠 숨기기
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    // 모든 탭 버튼 비활성화
    const allTabButtons = document.querySelectorAll('.tab-button');
    allTabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('bg-gray-100', 'text-gray-900');
        btn.classList.add('text-gray-600');
    });
    
    // 대상 탭 표시
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
        targetTab.style.display = 'block';
        
        // dashboard 탭의 경우 권한에 따라 내용 결정
        if (tabName === 'dashboard') {
            updateDashboardContent();
        }
    } else {
        console.warn('⚠️ 탭을 찾을 수 없음:', tabName);
    }
    
    // 대응하는 탭 버튼 활성화
    const targetButton = document.querySelector(`button[data-tab="${tabName}"], .tab-button[onclick*="${tabName}"]`);
    if (targetButton) {
        targetButton.classList.add('active', 'bg-gray-100', 'text-gray-900');
        targetButton.classList.remove('text-gray-600');
    }
    
    // 탭별 특별 처리
    handleSpecialTabActions(tabName);
}

function updateDashboardContent() {
    const dashboard = document.getElementById('dashboard');
    const adminDashboard = document.getElementById('adminDashboard');
    const userDashboard = document.getElementById('userDashboard');
    
    if (dashboard && adminDashboard && userDashboard) {
        if (isAdmin()) {
            dashboard.innerHTML = adminDashboard.innerHTML;
            loadAdminDashboardData();
        } else {
            dashboard.innerHTML = userDashboard.innerHTML;
            loadUserDashboardData();
        }
    }
}

function handleSpecialTabActions(tabName) {
    switch (tabName) {
        case 'systemSettings':
            // 기본적으로 조직 설정 탭 표시
            setTimeout(() => showSettingsTab('organization'), 100);
            break;
        case 'evaluationManagement':
            // 평가 관리 초기화
            if (typeof initializeEvaluationManagement === 'function') {
                initializeEvaluationManagement();
            }
            break;
    }
}

function showSettingsTab(tabName) {
    console.log('⚙️ 설정 탭 전환:', tabName);
    
    // 모든 설정 컨텐츠 숨기기
    const allSettingsContent = document.querySelectorAll('.settings-content');
    allSettingsContent.forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
    });
    
    // 모든 설정 탭 버튼 비활성화
    const allSettingsButtons = document.querySelectorAll('.settings-tab-btn');
    allSettingsButtons.forEach(btn => {
        btn.classList.remove('border-blue-500', 'text-blue-600', 'border-green-500', 'text-green-600', 'border-purple-500', 'text-purple-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    
    // 대상 설정 컨텐츠 표시
    const targetContent = document.getElementById(tabName + 'Settings');
    if (targetContent) {
        targetContent.classList.add('active');
        targetContent.classList.remove('hidden');
    }
    
    // 대상 설정 탭 버튼 활성화
    const colors = {
        organization: 'blue',
        evaluation: 'green', 
        users: 'purple',
        schedule: 'indigo'
    };
    
    const color = colors[tabName] || 'blue';
    const targetButton = document.getElementById(tabName.substring(0, 4) + 'Tab') || 
                        document.getElementById(tabName === 'organization' ? 'orgTab' : 
                                            tabName === 'evaluation' ? 'evalTab' :
                                            tabName === 'users' ? 'usersTab' : 'scheduleTab');
    
    if (targetButton) {
        targetButton.classList.remove('border-transparent', 'text-gray-500');
        targetButton.classList.add(`border-${color}-500`, `text-${color}-600`);
    }
    
    // 탭별 데이터 로드
    loadSettingsTabData(tabName);
}

function loadSettingsTabData(tabName) {
    switch (tabName) {
        case 'organization':
            refreshOrganization();
            break;
        case 'users':
            if (typeof refreshPendingUsers === 'function') refreshPendingUsers();
            if (typeof refreshAllUsers === 'function') refreshAllUsers();
            break;
        case 'evaluation':
            if (typeof loadEvaluationSettings === 'function') loadEvaluationSettings();
            break;
    }
}

// ==================== 대시보드 데이터 로드 ====================
function loadAdminDashboardData() {
    console.log('📊 관리자 대시보드 데이터 로드');
    
    // 사용자 통계 로드
    fetch('/api/users')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const totalUsers = data.users.length;
                const pendingUsers = data.users.filter(u => u.status === 'pending').length;
                
                const totalEl = document.getElementById('adminTotalUsers');
                const pendingEl = document.getElementById('adminPendingUsers');
                
                if (totalEl) totalEl.textContent = totalUsers;
                if (pendingEl) pendingEl.textContent = pendingUsers;
                
                console.log('✅ 사용자 통계 업데이트:', totalUsers, '총', pendingUsers, '대기');
            }
        })
        .catch(error => console.error('❌ 관리자 데이터 로드 실패:', error));

    // 승인 대기 회원 미리보기 로드
    loadPendingUsersPreview();
}

function loadUserDashboardData() {
    console.log('📊 사용자 대시보드 데이터 로드');
    
    // 사용자별 통계는 추후 구현
    const elements = [
        'userSelfEvaluations',
        'userPeerEvaluations', 
        'userReceivedEvaluations',
        'userCompletionRate'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = id === 'userCompletionRate' ? '0%' : '0';
        }
    });
}

function loadPendingUsersPreview() {
    fetch('/api/users/pending')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const container = document.getElementById('adminRecentSignups');
                if (!container) return;
                
                if (data.users.length === 0) {
                    container.innerHTML = '<p class="text-gray-600">승인 대기 중인 회원이 없습니다.</p>';
                } else {
                    const recentSignups = data.users.slice(0, 3).map(user => 
                        `<div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span class="text-sm font-medium">${user.name}</span>
                            <span class="text-xs text-gray-500">${new Date(user.createdAt).toLocaleDateString('ko-KR')}</span>
                        </div>`
                    ).join('');
                    container.innerHTML = recentSignups;
                }
            }
        })
        .catch(error => console.error('❌ 대기 회원 미리보기 로드 실패:', error));
}

// ==================== 조직 관리 함수 ====================
function refreshOrganization() {
    console.log('🏢 조직 구조 새로고침');
    
    const treeContainer = document.getElementById('organizationTree');
    if (!treeContainer) return;
    
    treeContainer.innerHTML = '<div class="text-center py-4 text-gray-500"><i class="fas fa-spinner fa-spin text-xl mb-2"></i><p>조직 구조를 불러오는 중...</p></div>';
    
    fetch('/api/organizations')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayOrganizationTree(data.organizations);
            } else {
                treeContainer.innerHTML = '<p class="text-red-600">조직 구조 로드 실패</p>';
            }
        })
        .catch(error => {
            console.error('❌ 조직 구조 로드 실패:', error);
            treeContainer.innerHTML = '<p class="text-red-600">네트워크 오류가 발생했습니다.</p>';
        });
}

function displayOrganizationTree(organizations) {
    const treeContainer = document.getElementById('organizationTree');
    if (!treeContainer) return;
    
    // 팀별로 그룹화
    const teams = organizations.filter(org => org.type === 'team');
    const parts = organizations.filter(org => org.type === 'part');
    
    let html = '';
    
    teams.forEach(team => {
        html += `
            <div class="border border-gray-200 rounded-lg p-3 mb-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i class="fas fa-users text-blue-500 mr-2"></i>
                        <span class="font-medium text-gray-900">${team.name}</span>
                        <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">${team.memberCount || 0}명</span>
                    </div>
                </div>
                ${team.description ? `<p class="text-sm text-gray-600 mt-1 ml-6">${team.description}</p>` : ''}
                
                <div class="ml-6 mt-2 space-y-1">
        `;
        
        const teamParts = parts.filter(part => part.parentId === team.id);
        teamParts.forEach(part => {
            html += `
                <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div class="flex items-center">
                        <i class="fas fa-briefcase text-green-500 mr-2 text-sm"></i>
                        <span class="text-sm text-gray-800">${part.name}</span>
                        <span class="ml-2 px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">${part.memberCount || 0}명</span>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    if (html === '') {
        html = '<p class="text-gray-600 text-center py-4">조직이 설정되지 않았습니다.</p>';
    }
    
    treeContainer.innerHTML = html;
    console.log('✅ 조직 구조 표시 완료');
}

function initializeRealOrganization() {
    console.log('🔄 실제 조직 구조로 초기화');
    
    if (!confirm('기존 조직 구조를 실제 클라우드사업본부 구조로 초기화하시겠습니까?')) {
        return;
    }
    
    fetch('/api/organizations/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('조직 구조가 초기화되었습니다.', 'success');
            refreshOrganization();
        } else {
            showNotification('초기화에 실패했습니다.', 'error');
        }
    })
    .catch(error => {
        console.error('❌ 조직 초기화 실패:', error);
        showNotification('네트워크 오류가 발생했습니다.', 'error');
    });
}

// ==================== 전역 함수 노출 ====================
// 기존 onclick에서 참조하는 함수들을 전역에 노출
window.showTab = showTab;
window.showSettingsTab = showSettingsTab;
window.switchUserRole = switchUserRole;
window.logout = logout;
window.refreshOrganization = refreshOrganization;
window.initializeRealOrganization = initializeRealOrganization;

console.log('✅ app.js 로드 완료');