import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// 정적 파일 서빙 - Cloudflare Pages 방식  
app.use('/public/*', serveStatic({ root: './' }))
app.use('/favicon.ico', serveStatic({ root: './public' }))
app.use('/robots.txt', serveStatic({ root: './public' }))

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
    'test@company.com': { password: 'test123', role: 'admin_user', name: '관리자겸사용자' },
    'manager@company.com': { password: 'manager123', role: 'admin_user', name: '팀장' }
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

// 조직 구조 관련 API
// 조직 목록 조회
app.get('/api/organizations', async (c) => {
  const organizations = JSON.parse(globalThis.organizationDatabase || '{}')
  const orgList = Object.values(organizations).map(org => ({
    id: org.id,
    name: org.name,
    type: org.type,
    parentId: org.parentId,
    description: org.description,
    memberCount: org.memberCount || 0,
    createdAt: org.createdAt
  }))
  
  return c.json({ success: true, organizations: orgList })
})

// 조직 생성
app.post('/api/organizations', async (c) => {
  const { name, type, parentId, description } = await c.req.json()
  
  if (!name || !type) {
    return c.json({ success: false, message: '조직명과 타입은 필수입니다.' }, 400)
  }
  
  const organizations = JSON.parse(globalThis.organizationDatabase || '{}')
  const orgId = 'org_' + Date.now()
  
  const newOrg = {
    id: orgId,
    name: name.trim(),
    type: type, // 'team' 또는 'part'
    parentId: parentId || null,
    description: description || '',
    memberCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  organizations[orgId] = newOrg
  globalThis.organizationDatabase = JSON.stringify(organizations)
  
  return c.json({ 
    success: true, 
    message: '조직이 성공적으로 생성되었습니다.',
    organization: newOrg
  })
})

// 조직 수정
app.put('/api/organizations/:id', async (c) => {
  const orgId = c.req.param('id')
  const { name, type, parentId, description } = await c.req.json()
  
  const organizations = JSON.parse(globalThis.organizationDatabase || '{}')
  
  if (!organizations[orgId]) {
    return c.json({ success: false, message: '조직을 찾을 수 없습니다.' }, 404)
  }
  
  organizations[orgId] = {
    ...organizations[orgId],
    name: name || organizations[orgId].name,
    type: type || organizations[orgId].type,
    parentId: parentId !== undefined ? parentId : organizations[orgId].parentId,
    description: description !== undefined ? description : organizations[orgId].description,
    updatedAt: new Date().toISOString()
  }
  
  globalThis.organizationDatabase = JSON.stringify(organizations)
  
  return c.json({ 
    success: true, 
    message: '조직 정보가 수정되었습니다.',
    organization: organizations[orgId]
  })
})

// 조직 삭제
app.delete('/api/organizations/:id', async (c) => {
  const orgId = c.req.param('id')
  const organizations = JSON.parse(globalThis.organizationDatabase || '{}')
  
  if (!organizations[orgId]) {
    return c.json({ success: false, message: '조직을 찾을 수 없습니다.' }, 404)
  }
  
  // 하위 조직이 있는지 확인
  const hasChildren = Object.values(organizations).some(org => org.parentId === orgId)
  if (hasChildren) {
    return c.json({ success: false, message: '하위 조직이 있어 삭제할 수 없습니다.' }, 400)
  }
  
  delete organizations[orgId]
  globalThis.organizationDatabase = JSON.stringify(organizations)
  
  return c.json({ 
    success: true, 
    message: '조직이 삭제되었습니다.'
  })
})

// 조직 구조 초기화 API (실제 클라우드사업본부 구조)
app.post('/api/organizations/initialize', async (c) => {
  const timestamp = new Date().toISOString()
  
  // 실제 클라우드사업본부 조직 구조
  const cloudBusinessOrganizations = {
    // Sales팀
    'org_sales': {
      id: 'org_sales',
      name: 'Sales팀',
      type: 'team',
      parentId: null,
      description: '영업 및 판매 업무를 담당하는 팀',
      memberCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    'org_sales_sales': {
      id: 'org_sales_sales',
      name: '영업',
      type: 'part',
      parentId: 'org_sales',
      description: '신규 고객 발굴 및 영업 활동',
      memberCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    'org_sales_management': {
      id: 'org_sales_management',
      name: '영업관리',
      type: 'part',
      parentId: 'org_sales',
      description: '영업 프로세스 관리 및 고객 관계 관리',
      memberCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    
    // CX팀
    'org_cx': {
      id: 'org_cx',
      name: 'CX팀',
      type: 'team',
      parentId: null,
      description: '고객 경험 및 기술 지원을 담당하는 팀',
      memberCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    'org_cx_customer_service': {
      id: 'org_cx_customer_service',
      name: '고객서비스',
      type: 'part',
      parentId: 'org_cx',
      description: '고객 문의 및 서비스 지원',
      memberCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    'org_cx_tech_support': {
      id: 'org_cx_tech_support',
      name: '기술지원',
      type: 'part',
      parentId: 'org_cx',
      description: '기술적 문제 해결 및 지원',
      memberCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    'org_cx_tech_writing': {
      id: 'org_cx_tech_writing',
      name: 'Technical Writing',
      type: 'part',
      parentId: 'org_cx',
      description: '기술 문서 작성 및 관리',
      memberCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    
    // 사업운영
    'org_business_ops': {
      id: 'org_business_ops',
      name: '사업운영',
      type: 'team',
      parentId: null,
      description: '사업 전략 및 마케팅 업무를 담당하는 팀',
      memberCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    'org_business_ops_tech_marketing': {
      id: 'org_business_ops_tech_marketing',
      name: 'Technical Marketing',
      type: 'part',
      parentId: 'org_business_ops',
      description: '기술 중심의 마케팅 전략 및 실행',
      memberCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  }
  
  // 기존 데이터 모두 삭제하고 새 구조로 교체
  globalThis.organizationDatabase = JSON.stringify(cloudBusinessOrganizations)
  
  return c.json({ 
    success: true, 
    message: '클라우드사업본부 조직 구조가 성공적으로 초기화되었습니다.',
    organizations: Object.values(cloudBusinessOrganizations)
  })
})

// 평가 항목 관련 API
// 평가 항목 조회 (정량/정성)
app.get('/api/evaluation-items', async (c) => {
  const evaluationItems = JSON.parse(globalThis.evaluationItemsDatabase || '{}')
  
  const quantitative = evaluationItems.quantitative || [
    { id: 'q1', name: '목표 달성률', description: '개인 목표 대비 달성 비율 (%)', weight: 40, type: 'percentage' },
    { id: 'q2', name: 'KPI 성과', description: '핵심성과지표 달성도 (1-5점)', weight: 35, type: 'rating' },
    { id: 'q3', name: '프로젝트 기여도', description: '프로젝트 성공도 및 기여 수준', weight: 25, type: 'rating' }
  ]
  
  const qualitative = evaluationItems.qualitative || [
    { id: 'ql1', name: '리더십', description: '팀을 이끄는 능력과 영향력', scale: '1-5점' },
    { id: 'ql2', name: '의사소통', description: '명확하고 효과적인 커뮤니케이션', scale: '1-5점' },
    { id: 'ql3', name: '전문성', description: '직무 관련 지식과 기술 수준', scale: '1-5점' },
    { id: 'ql4', name: '협업 능력', description: '팀워크와 상호 협력 정도', scale: '1-5점' }
  ]
  
  return c.json({ 
    success: true, 
    evaluationItems: {
      quantitative,
      qualitative
    }
  })
})

// 평가 항목 저장
app.post('/api/evaluation-items', async (c) => {
  const { quantitative, qualitative } = await c.req.json()
  
  const evaluationItems = {
    quantitative: quantitative || [],
    qualitative: qualitative || [],
    updatedAt: new Date().toISOString()
  }
  
  globalThis.evaluationItemsDatabase = JSON.stringify(evaluationItems)
  
  return c.json({ 
    success: true, 
    message: '평가 항목이 저장되었습니다.',
    evaluationItems
  })
})

// 고도화된 사용자 관리 API

// 사용자 상태 변경 (비활성화/활성화)
app.put('/api/users/:email/status', async (c) => {
  const email = c.req.param('email')
  const { status, reason } = await c.req.json()
  
  const users = JSON.parse(globalThis.userDatabase || '{}')
  
  if (!users[email]) {
    return c.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, 404)
  }
  
  const validStatuses = ['active', 'inactive', 'approved', 'pending', 'rejected']
  if (!validStatuses.includes(status)) {
    return c.json({ success: false, message: '유효하지 않은 상태입니다.' }, 400)
  }
  
  users[email].status = status
  users[email].statusReason = reason || ''
  users[email].statusChangedAt = new Date().toISOString()
  
  globalThis.userDatabase = JSON.stringify(users)
  
  const statusMessages = {
    'active': '활성화',
    'inactive': '비활성화', 
    'approved': '승인',
    'pending': '대기',
    'rejected': '거부'
  }
  
  return c.json({ 
    success: true, 
    message: `사용자가 ${statusMessages[status]}되었습니다.`,
    user: {
      email: users[email].email,
      name: users[email].name,
      status: users[email].status
    }
  })
})

// 사용자 조직 배치
app.put('/api/users/:email/organization', async (c) => {
  const email = c.req.param('email')
  const { organizationId } = await c.req.json()
  
  const users = JSON.parse(globalThis.userDatabase || '{}')
  const organizations = JSON.parse(globalThis.organizationDatabase || '{}')
  
  if (!users[email]) {
    return c.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, 404)
  }
  
  if (organizationId && !organizations[organizationId]) {
    return c.json({ success: false, message: '조직을 찾을 수 없습니다.' }, 404)
  }
  
  // 기존 조직에서 멤버 수 감소
  if (users[email].organizationId) {
    const oldOrg = organizations[users[email].organizationId]
    if (oldOrg) {
      oldOrg.memberCount = Math.max(0, (oldOrg.memberCount || 0) - 1)
    }
  }
  
  // 새 조직에 멤버 수 증가
  if (organizationId) {
    organizations[organizationId].memberCount = (organizations[organizationId].memberCount || 0) + 1
  }
  
  users[email].organizationId = organizationId
  users[email].organizationAssignedAt = new Date().toISOString()
  
  globalThis.userDatabase = JSON.stringify(users)
  globalThis.organizationDatabase = JSON.stringify(organizations)
  
  return c.json({ 
    success: true, 
    message: '사용자 조직이 변경되었습니다.',
    user: {
      email: users[email].email,
      name: users[email].name,
      organizationId: users[email].organizationId
    }
  })
})

// 사용자 완전 삭제
app.delete('/api/users/:email', async (c) => {
  const email = c.req.param('email')
  const users = JSON.parse(globalThis.userDatabase || '{}')
  
  if (!users[email]) {
    return c.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, 404)
  }
  
  // 조직에서 멤버 수 감소
  if (users[email].organizationId) {
    const organizations = JSON.parse(globalThis.organizationDatabase || '{}')
    const org = organizations[users[email].organizationId]
    if (org) {
      org.memberCount = Math.max(0, (org.memberCount || 0) - 1)
      globalThis.organizationDatabase = JSON.stringify(organizations)
    }
  }
  
  delete users[email]
  globalThis.userDatabase = JSON.stringify(users)
  
  return c.json({ 
    success: true, 
    message: '사용자가 완전히 삭제되었습니다.'
  })
})

// 일괄 사용자 승인
app.post('/api/users/bulk-approve', async (c) => {
  const { approverEmail } = await c.req.json()
  
  if (!approverEmail) {
    return c.json({ success: false, message: '승인자 정보가 필요합니다.' }, 400)
  }
  
  const users = JSON.parse(globalThis.userDatabase || '{}')
  let approvedCount = 0
  
  for (const email in users) {
    if (users[email].status === 'pending') {
      users[email].status = 'approved'
      users[email].approvedAt = new Date().toISOString()
      users[email].approvedBy = approverEmail
      approvedCount++
    }
  }
  
  globalThis.userDatabase = JSON.stringify(users)
  
  return c.json({ 
    success: true, 
    message: `총 ${approvedCount}명의 사용자가 승인되었습니다.`,
    approvedCount
  })
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
                                    <option value="user">일반 사용자 (평가 대상자)</option>
                                    <option value="admin">관리자 (시스템 관리 전용)</option>
                                    <option value="admin_user">관리자겸사용자 (팀장, 관리자 권한 + 평가 대상자)</option>
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
                                    <i class="fas fa-cogs mr-3"></i>
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
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">
                                <i class="fas fa-cog text-gray-600 mr-2"></i>시스템 설정
                            </h2>
                            <p class="text-gray-600">평가 시스템의 전반적인 설정을 관리합니다</p>
                        </div>

                        <!-- 설정 네비게이션 -->
                        <div class="mb-6">
                            <div class="border-b border-gray-200">
                                <nav class="-mb-px flex space-x-8">
                                    <button onclick="showSettingsTab('organization')" 
                                            class="settings-tab-btn py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600" 
                                            id="orgTab">
                                        <i class="fas fa-sitemap mr-2"></i>조직 구조
                                    </button>
                                    <button onclick="showSettingsTab('evaluation')" 
                                            class="settings-tab-btn py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300" 
                                            id="evalTab">
                                        <i class="fas fa-tasks mr-2"></i>평가 유형
                                    </button>
                                    <button onclick="showSettingsTab('users')" 
                                            class="settings-tab-btn py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300" 
                                            id="usersTab">
                                        <i class="fas fa-users-cog mr-2"></i>사용자 관리
                                    </button>
                                    <button onclick="showSettingsTab('schedule')" 
                                            class="settings-tab-btn py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300" 
                                            id="scheduleTab">
                                        <i class="fas fa-calendar-alt mr-2"></i>평가 일정
                                    </button>
                                </nav>
                            </div>
                        </div>

                        <!-- 조직 구조 설정 -->
                        <div id="organizationSettings" class="settings-content">
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <!-- 조직도 표시 -->
                                <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <div class="flex items-center justify-between mb-4">
                                        <h3 class="text-lg font-semibold text-gray-900">
                                            <i class="fas fa-sitemap text-blue-500 mr-2"></i>현재 조직 구조
                                        </h3>
                                        <div class="flex space-x-2">
                                            <button onclick="initializeRealOrganization()" 
                                                    class="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors">
                                                <i class="fas fa-sync mr-1"></i>실제 구조로 초기화
                                            </button>
                                            <button onclick="refreshOrganization()" 
                                                    class="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                                                <i class="fas fa-sync-alt mr-1"></i>새로고침
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div id="organizationTree" class="space-y-2">
                                        <div class="text-center py-4 text-gray-500">
                                            <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                                            <p>조직 구조를 불러오는 중...</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- 팀/파트 관리 -->
                                <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                        <i class="fas fa-plus text-green-500 mr-2"></i>팀/파트 관리
                                    </h3>
                                    
                                    <form id="organizationForm" class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">구분</label>
                                            <select id="orgType" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <option value="team">팀</option>
                                                <option value="part">파트</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">이름</label>
                                            <input type="text" id="orgName" placeholder="예: 개발3팀" 
                                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">상위 조직</label>
                                            <select id="parentOrg" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <option value="">클라우드사업본부 (최상위)</option>
                                                <!-- 동적으로 로드되는 옵션들 -->
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">설명</label>
                                            <textarea id="orgDescription" rows="3" placeholder="조직의 역할과 업무를 설명해주세요" 
                                                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                                        </div>
                                        
                                        <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                                            <i class="fas fa-plus mr-2"></i>조직 추가
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <!-- 평가 유형 설정 -->
                        <div id="evaluationSettings" class="settings-content hidden">
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <!-- 정량평가 설정 -->
                                <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                        <i class="fas fa-chart-bar text-blue-500 mr-2"></i>정량평가 항목
                                    </h3>
                                    
                                    <div class="space-y-3 mb-4">
                                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <span class="font-medium">목표 달성률</span>
                                                <p class="text-sm text-gray-600">개인 목표 대비 달성 비율 (%)</p>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <span class="text-sm text-gray-500">가중치: 40%</span>
                                                <button class="text-blue-600 hover:text-blue-800">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <span class="font-medium">KPI 성과</span>
                                                <p class="text-sm text-gray-600">핵심성과지표 달성도 (1-5점)</p>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <span class="text-sm text-gray-500">가중치: 35%</span>
                                                <button class="text-blue-600 hover:text-blue-800">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <span class="font-medium">프로젝트 기여도</span>
                                                <p class="text-sm text-gray-600">프로젝트 성공도 및 기여 수준</p>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <span class="text-sm text-gray-500">가중치: 25%</span>
                                                <button class="text-blue-600 hover:text-blue-800">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button class="w-full bg-blue-100 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors">
                                        <i class="fas fa-plus mr-2"></i>새 항목 추가
                                    </button>
                                </div>

                                <!-- 정성평가 설정 -->
                                <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                        <i class="fas fa-comments text-green-500 mr-2"></i>정성평가 항목
                                    </h3>
                                    
                                    <div class="space-y-3 mb-4">
                                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <span class="font-medium">리더십</span>
                                                <p class="text-sm text-gray-600">팀을 이끄는 능력과 영향력</p>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <span class="text-sm text-gray-500">1-5점</span>
                                                <button class="text-blue-600 hover:text-blue-800">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <span class="font-medium">의사소통</span>
                                                <p class="text-sm text-gray-600">명확하고 효과적인 커뮤니케이션</p>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <span class="text-sm text-gray-500">1-5점</span>
                                                <button class="text-blue-600 hover:text-blue-800">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <span class="font-medium">전문성</span>
                                                <p class="text-sm text-gray-600">직무 관련 지식과 기술 수준</p>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <span class="text-sm text-gray-500">1-5점</span>
                                                <button class="text-blue-600 hover:text-blue-800">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <span class="font-medium">협업 능력</span>
                                                <p class="text-sm text-gray-600">팀워크와 상호 협력 정도</p>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <span class="text-sm text-gray-500">1-5점</span>
                                                <button class="text-blue-600 hover:text-blue-800">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button class="w-full bg-green-100 text-green-700 py-2 rounded-lg font-medium hover:bg-green-200 transition-colors">
                                        <i class="fas fa-plus mr-2"></i>새 항목 추가
                                    </button>
                                </div>
                            </div>
                            
                            <!-- 평가 방식 설정 -->
                            <div class="mt-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                    <i class="fas fa-sliders-h text-purple-500 mr-2"></i>평가 방식 설정
                                </h3>
                                
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">평가 비율</label>
                                        <div class="space-y-2">
                                            <div class="flex justify-between">
                                                <span class="text-sm">정량평가</span>
                                                <span class="text-sm font-semibold">60%</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-sm">정성평가</span>
                                                <span class="text-sm font-semibold">40%</span>
                                            </div>
                                            <button class="text-sm text-blue-600 hover:text-blue-800">비율 조정</button>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">평가 등급</label>
                                        <div class="space-y-1 text-sm">
                                            <div>S등급 (90-100점)</div>
                                            <div>A등급 (80-89점)</div>
                                            <div>B등급 (70-79점)</div>
                                            <div>C등급 (60-69점)</div>
                                            <div>D등급 (60점 미만)</div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">평가 주기</label>
                                        <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            <option value="quarterly">분기별 (3개월)</option>
                                            <option value="semiannual">반기별 (6개월)</option>
                                            <option value="annual">연간 (12개월)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 고도화된 사용자 관리 -->
                        <div id="usersSettings" class="settings-content hidden">
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                    <i class="fas fa-users-cog text-indigo-500 mr-2"></i>고급 사용자 관리
                                </h3>
                                
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- 사용자 상태 관리 -->
                                    <div>
                                        <h4 class="font-medium text-gray-900 mb-3">사용자 상태 관리</h4>
                                        <div id="userStatusManagement" class="space-y-3">
                                            <div class="text-center py-4 text-gray-500">
                                                <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                                                <p>사용자 목록을 불러오는 중...</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- 일괄 작업 -->
                                    <div>
                                        <h4 class="font-medium text-gray-900 mb-3">일괄 작업</h4>
                                        <div class="space-y-3">
                                            <button onclick="bulkApproveUsers()" class="w-full flex items-center justify-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                                                <i class="fas fa-check-double mr-2"></i>
                                                대기 중인 회원 모두 승인
                                            </button>
                                            <button onclick="cleanupInactiveUsers()" class="w-full flex items-center justify-center px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors">
                                                <i class="fas fa-user-slash mr-2"></i>
                                                비활성 사용자 정리
                                            </button>
                                            <button onclick="exportUserList()" class="w-full flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                                                <i class="fas fa-download mr-2"></i>
                                                사용자 목록 내보내기
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 평가 일정 관리 -->
                        <div id="scheduleSettings" class="settings-content hidden">
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <!-- 현재 평가 일정 -->
                                <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                        <i class="fas fa-calendar-check text-green-500 mr-2"></i>현재 평가 일정
                                    </h3>
                                    
                                    <div class="space-y-4">
                                        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div class="flex justify-between items-start">
                                                <div>
                                                    <h4 class="font-medium text-blue-900">2024년 3분기 평가</h4>
                                                    <p class="text-sm text-blue-700 mt-1">자기평가 및 다면평가</p>
                                                </div>
                                                <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">진행중</span>
                                            </div>
                                            <div class="mt-3 text-sm text-blue-600">
                                                <div>시작일: 2024.09.01</div>
                                                <div>마감일: 2024.09.30</div>
                                                <div class="mt-2">
                                                    <div class="w-full bg-blue-200 rounded-full h-2">
                                                        <div class="bg-blue-600 h-2 rounded-full" style="width: 15%"></div>
                                                    </div>
                                                    <span class="text-xs">진행률: 15%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 새 평가 일정 생성 -->
                                <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                        <i class="fas fa-plus text-purple-500 mr-2"></i>새 평가 일정 생성
                                    </h3>
                                    
                                    <form class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">평가명</label>
                                            <input type="text" placeholder="예: 2024년 4분기 평가" 
                                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        </div>
                                        
                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">시작일</label>
                                                <input type="date" 
                                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">마감일</label>
                                                <input type="date" 
                                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">평가 대상</label>
                                            <div class="space-y-2">
                                                <label class="flex items-center">
                                                    <input type="checkbox" class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" checked>
                                                    <span class="ml-2 text-sm">전체 구성원</span>
                                                </label>
                                                <label class="flex items-center">
                                                    <input type="checkbox" class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                                                    <span class="ml-2 text-sm">개발1팀만</span>
                                                </label>
                                                <label class="flex items-center">
                                                    <input type="checkbox" class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                                                    <span class="ml-2 text-sm">관리자급만</span>
                                                </label>
                                            </div>
                                        </div>
                                        
                                        <button type="submit" class="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors">
                                            <i class="fas fa-calendar-plus mr-2"></i>평가 일정 생성
                                        </button>
                                    </form>
                                </div>
                            </div>
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
                const roleNames = {
                    'admin': '관리자',
                    'user': '사용자', 
                    'admin_user': '관리자겸사용자'
                };
                document.getElementById('userRole').textContent = roleNames[userData.role] || '사용자';
                
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

                if (role === 'admin' || role === 'admin_user') {
                    // 관리자 또는 관리자겸사용자 UI 표시
                    adminSidebar.classList.remove('hidden');
                    userSidebar.classList.add('hidden');
                    
                    // 관리자겸사용자인 경우 특별 표시
                    if (role === 'admin_user') {
                        const adminModeIndicator = document.querySelector('#adminSidebar .bg-red-50');
                        if (adminModeIndicator) {
                            adminModeIndicator.innerHTML = 
                                '<p class="text-sm font-medium text-orange-800">' +
                                    '<i class="fas fa-users-cog mr-2"></i>관리자겸사용자 모드' +
                                '</p>' +
                                '<p class="text-xs text-orange-600 mt-1">관리 권한 + 평가 대상자</p>';
                            adminModeIndicator.className = 'mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg';
                        }
                    }
                    
                    // 대시보드 내용을 관리자용으로 설정
                    dashboard.innerHTML = adminDashboard.innerHTML;
                    loadAdminDashboardData();
                } else {
                    // 일반 사용자 UI 표시
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
                        // 전역 사용자 목록 업데이트
                        currentPendingUsers = data.users;
                        
                        if (data.users.length === 0) {
                            container.innerHTML = 
                                '<div class="text-center py-8 text-gray-500">' +
                                    '<i class="fas fa-check-circle text-green-500 text-3xl mb-2"></i>' +
                                    '<p>승인 대기 중인 회원이 없습니다.</p>' +
                                '</div>';
                        } else {
                            const usersHTML = data.users.map((user, index) => 
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
                                        '<button onclick="approveUserById(' + index + ')" ' +
                                                'class="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">' +
                                            '<i class="fas fa-check mr-1"></i>승인' +
                                        '</button>' +
                                        '<button onclick="rejectUserById(' + index + ')" ' +
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
                            
                            const roleIcons = {
                                'admin': 'fas fa-crown text-yellow-500',
                                'admin_user': 'fas fa-users-cog text-orange-500',
                                'user': 'fas fa-user text-gray-500'
                            };
                            const roleIcon = roleIcons[user.role] || roleIcons['user'];
                            
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

            // 전역 사용자 목록 저장소
            let currentPendingUsers = [];

            // 사용자 승인 (ID 기반)
            async function approveUserById(index) {
                if (index >= 0 && index < currentPendingUsers.length) {
                    const user = currentPendingUsers[index];
                    await approveUser(user.email, user.name);
                }
            }

            // 사용자 거부 (ID 기반)
            async function rejectUserById(index) {
                if (index >= 0 && index < currentPendingUsers.length) {
                    const user = currentPendingUsers[index];
                    await rejectUser(user.email, user.name);
                }
            }

            // 시스템 설정 탭 전환 함수
            function showSettingsTab(tabName) {
                // 모든 설정 탭 숨기기
                const settingsContents = document.querySelectorAll('.settings-content');
                settingsContents.forEach(content => content.classList.add('hidden'));
                
                // 모든 설정 탭 버튼 비활성화
                const settingsTabBtns = document.querySelectorAll('.settings-tab-btn');
                settingsTabBtns.forEach(btn => {
                    btn.className = 'settings-tab-btn py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300';
                });
                
                // 선택된 탭 활성화
                const targetTab = document.getElementById(tabName + 'Settings');
                const targetBtn = document.getElementById(tabName.charAt(0).toLowerCase() + tabName.slice(1) + 'Tab');
                
                if (targetTab) targetTab.classList.remove('hidden');
                if (targetBtn) {
                    targetBtn.className = 'settings-tab-btn py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600';
                }
                
                // 특정 탭 데이터 로드
                switch(tabName) {
                    case 'organization':
                        refreshOrganization();
                        break;
                    case 'users':
                        loadUserStatusManagement();
                        break;
                }
            }
            
            // 조직 구조 새로고침
            async function refreshOrganization() {
                const container = document.getElementById('organizationTree');
                if (!container) return;
                
                try {
                    const response = await fetch('/api/organizations');
                    const data = await response.json();
                    
                    if (data.success) {
                        const organizations = data.organizations;
                        
                        // 조직을 계층 구조로 정리
                        const rootOrgs = organizations.filter(org => !org.parentId);
                        const childOrgs = organizations.filter(org => org.parentId);
                        
                        let orgTreeHTML = '<div class="p-4 bg-gray-50 rounded-lg">' +
                            '<div class="flex items-center justify-between">' +
                                '<div class="flex items-center">' +
                                    '<i class="fas fa-building text-gray-600 mr-2"></i>' +
                                    '<span class="font-medium">클라우드사업본부</span>' +
                                '</div>' +
                                '<span class="text-sm text-gray-500">총 ' + organizations.length + '개 조직</span>' +
                            '</div>';
                        
                        if (rootOrgs.length > 0 || childOrgs.length > 0) {
                            orgTreeHTML += '<div class="ml-6 mt-3 space-y-2">';
                            
                            // 최상위 조직들 (팀들)
                            rootOrgs.forEach(org => {
                                const children = childOrgs.filter(child => child.parentId === org.id);
                                orgTreeHTML += '<div class="space-y-1">' +
                                    '<div class="flex items-center justify-between">' +
                                        '<div class="flex items-center text-sm text-gray-700">' +
                                            '<i class="fas fa-users mr-2"></i>' +
                                            '<span>' + org.name + ' (' + org.memberCount + '명)</span>' +
                                        '</div>' +
                                        '<div class="flex space-x-1">' +
                                            '<button onclick="editOrganization(\\''+org.id+'\\')" class="text-blue-600 hover:text-blue-800">' +
                                                '<i class="fas fa-edit text-xs"></i>' +
                                            '</button>' +
                                            '<button onclick="deleteOrganization(\\''+org.id+'\\', \\''+org.name+'\\')" class="text-red-600 hover:text-red-800">' +
                                                '<i class="fas fa-trash text-xs"></i>' +
                                            '</button>' +
                                        '</div>' +
                                    '</div>';
                                
                                // 하위 조직들 (파트들)
                                if (children.length > 0) {
                                    orgTreeHTML += '<div class="ml-6 space-y-1">';
                                    children.forEach(child => {
                                        orgTreeHTML += '<div class="flex items-center justify-between text-sm text-gray-600">' +
                                            '<div class="flex items-center">' +
                                                '<i class="fas fa-users mr-2"></i>' +
                                                '<span>' + child.name + ' (' + child.memberCount + '명)</span>' +
                                            '</div>' +
                                            '<div class="flex space-x-1">' +
                                                '<button onclick="editOrganization(\\''+child.id+'\\')" class="text-blue-600 hover:text-blue-800">' +
                                                    '<i class="fas fa-edit text-xs"></i>' +
                                                '</button>' +
                                                '<button onclick="deleteOrganization(\\''+child.id+'\\', \\''+child.name+'\\')" class="text-red-600 hover:text-red-800">' +
                                                    '<i class="fas fa-trash text-xs"></i>' +
                                                '</button>' +
                                            '</div>' +
                                        '</div>';
                                    });
                                    orgTreeHTML += '</div>';
                                }
                                orgTreeHTML += '</div>';
                            });
                            
                            orgTreeHTML += '</div>';
                        } else {
                            orgTreeHTML += '<div class="ml-6 mt-3 text-sm text-gray-500">등록된 조직이 없습니다.</div>';
                        }
                        
                        orgTreeHTML += '</div>';
                        container.innerHTML = orgTreeHTML;
                        
                        // 상위 조직 선택 옵션도 업데이트
                        updateParentOrgOptions(organizations);
                        
                    } else {
                        container.innerHTML = '<div class="p-4 bg-red-50 text-red-700 rounded-lg">조직 데이터를 불러올 수 없습니다.</div>';
                    }
                } catch (error) {
                    container.innerHTML = '<div class="p-4 bg-red-50 text-red-700 rounded-lg">조직 데이터 로드 실패</div>';
                }
            }
            
            // 상위 조직 옵션 업데이트
            function updateParentOrgOptions(organizations) {
                const parentSelect = document.getElementById('parentOrg');
                if (!parentSelect) return;
                
                parentSelect.innerHTML = '<option value="">클라우드사업본부 (최상위)</option>';
                
                organizations.forEach(org => {
                    if (org.type === 'team') { // 팀만 상위 조직으로 선택 가능
                        const option = document.createElement('option');
                        option.value = org.id;
                        option.textContent = org.name;
                        parentSelect.appendChild(option);
                    }
                });
            }
            
            // 실제 클라우드사업본부 조직 구조로 초기화
            async function initializeRealOrganization() {
                if (!confirm('⚠️ 기존 조직 데이터를 모두 삭제하고 실제 클라우드사업본부 구조로 초기화하시겠습니까?\\n\\n초기화될 구조:\\n• Sales팀 (영업, 영업관리)\\n• CX팀 (고객서비스, 기술지원, Technical Writing)\\n• 사업운영 (Technical Marketing)')) {
                    return;
                }
                
                try {
                    const response = await fetch('/api/organizations/initialize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('✅ ' + result.message + '\\n\\n총 ' + result.organizations.length + '개 조직이 생성되었습니다.');
                        refreshOrganization(); // 조직도 새로고침
                    } else {
                        alert('❌ 초기화 실패: ' + result.message);
                    }
                } catch (error) {
                    console.error('Organization initialization error:', error);
                    alert('❌ 조직 구조 초기화 중 오류가 발생했습니다.');
                }
            }
            
            // 조직 폼 제출 처리
            document.addEventListener('DOMContentLoaded', function() {
                const orgForm = document.getElementById('organizationForm');
                if (orgForm) {
                    orgForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        
                        const formData = {
                            name: document.getElementById('orgName').value.trim(),
                            type: document.getElementById('orgType').value,
                            parentId: document.getElementById('parentOrg').value || null,
                            description: document.getElementById('orgDescription').value.trim()
                        };
                        
                        if (!formData.name) {
                            alert('조직명을 입력해주세요.');
                            return;
                        }
                        
                        try {
                            const response = await fetch('/api/organizations', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(formData)
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                alert('✅ ' + result.message);
                                orgForm.reset();
                                refreshOrganization(); // 조직도 새로고침
                            } else {
                                alert('❌ ' + result.message);
                            }
                        } catch (error) {
                            alert('❌ 조직 생성 중 오류가 발생했습니다.');
                        }
                    });
                }
            });
            
            // 조직 편집
            function editOrganization(orgId) {
                alert('조직 편집 기능이 곧 구현됩니다. (ID: ' + orgId + ')');
            }
            
            // 조직 삭제
            async function deleteOrganization(orgId, orgName) {
                if (!confirm('조직 "' + orgName + '"을(를) 삭제하시겠습니까?\\n\\n하위 조직이 있으면 삭제할 수 없습니다.')) {
                    return;
                }
                
                try {
                    const response = await fetch('/api/organizations/' + orgId, {
                        method: 'DELETE'
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('✅ ' + result.message);
                        refreshOrganization(); // 조직도 새로고침
                    } else {
                        alert('❌ ' + result.message);
                    }
                } catch (error) {
                    alert('❌ 조직 삭제 중 오류가 발생했습니다.');
                }
            }
            
            // 사용자 상태 관리 로드
            async function loadUserStatusManagement() {
                const container = document.getElementById('userStatusManagement');
                if (!container) return;
                
                container.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>불러오는 중...</div>';
                
                try {
                    const response = await fetch('/api/users');
                    const data = await response.json();
                    
                    if (data.success && data.users.length > 0) {
                        // 전역 변수에 사용자 목록 저장
                        currentAllUsers = data.users;
                        const usersHTML = data.users.map((user, index) => {
                            const statusColors = {
                                'approved': 'bg-green-100 text-green-800',
                                'pending': 'bg-yellow-100 text-yellow-800',
                                'rejected': 'bg-red-100 text-red-800',
                                'inactive': 'bg-gray-100 text-gray-800'
                            };
                            
                            const statusText = {
                                'approved': '활성',
                                'pending': '대기',
                                'rejected': '거부됨',
                                'inactive': '비활성'
                            };
                            
                            const currentStatus = user.status || 'approved';
                            
                            const roleIcons = {
                                'admin': 'fas fa-crown text-yellow-600',
                                'admin_user': 'fas fa-users-cog text-orange-600', 
                                'user': 'fas fa-user text-gray-600'
                            };
                            const roleNames = {
                                'admin': '관리자',
                                'admin_user': '관리자겸사용자',
                                'user': '사용자'
                            };
                            
                            return '<div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">' +
                                    '<div class="flex items-center space-x-3">' +
                                        '<div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">' +
                                            '<i class="' + (roleIcons[user.role] || roleIcons['user']) + ' text-sm"></i>' +
                                        '</div>' +
                                        '<div>' +
                                            '<div class="font-medium text-sm">' + user.name + '</div>' +
                                            '<div class="text-xs text-gray-500">' + user.email + ' • ' + (roleNames[user.role] || '사용자') + '</div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="flex items-center space-x-2">' +
                                        '<span class="px-2 py-1 rounded-full text-xs ' + statusColors[currentStatus] + '">' + 
                                            statusText[currentStatus] + 
                                        '</span>' +
                                        '<div class="relative">' +
                                            '<button onclick="toggleUserActions(' + index + ')" class="text-gray-400 hover:text-gray-600">' +
                                                '<i class="fas fa-ellipsis-v"></i>' +
                                            '</button>' +
                                            '<div id="userActions' + index + '" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">' +
                                                '<div class="py-1">' +
                                                    (currentStatus === 'pending' ? 
                                                        '<button onclick="approveUserById(' + index + ')" class="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50">' +
                                                            '<i class="fas fa-check mr-2"></i>승인' +
                                                        '</button>' +
                                                        '<button onclick="rejectUserById(' + index + ')" class="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50">' +
                                                            '<i class="fas fa-times mr-2"></i>거부' +
                                                        '</button>' : '') +
                                                    (currentStatus === 'approved' ? 
                                                        '<button onclick="deactivateUser(' + index + ')" class="block w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50">' +
                                                            '<i class="fas fa-user-slash mr-2"></i>비활성화' +
                                                        '</button>' : '') +
                                                    (currentStatus === 'inactive' ? 
                                                        '<button onclick="activateUser(' + index + ')" class="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50">' +
                                                            '<i class="fas fa-user-check mr-2"></i>활성화' +
                                                        '</button>' : '') +
                                                    '<button onclick="deleteUser(' + index + ')" class="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50">' +
                                                        '<i class="fas fa-trash mr-2"></i>완전 삭제' +
                                                    '</button>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>';
                        }).join('');
                        
                        container.innerHTML = usersHTML;
                    } else {
                        container.innerHTML = '<div class="text-center py-8 text-gray-500">등록된 사용자가 없습니다.</div>';
                    }
                } catch (error) {
                    container.innerHTML = '<div class="text-center py-8 text-red-500">데이터 로드 실패</div>';
                }
            }
            
            // 사용자 액션 토글
            function toggleUserActions(index) {
                const actionDiv = document.getElementById('userActions' + index);
                if (actionDiv) {
                    actionDiv.classList.toggle('hidden');
                    
                    // 다른 열린 액션들은 닫기
                    const allActions = document.querySelectorAll('[id^="userActions"]');
                    allActions.forEach((div, i) => {
                        if (i !== index) div.classList.add('hidden');
                    });
                }
            }
            
            // 현재 사용자 목록 (사용자 관리 탭용)
            let currentAllUsers = [];
            
            // 사용자 비활성화
            async function deactivateUser(index) {
                if (index < 0 || index >= currentAllUsers.length) return;
                
                const user = currentAllUsers[index];
                const reason = prompt(user.name + '님을 비활성화하는 이유를 입력하세요:', '');
                if (reason === null) return;
                
                try {
                    const response = await fetch('/api/users/' + encodeURIComponent(user.email) + '/status', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'inactive', reason: reason })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        alert('✅ ' + data.message);
                        loadUserStatusManagement(); // 목록 새로고침
                    } else {
                        alert('❌ ' + data.message);
                    }
                } catch (error) {
                    alert('❌ 비활성화 처리 중 오류가 발생했습니다.');
                }
            }
            
            // 사용자 활성화  
            async function activateUser(index) {
                if (index < 0 || index >= currentAllUsers.length) return;
                
                const user = currentAllUsers[index];
                if (!confirm(user.name + '님을 다시 활성화하시겠습니까?')) return;
                
                try {
                    const response = await fetch('/api/users/' + encodeURIComponent(user.email) + '/status', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'approved' })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        alert('✅ ' + data.message);
                        loadUserStatusManagement(); // 목록 새로고침
                    } else {
                        alert('❌ ' + data.message);
                    }
                } catch (error) {
                    alert('❌ 활성화 처리 중 오류가 발생했습니다.');
                }
            }
            
            // 사용자 완전 삭제
            async function deleteUser(index) {
                if (index < 0 || index >= currentAllUsers.length) return;
                
                const user = currentAllUsers[index];
                if (!confirm('⚠️ 경고: ' + user.name + '님을 완전히 삭제하시겠습니까?\\n\\n이 작업은 되돌릴 수 없으며 다음 데이터가 모두 삭제됩니다:\\n- 사용자 계정 정보\\n- 평가 히스토리\\n- 관련 모든 데이터')) return;
                
                try {
                    const response = await fetch('/api/users/' + encodeURIComponent(user.email), {
                        method: 'DELETE'
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        alert('✅ ' + data.message);
                        loadUserStatusManagement(); // 목록 새로고침
                        refreshAllUsers(); // 전체 사용자 목록도 새로고침
                    } else {
                        alert('❌ ' + data.message);
                    }
                } catch (error) {
                    alert('❌ 삭제 처리 중 오류가 발생했습니다.');
                }
            }
            
            // 일괄 승인 처리
            async function bulkApproveUsers() {
                if (!confirm('대기 중인 모든 사용자를 승인하시겠습니까?')) return;
                
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                
                try {
                    const response = await fetch('/api/users/bulk-approve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ approverEmail: currentUser.email })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        alert('✅ ' + data.message);
                        loadUserStatusManagement();
                        refreshPendingUsers();
                        refreshAllUsers();
                    } else {
                        alert('❌ ' + data.message);
                    }
                } catch (error) {
                    alert('❌ 일괄 승인 처리 중 오류가 발생했습니다.');
                }
            }
            
            // 비활성 사용자 정리
            function cleanupInactiveUsers() {
                alert('📋 비활성 사용자 정리 기능이 곧 구현됩니다.\\n\\n- 90일 이상 미접속 사용자 자동 비활성화\\n- 비활성 상태 180일 이상 사용자 삭제 권장');
            }
            
            // 사용자 목록 내보내기
            function exportUserList() {
                try {
                    if (!currentAllUsers || currentAllUsers.length === 0) {
                        alert('내보낼 사용자 데이터가 없습니다.');
                        return;
                    }
                    
                    // CSV 형식으로 데이터 변환
                    const headers = ['이름', '이메일', '권한', '상태', '가입일', '조직'];
                    const csvData = currentAllUsers.map(user => [
                        user.name || '',
                        user.email || '',
                        user.role === 'admin' ? '관리자' : '일반사용자',
                        user.status === 'approved' ? '활성' : 
                        user.status === 'pending' ? '대기' : 
                        user.status === 'inactive' ? '비활성' : '거부됨',
                        user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '',
                        user.organizationId || '미배치'
                    ]);
                    
                    const csvContent = [headers, ...csvData]
                        .map(row => row.map(cell => '"' + cell + '"').join(','))
                        .join('\\n');
                    
                    // BOM 추가 (한글 깨짐 방지)
                    const bom = '\\uFEFF';
                    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
                    
                    // 파일 다운로드
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = '사용자목록_' + new Date().toISOString().split('T')[0] + '.csv';
                    link.click();
                    
                    alert('✅ 사용자 목록이 CSV 파일로 다운로드되었습니다.');
                } catch (error) {
                    alert('❌ 파일 내보내기 중 오류가 발생했습니다.');
                }
            }

            // 메인 탭 전환 함수 (핵심 기능)
            function showTab(tabName) {
                console.log('showTab 호출됨:', tabName); // 디버깅용
                
                // 모든 탭 콘텐츠 숨기기
                const allTabContents = document.querySelectorAll('.tab-content');
                allTabContents.forEach(content => {
                    content.classList.add('hidden');
                    content.classList.remove('active');
                });
                
                // 모든 탭 버튼 비활성화
                const allTabButtons = document.querySelectorAll('.tab-button');
                allTabButtons.forEach(button => {
                    button.classList.remove('active');
                    button.classList.remove('bg-gray-100', 'text-gray-900');
                    button.classList.add('text-gray-600');
                });
                
                // 선택된 탭 콘텐츠 표시
                const targetContent = document.getElementById(tabName);
                if (targetContent) {
                    targetContent.classList.remove('hidden');
                    targetContent.classList.add('active');
                }
                
                // 선택된 탭 버튼 활성화 (onclick에서 호출된 버튼 찾기)
                const activeButton = event && event.target ? event.target.closest('button') : null;
                if (activeButton) {
                    activeButton.classList.add('active', 'bg-gray-100', 'text-gray-900');
                    activeButton.classList.remove('text-gray-600');
                }
                
                // 특별한 탭 처리
                switch(tabName) {
                    case 'dashboard':
                        // 대시보드는 권한에 따라 다른 내용 표시
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const dashboardContent = document.getElementById('dashboard');
                        if (dashboardContent && user.role === 'admin') {
                            const adminDashboard = document.getElementById('adminDashboard');
                            if (adminDashboard) {
                                dashboardContent.innerHTML = adminDashboard.innerHTML;
                                loadAdminDashboardData();
                            }
                        } else if (dashboardContent) {
                            const userDashboard = document.getElementById('userDashboard');
                            if (userDashboard) {
                                dashboardContent.innerHTML = userDashboard.innerHTML;
                                loadUserDashboardData();
                            }
                        }
                        break;
                        
                    case 'settings':
                        setTimeout(loadSettingsData, 100);
                        break;
                        
                    case 'systemSettings':
                        // 시스템 설정은 기본적으로 조직 설정 탭 표시
                        setTimeout(() => showSettingsTab('organization'), 100);
                        break;
                }
                
                console.log('탭 전환 완료:', tabName); // 디버깅용
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