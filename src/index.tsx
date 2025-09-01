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
    // 회원가입 사용자의 경우 승인 상태 확인
    if (registeredUsers[email] && registeredUsers[email].status !== 'approved') {
      const statusMessages = {
        'pending': '계정이 아직 승인되지 않았습니다. 관리자의 승인을 기다려주세요.',
        'rejected': '계정이 거부되었습니다. 관리자에게 문의하세요.'
      }
      return c.json({ 
        success: false, 
        message: statusMessages[registeredUsers[email].status] || '계정에 문제가 있습니다.' 
      }, 403)
    }
    
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
  
  // 새 사용자 추가 (승인 대기 상태)
  const newUser = {
    email,
    password, // 실제 운영에서는 해시화해야 함
    name,
    role: role || 'user', // 기본값은 일반 사용자
    status: 'pending', // 승인 대기 상태
    createdAt: new Date().toISOString(),
    approvedAt: null,
    approvedBy: null
  }
  
  existingUsers[email] = newUser
  globalThis.userDatabase = JSON.stringify(existingUsers)
  
  return c.json({ 
    success: true, 
    message: '회원가입 신청이 완료되었습니다. 관리자 승인을 기다려주세요.',
    user: {
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      status: newUser.status
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
    status: user.status || 'approved', // 기존 사용자는 승인됨으로 처리
    createdAt: user.createdAt,
    approvedAt: user.approvedAt,
    approvedBy: user.approvedBy
  }))
  
  return c.json({ success: true, users: userList })
})

// 대기 중인 회원 목록 API
app.get('/api/users/pending', async (c) => {
  const users = JSON.parse(globalThis.userDatabase || '{}')
  const pendingUsers = Object.values(users)
    .filter(user => user.status === 'pending')
    .map(user => ({
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    }))
  
  return c.json({ success: true, users: pendingUsers })
})

// 회원 승인 API
app.post('/api/users/approve', async (c) => {
  const { email, approverEmail } = await c.req.json()
  
  if (!email || !approverEmail) {
    return c.json({ success: false, message: '필수 정보가 누락되었습니다.' }, 400)
  }
  
  const users = JSON.parse(globalThis.userDatabase || '{}')
  
  if (!users[email]) {
    return c.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, 404)
  }
  
  if (users[email].status !== 'pending') {
    return c.json({ success: false, message: '승인 대기 상태가 아닙니다.' }, 400)
  }
  
  // 사용자 승인
  users[email].status = 'approved'
  users[email].approvedAt = new Date().toISOString()
  users[email].approvedBy = approverEmail
  
  globalThis.userDatabase = JSON.stringify(users)
  
  return c.json({ 
    success: true, 
    message: `${users[email].name}님의 계정이 승인되었습니다.`,
    user: {
      email: users[email].email,
      name: users[email].name,
      status: users[email].status
    }
  })
})

// 회원 거부 API
app.post('/api/users/reject', async (c) => {
  const { email, reason, approverEmail } = await c.req.json()
  
  if (!email || !approverEmail) {
    return c.json({ success: false, message: '필수 정보가 누락되었습니다.' }, 400)
  }
  
  const users = JSON.parse(globalThis.userDatabase || '{}')
  
  if (!users[email]) {
    return c.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, 404)
  }
  
  if (users[email].status !== 'pending') {
    return c.json({ success: false, message: '승인 대기 상태가 아닙니다.' }, 400)
  }
  
  // 사용자 거부
  users[email].status = 'rejected'
  users[email].rejectedAt = new Date().toISOString()
  users[email].rejectedBy = approverEmail
  users[email].rejectReason = reason || '승인되지 않음'
  
  globalThis.userDatabase = JSON.stringify(users)
  
  return c.json({ 
    success: true, 
    message: `${users[email].name}님의 계정 신청이 거부되었습니다.`,
    user: {
      email: users[email].email,
      name: users[email].name,
      status: users[email].status
    }
  })
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
                <!-- 관리자 사이드바 -->
                <nav id="adminSidebar" class="bg-white w-64 min-h-screen shadow-sm border-r border-gray-200 hidden lg:block">
                    <div class="p-4">
                        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p class="text-sm font-medium text-red-800">
                                <i class="fas fa-crown mr-2"></i>관리자 모드
                            </p>
                        </div>
                        <ul class="space-y-2">
                            <li>
                                <button onclick="showTab('dashboard')" class="tab-button w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors active">
                                    <i class="fas fa-tachometer-alt mr-3"></i>
                                    관리 대시보드
                                </button>
                            </li>
                            <li>
                                <button onclick="showTab('settings')" class="tab-button w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                    <i class="fas fa-users-cog mr-3"></i>
                                    회원 관리
                                </button>
                            </li>
                            <li>
                                <button onclick="showTab('evaluationManagement')" class="tab-button w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                    <i class="fas fa-tasks mr-3"></i>
                                    다면평가 관리
                                </button>
                            </li>
                            <li>
                                <button onclick="showTab('allReports')" class="tab-button w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                    <i class="fas fa-chart-line mr-3"></i>
                                    전체 평가 결과
                                </button>
                            </li>
                            <li>
                                <button onclick="showTab('systemSettings')" class="tab-button w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                    <i class="fas fa-cog mr-3"></i>
                                    시스템 설정
                                </button>
                            </li>
                        </ul>
                    </div>
                </nav>

                <!-- 사용자 사이드바 -->
                <nav id="userSidebar" class="bg-white w-64 min-h-screen shadow-sm border-r border-gray-200 hidden lg:block">
                    <div class="p-4">
                        <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p class="text-sm font-medium text-blue-800">
                                <i class="fas fa-user mr-2"></i>사용자 모드
                            </p>
                        </div>
                        <ul class="space-y-2">
                            <li>
                                <button onclick="showTab('dashboard')" class="tab-button w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors active">
                                    <i class="fas fa-home mr-3"></i>
                                    개인 대시보드
                                </button>
                            </li>
                            <li>
                                <button onclick="showTab('selfEvaluation')" class="tab-button w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                    <i class="fas fa-user-check mr-3"></i>
                                    자기 평가
                                </button>
                            </li>
                            <li>
                                <button onclick="showTab('peerEvaluation')" class="tab-button w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                    <i class="fas fa-users mr-3"></i>
                                    다면 평가
                                </button>
                            </li>
                            <li>
                                <button onclick="showTab('myReports')" class="tab-button w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                    <i class="fas fa-chart-bar mr-3"></i>
                                    내 평가 결과
                                </button>
                            </li>
                            <li>
                                <button onclick="showTab('notifications')" class="tab-button w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                    <i class="fas fa-bell mr-3"></i>
                                    알림 및 공지
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
                    <!-- 관리자 대시보드 -->
                    <div id="adminDashboard" class="tab-content">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">
                                <i class="fas fa-crown text-yellow-500 mr-2"></i>관리 대시보드
                            </h2>
                            <p class="text-gray-600">전체 시스템 현황과 회원 관리 정보를 확인하세요</p>
                        </div>
                        
                        <!-- 관리자 통계 카드 -->
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600">전체 회원수</p>
                                        <p class="text-2xl font-bold text-blue-600" id="adminTotalUsers">0</p>
                                    </div>
                                    <i class="fas fa-users text-blue-600 text-2xl"></i>
                                </div>
                            </div>
                            
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600">승인 대기</p>
                                        <p class="text-2xl font-bold text-yellow-600" id="adminPendingUsers">0</p>
                                    </div>
                                    <i class="fas fa-user-clock text-yellow-600 text-2xl"></i>
                                </div>
                            </div>
                            
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600">진행 중인 평가</p>
                                        <p class="text-2xl font-bold text-purple-600" id="adminActiveEvaluations">0</p>
                                    </div>
                                    <i class="fas fa-tasks text-purple-600 text-2xl"></i>
                                </div>
                            </div>
                            
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600">완료된 평가</p>
                                        <p class="text-2xl font-bold text-green-600" id="adminCompletedEvaluations">0</p>
                                    </div>
                                    <i class="fas fa-check-circle text-green-600 text-2xl"></i>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- 최근 회원 가입 -->
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                    <i class="fas fa-user-plus text-blue-500 mr-2"></i>최근 가입 승인 요청
                                </h3>
                                <div id="adminRecentSignups" class="space-y-3">
                                    <p class="text-gray-600">승인 대기 중인 회원이 없습니다.</p>
                                </div>
                            </div>

                            <!-- 시스템 알림 -->
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                    <i class="fas fa-bell text-orange-500 mr-2"></i>시스템 알림
                                </h3>
                                <div id="adminSystemAlerts" class="space-y-3">
                                    <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <p class="text-sm text-green-800">시스템이 정상 작동 중입니다.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 사용자 대시보드 -->
                    <div id="userDashboard" class="tab-content">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">
                                <i class="fas fa-home text-blue-500 mr-2"></i>개인 대시보드
                            </h2>
                            <p class="text-gray-600">나의 평가 현황과 개인 통계를 확인하세요</p>
                        </div>
                        
                        <!-- 사용자 통계 카드 -->
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600">내 자기평가</p>
                                        <p class="text-2xl font-bold text-blue-600" id="userSelfEvaluations">0</p>
                                    </div>
                                    <i class="fas fa-user-check text-blue-600 text-2xl"></i>
                                </div>
                            </div>
                            
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600">참여한 다면평가</p>
                                        <p class="text-2xl font-bold text-green-600" id="userPeerEvaluations">0</p>
                                    </div>
                                    <i class="fas fa-users text-green-600 text-2xl"></i>
                                </div>
                            </div>
                            
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600">받은 평가</p>
                                        <p class="text-2xl font-bold text-purple-600" id="userReceivedEvaluations">0</p>
                                    </div>
                                    <i class="fas fa-star text-purple-600 text-2xl"></i>
                                </div>
                            </div>
                            
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600">완료율</p>
                                        <p class="text-2xl font-bold text-orange-600" id="userCompletionRate">0%</p>
                                    </div>
                                    <i class="fas fa-percentage text-orange-600 text-2xl"></i>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- 진행 중인 평가 -->
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                    <i class="fas fa-clock text-blue-500 mr-2"></i>진행 중인 평가
                                </h3>
                                <div id="userOngoingEvaluations" class="space-y-3">
                                    <p class="text-gray-600">진행 중인 평가가 없습니다.</p>
                                </div>
                            </div>

                            <!-- 최근 알림 -->
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                    <i class="fas fa-bell text-orange-500 mr-2"></i>최근 알림
                                </h3>
                                <div id="userRecentNotifications" class="space-y-3">
                                    <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p class="text-sm text-blue-800">업무평가 시스템에 오신 것을 환영합니다!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Dashboard Tab (자동 전환용) -->
                    <div id="dashboard" class="tab-content active">
                        <!-- JavaScript에서 권한에 따라 내용이 동적으로 결정됨 -->
                    </div>

                    <!-- 설정 관리 탭 -->
                    <div id="settings" class="tab-content">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">설정 관리</h2>
                            <p class="text-gray-600">시스템 설정 및 사용자 관리</p>
                        </div>

                        <!-- 회원 승인 관리 -->
                        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-semibold text-gray-900">
                                    <i class="fas fa-user-check mr-2"></i>회원 승인 관리
                                </h3>
                                <button onclick="refreshPendingUsers()" 
                                        class="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                                    <i class="fas fa-sync-alt mr-1"></i>새로고침
                                </button>
                            </div>
                            
                            <div id="pendingUsersContainer">
                                <div class="text-center py-8 text-gray-500">
                                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                    <p>대기 중인 회원을 불러오는 중...</p>
                                </div>
                            </div>
                        </div>

                        <!-- 전체 사용자 관리 -->
                        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-semibold text-gray-900">
                                    <i class="fas fa-users mr-2"></i>전체 사용자 관리
                                </h3>
                                <button onclick="refreshAllUsers()" 
                                        class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                                    <i class="fas fa-sync-alt mr-1"></i>새로고침
                                </button>
                            </div>
                            
                            <div id="allUsersContainer">
                                <div class="text-center py-8 text-gray-500">
                                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                    <p>사용자 목록을 불러오는 중...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- 관리자 전용 탭들 -->
                    <div id="evaluationManagement" class="tab-content">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">다면평가 관리</h2>
                            <p class="text-gray-600">평가 항목 설정, 평가 기간 관리, 평가 대상 설정</p>
                        </div>
                        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <p class="text-gray-600">다면평가 관리 기능이 곧 제공될 예정입니다.</p>
                        </div>
                    </div>

                    <div id="allReports" class="tab-content">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">전체 평가 결과</h2>
                            <p class="text-gray-600">모든 사용자의 평가 결과와 통계를 확인하세요</p>
                        </div>
                        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <p class="text-gray-600">전체 평가 결과 기능이 곧 제공될 예정입니다.</p>
                        </div>
                    </div>

                    <div id="systemSettings" class="tab-content">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">시스템 설정</h2>
                            <p class="text-gray-600">시스템 전반적인 설정을 관리합니다</p>
                        </div>
                        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <p class="text-gray-600">시스템 설정 기능이 곧 제공될 예정입니다.</p>
                        </div>
                    </div>

                    <!-- 사용자 전용 탭들 -->
                    <div id="selfEvaluation" class="tab-content">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">자기 평가</h2>
                            <p class="text-gray-600">자신의 업무 성과를 평가해보세요</p>
                        </div>
                        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <p class="text-gray-600">자기 평가 기능이 곧 제공될 예정입니다.</p>
                        </div>
                    </div>

                    <div id="peerEvaluation" class="tab-content">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">다면 평가</h2>
                            <p class="text-gray-600">동료들을 평가하고 피드백을 제공하세요</p>
                        </div>
                        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <p class="text-gray-600">다면 평가 기능이 곧 제공될 예정입니다.</p>
                        </div>
                    </div>

                    <div id="myReports" class="tab-content">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">내 평가 결과</h2>
                            <p class="text-gray-600">나의 평가 결과와 피드백을 확인하세요</p>
                        </div>
                        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <p class="text-gray-600">개인 평가 결과 기능이 곧 제공될 예정입니다.</p>
                        </div>
                    </div>

                    <div id="notifications" class="tab-content">
                        <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">알림 및 공지</h2>
                            <p class="text-gray-600">중요한 알림과 공지사항을 확인하세요</p>
                        </div>
                        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <div class="space-y-4">
                                <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div class="flex items-start">
                                        <i class="fas fa-info-circle text-blue-500 mt-1 mr-3"></i>
                                        <div>
                                            <h4 class="font-medium text-blue-900">업무평가 시스템 안내</h4>
                                            <p class="text-sm text-blue-700 mt-1">새로운 업무평가 시스템에 오신 것을 환영합니다. 자기평가와 다면평가를 통해 성장하세요!</p>
                                            <p class="text-xs text-blue-600 mt-2">2024-09-01</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 기존 호환성 탭들 -->
                    <div id="evaluation" class="tab-content"></div>
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
                
                // 권한별 UI 표시
                setupRoleBasedUI(userData.role);
                
                return true;
            }

            // 권한별 UI 설정
            function setupRoleBasedUI(role) {
                const adminSidebar = document.getElementById('adminSidebar');
                const userSidebar = document.getElementById('userSidebar');
                const adminDashboard = document.getElementById('adminDashboard');
                const userDashboard = document.getElementById('userDashboard');
                const dashboard = document.getElementById('dashboard');

                if (role === 'admin') {
                    // 관리자 UI 표시
                    adminSidebar.classList.remove('hidden');
                    userSidebar.classList.add('hidden');
                    
                    // 대시보드 내용을 관리자용으로 설정
                    dashboard.innerHTML = adminDashboard.innerHTML;
                    loadAdminDashboardData();
                } else {
                    // 사용자 UI 표시
                    userSidebar.classList.remove('hidden');
                    adminSidebar.classList.add('hidden');
                    
                    // 대시보드 내용을 사용자용으로 설정
                    dashboard.innerHTML = userDashboard.innerHTML;
                    loadUserDashboardData();
                }
            }

            // 관리자 대시보드 데이터 로드
            function loadAdminDashboardData() {
                // 전체 사용자 수 로드
                fetch('/api/users')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            const totalUsers = data.users.length;
                            const pendingUsers = data.users.filter(u => u.status === 'pending').length;
                            
                            document.getElementById('adminTotalUsers').textContent = totalUsers;
                            document.getElementById('adminPendingUsers').textContent = pendingUsers;
                        }
                    })
                    .catch(error => console.error('Admin data load failed:', error));

                // 대기 중인 회원 목록 미리보기
                fetch('/api/users/pending')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            const container = document.getElementById('adminRecentSignups');
                            if (data.users.length === 0) {
                                container.innerHTML = '<p class="text-gray-600">승인 대기 중인 회원이 없습니다.</p>';
                            } else {
                                const recentSignups = data.users.slice(0, 3).map(user => 
                                    '<div class="flex items-center justify-between p-2 bg-gray-50 rounded">' +
                                        '<span class="text-sm font-medium">' + user.name + '</span>' +
                                        '<span class="text-xs text-gray-500">' + new Date(user.createdAt).toLocaleDateString('ko-KR') + '</span>' +
                                    '</div>'
                                ).join('');
                                container.innerHTML = recentSignups;
                            }
                        }
                    })
                    .catch(error => console.error('Pending users load failed:', error));
            }

            // 사용자 대시보드 데이터 로드
            function loadUserDashboardData() {
                // 개인 통계 데이터 (임시 데이터)
                document.getElementById('userSelfEvaluations').textContent = '0';
                document.getElementById('userPeerEvaluations').textContent = '0';
                document.getElementById('userReceivedEvaluations').textContent = '0';
                document.getElementById('userCompletionRate').textContent = '0%';
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
            document.addEventListener('DOMContentLoaded', function() {
                checkAuth();
                // 설정 탭이 활성화되면 데이터 로드
                if (document.getElementById('settings').classList.contains('active')) {
                    loadSettingsData();
                }
            });

            // 설정 관리 데이터 로드
            function loadSettingsData() {
                refreshPendingUsers();
                refreshAllUsers();
            }

            // 대기 중인 회원 목록 새로고침
            async function refreshPendingUsers() {
                const container = document.getElementById('pendingUsersContainer');
                container.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>불러오는 중...</div>';
                
                try {
                    const response = await fetch('/api/users/pending');
                    const data = await response.json();
                    
                    if (data.success) {
                        if (data.users.length === 0) {
                            container.innerHTML = 
                                '<div class="text-center py-8 text-gray-500">' +
                                    '<i class="fas fa-check-circle text-green-500 text-3xl mb-2"></i>' +
                                    '<p>승인 대기 중인 회원이 없습니다.</p>' +
                                '</div>';
                        } else {
                            const usersHTML = data.users.map(user => 
                                '<div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-3">' +
                                    '<div class="flex items-center space-x-4">' +
                                        '<div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">' +
                                            '<i class="fas fa-user text-yellow-600"></i>' +
                                        '</div>' +
                                        '<div>' +
                                            '<h4 class="font-medium text-gray-900">' + user.name + '</h4>' +
                                            '<p class="text-sm text-gray-600">' + user.email + '</p>' +
                                            '<p class="text-xs text-gray-500">' +
                                                (user.role === 'admin' ? '관리자' : '일반 사용자') + ' • ' + 
                                                new Date(user.createdAt).toLocaleString('ko-KR') +
                                            '</p>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="flex space-x-2">' +
                                        '<button onclick="approveUser(\'' + user.email + '\', \'' + user.name + '\')" ' +
                                                'class="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">' +
                                            '<i class="fas fa-check mr-1"></i>승인' +
                                        '</button>' +
                                        '<button onclick="rejectUser(\'' + user.email + '\', \'' + user.name + '\')" ' +
                                                'class="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">' +
                                            '<i class="fas fa-times mr-1"></i>거부' +
                                        '</button>' +
                                    '</div>' +
                                '</div>'
                            ).join('');
                            
                            container.innerHTML = 
                                '<div class="mb-4">' +
                                    '<p class="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">' +
                                        '<i class="fas fa-exclamation-triangle mr-2"></i>' +
                                        '총 <strong>' + data.users.length + '명</strong>의 회원이 승인을 기다리고 있습니다.' +
                                    '</p>' +
                                '</div>' +
                                usersHTML;
                        }
                    } else {
                        throw new Error(data.message || '데이터 로드 실패');
                    }
                } catch (error) {
                    container.innerHTML = 
                        '<div class="text-center py-8 text-red-500">' +
                            '<i class="fas fa-exclamation-circle text-2xl mb-2"></i>' +
                            '<p>데이터를 불러올 수 없습니다.</p>' +
                            '<button onclick="refreshPendingUsers()" class="mt-2 text-sm text-blue-600 hover:text-blue-800">다시 시도</button>' +
                        '</div>';
                }
            }

            // 전체 사용자 목록 새로고침
            async function refreshAllUsers() {
                const container = document.getElementById('allUsersContainer');
                container.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>불러오는 중...</div>';
                
                try {
                    const response = await fetch('/api/users');
                    const data = await response.json();
                    
                    if (data.success) {
                        const usersHTML = data.users.map(user => {
                            const statusBadge = {
                                'approved': '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">승인됨</span>',
                                'pending': '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">대기중</span>',
                                'rejected': '<span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">거부됨</span>'
                            };
                            
                            const roleIcon = user.role === 'admin' ? 'fas fa-crown text-yellow-500' : 'fas fa-user text-gray-500';
                            
                            return '<div class="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">' +
                                    '<div class="flex items-center space-x-3">' +
                                        '<i class="' + roleIcon + '"></i>' +
                                        '<div>' +
                                            '<h5 class="font-medium text-gray-900">' + user.name + '</h5>' +
                                            '<p class="text-sm text-gray-600">' + user.email + '</p>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="text-right">' +
                                        (statusBadge[user.status] || statusBadge['approved']) +
                                        '<p class="text-xs text-gray-500 mt-1">' +
                                            new Date(user.createdAt || Date.now()).toLocaleDateString('ko-KR') +
                                        '</p>' +
                                    '</div>' +
                                '</div>';
                        }).join('');
                        
                        container.innerHTML = 
                            '<div class="mb-4 text-sm text-gray-600">' +
                                '총 <strong>' + data.users.length + '명</strong>의 사용자가 등록되어 있습니다.' +
                            '</div>' +
                            '<div class="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">' +
                                usersHTML +
                            '</div>';
                    } else {
                        throw new Error(data.message || '데이터 로드 실패');
                    }
                } catch (error) {
                    container.innerHTML = 
                        '<div class="text-center py-8 text-red-500">' +
                            '<i class="fas fa-exclamation-circle text-2xl mb-2"></i>' +
                            '<p>사용자 목록을 불러올 수 없습니다.</p>' +
                            '<button onclick="refreshAllUsers()" class="mt-2 text-sm text-blue-600 hover:text-blue-800">다시 시도</button>' +
                        '</div>';
                }
            }

            // 사용자 승인
            async function approveUser(email, name) {
                if (!confirm(name + '님의 계정을 승인하시겠습니까?')) return;
                
                const currentUser = JSON.parse(localStorage.getItem('user'));
                
                try {
                    const response = await fetch('/api/users/approve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            email: email,
                            approverEmail: currentUser.email 
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        alert('✅ ' + data.message);
                        refreshPendingUsers();
                        refreshAllUsers();
                    } else {
                        alert('❌ 승인 실패: ' + data.message);
                    }
                } catch (error) {
                    alert('❌ 승인 중 오류가 발생했습니다.');
                }
            }

            // 사용자 거부
            async function rejectUser(email, name) {
                const reason = prompt(name + '님의 계정 신청을 거부하는 이유를 입력하세요 (선택사항):', '');
                if (reason === null) return; // 취소
                
                const currentUser = JSON.parse(localStorage.getItem('user'));
                
                try {
                    const response = await fetch('/api/users/reject', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            email: email,
                            reason: reason,
                            approverEmail: currentUser.email 
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        alert('✅ ' + data.message);
                        refreshPendingUsers();
                        refreshAllUsers();
                    } else {
                        alert('❌ 거부 처리 실패: ' + data.message);
                    }
                } catch (error) {
                    alert('❌ 거부 처리 중 오류가 발생했습니다.');
                }
            }

            // 탭 변경 감지하여 설정 탭일 때 데이터 로드
            function showTab(tabName) {
                // 기존 showTab 함수가 있다면 호출
                if (window.originalShowTab) {
                    window.originalShowTab(tabName);
                }
                
                // 설정 탭이면 데이터 로드
                if (tabName === 'settings') {
                    setTimeout(loadSettingsData, 100);
                }
            }
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