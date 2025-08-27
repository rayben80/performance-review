/**
 * 클라우드사업본부 업무평가 시스템 - 수동 입력 모듈
 */

// 부서 추가 모달 표시
function showAddDepartmentModal() {
    if (!isAdmin()) {
        showToast('관리자 권한이 필요합니다.', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-backdrop';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-md w-full p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">🏢 부서 추가</h3>
                <button onclick="closeModal(this)" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form onsubmit="addDepartment(event)">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">부서명 *</label>
                        <input type="text" name="deptName" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="예: 영업본부, 고객지원팀 등">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">설명</label>
                        <textarea name="deptDesc" rows="3"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="부서에 대한 간단한 설명 (선택사항)"></textarea>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" onclick="closeModal(this)" 
                            class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                        취소
                    </button>
                    <button type="submit" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>부서 추가
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.querySelector('input[name="deptName"]').focus();
}

// 팀 추가 모달 표시
function showAddTeamModal() {
    if (!isAdmin()) {
        showToast('관리자 권한이 필요합니다.', 'error');
        return;
    }
    
    // 부서 목록 가져오기
    const departments = Object.values(organizationData).filter(org => org.type === 'department');
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-backdrop';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-md w-full p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">👥 팀 추가</h3>
                <button onclick="closeModal(this)" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form onsubmit="addTeam(event)">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">소속 부서</label>
                        <select name="parentDept" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">부서를 선택하세요 (선택사항)</option>
                            ${departments.map(dept => `<option value="${dept.id}">${dept.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">팀명 *</label>
                        <input type="text" name="teamName" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="예: 영업1팀, 고객서비스팀 등">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">설명</label>
                        <textarea name="teamDesc" rows="3"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="팀에 대한 간단한 설명 (선택사항)"></textarea>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" onclick="closeModal(this)" 
                            class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                        취소
                    </button>
                    <button type="submit" 
                            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        <i class="fas fa-plus mr-2"></i>팀 추가
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.querySelector('input[name="teamName"]').focus();
}

// 구성원 추가 모달 표시
function showAddMemberModal() {
    if (!isAdmin()) {
        showToast('관리자 권한이 필요합니다.', 'error');
        return;
    }
    
    // 부서와 팀 목록 가져오기
    const departments = Object.values(organizationData).filter(org => org.type === 'department');
    const teams = Object.values(organizationData).filter(org => org.type === 'team');
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-backdrop';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">👤 구성원 추가</h3>
                <button onclick="closeModal(this)" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form onsubmit="addMember(event)">
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">소속 부서</label>
                            <select name="memberDept" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">부서 선택 (선택사항)</option>
                                ${departments.map(dept => `<option value="${dept.name}">${dept.name}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">소속 팀</label>
                            <select name="memberTeam" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">팀 선택 (선택사항)</option>
                                ${teams.map(team => `<option value="${team.name}">${team.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
                            <input type="text" name="memberName" required 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="홍길동">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">직급</label>
                            <input type="text" name="memberPosition" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="대리, 과장, 차장 등">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                        <input type="email" name="memberEmail" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="example@company.com">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">파트</label>
                            <input type="text" name="memberPart" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="영업파트, 고객서비스파트 등">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">입사일</label>
                            <input type="date" name="memberJoinDate" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">비고</label>
                        <textarea name="memberNotes" rows="3"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="추가 정보나 특이사항"></textarea>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" onclick="closeModal(this)" 
                            class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                        취소
                    </button>
                    <button type="submit" 
                            class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                        <i class="fas fa-user-plus mr-2"></i>구성원 추가
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.querySelector('input[name="memberName"]').focus();
}

// 부서 추가 처리
function addDepartment(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const newDept = {
        id: generateId('dept'),
        name: formData.get('deptName').trim(),
        description: formData.get('deptDesc').trim(),
        type: 'department',
        members: [],
        createdAt: new Date().toISOString()
    };
    
    organizationData[newDept.id] = newDept;
    saveToStorage();
    renderOrganizationChart();
    closeModal(event.target);
    
    showToast(`"${newDept.name}" 부서가 추가되었습니다.`, 'success');
}

// 팀 추가 처리
function addTeam(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const parentDeptId = formData.get('parentDept');
    let departmentName = '';
    
    if (parentDeptId && organizationData[parentDeptId]) {
        departmentName = organizationData[parentDeptId].name;
    }
    
    const newTeam = {
        id: generateId('team'),
        name: formData.get('teamName').trim(),
        description: formData.get('teamDesc').trim(),
        type: 'team',
        department: departmentName,
        members: [],
        createdAt: new Date().toISOString()
    };
    
    organizationData[newTeam.id] = newTeam;
    saveToStorage();
    renderOrganizationChart();
    closeModal(event.target);
    
    showToast(`"${newTeam.name}" 팀이 추가되었습니다.`, 'success');
}

// 구성원 추가 처리
function addMember(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const memberDept = formData.get('memberDept');
    const memberTeam = formData.get('memberTeam');
    
    // 소속 조직 결정 (팀이 있으면 팀, 없으면 부서)
    let targetOrgId = null;
    
    if (memberTeam) {
        // 팀 이름으로 조직 찾기
        const teamOrg = Object.values(organizationData).find(org => org.type === 'team' && org.name === memberTeam);
        if (teamOrg) {
            targetOrgId = teamOrg.id;
        }
    } else if (memberDept) {
        // 부서 이름으로 조직 찾기
        const deptOrg = Object.values(organizationData).find(org => org.type === 'department' && org.name === memberDept);
        if (deptOrg) {
            targetOrgId = deptOrg.id;
        }
    }
    
    if (!targetOrgId) {
        showToast('소속 부서 또는 팀을 선택해주세요.', 'warning');
        return;
    }
    
    const newMember = {
        id: generateId('member'),
        name: formData.get('memberName').trim(),
        position: formData.get('memberPosition').trim(),
        email: formData.get('memberEmail').trim(),
        part: formData.get('memberPart').trim(),
        joinDate: formData.get('memberJoinDate'),
        notes: formData.get('memberNotes').trim(),
        createdAt: new Date().toISOString()
    };
    
    // 조직에 구성원 추가
    const targetOrg = organizationData[targetOrgId];
    if (!targetOrg.members) {
        targetOrg.members = [];
    }
    targetOrg.members.push(newMember);
    
    saveToStorage();
    renderOrganizationChart();
    closeModal(event.target);
    
    showToast(`"${newMember.name}"님이 ${targetOrg.name}에 추가되었습니다.`, 'success');
}

console.log('✅ 수동 입력 모듈이 로드되었습니다.');