/**
 * 클라우드사업본부 업무평가 시스템 - 조직 관리 모듈
 */

// 조직 관리 모드 전환
function switchOrgMode(mode) {
    console.log('Switching organization mode to:', mode);
    
    try {
        // Tab styling
        const tabs = document.querySelectorAll('.org-mode-tab');
        tabs.forEach(tab => {
            tab.classList.remove('border-blue-500', 'text-blue-600');
            tab.classList.add('border-transparent', 'text-gray-500');
        });
        
        const activeTab = document.getElementById(mode + 'ModeTab');
        if (!activeTab) {
            console.warn('Active tab not found:', mode + 'ModeTab', '- 설정 탭이 아직 생성되지 않음');
            return;
        }
        
        activeTab.classList.remove('border-transparent', 'text-gray-500');
        activeTab.classList.add('border-blue-500', 'text-blue-600');
        
        // Content switching
        const excelMode = document.getElementById('excelMode');
        const manualMode = document.getElementById('manualMode');
        
        if (!excelMode || !manualMode) {
            console.error('Mode containers not found');
            return;
        }
        
        excelMode.style.display = mode === 'excel' ? 'block' : 'none';
        manualMode.style.display = mode === 'manual' ? 'block' : 'none';
        
        console.log('Organization mode switched successfully to:', mode);
    } catch (error) {
        console.error('Error switching organization mode:', error);
    }
}

// 조직도 렌더링
function renderOrganizationChart() {
    const container = document.getElementById('orgChartList');
    const emptyMessage = document.getElementById('emptyOrgMessage');
    
    if (!container) {
        console.warn('orgChartList container not found - 설정 탭이 아직 생성되지 않음');
        return;
    }

    if (!emptyMessage) {
        console.warn('emptyOrgMessage container not found - 설정 탭이 아직 생성되지 않음');
        return;
    }

    // 조직 데이터가 있는지 확인
    const hasOrgs = Object.keys(organizationData).length > 0;
    
    if (hasOrgs) {
        emptyMessage.style.display = 'none';
        container.style.display = 'block';
        container.innerHTML = '';
        
        // 부서별로 그룹화
        const departments = {};
        
        Object.values(organizationData).forEach(org => {
            if (org.type === 'department') {
                if (!departments[org.name]) {
                    departments[org.name] = {
                        info: org,
                        teams: {},
                        members: org.members || []
                    };
                }
            } else if (org.type === 'team') {
                const deptName = org.department || '기타';
                if (!departments[deptName]) {
                    departments[deptName] = { teams: {}, members: [] };
                }
                if (!departments[deptName].teams[org.name]) {
                    departments[deptName].teams[org.name] = {
                        info: org,
                        members: org.members || []
                    };
                }
            }
        });
        
        // 부서별로 렌더링
        Object.keys(departments).forEach(deptName => {
            const deptElement = createDepartmentElement(deptName, departments[deptName]);
            container.appendChild(deptElement);
        });
    } else {
        emptyMessage.style.display = 'block';
        container.style.display = 'none';
    }
}

// 부서 요소 생성
function createDepartmentElement(deptName, deptData) {
    const div = document.createElement('div');
    div.className = 'org-department bg-white border border-gray-200 rounded-lg p-4 mb-4';
    
    let membersHtml = '';
    if (deptData.members && deptData.members.length > 0) {
        membersHtml = deptData.members.map(member => `
            <div class="flex items-center justify-between py-2 px-3 bg-blue-50 rounded border-l-4 border-blue-400">
                <div class="flex-1">
                    <span class="font-medium text-gray-900">${member.name || '이름없음'}</span>
                    <span class="text-sm text-gray-600 ml-2">${member.position || ''}</span>
                    ${member.email ? `<div class="text-xs text-gray-500">${member.email}</div>` : ''}
                </div>
                <div class="flex space-x-1">
                    <button onclick="editMember('${deptName}', '${member.id}')" 
                            class="text-blue-600 hover:text-blue-800 text-xs"
                            title="구성원 정보 수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="moveMember('${deptName}', '${member.id}')" 
                            class="text-green-600 hover:text-green-800 text-xs"
                            title="다른 부서/팀으로 이동">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button onclick="deleteMember('${deptName}', '${member.id}')" 
                            class="text-red-600 hover:text-red-800 text-xs"
                            title="구성원 삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    let teamsHtml = '';
    if (deptData.teams && Object.keys(deptData.teams).length > 0) {
        teamsHtml = Object.keys(deptData.teams).map(teamName => {
            const teamData = deptData.teams[teamName];
            const teamMembersHtml = teamData.members.map(member => `
                <div class="flex items-center justify-between py-2 px-3 bg-green-50 rounded border-l-4 border-green-400 ml-4">
                    <div class="flex-1">
                        <span class="font-medium text-gray-900">${member.name || '이름없음'}</span>
                        <span class="text-sm text-gray-600 ml-2">${member.position || ''}</span>
                        ${member.email ? `<div class="text-xs text-gray-500">${member.email}</div>` : ''}
                    </div>
                    <div class="flex space-x-1">
                        <button onclick="editMember('${teamName}', '${member.id}')" 
                                class="text-blue-600 hover:text-blue-800 text-xs"
                                title="구성원 정보 수정">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="moveMember('${teamName}', '${member.id}')" 
                                class="text-green-600 hover:text-green-800 text-xs"
                                title="다른 부서/팀으로 이동">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button onclick="deleteMember('${teamName}', '${member.id}')" 
                                class="text-red-600 hover:text-red-800 text-xs"
                                title="구성원 삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            
            return `
                <div class="ml-6 mt-2">
                    <div class="flex items-center justify-between py-2 px-3 bg-gray-100 rounded border-l-4 border-gray-400">
                        <h5 class="font-medium text-gray-900">
                            <i class="fas fa-users mr-2 text-green-600"></i>${teamName}
                        </h5>
                        <div class="flex space-x-1">
                            <button onclick="editOrganization('${teamData.info?.id}')" class="text-blue-600 hover:text-blue-800 text-xs">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteOrganization('${teamData.info?.id}')" class="text-red-600 hover:text-red-800 text-xs">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${teamMembersHtml}
                </div>
            `;
        }).join('');
    }
    
    div.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <h4 class="text-lg font-semibold text-gray-900">
                <i class="fas fa-building mr-2 text-blue-600"></i>${deptName}
            </h4>
            <div class="flex space-x-1">
                <button onclick="editOrganization('${deptData.info?.id}')" class="text-blue-600 hover:text-blue-800 text-sm">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteOrganization('${deptData.info?.id}')" class="text-red-600 hover:text-red-800 text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="space-y-2">
            ${membersHtml}
            ${teamsHtml}
        </div>
    `;
    
    return div;
}

// 조직 편집 (전역 함수)
window.editOrganization = async function(orgId) {
    if (!isAdmin()) {
        showToast('관리자 권한이 필요합니다.', 'error');
        return;
    }
    
    try {
        // API에서 조직 목록 가져오기
        const response = await fetch('/api/organizations');
        const data = await response.json();
        
        if (!data.success) {
            showToast('조직 데이터를 가져올 수 없습니다.', 'error');
            return;
        }
        
        // 해당 조직 찾기
        const org = data.organizations.find(o => o.id === orgId);
        if (!org) {
            showToast('조직 정보를 찾을 수 없습니다.', 'error');
            return;
        }
        
        const typeText = org.type === 'team' ? '팀' : '파트';
        const newName = prompt(`${typeText} 이름을 수정하세요:`, org.name);
        
        if (newName && newName.trim() !== org.name) {
            // API로 조직 정보 수정
            const updateResponse = await fetch(`/api/organizations/${orgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() })
            });
            
            const updateData = await updateResponse.json();
            
            if (updateData.success) {
                // 조직도 새로고침
                if (typeof refreshOrganization === 'function') {
                    refreshOrganization();
                } else if (typeof renderOrganizationChart === 'function') {
                    renderOrganizationChart();
                }
                showToast('조직 정보가 수정되었습니다.', 'success');
            } else {
                showToast(updateData.message || '수정에 실패했습니다.', 'error');
            }
        }
    } catch (error) {
        console.error('조직 수정 오류:', error);
        showToast('조직 수정 중 오류가 발생했습니다.', 'error');
    }
}

// 조직 삭제 (전역 함수)
window.deleteOrganization = async function(orgId) {
    if (!isAdmin()) {
        showToast('관리자 권한이 필요합니다.', 'error');
        return;
    }
    
    try {
        // API에서 조직 목록 가져오기
        const response = await fetch('/api/organizations');
        const data = await response.json();
        
        if (!data.success) {
            showToast('조직 데이터를 가져올 수 없습니다.', 'error');
            return;
        }
        
        // 해당 조직 찾기
        const org = data.organizations.find(o => o.id === orgId);
        if (!org) {
            showToast('조직 정보를 찾을 수 없습니다.', 'error');
            return;
        }
        
        const typeText = org.type === 'team' ? '팀' : '파트';
        if (confirm(`"${org.name}" ${typeText}를 삭제하시겠습니까?`)) {
            // API로 조직 삭제
            const deleteResponse = await fetch(`/api/organizations/${orgId}`, {
                method: 'DELETE'
            });
            
            const deleteData = await deleteResponse.json();
            
            if (deleteData.success) {
                // 조직도 새로고침
                if (typeof refreshOrganization === 'function') {
                    refreshOrganization();
                } else if (typeof renderOrganizationChart === 'function') {
                    renderOrganizationChart();
                }
                showToast('조직이 삭제되었습니다.', 'info');
            } else {
                showToast(deleteData.message || '삭제에 실패했습니다.', 'error');
            }
        }
    } catch (error) {
        console.error('조직 삭제 오류:', error);
        showToast('조직 삭제 중 오류가 발생했습니다.', 'error');
    }
}

console.log('✅ 조직 관리 모듈이 로드되었습니다.');