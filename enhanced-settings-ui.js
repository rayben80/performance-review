/**
 * Enhanced Settings UI for Performance Management System
 * 드래그앤드롭 대체 시스템 + 사이드바 패널 + Excel 기능
 */

// Global variables for enhanced UI
let isEnhanced = false;
let sidebarVisible = false;
let currentItemDetails = null;

// Enhanced UI activation function
function enhanceSettingsUI() {
    if (isEnhanced) return;
    
    console.log('🚀 Enhanced UI System Activating...');
    
    // Replace drag handles with arrow buttons
    replaceDragWithArrows();
    
    // Add sidebar panel
    addSidebarPanel();
    
    // Add statistics panel
    addStatisticsPanel();
    
    // Add Excel functionality
    addExcelFunctionality();
    
    // Add animations and transitions
    addAnimations();
    
    // Add keyboard shortcuts
    addKeyboardShortcuts();
    
    isEnhanced = true;
    console.log('✅ Enhanced UI System Activated');
}

// Replace drag-and-drop with arrow button system
function replaceDragWithArrows() {
    const evaluationItems = document.querySelectorAll('.evaluation-item');
    
    evaluationItems.forEach((item, index) => {
        // Remove drag attributes
        item.removeAttribute('draggable');
        
        // Find and replace drag handle
        const dragHandle = item.querySelector('.drag-handle');
        if (dragHandle) {
            dragHandle.className = 'arrow-controls flex flex-col space-y-1';
            dragHandle.innerHTML = `
                <button onclick="moveItemUp(${index})" 
                        class="move-up-btn w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-all duration-200 ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${index === 0 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-up text-xs"></i>
                </button>
                <button onclick="moveItemDown(${index})" 
                        class="move-down-btn w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-all duration-200 ${index === evaluationItems.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${index === evaluationItems.length - 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-down text-xs"></i>
                </button>
            `;
        }
        
        // Add click handler for item details
        const nameInput = item.querySelector('input[type="text"]');
        if (nameInput) {
            nameInput.addEventListener('click', function() {
                showItemDetails(index);
            });
        }
        
        // Add enhanced styling
        item.classList.add('enhanced-item', 'transform', 'transition-all', 'duration-300', 'hover:scale-[1.02]', 'hover:shadow-lg');
    });
}

// Move item up
function moveItemUp(index) {
    if (index <= 0) return;
    
    console.log(`Moving item ${index} up to ${index - 1}`);
    
    // Swap items in array
    const temp = evaluationItems[index];
    evaluationItems[index] = evaluationItems[index - 1];
    evaluationItems[index - 1] = temp;
    
    // Re-render with animation
    animateItemMove('up', index);
    setTimeout(() => {
        renderSettings();
        enhanceSettingsUI(); // Re-apply enhancements
    }, 300);
}

// Move item down
function moveItemDown(index) {
    if (index >= evaluationItems.length - 1) return;
    
    console.log(`Moving item ${index} down to ${index + 1}`);
    
    // Swap items in array
    const temp = evaluationItems[index];
    evaluationItems[index] = evaluationItems[index + 1];
    evaluationItems[index + 1] = temp;
    
    // Re-render with animation
    animateItemMove('down', index);
    setTimeout(() => {
        renderSettings();
        enhanceSettingsUI(); // Re-apply enhancements
    }, 300);
}

// Animate item movement
function animateItemMove(direction, index) {
    const items = document.querySelectorAll('.evaluation-item');
    const currentItem = items[index];
    const targetItem = direction === 'up' ? items[index - 1] : items[index + 1];
    
    if (currentItem && targetItem) {
        // Add moving animation
        currentItem.style.transform = direction === 'up' ? 'translateY(-100%)' : 'translateY(100%)';
        targetItem.style.transform = direction === 'up' ? 'translateY(100%)' : 'translateY(-100%)';
        
        // Reset transforms
        setTimeout(() => {
            currentItem.style.transform = '';
            targetItem.style.transform = '';
        }, 300);
    }
}

// Add sidebar panel
function addSidebarPanel() {
    // Check if sidebar already exists
    if (document.getElementById('enhancedSidebar')) return;
    
    const sidebar = document.createElement('div');
    sidebar.id = 'enhancedSidebar';
    sidebar.className = 'fixed right-0 top-0 h-full w-80 bg-white shadow-2xl transform translate-x-full transition-transform duration-300 z-50 border-l border-gray-200';
    
    sidebar.innerHTML = `
        <div class="h-full flex flex-col">
            <!-- Sidebar Header -->
            <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-info-circle"></i>
                    <h3 class="font-semibold">항목 상세 정보</h3>
                </div>
                <button onclick="toggleSidebar()" class="text-white hover:bg-blue-800 rounded p-1 transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Sidebar Content -->
            <div class="flex-1 overflow-y-auto custom-scrollbar">
                <div id="sidebarContent" class="p-4">
                    <div class="text-center text-gray-500 py-8">
                        <i class="fas fa-mouse-pointer text-3xl mb-4 opacity-50"></i>
                        <p>평가 항목을 클릭하여<br>상세 정보를 확인하세요</p>
                    </div>
                </div>
            </div>
            
            <!-- Sidebar Footer -->
            <div class="bg-gray-50 p-4 border-t border-gray-200">
                <div class="text-xs text-gray-500 text-center">
                    <i class="fas fa-lightbulb mr-1"></i>
                    클릭으로 항목 선택, 화살표로 순서 변경
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(sidebar);
    
    // Add mini toggle button when sidebar is hidden
    addMiniToggleButton();
}

// Add mini toggle button
function addMiniToggleButton() {
    // Check if button already exists
    if (document.getElementById('miniToggleBtn')) return;
    
    const miniBtn = document.createElement('button');
    miniBtn.id = 'miniToggleBtn';
    miniBtn.className = 'fixed right-4 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white w-10 h-10 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 z-40 flex items-center justify-center';
    miniBtn.innerHTML = '<i class="fas fa-info"></i>';
    miniBtn.onclick = toggleSidebar;
    
    document.body.appendChild(miniBtn);
    
    // Initially hidden
    miniBtn.style.display = sidebarVisible ? 'none' : 'flex';
}

// Toggle sidebar visibility
function toggleSidebar() {
    const sidebar = document.getElementById('enhancedSidebar');
    const miniBtn = document.getElementById('miniToggleBtn');
    
    if (!sidebar) {
        addSidebarPanel();
        return;
    }
    
    sidebarVisible = !sidebarVisible;
    
    if (sidebarVisible) {
        sidebar.classList.remove('translate-x-full');
        sidebar.classList.add('translate-x-0');
        if (miniBtn) miniBtn.style.display = 'none';
        
        // Show current item details if available
        if (currentItemDetails !== null) {
            showItemDetails(currentItemDetails);
        }
    } else {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('translate-x-full');
        if (miniBtn) miniBtn.style.display = 'flex';
    }
}

// Show item details in sidebar
function showItemDetails(index) {
    currentItemDetails = index;
    
    if (!sidebarVisible) {
        toggleSidebar();
        // Wait for sidebar animation
        setTimeout(() => showItemDetailsContent(index), 300);
    } else {
        showItemDetailsContent(index);
    }
}

function showItemDetailsContent(index) {
    const sidebarContent = document.getElementById('sidebarContent');
    if (!sidebarContent || !evaluationItems[index]) return;
    
    const item = evaluationItems[index];
    
    sidebarContent.innerHTML = `
        <div class="space-y-6">
            <!-- Item Basic Info -->
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold text-blue-900 mb-2">
                    <i class="fas fa-tag mr-2"></i>기본 정보
                </h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">항목명</label>
                        <input type="text" 
                               value="${item.name}" 
                               onchange="updateItemFromSidebar(${index}, 'name', this.value)"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">가중치 (%)</label>
                        <input type="number" 
                               value="${item.weight}" 
                               onchange="updateItemFromSidebar(${index}, 'weight', this.value)"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                               min="0" max="100">
                    </div>
                </div>
            </div>
            
            <!-- Item Description -->
            <div class="bg-green-50 p-4 rounded-lg">
                <h4 class="font-semibold text-green-900 mb-2">
                    <i class="fas fa-align-left mr-2"></i>상세 설명
                </h4>
                <textarea onchange="updateItemFromSidebar(${index}, 'description', this.value)"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          rows="4" 
                          placeholder="이 평가 항목에 대한 상세한 설명을 입력하세요...">${item.description || ''}</textarea>
            </div>
            
            <!-- Position Controls -->
            <div class="bg-purple-50 p-4 rounded-lg">
                <h4 class="font-semibold text-purple-900 mb-2">
                    <i class="fas fa-arrows-alt-v mr-2"></i>위치 조정
                </h4>
                <div class="flex space-x-2">
                    <button onclick="moveItemUp(${index})" 
                            class="flex-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-up mr-2"></i>위로
                    </button>
                    <button onclick="moveItemDown(${index})" 
                            class="flex-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            ${index === evaluationItems.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-down mr-2"></i>아래로
                    </button>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="bg-red-50 p-4 rounded-lg">
                <h4 class="font-semibold text-red-900 mb-2">
                    <i class="fas fa-tools mr-2"></i>작업
                </h4>
                <div class="space-y-2">
                    <button onclick="duplicateItem(${index})" 
                            class="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                        <i class="fas fa-copy mr-2"></i>항목 복제
                    </button>
                    <button onclick="removeEvaluationItem(${index}); toggleSidebar();" 
                            class="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                        <i class="fas fa-trash mr-2"></i>항목 삭제
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Update item from sidebar
function updateItemFromSidebar(index, field, value) {
    if (evaluationItems[index]) {
        if (field === 'weight') {
            evaluationItems[index][field] = parseInt(value) || 0;
        } else {
            evaluationItems[index][field] = value;
        }
        
        // Update main form
        renderSettings();
        enhanceSettingsUI();
        
        // Update statistics
        updateStatistics();
    }
}

// Duplicate item
function duplicateItem(index) {
    if (evaluationItems[index]) {
        const originalItem = evaluationItems[index];
        const duplicatedItem = {
            id: Date.now(),
            name: originalItem.name + ' (복사본)',
            weight: originalItem.weight,
            description: originalItem.description || ''
        };
        
        evaluationItems.splice(index + 1, 0, duplicatedItem);
        renderSettings();
        enhanceSettingsUI();
        updateStatistics();
        
        // Show details of new item
        showItemDetails(index + 1);
    }
}

// Add statistics panel
function addStatisticsPanel() {
    const settingsTab = document.getElementById('settings');
    if (!settingsTab) return;
    
    // Check if statistics panel already exists
    if (document.getElementById('statisticsPanel')) return;
    
    const statsPanel = document.createElement('div');
    statsPanel.id = 'statisticsPanel';
    statsPanel.className = 'mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200';
    
    const settingsCard = settingsTab.querySelector('.bg-white.rounded-lg.shadow');
    if (settingsCard) {
        settingsCard.parentNode.insertBefore(statsPanel, settingsCard);
    }
    
    updateStatistics();
}

// Update statistics display
function updateStatistics() {
    const statsPanel = document.getElementById('statisticsPanel');
    if (!statsPanel) return;
    
    const totalItems = evaluationItems.length;
    const totalWeight = evaluationItems.reduce((sum, item) => sum + (item.weight || 0), 0);
    const avgWeight = totalItems > 0 ? Math.round(totalWeight / totalItems) : 0;
    const maxWeight = totalItems > 0 ? Math.max(...evaluationItems.map(item => item.weight || 0)) : 0;
    const minWeight = totalItems > 0 ? Math.min(...evaluationItems.map(item => item.weight || 0)) : 0;
    
    statsPanel.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-indigo-900">
                <i class="fas fa-chart-pie mr-2"></i>평가 항목 통계
            </h3>
            <button onclick="toggleSidebar()" class="text-indigo-600 hover:text-indigo-800 transition-colors">
                <i class="fas fa-info-circle mr-1"></i>상세정보
            </button>
        </div>
        
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div class="bg-white rounded-lg p-3 text-center shadow-sm">
                <div class="text-2xl font-bold text-blue-600">${totalItems}</div>
                <div class="text-sm text-gray-600">총 항목 수</div>
            </div>
            <div class="bg-white rounded-lg p-3 text-center shadow-sm">
                <div class="text-2xl font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-yellow-600'}">${totalWeight}%</div>
                <div class="text-sm text-gray-600">총 가중치</div>
            </div>
            <div class="bg-white rounded-lg p-3 text-center shadow-sm">
                <div class="text-2xl font-bold text-purple-600">${avgWeight}%</div>
                <div class="text-sm text-gray-600">평균 가중치</div>
            </div>
            <div class="bg-white rounded-lg p-3 text-center shadow-sm">
                <div class="text-2xl font-bold text-red-600">${maxWeight}%</div>
                <div class="text-sm text-gray-600">최대 가중치</div>
            </div>
            <div class="bg-white rounded-lg p-3 text-center shadow-sm">
                <div class="text-2xl font-bold text-green-600">${minWeight}%</div>
                <div class="text-sm text-gray-600">최소 가중치</div>
            </div>
        </div>
        
        ${totalWeight !== 100 ? `
            <div class="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                    <span class="text-yellow-800 text-sm">
                        가중치 합계가 100%가 아닙니다. 현재: ${totalWeight}%
                    </span>
                </div>
            </div>
        ` : `
            <div class="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                <div class="flex items-center">
                    <i class="fas fa-check-circle text-green-600 mr-2"></i>
                    <span class="text-green-800 text-sm">가중치 설정이 완료되었습니다.</span>
                </div>
            </div>
        `}
    `;
}

// Add Excel functionality
function addExcelFunctionality() {
    // Check if Excel panel already exists
    if (document.getElementById('excelPanel')) return;
    
    const settingsTab = document.getElementById('settings');
    if (!settingsTab) return;
    
    const excelPanel = document.createElement('div');
    excelPanel.id = 'excelPanel';
    excelPanel.className = 'mb-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200';
    
    excelPanel.innerHTML = `
        <h3 class="text-lg font-semibold text-green-900 mb-4">
            <i class="fas fa-file-excel mr-2"></i>Excel 연동
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Excel 파일 업로드</label>
                <input type="file" 
                       id="excelFileInput" 
                       accept=".xlsx,.xls,.csv" 
                       onchange="handleExcelUpload(this)"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 transition-colors">
                <p class="text-xs text-gray-500">Excel 파일에서 평가 항목을 가져올 수 있습니다.</p>
            </div>
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Excel 파일 다운로드</label>
                <div class="space-y-2">
                    <button onclick="downloadExcelTemplate()" 
                            class="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
                        <i class="fas fa-download mr-2"></i>템플릿 다운로드
                    </button>
                    <button onclick="downloadExcelData()" 
                            class="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm">
                        <i class="fas fa-file-export mr-2"></i>데이터 내보내기
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const statsPanel = document.getElementById('statisticsPanel');
    if (statsPanel) {
        statsPanel.parentNode.insertBefore(excelPanel, statsPanel.nextSibling);
    }
    
    // Load SheetJS library for Excel functionality
    loadSheetJSLibrary();
}

// Load SheetJS library
function loadSheetJSLibrary() {
    if (window.XLSX) return; // Already loaded
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = function() {
        console.log('✅ SheetJS library loaded successfully');
    };
    script.onerror = function() {
        console.error('❌ Failed to load SheetJS library');
    };
    document.head.appendChild(script);
}

// Handle Excel file upload
function handleExcelUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (!window.XLSX) {
        alert('Excel 라이브러리가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get first worksheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            parseExcelData(jsonData);
            
        } catch (error) {
            console.error('Excel 파일 처리 중 오류:', error);
            alert('Excel 파일을 처리하는 중 오류가 발생했습니다.');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Parse Excel data and update evaluation items
function parseExcelData(jsonData) {
    if (!jsonData || jsonData.length < 2) {
        alert('올바른 Excel 형식이 아닙니다.');
        return;
    }
    
    const headers = jsonData[0];
    const nameIndex = headers.findIndex(h => h && (h.includes('항목') || h.includes('name') || h.includes('Name')));
    const weightIndex = headers.findIndex(h => h && (h.includes('가중치') || h.includes('weight') || h.includes('Weight')));
    const descIndex = headers.findIndex(h => h && (h.includes('설명') || h.includes('description') || h.includes('Description')));
    
    if (nameIndex === -1) {
        alert('항목명 열을 찾을 수 없습니다.');
        return;
    }
    
    const newItems = [];
    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row[nameIndex]) {
            const item = {
                id: Date.now() + i,
                name: row[nameIndex].toString(),
                weight: weightIndex !== -1 ? (parseInt(row[weightIndex]) || 10) : 10,
                description: descIndex !== -1 ? (row[descIndex] || '') : ''
            };
            newItems.push(item);
        }
    }
    
    if (newItems.length > 0) {
        const replaceAll = confirm(`${newItems.length}개의 항목을 가져왔습니다. 기존 항목을 모두 대체하시겠습니까?\n취소를 누르면 기존 항목에 추가됩니다.`);
        
        if (replaceAll) {
            evaluationItems = newItems;
        } else {
            evaluationItems = evaluationItems.concat(newItems);
        }
        
        renderSettings();
        enhanceSettingsUI();
        updateStatistics();
        
        alert(`${newItems.length}개 항목이 성공적으로 ${replaceAll ? '대체' : '추가'}되었습니다.`);
    }
}

// Download Excel template
function downloadExcelTemplate() {
    if (!window.XLSX) {
        alert('Excel 라이브러리가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
    }
    
    const templateData = [
        ['항목명', '가중치(%)', '설명'],
        ['업무 수행 능력', 25, '담당 업무의 완수 정도와 품질'],
        ['협업 및 소통', 20, '팀워크와 의사소통 능력'],
        ['문제 해결 능력', 25, '문제 인식과 해결 방안 도출'],
        ['자기 계발', 15, '지속적인 학습과 성장 의지'],
        ['리더십', 15, '팀을 이끄는 능력과 책임감']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '평가항목템플릿');
    
    // Download file
    XLSX.writeFile(wb, '평가항목_템플릿.xlsx');
}

// Download current evaluation data as Excel
function downloadExcelData() {
    if (!window.XLSX) {
        alert('Excel 라이브러리가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
    }
    
    if (evaluationItems.length === 0) {
        alert('내보낼 데이터가 없습니다.');
        return;
    }
    
    const data = [['항목명', '가중치(%)', '설명']];
    
    evaluationItems.forEach(item => {
        data.push([
            item.name,
            item.weight,
            item.description || ''
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '평가항목');
    
    const fileName = `평가항목_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

// Add animations and transitions
function addAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        .enhanced-item {
            animation: slideInFromLeft 0.5s ease-out;
        }
        
        @keyframes slideInFromLeft {
            from {
                transform: translateX(-100px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .move-up-btn:hover, .move-down-btn:hover {
            transform: scale(1.1);
        }
        
        .arrow-controls button:active {
            transform: scale(0.95);
        }
        
        /* Pulse animation for statistics */
        .stats-pulse {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
        }
        
        /* Hover effect for sidebar items */
        #sidebarContent .bg-blue-50:hover,
        #sidebarContent .bg-green-50:hover,
        #sidebarContent .bg-purple-50:hover,
        #sidebarContent .bg-red-50:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// Add keyboard shortcuts
function addKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Only activate shortcuts when in settings tab
        if (currentTab !== 'settings') return;
        
        // Ctrl+N: Add new item
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            addEvaluationItem();
        }
        
        // Ctrl+S: Save settings
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveSettings();
        }
        
        // Ctrl+I: Toggle sidebar
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            toggleSidebar();
        }
        
        // Escape: Close sidebar
        if (e.key === 'Escape' && sidebarVisible) {
            e.preventDefault();
            toggleSidebar();
        }
    });
}

// Re-apply enhanced UI when settings are re-rendered
function reapplyEnhancements() {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
        if (document.getElementById('evaluationItems').children.length > 0) {
            enhanceSettingsUI();
        }
    }, 100);
}

// Hook into the original renderSettings function
const originalRenderSettings = window.renderSettings;
window.renderSettings = function() {
    originalRenderSettings.apply(this, arguments);
    reapplyEnhancements();
};

// Initialize enhanced UI when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(enhanceSettingsUI, 500);
    });
} else {
    setTimeout(enhanceSettingsUI, 500);
}

// Auto-apply enhancements when tab is switched to settings
const originalShowTab = window.showTab;
window.showTab = function(tabName) {
    originalShowTab.apply(this, arguments);
    if (tabName === 'settings') {
        setTimeout(enhanceSettingsUI, 200);
    }
};

console.log('🎯 Enhanced Settings UI module loaded successfully');