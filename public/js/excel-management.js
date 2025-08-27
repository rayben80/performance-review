/**
 * 클라우드사업본부 업무평가 시스템 - 엑셀 관리 모듈
 */

// 조직도 템플릿 다운로드
function downloadOrgTemplate() {
    if (!isAdmin()) {
        showToast('관리자 권한이 필요합니다.', 'error');
        return;
    }
    
    // 빈 조직도 템플릿 생성
    const templateData = [
        {
            '부서': '영업본부',
            '팀': '영업1팀',
            '파트': '영업파트',
            '이름': '김영업',
            '직급': '대리',
            '이메일': 'sales@company.com',
            '입사일': '2023-01-01',
            '비고': ''
        },
        {
            '부서': '고객지원팀',
            '팀': '고객서비스팀',
            '파트': '고객서비스파트',
            '이름': '이서비스',
            '직급': '사원',
            '이메일': 'service@company.com',
            '입사일': '2023-06-01',
            '비고': ''
        },
        {
            '부서': '',
            '팀': '',
            '파트': '',
            '이름': '',
            '직급': '',
            '이메일': '',
            '입사일': '',
            '비고': ''
        }
    ];
    
    exportToExcel(templateData, '조직도_템플릿.xlsx');
    showToast('조직도 템플릿이 다운로드되었습니다.', 'success');
}

// 현재 조직도 엑셀 다운로드
function downloadCurrentOrg() {
    if (!isAdmin()) {
        showToast('관리자 권한이 필요합니다.', 'error');
        return;
    }
    
    // 현재 조직 데이터를 엑셀 형식으로 변환
    const orgArray = [];
    
    Object.values(organizationData).forEach(unit => {
        if (unit.members && unit.members.length > 0) {
            unit.members.forEach(member => {
                orgArray.push({
                    '부서': unit.type === 'department' ? unit.name : (unit.department || ''),
                    '팀': unit.type === 'team' ? unit.name : '',
                    '파트': member.part || '',
                    '이름': member.name || '',
                    '직급': member.position || '',
                    '이메일': member.email || '',
                    '입사일': member.joinDate || '',
                    '비고': member.notes || ''
                });
            });
        } else if (unit.type === 'department' || unit.type === 'team') {
            // 구성원이 없는 조직도 빈 행으로 추가
            orgArray.push({
                '부서': unit.type === 'department' ? unit.name : (unit.department || ''),
                '팀': unit.type === 'team' ? unit.name : '',
                '파트': '',
                '이름': '',
                '직급': '',
                '이메일': '',
                '입사일': '',
                '비고': ''
            });
        }
    });
    
    if (orgArray.length === 0) {
        showToast('다운로드할 조직 데이터가 없습니다.', 'warning');
        return;
    }
    
    const currentDate = new Date().toISOString().split('T')[0];
    exportToExcel(orgArray, `조직도_${currentDate}.xlsx`);
    showToast('현재 조직도가 다운로드되었습니다.', 'success');
}

// 엑셀 파일 업로드 처리
function uploadOrgChart(input) {
    if (!isAdmin()) {
        showToast('관리자 권한이 필요합니다.', 'error');
        return;
    }
    
    const file = input.files[0];
    if (!file) return;
    
    // 파일 형식 확인
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(file.type)) {
        showToast('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.', 'error');
        input.value = '';
        return;
    }
    
    // 파일 크기 확인 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
        showToast('파일 크기는 10MB 이하여야 합니다.', 'error');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 첫 번째 시트 읽기
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            if (jsonData.length < 2) {
                showToast('유효한 데이터가 없습니다.', 'error');
                return;
            }
            
            // 헤더 확인
            const headers = jsonData[0];
            const requiredHeaders = ['부서', '팀', '이름'];
            const hasRequiredHeaders = requiredHeaders.every(header => 
                headers.some(h => h && h.toString().includes(header))
            );
            
            if (!hasRequiredHeaders) {
                showToast('필수 컬럼(부서, 팀, 이름)이 없습니다.', 'error');
                return;
            }
            
            // 데이터 변환 및 저장
            processExcelData(jsonData);
            showToast('조직도가 성공적으로 업로드되었습니다.', 'success');
            
        } catch (error) {
            console.error('Excel parsing error:', error);
            showToast('엑셀 파일을 읽는 중 오류가 발생했습니다.', 'error');
        }
        
        // 파일 입력 초기화
        input.value = '';
    };
    
    reader.readAsArrayBuffer(file);
}

// 엑셀 데이터 처리 및 조직 데이터로 변환
function processExcelData(jsonData) {
    const headers = jsonData[0];
    const rows = jsonData.slice(1);
    
    // 헤더 인덱스 매핑
    const headerMap = {};
    headers.forEach((header, index) => {
        if (header) {
            const headerStr = header.toString().trim();
            if (headerStr.includes('부서')) headerMap.department = index;
            if (headerStr.includes('팀')) headerMap.team = index;
            if (headerStr.includes('파트')) headerMap.part = index;
            if (headerStr.includes('이름')) headerMap.name = index;
            if (headerStr.includes('직급')) headerMap.position = index;
            if (headerStr.includes('이메일')) headerMap.email = index;
            if (headerStr.includes('입사일')) headerMap.joinDate = index;
            if (headerStr.includes('비고')) headerMap.notes = index;
        }
    });
    
    // 기존 조직 데이터 백업 (필요시 복구용)
    const backupData = { ...organizationData };
    
    try {
        // 새로운 조직 데이터 구조 생성
        const newOrgData = {};
        const departments = new Set();
        const teams = new Set();
        
        // 행별 데이터 처리
        rows.forEach((row, index) => {
            if (!row || row.length === 0) return;
            
            const deptName = getCellValue(row, headerMap.department);
            const teamName = getCellValue(row, headerMap.team);
            const memberName = getCellValue(row, headerMap.name);
            
            // 부서 생성
            if (deptName && !departments.has(deptName)) {
                const deptId = generateId('dept');
                newOrgData[deptId] = {
                    id: deptId,
                    name: deptName,
                    type: 'department',
                    members: [],
                    createdAt: new Date().toISOString()
                };
                departments.add(deptName);
            }
            
            // 팀 생성
            if (teamName && !teams.has(teamName)) {
                const teamId = generateId('team');
                newOrgData[teamId] = {
                    id: teamId,
                    name: teamName,
                    type: 'team',
                    department: deptName,
                    members: [],
                    createdAt: new Date().toISOString()
                };
                teams.add(teamName);
            }
            
            // 구성원 추가
            if (memberName) {
                const member = {
                    id: generateId('member'),
                    name: memberName,
                    position: getCellValue(row, headerMap.position) || '',
                    email: getCellValue(row, headerMap.email) || '',
                    part: getCellValue(row, headerMap.part) || '',
                    joinDate: formatExcelDate(getCellValue(row, headerMap.joinDate)),
                    notes: getCellValue(row, headerMap.notes) || '',
                    createdAt: new Date().toISOString()
                };
                
                // 팀이 있으면 팀에, 없으면 부서에 추가
                let targetOrgId = null;
                if (teamName) {
                    targetOrgId = Object.keys(newOrgData).find(id => 
                        newOrgData[id].type === 'team' && newOrgData[id].name === teamName
                    );
                } else if (deptName) {
                    targetOrgId = Object.keys(newOrgData).find(id => 
                        newOrgData[id].type === 'department' && newOrgData[id].name === deptName
                    );
                }
                
                if (targetOrgId) {
                    newOrgData[targetOrgId].members.push(member);
                }
            }
        });
        
        // 조직 데이터 업데이트
        organizationData = newOrgData;
        saveToStorage();
        renderOrganizationChart();
        
    } catch (error) {
        console.error('Error processing excel data:', error);
        // 오류 발생시 백업 데이터로 복구
        organizationData = backupData;
        showToast('데이터 처리 중 오류가 발생하여 이전 상태로 복구되었습니다.', 'error');
    }
}

// 셀 값 가져오기 (안전하게)
function getCellValue(row, index) {
    if (index === undefined || index < 0 || index >= row.length) return '';
    const value = row[index];
    return value ? value.toString().trim() : '';
}

// 엑셀 날짜 형식 변환
function formatExcelDate(dateValue) {
    if (!dateValue) return '';
    
    // 숫자인 경우 (엑셀 날짜)
    if (typeof dateValue === 'number') {
        const date = new Date((dateValue - 25569) * 86400 * 1000);
        return formatDate(date);
    }
    
    // 문자열인 경우
    if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            return formatDate(date);
        }
    }
    
    return dateValue.toString();
}

// 엑셀 파일로 내보내기
function exportToExcel(data, filename) {
    try {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '조직도');
        
        // 열 너비 자동 조정
        const colWidths = [];
        const headers = Object.keys(data[0] || {});
        headers.forEach((header, index) => {
            let maxLength = header.length;
            data.forEach(row => {
                const cellLength = (row[header] || '').toString().length;
                if (cellLength > maxLength) {
                    maxLength = cellLength;
                }
            });
            colWidths[index] = { wch: Math.min(maxLength + 2, 30) };
        });
        ws['!cols'] = colWidths;
        
        // 파일 다운로드
        XLSX.writeFile(wb, filename);
        
    } catch (error) {
        console.error('Excel export error:', error);
        showToast('엑셀 파일 생성 중 오류가 발생했습니다.', 'error');
    }
}

console.log('✅ 엑셀 관리 모듈이 로드되었습니다.');