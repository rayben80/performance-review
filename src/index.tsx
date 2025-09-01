import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// 정적 파일 서빙 - Cloudflare Pages 방식
// public 폴더의 파일들을 /public/* 경로로 서빙
app.use('/public/*', serveStatic({ root: './' }))

// 루트 정적 파일들 (favicon.ico 등)
app.use('/favicon.ico', serveStatic({ path: './favicon.ico' }))
app.use('/robots.txt', serveStatic({ path: './robots.txt' }))

// API 라우트
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 로그인 API
app.post('/api/login', async (c) => {
  const { email, password } = await c.req.json()
  
  // 기본 테스트 계정들
  const defaultUsers = {
    'admin@company.com': { password: 'admin123', role: 'admin', name: '관리자' },
    'user@company.com': { password: 'user123', role: 'user', name: '사용자' },
    'test@company.com': { password: 'test123', role: 'admin', name: '테스트 관리자' }
  }
  
  // 회원가입된 사용자들 가져오기
  const registeredUsers = JSON.parse(globalThis.userDatabase || '{}')
  
  // 모든 사용자 통합 (기본 + 회원가입)
  const allUsers = { ...defaultUsers, ...registeredUsers }
  
  if (allUsers[email] && allUsers[email].password === password) {
    return c.json({ 
      success: true, 
      user: {
        email,
        name: allUsers[email].name,
        role: allUsers[email].role
      }
    })
  } else {
    return c.json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401)
  }
})

// 회원가입 API
app.post('/api/signup', async (c) => {
  const { email, password, confirmPassword, name, role } = await c.req.json()
  
  // 유효성 검사
  if (!email || !password || !confirmPassword || !name) {
    return c.json({ success: false, message: '모든 필드를 입력해주세요.' }, 400)
  }
  
  if (password !== confirmPassword) {
    return c.json({ success: false, message: '비밀번호가 일치하지 않습니다.' }, 400)
  }
  
  if (password.length < 6) {
    return c.json({ success: false, message: '비밀번호는 최소 6자 이상이어야 합니다.' }, 400)
  }
  
  // 이메일 형식 검사
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return c.json({ success: false, message: '올바른 이메일 형식이 아닙니다.' }, 400)
  }
  
  // 기존 사용자 확인 (localStorage 시뮬레이션)
  const existingUsers = JSON.parse(globalThis.userDatabase || '{}')
  
  if (existingUsers[email]) {
    return c.json({ success: false, message: '이미 등록된 이메일입니다.' }, 409)
  }
  
  // 새 사용자 추가
  const newUser = {
    email,
    password, // 실제 운영에서는 해시화해야 함
    name,
    role: role || 'user', // 기본값은 일반 사용자
    createdAt: new Date().toISOString()
  }
  
  existingUsers[email] = newUser
  globalThis.userDatabase = JSON.stringify(existingUsers)
  
  return c.json({ 
    success: true, 
    message: '회원가입이 완료되었습니다.',
    user: {
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    }
  })
})

// 사용자 목록 조회 API (관리자용)
app.get('/api/users', async (c) => {
  const users = JSON.parse(globalThis.userDatabase || '{}')
  const userList = Object.values(users).map(user => ({
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt
  }))
  
  return c.json({ success: true, users: userList })
})

// 로그아웃 API
app.post('/api/logout', (c) => {
  return c.json({ success: true, message: '로그아웃 되었습니다.' })
})

// 로그인 페이지 (메인 경로)
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>로그인 - 클라우드사업본부 업무평가 시스템</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-md">
            <!-- 인증 카드 -->
            <div class="bg-white rounded-xl shadow-2xl overflow-hidden">
                <!-- 헤더 -->
                <div class="text-center p-8 pb-4">
                    <div class="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                        <i class="fas fa-chart-line text-white text-2xl"></i>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900">업무평가 시스템</h1>
                    <p class="text-gray-600">클라우드사업본부 Performance Management System</p>
                </div>

                <!-- 탭 네비게이션 -->
                <div class="flex border-b border-gray-200 px-8">
                    <button onclick="switchTab('login')" id="loginTab" 
                            class="flex-1 py-3 px-4 text-center font-medium text-blue-600 border-b-2 border-blue-600 transition-colors">
                        <i class="fas fa-sign-in-alt mr-2"></i>로그인
                    </button>
                    <button onclick="switchTab('signup')" id="signupTab" 
                            class="flex-1 py-3 px-4 text-center font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 transition-colors">
                        <i class="fas fa-user-plus mr-2"></i>회원가입
                    </button>
                </div>

                <!-- 로그인 폼 -->
                <div id="loginContent" class="p-8 space-y-6">
                    <form id="loginForm" class="space-y-4">
                        <div>
                            <label for="loginEmail" class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-envelope mr-2"></i>이메일
                            </label>
                            <input type="email" id="loginEmail" name="email" required 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                   placeholder="이메일을 입력하세요">
                        </div>

                        <div>
                            <label for="loginPassword" class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-lock mr-2"></i>비밀번호
                            </label>
                            <input type="password" id="loginPassword" name="password" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                   placeholder="비밀번호를 입력하세요">
                        </div>

                        <button type="submit" id="loginBtn" 
                                class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="fas fa-sign-in-alt mr-2"></i>로그인
                        </button>
                    </form>

                    <!-- 테스트 계정 안내 -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <p class="text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-info-circle mr-2"></i>테스트 계정
                        </p>
                        <div class="space-y-1 text-xs text-gray-600">
                            <div><strong>관리자:</strong> admin@company.com / admin123</div>
                            <div><strong>일반 사용자:</strong> user@company.com / user123</div>
                            <div><strong>테스트:</strong> test@company.com / test123</div>
                        </div>
                    </div>
                </div>

                <!-- 회원가입 폼 -->
                <div id="signupContent" class="hidden p-8 space-y-6">
                    <form id="signupForm" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="signupName" class="block text-sm font-medium text-gray-700 mb-2">
                                    <i class="fas fa-user mr-2"></i>이름
                                </label>
                                <input type="text" id="signupName" name="name" required 
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                       placeholder="이름을 입력하세요">
                            </div>
                            
                            <div>
                                <label for="signupRole" class="block text-sm font-medium text-gray-700 mb-2">
                                    <i class="fas fa-user-tag mr-2"></i>권한
                                </label>
                                <select id="signupRole" name="role" 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                                    <option value="user">일반 사용자</option>
                                    <option value="admin">관리자</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label for="signupEmail" class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-envelope mr-2"></i>이메일
                            </label>
                            <input type="email" id="signupEmail" name="email" required 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                   placeholder="이메일을 입력하세요">
                        </div>

                        <div>
                            <label for="signupPassword" class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-lock mr-2"></i>비밀번호
                            </label>
                            <input type="password" id="signupPassword" name="password" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                   placeholder="비밀번호를 입력하세요 (최소 6자)">
                        </div>

                        <div>
                            <label for="signupConfirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-lock mr-2"></i>비밀번호 확인
                            </label>
                            <input type="password" id="signupConfirmPassword" name="confirmPassword" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                   placeholder="비밀번호를 다시 입력하세요">
                        </div>

                        <button type="submit" id="signupBtn" 
                                class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="fas fa-user-plus mr-2"></i>회원가입
                        </button>
                    </form>

                    <!-- 회원가입 안내 -->
                    <div class="bg-blue-50 rounded-lg p-4">
                        <p class="text-sm text-blue-700">
                            <i class="fas fa-info-circle mr-2"></i>
                            회원가입 후 즉시 로그인하여 시스템을 이용할 수 있습니다.
                        </p>
                    </div>
                </div>

                <!-- 공통 메시지 영역 -->
                <div class="px-8 pb-8">
                    <div id="message" class="hidden p-3 rounded-lg text-sm"></div>
                </div>
            </div>

            <!-- 푸터 -->
            <div class="text-center mt-6 text-sm text-gray-500">
                © 2024 클라우드사업본부. All rights reserved.
            </div>
        </div>

        <script>
            // 탭 전환 함수
            function switchTab(tab) {
                const loginTab = document.getElementById('loginTab');
                const signupTab = document.getElementById('signupTab');
                const loginContent = document.getElementById('loginContent');
                const signupContent = document.getElementById('signupContent');
                const message = document.getElementById('message');
                
                // 메시지 숨기기
                message.classList.add('hidden');
                
                if (tab === 'login') {
                    loginTab.className = 'flex-1 py-3 px-4 text-center font-medium text-blue-600 border-b-2 border-blue-600 transition-colors';
                    signupTab.className = 'flex-1 py-3 px-4 text-center font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 transition-colors';
                    loginContent.classList.remove('hidden');
                    signupContent.classList.add('hidden');
                } else {
                    signupTab.className = 'flex-1 py-3 px-4 text-center font-medium text-green-600 border-b-2 border-green-600 transition-colors';
                    loginTab.className = 'flex-1 py-3 px-4 text-center font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 transition-colors';
                    signupContent.classList.remove('hidden');
                    loginContent.classList.add('hidden');
                }
            }

            // 메시지 표시 함수
            function showMessage(text, type = 'error') {
                const message = document.getElementById('message');
                const colors = {
                    success: 'bg-green-50 border border-green-200 text-green-700',
                    error: 'bg-red-50 border border-red-200 text-red-700',
                    info: 'bg-blue-50 border border-blue-200 text-blue-700'
                };
                const icons = {
                    success: 'fas fa-check-circle',
                    error: 'fas fa-exclamation-circle',
                    info: 'fas fa-info-circle'
                };
                
                message.className = 'p-3 rounded-lg text-sm ' + colors[type];
                message.innerHTML = '<i class="' + icons[type] + ' mr-2"></i>' + text;
                message.classList.remove('hidden');
            }

            // 로그인 폼 처리
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                const loginBtn = document.getElementById('loginBtn');
                
                // 로딩 상태
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>로그인 중...';
                document.getElementById('message').classList.add('hidden');
                
                try {
                    const response = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        localStorage.setItem('user', JSON.stringify(data.user));
                        showMessage('로그인 성공! 대시보드로 이동합니다...', 'success');
                        setTimeout(() => window.location.href = '/dashboard', 1500);
                    } else {
                        showMessage(data.message, 'error');
                    }
                } catch (error) {
                    showMessage('로그인 중 오류가 발생했습니다.', 'error');
                }
                
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>로그인';
            });

            // 회원가입 폼 처리
            document.getElementById('signupForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const name = document.getElementById('signupName').value;
                const email = document.getElementById('signupEmail').value;
                const password = document.getElementById('signupPassword').value;
                const confirmPassword = document.getElementById('signupConfirmPassword').value;
                const role = document.getElementById('signupRole').value;
                const signupBtn = document.getElementById('signupBtn');
                
                // 클라이언트 유효성 검사
                if (password !== confirmPassword) {
                    showMessage('비밀번호가 일치하지 않습니다.', 'error');
                    return;
                }
                
                if (password.length < 6) {
                    showMessage('비밀번호는 최소 6자 이상이어야 합니다.', 'error');
                    return;
                }
                
                // 로딩 상태
                signupBtn.disabled = true;
                signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>회원가입 중...';
                document.getElementById('message').classList.add('hidden');
                
                try {
                    const response = await fetch('/api/signup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, password, confirmPassword, role })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showMessage('회원가입이 완료되었습니다! 로그인해 주세요.', 'success');
                        
                        // 3초 후 로그인 탭으로 전환하고 이메일 자동 입력
                        setTimeout(() => {
                            switchTab('login');
                            document.getElementById('loginEmail').value = email;
                            document.getElementById('signupForm').reset();
                        }, 2000);
                    } else {
                        showMessage(data.message, 'error');
                    }
                } catch (error) {
                    showMessage('회원가입 중 오류가 발생했습니다.', 'error');
                }
                
                signupBtn.disabled = false;
                signupBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>회원가입';
            });

            // 이미 로그인된 사용자 체크
            if (localStorage.getItem('user')) {
                window.location.href = '/dashboard';
            }
        </script>
    </body>
    </html>
  `)
})

// 대시보드 페이지 (기존 메인 페이지)
app.get('/dashboard', (c) => {
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
        <link href="/public/css/main.css" rel="stylesheet">
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
                                    <button onclick="logout()" 
                                            class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                            title="로그아웃">
                                        <i class="fas fa-sign-out-alt mr-1"></i>로그아웃
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
                    
                    <!-- Mini Toggle (모바일용) -->
                    <button id="miniToggle" class="lg:hidden fixed bottom-4 left-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-40">
                        <i class="fas fa-bars"></i>
                    </button>
                </nav>

                <!-- Main Content -->
                <main class="flex-1 p-6">
                    <!-- Dashboard Tab -->
                    <div id="dashboard" class="tab-content active">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">대시보드</h2>
                            <p class="text-gray-600">시스템 현황을 한눈에 확인하세요</p>
                        </div>
                        
                        <!-- 통계 카드 -->
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600">총 조직</p>
                                        <p class="text-2xl font-bold text-blue-600" id="totalOrgs">0</p>
                                    </div>
                                    <i class="fas fa-building text-blue-600 text-2xl"></i>
                                </div>
                            </div>
                            
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600">총 구성원</p>
                                        <p class="text-2xl font-bold text-green-600" id="totalMembers">0</p>
                                    </div>
                                    <i class="fas fa-users text-green-600 text-2xl"></i>
                                </div>
                            </div>
                            
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600">총 평가</p>
                                        <p class="text-2xl font-bold text-purple-600" id="totalEvaluations">0</p>
                                    </div>
                                    <i class="fas fa-clipboard-list text-purple-600 text-2xl"></i>
                                </div>
                            </div>
                            
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600">완료 평가</p>
                                        <p class="text-2xl font-bold text-orange-600" id="completedEvaluations">0</p>
                                    </div>
                                    <i class="fas fa-check-circle text-orange-600 text-2xl"></i>
                                </div>
                            </div>
                        </div>

                        <!-- 최근 활동 -->
                        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                <i class="fas fa-history mr-2"></i>최근 활동
                            </h3>
                            <div id="recentActivities" class="space-y-3">
                                <p class="text-gray-600">최근 활동이 없습니다.</p>
                            </div>
                        </div>
                    </div>

                    <!-- 다른 탭 내용들은 JavaScript로 동적 생성 -->
                    <div id="settings" class="tab-content"></div>
                    <div id="evaluation" class="tab-content"></div>
                    <div id="selfEvaluation" class="tab-content"></div>
                    <div id="reports" class="tab-content"></div>
                </main>
            </div>
        </div>

        <!-- JavaScript Modules -->
        <!-- 인증 체크 및 로그아웃 함수 -->
        <script>
            // 로그인 상태 체크
            function checkAuth() {
                const user = localStorage.getItem('user');
                if (!user) {
                    window.location.href = '/';
                    return false;
                }
                
                // 사용자 정보 표시
                const userData = JSON.parse(user);
                document.getElementById('userName').textContent = userData.name;
                document.getElementById('userRole').textContent = userData.role === 'admin' ? '관리자' : '사용자';
                
                return true;
            }

            // 로그아웃 함수
            async function logout() {
                try {
                    const response = await fetch('/api/logout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (response.ok) {
                        localStorage.removeItem('user');
                        window.location.href = '/';
                    }
                } catch (error) {
                    console.error('로그아웃 실패:', error);
                    // 에러가 발생해도 로컬 스토리지는 정리하고 리다이렉트
                    localStorage.removeItem('user');
                    window.location.href = '/';
                }
            }

            // 페이지 로드 시 인증 체크
            document.addEventListener('DOMContentLoaded', checkAuth);
        </script>

        <script src="/public/js/utils.js"></script>
        <script src="/public/js/organization.js"></script>
        <script src="/public/js/manual-input.js"></script>
        <script src="/public/js/member-management.js"></script>
        <script src="/public/js/excel-management.js"></script>
        <script src="/public/js/app.js"></script>
    </body>
    </html>
  `)
})

export default app