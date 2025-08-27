/**
 * 클라우드사업본부 업무평가 시스템 - 구성원 관리 모듈
 */

// 구성원 이동 (향상된 버전 - 정보 수정 포함)
function moveMember(orgId, memberId) {
    if (!isAdmin()) {
        showToast('관리자 권한이 필요합니다.', 'error');
        return;
    }
    
    // 현재 구성원 정보 찾기
    let currentMember = null;
    let currentOrgId = null;
    
    Object.keys(organizationData).forEach(id => {
        const org = organizationData[id];
        if (org.members) {
            const member = org.members.find(m => m.id === memberId);
            if (member) {
                currentMember = member;
                currentOrgId = id;
            }
        }
    });
    
    if (!currentMember) {
        showToast('구성원 정보를 찾을 수 없습니다.', 'error');
        return;
    }
    
    // 이동 가능한 조직 목록 생성
    const availableOrgs = Object.values(organizationData).filter(org => org.id !== currentOrgId);
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-backdrop';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">👥 구성원 이동 및 정보 수정</h3>
                <button onclick="closeModal(this)" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form onsubmit="executeMemberMoveWithUpdate(event, '${currentOrgId}', '${memberId}')">
                <div class="space-y-4">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 class="font-medium text-blue-900 mb-2">현재 구성원 정보</h4>
                        <p class="text-sm text-blue-800">이름: ${currentMember.name}</p>
                        <p class="text-sm text-blue-800">현재 소속: ${organizationData[currentOrgId]?.name || '알 수 없음'}</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">이동할 조직 *</label>
                        <select name="targetOrg" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">조직을 선택하세요</option>
                            ${availableOrgs.map(org => 
                                `<option value="${org.id}">${org.name} (${org.type === 'department' ? '부서' : '팀'})</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <hr class="border-gray-200">
                    <h4 class="font-medium text-gray-900">구성원 정보 수정 (선택사항)</h4>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">이름</label>
                            <input type="text" name="memberName" value="${currentMember.name || ''}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">직급</label>
                            <input type="text" name="memberPosition" value="${currentMember.position || ''}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="예: 대리, 과장, 차장">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                        <input type="email" name="memberEmail" value="${currentMember.email || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="example@company.com">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">파트</label>
                            <input type="text" name="memberPart" value="${currentMember.part || ''}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="담당 파트/업무">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">입사일</label>
                            <input type="date" name="memberJoinDate" value="${formatDate(currentMember.joinDate)}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">비고</label>
                        <textarea name="memberNotes" rows="3" 
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="추가 정보나 특이사항">${currentMember.notes || ''}</textarea>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" onclick="closeModal(this)" 
                            class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                        취소
                    </button>
                    <button type="submit" 
                            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        <i class="fas fa-exchange-alt mr-2"></i>이동 및 수정
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.querySelector('select[name="targetOrg"]').focus();
}

// 구성원 이동 및 정보 업데이트 실행
function executeMemberMoveWithUpdate(event, fromOrgId, memberId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const targetOrgId = formData.get('targetOrg');
    if (!targetOrgId) {
        showToast('이동할 조직을 선택해주세요.', 'warning');
        return;
    }
    
    // 현재 구성원 찾기 및 제거
    const fromOrg = organizationData[fromOrgId];
    const memberIndex = fromOrg.members.findIndex(m => m.id === memberId);
    
    if (memberIndex === -1) {
        showToast('구성원을 찾을 수 없습니다.', 'error');
        return;
    }
    
    const member = fromOrg.members[memberIndex];
    
    // 구성원 정보 업데이트
    const newName = formData.get('memberName').trim();
    const newPosition = formData.get('memberPosition').trim();
    const newEmail = formData.get('memberEmail').trim();
    const newPart = formData.get('memberPart').trim();
    const newJoinDate = formData.get('memberJoinDate');
    const newNotes = formData.get('memberNotes').trim();
    
    if (newName) member.name = newName;
    if (newPosition) member.position = newPosition;
    if (newEmail) member.email = newEmail;
    if (newPart) member.part = newPart;
    if (newJoinDate) member.joinDate = newJoinDate;
    if (newNotes) member.notes = newNotes;
    
    // 업데이트 시간 기록
    member.lastUpdated = new Date().toISOString();
    
    // 기존 조직에서 제거
    fromOrg.members.splice(memberIndex, 1);
    
    // 새 조직에 추가
    const targetOrg = organizationData[targetOrgId];
    if (!targetOrg.members) {
        targetOrg.members = [];
    }
    targetOrg.members.push(member);
    
    // 저장 및 UI 업데이트
    saveToStorage();
    renderOrganizationChart();
    closeModal(event.target);
    
    showToast(`${member.name}님이 ${targetOrg.name}으로 이동되었습니다.`, 'success');
}

// 구성원 편집
function editMember(orgId, memberId) {
    if (!isAdmin()) {
        showToast('관리자 권한이 필요합니다.', 'error');
        return;
    }
    
    // 구성원 찾기
    let member = null;
    let targetOrg = null;
    
    Object.values(organizationData).forEach(org => {
        if (org.members) {
            const found = org.members.find(m => m.id === memberId);
            if (found) {
                member = found;
                targetOrg = org;
            }
        }
    });
    
    if (!member) {
        showToast('구성원을 찾을 수 없습니다.', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-backdrop';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">👤 구성원 정보 수정</h3>
                <button onclick="closeModal(this)" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form onsubmit="updateMemberInfo(event, '${targetOrg.id}', '${memberId}')">
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
                            <input type="text" name="memberName" value="${member.name || ''}" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">직급</label>
                            <input type="text" name="memberPosition" value="${member.position || ''}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="예: 대리, 과장, 차장">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                        <input type="email" name="memberEmail" value="${member.email || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="example@company.com">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">파트</label>
                            <input type="text" name="memberPart" value="${member.part || ''}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="담당 파트/업무">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">입사일</label>
                            <input type="date" name="memberJoinDate" value="${formatDate(member.joinDate)}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">비고</label>
                        <textarea name="memberNotes" rows="3" 
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="추가 정보나 특이사항">${member.notes || ''}</textarea>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" onclick="closeModal(this)" 
                            class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                        취소
                    </button>
                    <button type="submit" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <i class="fas fa-save mr-2"></i>저장
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.querySelector('input[name="memberName"]').focus();
}

// 구성원 정보 업데이트
function updateMemberInfo(event, orgId, memberId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const org = organizationData[orgId];
    const member = org.members.find(m => m.id === memberId);
    
    if (!member) {
        showToast('구성원을 찾을 수 없습니다.', 'error');
        return;
    }
    
    // 정보 업데이트
    member.name = formData.get('memberName').trim();
    member.position = formData.get('memberPosition').trim();
    member.email = formData.get('memberEmail').trim();
    member.part = formData.get('memberPart').trim();
    member.joinDate = formData.get('memberJoinDate');
    member.notes = formData.get('memberNotes').trim();
    member.lastUpdated = new Date().toISOString();
    
    saveToStorage();
    renderOrganizationChart();
    closeModal(event.target);
    
    showToast('구성원 정보가 수정되었습니다.', 'success');
}

// 구성원 삭제
function deleteMember(orgId, memberId) {
    if (!isAdmin()) {
        showToast('관리자 권한이 필요합니다.', 'error');
        return;
    }
    
    const org = organizationData[orgId];
    const memberIndex = org.members.findIndex(m => m.id === memberId);
    
    if (memberIndex === -1) {
        showToast('구성원을 찾을 수 없습니다.', 'error');
        return;
    }
    
    const member = org.members[memberIndex];
    
    if (confirm(`${member.name}님을 조직에서 제거하시겠습니까?`)) {
        org.members.splice(memberIndex, 1);
        saveToStorage();
        renderOrganizationChart();
        showToast(`${member.name}님이 제거되었습니다.`, 'info');
    }
}

console.log('✅ 구성원 관리 모듈이 로드되었습니다.');