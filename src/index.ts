import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// Serve static files - use root path serving
app.use('/*', serveStatic({ root: './public' }))

// API routes
app.get('/api/hello', (c) => {
  return c.json({ message: 'Hello from 클라우드사업본부 업무평가 시스템!' })
})

// Default route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>클라우드사업본부 업무평가 시스템</title>
        
        <!-- External Libraries -->
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
        
        <!-- Custom Styles -->
        <link href="/css/main.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 text-gray-800">
        <div class="min-h-screen">
            <!-- Header -->
            <header class="bg-white shadow-sm border-b border-gray-200">
                <div class="max-w-7xl mx-auto px-4 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <i class="fas fa-chart-line text-blue-600 text-2xl"></i>
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900">클라우드사업본부 업무평가 시스템</h1>
                                <p class="text-sm text-gray-600">Performance Management System</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <button id="sidebarToggle" class="lg:hidden text-gray-600 hover:text-gray-900">
                                <i class="fas fa-bars text-xl"></i>
                            </button>
                            <div class="hidden lg:flex items-center space-x-4">
                                <!-- 사용자 정보 -->
                                <div class="flex items-center space-x-2 text-sm">
                                    <i class="fas fa-user-circle text-gray-600"></i>
                                    <span id="userName" class="font-medium text-gray-900">관리자</span>
                                    <span class="text-gray-400">|</span>
                                    <span id="userRole" class="text-red-600 font-semibold">관리자</span>
                                </div>
                                <!-- 권한 전환 버튼 (개발/테스트용) -->
                                <div class="flex items-center space-x-2">
                                    <button onclick="switchUserRole('admin')" 
                                            class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                            title="관리자 모드로 전환">
                                        Admin
                                    </button>
                                    <button onclick="switchUserRole('user')" 
                                            class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                            title="일반 사용자 모드로 전환">
                                        User
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div class="flex">
                <!-- Sidebar -->
                <nav id="sidebar" class="bg-white w-64 min-h-screen shadow-sm border-r border-gray-200 hidden lg:block">
                    <div class="p-4">
                        <ul class="space-y-2">
                            <li>
                                <button onclick="showTab('dashboard')" class="tab-button w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors active">
                                    <i class="fas fa-tachometer-alt mr-3"></i>
                                    대시보드
                                </button>
                            </li>
                            <li>
                                <button onclick="showTab('settings')" class="tab-button w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                    <i class="fas fa-cog mr-3"></i>
                                    설정 관리
                                </button>
                            </li>
                            <li>
                                <button onclick="showTab('evaluation')" class="tab-button w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                    <i class="fas fa-clipboard-list mr-3"></i>
                                    타인 평가
                                </button>
                            </li>
                            <li>
                                <button onclick="showTab('selfEvaluation')" class="tab-button w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                    <i class="fas fa-user-check mr-3"></i>
                                    자기 평가
                                </button>
                            </li>
                            <li>
                                <button onclick="showTab('reports')" class="tab-button w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                    <i class="fas fa-chart-bar mr-3"></i>
                                    평가 결과
                                </button>
                            </li>
                        </ul>
                    </div>
                </nav>

                <!-- Main Content -->
                <main class="flex-1 p-6">
                    <!-- Dashboard Tab -->
                    <div id="dashboard" class="tab-content active">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">대시보드</h2>
                            <p class="text-gray-600">시스템이 성공적으로 로드되었습니다!</p>
                        </div>
                        
                        <!-- 테스트 섹션 -->
                        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                <i class="fas fa-check-circle text-green-600 mr-2"></i>시스템 기능 테스트
                            </h3>
                            <div class="space-y-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
                                        <h4 class="font-medium text-green-900 mb-2">✅ 권한 시스템</h4>
                                        <p class="text-sm text-green-700 mb-3">관리자/일반 사용자 권한 분리</p>
                                        <div class="flex space-x-2">
                                            <button onclick="switchUserRole('admin')" class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">Admin</button>
                                            <button onclick="switchUserRole('user')" class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">User</button>
                                        </div>
                                    </div>
                                    
                                    <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                        <h4 class="font-medium text-blue-900 mb-2">⚙️ 설정 관리</h4>
                                        <p class="text-sm text-blue-700 mb-3">관리자만 접근 가능</p>
                                        <button onclick="showTab('settings')" class="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">테스트</button>
                                    </div>
                                    
                                    <div class="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                                        <h4 class="font-medium text-purple-900 mb-2">📊 평가 시스템</h4>
                                        <p class="text-sm text-purple-700 mb-3">자기평가 및 타인평가</p>
                                        <button onclick="showTab('selfEvaluation')" class="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700">테스트</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Settings Tab -->
                    <div id="settings" class="tab-content">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">설정 관리 (관리자 전용)</h2>
                            <p class="text-gray-600">이 메뉴는 관리자 권한이 필요합니다</p>
                        </div>
                        
                        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <div class="text-center py-8">
                                <i class="fas fa-lock text-gray-400 text-4xl mb-4"></i>
                                <h3 class="text-lg font-medium text-gray-900 mb-2">관리자 권한이 필요합니다</h3>
                                <p class="text-gray-600 mb-4">설정 관리 기능은 관리자 사용자만 이용할 수 있습니다.</p>
                                <div class="flex justify-center space-x-2">
                                    <button onclick="switchUserRole('admin')" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">관리자로 전환</button>
                                    <button onclick="showTab('dashboard')" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">대시보드로 이동</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Other tabs placeholder -->
                    <div id="evaluation" class="tab-content">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">타인 평가</h2>
                            <p class="text-gray-600">개발 예정 기능입니다</p>
                        </div>
                    </div>

                    <div id="selfEvaluation" class="tab-content">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">자기 평가</h2>
                            <p class="text-gray-600">개발 예정 기능입니다</p>
                        </div>
                    </div>

                    <div id="reports" class="tab-content">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">평가 결과</h2>
                            <p class="text-gray-600">개발 예정 기능입니다</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>

        <script>
        // 전역 변수
        let currentUser = {
            id: 'admin',
            name: '관리자',
            role: 'admin',
            email: 'admin@company.com'
        };

        // 초기화
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 클라우드사업본부 업무평가 시스템 시작');
            initializeUserPermissions();
            showTab('dashboard');
        });

        // 사용자 권한 초기화
        function initializeUserPermissions() {
            updateUserInfo();
            updateMenuAccess();
        }

        // 사용자 정보 업데이트
        function updateUserInfo() {
            const userNameElement = document.getElementById('userName');
            const userRoleElement = document.getElementById('userRole');
            
            if (userNameElement) {
                userNameElement.textContent = currentUser.name;
            }
            
            if (userRoleElement) {
                const roleText = currentUser.role === 'admin' ? '관리자' : '일반 사용자';
                const roleColor = currentUser.role === 'admin' ? 'text-red-600' : 'text-blue-600';
                userRoleElement.innerHTML = '<span class="' + roleColor + ' font-semibold">' + roleText + '</span>';
            }
        }

        // 메뉴 접근 권한 업데이트
        function updateMenuAccess() {
            const adminOnlyTabs = ['settings'];
            
            adminOnlyTabs.forEach(tabName => {
                const tabButton = document.querySelector('[onclick="showTab(\'' + tabName + '\')"]');
                if (tabButton) {
                    if (currentUser.role !== 'admin') {
                        tabButton.classList.add('opacity-50', 'cursor-not-allowed');
                        tabButton.title = '관리자 권한이 필요합니다';
                        
                        if (!tabButton.innerHTML.includes('fa-lock')) {
                            tabButton.innerHTML += ' <i class="fas fa-lock ml-1 text-xs"></i>';
                        }
                    } else {
                        tabButton.classList.remove('opacity-50', 'cursor-not-allowed');
                        tabButton.title = '';
                    }
                }
            });
        }

        // 탭 접근 권한 확인
        function checkTabPermission(tabName) {
            const adminOnlyTabs = ['settings'];
            return !adminOnlyTabs.includes(tabName) || currentUser.role === 'admin';
        }

        // 사용자 역할 변경
        function switchUserRole(role) {
            if (role === 'admin' || role === 'user') {
                currentUser.role = role;
                currentUser.name = role === 'admin' ? '관리자' : '김직원';
                currentUser.email = role === 'admin' ? 'admin@company.com' : 'employee@company.com';
                
                updateUserInfo();
                updateMenuAccess();
                
                const currentTab = document.querySelector('.tab-content.active');
                if (currentTab && currentTab.id === 'settings' && role !== 'admin') {
                    showTab('dashboard');
                }
                
                showToast((role === 'admin' ? '관리자' : '일반 사용자') + ' 모드로 변경되었습니다.', 'info');
            }
        }

        // 관리자 권한 확인
        function isAdmin() {
            return currentUser.role === 'admin';
        }

        // 탭 표시
        function showTab(tabName) {
            if (!checkTabPermission(tabName)) {
                showToast('관리자 권한이 필요한 메뉴입니다.', 'error');
                return;
            }
            
            // 모든 탭 버튼 비활성화
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active', 'bg-blue-600', 'text-white');
                btn.classList.add('text-gray-600', 'hover:text-gray-900');
            });
            
            // 모든 탭 콘텐츠 숨기기
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // 선택된 탭 버튼 활성화
            const activeButton = document.querySelector('[onclick="showTab(\'' + tabName + '\')"]');
            if (activeButton) {
                activeButton.classList.remove('text-gray-600', 'hover:text-gray-900');
                activeButton.classList.add('active', 'bg-blue-600', 'text-white');
            }
            
            // 선택된 탭 콘텐츠 표시
            const activeContent = document.getElementById(tabName);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        }

        // Toast 메시지
        function showToast(message, type = 'info') {
            const existingToast = document.querySelector('.toast-message');
            if (existingToast) {
                existingToast.remove();
            }
            
            const toast = document.createElement('div');
            toast.className = 'toast-message fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm';
            
            const colors = {
                success: 'bg-green-500 text-white',
                error: 'bg-red-500 text-white', 
                warning: 'bg-yellow-500 text-white',
                info: 'bg-blue-500 text-white'
            };
            
            toast.className += ' ' + (colors[type] || colors.info);
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateX(100%)';
                    setTimeout(() => toast.remove(), 300);
                }
            }, 3000);
        }

        // CSS Styles
        const style = document.createElement('style');
        style.textContent = \`
            .tab-content {
                display: none;
            }
            .tab-content.active {
                display: block;
            }
            .tab-button.active {
                background-color: #2563eb !important;
                color: white !important;
            }
            .toast-message {
                transition: all 0.3s ease;
            }
        \`;
        document.head.appendChild(style);

        console.log('✅ 시스템 초기화 완료');
        </script>
    </body>
    </html>
  `)
})

export default app