/**
 * 클라우드사업본부 업무평가 시스템 - 유틸리티 함수들
 */

// Toast 메시지 표시 (전역 함수)
window.showToast = function(message, type = 'info') {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-message fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm`;
    
    // 타입별 색상 설정
    const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white', 
        warning: 'bg-yellow-500 text-white',
        info: 'bg-blue-500 text-white'
    };
    
    toast.className += ` ${colors[type] || colors.info}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

// LocalStorage에 데이터 저장
function saveToStorage() {
    try {
        localStorage.setItem('evaluationItems', JSON.stringify(evaluationItems));
        localStorage.setItem('quantitativeItems', JSON.stringify(quantitativeItems));
        localStorage.setItem('qualitativeItems', JSON.stringify(qualitativeItems));
        localStorage.setItem('organizationData', JSON.stringify(organizationData));
        localStorage.setItem('evaluationData', JSON.stringify(evaluationData));
        // 사용자 정보 저장
        if (typeof currentUser !== 'undefined') {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        // 관리자 목록 저장
        if (typeof adminUsers !== 'undefined') {
            localStorage.setItem('adminUsers', JSON.stringify(adminUsers));
        }
        console.log('데이터가 LocalStorage에 저장되었습니다.');
    } catch (error) {
        console.error('LocalStorage 저장 오류:', error);
        showToast('데이터 저장 중 오류가 발생했습니다.', 'error');
    }
}

// LocalStorage에서 데이터 로드
function loadFromStorage() {
    try {
        const savedEvaluationItems = localStorage.getItem('evaluationItems');
        const savedQuantitativeItems = localStorage.getItem('quantitativeItems');
        const savedQualitativeItems = localStorage.getItem('qualitativeItems');
        const savedOrganizationData = localStorage.getItem('organizationData');
        const savedEvaluationData = localStorage.getItem('evaluationData');
        const savedCurrentUser = localStorage.getItem('currentUser');
        const savedAdminUsers = localStorage.getItem('adminUsers');
        
        if (savedEvaluationItems) {
            evaluationItems = JSON.parse(savedEvaluationItems);
        }
        if (savedQuantitativeItems) {
            quantitativeItems = JSON.parse(savedQuantitativeItems);
        }
        if (savedQualitativeItems) {
            qualitativeItems = JSON.parse(savedQualitativeItems);
        }
        if (savedOrganizationData) {
            organizationData = JSON.parse(savedOrganizationData);
        }
        if (savedEvaluationData) {
            evaluationData = JSON.parse(savedEvaluationData);
        }
        // 사용자 정보 로드
        if (savedCurrentUser && typeof currentUser !== 'undefined') {
            const loadedUser = JSON.parse(savedCurrentUser);
            Object.assign(currentUser, loadedUser);
        }
        // 관리자 목록 로드
        if (savedAdminUsers && typeof adminUsers !== 'undefined') {
            adminUsers = JSON.parse(savedAdminUsers);
        }
        
        console.log('데이터가 LocalStorage에서 로드되었습니다.');
    } catch (error) {
        console.error('LocalStorage 로드 오류:', error);
        showToast('데이터 로드 중 오류가 발생했습니다.', 'warning');
    }
}

// 모달 창 닫기
function closeModal(element) {
    const modal = element.closest('.modal-backdrop');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 200);
    }
}

// 날짜 형식 변환 (YYYY-MM-DD)
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

// 시간 형식 변환 (YYYY-MM-DD HH:mm)
function formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16).replace('T', ' ');
}

// 문자열을 ID로 변환 (공백 제거, 특수문자 언더스코어로 변경)
function stringToId(str) {
    return str.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9가-힣_]/g, '_');
}

// 배열에서 중복 제거
function removeDuplicates(arr, key) {
    if (!key) return [...new Set(arr)];
    return arr.filter((item, index, self) => 
        index === self.findIndex(t => t[key] === item[key])
    );
}

// 깊은 복사
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// 랜덤 ID 생성
function generateId(prefix = 'id') {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 파일 크기 포맷팅
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 디바운스 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 스로틀 함수  
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 배열 섞기 (Fisher-Yates shuffle)
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 숫자를 한국어 포맷으로 변환 (1,000)
function formatNumber(num) {
    return new Intl.NumberFormat('ko-KR').format(num);
}

// 텍스트 길이 제한
function truncateText(text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

console.log('✅ 유틸리티 함수가 로드되었습니다.');