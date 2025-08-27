// 설정 탭 클릭 테스트
function testSettingsClick() {
    const settingsBtn = document.querySelector("[onclick*='settings']");
    if (settingsBtn) {
        console.log('Found settings button:', settingsBtn);
        settingsBtn.click();
        console.log('Settings button clicked!');
        
        // 설정 탭이 활성화되었는지 확인
        setTimeout(() => {
            const settingsTab = document.getElementById('settings');
            if (settingsTab && settingsTab.classList.contains('active')) {
                console.log('Settings tab is now active!');
                
                // 관리자 관리 섹션이 있는지 확인
                const adminSection = settingsTab.querySelector('h3:contains("관리자 관리")');
                console.log('Admin management section found:', !!adminSection);
            } else {
                console.log('Settings tab is not active');
            }
        }, 1000);
    } else {
        console.log('Settings button not found');
    }
}

// DOMContentLoaded 이벤트 후 실행
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(testSettingsClick, 3000);
});

console.log('Settings test script loaded');
