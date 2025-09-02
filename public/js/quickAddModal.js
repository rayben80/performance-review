// 빠른 추가 모달 관리 모듈
const QuickAddModal = (function() {
    'use strict';
    
    // 모달 HTML 템플릿
    const modalHTML = `
        <!-- 🎨 현대적 카드형 빠른 추가 모달 -->
        <div id="quickAddModal" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-50 animate-fadeIn backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-slideUp transform transition-all duration-300">
                
                <!-- 모달 헤더 with Progress Indicator -->
                <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 relative overflow-hidden">
                    <!-- 배경 패턴 -->
                    <div class="absolute inset-0 opacity-10">
                        <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
                    </div>
                    
                    <div class="flex items-center justify-between relative z-10">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center animate-pulse">
                                <i class="fas fa-plus text-white text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-white" id="quickAddTitle">평가 항목 빠른 추가</h3>
                                <p class="text-blue-100 text-sm" id="quickAddSubtitle">새로운 평가 항목을 생성합니다</p>
                            </div>
                        </div>
                        <button onclick="QuickAddModal.close()" class="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all hover:rotate-90 duration-300">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>
                    
                    <!-- 입력 진행도 표시 바 -->
                    <div class="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-20">
                        <div id="quickAddProgressBar" class="h-full bg-white transition-all duration-500" style="width: 0%"></div>
                    </div>
                </div>
                
                <!-- 모달 콘텐츠 -->
                <div class="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <form id="quickAddForm" class="space-y-8">
                        <input type="hidden" id="quickAddType">
                        <input type="hidden" id="quickAddItemId">
                        
                        <!-- 📋 기본 정보 카드 -->
                        <div class="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 group">
                            <div class="flex items-center mb-4">
                                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                    <i class="fas fa-info text-blue-600 text-sm"></i>
                                </div>
                                <h4 class="text-lg font-semibold text-gray-900">기본 정보</h4>
                                <span class="ml-auto text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i class="fas fa-lightbulb text-yellow-500 mr-1"></i>
                                    필수 항목을 모두 입력해주세요
                                </span>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="space-y-2 relative">
                                    <label class="block text-sm font-medium text-gray-700 flex items-center">
                                        평가 항목명 <span class="text-red-500">*</span>
                                        <span class="ml-2 text-gray-400 hover:text-gray-600 cursor-help group relative">
                                            <i class="fas fa-question-circle text-xs"></i>
                                            <span class="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg whitespace-nowrap z-10">
                                                명확하고 구체적인 평가 항목명을 입력하세요
                                                <span class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-4 border-transparent border-t-gray-800"></span>
                                            </span>
                                        </span>
                                    </label>
                                    <div class="relative">
                                        <input type="text" id="quickAddName" 
                                               class="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                                               placeholder="예: 월별 매출 달성률" 
                                               oninput="QuickAddModal.updateProgress()"
                                               required>
                                        <span id="quickAddNameCheck" class="absolute right-3 top-1/2 transform -translate-y-1/2 hidden">
                                            <i class="fas fa-check-circle text-green-500"></i>
                                        </span>
                                    </div>
                                    <div class="text-xs text-gray-500 hidden" id="quickAddNameFeedback"></div>
                                </div>
                                
                                <div class="space-y-2 relative">
                                    <label class="block text-sm font-medium text-gray-700 flex items-center">
                                        카테고리 <span class="text-red-500">*</span>
                                        <span class="ml-2 text-gray-400 hover:text-gray-600 cursor-help group relative">
                                            <i class="fas fa-question-circle text-xs"></i>
                                            <span class="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg whitespace-nowrap z-10">
                                                평가 항목이 속할 카테고리를 입력하세요
                                                <span class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-4 border-transparent border-t-gray-800"></span>
                                            </span>
                                        </span>
                                    </label>
                                    <div class="relative">
                                        <input type="text" id="quickAddCategory" 
                                               class="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                                               placeholder="예: 매출 성과, 업무 역량" 
                                               oninput="QuickAddModal.updateProgress()"
                                               required>
                                        <span id="quickAddCategoryCheck" class="absolute right-3 top-1/2 transform -translate-y-1/2 hidden">
                                            <i class="fas fa-check-circle text-green-500"></i>
                                        </span>
                                    </div>
                                    <div class="text-xs text-gray-500 hidden" id="quickAddCategoryFeedback"></div>
                                </div>
                            </div>
                            
                            <div class="mt-6 space-y-2">
                                <label class="block text-sm font-medium text-gray-700">
                                    상세 설명 <span class="text-red-500">*</span>
                                </label>
                                <div class="relative">
                                    <textarea id="quickAddDescription" 
                                              class="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none" 
                                              rows="3" 
                                              placeholder="평가 항목에 대한 구체적인 설명을 입력하세요" 
                                              oninput="QuickAddModal.updateProgress()"
                                              required></textarea>
                                    <span id="quickAddDescriptionCheck" class="absolute right-3 top-3 hidden">
                                        <i class="fas fa-check-circle text-green-500"></i>
                                    </span>
                                </div>
                                <div class="text-xs text-gray-500 hidden" id="quickAddDescriptionFeedback"></div>
                            </div>
                        </div>
                        
                        <!-- ⚙️ 평가 설정 카드 -->
                        <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-300 group">
                            <div class="flex items-center mb-4">
                                <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 group-hover:rotate-180 transition-all duration-500">
                                    <i class="fas fa-cog text-purple-600 text-sm"></i>
                                </div>
                                <h4 class="text-lg font-semibold text-gray-900">평가 설정</h4>
                                <span class="ml-auto text-xs text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i class="fas fa-sliders-h mr-1"></i>
                                    평가 기준을 설정하세요
                                </span>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div class="space-y-2" id="quickAddPointsSection">
                                    <label class="block text-sm font-medium text-gray-700">
                                        배점 <span class="text-red-500">*</span>
                                    </label>
                                    <div class="relative">
                                        <input type="number" id="quickAddPoints" 
                                               class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" 
                                               min="1" max="100" value="30" required>
                                        <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">점</div>
                                    </div>
                                    <div class="text-xs text-purple-600">1-100점 사이로 입력하세요</div>
                                </div>

                                <div class="space-y-2 hidden" id="quickAddScaleSection">
                                    <label class="block text-sm font-medium text-gray-700">
                                        평가 방식 <span class="text-red-500">*</span>
                                    </label>
                                    <select id="quickAddScale" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors">
                                        <option value="1-5">1-5점 척도</option>
                                        <option value="1-10">1-10점 척도</option>
                                        <option value="ABCD">A-B-C-D 등급</option>
                                    </select>
                                </div>
                                
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">
                                        적용 주기 <span class="text-red-500">*</span>
                                    </label>
                                    <select id="quickAddPeriod" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" required>
                                        <option value="monthly">월별</option>
                                        <option value="quarterly">분기별</option>
                                        <option value="semi-annual">반기별</option>
                                        <option value="annual">연간</option>
                                    </select>
                                </div>
                                
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">
                                        적용 범위 <span class="text-red-500">*</span>
                                    </label>
                                    <select id="quickAddScope" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" required>
                                        <option value="individual">개인</option>
                                        <option value="part">파트</option>
                                        <option value="team">팀</option>
                                        <option value="department">본부</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 📏 평가 기준 카드 -->
                        <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-300 group">
                            <div class="flex items-center mb-4">
                                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                    <i class="fas fa-ruler text-green-600 text-sm"></i>
                                </div>
                                <h4 class="text-lg font-semibold text-gray-900">평가 기준</h4>
                                <span class="ml-auto text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i class="fas fa-chart-line mr-1"></i>
                                    구체적인 평가 기준을 제시하세요
                                </span>
                            </div>
                            
                            <div class="space-y-6">
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">
                                        평가 가이드 <span class="text-red-500">*</span>
                                    </label>
                                    <div class="relative">
                                        <textarea id="quickAddGuide" 
                                                  class="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none" 
                                                  rows="2" 
                                                  placeholder="평가 방법과 기준에 대한 가이드를 작성하세요" 
                                                  oninput="QuickAddModal.updateProgress()"
                                                  required></textarea>
                                        <span id="quickAddGuideCheck" class="absolute right-3 top-3 hidden">
                                            <i class="fas fa-check-circle text-green-500"></i>
                                        </span>
                                    </div>
                                    <div class="text-xs text-green-600">평가자가 참고할 수 있는 구체적인 가이드를 제공하세요</div>
                                </div>
                                
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">
                                        점수 기준 <span class="text-red-500">*</span>
                                    </label>
                                    <div class="relative">
                                        <textarea id="quickAddScoreStandard" 
                                                  class="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none" 
                                                  rows="4" 
                                                  placeholder="점수별 달성 기준을 구체적으로 명시하세요&#10;예: 30점: 110% 이상 달성&#10;    25점: 100-109% 달성&#10;    20점: 90-99% 달성" 
                                                  oninput="QuickAddModal.updateProgress()"
                                                  required></textarea>
                                        <span id="quickAddScoreStandardCheck" class="absolute right-3 top-3 hidden">
                                            <i class="fas fa-check-circle text-green-500"></i>
                                        </span>
                                    </div>
                                    <div class="text-xs text-green-600">각 점수 구간별로 명확한 달성 기준을 설정하세요</div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                
                <!-- 모달 푸터 -->
                <div class="bg-gray-50 px-8 py-6 border-t border-gray-200 flex items-center justify-between">
                    <div class="text-sm text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>
                        모든 필수 항목(*)을 입력해주세요
                    </div>
                    
                    <div class="flex space-x-3">
                        <button type="button" onclick="QuickAddModal.close()" 
                                class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300">
                            <i class="fas fa-times mr-2"></i>취소
                        </button>
                        <button type="submit" form="quickAddForm" id="quickAddSubmitBtn"
                                class="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
                            <i class="fas fa-save mr-2"></i>저장하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 모달 초기화
    function init() {
        console.log('🚀 QuickAddModal 초기화 시작');
        
        // 모달이 이미 있는지 확인
        if (document.getElementById('quickAddModal')) {
            console.log('✅ 모달이 이미 존재합니다.');
            return;
        }
        
        // 모달 HTML을 body에 추가
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // 폼 제출 이벤트 리스너 추가
        const form = document.getElementById('quickAddForm');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }
        
        console.log('✅ QuickAddModal 초기화 완료');
    }
    
    // 정량평가 빠른 추가
    function openQuantitative() {
        console.log('📊 정량평가 빠른 추가 열기');
        
        const modal = document.getElementById('quickAddModal');
        if (!modal) {
            console.error('❌ 모달을 찾을 수 없습니다. 초기화를 먼저 실행하세요.');
            init(); // 모달이 없으면 초기화
            return openQuantitative(); // 재귀 호출
        }
        
        // 타입 및 기본값 설정
        document.getElementById('quickAddType').value = 'quantitative';
        document.getElementById('quickAddItemId').value = '';
        
        // 헤더 업데이트
        document.getElementById('quickAddTitle').textContent = '정량평가 항목 빠른 추가';
        document.getElementById('quickAddSubtitle').textContent = '수치로 측정 가능한 평가 항목을 생성합니다';
        
        // 폼 초기화
        resetForm();
        
        // 정량평가 설정
        document.getElementById('quickAddPointsSection').style.display = 'block';
        document.getElementById('quickAddScaleSection').classList.add('hidden');
        
        // placeholder 설정
        document.getElementById('quickAddName').placeholder = '예: 월별 매출 달성률, KPI 달성도';
        document.getElementById('quickAddCategory').placeholder = '예: 매출 성과, 업무 효율성';
        
        // 모달 표시
        showModal();
    }
    
    // 정성평가 빠른 추가
    function openQualitative() {
        console.log('📊 정성평가 빠른 추가 열기');
        
        const modal = document.getElementById('quickAddModal');
        if (!modal) {
            console.error('❌ 모달을 찾을 수 없습니다. 초기화를 먼저 실행하세요.');
            init();
            return openQualitative();
        }
        
        // 타입 및 기본값 설정
        document.getElementById('quickAddType').value = 'qualitative';
        document.getElementById('quickAddItemId').value = '';
        
        // 헤더 업데이트
        document.getElementById('quickAddTitle').textContent = '정성평가 항목 빠른 추가';
        document.getElementById('quickAddSubtitle').textContent = '주관적 판단이 필요한 평가 항목을 생성합니다';
        
        // 폼 초기화
        resetForm();
        
        // 정성평가 설정
        document.getElementById('quickAddPointsSection').style.display = 'block';
        document.getElementById('quickAddScaleSection').classList.remove('hidden');
        
        // placeholder 설정
        document.getElementById('quickAddName').placeholder = '예: 리더십, 협업 능력';
        document.getElementById('quickAddCategory').placeholder = '예: 역량 평가, 태도';
        
        // 모달 표시
        showModal();
    }
    
    // 모달 표시
    function showModal() {
        const modal = document.getElementById('quickAddModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // 첫 번째 필드에 포커스
        setTimeout(() => {
            const nameField = document.getElementById('quickAddName');
            if (nameField) {
                nameField.focus();
            }
        }, 100);
    }
    
    // 모달 닫기
    function close() {
        const modal = document.getElementById('quickAddModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        resetForm();
    }
    
    // 폼 초기화
    function resetForm() {
        document.getElementById('quickAddName').value = '';
        document.getElementById('quickAddCategory').value = '';
        document.getElementById('quickAddDescription').value = '';
        document.getElementById('quickAddPoints').value = '30';
        document.getElementById('quickAddPeriod').value = 'monthly';
        document.getElementById('quickAddScope').value = 'individual';
        document.getElementById('quickAddGuide').value = '';
        document.getElementById('quickAddScoreStandard').value = '';
        document.getElementById('quickAddProgressBar').style.width = '0%';
        
        // 체크 아이콘 숨기기
        document.querySelectorAll('[id$="Check"]').forEach(el => {
            el.classList.add('hidden');
        });
    }
    
    // 프로그레스 업데이트
    function updateProgress() {
        const fields = [
            'quickAddName',
            'quickAddCategory',
            'quickAddDescription',
            'quickAddGuide',
            'quickAddScoreStandard'
        ];
        
        let filledCount = 0;
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.value.trim()) {
                filledCount++;
                // 체크 아이콘 표시
                const checkIcon = document.getElementById(fieldId + 'Check');
                if (checkIcon) {
                    checkIcon.classList.remove('hidden');
                }
            } else {
                // 체크 아이콘 숨김
                const checkIcon = document.getElementById(fieldId + 'Check');
                if (checkIcon) {
                    checkIcon.classList.add('hidden');
                }
            }
        });
        
        // 프로그레스 바 업데이트
        const progress = (filledCount / fields.length) * 100;
        const progressBar = document.getElementById('quickAddProgressBar');
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    }
    
    // 폼 제출 처리
    async function handleSubmit(e) {
        e.preventDefault();
        
        const submitButton = document.getElementById('quickAddSubmitBtn');
        const originalButtonText = submitButton.innerHTML;
        
        try {
            // 로딩 상태
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>저장하는 중...';
            submitButton.disabled = true;
            
            // 폼 데이터 수집
            const formData = {
                name: document.getElementById('quickAddName').value.trim(),
                type: document.getElementById('quickAddType').value,
                category: document.getElementById('quickAddCategory').value.trim(),
                description: document.getElementById('quickAddDescription').value.trim(),
                points: parseInt(document.getElementById('quickAddPoints').value),
                period: document.getElementById('quickAddPeriod').value,
                scope: document.getElementById('quickAddScope').value,
                guide: document.getElementById('quickAddGuide').value.trim(),
                scoreStandard: document.getElementById('quickAddScoreStandard').value.trim(),
                createdBy: JSON.parse(localStorage.getItem('user') || '{}').name || 'System'
            };
            
            console.log('📤 평가 항목 생성 요청:', formData);
            
            // API 호출
            const response = await fetch('/api/evaluation-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ 평가 항목 생성 성공:', result.item);
                
                // 성공 애니메이션
                submitButton.innerHTML = '<i class="fas fa-check mr-2"></i>저장 완료!';
                submitButton.classList.add('bg-green-500');
                
                setTimeout(() => {
                    close();
                    // 그리드 새로고침 (만약 함수가 있다면)
                    if (typeof loadEvaluationItemsGrid === 'function') {
                        loadEvaluationItemsGrid();
                    }
                    if (typeof showNotification === 'function') {
                        showNotification(`🎉 ${formData.name} 항목이 성공적으로 추가되었습니다!`, 'success');
                    }
                }, 800);
            } else {
                console.error('❌ 평가 항목 생성 실패:', result.message);
                if (typeof showNotification === 'function') {
                    showNotification(`저장 실패: ${result.message}`, 'error');
                } else {
                    alert(`저장 실패: ${result.message}`);
                }
            }
        } catch (error) {
            console.error('❌ 오류:', error);
            if (typeof showNotification === 'function') {
                showNotification('저장 중 오류가 발생했습니다.', 'error');
            } else {
                alert('저장 중 오류가 발생했습니다.');
            }
        } finally {
            // 버튼 복원
            setTimeout(() => {
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
                submitButton.classList.remove('bg-green-500');
            }, 1000);
        }
    }
    
    // Public API
    return {
        init: init,
        openQuantitative: openQuantitative,
        openQualitative: openQualitative,
        close: close,
        updateProgress: updateProgress
    };
})();

// 페이지 로드 시 자동 초기화
document.addEventListener('DOMContentLoaded', function() {
    QuickAddModal.init();
});

// 전역 함수로 등록 (기존 코드와의 호환성)
window.quickAddQuantitativeItem = function() {
    QuickAddModal.openQuantitative();
};

window.quickAddQualitativeItem = function() {
    QuickAddModal.openQualitative();
};

window.closeQuickAddModal = function() {
    QuickAddModal.close();
};

window.updateFormProgress = function() {
    QuickAddModal.updateProgress();
};