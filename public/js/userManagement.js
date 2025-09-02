// 사용자 관리 모듈
console.log('👥 사용자 관리 모듈 로드');

// ==================== 사용자 관리 전역 변수 ====================
let allUsers = [];
let pendingUsers = [];

// ==================== 사용자 관리 초기화 ====================
function initializeUserManagement() {
    console.log('👥 사용자 관리 초기화');
    
    // 사용자 관리 이벤트 리스너 등록
    initializeUserManagementListeners();
}

function initializeUserManagementListeners() {
    // 고급 관리 도구 버튼들
    const advancedButtons = [
        { selector: 'button[onclick*="cleanupInactiveUsers"]', handler: cleanupInactiveUsers },
        { selector: 'button[onclick*="exportUserList"]', handler: exportUserList },
        { selector: 'button[onclick*="testEmailService"]', handler: testEmailService },
        { selector: 'button[onclick*="showUserStats"]', handler: showUserStats },
        { selector: 'button[onclick*="bulkApproveUsers"]', handler: bulkApproveUsers },
        { selector: 'button[onclick*="refreshPendingUsers"]', handler: refreshPendingUsers },
        { selector: 'button[onclick*="refreshAllUsers"]', handler: refreshAllUsers }
    ];
    
    advancedButtons.forEach(({ selector, handler }) => {
        const button = document.querySelector(selector);
        if (button) {
            button.removeAttribute('onclick');
            button.addEventListener('click', function(e) {
                e.preventDefault();
                handler();
            });
        }
    });
}

// ==================== 승인 대기 사용자 관리 ====================
function refreshPendingUsers() {
    console.log('⏳ 승인 대기 사용자 새로고침');
    
    const container = document.getElementById('pendingUsersContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><p>대기 중인 회원을 불러오는 중...</p></div>';
    
    fetch('/api/users/pending')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                pendingUsers = data.users;
                displayPendingUsers(data.users);
            } else {
                container.innerHTML = '<p class="text-red-600">대기 회원 로드 실패</p>';
            }
        })
        .catch(error => {
            console.error('대기 회원 로드 실패:', error);
            container.innerHTML = '<p class="text-red-600">네트워크 오류가 발생했습니다.</p>';
        });
}

function displayPendingUsers(users) {
    const container = document.getElementById('pendingUsersContainer');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-check-circle text-4xl mb-4 text-green-500"></i>
                <p class="text-lg font-medium">승인 대기 중인 회원이 없습니다.</p>
                <p class="text-sm">모든 가입 신청이 처리되었습니다.</p>
            </div>
        `;
        return;
    }
    
    const html = users.map(user => `
        <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-2">
                        <h4 class="font-medium text-gray-900">${user.name}</h4>
                        <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">승인 대기</span>
                    </div>
                    
                    <div class="text-sm text-gray-600 space-y-1">
                        <div><i class="fas fa-envelope mr-2"></i>${user.email}</div>
                        <div><i class="fas fa-building mr-2"></i>${user.team} / ${user.part}</div>
                        <div><i class="fas fa-clock mr-2"></i>신청일: ${new Date(user.createdAt).toLocaleDateString('ko-KR')}</div>
                    </div>
                </div>
                
                <div class="flex space-x-2">
                    <button onclick="approveUser('${user.email}')" 
                            class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm">
                        <i class="fas fa-check mr-1"></i>승인
                    </button>
                    <button onclick="rejectUser('${user.email}')" 
                            class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm">
                        <i class="fas fa-times mr-1"></i>거부
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    
    // 새로 생성된 버튼들에 이벤트 리스너 추가
    addPendingUserListeners();
    
    console.log('✅ 승인 대기 사용자 표시 완료:', users.length, '명');
}

function addPendingUserListeners() {
    // 승인 버튼들
    document.querySelectorAll('button[onclick*="approveUser"]').forEach(button => {
        const email = button.getAttribute('onclick').match(/'([^']+)'/)[1];
        button.removeAttribute('onclick');
        button.addEventListener('click', (e) => {
            e.preventDefault();
            approveUser(email);
        });
    });
    
    // 거부 버튼들
    document.querySelectorAll('button[onclick*="rejectUser"]').forEach(button => {
        const email = button.getAttribute('onclick').match(/'([^']+)'/)[1];
        button.removeAttribute('onclick');
        button.addEventListener('click', (e) => {
            e.preventDefault();
            rejectUser(email);
        });
    });
}

function approveUser(email) {
    console.log('✅ 사용자 승인:', email);
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        showNotification('로그인이 필요합니다.', 'error');
        return;
    }
    
    fetch('/api/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: email,
            approverEmail: currentUser.email
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            refreshPendingUsers();
            
            // 전체 사용자 목록이 로드되어 있다면 새로고침
            if (allUsers.length > 0) {
                refreshAllUsers();
            }
            
            // 관리자 대시보드 통계 업데이트
            if (typeof loadAdminDashboardData === 'function') {
                loadAdminDashboardData();
            }
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('사용자 승인 실패:', error);
        showNotification('네트워크 오류가 발생했습니다.', 'error');
    });
}

function rejectUser(email) {
    console.log('❌ 사용자 거부:', email);
    
    const reason = prompt('거부 사유를 입력하세요 (선택사항):') || '승인되지 않음';
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        showNotification('로그인이 필요합니다.', 'error');
        return;
    }
    
    fetch('/api/users/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: email,
            reason: reason,
            approverEmail: currentUser.email
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            refreshPendingUsers();
            
            // 관리자 대시보드 통계 업데이트
            if (typeof loadAdminDashboardData === 'function') {
                loadAdminDashboardData();
            }
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('사용자 거부 실패:', error);
        showNotification('네트워크 오류가 발생했습니다.', 'error');
    });
}

function bulkApproveUsers() {
    console.log('✅ 전체 사용자 승인');
    
    if (pendingUsers.length === 0) {
        showNotification('승인 대기 중인 사용자가 없습니다.', 'info');
        return;
    }
    
    if (!confirm(`총 ${pendingUsers.length}명의 대기 중인 사용자를 모두 승인하시겠습니까?`)) {
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        showNotification('로그인이 필요합니다.', 'error');
        return;
    }
    
    fetch('/api/users/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            approverEmail: currentUser.email
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            refreshPendingUsers();
            
            // 전체 사용자 목록이 로드되어 있다면 새로고침
            if (allUsers.length > 0) {
                refreshAllUsers();
            }
            
            // 관리자 대시보드 통계 업데이트
            if (typeof loadAdminDashboardData === 'function') {
                loadAdminDashboardData();
            }
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('전체 승인 실패:', error);
        showNotification('네트워크 오류가 발생했습니다.', 'error');
    });
}

// ==================== 전체 사용자 관리 ====================
function refreshAllUsers() {
    console.log('👥 전체 사용자 새로고침');
    
    const container = document.getElementById('allUsersContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center py-8 text-gray-500"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><p>사용자 목록을 불러오는 중...</p></div>';
    
    fetch('/api/users')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                allUsers = data.users;
                displayAllUsers(data.users);
            } else {
                container.innerHTML = '<p class="text-red-600">사용자 목록 로드 실패</p>';
            }
        })
        .catch(error => {
            console.error('전체 사용자 로드 실패:', error);
            container.innerHTML = '<p class="text-red-600">네트워크 오류가 발생했습니다.</p>';
        });
}

function displayAllUsers(users) {
    const container = document.getElementById('allUsersContainer');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-users text-4xl mb-4"></i>
                <p class="text-lg font-medium">등록된 사용자가 없습니다.</p>
            </div>
        `;
        return;
    }
    
    // 상태별 필터 및 통계
    const approved = users.filter(u => u.status === 'approved' || !u.status);
    const pending = users.filter(u => u.status === 'pending');
    const rejected = users.filter(u => u.status === 'rejected');
    
    let html = `
        <div class="mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div class="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
                    <div class="text-2xl font-bold text-green-600">${approved.length}</div>
                    <div class="text-sm text-green-700">승인된 사용자</div>
                </div>
                <div class="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-center">
                    <div class="text-2xl font-bold text-yellow-600">${pending.length}</div>
                    <div class="text-sm text-yellow-700">승인 대기</div>
                </div>
                <div class="bg-red-50 border border-red-200 p-3 rounded-lg text-center">
                    <div class="text-2xl font-bold text-red-600">${rejected.length}</div>
                    <div class="text-sm text-red-700">거부된 사용자</div>
                </div>
            </div>
        </div>
        
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white border border-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">조직</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">가입일</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
    `;
    
    users.forEach(user => {
        const statusColors = {
            approved: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            rejected: 'bg-red-100 text-red-800'
        };
        
        const statusTexts = {
            approved: '승인됨',
            pending: '대기중',
            rejected: '거부됨'
        };
        
        const roleTexts = {
            admin: '관리자',
            user: '사용자',
            admin_user: '관리자겸사용자'
        };
        
        const status = user.status || 'approved';
        
        html += `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">${user.name}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${user.email}</td>
                <td class="px-4 py-3 text-sm text-gray-600">
                    ${user.team ? `${user.team} / ${user.part}` : '미배정'}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">${roleTexts[user.role] || user.role}</td>
                <td class="px-4 py-3">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status]}">
                        ${statusTexts[status]}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                    ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td class="px-4 py-3">
                    <div class="flex space-x-2">
                        <button onclick="editUser('${user.email}')" 
                                class="text-blue-600 hover:text-blue-800 text-sm" title="수정">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteUser('${user.email}')" 
                                class="text-red-600 hover:text-red-800 text-sm" title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
    
    // 새로 생성된 버튼들에 이벤트 리스너 추가
    addAllUserListeners();
    
    console.log('✅ 전체 사용자 표시 완료:', users.length, '명');
}

function addAllUserListeners() {
    // 수정 버튼들
    document.querySelectorAll('button[onclick*="editUser"]').forEach(button => {
        const email = button.getAttribute('onclick').match(/'([^']+)'/)[1];
        button.removeAttribute('onclick');
        button.addEventListener('click', (e) => {
            e.preventDefault();
            editUser(email);
        });
    });
    
    // 삭제 버튼들
    document.querySelectorAll('button[onclick*="deleteUser"]').forEach(button => {
        const email = button.getAttribute('onclick').match(/'([^']+)'/)[1];
        button.removeAttribute('onclick');
        button.addEventListener('click', (e) => {
            e.preventDefault();
            deleteUser(email);
        });
    });
}

function editUser(email) {
    console.log('✏️ 사용자 수정:', email);
    showNotification('사용자 수정 기능은 곧 제공될 예정입니다.', 'info');
}

function deleteUser(email) {
    console.log('🗑️ 사용자 삭제:', email);
    
    const user = allUsers.find(u => u.email === email);
    if (!user) return;
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        showNotification('로그인이 필요합니다.', 'error');
        return;
    }
    
    if (email === currentUser.email) {
        showNotification('자기 자신은 삭제할 수 없습니다.', 'error');
        return;
    }
    
    if (!confirm(`정말로 "${user.name}" 사용자를 삭제하시겠습니까?\n\n주의: 이 작업은 되돌릴 수 없습니다.`)) {
        return;
    }
    
    fetch(`/api/users/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            deleterEmail: currentUser.email
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            refreshAllUsers();
            
            // 관리자 대시보드 통계 업데이트
            if (typeof loadAdminDashboardData === 'function') {
                loadAdminDashboardData();
            }
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('사용자 삭제 실패:', error);
        showNotification('네트워크 오류가 발생했습니다.', 'error');
    });
}

// ==================== 고급 관리 도구 ====================
function cleanupInactiveUsers() {
    console.log('🧹 비활성 사용자 정리');
    showNotification('비활성 사용자 정리 기능은 곧 제공될 예정입니다.', 'info');
}

function exportUserList() {
    console.log('📥 사용자 목록 내보내기');
    
    if (allUsers.length === 0) {
        showNotification('내보낼 사용자 데이터가 없습니다.', 'warning');
        return;
    }
    
    // CSV 형식으로 데이터 준비
    const headers = ['이름', '이메일', '팀', '파트', '역할', '상태', '가입일'];
    const csvData = [
        headers.join(','),
        ...allUsers.map(user => [
            `"${user.name}"`,
            `"${user.email}"`,
            `"${user.team || ''}"`,
            `"${user.part || ''}"`,
            `"${user.role}"`,
            `"${user.status || 'approved'}"`,
            `"${user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : ''}"`
        ].join(','))
    ].join('\n');
    
    // 파일 다운로드
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `사용자_목록_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('사용자 목록을 CSV 파일로 내보냈습니다.', 'success');
}

function testEmailService() {
    console.log('📧 이메일 서비스 테스트');
    
    const email = prompt('테스트 이메일을 받을 주소를 입력하세요:', 'rayben@forcs.com');
    if (!email) return;
    
    fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            to: email,
            subject: '테스트 이메일 - 클라우드사업본부 업무평가 시스템',
            message: '이메일 알림 시스템 테스트입니다.'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('테스트 이메일이 발송되었습니다.', 'success');
        } else {
            showNotification('이메일 발송에 실패했습니다: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('이메일 테스트 실패:', error);
        showNotification('네트워크 오류가 발생했습니다.', 'error');
    });
}

function showUserStats() {
    console.log('📊 사용자 통계 표시');
    
    if (allUsers.length === 0) {
        showNotification('통계를 표시할 사용자 데이터가 없습니다.', 'warning');
        return;
    }
    
    // 통계 계산
    const totalUsers = allUsers.length;
    const approvedUsers = allUsers.filter(u => u.status === 'approved' || !u.status).length;
    const pendingUsers = allUsers.filter(u => u.status === 'pending').length;
    const rejectedUsers = allUsers.filter(u => u.status === 'rejected').length;
    
    const teamStats = {};
    allUsers.forEach(user => {
        if (user.team) {
            teamStats[user.team] = (teamStats[user.team] || 0) + 1;
        }
    });
    
    const roleStats = {};
    allUsers.forEach(user => {
        roleStats[user.role] = (roleStats[user.role] || 0) + 1;
    });
    
    // 통계 메시지 생성
    let statsMessage = `📊 사용자 통계\n\n`;
    statsMessage += `총 사용자: ${totalUsers}명\n`;
    statsMessage += `승인된 사용자: ${approvedUsers}명\n`;
    statsMessage += `승인 대기: ${pendingUsers}명\n`;
    statsMessage += `거부된 사용자: ${rejectedUsers}명\n\n`;
    
    statsMessage += `팀별 분포:\n`;
    Object.entries(teamStats).forEach(([team, count]) => {
        statsMessage += `  ${team}: ${count}명\n`;
    });
    
    statsMessage += `\n역할별 분포:\n`;
    Object.entries(roleStats).forEach(([role, count]) => {
        const roleNames = {
            admin: '관리자',
            user: '사용자',
            admin_user: '관리자겸사용자'
        };
        statsMessage += `  ${roleNames[role] || role}: ${count}명\n`;
    });
    
    alert(statsMessage);
}

// ==================== 전역 함수 노출 ====================
window.initializeUserManagement = initializeUserManagement;
window.refreshPendingUsers = refreshPendingUsers;
window.refreshAllUsers = refreshAllUsers;
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.bulkApproveUsers = bulkApproveUsers;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.cleanupInactiveUsers = cleanupInactiveUsers;
window.exportUserList = exportUserList;
window.testEmailService = testEmailService;
window.showUserStats = showUserStats;

console.log('✅ userManagement.js 로드 완료');