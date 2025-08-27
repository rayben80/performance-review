// 설정 탭 클릭을 시뮬레이션하는 테스트 스크립트
console.log('Testing settings tab functionality...');

// 페이지 로드 후 설정 탭 클릭
setTimeout(() => {
    if (typeof showTab === 'function') {
        showTab('settings');
        console.log('Settings tab clicked successfully');
    } else {
        console.error('showTab function not found');
    }
}, 2000);
