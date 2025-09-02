import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { EmailService } from './email-service'
import { GmailFetchService } from './gmail-fetch-service'

// Cloudflare Workers 환경 변수 타입 정의
type Bindings = {
  GMAIL_USER?: string;
  GMAIL_APP_PASSWORD?: string;
  SYSTEM_NAME?: string;
  BASE_URL?: string;
  ADMIN_EMAIL?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

// 이메일 서비스 초기화 (환경 변수 기반)
let emailService: any = null

// 환경 변수 설정 (프로덕션/개발 환경 대응)
const getEnvConfig = (env?: any) => ({
  gmailUser: env?.GMAIL_USER || 'rayben@forcs.com',
  gmailAppPassword: env?.GMAIL_APP_PASSWORD || 'gveq uzww grfz mdui',
  systemName: env?.SYSTEM_NAME || '클라우드사업본부 업무평가 시스템',
  baseUrl: env?.BASE_URL || 'https://cloud-performance-system-2025.pages.dev',
  adminEmail: env?.ADMIN_EMAIL || 'rayben@forcs.com'
})

// 글로벌 환경 변수 캐시
let globalEnv: any = null

// 이메일 서비스 초기화 함수
async function initializeEmailService(env?: any) {
  try {
    // 환경 변수 캐시
    if (env) {
      globalEnv = env
    }
    const config = getEnvConfig(globalEnv || env)
    
    // Gmail 앱 비밀번호가 설정되어 있는지 확인
    const hasGmailPassword = config.gmailAppPassword && 
                            config.gmailAppPassword.length > 10 && 
                            config.gmailAppPassword !== 'demo_password' &&
                            config.gmailAppPassword !== 'your_16_character_app_password_here'
    
    if (hasGmailPassword) {
      // Gmail Fetch 서비스 사용 (Cloudflare Workers 호환)
      emailService = new GmailFetchService(config)
      console.log('📧 Gmail Fetch 서비스 초기화 완료')
      
      // 연결 테스트
      const testResult = await emailService.testConnection()
      if (testResult) {
        console.log('✅ Gmail 서비스 준비 완료')
      }
    } else {
      // 시뮬레이션 모드
      emailService = new EmailService(config)
      console.log('📧 시뮬레이션 모드 이메일 서비스 초기화')
      console.log('💡 실제 Gmail 발송을 원하시면 .dev.vars에 Gmail 앱 비밀번호를 설정하세요')
    }
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error)
    // 폴백으로 시뮬레이션 모드 사용
    const config = getEnvConfig()
    emailService = new EmailService(config)
  }
}

// 조직 구조 자동 초기화 함수
async function initializeOrganizations() {
  try {
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
        description: '고객 경험, 기술 지원, 마케팅 및 사업 운영을 담당하는 팀',
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
      'org_cx_tech_marketing': {
        id: 'org_cx_tech_marketing',
        name: 'Technical Marketing',
        type: 'part',
        parentId: 'org_cx',
        description: '기술 중심의 마케팅 전략 및 실행',
        memberCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      'org_cx_business_ops': {
        id: 'org_cx_business_ops',
        name: '사업운영',
        type: 'part',
        parentId: 'org_cx',
        description: '사업 전략 및 운영 업무',
        memberCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    }
    
    // 기존 데이터 모두 삭제하고 새 구조로 교체
    globalThis.organizationDatabase = JSON.stringify(cloudBusinessOrganizations)
    
    console.log('⚙️ 조직 구조 자동 초기화 완료')
  } catch (error) {
    console.error('❌ 조직 구조 초기화 실패:', error)
  }
}

// 전역 초기화 함수 (Fetch 이벤트를 사용하여 비동기 처리)
let isInitialized = false

// 정적 파일 서빙 - Cloudflare Workers 방식 (API와 충돌하지 않도록)
// dist 폴더에서 정적 파일 서빙
app.use('/js/*', serveStatic({ root: './dist' }))
app.use('/css/*', serveStatic({ root: './dist' }))
app.use('/public/*', serveStatic({ root: './dist' }))
app.use('/favicon.ico', serveStatic({ root: './dist' }))

// 초기화 미들웨어
app.use('/api/*', async (c, next) => {
  if (!isInitialized) {
    console.log('🚀 시스템 초기화 시작...')
    await initializeEmailService()
    await initializeOrganizations()
    isInitialized = true
    console.log('✅ 시스템 초기화 완료')
  }
  await next()
})

// API 라우트
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 최소 예제: /api/hello
app.get('/api/hello', (c) => {
  return c.json({ message: 'Hello from Hono + Cloudflare Pages!' })
})

// 최소 예제 페이지: /simple
app.get('/simple', (c) => {
  return c.html(`
    <!doctype html>
    <html lang="ko">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Simple Page</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div class="max-w-xl w-full bg-white border rounded-xl shadow p-6">
        <h1 class="text-2xl font-bold mb-4">기본 템플릿 페이지</h1>
        <p class="text-gray-600 mb-4">이 페이지는 기존 앱을 유지한 채 추가된 최소 예제입니다.</p>
        <button id="btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">/api/hello 호출</button>
        <pre id="out" class="mt-4 p-3 bg-gray-100 rounded text-sm overflow-x-auto"></pre>
        <div class="mt-6">
          <a href="/" class="text-blue-600 hover:underline">홈으로</a>
        </div>
      </div>
      <script>
        document.getElementById('btn').addEventListener('click', async () => {
          const res = await fetch('/api/hello');
          const json = await res.json();
          document.getElementById('out').textContent = JSON.stringify(json, null, 2);
        });
      </script>
    </body>
    </html>
  `)
})

// 테스트 이메일 발송 API
app.post('/api/test-email', async (c) => {
  const { to, subject, message } = await c.req.json()
  
  console.log('🔍 Email service status:', emailService ? 'initialized' : 'not initialized')
  if (emailService) {
    try {
      console.log('📧 테스트 이메일 발송 시도:', to)
      
      // 직접 이메일 발송 테스트
      const testTemplate = {
        to: to || 'rayben@forcs.com',
        subject: subject || '테스트 이메일 - 클라우드사업본부 업무평가 시스템',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="UTF-8">
              <title>테스트 이메일</title>
          </head>
          <body style="font-family: 'Malgun Gothic', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 25px; text-align: center; border-radius: 12px; color: white; margin-bottom: 20px;">
                  <h2>📧 테스트 이메일</h2>
                  <p>클라우드사업본부 업무평가 시스템</p>
              </div>
              <div style="background: white; padding: 35px; border: 1px solid #e5e7eb; border-radius: 8px; line-height: 1.6;">
                  <h3>🔥 실제 Gmail 발송 테스트</h3>
                  <p><strong>발송 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                  <p><strong>메시지:</strong> ${message || '이것은 실제 Gmail을 통해 발송되는 테스트 이메일입니다.'}</p>
                  <p><strong>발송자:</strong> rayben@forcs.com</p>
                  <p><strong>시스템:</strong> 클라우드사업본부 업무평가 시스템</p>
                  
                  <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p><strong>✅ Gmail 발송 성공!</strong></p>
                      <p>이 이메일이 정상적으로 도착했다면 Gmail 알림 시스템이 올바르게 작동하고 있는 것입니다.</p>
                  </div>
              </div>
              <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 8px; margin-top: 20px; color: #6b7280; font-size: 14px;">
                  <p>이 이메일은 클라우드사업본부 업무평가 시스템에서 자동 발송되었습니다.</p>
              </div>
          </body>
          </html>
        `
      }
      
      const success = await emailService.sendEmail(testTemplate)
      
      if (success) {
        return c.json({ 
          success: true, 
          message: '테스트 이메일이 발송되었습니다.',
          details: {
            to: testTemplate.to,
            subject: testTemplate.subject,
            timestamp: new Date().toISOString()
          }
        })
      } else {
        return c.json({ success: false, message: '이메일 발송에 실패했습니다.' }, 500)
      }
    } catch (error) {
      console.error('❌ 테스트 이메일 발송 오류:', error)
      return c.json({ success: false, message: '이메일 발송 중 오류가 발생했습니다.', error: error.message }, 500)
    }
  } else {
    return c.json({ success: false, message: '이메일 서비스가 초기화되지 않았습니다.' }, 503)
  }
})

// 로그인 API
app.post('/api/login', async (c) => {
  const { email, password } = await c.req.json()
  
  // 기본 테스트 계정들
  const defaultUsers = {
    'rayben@forcs.com': { password: 'admin123', role: 'admin', name: '관리자' },
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
  const { email, password, confirmPassword, name, role, team, part } = await c.req.json()
  
  // 유효성 검사
  if (!email || !password || !confirmPassword || !name || !team || !part) {
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
  
  // 조직 정보 유효성 검사
  const organizations = JSON.parse(globalThis.organizationDatabase || '{}')
  if (!organizations[team] || !organizations[part]) {
    return c.json({ success: false, message: '유효하지 않은 조직 정보입니다.' }, 400)
  }
  
  // 팀-파트 관계 검증
  if (organizations[part].parentId !== team) {
    return c.json({ success: false, message: '선택한 팀과 파트가 일치하지 않습니다.' }, 400)
  }
  
  // 새 사용자 추가 (승인 대기 상태)
  const newUser = {
    email,
    password, // 실제 운영에서는 해시화해야 함
    name,
    role: 'user', // 무조건 일반 사용자로 가입
    team,
    part,
    organizationId: part, // 파트 ID를 조직 ID로 사용
    status: 'pending', // 승인 대기 상태
    createdAt: new Date().toISOString(),
    approvedAt: null,
    approvedBy: null
  }
  
  existingUsers[email] = newUser
  globalThis.userDatabase = JSON.stringify(existingUsers)
  
  // 이메일 알림 발송 (관리자에게)
  console.log('🔍 Email service status:', emailService ? 'initialized' : 'not initialized')
  if (emailService) {
    try {
      console.log('📧 Sending signup notification for:', newUser.email)
      await emailService.notifySignupRequest({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        team: organizations[team].name,
        part: organizations[part].name
      })
      console.log('✅ Signup notification sent to admin')
    } catch (error) {
      console.error('❌ Failed to send signup notification:', error)
    }
  } else {
    console.log('⚠️ Email service not initialized - signup notification skipped')
  }
  
  return c.json({ 
    success: true, 
    message: '회원가입 신청이 완료되었습니다. 관리자 승인을 기다려주세요.',
    user: {
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      team: organizations[team].name,
      part: organizations[part].name,
      status: newUser.status
    }
  })
})

// 사용자 목록 조회 API (관리자용)
app.get('/api/users', async (c) => {
  const users = JSON.parse(globalThis.userDatabase || '{}')
  const organizations = JSON.parse(globalThis.organizationDatabase || '{}')
  
  const userList = Object.values(users || {}).map(user => ({
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status || 'approved', // 기존 사용자는 승인됨으로 처리
    team: user.team ? (organizations[user.team]?.name || user.team) : null, // 팀 이름으로 변환
    part: user.part ? (organizations[user.part]?.name || user.part) : null, // 파트 이름으로 변환
    createdAt: user.createdAt,
    approvedAt: user.approvedAt,
    approvedBy: user.approvedBy
  }))
  
  return c.json({ success: true, users: userList })
})

// 대기 중인 회원 목록 API
app.get('/api/users/pending', async (c) => {
  const users = JSON.parse(globalThis.userDatabase || '{}')
  const organizations = JSON.parse(globalThis.organizationDatabase || '{}')
  const pendingUsers = Object.values(users || {})
    .filter(user => user?.status === 'pending')
    .map(user => ({
      email: user.email,
      name: user.name,
      role: user.role,
      team: user.team ? (organizations[user.team]?.name || user.team) : null, // 팀 이름으로 변환
      part: user.part ? (organizations[user.part]?.name || user.part) : null, // 파트 이름으로 변환
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
  
  // 승인된 사용자의 조직에 멤버 수 증가
  const organizations = JSON.parse(globalThis.organizationDatabase || '{}')
  const approvedUser = users[email]
  
  // 사용자의 팀과 파트 조직 멤버 수 증가
  if (approvedUser.team && organizations[approvedUser.team]) {
    organizations[approvedUser.team].memberCount = (organizations[approvedUser.team].memberCount || 0) + 1
    console.log(`👥 ${organizations[approvedUser.team].name} 팀 멤버수 증가: ${organizations[approvedUser.team].memberCount}명`)
  }
  
  if (approvedUser.part && organizations[approvedUser.part]) {
    organizations[approvedUser.part].memberCount = (organizations[approvedUser.part].memberCount || 0) + 1
    console.log(`👥 ${organizations[approvedUser.part].name} 파트 멤버수 증가: ${organizations[approvedUser.part].memberCount}명`)
  }
  
  globalThis.userDatabase = JSON.stringify(users)
  globalThis.organizationDatabase = JSON.stringify(organizations)
  
  // 승인 알림 이메일 발송 (신청자에게)
  if (emailService) {
    try {
      await emailService.notifyApproval({
        name: users[email].name,
        email: users[email].email,
        approverName: approverEmail
      })
      console.log('✅ Approval notification sent to user')
    } catch (error) {
      console.error('❌ Failed to send approval notification:', error)
    }
  }
  
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
  
  // 거부 알림 이메일 발송 (신청자에게)
  console.log('🔍 Email service status:', emailService ? 'initialized' : 'not initialized')
  if (emailService) {
    try {
      console.log('📧 Sending rejection notification to:', users[email].email)
      await emailService.notifyRejection({
        name: users[email].name,
        email: users[email].email,
        reason: reason || '승인되지 않음',
        approverName: approverEmail
      })
      console.log('✅ Rejection notification sent to user')
    } catch (error) {
      console.error('❌ Failed to send rejection notification:', error)
    }
  } else {
    console.log('⚠️ Email service not initialized - rejection notification skipped')
  }
  
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

// 이메일 테스트 API (개발용)
app.post('/api/test-email', async (c) => {
  if (!emailService) {
    return c.json({ success: false, message: '이메일 서비스가 초기화되지 않았습니다.' }, 500)
  }
  
  try {
    const isConnected = await emailService.testConnection()
    if (!isConnected) {
      return c.json({ success: false, message: 'SMTP 연결 실패' }, 500)
    }
    
    // 테스트 이메일 발송
    const testResult = await emailService.notifySignupRequest({
      name: '테스트 사용자',
      email: 'test@example.com',
      role: 'user'
    })
    
    return c.json({ 
      success: testResult, 
      message: testResult ? '테스트 이메일이 발송되었습니다.' : '이메일 발송에 실패했습니다.'
    })
  } catch (error) {
    return c.json({ success: false, message: '이메일 테스트 실패: ' + error.message }, 500)
  }
})

// 조직 구조 관련 API
// 조직 목록 조회
app.get('/api/organizations', async (c) => {
  const organizations = JSON.parse(globalThis.organizationDatabase || '{}')
  const users = JSON.parse(globalThis.userDatabase || '{}')
  
  const orgList = Object.values(organizations || {}).map(org => {
    // 해당 조직에 소속된 승인된 사용자 목록 찾기
    const members = Object.values(users)
      .filter(user => user.status === 'approved' && (user.team === org.id || user.part === org.id))
      .map(user => ({
        name: user.name,
        email: user.email,
        role: user.role,
        approvedAt: user.approvedAt
      }))
    
    return {
      id: org.id,
      name: org.name,
      type: org.type,
      parentId: org.parentId,
      description: org.description,
      memberCount: members.length, // 실제 멤버 수로 업데이트
      members: members, // 멤버 목록 추가
      createdAt: org.createdAt
    }
  })
  
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
      description: '고객 경험, 기술 지원, 마케팅 및 사업 운영을 담당하는 팀',
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
    'org_cx_tech_marketing': {
      id: 'org_cx_tech_marketing',
      name: 'Technical Marketing',
      type: 'part',
      parentId: 'org_cx',
      description: '기술 중심의 마케팅 전략 및 실행',
      memberCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    'org_cx_business_ops': {
      id: 'org_cx_business_ops',
      name: '사업운영',
      type: 'part',
      parentId: 'org_cx',
      description: '사업 전략 및 운영 업무',
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

// 사용자 정보 수정
app.put('/api/users/:email', async (c) => {
  const email = c.req.param('email')
  const { name, role, team, part, updaterEmail } = await c.req.json()
  
  const users = JSON.parse(globalThis.userDatabase || '{}')
  
  if (!users[email]) {
    return c.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, 404)
  }
  
  // 조직 정보 유효성 검사 (팀/파트가 제공된 경우)
  if (team && part) {
    const organizations = JSON.parse(globalThis.organizationDatabase || '{}')
    if (!organizations[team] || !organizations[part]) {
      return c.json({ success: false, message: '유효하지 않은 조직 정보입니다.' }, 400)
    }
    
    // 팀-파트 관계 검증
    if (organizations[part].parentId !== team) {
      return c.json({ success: false, message: '선택한 팀과 파트가 일치하지 않습니다.' }, 400)
    }
    
    // 기존 조직에서 멤버 수 감소
    if (users[email].organizationId && users[email].organizationId !== part) {
      const oldOrg = organizations[users[email].organizationId]
      if (oldOrg) {
        oldOrg.memberCount = Math.max(0, (oldOrg.memberCount || 0) - 1)
      }
      
      // 새 조직에 멤버 수 증가
      const newOrg = organizations[part]
      if (newOrg) {
        newOrg.memberCount = (newOrg.memberCount || 0) + 1
      }
      
      globalThis.organizationDatabase = JSON.stringify(organizations)
    }
  }
  
  // 사용자 정보 업데이트
  const updatedUser = {
    ...users[email],
    name: name || users[email].name,
    role: role || users[email].role,
    team: team || users[email].team,
    part: part || users[email].part,
    organizationId: part || users[email].organizationId,
    updatedAt: new Date().toISOString(),
    updatedBy: updaterEmail
  }
  
  users[email] = updatedUser
  globalThis.userDatabase = JSON.stringify(users)
  
  return c.json({ 
    success: true, 
    message: '사용자 정보가 성공적으로 수정되었습니다.',
    user: {
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      team: updatedUser.team,
      part: updatedUser.part,
      status: updatedUser.status,
      updatedAt: updatedUser.updatedAt
    }
  })
})

// 사용자 삭제 (평가 데이터는 보존)
app.delete('/api/users/:email', async (c) => {
  const email = c.req.param('email')
  const { deleterEmail } = await c.req.json()
  
  if (!deleterEmail) {
    return c.json({ success: false, message: '삭제 요청자 정보가 필요합니다.' }, 400)
  }
  
  const users = JSON.parse(globalThis.userDatabase || '{}')
  
  if (!users[email]) {
    return c.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, 404)
  }
  
  // 자기 자신 삭제 방지
  if (email === deleterEmail) {
    return c.json({ success: false, message: '자기 자신은 삭제할 수 없습니다.' }, 400)
  }
  
  // 삭제할 사용자 정보 백업 (로그용)
  const deletedUser = { ...users[email] }
  
  // 사용자 조직에서 멤버 수 감소
  if (deletedUser.organizationId) {
    const organizations = JSON.parse(globalThis.organizationDatabase || '{}')
    if (organizations[deletedUser.organizationId]) {
      organizations[deletedUser.organizationId].memberCount = 
        Math.max(0, (organizations[deletedUser.organizationId].memberCount || 0) - 1)
      globalThis.organizationDatabase = JSON.stringify(organizations)
    }
  }
  
  // 사용자 데이터베이스에서 제거
  delete users[email]
  globalThis.userDatabase = JSON.stringify(users)
  
  // 삭제 로그 기록 (평가 데이터는 그대로 유지)
  console.log(`🗑️ 사용자 삭제됨: ${deletedUser.name} (${email}) by ${deleterEmail}`)
  console.log(`📝 평가 데이터는 보존됨 - 삭제된 사용자의 평가 기록은 유지됩니다`)
  
  // 이메일 알림 발송 (관리자에게)
  if (emailService) {
    try {
      await emailService.notifyUserDeleted({
        deletedUserName: deletedUser.name,
        deletedUserEmail: email,
        deleterEmail: deleterEmail,
        deletedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('사용자 삭제 알림 발송 실패:', error)
    }
  }
  
  return c.json({ 
    success: true, 
    message: `사용자 ${deletedUser.name}가 성공적으로 삭제되었습니다. 평가 데이터는 보존됩니다.`,
    deletedUser: {
      name: deletedUser.name,
      email: deletedUser.email,
      role: deletedUser.role,
      deletedAt: new Date().toISOString(),
      deletedBy: deleterEmail
    }
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

// ==================== 평가 시스템 API ====================

// 정량평가 항목 조회
app.get('/api/evaluation/quantitative', async (c) => {
  const quantitativeItems = JSON.parse(globalThis.quantitativeEvaluationItems || '{}')
  return c.json({ success: true, items: quantitativeItems })
})

// 정량평가 항목 저장/수정
app.post('/api/evaluation/quantitative', async (c) => {
  const { itemId, name, description, weight } = await c.req.json()
  
  if (!name || !description || !weight) {
    return c.json({ success: false, message: '모든 필드를 입력해주세요.' }, 400)
  }
  
  const quantitativeItems = JSON.parse(globalThis.quantitativeEvaluationItems || '{}')
  const finalItemId = itemId || 'quant_' + Date.now()
  
  quantitativeItems[finalItemId] = {
    id: finalItemId,
    name,
    description,
    weight: parseInt(weight),
    createdAt: quantitativeItems[finalItemId]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  globalThis.quantitativeEvaluationItems = JSON.stringify(quantitativeItems)
  
  return c.json({ 
    success: true, 
    message: '정량평가 항목이 저장되었습니다.',
    item: quantitativeItems[finalItemId]
  })
})

// 정량평가 항목 삭제
app.delete('/api/evaluation/quantitative/:itemId', async (c) => {
  const itemId = c.req.param('itemId')
  const quantitativeItems = JSON.parse(globalThis.quantitativeEvaluationItems || '{}')
  
  if (!quantitativeItems[itemId]) {
    return c.json({ success: false, message: '평가 항목을 찾을 수 없습니다.' }, 404)
  }
  
  delete quantitativeItems[itemId]
  globalThis.quantitativeEvaluationItems = JSON.stringify(quantitativeItems)
  
  return c.json({ success: true, message: '정량평가 항목이 삭제되었습니다.' })
})

// 정성평가 항목 조회
app.get('/api/evaluation/qualitative', async (c) => {
  const qualitativeItems = JSON.parse(globalThis.qualitativeEvaluationItems || '{}')
  return c.json({ success: true, items: qualitativeItems })
})

// 정성평가 항목 저장/수정
app.post('/api/evaluation/qualitative', async (c) => {
  const { itemId, name, description, scale } = await c.req.json()
  
  if (!name || !description || !scale) {
    return c.json({ success: false, message: '모든 필드를 입력해주세요.' }, 400)
  }
  
  const qualitativeItems = JSON.parse(globalThis.qualitativeEvaluationItems || '{}')
  const finalItemId = itemId || 'qual_' + Date.now()
  
  qualitativeItems[finalItemId] = {
    id: finalItemId,
    name,
    description,
    scale,
    createdAt: qualitativeItems[finalItemId]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  globalThis.qualitativeEvaluationItems = JSON.stringify(qualitativeItems)
  
  return c.json({ 
    success: true, 
    message: '정성평가 항목이 저장되었습니다.',
    item: qualitativeItems[finalItemId]
  })
})

// 정성평가 항목 삭제
app.delete('/api/evaluation/qualitative/:itemId', async (c) => {
  const itemId = c.req.param('itemId')
  const qualitativeItems = JSON.parse(globalThis.qualitativeEvaluationItems || '{}')
  
  if (!qualitativeItems[itemId]) {
    return c.json({ success: false, message: '평가 항목을 찾을 수 없습니다.' }, 404)
  }
  
  delete qualitativeItems[itemId]
  globalThis.qualitativeEvaluationItems = JSON.stringify(qualitativeItems)
  
  return c.json({ success: true, message: '정성평가 항목이 삭제되었습니다.' })
})

// 평가 대상 설정 조회
app.get('/api/evaluation/targets', async (c) => {
  const evaluationTargets = JSON.parse(globalThis.evaluationTargets || '{}')
  return c.json({ success: true, targets: evaluationTargets })
})

// 평가 대상 설정 저장/수정
app.post('/api/evaluation/targets', async (c) => {
  const { organization, cycle, specialItems } = await c.req.json()
  
  if (!organization || !cycle) {
    return c.json({ success: false, message: '조직과 평가 주기를 선택해주세요.' }, 400)
  }
  
  const evaluationTargets = JSON.parse(globalThis.evaluationTargets || '{}')
  
  evaluationTargets[organization] = {
    organization,
    cycle,
    specialItems: specialItems || '',
    createdAt: evaluationTargets[organization]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  globalThis.evaluationTargets = JSON.stringify(evaluationTargets)
  
  return c.json({ 
    success: true, 
    message: '평가 대상 설정이 저장되었습니다.',
    target: evaluationTargets[organization]
  })
})

// Sales팀 2025 H2 목표 데이터 조회
app.get('/api/evaluation/sales-targets', async (c) => {
  // Sales팀의 2025 H2 목표 데이터 구조
  const salesTargets = {
    team: 'Sales팀',
    period: '2025 H2',
    totalTarget: 700000, // 천원 단위
    members: [
      {
        name: '최민',
        targets: {
          general_saas: { // 일반 SaaS
            july: 30000,
            august: 35000,
            september: 40000,
            october: 45000,
            november: 50000,
            december: 55000
          },
          public_saas: { // 공공 SaaS  
            july: 15000,
            august: 20000,
            september: 25000,
            october: 30000,
            november: 35000,
            december: 40000
          },
          new_contracts: { // 신규 계약건수
            july: 3,
            august: 4,
            september: 5,
            october: 6,
            november: 7,
            december: 8
          }
        }
      },
      {
        name: '김다민',
        targets: {
          general_saas: {
            july: 25000,
            august: 30000,
            september: 35000,
            october: 40000,
            november: 45000,
            december: 50000
          },
          public_saas: {
            july: 10000,
            august: 15000,
            september: 20000,
            october: 25000,
            november: 30000,
            december: 35000
          },
          new_contracts: {
            july: 2,
            august: 3,
            september: 4,
            october: 5,
            november: 6,
            december: 7
          }
        }
      },
      {
        name: '박진희',
        targets: {
          general_saas: {
            july: 20000,
            august: 25000,
            september: 30000,
            october: 35000,
            november: 40000,
            december: 45000
          },
          public_saas: {
            july: 8000,
            august: 12000,
            september: 16000,
            october: 20000,
            november: 25000,
            december: 30000
          },
          new_contracts: {
            july: 2,
            august: 2,
            september: 3,
            october: 4,
            november: 5,
            december: 6
          }
        }
      }
    ]
  }
  
  return c.json({ success: true, salesTargets })
})

// 평가 설정 전체 조회
app.get('/api/evaluation/settings', async (c) => {
  const quantitativeItems = JSON.parse(globalThis.quantitativeEvaluationItems || '{}')
  const qualitativeItems = JSON.parse(globalThis.qualitativeEvaluationItems || '{}')
  const evaluationTargets = JSON.parse(globalThis.evaluationTargets || '{}')
  
  return c.json({ 
    success: true, 
    settings: {
      quantitative: quantitativeItems,
      qualitative: qualitativeItems,
      targets: evaluationTargets
    }
  })
})

// Favicon 처리 - 단순 빈 응답
app.get('/favicon.ico', (c) => {
  return c.text('', 204)
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
    <body class="bg-gradient-to-br from-blue-50 via-white to-teal-50 min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-5xl flex items-center justify-center gap-12">
            <!-- 왼쪽: Cloud Business Department 브랜딩 -->
            <div class="hidden lg:block flex-1 max-w-md">
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                    <img src="https://cdn1.genspark.ai/user-upload-image/11_generated/c8e33d8e-a59e-411a-80bc-1841bb03881a" 
                         alt="Cloud Business Department" 
                         class="w-full object-contain mb-6">
                    <div class="space-y-4 text-center">
                        <h2 class="text-2xl font-bold text-gray-800">클라우드사업본부</h2>
                        <p class="text-gray-600 leading-relaxed">
                            eformsign과 함께하는 디지털 전환의 중심<br>
                            체계적인 성과 관리로 미래를 준비합니다
                        </p>

                    </div>
                </div>
            </div>
            
            <!-- 오른쪽: 로그인 카드 -->
            <div class="w-full max-w-md">
                <!-- 모바일용 로고 (작은 화면에서만 표시) -->
                <div class="lg:hidden text-center mb-6">
                    <img src="https://cdn1.genspark.ai/user-upload-image/11_generated/c8e33d8e-a59e-411a-80bc-1841bb03881a" 
                         alt="Cloud Business Department" 
                         class="mx-auto h-32 object-contain">
                </div>
                
                <!-- 인증 카드 -->
                <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <!-- 헤더 - 그라데이션 배경 -->
                    <div class="bg-gradient-to-r from-blue-600 to-teal-500 text-white text-center p-6">
                        <div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-full mb-3">
                            <i class="fas fa-chart-line text-3xl"></i>
                        </div>
                        <h1 class="text-2xl font-bold">업무평가 시스템</h1>
                        <p class="text-blue-100 text-sm mt-1">Performance Management System</p>
                    </div>

                    <!-- 탭 네비게이션 -->
                    <div class="flex bg-gray-50">
                        <button onclick="switchTab('login')" id="loginTab" 
                                class="flex-1 py-4 px-4 text-center font-medium text-blue-600 bg-white border-b-2 border-blue-600 transition-all duration-200 hover:bg-blue-50">
                            <i class="fas fa-sign-in-alt mr-2"></i>로그인
                        </button>
                        <button onclick="switchTab('signup')" id="signupTab" 
                                class="flex-1 py-4 px-4 text-center font-medium text-gray-500 border-b-2 border-transparent transition-all duration-200 hover:bg-gray-100">
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
                                class="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-teal-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="fas fa-sign-in-alt mr-2"></i>로그인
                        </button>
                    </form>

                    <!-- 테스트 계정 안내 -->
                    <div class="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-4 border border-blue-200">
                        <p class="text-sm font-medium text-gray-700 mb-3 flex items-center">
                            <i class="fas fa-info-circle text-blue-500 mr-2"></i>테스트 계정
                        </p>
                        <div class="space-y-2">
                            <div class="flex items-center justify-between text-xs bg-white rounded p-2">
                                <span class="flex items-center">
                                    <span class="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    <strong class="text-gray-700">관리자</strong>
                                </span>
                                <span class="text-gray-600 font-mono">rayben@forcs.com / admin123</span>
                            </div>
                            <div class="flex items-center justify-between text-xs bg-white rounded p-2">
                                <span class="flex items-center">
                                    <span class="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    <strong class="text-gray-700">일반 사용자</strong>
                                </span>
                                <span class="text-gray-600 font-mono">user@company.com / user123</span>
                            </div>
                            <div class="flex items-center justify-between text-xs bg-white rounded p-2">
                                <span class="flex items-center">
                                    <span class="inline-block w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    <strong class="text-gray-700">테스트</strong>
                                </span>
                                <span class="text-gray-600 font-mono">test@company.com / test123</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 회원가입 폼 -->
                <div id="signupContent" class="hidden p-8 space-y-6">
                    <form id="signupForm" class="space-y-4">
                        <div>
                            <label for="signupName" class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-user mr-2"></i>이름
                            </label>
                            <input type="text" id="signupName" name="name" required 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                   placeholder="이름을 입력하세요">
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="signupTeam" class="block text-sm font-medium text-gray-700 mb-2">
                                    <i class="fas fa-users mr-2"></i>소속 팀
                                </label>
                                <select id="signupTeam" name="team" required
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        onchange="updatePartOptions()">
                                    <option value="">팀을 선택하세요</option>
                                    <option value="org_sales">Sales팀</option>
                                    <option value="org_cx">CX팀</option>
                                </select>
                            </div>
                            
                            <div>
                                <label for="signupPart" class="block text-sm font-medium text-gray-700 mb-2">
                                    <i class="fas fa-briefcase mr-2"></i>소속 파트
                                </label>
                                <select id="signupPart" name="part" required
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        disabled>
                                    <option value="">먼저 팀을 선택하세요</option>
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
                                class="w-full bg-gradient-to-r from-green-600 to-teal-500 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-teal-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="fas fa-user-plus mr-2"></i>회원가입
                        </button>
                    </form>

                    <!-- 회원가입 안내 -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p class="text-sm text-blue-700">
                            <i class="fas fa-info-circle mr-2"></i>
                            회원가입 신청 후 <strong>관리자 승인</strong>을 받아야 로그인이 가능합니다.
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
            // 파트 옵션 업데이트 함수
            function updatePartOptions() {
                const teamSelect = document.getElementById('signupTeam');
                const partSelect = document.getElementById('signupPart');
                const selectedTeam = teamSelect.value;
                
                // 파트 옵션 초기화
                partSelect.innerHTML = '<option value="">파트를 선택하세요</option>';
                partSelect.disabled = !selectedTeam;
                
                if (selectedTeam === 'org_sales') {
                    partSelect.innerHTML += '<option value="org_sales_sales">영업</option>';
                    partSelect.innerHTML += '<option value="org_sales_management">영업관리</option>';
                } else if (selectedTeam === 'org_cx') {
                    partSelect.innerHTML += '<option value="org_cx_customer_service">고객서비스</option>';
                    partSelect.innerHTML += '<option value="org_cx_tech_support">기술지원</option>';
                    partSelect.innerHTML += '<option value="org_cx_tech_writing">Technical Writing</option>';
                    partSelect.innerHTML += '<option value="org_cx_tech_marketing">Technical Marketing</option>';
                    partSelect.innerHTML += '<option value="org_cx_business_ops">사업운영</option>';
                }
            }
            
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
                        
                        // 관리자인 경우 대시보드 통계 즉시 업데이트
                        if (data.user.role === 'admin' && typeof updateDashboardStats === 'function') {
                            console.log('👑 관리자 로그인 - 대시보드 통계 업데이트 시작');
                            setTimeout(() => {
                                updateDashboardStats();
                            }, 500);
                        }
                        
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
                const team = document.getElementById('signupTeam').value;
                const part = document.getElementById('signupPart').value;
                const signupBtn = document.getElementById('signupBtn');
                
                // 클라이언트 유효성 검사
                if (password !== confirmPassword) {
                    showMessage('비밀번호가 일치하지 않습니다.', 'error');
                    return;
                }
                
                if (!team) {
                    showMessage('소속 팀을 선택해 주세요.', 'error');
                    return;
                }
                
                if (!part) {
                    showMessage('소속 파트를 선택해 주세요.', 'error');
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
                        body: JSON.stringify({ name, email, password, confirmPassword, team, part, role: 'user' })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showMessage('회원가입 신청이 완료되었습니다! 승인 완료 시 ' + data.user.email + '로 알림을 발송합니다.', 'success');
                        
                        // 3초 후 폼 초기화
                        setTimeout(() => {
                            document.getElementById('signupForm').reset();
                            // 파트 드롭다운 비활성화
                            document.getElementById('signupPart').disabled = true;
                            document.getElementById('signupPart').innerHTML = '<option value="">먼저 팀을 선택하세요</option>';
                        }, 3000);
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
        <link href="/css/main.css" rel="stylesheet">
        
        <!-- Application JavaScript Modules (원래 시스템 설정 기능 복원) -->
        <script src="/js/utils.js"></script>
        <script src="/js/api.js"></script>
        <script src="/js/organization.js"></script>
        <script src="/js/manual-input.js"></script>
        <script src="/js/member-management.js"></script>
        <script src="/js/excel-management.js"></script>
        <script src="/js/app.js"></script>
        <script src="/js/evaluationManagement.js"></script>
        <script src="/js/userManagement.js"></script>
        
        <style>
            .settings-content { display: none; }
            .settings-content.active { display: block; }
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                transition: all 0.3s ease-in-out;
            }

            /* 새로운 평가 시스템 UI 스타일 */
            .evaluation-tab-content {
                animation: fadeIn 0.3s ease-in-out;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .evaluation-item-card {
                transition: all 0.2s ease-in-out;
            }

            .evaluation-item-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .evaluation-type-card {
                transition: all 0.2s ease-in-out;
                cursor: pointer;
            }

            .evaluation-type-card:hover {
                transform: scale(1.02);
            }

            .wizard-step {
                min-height: 300px;
            }

            .assignment-item {
                transition: all 0.2s ease-in-out;
            }

            .assignment-item:hover {
                background-color: #f8fafc;
                border-color: #cbd5e1;
            }

            /* 드래그 앤 드롭 스타일 */
            .assignment-item[draggable="true"]:active {
                opacity: 0.7;
                transform: rotate(5deg);
            }

            #assignmentDropZone {
                transition: all 0.2s ease-in-out;
            }

            #assignmentDropZone.drag-over {
                background-color: #eff6ff;
                border-color: #3b82f6;
                transform: scale(1.02);
            }

            /* 반응형 디자인 */
            @media (max-width: 768px) {
                .evaluation-tab-content .grid {
                    grid-template-columns: 1fr !important;
                }
                
                .wizard-step {
                    min-height: 200px;
                }
                
                #evaluationWizardModal .max-w-2xl {
                    max-width: 95vw;
                    margin: 20px;
                }
                
                #assignmentModal .max-w-4xl {
                    max-width: 95vw;
                    margin: 20px;
                }
                
                .evaluation-item-card {
                    margin-bottom: 0.75rem;
                }
                
                /* 탭 버튼 모바일 최적화 */
                .flex.border-b .flex-1 {
                    padding: 12px 8px;
                    font-size: 0.875rem;
                }
                
                .flex.border-b .flex-1 i {
                    display: none;
                }
            }

            @media (max-width: 640px) {
                .grid.grid-cols-2 {
                    grid-template-columns: 1fr !important;
                }
                
                .grid.grid-cols-3 {
                    grid-template-columns: 1fr !important;
                }
                
                .grid.grid-cols-4 {
                    grid-template-columns: repeat(2, 1fr) !important;
                }
                
                /* 모바일에서 플렉스 버튼들 */
                .flex.space-x-3 {
                    flex-direction: column !important;
                    gap: 0.75rem;
                }
                
                .flex.space-x-3 > * {
                    width: 100% !important;
                }
            }

            /* 진행 표시기 애니메이션 */
            .wizard-progress-active {
                animation: pulse 2s infinite;
                background: linear-gradient(45deg, #ffffff, #e5e7eb);
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }

            /* 드래그 상태 시각 효과 */
            .drag-preview {
                opacity: 0.8;
                transform: rotate(5deg) scale(1.1);
                z-index: 1000;
                pointer-events: none;
            }

            /* 성공/오류 상태 스타일 */
            .success-glow {
                box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
                border-color: #22c55e !important;
            }

            .error-glow {
                box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
                border-color: #ef4444 !important;
            }

            /* 로딩 애니메이션 */
            .loading-dots::after {
                content: '...';
                animation: dots 2s infinite;
            }

            @keyframes dots {
                0%, 20% { content: '.'; }
                40% { content: '..'; }
                60%, 100% { content: '...'; }
            }

            /* 스크롤바 스타일링 */
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }

            .custom-scrollbar::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 10px;
            }

            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 10px;
            }

            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
            }
        </style>
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
                    <div id="adminDashboard" class="tab-content hidden">
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
                                        <p class="text-2xl font-bold text-blue-600" id="adminTotalUsers">${(() => {
                                          const users = JSON.parse(globalThis.userDatabase || '{}')
                                          return Object.keys(users).length
                                        })()}</p>
                                    </div>
                                    <i class="fas fa-users text-blue-600 text-2xl"></i>
                                </div>
                            </div>
                            
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600">승인 대기</p>
                                        <p class="text-2xl font-bold text-yellow-600" id="adminPendingUsers">${(() => {
                                          const users = JSON.parse(globalThis.userDatabase || '{}')
                                          return Object.values(users).filter(user => user?.status === 'pending').length
                                        })()}</p>
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
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onclick="showTab('systemSettings'); setTimeout(() => showSettingsTab('users'), 100);">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-lg font-semibold text-gray-900">
                                        <i class="fas fa-user-plus text-blue-500 mr-2"></i>최근 가입 승인 요청
                                    </h3>
                                    <i class="fas fa-arrow-right text-gray-400 text-sm"></i>
                                </div>
                                <div id="adminRecentSignups" class="space-y-3">
                                    <p class="text-gray-600">승인 대기 중인 회원이 없습니다.</p>
                                </div>
                                <div class="mt-3 pt-3 border-t border-gray-100">
                                    <p class="text-xs text-blue-600 font-medium">클릭하여 사용자 관리로 이동</p>
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

                    <div id="systemSettings" class="tab-content hidden">
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
                                            <input type="text" id="orgName" placeholder="예: Digital마케팅파트" 
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

                        <!-- 평가 유형 설정 - 개선된 UI/UX -->
                        <div id="evaluationSettings" class="settings-content hidden">
                            <!-- 상단 네비게이션 탭 -->
                            <div class="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
                                <div class="flex border-b border-gray-200">
                                    <button onclick="switchEvaluationTab('dashboard')" id="tab-dashboard" class="flex-1 px-6 py-4 text-center font-medium text-blue-600 bg-blue-50 border-b-2 border-blue-500">
                                        <i class="fas fa-tachometer-alt mr-2"></i>평가 대시보드
                                    </button>
                                    <button onclick="switchEvaluationTab('items')" id="tab-items" class="flex-1 px-6 py-4 text-center font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50">
                                        <i class="fas fa-list-alt mr-2"></i>평가 항목 관리
                                    </button>
                                    <button onclick="switchEvaluationTab('assignment')" id="tab-assignment" class="flex-1 px-6 py-4 text-center font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50">
                                        <i class="fas fa-users-cog mr-2"></i>평가 배정
                                    </button>
                                    <button onclick="switchEvaluationTab('preview')" id="tab-preview" class="flex-1 px-6 py-4 text-center font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50">
                                        <i class="fas fa-eye mr-2"></i>미리보기
                                    </button>
                                </div>
                            </div>

                            <!-- 평가 대시보드 탭 -->
                            <div id="evaluation-dashboard" class="evaluation-tab-content">
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <!-- 정량평가 요약 -->
                                    <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <h3 class="text-lg font-semibold text-blue-900">정량평가 항목</h3>
                                                <p class="text-3xl font-bold text-blue-600 mt-2" id="quantitativeCount">3</p>
                                                <p class="text-sm text-blue-700">총 배점: <span id="quantitativePoints">0점</span></p>
                                            </div>
                                            <i class="fas fa-chart-bar text-blue-400 text-3xl"></i>
                                        </div>
                                        <button onclick="switchEvaluationTab('items')" class="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                            항목 관리
                                        </button>
                                    </div>

                                    <!-- 정성평가 요약 -->
                                    <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <h3 class="text-lg font-semibold text-green-900">정성평가 항목</h3>
                                                <p class="text-3xl font-bold text-green-600 mt-2" id="qualitativeCount">4</p>
                                                <p class="text-sm text-green-700">평가 방식: <span id="qualitativeScale">1-5점</span></p>
                                            </div>
                                            <i class="fas fa-comments text-green-400 text-3xl"></i>
                                        </div>
                                        <button onclick="switchEvaluationTab('items')" class="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                                            항목 관리
                                        </button>
                                    </div>

                                    <!-- 조직 배정 현황 -->
                                    <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <h3 class="text-lg font-semibold text-purple-900">조직별 배정</h3>
                                                <p class="text-3xl font-bold text-purple-600 mt-2" id="assignmentCount">2</p>
                                                <p class="text-sm text-purple-700">Sales팀, CX팀</p>
                                            </div>
                                            <i class="fas fa-sitemap text-purple-400 text-3xl"></i>
                                        </div>
                                        <button onclick="switchEvaluationTab('assignment')" class="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors">
                                            배정 관리
                                        </button>
                                    </div>
                                </div>

                                <!-- Sales팀 2025 H2 목표 현황 -->
                                <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <div class="flex items-center justify-between mb-4">
                                        <h3 class="text-lg font-semibold text-gray-900">
                                            <i class="fas fa-chart-line text-orange-500 mr-2"></i>Sales팀 2025 H2 목표 현황
                                        </h3>
                                        <button onclick="loadSalesTargets()" class="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors">
                                            <i class="fas fa-sync-alt mr-2"></i>목표 데이터 새로고침
                                        </button>
                                    </div>
                                    
                                    <div id="salesTargetsContainer" class="space-y-4">
                                        <div class="text-center py-8 text-gray-500">
                                            <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                            <p>Sales팀 목표 데이터를 불러오는 중...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 평가 항목 관리 탭 -->
                            <div id="evaluation-items" class="evaluation-tab-content hidden">
                                <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    <!-- 정량평가 항목 관리 -->
                                    <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
                                        <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-t-lg">
                                            <div class="flex items-center justify-between">
                                                <h3 class="text-lg font-semibold text-white">
                                                    <i class="fas fa-chart-bar mr-2"></i>정량평가 항목
                                                </h3>
                                                <button onclick="startEvaluationWizard('quantitative')" class="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors">
                                                    <i class="fas fa-magic mr-2"></i>마법사로 추가
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div class="p-4">
                                            <div id="quantitativeItemsGrid" class="space-y-3 mb-4">
                                                <!-- 동적으로 채워짐 -->
                                            </div>
                                            
                                            <button onclick="quickAddQuantitativeItem()" class="w-full bg-blue-50 text-blue-700 py-3 rounded-lg font-medium hover:bg-blue-100 transition-colors border-2 border-dashed border-blue-300">
                                                <i class="fas fa-plus mr-2"></i>빠른 추가
                                            </button>
                                        </div>
                                    </div>

                                    <!-- 정성평가 항목 관리 -->
                                    <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
                                        <div class="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-t-lg">
                                            <div class="flex items-center justify-between">
                                                <h3 class="text-lg font-semibold text-white">
                                                    <i class="fas fa-comments mr-2"></i>정성평가 항목
                                                </h3>
                                                <button onclick="startEvaluationWizard('qualitative')" class="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors">
                                                    <i class="fas fa-magic mr-2"></i>마법사로 추가
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div class="p-4">
                                            <div id="qualitativeItemsGrid" class="space-y-3 mb-4">
                                                <!-- 동적으로 채워짐 -->
                                            </div>
                                            
                                            <button onclick="quickAddQualitativeItem()" class="w-full bg-green-50 text-green-700 py-3 rounded-lg font-medium hover:bg-green-100 transition-colors border-2 border-dashed border-green-300">
                                                <i class="fas fa-plus mr-2"></i>빠른 추가
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 평가 배정 탭 -->
                            <div id="evaluation-assignment" class="evaluation-tab-content hidden">
                                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <!-- 조직 구조 -->
                                    <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                        <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                            <i class="fas fa-sitemap mr-2"></i>조직 구조
                                        </h3>
                                        <div id="organizationTree" class="space-y-2">
                                            <!-- 동적으로 채워짐 -->
                                        </div>
                                    </div>

                                    <!-- 평가 항목 풀 -->
                                    <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                        <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                            <i class="fas fa-list-alt mr-2"></i>평가 항목 풀
                                        </h3>
                                        <div class="space-y-3">
                                            <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                <h4 class="font-medium text-blue-900 mb-2">정량평가</h4>
                                                <div id="quantitativePool" class="space-y-1">
                                                    <!-- 드래그 가능한 항목들 -->
                                                </div>
                                            </div>
                                            <div class="bg-green-50 p-3 rounded-lg border border-green-200">
                                                <h4 class="font-medium text-green-900 mb-2">정성평가</h4>
                                                <div id="qualitativePool" class="space-y-1">
                                                    <!-- 드래그 가능한 항목들 -->
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 배정 결과 -->
                                    <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                        <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                            <i class="fas fa-clipboard-list mr-2"></i>배정 현황
                                        </h3>
                                        <div id="assignmentResult" class="space-y-3">
                                            <!-- 드롭 영역 -->
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 미리보기 탭 -->
                            <div id="evaluation-preview" class="evaluation-tab-content hidden">
                                <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <div class="flex items-center justify-between mb-6">
                                        <h3 class="text-lg font-semibold text-gray-900">
                                            <i class="fas fa-eye mr-2"></i>평가 시뮬레이션
                                        </h3>
                                        <div class="flex space-x-3">
                                            <select id="previewOrganization" class="px-3 py-2 border border-gray-300 rounded-lg">
                                                <option value="sales_team">Sales팀</option>
                                                <option value="cx_team">CX팀</option>
                                            </select>
                                            <button onclick="runEvaluationPreview()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                                <i class="fas fa-play mr-2"></i>시뮬레이션 실행
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div id="previewResult" class="min-h-96">
                                        <div class="text-center py-12 text-gray-500">
                                            <i class="fas fa-play-circle text-4xl mb-4"></i>
                                            <p>시뮬레이션을 실행해보세요</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 통합 사용자 관리 -->
                        <div id="usersSettings" class="settings-content hidden">
                            <!-- 승인 대기 회원 관리 -->
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-lg font-semibold text-gray-900">
                                        <i class="fas fa-user-clock text-orange-500 mr-2"></i>승인 대기 회원
                                    </h3>
                                    <div class="flex space-x-2">
                                        <button onclick="bulkApproveUsers()" class="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors">
                                            <i class="fas fa-check-double mr-1"></i>전체 승인
                                        </button>
                                        <button onclick="refreshPendingUsers()" 
                                                class="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                                            <i class="fas fa-sync-alt mr-1"></i>새로고침
                                        </button>
                                    </div>
                                </div>
                                
                                <div id="pendingUsersContainer">
                                    <div class="text-center py-8 text-gray-500">
                                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                        <p>대기 중인 회원을 불러오는 중...</p>
                                    </div>
                                </div>
                            </div>

                            <!-- 전체 사용자 관리 -->
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-lg font-semibold text-gray-900">
                                        <i class="fas fa-users text-blue-500 mr-2"></i>전체 사용자 관리
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

                            <!-- 고급 관리 도구 -->
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                                    <i class="fas fa-tools text-indigo-500 mr-2"></i>고급 관리 도구
                                </h3>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <button onclick="cleanupInactiveUsers()" class="flex flex-col items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                                        <i class="fas fa-user-slash text-yellow-600 text-xl mb-2"></i>
                                        <span class="text-sm font-medium text-yellow-800">비활성 사용자 정리</span>
                                    </button>
                                    
                                    <button onclick="exportUserList()" class="flex flex-col items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                                        <i class="fas fa-download text-blue-600 text-xl mb-2"></i>
                                        <span class="text-sm font-medium text-blue-800">사용자 목록 내보내기</span>
                                    </button>
                                    
                                    <button onclick="testEmailService()" class="flex flex-col items-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                                        <i class="fas fa-envelope-open-text text-purple-600 text-xl mb-2"></i>
                                        <span class="text-sm font-medium text-purple-800">이메일 알림 테스트</span>
                                    </button>
                                    
                                    <button onclick="showUserStats()" class="flex flex-col items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                                        <i class="fas fa-chart-bar text-green-600 text-xl mb-2"></i>
                                        <span class="text-sm font-medium text-green-800">사용자 통계</span>
                                    </button>
                                </div>
                                
                                <!-- 상세 사용자 상태 관리 -->
                                <div class="mt-6">
                                    <h4 class="font-medium text-gray-900 mb-3">사용자 상태 관리</h4>
                                    <div id="userStatusManagement" class="space-y-3">
                                        <div class="text-center py-4 text-gray-500">
                                            <i class="fas fa-info-circle text-xl mb-2"></i>
                                            <p>위의 "전체 사용자 관리"에서 사용자를 선택하면 상세 관리 옵션이 여기에 표시됩니다.</p>
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
                                                    <span class="ml-2 text-sm">Sales팀만</span>
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

            // showSettingsTab 함수는 Settings & System 스크립트에서 정의됨
            // 여기서는 임시 함수를 정의하지 않음 (중복 정의 방지)
                        }
                        break;
                    case 'users':
                        if (typeof loadUserStatusManagement === 'function') {
                            loadUserStatusManagement();
                        }
                        break;
                    case 'dashboard':
                        if (typeof updateDashboardStats === 'function') {
                            updateDashboardStats(); // 대시보드 통계 업데이트
                        }
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
                if (!confirm('⚠️ 기존 조직 데이터를 모두 삭제하고 실제 클라우드사업본부 구조로 초기화하시겠습니까?\\n\\n초기화될 구조:\\n• Sales팀 (영업, 영업관리)\\n• CX팀 (고객서비스, 기술지원, Technical Writing, Technical Marketing, 사업운영)')) {
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
                        user.role === 'admin' ? '관리자' : 
                        user.role === 'admin_user' ? '관리자겸사용자' : '일반사용자',
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
            
            // 이메일 서비스 테스트
            async function testEmailService() {
                if (!confirm('이메일 알림 시스템을 테스트하시겠습니까?\\n\\nrayben@forcs.com으로 테스트 메일이 발송됩니다.')) {
                    return;
                }
                
                try {
                    const response = await fetch('/api/test-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('✅ ' + result.message + '\\n\\n📧 rayben@forcs.com 메일함을 확인해주세요.');
                    } else {
                        alert('❌ 이메일 테스트 실패: ' + result.message + '\\n\\n설정을 확인해주세요:\\n- Gmail 앱 비밀번호 설정\\n- SMTP 연결 상태');
                    }
                } catch (error) {
                    alert('❌ 이메일 테스트 중 오류가 발생했습니다: ' + error.message);
                }
            }

            // 메인 탭 전환 함수를 전역으로 정의하여 onclick에서 사용 가능하게 함
            window.showTab = window.showTabReal = function(tabName, event = null) {
                try {
                    console.log('🔄 showTab 호출:', tabName);
                    
                    // 권한 확인
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    if (tabName === 'systemSettings' && user.role !== 'admin') {
                        alert('관리자 권한이 필요한 메뉴입니다.');
                        return;
                    }
                    
                    // 모든 탭 콘텐츠 숨기기
                    const allTabContents = document.querySelectorAll('.tab-content');
                    allTabContents.forEach(content => {
                        if (content) {
                            content.classList.add('hidden');
                            content.classList.remove('active');
                        }
                    });
                    
                    // 모든 탭 버튼 비활성화
                    const allTabButtons = document.querySelectorAll('.tab-button');
                    allTabButtons.forEach(button => {
                        if (button) {
                            button.classList.remove('active');
                            button.classList.remove('bg-gray-100', 'text-gray-900');
                            button.classList.add('text-gray-600');
                        }
                    });
                    
                    // 선택된 탭 콘텐츠 표시
                    const targetContent = document.getElementById(tabName);
                    if (targetContent) {
                        targetContent.classList.remove('hidden');
                        targetContent.classList.add('active');
                        console.log('✅ 탭 콘텐츠 표시:', tabName);
                    } else {
                        console.warn('⚠️ 탭 콘텐츠를 찾을 수 없음:', tabName);
                    }
                    
                    // 선택된 탭 버튼 활성화 (이벤트가 있을 때만)
                    if (event && event.target) {
                        const activeButton = event.target.closest('button');
                        if (activeButton) {
                            activeButton.classList.add('active', 'bg-gray-100', 'text-gray-900');
                            activeButton.classList.remove('text-gray-600');
                        }
                    }
                    
                    // 특별한 탭 처리
                    switch(tabName) {
                        case 'dashboard':
                            // 대시보드는 권한에 따라 다른 내용 표시
                            const dashboardContent = document.getElementById('dashboard');
                            if (dashboardContent && user.role === 'admin') {
                                // 관리자 대시보드 로드 로직
                                console.log('📊 관리자 대시보드 로드');
                            } else if (dashboardContent) {
                                // 일반 사용자 대시보드 로드 로직  
                                console.log('👤 사용자 대시보드 로드');
                            }
                            break;
                            
                        case 'systemSettings':
                            // 시스템 설정은 기본적으로 조직 설정 탭 표시
                            setTimeout(() => {
                                try {
                                    if (typeof window.showSettingsTabReal === 'function') {
                                        window.showSettingsTabReal('organization');
                                    } else if (typeof window.showSettingsTab === 'function') {
                                        window.showSettingsTab('organization');
                                    }
                                } catch (error) {
                                    console.error('❌ 시스템 설정 탭 로드 오류:', error);
                                }
                            }, 100);
                            break;
                    }
                    
                    console.log('✅ 탭 전환 완료:', tabName);
                } catch (error) {
                    console.error('❌ showTab 오류:', error);
                }
            }
        </script>

        <!-- 🧰 Core Utils - 기본 유틸리티 -->
        <script>
        // Toast 메시지 시스템
        window.showToast = function(message, type = 'info') {
            const existingToast = document.querySelector('.toast-message');
            if (existingToast) existingToast.remove();
            
            const toast = document.createElement('div');
            toast.className = 'toast-message fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm';
            
            const colors = {
                success: 'bg-green-500 text-white',
                error: 'bg-red-500 text-white', 
                warning: 'bg-yellow-500 text-white',
                info: 'bg-blue-500 text-white'
            };
            
            toast.className += ' ' + (colors[type] || colors.info);
            toast.innerHTML = '<i class="fas fa-info-circle mr-2"></i>' + message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        };

        // 권한 체크
        window.isAdmin = function() {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.role === 'admin' || user.role === 'admin_user';
        };

        // 현재 사용자 정보 가져오기
        window.getCurrentUser = function() {
            return JSON.parse(localStorage.getItem('user') || '{}');
        };

        console.log('✅ Core Utils 로드됨');
        </script>

        <!-- 🔐 Auth & Data Management - 인증 및 데이터 관리 -->
        <script>
        // 데이터 로드 함수들
        async function loadFromDatabase() {
            console.log('📖 데이터베이스에서 로드 중...');
            loadFromStorage(); // 현재는 LocalStorage 사용
        }

        function loadFromStorage() {
            console.log('📖 LocalStorage에서 로드 중...');
            const orgData = localStorage.getItem('organizationData');
            window.organizationData = orgData ? JSON.parse(orgData) : {};
        }

        // API 호출 헬퍼
        window.apiCall = async function(url, options = {}) {
            try {
                const response = await fetch(url, {
                    headers: { 'Content-Type': 'application/json' },
                    ...options
                });
                return await response.json();
            } catch (error) {
                console.error('API 호출 오류:', error);
                throw error;
            }
        };

        console.log('✅ Auth & Data Management 로드됨');
        </script>

        <!-- ⚙️ Settings & System - 설정 및 시스템 관리 -->
        <script>
        // 설정 탭 전환
        window.showSettingsTab = window.showSettingsTabReal = function(tabName) {
            try {
                console.log('⚙️ Settings tab switching to:', tabName);
                
                // 모든 설정 탭 숨기기 및 버튼 초기화
                document.querySelectorAll('.settings-content').forEach(content => {
                    if (content) {
                        content.classList.add('hidden');
                        content.classList.remove('active');  // active 클래스도 제거
                    }
                });
                document.querySelectorAll('.settings-tab-btn').forEach(btn => {
                    if (btn) {
                        btn.classList.remove('border-blue-500', 'text-blue-600');
                        btn.classList.add('border-transparent', 'text-gray-500');
                    }
                });
                
                // 선택된 탭 활성화
                const targetContent = document.getElementById(tabName + 'Settings');
                // 버튼 ID 매핑 (HTML에서 사용하는 짧은 ID)
                const buttonIdMap = {
                    'organization': 'orgTab',
                    'evaluation': 'evalTab',
                    'users': 'usersTab',
                    'schedule': 'scheduleTab'
                };
                const targetButton = document.getElementById(buttonIdMap[tabName] || tabName + 'Tab');
                
                console.log('🎯 Target content:', !!targetContent, 'Target button:', !!targetButton);
                
                if (targetContent) {
                    targetContent.classList.remove('hidden');
                    targetContent.classList.add('active');  // CSS에서 요구하는 active 클래스 추가
                    console.log('✅ 탭 컨텐츠 표시됨:', tabName + 'Settings');
                } else {
                    console.warn('⚠️ 탭 컨텐츠를 찾을 수 없음:', tabName + 'Settings');
                }
                
                if (targetButton) {
                    targetButton.classList.remove('border-transparent', 'text-gray-500');
                    targetButton.classList.add('border-blue-500', 'text-blue-600');
                    console.log('✅ 탭 버튼 활성화됨:', tabName + 'Tab');
                } else {
                    console.warn('⚠️ 탭 버튼을 찾을 수 없음:', tabName + 'Tab');
                }
                
                // 탭별 데이터 로드
                setTimeout(() => {
                    try {
                        if (tabName === 'organization' && typeof refreshOrganization === 'function') {
                            refreshOrganization();
                        }
                        if (tabName === 'users') {
                            if (typeof refreshPendingUsers === 'function') refreshPendingUsers();
                            if (typeof refreshAllUsers === 'function') refreshAllUsers();
                        }
                        if (tabName === 'evaluation') {
                            // 평가 설정 탭의 경우 기본적으로 대시보드 탭 활성화
                            if (typeof switchEvaluationTab === 'function') {
                                switchEvaluationTab('dashboard');
                            }
                        }
                    } catch (error) {
                        console.error('❌ 탭 데이터 로드 오류:', error);
                    }
                }, 100);
                
                console.log('✅ Settings tab 전환 완료:', tabName);
            } catch (error) {
                console.error('❌ Settings tab 전환 오류:', error);
            }
        };

        // 실제 함수를 즉시 window.showTab에 할당
        window.showTab = window.showTabReal || window.showTab;
        window.showSettingsTab = window.showSettingsTabReal || window.showSettingsTab;
        console.log('✅ 함수 등록 완료');

        // 시스템 관리 함수들
        window.exportUserList = () => showToast('사용자 목록 내보내기 기능 준비 중입니다.', 'info');
        window.cleanupInactiveUsers = () => showToast('비활성 사용자 정리 기능 준비 중입니다.', 'info');
        window.showUserStats = () => showToast('사용자 통계 기능 준비 중입니다.', 'info');

        window.testEmailService = async function() {
            try {
                const data = await apiCall('/api/test-email', { method: 'POST' });
                showToast(data.success ? '테스트 이메일이 발송되었습니다.' : data.message || '이메일 테스트 실패', data.success ? 'success' : 'error');
            } catch (error) {
                console.error('이메일 테스트 오류:', error);
                showToast('이메일 테스트 중 오류가 발생했습니다.', 'error');
            }
        };

        console.log('✅ Settings & System 로드됨');
        </script>

        <!-- 🏢 Organization Management - 조직 관리 -->
        <script>
        // 조직 목록 새로고침
        window.refreshOrganization = async function() {
            try {
                const data = await apiCall('/api/organizations');
                if (!data.success) throw new Error(data.message);
                
                const container = document.getElementById('organizationTree');
                if (!container) return;
                
                if (data.organizations.length === 0) {
                    container.innerHTML = 
                        '<div class="text-center py-8 text-gray-500">' +
                            '<i class="fas fa-building text-3xl mb-4"></i>' +
                            '<p>조직이 아직 설정되지 않았습니다.</p>' +
                            '<button onclick="initializeRealOrganization()" class="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">' +
                                '<i class="fas fa-sync mr-2"></i>실제 구조로 초기화' +
                            '</button>' +
                        '</div>';
                } else {
                    renderOrganizationTree(data.organizations);
                }
                
                updateParentOrgSelect(data.organizations);
            } catch (error) {
                console.error('조직 목록 로드 오류:', error);
                showToast('조직 목록을 불러올 수 없습니다.', 'error');
            }
        };

        // 조직 트리 렌더링
        function renderOrganizationTree(organizations) {
            const teams = organizations.filter(org => org.type === 'team');
            const parts = organizations.filter(org => org.type === 'part');
            
            let html = '';
            teams.forEach(team => {
                html += '<div class="border border-gray-200 rounded-lg p-4 mb-4">';
                html += '<div class="flex items-center justify-between mb-3">';
                html += '<div class="flex items-center space-x-3">';
                html += '<h4 class="text-lg font-semibold text-blue-600"><i class="fas fa-users mr-2"></i>' + team.name + '</h4>';
                html += '<span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">' + team.memberCount + '명</span>';
                html += '</div>';
                html += '<div class="flex space-x-2">';
                html += '<button onclick="editOrganization(\\'' + team.id + '\\')" class="text-blue-600 hover:text-blue-800"><i class="fas fa-edit"></i></button>';
                html += '<button onclick="deleteOrganization(\\'' + team.id + '\\')" class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>';
                html += '</div></div>';
                
                // 팀 멤버 표시
                if (team.members && team.members.length > 0) {
                    html += '<div class="mb-3 ml-6">';
                    html += '<h5 class="text-sm font-medium text-gray-600 mb-2">팀 멤버</h5>';
                    html += '<div class="flex flex-wrap gap-2">';
                    team.members.forEach(member => {
                        const roleClass = member.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700';
                        const roleIcon = member.role === 'admin' ? 'fas fa-crown' : 'fas fa-user';
                        html += '<div class="flex items-center space-x-1 px-2 py-1 ' + roleClass + ' rounded-full text-xs">';
                        html += '<i class="' + roleIcon + '"></i>';
                        html += '<span>' + member.name + '</span>';
                        html += '</div>';
                    });
                    html += '</div></div>';
                }
                
                const teamParts = parts.filter(part => part.parentId === team.id);
                if (teamParts.length > 0) {
                    html += '<div class="ml-6 space-y-2">';
                    teamParts.forEach(part => {
                        html += '<div class="p-3 bg-gray-50 rounded border-l-4 border-green-400">';
                        html += '<div class="flex items-center justify-between mb-2">';
                        html += '<div class="flex items-center space-x-2">';
                        html += '<span class="font-medium text-gray-800"><i class="fas fa-sitemap mr-2 text-green-600"></i>' + part.name + '</span>';
                        html += '<span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">' + part.memberCount + '명</span>';
                        html += '</div>';
                        html += '<div class="flex space-x-2">';
                        html += '<button onclick="editOrganization(\\'' + part.id + '\\')" class="text-blue-600 hover:text-blue-800"><i class="fas fa-edit"></i></button>';
                        html += '<button onclick="deleteOrganization(\\'' + part.id + '\\')" class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>';
                        html += '</div></div>';
                        
                        // 파트 멤버 표시
                        if (part.members && part.members.length > 0) {
                            html += '<div class="ml-4">';
                            html += '<div class="flex flex-wrap gap-2">';
                            part.members.forEach(member => {
                                const roleClass = member.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-white text-gray-700 border border-gray-200';
                                const roleIcon = member.role === 'admin' ? 'fas fa-crown' : 'fas fa-user';
                                html += '<div class="flex items-center space-x-1 px-2 py-1 ' + roleClass + ' rounded text-xs">';
                                html += '<i class="' + roleIcon + '"></i>';
                                html += '<span>' + member.name + '</span>';
                                html += '</div>';
                            });
                            html += '</div></div>';
                        } else {
                            html += '<div class="ml-4 text-xs text-gray-500 italic">멤버 없음</div>';
                        }
                        
                        html += '</div>';
                    });
                    html += '</div>';
                } else {
                    html += '<div class="ml-6 text-sm text-gray-500 italic">하위 조직 없음</div>';
                }
                html += '</div>';
            });
            
            document.getElementById('organizationTree').innerHTML = html;
        }

        // 상위 조직 선택 옵션 업데이트
        function updateParentOrgSelect(organizations) {
            const parentSelect = document.getElementById('parentOrg');
            if (!parentSelect) return;
            
            const teams = organizations.filter(org => org.type === 'team');
            parentSelect.innerHTML = '<option value="">클라우드사업본부 (최상위)</option>';
            teams.forEach(team => {
                parentSelect.innerHTML += '<option value="' + team.id + '">' + team.name + '</option>';
            });
        }

        // 실제 조직 구조 초기화
        window.initializeRealOrganization = async function() {
            if (!isAdmin()) return showToast('관리자 권한이 필요합니다.', 'error');
            
            if (!confirm('⚠️ 기존 조직 데이터를 모두 삭제하고 실제 클라우드사업본부 구조로 초기화하시겠습니까?\\n\\n초기화될 구조:\\n• Sales팀 (영업, 영업관리)\\n• CX팀 (고객서비스, 기술지원, Technical Writing, Technical Marketing, 사업운영)')) {
                return;
            }
            
            try {
                const data = await apiCall('/api/organizations/initialize', { method: 'POST' });
                showToast(data.success ? '클라우드사업본부 조직 구조가 초기화되었습니다.' : data.message || '초기화 실패', data.success ? 'success' : 'error');
                if (data.success) refreshOrganization();
            } catch (error) {
                console.error('조직 구조 초기화 오류:', error);
                showToast('초기화 중 오류가 발생했습니다.', 'error');
            }
        };

        // 조직 편집
        window.editOrganization = async function(orgId) {
            if (!isAdmin()) return showToast('관리자 권한이 필요합니다.', 'error');
            
            try {
                const data = await apiCall('/api/organizations');
                if (!data.success) throw new Error('조직 데이터를 가져올 수 없습니다.');
                
                const org = data.organizations.find(o => o.id === orgId);
                if (!org) return showToast('조직 정보를 찾을 수 없습니다.', 'error');
                
                const typeText = org.type === 'team' ? '팀' : '파트';
                const newName = prompt(typeText + ' 이름을 수정하세요:', org.name);
                
                if (newName && newName.trim() !== org.name) {
                    const updateData = await apiCall('/api/organizations/' + orgId, {
                        method: 'PUT',
                        body: JSON.stringify({ name: newName.trim() })
                    });
                    
                    showToast(updateData.success ? '조직 정보가 수정되었습니다.' : updateData.message || '수정 실패', updateData.success ? 'success' : 'error');
                    if (updateData.success) refreshOrganization();
                }
            } catch (error) {
                console.error('조직 수정 오류:', error);
                showToast('조직 수정 중 오류가 발생했습니다.', 'error');
            }
        };

        // 조직 삭제
        window.deleteOrganization = async function(orgId) {
            if (!isAdmin()) return showToast('관리자 권한이 필요합니다.', 'error');
            
            try {
                const data = await apiCall('/api/organizations');
                if (!data.success) throw new Error('조직 데이터를 가져올 수 없습니다.');
                
                const org = data.organizations.find(o => o.id === orgId);
                if (!org) return showToast('조직 정보를 찾을 수 없습니다.', 'error');
                
                const typeText = org.type === 'team' ? '팀' : '파트';
                if (!confirm('"' + org.name + '" ' + typeText + '를 삭제하시겠습니까?')) return;
                
                const deleteData = await apiCall('/api/organizations/' + orgId, { method: 'DELETE' });
                showToast(deleteData.success ? '조직이 삭제되었습니다.' : deleteData.message || '삭제 실패', deleteData.success ? 'info' : 'error');
                if (deleteData.success) refreshOrganization();
            } catch (error) {
                console.error('조직 삭제 오류:', error);
                showToast('조직 삭제 중 오류가 발생했습니다.', 'error');
            }
        };

        console.log('✅ Organization Management 로드됨');
        </script>

        <!-- 👥 User Management - 사용자 관리 -->
        <script>
        // 승인 대기 회원 새로고침
        window.refreshPendingUsers = async function() {
            try {
                const data = await apiCall('/api/users/pending');
                if (!data.success) throw new Error(data.message);
                
                const container = document.getElementById('pendingUsersContainer');
                if (!container) return;
                
                if (data.users.length === 0) {
                    container.innerHTML = 
                        '<div class="text-center py-8 text-gray-500">' +
                            '<i class="fas fa-user-check text-3xl mb-4"></i>' +
                            '<p>승인 대기 중인 회원이 없습니다.</p>' +
                        '</div>';
                } else {
                    renderPendingUsers(container, data.users);
                }
            } catch (error) {
                console.error('승인 대기 회원 로드 오류:', error);
                renderError(document.getElementById('pendingUsersContainer'), '승인 대기 회원', 'refreshPendingUsers');
            }
        };

        // 전체 사용자 새로고침
        window.refreshAllUsers = async function() {
            try {
                const data = await apiCall('/api/users');
                if (!data.success) throw new Error(data.message);
                
                const container = document.getElementById('allUsersContainer');
                if (!container) return;
                
                if (data.users.length === 0) {
                    container.innerHTML = 
                        '<div class="text-center py-8 text-gray-500">' +
                            '<i class="fas fa-users text-3xl mb-4"></i>' +
                            '<p>등록된 사용자가 없습니다.</p>' +
                        '</div>';
                } else {
                    renderAllUsers(container, data.users);
                }
            } catch (error) {
                console.error('전체 사용자 로드 오류:', error);
                renderError(document.getElementById('allUsersContainer'), '사용자 목록', 'refreshAllUsers');
            }
        };

        // 승인 대기 회원 렌더링
        function renderPendingUsers(container, users) {
            const usersHTML = users.map(user => 
                '<div class="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">' +
                    '<div class="flex items-center space-x-3">' +
                        '<div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">' +
                            '<i class="fas fa-user text-yellow-600"></i>' +
                        '</div>' +
                        '<div>' +
                            '<h4 class="font-medium text-gray-900">' + user.name + '</h4>' +
                            '<p class="text-sm text-gray-600">' + user.email + '</p>' +
                            '<p class="text-xs text-gray-500">' + getRoleName(user.role) + ' • ' + new Date(user.createdAt).toLocaleString('ko-KR') + '</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="flex space-x-2">' +
                        '<button onclick="approveUser(\\'' + user.email + '\\')" class="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">' +
                            '<i class="fas fa-check mr-1"></i>승인' +
                        '</button>' +
                        '<button onclick="rejectUser(\\'' + user.email + '\\')" class="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">' +
                            '<i class="fas fa-times mr-1"></i>거부' +
                        '</button>' +
                    '</div>' +
                '</div>'
            ).join('');
            
            container.innerHTML = 
                '<div class="mb-4">' +
                    '<p class="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">' +
                        '<i class="fas fa-exclamation-triangle mr-2"></i>' +
                        '총 <strong>' + users.length + '명</strong>의 회원이 승인을 기다리고 있습니다.' +
                    '</p>' +
                '</div>' + usersHTML;
        }

        // 전체 사용자 렌더링
        function renderAllUsers(container, users) {
            const usersHTML = users.map(user => {
                const statusColor = getStatusColor(user.status);
                const statusName = getStatusName(user.status);
                
                return '<div class="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">' +
                    '<div class="flex items-center space-x-3">' +
                        '<div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">' +
                            '<i class="fas fa-user text-blue-600"></i>' +
                        '</div>' +
                        '<div>' +
                            '<h4 class="font-medium text-gray-900">' + user.name + '</h4>' +
                            '<p class="text-sm text-gray-600">' + user.email + '</p>' +
                            '<div class="flex items-center space-x-2 mt-1">' +
                                '<span class="text-xs px-2 py-1 rounded-full ' + statusColor + '">' + statusName + '</span>' +
                                '<span class="text-xs text-gray-500">' + getRoleName(user.role) + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="flex space-x-2">' +
                        '<button onclick="editUser(\\'' + user.email + '\\')" class="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors">' +
                            '<i class="fas fa-edit mr-1"></i>수정' +
                        '</button>' +
                        '<button onclick="deleteUser(\\'' + user.email + '\\')" class="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors">' +
                            '<i class="fas fa-trash mr-1"></i>삭제' +
                        '</button>' +
                    '</div>' +
                '</div>';
            }).join('');
            
            container.innerHTML = usersHTML;
        }

        // 헬퍼 함수들
        function getRoleName(role) {
            const roleNames = { 'admin': '관리자', 'admin_user': '관리자겸사용자', 'user': '일반 사용자' };
            return roleNames[role] || '일반 사용자';
        }

        function getStatusColor(status) {
            const colors = {
                'approved': 'bg-green-100 text-green-800',
                'pending': 'bg-yellow-100 text-yellow-800',
                'rejected': 'bg-red-100 text-red-800',
                'inactive': 'bg-gray-100 text-gray-800'
            };
            return colors[status] || 'bg-gray-100 text-gray-800';
        }

        function getStatusName(status) {
            const names = { 'approved': '승인됨', 'pending': '대기중', 'rejected': '거부됨', 'inactive': '비활성' };
            return names[status] || status;
        }

        function renderError(container, type, retryFunction) {
            if (!container) return;
            container.innerHTML = 
                '<div class="text-center py-8 text-red-500">' +
                    '<i class="fas fa-exclamation-circle text-2xl mb-2"></i>' +
                    '<p>' + type + '을 불러올 수 없습니다.</p>' +
                    '<button onclick="' + retryFunction + '()" class="mt-2 text-sm text-blue-600 hover:text-blue-800">다시 시도</button>' +
                '</div>';
        }

        // 사용자 승인
        window.approveUser = async function(email) {
            if (!isAdmin()) return showToast('관리자 권한이 필요합니다.', 'error');
            
            try {
                const currentUser = getCurrentUser();
                const data = await apiCall('/api/users/approve', {
                    method: 'POST',
                    body: JSON.stringify({ email, approverEmail: currentUser.email })
                });
                
                showToast(data.message, data.success ? 'success' : 'error');
                if (data.success) {
                    refreshPendingUsers();
                    refreshAllUsers();
                    updateDashboardStats(); // 대시보드 통계 업데이트
                }
            } catch (error) {
                console.error('사용자 승인 오류:', error);
                showToast('승인 처리 중 오류가 발생했습니다.', 'error');
            }
        };

        // 사용자 거부
        window.rejectUser = async function(email) {
            if (!isAdmin()) return showToast('관리자 권한이 필요합니다.', 'error');
            
            const reason = prompt('거부 사유를 입력하세요 (선택사항):');
            if (reason === null) return;
            
            try {
                const currentUser = getCurrentUser();
                const data = await apiCall('/api/users/reject', {
                    method: 'POST',
                    body: JSON.stringify({ email, reason, approverEmail: currentUser.email })
                });
                
                showToast(data.message, data.success ? 'info' : 'error');
                if (data.success) {
                    refreshPendingUsers();
                    refreshAllUsers();
                    updateDashboardStats(); // 대시보드 통계 업데이트
                }
            } catch (error) {
                console.error('사용자 거부 오류:', error);
                showToast('거부 처리 중 오류가 발생했습니다.', 'error');
            }
        };

        // 일괄 승인
        window.bulkApproveUsers = async function() {
            if (!isAdmin()) return showToast('관리자 권한이 필요합니다.', 'error');
            if (!confirm('정말로 대기 중인 모든 회원을 승인하시겠습니까?')) return;
            
            try {
                const currentUser = getCurrentUser();
                const data = await apiCall('/api/users/bulk-approve', {
                    method: 'POST',
                    body: JSON.stringify({ approverEmail: currentUser.email })
                });
                
                showToast(data.message, data.success ? 'success' : 'error');
                if (data.success) {
                    refreshPendingUsers();
                    refreshAllUsers();
                    updateDashboardStats(); // 대시보드 통계 업데이트
                }
            } catch (error) {
                console.error('일괄 승인 오류:', error);
                showToast('일괄 승인 중 오류가 발생했습니다.', 'error');
            }
        };

        // 사용자 수정
        window.editUser = async function(email) {
            if (!isAdmin()) return showToast('관리자 권한이 필요합니다.', 'error');
            
            try {
                // 사용자 정보 가져오기
                const usersData = await apiCall('/api/users');
                if (!usersData.success) throw new Error('사용자 데이터를 가져올 수 없습니다.');
                
                const user = usersData.users.find(u => u.email === email);
                if (!user) return showToast('사용자를 찾을 수 없습니다.', 'error');
                
                // 조직 데이터 가져오기
                const orgData = await apiCall('/api/organizations');
                if (!orgData.success) throw new Error('조직 데이터를 가져올 수 없습니다.');
                
                const organizations = orgData.organizations;
                const teams = organizations.filter(org => org.type === 'team');
                
                // 수정 모달 만들기
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                
                const modalContent = document.createElement('div');
                modalContent.className = 'bg-white rounded-lg p-6 w-full max-w-md mx-4';
                
                modalContent.innerHTML = '<h3 class="text-lg font-semibold text-gray-900 mb-4">' + 
                    '<i class="fas fa-user-edit text-blue-600 mr-2"></i>사용자 정보 수정' + 
                    '</h3>' +
                    '<form id="editUserForm" class="space-y-4">' +
                        '<div>' +
                            '<label class="block text-sm font-medium text-gray-700 mb-1">이름</label>' +
                            '<input type="text" id="editUserName" value="' + user.name + '" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">' +
                        '</div>' +
                        '<div>' +
                            '<label class="block text-sm font-medium text-gray-700 mb-1">역할</label>' +
                            '<select id="editUserRole" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">' +
                                '<option value="user"' + (user.role === 'user' ? ' selected' : '') + '>일반 사용자</option>' +
                                '<option value="admin"' + (user.role === 'admin' ? ' selected' : '') + '>관리자</option>' +
                                '<option value="admin_user"' + (user.role === 'admin_user' ? ' selected' : '') + '>관리자겸사용자</option>' +
                            '</select>' +
                        '</div>' +
                        '<div>' +
                            '<label class="block text-sm font-medium text-gray-700 mb-1">소속 팀</label>' +
                            '<select id="editUserTeam" onchange="updateEditPartOptions()" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">' +
                                '<option value="">팀을 선택하세요</option>' +
                                teams.map(team => '<option value="' + team.id + '"' + (user.team === team.name ? ' selected' : '') + '>' + team.name + '</option>').join('') +
                            '</select>' +
                        '</div>' +
                        '<div>' +
                            '<label class="block text-sm font-medium text-gray-700 mb-1">소속 파트</label>' +
                            '<select id="editUserPart" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">' +
                                '<option value="">파트를 선택하세요</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="flex justify-end space-x-2 mt-6">' +
                            '<button type="button" onclick="closeEditModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">취소</button>' +
                            '<button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">수정</button>' +
                        '</div>' +
                    '</form>';
                
                modal.appendChild(modalContent);
                
                // 모달 닫기 함수
                window.closeEditModal = function() {
                    if (modal.parentNode) {
                        document.body.removeChild(modal);
                    }
                    delete window.closeEditModal;
                    delete window.updateEditPartOptions;
                };
                
                // 파트 옵션 업데이트 함수
                window.updateEditPartOptions = function() {
                    const teamSelect = document.getElementById('editUserTeam');
                    const partSelect = document.getElementById('editUserPart');
                    const selectedTeam = teamSelect.value;
                    
                    partSelect.innerHTML = '<option value="">파트를 선택하세요</option>';
                    
                    if (selectedTeam) {
                        const parts = organizations.filter(org => org.type === 'part' && org.parentId === selectedTeam);
                        parts.forEach(part => {
                            const option = document.createElement('option');
                            option.value = part.id;
                            option.textContent = part.name;
                            if (user.part === part.name) option.selected = true;
                            partSelect.appendChild(option);
                        });
                    }
                };
                
                // 초기 파트 옵션 로드
                document.body.appendChild(modal);
                
                // 현재 사용자의 팀에 따른 파트 옵션 로드
                const currentTeam = teams.find(team => team.name === user.team);
                if (currentTeam) {
                    document.getElementById('editUserTeam').value = currentTeam.id;
                    window.updateEditPartOptions();
                }
                
                // 폼 제출 처리
                document.getElementById('editUserForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const name = document.getElementById('editUserName').value.trim();
                    const role = document.getElementById('editUserRole').value;
                    const teamId = document.getElementById('editUserTeam').value;
                    const partId = document.getElementById('editUserPart').value;
                    
                    if (!name) return showToast('이름을 입력해주세요.', 'error');
                    if (!teamId) return showToast('소속 팀을 선택해주세요.', 'error');
                    if (!partId) return showToast('소속 파트를 선택해주세요.', 'error');
                    
                    try {
                        const currentUser = getCurrentUser();
                        const data = await apiCall('/api/users/' + email, {
                            method: 'PUT',
                            body: JSON.stringify({
                                name: name,
                                role: role,
                                team: teamId,
                                part: partId,
                                updaterEmail: currentUser.email
                            })
                        });
                        
                        showToast(data.message, data.success ? 'success' : 'error');
                        if (data.success) {
                            window.closeEditModal();
                            refreshAllUsers();
                            updateDashboardStats();
                        }
                    } catch (error) {
                        console.error('사용자 수정 오류:', error);
                        showToast('사용자 수정 중 오류가 발생했습니다.', 'error');
                    }
                });
                
            } catch (error) {
                console.error('사용자 수정 모달 오류:', error);
                showToast('사용자 수정 모달을 열 수 없습니다.', 'error');
            }
        };

        // 대시보드 통계 업데이트 함수
        window.updateDashboardStats = async function() {
            try {
                console.log('🔄 대시보드 통계 업데이트 시작...');
                const data = await apiCall('/api/users');
                console.log('📊 API 응답 데이터:', data);
                if (!data.success) throw new Error(data.message);
                
                const totalUsers = data.users.length;
                const pendingUsers = data.users.filter(user => user.status === 'pending').length;
                const approvedUsers = data.users.filter(user => user.status === 'approved').length;
                
                console.log('📈 통계 계산 결과:', { totalUsers, pendingUsers, approvedUsers });
                
                // 관리자 대시보드 통계 업데이트
                const adminTotalUsersEl = document.getElementById('adminTotalUsers');
                const adminPendingUsersEl = document.getElementById('adminPendingUsers');
                
                console.log('🎯 HTML 요소 찾기:', { 
                    adminTotalUsersEl: !!adminTotalUsersEl, 
                    adminPendingUsersEl: !!adminPendingUsersEl 
                });
                
                if (adminTotalUsersEl) {
                    adminTotalUsersEl.textContent = totalUsers;
                    console.log('✅ adminTotalUsers 업데이트:', totalUsers);
                } else {
                    console.warn('⚠️ adminTotalUsers 요소를 찾을 수 없습니다');
                }
                
                if (adminPendingUsersEl) {
                    adminPendingUsersEl.textContent = pendingUsers;
                    console.log('✅ adminPendingUsers 업데이트:', pendingUsers);
                } else {
                    console.warn('⚠️ adminPendingUsers 요소를 찾을 수 없습니다');
                }
                
                // 최근 가입 승인 요청 업데이트
                const adminRecentSignupsEl = document.getElementById('adminRecentSignups');
                if (adminRecentSignupsEl) {
                    const recentPendingUsers = data.users
                        .filter(user => user.status === 'pending')
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, 3);
                    
                    if (recentPendingUsers.length === 0) {
                        adminRecentSignupsEl.innerHTML = '<p class="text-gray-600">승인 대기 중인 회원이 없습니다.</p>';
                    } else {
                        adminRecentSignupsEl.innerHTML = recentPendingUsers.map(user => 
                            '<div class="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded">' +
                                '<div class="flex items-center space-x-2">' +
                                    '<i class="fas fa-user-clock text-yellow-600"></i>' +
                                    '<div>' +
                                        '<p class="text-sm font-medium text-gray-900">' + user.name + '</p>' +
                                        '<p class="text-xs text-gray-600">' + user.email + '</p>' +
                                        (user.team && user.part ? '<p class="text-xs text-blue-600">' + user.team + ' > ' + user.part + '</p>' : '') +
                                    '</div>' +
                                '</div>' +
                                '<div class="text-xs text-gray-500">' +
                                    new Date(user.createdAt).toLocaleDateString('ko-KR') +
                                '</div>' +
                            '</div>'
                        ).join('');
                    }
                }
                
                console.log('📈 대시보드 통계 업데이트 완료: 전체 ' + totalUsers + '명, 대기 ' + pendingUsers + '명');
            } catch (error) {
                console.error('대시보드 통계 업데이트 오류:', error);
            }
        };

        // 사용자 삭제
        window.deleteUser = async function(email) {
            if (!isAdmin()) {
                showToast('관리자 권한이 필요합니다.', 'error');
                return;
            }
            
            // 현재 로그인한 사용자 확인
            const currentUser = getCurrentUser();
            if (!currentUser) {
                showToast('로그인이 필요합니다.', 'error');
                return;
            }
            
            // 자기 자신 삭제 방지
            if (email === currentUser.email) {
                showToast('자기 자신은 삭제할 수 없습니다.', 'error');
                return;
            }
            
            // 삭제 확인
            const userToDelete = await getUserByEmail(email);
            if (!userToDelete) {
                showToast('사용자 정보를 찾을 수 없습니다.', 'error');
                return;
            }
            
            const confirmMessage = '정말로 "' + userToDelete.name + '" 사용자를 삭제하시겠습니까?\\n\\n⚠️ 주의사항:\\n- 사용자 계정이 영구 삭제됩니다\\n- 평가 데이터는 보존됩니다\\n- 이 작업은 되돌릴 수 없습니다';
            
            if (!confirm(confirmMessage)) {
                return;
            }
            
            try {
                const data = await apiCall('/api/users/' + encodeURIComponent(email), {
                    method: 'DELETE',
                    body: JSON.stringify({ deleterEmail: currentUser.email })
                });
                
                showToast(data.message, data.success ? 'success' : 'error');
                
                if (data.success) {
                    // 사용자 목록 새로고침
                    refreshAllUsers();
                    refreshPendingUsers();
                    updateDashboardStats();
                }
            } catch (error) {
                console.error('사용자 삭제 오류:', error);
                showToast('사용자 삭제 중 오류가 발생했습니다.', 'error');
            }
        };
        
        // 이메일로 사용자 정보 가져오기 (헬퍼 함수)
        async function getUserByEmail(email) {
            try {
                const data = await apiCall('/api/users');
                if (data.success) {
                    return data.users.find(user => user.email === email);
                }
                return null;
            } catch (error) {
                console.error('사용자 정보 가져오기 오류:', error);
                return null;
            }
        }
        
        console.log('✅ User Management 로드됨');
        </script>

        <!-- 🎯 Main App Logic - 메인 애플리케이션 -->
        <script>
        // 조직 폼 처리는 별도 초기화에서 처리

        console.log('✅ Main App Logic 로드됨');
        
        // 대시보드 초기화 및 통계 업데이트
        console.log('🚀 대시보드 초기화 시작...');
        console.log('🔍 updateDashboardStats 함수 존재 여부:', typeof updateDashboardStats);
        
        // 페이지 로드 완료 후 관리자 대시보드 통계 업데이트 시도
        if (typeof updateDashboardStats === 'function') {
            console.log('⏱️ 2초 후 관리자 대시보드 통계 업데이트 시도...');
            setTimeout(() => {
                // 현재 사용자가 관리자이고 대시보드 요소가 있는지 확인
                const user = getCurrentUser();
                const adminPendingEl = document.getElementById('adminPendingUsers');
                
                console.log('👤 현재 사용자:', user);
                console.log('🎯 관리자 대시보드 요소 존재:', !!adminPendingEl);
                
                if (user && user.role === 'admin' && adminPendingEl) {
                    console.log('🎯 관리자 대시보드 자동 업데이트 실행!');
                    updateDashboardStats();
                    console.log('📈 대시보드 초기 통계 로드 완료');
                } else {
                    console.log('ℹ️ 관리자가 아니거나 대시보드 요소가 없음');
                }
            }, 2000);
        } else {
            console.error('❌ updateDashboardStats 함수를 찾을 수 없습니다!');
        }
        
        // 새로운 평가 시스템 UI/UX 관리 함수들
        let quantitativeItems = {};
        let qualitativeItems = {};
        let evaluationTargets = {};
        let currentWizardStep = 1;
        let selectedEvaluationType = null;
        let currentWizardData = {};

        // 탭 전환 함수
        function switchEvaluationTab(tabName) {
            try {
                console.log('🔄 평가 탭 전환:', tabName);
                
                // 모든 탭 버튼 초기화
                document.querySelectorAll('[id^="tab-"]').forEach(tab => {
                    if (tab) {
                        tab.className = tab.className.replace(/bg-blue-\d+|text-blue-\d+|border-blue-\d+/, 'text-gray-500');
                        tab.classList.add('hover:text-gray-700', 'hover:bg-gray-50');
                        tab.classList.remove('border-b-2');
                    }
                });
                
                // 활성 탭 스타일 적용
                const activeTab = document.getElementById(\`tab-\${tabName}\`);
                if (activeTab) {
                    activeTab.className = 'flex-1 px-6 py-4 text-center font-medium text-blue-600 bg-blue-50 border-b-2 border-blue-500';
                }
                
                // 모든 탭 컨텐츠 숨기기
                document.querySelectorAll('.evaluation-tab-content').forEach(content => {
                    if (content) content.classList.add('hidden');
                });
                
                // 선택된 탭 컨텐츠 보이기
                const targetContent = document.getElementById(\`evaluation-\${tabName}\`);
                if (targetContent) {
                    targetContent.classList.remove('hidden');
                }
                
                // 탭별 초기 로드
                if (tabName === 'dashboard') {
                    updateDashboardStats();
                } else if (tabName === 'items') {
                    loadEvaluationItemsGrid();
                } else if (tabName === 'assignment') {
                    loadAssignmentInterface();
                }
                
                console.log('✅ 평가 탭 전환 완료:', tabName);
            } catch (error) {
                console.error('❌ 평가 탭 전환 오류:', error);
            }
        }

        // 대시보드 통계 업데이트
        async function updateDashboardStats() {
            try {
                console.log('🔄 평가 대시보드 통계 업데이트 시작...');
                
                // 새 API에서 통계 데이터 가져오기
                const response = await fetch('/api/evaluation-items/stats');
                const result = await response.json();
                
                if (result.success) {
                    const stats = result.stats;
                    console.log('📊 평가 통계 데이터:', stats);
                    
                    // 정량평가 통계 업데이트
                    const quantEl = document.getElementById('quantitativeCount');
                    const quantPointsEl = document.getElementById('quantitativePoints');
                    if (quantEl) quantEl.textContent = stats.byType.quantitative;
                    if (quantPointsEl) quantPointsEl.textContent = stats.totalPoints + '점';
                    
                    // 정성평가 통계 업데이트
                    const qualEl = document.getElementById('qualitativeCount');
                    if (qualEl) qualEl.textContent = stats.byType.qualitative;
                    
                    // 전체 통계 업데이트
                    const totalEl = document.getElementById('totalEvaluationItems');
                    if (totalEl) totalEl.textContent = stats.total;
                    
                    // 배정 통계는 기존 유지 (나중에 개발 예정)
                    const assignEl = document.getElementById('assignmentCount');
                    if (assignEl) assignEl.textContent = '0'; // TODO: 배정 API 연동
                    
                    console.log('✅ 평가 대시보드 통계 업데이트 완료');
                } else {
                    console.error('❌ 평가 통계 조회 실패:', result.message);
                    // 기본값으로 설정
                    const quantEl = document.getElementById('quantitativeCount');
                    const qualEl = document.getElementById('qualitativeCount');
                    const quantPointsEl = document.getElementById('quantitativePoints');
                    if (quantEl) quantEl.textContent = '0';
                    if (qualEl) qualEl.textContent = '0';
                    if (quantPointsEl) quantPointsEl.textContent = '0점';
                }
            } catch (error) {
                console.error('❌ 평가 대시보드 통계 업데이트 오류:', error);
                // 기본값으로 설정
                const quantEl = document.getElementById('quantitativeCount');
                const qualEl = document.getElementById('qualitativeCount');
                const quantPointsEl = document.getElementById('quantitativePoints');
                if (quantEl) quantEl.textContent = '0';
                if (qualEl) qualEl.textContent = '0';
                if (quantPointsEl) quantPointsEl.textContent = '0점';
            }
        }

        // 주기 라벨 변환 함수
        function getPeriodLabel(period) {
            const labels = {
                'monthly': '월별',
                'quarterly': '분기별',
                'semi-annual': '반기별',
                'annual': '연간'
            };
            return labels[period] || period;
        }

        // 적용 범위 라벨 변환 함수
        function getScopeLabel(scope) {
            const labels = {
                'individual': '개인',
                'part': '파트',
                'team': '팀',
                'department': '본부'
            };
            return labels[scope] || scope;
        }

        // 평가 항목 그리드 로드
        function loadEvaluationItemsGrid() {
            loadQuantitativeGrid();
            loadQualitativeGrid();
        }

        async function loadQuantitativeGrid() {
            try {
                const container = document.getElementById('quantitativeItemsGrid');
                if (!container) {
                    console.log('⚠️ quantitativeItemsGrid 요소를 찾을 수 없음');
                    return;
                }
                
                // 로딩 상태 표시
                container.innerHTML = \`
                    <div class="text-center py-8">
                        <i class="fas fa-spinner fa-spin text-2xl text-gray-400 mb-2"></i>
                        <p class="text-gray-500">정량평가 항목을 불러오는 중...</p>
                    </div>
                \`;
                
                // API에서 데이터 가져오기
                const response = await fetch('/api/evaluation-items');
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || '데이터를 불러올 수 없습니다.');
                }
                
                // 정량평가 항목만 필터링
                const quantitativeItems = data.items.filter(item => item.type === 'quantitative');
                
                if (quantitativeItems.length === 0) {
                    container.innerHTML = \`
                        <div class="text-center py-8">
                            <i class="fas fa-chart-bar text-4xl text-gray-300 mb-4"></i>
                            <p class="text-gray-500 mb-4">등록된 정량평가 항목이 없습니다</p>
                            <button onclick="quickAddQuantitativeItem()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <i class="fas fa-plus mr-2"></i>첫 항목 추가하기
                            </button>
                        </div>
                    \`;
                    return;
                }
                
                const items = quantitativeItems;
            
                container.innerHTML = items.map(item => \`
                    <div class="evaluation-item-card bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <div class="flex items-center space-x-2 mb-2">
                                    <h5 class="font-semibold text-gray-900">\${item.name}</h5>
                                    <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">배점: \${item.points}점</span>
                                    <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">\${getPeriodLabel(item.period)}</span>
                                </div>
                                <p class="text-sm text-gray-600 mb-2">\${item.description}</p>
                                <div class="text-xs text-gray-500">
                                    <div class="mb-1"><strong>직장 가이드:</strong> \${item.guide}</div>
                                    <div><strong>점수 기준:</strong> \${item.scoreStandard}</div>
                                </div>
                            </div>
                            <div class="flex items-center space-x-1 ml-3">
                                <button onclick="editEvaluationItem('\${item.id}')" 
                                        class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                        title="편집">
                                    <i class="fas fa-edit text-sm"></i>
                                </button>
                                <button onclick="duplicateEvaluationItem('\${item.id}')" 
                                        class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                                        title="복사">
                                    <i class="fas fa-copy text-sm"></i>
                                </button>
                                <button onclick="deleteEvaluationItem('\${item.id}')" 
                                        class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                        title="삭제">
                                    <i class="fas fa-trash text-sm"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                \`).join('');
                
            } catch (error) {
                console.error('❌ 정량평가 항목 로드 실패:', error);
                const container = document.getElementById('quantitativeItemsGrid');
                if (container) {
                    container.innerHTML = \`
                        <div class="text-center py-8">
                            <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-4"></i>
                            <p class="text-red-500 mb-4">항목을 불러오는데 실패했습니다</p>
                            <button onclick="loadQuantitativeGrid()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                <i class="fas fa-redo mr-2"></i>다시 시도
                            </button>
                        </div>
                    \`;
                }
            }
        }

        async function loadQualitativeGrid() {
            try {
                const container = document.getElementById('qualitativeItemsGrid');
                if (!container) {
                    console.log('⚠️ qualitativeItemsGrid 요소를 찾을 수 없음');
                    return;
                }
                
                // 로딩 상태 표시
                container.innerHTML = \`
                    <div class="text-center py-8">
                        <i class="fas fa-spinner fa-spin text-2xl text-gray-400 mb-2"></i>
                        <p class="text-gray-500">정성평가 항목을 불러오는 중...</p>
                    </div>
                \`;
                
                // API에서 데이터 가져오기
                const response = await fetch('/api/evaluation-items');
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || '데이터를 불러올 수 없습니다.');
                }
                
                // 정성평가 항목만 필터링
                const qualitativeItems = data.items.filter(item => item.type === 'qualitative');
                
                if (qualitativeItems.length === 0) {
                    container.innerHTML = \`
                        <div class="text-center py-8">
                            <i class="fas fa-comments text-4xl text-gray-300 mb-4"></i>
                            <p class="text-gray-500 mb-4">등록된 정성평가 항목이 없습니다</p>
                            <button onclick="quickAddQualitativeItem()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                <i class="fas fa-plus mr-2"></i>첫 항목 추가하기
                            </button>
                        </div>
                    \`;
                    return;
                }
                
                container.innerHTML = qualitativeItems.map(item => \`
                    <div class="evaluation-item-card bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <div class="flex items-center space-x-2 mb-2">
                                    <h5 class="font-semibold text-gray-900">\${item.name}</h5>
                                    <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">배점: \${item.points}점</span>
                                    <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">\${getPeriodLabel(item.period)}</span>
                                </div>
                                <p class="text-sm text-gray-600 mb-2">\${item.description}</p>
                                <div class="text-xs text-gray-500">
                                    <div class="mb-1"><strong>직장 가이드:</strong> \${item.guide}</div>
                                    <div><strong>점수 기준:</strong> \${item.scoreStandard}</div>
                                </div>
                            </div>
                            <div class="flex items-center space-x-1 ml-3">
                                <button onclick="editEvaluationItem('\${item.id}')" 
                                        class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                        title="편집">
                                    <i class="fas fa-edit text-sm"></i>
                                </button>
                                <button onclick="duplicateEvaluationItem('\${item.id}')" 
                                        class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                                        title="복사">
                                    <i class="fas fa-copy text-sm"></i>
                                </button>
                                <button onclick="deleteEvaluationItem('\${item.id}')" 
                                        class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                        title="삭제">
                                    <i class="fas fa-trash text-sm"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                \`).join('');
                
            } catch (error) {
                console.error('❌ 정성평가 항목 로드 실패:', error);
                const container = document.getElementById('qualitativeItemsGrid');
                if (container) {
                    container.innerHTML = \`
                        <div class="text-center py-8">
                            <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-4"></i>
                            <p class="text-red-500 mb-4">항목을 불러오는데 실패했습니다</p>
                            <button onclick="loadQualitativeGrid()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                <i class="fas fa-redo mr-2"></i>다시 시도
                            </button>
                        </div>
                    \`;
                }
            }
        }

        // 평가 항목 등록 마법사
        function startEvaluationWizard(type) {
            selectedEvaluationType = type;
            currentWizardStep = 1;
            currentWizardData = { type: type };
            
            // 모달 표시
            document.getElementById('evaluationWizardModal').classList.remove('hidden');
            document.getElementById('evaluationWizardModal').classList.add('flex');
            
            // 첫 번째 단계로 초기화
            showWizardStep(1);
            
            // 유형에 따라 자동 선택
            if (type) {
                selectEvaluationType(type);
            }
        }

        function selectEvaluationType(type) {
            selectedEvaluationType = type;
            currentWizardData.type = type;
            
            // 카드 스타일 업데이트
            document.querySelectorAll('.evaluation-type-card').forEach(card => {
                card.classList.remove('border-blue-500', 'bg-blue-50', 'border-green-500', 'bg-green-50');
                card.classList.add('border-gray-200');
            });
            
            const selectedCard = document.querySelector(\`button[onclick="selectEvaluationType('\${type}')"]\`);
            if (type === 'quantitative') {
                selectedCard.classList.add('border-blue-500', 'bg-blue-50');
            } else {
                selectedCard.classList.add('border-green-500', 'bg-green-50');
            }
            
            // 다음 버튼 활성화
            document.getElementById('wizardNextBtn').disabled = false;
        }

        function showWizardStep(step) {
            // 모든 단계 숨기기
            document.querySelectorAll('.wizard-step').forEach(stepEl => {
                stepEl.classList.add('hidden');
            });
            
            // 현재 단계 보이기
            document.getElementById(\`wizard-step-\${step}\`).classList.remove('hidden');
            
            // 진행 표시기 업데이트
            updateWizardProgress(step);
            
            // 버튼 상태 업데이트
            document.getElementById('wizardPrevBtn').disabled = step === 1;
            
            const nextBtn = document.getElementById('wizardNextBtn');
            if (step === 4) {
                nextBtn.textContent = '저장';
                nextBtn.onclick = saveWizardData;
            } else {
                nextBtn.innerHTML = '다음 <i class="fas fa-arrow-right ml-2"></i>';
                nextBtn.onclick = nextWizardStep;
            }
            
            currentWizardStep = step;
        }

        function updateWizardProgress(step) {
            for (let i = 1; i <= 4; i++) {
                const indicator = document.getElementById(\`step\${i}-indicator\`);
                if (i <= step) {
                    indicator.classList.add('bg-white', 'text-indigo-600');
                    indicator.classList.remove('bg-opacity-30');
                } else {
                    indicator.classList.remove('bg-white', 'text-indigo-600');
                    indicator.classList.add('bg-opacity-30');
                }
            }
        }

        function nextWizardStep() {
            if (validateWizardStep(currentWizardStep)) {
                if (currentWizardStep === 3) {
                    generateWizardSummary();
                }
                showWizardStep(currentWizardStep + 1);
            }
        }

        function previousWizardStep() {
            if (currentWizardStep > 1) {
                showWizardStep(currentWizardStep - 1);
            }
        }

        function validateWizardStep(step) {
            switch(step) {
                case 1:
                    return selectedEvaluationType !== null;
                case 2:
                    const name = document.getElementById('wizardItemName').value.trim();
                    const desc = document.getElementById('wizardItemDescription').value.trim();
                    if (!name || !desc) {
                        alert('항목명과 설명을 모두 입력해주세요.');
                        return false;
                    }
                    currentWizardData.name = name;
                    currentWizardData.description = desc;
                    return true;
                case 3:
                    if (selectedEvaluationType === 'quantitative') {
                        const weight = document.getElementById('wizardWeightSlider').value;
                        const unit = document.getElementById('wizardUnit').value;
                        currentWizardData.weight = parseInt(weight);
                        currentWizardData.unit = unit;
                        
                        // 3단계에서 상세 설정 표시
                        document.getElementById('quantitative-settings').classList.remove('hidden');
                        document.getElementById('qualitative-settings').classList.add('hidden');
                    } else {
                        const scale = document.querySelector('input[name="scale"]:checked').value;
                        currentWizardData.scale = scale;
                        
                        // 3단계에서 상세 설정 표시
                        document.getElementById('qualitative-settings').classList.remove('hidden');
                        document.getElementById('quantitative-settings').classList.add('hidden');
                    }
                    return true;
                default:
                    return true;
            }
        }

        function generateWizardSummary() {
            const container = document.getElementById('wizardSummary');
            let summaryHtml = \`
                <div class="space-y-4">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-\${selectedEvaluationType === 'quantitative' ? 'chart-bar text-blue-500' : 'comments text-green-500'} text-2xl"></i>
                        <div>
                            <h5 class="font-semibold text-lg">\${currentWizardData.name}</h5>
                            <p class="text-gray-600">\${selectedEvaluationType === 'quantitative' ? '정량평가' : '정성평가'} 항목</p>
                        </div>
                    </div>
                    
                    <div class="bg-white p-4 rounded-lg border">
                        <h6 class="font-medium text-gray-900 mb-2">설명</h6>
                        <p class="text-gray-700">\${currentWizardData.description}</p>
                    </div>
            \`;
            
            if (selectedEvaluationType === 'quantitative') {
                summaryHtml += \`
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-white p-4 rounded-lg border">
                            <h6 class="font-medium text-gray-900 mb-2">배점</h6>
                            <p class="text-2xl font-bold text-blue-600">\${currentWizardData.weight}%</p>
                        </div>
                        <div class="bg-white p-4 rounded-lg border">
                            <h6 class="font-medium text-gray-900 mb-2">측정 단위</h6>
                            <p class="text-gray-700">\${currentWizardData.unit}</p>
                        </div>
                    </div>
                \`;
            } else {
                summaryHtml += \`
                    <div class="bg-white p-4 rounded-lg border">
                        <h6 class="font-medium text-gray-900 mb-2">평가 척도</h6>
                        <p class="text-green-600 font-semibold">\${currentWizardData.scale}</p>
                    </div>
                \`;
            }
            
            summaryHtml += '</div>';
            container.innerHTML = summaryHtml;
        }

        function saveWizardData() {
            const itemId = 'item_' + Date.now();
            
            if (selectedEvaluationType === 'quantitative') {
                quantitativeItems[itemId] = { ...currentWizardData, id: itemId };
            } else {
                qualitativeItems[itemId] = { ...currentWizardData, id: itemId };
            }
            
            closeEvaluationWizard();
            loadEvaluationItemsGrid();
            updateDashboardStats();
            showNotification(\`\${selectedEvaluationType === 'quantitative' ? '정량' : '정성'}평가 항목이 추가되었습니다.\`, 'success');
        }

        function closeEvaluationWizard() {
            document.getElementById('evaluationWizardModal').classList.add('hidden');
            document.getElementById('evaluationWizardModal').classList.remove('flex');
            
            // 초기화
            currentWizardStep = 1;
            selectedEvaluationType = null;
            currentWizardData = {};
        }

        function updateWeightDisplay(value) {
            document.getElementById('wizardWeightDisplay').textContent = value + '%';
        }

        // 빠른 추가 기능들
        function quickAddQuantitativeItem() {
            // 🔍 디버깅: 새로운 함수가 호출되는지 확인
            alert('새로운 quickAddQuantitativeItem 함수 호출됨!');
            console.log('🚀 새로운 quickAddQuantitativeItem 함수 실행');
            
            // 타입 및 기본값 설정
            document.getElementById('quickAddType').value = 'quantitative';
            document.getElementById('quickAddItemId').value = '';
            
            // 헤더 업데이트
            document.getElementById('quickAddTitle').textContent = '정량평가 항목 빠른 추가';
            document.getElementById('quickAddSubtitle').textContent = '수치로 측정 가능한 평가 항목을 생성합니다';
            
            // 폼 초기화
            document.getElementById('quickAddName').value = '';
            document.getElementById('quickAddCategory').value = '';
            document.getElementById('quickAddDescription').value = '';
            document.getElementById('quickAddPoints').value = '30';
            document.getElementById('quickAddPeriod').value = 'monthly';
            document.getElementById('quickAddScope').value = 'individual';
            document.getElementById('quickAddGuide').value = '';
            document.getElementById('quickAddScoreStandard').value = '';
            
            // 프로그레스 바 초기화
            document.getElementById('quickAddProgressBar').style.width = '0%';
            
            // 필드 표시/숨김 설정
            document.getElementById('quickAddPointsSection').style.display = 'block';
            document.getElementById('quickAddScaleSection').classList.add('hidden');
            
            // 정량평가 기본 예시 설정
            document.getElementById('quickAddName').placeholder = '예: 월별 매출 달성률, KPI 달성도';
            document.getElementById('quickAddCategory').placeholder = '예: 매출 성과, 업무 효율성';
            document.getElementById('quickAddGuide').placeholder = '예: 월별 매출 목표 대비 달성률을 측정합니다. 계획 대비 100% 이상 달성 시 만점 처리';
            document.getElementById('quickAddScoreStandard').placeholder = '예: 30점: 110% 이상 달성\\n25점: 100-109% 달성\\n20점: 90-99% 달성\\n15점: 80-89% 달성\\n10점: 70-79% 달성\\n5점: 60-69% 달성\\n0점: 60% 미만';
            
            // 유효성 검사 피드백 초기화
            clearFormValidation();
            
            // 모달 표시 with 애니메이션
            const modal = document.getElementById('quickAddModal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // 애니메이션 트리거
            setTimeout(() => {
                modal.querySelector('.animate-slideUp').style.transform = 'translateY(0) scale(1)';
            }, 10);
            
            // 첫 번째 필드에 포커스
            setTimeout(() => {
                const nameField = document.getElementById('quickAddName');
                nameField.focus();
                // 포커스 애니메이션
                nameField.classList.add('ring-2', 'ring-blue-500');
                setTimeout(() => {
                    nameField.classList.remove('ring-2', 'ring-blue-500');
                }, 1000);
            }, 100);
        }

        function quickAddQualitativeItem() {
            // 타입 및 기본값 설정
            document.getElementById('quickAddType').value = 'qualitative';
            document.getElementById('quickAddItemId').value = '';
            
            // 헤더 업데이트
            document.getElementById('quickAddTitle').textContent = '정성평가 항목 빠른 추가';
            document.getElementById('quickAddSubtitle').textContent = '주관적 판단이 필요한 평가 항목을 생성합니다';
            
            // 폼 초기화
            document.getElementById('quickAddName').value = '';
            document.getElementById('quickAddCategory').value = '';
            document.getElementById('quickAddDescription').value = '';
            document.getElementById('quickAddPoints').value = '4';
            document.getElementById('quickAddPeriod').value = 'quarterly';
            document.getElementById('quickAddScope').value = 'individual';
            document.getElementById('quickAddGuide').value = '';
            document.getElementById('quickAddScoreStandard').value = '';
            document.getElementById('quickAddScale').value = '1-5';
            
            // 필드 표시/숨김 설정
            document.getElementById('quickAddPointsSection').style.display = 'block';
            document.getElementById('quickAddScaleSection').classList.remove('hidden');
            
            // 정성평가 기본 예시 설정
            document.getElementById('quickAddName').placeholder = '예: 리더십, 커뮤니케이션 능력';
            document.getElementById('quickAddCategory').placeholder = '예: 역량 평가, 태도 평가';
            document.getElementById('quickAddGuide').placeholder = '예: 팀원들을 효과적으로 이끌고 목표 달성을 위해 동기부여하는 능력을 평가합니다';
            document.getElementById('quickAddScoreStandard').placeholder = '예: 4점: 탁월함 (팀 성과 향상에 큰 기여)\\n3점: 우수함 (안정적인 팀 리더십)\\n2점: 보통 (기본적인 리더십 발휘)\\n1점: 미흡함 (리더십 개발 필요)';
            
            // 유효성 검사 피드백 초기화
            clearFormValidation();
            
            // 모달 표시 with 애니메이션
            const modal = document.getElementById('quickAddModal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // 애니메이션 트리거
            setTimeout(() => {
                modal.querySelector('.animate-slideUp').style.transform = 'translateY(0) scale(1)';
            }, 10);
            
            // 첫 번째 필드에 포커스
            setTimeout(() => {
                const nameField = document.getElementById('quickAddName');
                nameField.focus();
                // 포커스 애니메이션
                nameField.classList.add('ring-2', 'ring-blue-500');
                setTimeout(() => {
                    nameField.classList.remove('ring-2', 'ring-blue-500');
                }, 1000);
            }, 100);
        }

        async function quickEditItem(type, itemId) {
            try {
                // API에서 실제 데이터 가져오기
                const response = await fetch(\`/api/evaluation-items/\${itemId}\`);
                const result = await response.json();
                
                let item;
                if (result.success) {
                    item = result.item;
                } else {
                    console.warn('항목을 찾을 수 없어 기본값 사용');
                    item = {
                        name: '',
                        category: '',
                        description: '',
                        points: type === 'quantitative' ? 30 : 4,
                        period: type === 'quantitative' ? 'monthly' : 'quarterly',
                        scope: 'individual',
                        guide: '',
                        scoreStandard: ''
                    };
                }
                
                // 모달 폼 채우기
                document.getElementById('quickAddType').value = type;
                document.getElementById('quickAddItemId').value = itemId;
                document.getElementById('quickAddTitle').textContent = \`\${type === 'quantitative' ? '정량' : '정성'}평가 항목 편집\`;
                document.getElementById('quickAddName').value = item.name || '';
                document.getElementById('quickAddCategory').value = item.category || '';
                document.getElementById('quickAddDescription').value = item.description || '';
                document.getElementById('quickAddPoints').value = item.points || (type === 'quantitative' ? 30 : 4);
                document.getElementById('quickAddPeriod').value = item.period || (type === 'quantitative' ? 'monthly' : 'quarterly');
                document.getElementById('quickAddScope').value = item.scope || 'individual';
                document.getElementById('quickAddGuide').value = item.guide || '';
                document.getElementById('quickAddScoreStandard').value = item.scoreStandard || '';
                
                // 타입별 필드 표시/숨김
                if (type === 'quantitative') {
                    document.getElementById('quickAddPointsSection').style.display = 'block';
                    document.getElementById('quickAddScaleSection').style.display = 'none';
                } else {
                    document.getElementById('quickAddPointsSection').style.display = 'block';
                    document.getElementById('quickAddScaleSection').style.display = 'block';
                    document.getElementById('quickAddScale').value = item.scale || '1-5';
                }
                
                // 모달 표시
                document.getElementById('quickAddModal').classList.remove('hidden');
                document.getElementById('quickAddModal').classList.add('flex');
                
            } catch (error) {
                console.error('편집 데이터 로드 오류:', error);
                alert('항목 데이터를 불러오는 중 오류가 발생했습니다.');
            }
        }

        function duplicateItem(type, itemId) {
            const items = type === 'quantitative' ? quantitativeItems : qualitativeItems;
            const item = items[itemId] || getDefaultItem(type, itemId);
            
            const newItemId = 'item_' + Date.now();
            const newItem = { ...item, id: newItemId, name: item.name + ' (복사)' };
            
            if (type === 'quantitative') {
                quantitativeItems[newItemId] = newItem;
            } else {
                qualitativeItems[newItemId] = newItem;
            }
            
            loadEvaluationItemsGrid();
            updateDashboardStats();
            showNotification(\`\${item.name}이(가) 복사되었습니다.\`, 'success');
        }

        function deleteEvaluationItem(type, itemId) {
            const items = type === 'quantitative' ? quantitativeItems : qualitativeItems;
            const item = items[itemId] || getDefaultItem(type, itemId);
            
            if (confirm(\`정말로 '\${item.name}' 항목을 삭제하시겠습니까?\`)) {
                if (type === 'quantitative') {
                    delete quantitativeItems[itemId];
                } else {
                    delete qualitativeItems[itemId];
                }
                
                loadEvaluationItemsGrid();
                updateDashboardStats();
                showNotification(\`\${item.name}이(가) 삭제되었습니다.\`, 'success');
            }
        }

        function getDefaultItem(type, itemId) {
            if (type === 'quantitative') {
                return getDefaultQuantitativeItem(itemId);
            } else {
                return getDefaultQualitativeItem(itemId);
            }
        }

        function closeQuickAddModal() {
            const modal = document.getElementById('quickAddModal');
            // 페이드 아웃 애니메이션
            modal.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                modal.style.animation = '';
                clearFormValidation();
                // 프로그레스 바 초기화
                document.getElementById('quickAddProgressBar').style.width = '0%';
            }, 300);
        }
        
        // 🎯 실시간 프로그레스 업데이트 함수
        function updateFormProgress() {
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
                    if (checkIcon && !checkIcon.classList.contains('check-icon-appear')) {
                        checkIcon.classList.remove('hidden');
                        checkIcon.classList.add('check-icon-appear');
                    }
                } else {
                    // 체크 아이콘 숨김
                    const checkIcon = document.getElementById(fieldId + 'Check');
                    if (checkIcon) {
                        checkIcon.classList.add('hidden');
                        checkIcon.classList.remove('check-icon-appear');
                    }
                }
            });
            
            // 프로그레스 바 업데이트
            const progress = (filledCount / fields.length) * 100;
            const progressBar = document.getElementById('quickAddProgressBar');
            if (progressBar) {
                progressBar.style.width = progress + '%';
                if (progress === 100) {
                    progressBar.classList.add('progress-shimmer');
                } else {
                    progressBar.classList.remove('progress-shimmer');
                }
            }
            
            // 제출 버튼 상태 업데이트
            const submitBtn = document.getElementById('quickAddSubmitBtn');
            if (submitBtn) {
                if (progress === 100) {
                    submitBtn.classList.remove('opacity-75');
                    submitBtn.classList.add('hover:scale-105');
                } else {
                    submitBtn.classList.add('opacity-75');
                    submitBtn.classList.remove('hover:scale-105');
                }
            }
        }
        
        // 🎯 실시간 유효성 검사 및 피드백 함수들
        function clearFormValidation() {
            const fields = ['quickAddName', 'quickAddCategory', 'quickAddDescription', 'quickAddPoints', 'quickAddGuide', 'quickAddScoreStandard'];
            fields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                const feedback = document.getElementById(fieldId + 'Feedback');
                if (field) {
                    field.classList.remove('field-valid', 'field-invalid');
                }
                if (feedback) {
                    feedback.classList.add('hidden');
                    feedback.textContent = '';
                }
            });
        }
        
        function validateField(fieldId, value, rules = {}) {
            const field = document.getElementById(fieldId);
            const feedback = document.getElementById(fieldId + 'Feedback');
            
            if (!field) return true;
            
            let isValid = true;
            let message = '';
            
            // 필수 필드 검증
            if (rules.required && (!value || value.trim() === '')) {
                isValid = false;
                message = '필수 입력 항목입니다';
            }
            // 길이 검증
            else if (rules.minLength && value.length < rules.minLength) {
                isValid = false;
                message = \`최소 \${rules.minLength}자 이상 입력해주세요\`;
            }
            else if (rules.maxLength && value.length > rules.maxLength) {
                isValid = false;
                message = \`최대 \${rules.maxLength}자까지 입력 가능합니다\`;
            }
            // 숫자 범위 검증
            else if (rules.min && parseInt(value) < rules.min) {
                isValid = false;
                message = \`\${rules.min} 이상의 값을 입력해주세요\`;
            }
            else if (rules.max && parseInt(value) > rules.max) {
                isValid = false;
                message = \`\${rules.max} 이하의 값을 입력해주세요\`;
            }
            
            // UI 업데이트
            if (isValid && value.trim() !== '') {
                field.classList.remove('field-invalid');
                field.classList.add('field-valid');
                if (feedback) {
                    feedback.classList.add('hidden');
                }
            } else if (!isValid) {
                field.classList.remove('field-valid');
                field.classList.add('field-invalid');
                if (feedback) {
                    feedback.textContent = message;
                    feedback.classList.remove('hidden');
                    feedback.className = 'text-xs text-red-500 mt-1';
                }
            } else {
                field.classList.remove('field-valid', 'field-invalid');
                if (feedback) {
                    feedback.classList.add('hidden');
                }
            }
            
            return isValid;
        }
        
        function setupRealTimeValidation() {
            // 항목명 검증
            document.getElementById('quickAddName')?.addEventListener('input', function(e) {
                validateField('quickAddName', e.target.value, { required: true, minLength: 2, maxLength: 100 });
            });
            
            // 카테고리 검증
            document.getElementById('quickAddCategory')?.addEventListener('input', function(e) {
                validateField('quickAddCategory', e.target.value, { required: true, minLength: 2, maxLength: 50 });
            });
            
            // 설명 검증
            document.getElementById('quickAddDescription')?.addEventListener('input', function(e) {
                validateField('quickAddDescription', e.target.value, { required: true, minLength: 10, maxLength: 500 });
            });
            
            // 배점 검증
            document.getElementById('quickAddPoints')?.addEventListener('input', function(e) {
                validateField('quickAddPoints', e.target.value, { required: true, min: 1, max: 100 });
            });
            
            // 가이드 검증
            document.getElementById('quickAddGuide')?.addEventListener('input', function(e) {
                validateField('quickAddGuide', e.target.value, { required: true, minLength: 10, maxLength: 500 });
            });
            
            // 점수 기준 검증
            document.getElementById('quickAddScoreStandard')?.addEventListener('input', function(e) {
                validateField('quickAddScoreStandard', e.target.value, { required: true, minLength: 20, maxLength: 1000 });
            });
        }
        
        function validateForm() {
            const validations = [
                validateField('quickAddName', document.getElementById('quickAddName').value, { required: true, minLength: 2, maxLength: 100 }),
                validateField('quickAddCategory', document.getElementById('quickAddCategory').value, { required: true, minLength: 2, maxLength: 50 }),
                validateField('quickAddDescription', document.getElementById('quickAddDescription').value, { required: true, minLength: 10, maxLength: 500 }),
                validateField('quickAddPoints', document.getElementById('quickAddPoints').value, { required: true, min: 1, max: 100 }),
                validateField('quickAddGuide', document.getElementById('quickAddGuide').value, { required: true, minLength: 10, maxLength: 500 }),
                validateField('quickAddScoreStandard', document.getElementById('quickAddScoreStandard').value, { required: true, minLength: 20, maxLength: 1000 })
            ];
            
            return validations.every(v => v === true);
        }

        // 🚀 향상된 빠른 추가 폼 제출 (새 API 연동 + 유효성 검사)
        document.getElementById('quickAddForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // 유효성 검사 먼저 수행
            if (!validateForm()) {
                showNotification('입력값을 확인해주세요. 빨간색으로 표시된 필드를 수정해주세요.', 'error');
                return;
            }
            
            const submitButton = document.getElementById('quickAddSubmitBtn');
            const originalButtonText = submitButton.innerHTML;
            
            try {
                // 🔄 로딩 상태 표시
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>저장하는 중...';
                submitButton.disabled = true;
                submitButton.classList.add('opacity-75');
                
                // 📝 폼 데이터 수집
                const type = document.getElementById('quickAddType').value;
                const name = document.getElementById('quickAddName').value.trim();
                const category = document.getElementById('quickAddCategory').value.trim();
                const description = document.getElementById('quickAddDescription').value.trim();
                const points = parseInt(document.getElementById('quickAddPoints').value);
                const period = document.getElementById('quickAddPeriod').value;
                const scope = document.getElementById('quickAddScope').value;
                const guide = document.getElementById('quickAddGuide').value.trim();
                const scoreStandard = document.getElementById('quickAddScoreStandard').value.trim();
                
                // 📊 API 요청 데이터 구성
                const requestData = {
                    name,
                    type,
                    category,
                    points,
                    guide,
                    scoreStandard,
                    period,
                    scope,
                    description,
                    createdBy: currentUser?.name || 'System'
                };
                
                console.log('📤 평가 항목 생성 요청:', requestData);
                
                // 🌐 API 호출
                const response = await fetch('/api/evaluation-items', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    console.log('✅ 평가 항목 생성 성공:', result.item);
                    
                    // ✨ 성공 애니메이션
                    submitButton.innerHTML = '<i class="fas fa-check mr-2"></i>저장 완료!';
                    submitButton.classList.add('bg-green-500');
                    
                    // 📊 UI 업데이트
                    setTimeout(async () => {
                        closeQuickAddModal();
                        
                        // 관련 그리드 새로고침
                        if (type === 'quantitative') {
                            await loadQuantitativeGrid();
                        } else {
                            await loadQualitativeGrid();
                        }
                        
                        // 대시보드 통계 업데이트
                        await updateDashboardStats();
                        
                        // 성공 알림
                        showNotification(
                            \`🎉 \${name} 항목이 성공적으로 추가되었습니다!\`, 
                            'success'
                        );
                    }, 800);
                    
                } else {
                    console.error('❌ 평가 항목 생성 실패:', result.message);
                    showNotification(
                        \`저장 실패: \${result.message || '알 수 없는 오류가 발생했습니다.'}\`, 
                        'error'
                    );
                }
                
            } catch (error) {
                console.error('❌ 평가 항목 생성 중 오류:', error);
                showNotification(
                    '저장 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.', 
                    'error'
                );
            } finally {
                // 버튼 상태 복원 (성공 시 지연)
                if (!result?.success) {
                    setTimeout(() => {
                        submitButton.innerHTML = originalButtonText;
                        submitButton.disabled = false;
                        submitButton.classList.remove('opacity-75', 'bg-green-500');
                    }, 100);
                }
            }
        });

        // 기존 함수들 (호환성을 위해 유지)
        function addQuantitativeItem() {
            startEvaluationWizard('quantitative');
        }

        // 기존 함수들 (새로운 UI와 호환)
        function addQualitativeItem() {
            startEvaluationWizard('qualitative');
        }

        function editQuantitativeItem(itemId) {
            quickEditItem('quantitative', itemId);
        }

        function editQualitativeItem(itemId) {
            quickEditItem('qualitative', itemId);
        }

        function deleteQuantitativeItem(itemId) {
            deleteEvaluationItem('quantitative', itemId);
        }

        function deleteQualitativeItem(itemId) {
            deleteEvaluationItem('qualitative', itemId);
        }

        // 평가 대상 관리 (기존 호환)
        function showEvaluationTargetModal() {
            switchEvaluationTab('assignment');
        }

        function editEvaluationTarget(targetId) {
            switchEvaluationTab('assignment');
            setTimeout(() => selectOrganization(targetId), 100);
        }

        // 배정 저장
        function saveAssignments() {
            // 현재 배정된 항목들 수집
            const assignments = {};
            
            document.querySelectorAll('[id^="assigned-items-"]').forEach(container => {
                const orgId = container.id.replace('assigned-items-', '');
                const items = Array.from(container.querySelectorAll('[data-assigned-item]')).map(el => 
                    el.dataset.assignedItem
                );
                
                if (items.length > 0) {
                    assignments[orgId] = items;
                }
            });
            
            // 저장 로직
            evaluationTargets = { ...evaluationTargets, ...assignments };
            
            showNotification('평가 배정이 저장되었습니다.', 'success');
            console.log('저장된 배정:', assignments);
        }

        function closeAssignmentModal() {
            // 현재는 탭 방식이므로 별도 처리 불필요
        }

        // 기본값 가져오기 함수들
        function getDefaultQuantitativeItem(itemId) {
            const defaults = {
                'goal_achievement': { name: '목표 달성률', description: '개인 목표 대비 달성 비율 (%)', weight: 40 },
                'kpi_performance': { name: 'KPI 성과', description: '핵심성과지표 달성도 (1-5점)', weight: 35 },
                'project_contribution': { name: '프로젝트 기여도', description: '프로젝트 성공도 및 기여 수준', weight: 25 }
            };
            return defaults[itemId] || { name: '', description: '', weight: 0 };
        }

        function getDefaultQualitativeItem(itemId) {
            const defaults = {
                'leadership': { name: '리더십', description: '팀을 이끄는 능력과 영향력', scale: '1-5' },
                'communication': { name: '의사소통', description: '명확하고 효과적인 커뮤니케이션', scale: '1-5' },
                'expertise': { name: '전문성', description: '직무 관련 지식과 기술 수준', scale: '1-5' },
                'collaboration': { name: '협업 능력', description: '팀워크와 상호 협력 정도', scale: '1-5' }
            };
            return defaults[itemId] || { name: '', description: '', scale: '1-5' };
        }

        // 폼 제출 처리
        document.getElementById('quantitativeForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const itemId = document.getElementById('quantitativeItemId').value || 'item_' + Date.now();
            const name = document.getElementById('quantitativeItemName').value;
            const description = document.getElementById('quantitativeItemDescription').value;
            const weight = document.getElementById('quantitativeItemWeight').value;

            if (!name || !description || !weight) {
                alert('모든 필드를 입력해주세요.');
                return;
            }

            quantitativeItems[itemId] = { name, description, weight };
            updateQuantitativeItemDisplay(itemId, name, description, weight);
            closeQuantitativeModal();
            showNotification('정량평가 항목이 저장되었습니다.', 'success');
        });

        document.getElementById('qualitativeForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const itemId = document.getElementById('qualitativeItemId').value || 'item_' + Date.now();
            const name = document.getElementById('qualitativeItemName').value;
            const description = document.getElementById('qualitativeItemDescription').value;
            const scale = document.getElementById('qualitativeItemScale').value;

            if (!name || !description) {
                alert('모든 필드를 입력해주세요.');
                return;
            }

            qualitativeItems[itemId] = { name, description, scale };
            updateQualitativeItemDisplay(itemId, name, description, scale);
            closeQualitativeModal();
            showNotification('정성평가 항목이 저장되었습니다.', 'success');
        });

        document.getElementById('evaluationTargetForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const organization = document.getElementById('targetOrganization').value;
            const cycle = document.getElementById('targetCycle').value;
            const specialItems = document.getElementById('targetSpecialItems').value;

            if (!organization) {
                alert('조직을 선택해주세요.');
                return;
            }

            evaluationTargets[organization] = { cycle, specialItems };
            updateEvaluationTargetDisplay(organization, cycle, specialItems);
            closeEvaluationTargetModal();
            showNotification('평가 대상이 설정되었습니다.', 'success');
        });

        // 화면 업데이트 함수들
        function updateQuantitativeItemDisplay(itemId, name, description, weight) {
            let element = document.querySelector(\`[data-item-id="\${itemId}"]\`);
            
            if (!element) {
                // 새 항목 생성
                element = document.createElement('div');
                element.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
                element.setAttribute('data-item-id', itemId);
                document.getElementById('quantitativeItems').appendChild(element);
            }
            
            element.innerHTML = \`
                <div>
                    <span class="font-medium">\${name}</span>
                    <p class="text-sm text-gray-600">\${description}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500">배점: \${points}점</span>
                    <button onclick="editQuantitativeItem('\${itemId}')" class="text-blue-600 hover:text-blue-800">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteQuantitativeItem('\${itemId}')" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            \`;
        }

        function updateQualitativeItemDisplay(itemId, name, description, scale) {
            let element = document.querySelector(\`[data-item-id="\${itemId}"]\`);
            
            if (!element) {
                // 새 항목 생성
                element = document.createElement('div');
                element.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
                element.setAttribute('data-item-id', itemId);
                document.getElementById('qualitativeItems').appendChild(element);
            }
            
            element.innerHTML = \`
                <div>
                    <span class="font-medium">\${name}</span>
                    <p class="text-sm text-gray-600">\${description}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500">\${scale}</span>
                    <button onclick="editQualitativeItem('\${itemId}')" class="text-blue-600 hover:text-blue-800">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteQualitativeItem('\${itemId}')" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            \`;
        }

        function updateEvaluationTargetDisplay(organization, cycle, specialItems) {
            console.log('평가 대상 업데이트:', organization, cycle, specialItems);
            showNotification(\`\${organization} 평가 설정이 업데이트되었습니다.\`, 'info');
        }

        // Sales팀 목표 데이터 로드
        async function loadSalesTargets() {
            try {
                const response = await fetch('/api/evaluation/sales-targets');
                const data = await response.json();
                
                if (data.success) {
                    displaySalesTargets(data.salesTargets);
                } else {
                    console.error('Sales 목표 로드 실패:', data.message);
                }
            } catch (error) {
                console.error('Sales 목표 로드 오류:', error);
                const container = document.getElementById('salesTargetsContainer');
                container.innerHTML = \`
                    <div class="text-center py-8 text-red-500">
                        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                        <p>목표 데이터 로드에 실패했습니다.</p>
                    </div>
                \`;
            }
        }

        // Sales팀 목표 데이터 화면 표시
        function displaySalesTargets(salesTargets) {
            const container = document.getElementById('salesTargetsContainer');
            
            // 팀 전체 목표 요약
            const teamSummary = \`
                <div class="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200 mb-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-semibold text-orange-900">\${salesTargets.team} \${salesTargets.period}</h4>
                            <p class="text-orange-700">팀 전체 목표매출: <span class="font-bold">\${salesTargets.totalTarget.toLocaleString()}천원</span></p>
                        </div>
                        <i class="fas fa-trophy text-orange-500 text-2xl"></i>
                    </div>
                </div>
            \`;

            // 개별 구성원 목표
            const membersHtml = salesTargets.members.map(member => {
                const months = ['july', 'august', 'september', 'october', 'november', 'december'];
                const monthNames = ['7월', '8월', '9월', '10월', '11월', '12월'];
                
                // 각 카테고리별 총합 계산
                const totalGeneral = months.reduce((sum, month) => sum + (member.targets.general_saas[month] || 0), 0);
                const totalPublic = months.reduce((sum, month) => sum + (member.targets.public_saas[month] || 0), 0);
                const totalContracts = months.reduce((sum, month) => sum + (member.targets.new_contracts[month] || 0), 0);
                const totalRevenue = totalGeneral + totalPublic;
                
                return \`
                    <div class="bg-gray-50 p-4 rounded-lg border">
                        <div class="flex items-center justify-between mb-3">
                            <h5 class="font-semibold text-gray-900">\${member.name}</h5>
                            <div class="text-sm text-gray-600">
                                총 매출목표: <span class="font-semibold text-blue-600">\${totalRevenue.toLocaleString()}천원</span> | 
                                총 계약목표: <span class="font-semibold text-green-600">\${totalContracts}건</span>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            <!-- 일반 SaaS -->
                            <div class="bg-white p-3 rounded border">
                                <h6 class="font-medium text-blue-700 mb-2">
                                    <i class="fas fa-desktop mr-1"></i>일반 SaaS (\${totalGeneral.toLocaleString()}천원)
                                </h6>
                                <div class="space-y-1 text-sm">
                                    \${months.map((month, i) => 
                                        \`<div class="flex justify-between">
                                            <span>\${monthNames[i]}</span>
                                            <span class="font-medium">\${(member.targets.general_saas[month] || 0).toLocaleString()}천원</span>
                                        </div>\`
                                    ).join('')}
                                </div>
                            </div>
                            
                            <!-- 공공 SaaS -->
                            <div class="bg-white p-3 rounded border">
                                <h6 class="font-medium text-green-700 mb-2">
                                    <i class="fas fa-building mr-1"></i>공공 SaaS (\${totalPublic.toLocaleString()}천원)
                                </h6>
                                <div class="space-y-1 text-sm">
                                    \${months.map((month, i) => 
                                        \`<div class="flex justify-between">
                                            <span>\${monthNames[i]}</span>
                                            <span class="font-medium">\${(member.targets.public_saas[month] || 0).toLocaleString()}천원</span>
                                        </div>\`
                                    ).join('')}
                                </div>
                            </div>
                            
                            <!-- 신규 계약건수 -->
                            <div class="bg-white p-3 rounded border">
                                <h6 class="font-medium text-purple-700 mb-2">
                                    <i class="fas fa-handshake mr-1"></i>신규 계약건수 (\${totalContracts}건)
                                </h6>
                                <div class="space-y-1 text-sm">
                                    \${months.map((month, i) => 
                                        \`<div class="flex justify-between">
                                            <span>\${monthNames[i]}</span>
                                            <span class="font-medium">\${member.targets.new_contracts[month] || 0}건</span>
                                        </div>\`
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');

            container.innerHTML = teamSummary + membersHtml;
        }

        // 평가 배정 인터페이스
        function loadAssignmentInterface() {
            loadOrganizationTree();
            loadAssignmentItemPool();
            loadAssignmentResults();
        }

        function loadOrganizationTree() {
            const container = document.getElementById('organizationTree');
            const organizations = [
                { id: 'sales_team', name: 'Sales팀', icon: 'fas fa-users', color: 'blue' },
                { id: 'cx_team', name: 'CX팀', icon: 'fas fa-headset', color: 'green' },
                { id: 'sales_part', name: 'Sales 파트', icon: 'fas fa-user-tie', color: 'indigo' },
                { id: 'cx_part', name: 'CX 파트', icon: 'fas fa-user-friends', color: 'purple' }
            ];

            container.innerHTML = organizations.map(org => \`
                <button onclick="selectOrganization('\${org.id}')" 
                        class="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-\${org.color}-50 hover:border-\${org.color}-300 transition-colors"
                        data-org-id="\${org.id}">
                    <div class="flex items-center space-x-3">
                        <i class="\${org.icon} text-\${org.color}-600"></i>
                        <span class="font-medium text-gray-900">\${org.name}</span>
                    </div>
                </button>
            \`).join('');
        }

        function loadAssignmentItemPool() {
            const container = document.getElementById('assignmentItemPool');
            
            const quantItems = Object.keys(quantitativeItems).length > 0 ? 
                Object.values(quantitativeItems) : [
                    { id: 'goal_achievement', name: '목표 달성률', type: 'quantitative' },
                    { id: 'kpi_performance', name: 'KPI 성과', type: 'quantitative' },
                    { id: 'project_contribution', name: '프로젝트 기여도', type: 'quantitative' }
                ];

            const qualItems = Object.keys(qualitativeItems).length > 0 ? 
                Object.values(qualitativeItems) : [
                    { id: 'leadership', name: '리더십', type: 'qualitative' },
                    { id: 'communication', name: '의사소통', type: 'qualitative' },
                    { id: 'expertise', name: '전문성', type: 'qualitative' },
                    { id: 'collaboration', name: '협업 능력', type: 'qualitative' }
                ];

            const allItems = [
                { title: '정량평가', items: quantItems, color: 'blue' },
                { title: '정성평가', items: qualItems, color: 'green' }
            ];

            container.innerHTML = allItems.map(category => \`
                <div class="mb-4">
                    <h5 class="font-medium text-\${category.color}-900 mb-2">\${category.title}</h5>
                    <div class="space-y-1">
                        \${category.items.map(item => \`
                            <div class="assignment-item p-2 bg-white rounded border border-gray-200 cursor-move hover:shadow-sm transition-shadow"
                                 draggable="true" 
                                 data-item-id="\${item.id}" 
                                 data-item-type="\${item.type || category.title === '정량평가' ? 'quantitative' : 'qualitative'}"
                                 ondragstart="handleDragStart(event)">
                                <div class="flex items-center space-x-2">
                                    <i class="fas fa-grip-lines text-gray-400"></i>
                                    <span class="text-sm font-medium text-gray-900">\${item.name}</span>
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                </div>
            \`).join('');
        }

        function selectOrganization(orgId) {
            // 기존 선택 해제
            document.querySelectorAll('[data-org-id]').forEach(btn => {
                btn.classList.remove('bg-blue-100', 'border-blue-500');
            });
            
            // 새 선택 적용
            const selectedBtn = document.querySelector(\`[data-org-id="\${orgId}"]\`);
            selectedBtn.classList.add('bg-blue-100', 'border-blue-500');
            
            // 드롭 존 업데이트
            updateAssignmentDropZone(orgId);
        }

        function updateAssignmentDropZone(orgId) {
            const dropZone = document.getElementById('assignmentDropZone');
            const orgNames = {
                'sales_team': 'Sales팀',
                'cx_team': 'CX팀', 
                'sales_part': 'Sales 파트',
                'cx_part': 'CX 파트'
            };
            
            dropZone.innerHTML = \`
                <div class="text-center py-8">
                    <i class="fas fa-arrow-down text-3xl text-blue-400 mb-3"></i>
                    <h4 class="font-semibold text-gray-900 mb-2">\${orgNames[orgId]}</h4>
                    <p class="text-gray-600 text-sm mb-4">평가 항목을 여기로 드래그하세요</p>
                    <div id="assigned-items-\${orgId}" class="space-y-2">
                        <!-- 배정된 항목들이 여기에 표시됨 -->
                    </div>
                </div>
            \`;
            
            // 드롭 이벤트 설정
            dropZone.ondragover = (e) => { 
                e.preventDefault(); 
                dropZone.classList.add('bg-blue-50', 'border-blue-300');
            };
            dropZone.ondragleave = (e) => {
                dropZone.classList.remove('bg-blue-50', 'border-blue-300');
            };
            dropZone.ondrop = (e) => {
                e.preventDefault();
                handleDrop(e, orgId);
                dropZone.classList.remove('bg-blue-50', 'border-blue-300');
            };
        }

        function handleDragStart(e) {
            const itemId = e.target.dataset.itemId;
            const itemType = e.target.dataset.itemType;
            const itemName = e.target.querySelector('span').textContent;
            
            e.dataTransfer.setData('application/json', JSON.stringify({
                id: itemId,
                type: itemType,
                name: itemName
            }));
        }

        function handleDrop(e, orgId) {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            addItemToOrganization(orgId, data);
        }

        function addItemToOrganization(orgId, item) {
            const container = document.getElementById(\`assigned-items-\${orgId}\`);
            if (!container) return;
            
            // 중복 검사
            if (container.querySelector(\`[data-assigned-item="\${item.id}"]\`)) {
                showNotification('이미 배정된 항목입니다.', 'warning');
                return;
            }
            
            const itemEl = document.createElement('div');
            itemEl.className = 'flex items-center justify-between p-2 bg-white rounded border border-gray-200';
            itemEl.dataset.assignedItem = item.id;
            itemEl.innerHTML = \`
                <div class="flex items-center space-x-2">
                    <i class="fas fa-\${item.type === 'quantitative' ? 'chart-bar text-blue-500' : 'comments text-green-500'}"></i>
                    <span class="text-sm font-medium text-gray-900">\${item.name}</span>
                </div>
                <button onclick="removeItemFromOrganization('\${orgId}', '\${item.id}')" 
                        class="text-red-500 hover:text-red-700">
                    <i class="fas fa-times"></i>
                </button>
            \`;
            
            container.appendChild(itemEl);
            showNotification(\`\${item.name}이(가) 배정되었습니다.\`, 'success');
        }

        function removeItemFromOrganization(orgId, itemId) {
            const container = document.getElementById(\`assigned-items-\${orgId}\`);
            const item = container.querySelector(\`[data-assigned-item="\${itemId}"]\`);
            if (item) {
                item.remove();
                showNotification('항목이 제거되었습니다.', 'info');
            }
        }

        // 미리보기 기능
        function runEvaluationPreview() {
            const orgId = document.getElementById('previewOrganization').value;
            const container = document.getElementById('previewResult');
            
            // 시뮬레이션 데이터 생성
            const simulationData = generateSimulationData(orgId);
            displayPreviewResult(container, simulationData);
        }

        function generateSimulationData(orgId) {
            const orgNames = {
                'sales_team': 'Sales팀',
                'cx_team': 'CX팀'
            };
            
            // 샘플 사용자
            const sampleUsers = [
                { name: '최민', email: 'choi@company.com' },
                { name: '김다민', email: 'kim@company.com' },
                { name: '박진희', email: 'park@company.com' }
            ];
            
            return {
                organization: orgNames[orgId],
                users: sampleUsers,
                quantitativeItems: Object.values(quantitativeItems).length > 0 ? 
                    Object.values(quantitativeItems).slice(0, 3) : [
                        { name: '목표 달성률', weight: 40 },
                        { name: 'KPI 성과', weight: 35 },
                        { name: '프로젝트 기여도', weight: 25 }
                    ],
                qualitativeItems: Object.values(qualitativeItems).length > 0 ? 
                    Object.values(qualitativeItems).slice(0, 4) : [
                        { name: '리더십', scale: '1-5' },
                        { name: '의사소통', scale: '1-5' },
                        { name: '전문성', scale: '1-5' },
                        { name: '협업 능력', scale: '1-5' }
                    ]
            };
        }

        function displayPreviewResult(container, data) {
            container.innerHTML = \`
                <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg mb-6">
                    <h4 class="text-lg font-semibold text-indigo-900 mb-2">\${data.organization} 평가 시뮬레이션</h4>
                    <p class="text-indigo-700">총 \${data.users.length}명의 구성원에 대한 평가 예시</p>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- 정량평가 -->
                    <div class="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 class="font-semibold text-blue-900 mb-3">
                            <i class="fas fa-chart-bar mr-2"></i>정량평가 항목
                        </h5>
                        <div class="space-y-2">
                            \${data.quantitativeItems.map(item => \`
                                <div class="flex justify-between items-center p-2 bg-blue-50 rounded">
                                    <span class="text-sm font-medium">\${item.name}</span>
                                    <span class="text-xs text-blue-600">배점: \${item.points}점</span>
                                </div>
                            \`).join('')}
                        </div>
                    </div>

                    <!-- 정성평가 -->
                    <div class="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 class="font-semibold text-green-900 mb-3">
                            <i class="fas fa-comments mr-2"></i>정성평가 항목
                        </h5>
                        <div class="space-y-2">
                            \${data.qualitativeItems.map(item => \`
                                <div class="flex justify-between items-center p-2 bg-green-50 rounded">
                                    <span class="text-sm font-medium">\${item.name}</span>
                                    <span class="text-xs text-green-600">\${item.scale}</span>
                                </div>
                            \`).join('')}
                        </div>
                    </div>
                </div>

                <div class="mt-6 bg-white p-4 rounded-lg border border-gray-200">
                    <h5 class="font-semibold text-gray-900 mb-3">평가 대상자</h5>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        \${data.users.map(user => \`
                            <div class="p-3 bg-gray-50 rounded-lg text-center">
                                <i class="fas fa-user-circle text-2xl text-gray-400 mb-2"></i>
                                <div class="font-medium text-gray-900">\${user.name}</div>
                                <div class="text-xs text-gray-600">\${user.email}</div>
                            </div>
                        \`).join('')}
                    </div>
                </div>
            \`;
        }

        // 전역 함수로 즉시 등록 (onclick 이벤트에서 사용)
        console.log('🔧 전역 함수들을 window 객체에 등록 중...');
        
        // 핵심 탭 함수들 먼저 등록
        if (typeof window.showTab === 'function') {
            console.log('✅ showTab 이미 등록됨');
        } else {
            console.log('⚠️ showTab 재등록 필요');
        }
        
        if (typeof window.showSettingsTab === 'function') {
            console.log('✅ showSettingsTab 이미 등록됨');
        } else {
            console.log('⚠️ showSettingsTab 재등록 필요');
        }
        
        // 평가 시스템 함수들
        window.switchEvaluationTab = switchEvaluationTab;
        window.startEvaluationWizard = startEvaluationWizard;
        window.quickAddQuantitativeItem = quickAddQuantitativeItem;
        window.quickAddQualitativeItem = quickAddQualitativeItem;
        window.quickEditItem = quickEditItem;
        window.duplicateItem = duplicateItem;
        window.deleteEvaluationItem = deleteEvaluationItem;
        window.closeQuickAddModal = closeQuickAddModal;
        window.closeEvaluationWizard = closeEvaluationWizard;
        window.selectEvaluationType = selectEvaluationType;
        window.nextWizardStep = nextWizardStep;
        window.previousWizardStep = previousWizardStep;
        window.updateWeightDisplay = updateWeightDisplay;
        window.loadSalesTargets = loadSalesTargets;
        window.selectOrganization = selectOrganization;
        window.handleDragStart = handleDragStart;
        window.removeItemFromOrganization = removeItemFromOrganization;
        window.runEvaluationPreview = runEvaluationPreview;
        window.saveAssignments = saveAssignments;
        
        // 기존 함수 호환성
        window.addQuantitativeItem = addQuantitativeItem;
        window.addQualitativeItem = addQualitativeItem;
        window.editQuantitativeItem = editQuantitativeItem;
        window.editQualitativeItem = editQualitativeItem;
        window.deleteQuantitativeItem = deleteQuantitativeItem;
        window.deleteQualitativeItem = deleteQualitativeItem;
        window.showEvaluationTargetModal = showEvaluationTargetModal;
        window.editEvaluationTarget = editEvaluationTarget;
        
        console.log('✅ 모든 평가 시스템 함수 등록 완료');

        // DOMContentLoaded 이벤트 핸들러
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 DOM 로드 완료 - 시스템 전체 초기화 시작...');
            
            try {
                // 모든 탭 버튼에 이벤트 리스너 안전하게 추가
                setupTabEventListeners();
                
                // 모든 설정 탭 버튼에 이벤트 리스너 추가
                setupSettingsTabEventListeners();
                
                // 평가 시스템 탭 버튼에 이벤트 리스너 추가
                setupEvaluationTabEventListeners();
                
                // 🎯 실시간 유효성 검사 설정
                setupRealTimeValidation();
                
                // 조직 폼 처리
                setupOrganizationForm();
                
                console.log('✅ 모든 이벤트 리스너 등록 완료');
            } catch (error) {
                console.error('❌ 이벤트 리스너 등록 오류:', error);
            }
            
            // 페이지 로드 시 초기화
            setTimeout(() => {
                try {
                    // Sales 목표 데이터 로드
                    if (document.getElementById('salesTargetsContainer')) {
                        loadSalesTargets();
                    }
                    
                    // 평가 시스템 초기화 (기본적으로 대시보드 탭이 활성화됨)
                    if (document.getElementById('evaluation-dashboard')) {
                        updateDashboardStats();
                    }
                    
                    console.log('✅ 평가 시스템 초기화 완료');
                } catch (error) {
                    console.error('❌ 평가 시스템 초기화 오류:', error);
                }
            }, 1000);
        });

        // 안전한 이벤트 리스너 등록 함수들
        function setupTabEventListeners() {
            // 메인 탭 버튼들
            document.querySelectorAll('button[onclick*="showTab"]').forEach(button => {
                if (button && !button.dataset.listenerAdded) {
                    const onclickAttr = button.getAttribute('onclick');
                    if (onclickAttr) {
                        const tabName = onclickAttr.match(/showTab\('([^']+)'\)/);
                        if (tabName && tabName[1]) {
                            button.addEventListener('click', function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                    if (typeof window.showTab === 'function') {
                                        window.showTab(tabName[1]);
                                    }
                                } catch (error) {
                                    console.error('Tab click error:', error);
                                }
                            });
                            button.dataset.listenerAdded = 'true';
                            console.log('✅ 탭 리스너 등록:', tabName[1]);
                        }
                    }
                }
            });
        }

        function setupSettingsTabEventListeners() {
            // 시스템 설정 탭 버튼들
            document.querySelectorAll('button[onclick*="showSettingsTab"]').forEach(button => {
                if (button && !button.dataset.listenerAdded) {
                    const onclickAttr = button.getAttribute('onclick');
                    if (onclickAttr) {
                        const tabName = onclickAttr.match(/showSettingsTab\('([^']+)'\)/);
                        if (tabName && tabName[1]) {
                            button.addEventListener('click', function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                    if (typeof window.showSettingsTab === 'function') {
                                        window.showSettingsTab(tabName[1]);
                                    }
                                } catch (error) {
                                    console.error('Settings tab click error:', error);
                                }
                            });
                            button.dataset.listenerAdded = 'true';
                            console.log('✅ 설정 탭 리스너 등록:', tabName[1]);
                        }
                    }
                }
            });
        }

        function setupEvaluationTabEventListeners() {
            // 평가 시스템 탭 버튼들
            document.querySelectorAll('button[onclick*="switchEvaluationTab"]').forEach(button => {
                if (button && !button.dataset.listenerAdded) {
                    const onclickAttr = button.getAttribute('onclick');
                    if (onclickAttr) {
                        const tabName = onclickAttr.match(/switchEvaluationTab\('([^']+)'\)/);
                        if (tabName && tabName[1]) {
                            button.addEventListener('click', function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                    if (typeof switchEvaluationTab === 'function') {
                                        switchEvaluationTab(tabName[1]);
                                    }
                                } catch (error) {
                                    console.error('Evaluation tab click error:', error);
                                }
                            });
                            button.dataset.listenerAdded = 'true';
                            console.log('✅ 평가 탭 리스너 등록:', tabName[1]);
                        }
                    }
                }
            });
        }

        function setupOrganizationForm() {
            try {
                const orgForm = document.getElementById('organizationForm');
                if (!orgForm) {
                    console.log('⚠️ organizationForm을 찾을 수 없음');
                    return;
                }
                
                if (orgForm.dataset.listenerAdded) return;
                
                orgForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    try {
                        if (!isAdmin()) return showToast('관리자 권한이 필요합니다.', 'error');
                        
                        const nameEl = document.getElementById('orgName');
                        const typeEl = document.getElementById('orgType');
                        const parentEl = document.getElementById('parentOrg');
                        const descEl = document.getElementById('orgDescription');
                        
                        if (!nameEl || !typeEl || !descEl) {
                            console.error('폼 요소를 찾을 수 없음');
                            return;
                        }
                        
                        const orgData = {
                            name: nameEl.value.trim(),
                            type: typeEl.value,
                            parentId: parentEl ? parentEl.value || null : null,
                            description: descEl.value.trim()
                        };
                        
                        if (!orgData.name) return showToast('조직명을 입력해주세요.', 'error');
                        
                        const data = await apiCall('/api/organizations', {
                            method: 'POST',
                            body: JSON.stringify(orgData)
                        });
                        
                        showToast(data.success ? '조직이 추가되었습니다.' : data.message || '조직 추가 실패', data.success ? 'success' : 'error');
                        if (data.success) {
                            e.target.reset();
                            if (typeof refreshOrganization === 'function') {
                                refreshOrganization();
                            }
                        }
                    } catch (error) {
                        console.error('조직 추가 오류:', error);
                        showToast('조직 추가 중 오류가 발생했습니다.', 'error');
                    }
                });
                
                orgForm.dataset.listenerAdded = 'true';
                console.log('✅ 조직 폼 리스너 등록 완료');
            } catch (error) {
                console.error('❌ 조직 폼 설정 오류:', error);
            }
        }

        console.log('🎉 모든 JavaScript 모듈이 성공적으로 로드되었습니다!');
        </script>

        <!-- 평가 항목 등록 위저드 모달 -->
        <div id="evaluationWizardModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
                <!-- 위저드 헤더 -->
                <div class="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-t-lg">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xl font-semibold text-white">
                            <i class="fas fa-magic mr-3"></i>평가 항목 등록 마법사
                        </h3>
                        <button onclick="closeEvaluationWizard()" class="text-white hover:text-gray-200">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <!-- 진행 단계 표시 -->
                    <div class="mt-4">
                        <div class="flex items-center space-x-4 text-white">
                            <div class="flex items-center">
                                <div id="step1-indicator" class="w-8 h-8 bg-white bg-opacity-30 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                                <span class="ml-2 text-sm">유형 선택</span>
                            </div>
                            <div class="flex-1 h-0.5 bg-white bg-opacity-30"></div>
                            <div class="flex items-center">
                                <div id="step2-indicator" class="w-8 h-8 bg-white bg-opacity-30 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                                <span class="ml-2 text-sm">기본 정보</span>
                            </div>
                            <div class="flex-1 h-0.5 bg-white bg-opacity-30"></div>
                            <div class="flex items-center">
                                <div id="step3-indicator" class="w-8 h-8 bg-white bg-opacity-30 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                                <span class="ml-2 text-sm">상세 설정</span>
                            </div>
                            <div class="flex-1 h-0.5 bg-white bg-opacity-30"></div>
                            <div class="flex items-center">
                                <div id="step4-indicator" class="w-8 h-8 bg-white bg-opacity-30 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
                                <span class="ml-2 text-sm">확인</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 위저드 본체 -->
                <div class="p-6">
                    <!-- 1단계: 평가 유형 선택 -->
                    <div id="wizard-step-1" class="wizard-step">
                        <div class="text-center mb-6">
                            <h4 class="text-lg font-semibold text-gray-900 mb-2">어떤 유형의 평가 항목을 추가하시겠습니까?</h4>
                            <p class="text-gray-600">평가 유형에 따라 설정할 수 있는 옵션이 달라집니다.</p>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <button onclick="selectEvaluationType('quantitative')" class="evaluation-type-card p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                <div class="text-center">
                                    <i class="fas fa-chart-bar text-blue-500 text-3xl mb-3"></i>
                                    <h5 class="font-semibold text-gray-900 mb-2">정량평가</h5>
                                    <p class="text-sm text-gray-600">숫자로 측정 가능한 객관적 평가</p>
                                    <div class="mt-3 text-xs text-gray-500">
                                        예: 매출 달성률, KPI 성과 등
                                    </div>
                                </div>
                            </button>
                            
                            <button onclick="selectEvaluationType('qualitative')" class="evaluation-type-card p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                                <div class="text-center">
                                    <i class="fas fa-comments text-green-500 text-3xl mb-3"></i>
                                    <h5 class="font-semibold text-gray-900 mb-2">정성평가</h5>
                                    <p class="text-sm text-gray-600">주관적 판단이 필요한 평가</p>
                                    <div class="mt-3 text-xs text-gray-500">
                                        예: 리더십, 의사소통 능력 등
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- 2단계: 기본 정보 -->
                    <div id="wizard-step-2" class="wizard-step hidden">
                        <div class="mb-6">
                            <h4 class="text-lg font-semibold text-gray-900 mb-2">평가 항목의 기본 정보를 입력해주세요</h4>
                            <p class="text-gray-600">명확하고 이해하기 쉬운 이름과 설명을 작성해주세요.</p>
                        </div>
                        
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    <i class="fas fa-tag mr-1"></i>항목명 *
                                </label>
                                <input type="text" id="wizardItemName" 
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                       placeholder="예: 월별 매출 달성률">
                                <div class="mt-1 text-xs text-gray-500">평가 대상자가 쉽게 이해할 수 있는 명확한 이름을 입력하세요</div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    <i class="fas fa-align-left mr-1"></i>상세 설명 *
                                </label>
                                <textarea id="wizardItemDescription" 
                                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                          rows="3" placeholder="이 평가 항목이 무엇을 측정하는지 자세히 설명해주세요"></textarea>
                                <div class="mt-1 text-xs text-gray-500">평가 기준과 측정 방법을 포함해서 작성하면 좋습니다</div>
                            </div>

                            <div id="wizardCategorySection" class="hidden">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    <i class="fas fa-folder mr-1"></i>카테고리
                                </label>
                                <select id="wizardCategory" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                    <option value="sales">매출 관련</option>
                                    <option value="customer">고객 관련</option>
                                    <option value="project">프로젝트 관련</option>
                                    <option value="personal">개인 역량</option>
                                    <option value="team">팀워크</option>
                                    <option value="other">기타</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- 3단계: 상세 설정 -->
                    <div id="wizard-step-3" class="wizard-step hidden">
                        <div class="mb-6">
                            <h4 class="text-lg font-semibold text-gray-900 mb-2">평가 방식을 설정해주세요</h4>
                            <p class="text-gray-600">평가 유형에 맞는 세부 설정을 진행합니다.</p>
                        </div>
                        
                        <!-- 정량평가 상세 설정 -->
                        <div id="quantitative-settings" class="hidden">
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        <i class="fas fa-star mr-1"></i>배점 (점수)
                                    </label>
                                    <div class="flex items-center space-x-3">
                                        <input type="range" id="wizardWeightSlider" min="0" max="100" value="30" 
                                               class="flex-1" oninput="updateWeightDisplay(this.value)">
                                        <div class="bg-blue-100 px-3 py-2 rounded-lg min-w-16 text-center">
                                            <span id="wizardWeightDisplay" class="font-semibold text-blue-600">30%</span>
                                        </div>
                                    </div>
                                    <div class="mt-1 text-xs text-gray-500">전체 정량평가에서 차지하는 비중을 설정하세요</div>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        <i class="fas fa-ruler mr-1"></i>측정 단위
                                    </label>
                                    <select id="wizardUnit" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                        <option value="percent">백분율 (%)</option>
                                        <option value="number">숫자</option>
                                        <option value="currency">금액 (원)</option>
                                        <option value="count">건수</option>
                                        <option value="ratio">비율</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        <i class="fas fa-bullseye mr-1"></i>목표 설정 방식
                                    </label>
                                    <div class="space-y-2">
                                        <label class="flex items-center">
                                            <input type="radio" name="targetType" value="fixed" checked class="mr-2">
                                            <span>고정 목표값</span>
                                        </label>
                                        <label class="flex items-center">
                                            <input type="radio" name="targetType" value="individual" class="mr-2">
                                            <span>개인별 목표값</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 정성평가 상세 설정 -->
                        <div id="qualitative-settings" class="hidden">
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        <i class="fas fa-star mr-1"></i>평가 척도
                                    </label>
                                    <div class="grid grid-cols-2 gap-3">
                                        <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                            <input type="radio" name="scale" value="1-5" checked class="mr-3">
                                            <div>
                                                <div class="font-medium">1-5점 척도</div>
                                                <div class="text-xs text-gray-500">가장 일반적인 방식</div>
                                            </div>
                                        </label>
                                        <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                            <input type="radio" name="scale" value="1-10" class="mr-3">
                                            <div>
                                                <div class="font-medium">1-10점 척도</div>
                                                <div class="text-xs text-gray-500">세밀한 평가 가능</div>
                                            </div>
                                        </label>
                                        <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                            <input type="radio" name="scale" value="ABCD" class="mr-3">
                                            <div>
                                                <div class="font-medium">A-B-C-D 등급</div>
                                                <div class="text-xs text-gray-500">직관적인 등급제</div>
                                            </div>
                                        </label>
                                        <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                            <input type="radio" name="scale" value="custom" class="mr-3">
                                            <div>
                                                <div class="font-medium">사용자 정의</div>
                                                <div class="text-xs text-gray-500">직접 척도 설정</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        <i class="fas fa-list-ul mr-1"></i>평가 기준
                                    </label>
                                    <textarea id="wizardCriteria" 
                                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                              rows="3" placeholder="각 점수별 평가 기준을 설명해주세요 (선택사항)"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 4단계: 확인 -->
                    <div id="wizard-step-4" class="wizard-step hidden">
                        <div class="mb-6">
                            <h4 class="text-lg font-semibold text-gray-900 mb-2">설정 내용을 확인해주세요</h4>
                            <p class="text-gray-600">아래 정보가 정확한지 확인하고 저장해주세요.</p>
                        </div>
                        
                        <div id="wizardSummary" class="bg-gray-50 p-4 rounded-lg">
                            <!-- 동적으로 채워짐 -->
                        </div>
                    </div>
                </div>

                <!-- 위저드 하단 버튼 -->
                <div class="border-t border-gray-200 p-6">
                    <div class="flex justify-between">
                        <button id="wizardPrevBtn" onclick="previousWizardStep()" class="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50" disabled>
                            <i class="fas fa-arrow-left mr-2"></i>이전
                        </button>
                        <div class="flex space-x-3">
                            <button onclick="closeEvaluationWizard()" class="px-6 py-2 text-gray-600 hover:text-gray-800">
                                취소
                            </button>
                            <button id="wizardNextBtn" onclick="nextWizardStep()" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                다음 <i class="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 🎨 현대적 카드형 빠른 추가 모달 -->
        <div id="quickAddModal" class="fixed inset-0 bg-black bg-opacity-60 hidden items-center justify-center z-50 animate-fadeIn backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-slideUp transform transition-all duration-300">
                
                <!-- 모달 헤더 with Progress Indicator -->
                <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 relative overflow-hidden">
                    <!-- 배경 패턴 -->
                    <div class="absolute inset-0 opacity-10">
                        <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
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
                        <button onclick="closeQuickAddModal()" class="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all hover:rotate-90 duration-300">
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
                                               oninput="updateFormProgress()"
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
                                               oninput="updateFormProgress()"
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
                                              oninput="updateFormProgress()"
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
                                        직장 가이드 <span class="text-red-500">*</span>
                                    </label>
                                    <div class="relative">
                                        <textarea id="quickAddGuide" 
                                                  class="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none" 
                                                  rows="2" 
                                                  placeholder="평가 방법과 기준에 대한 가이드를 작성하세요" 
                                                  oninput="updateFormProgress()"
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
                                                  oninput="updateFormProgress()"
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
                        <button type="button" onclick="closeQuickAddModal()" 
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
        
        <!-- 🎨 추가 CSS 스타일 -->
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes slideUp {
                from { 
                    opacity: 0;
                    transform: translateY(20px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .animate-fadeIn {
                animation: fadeIn 0.2s ease-out;
            }
            
            .animate-slideUp {
                animation: slideUp 0.3s ease-out;
            }
            
            /* 폼 필드 포커스 애니메이션 */
            input:focus, textarea:focus, select:focus {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
            }
            
            /* 유효성 검사 스타일 */
            .field-valid {
                border-color: #10b981 !important;
                box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1) !important;
            }
            
            .field-invalid {
                border-color: #ef4444 !important;
                box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1) !important;
            }
            
            /* 버튼 호버 효과 */
            button:hover {
                transform: translateY(-1px);
                transition: all 0.2s ease;
            }
            
            /* 카드 호버 효과 */
            .bg-gray-50:hover, .bg-gradient-to-br:hover {
                transform: translateY(-2px);
                transition: all 0.3s ease;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            }
            
            /* 입력 완료 체크 애니메이션 */
            @keyframes checkBounce {
                0% { transform: scale(0) rotate(0deg); }
                50% { transform: scale(1.2) rotate(180deg); }
                100% { transform: scale(1) rotate(360deg); }
            }
            
            .check-icon-appear {
                animation: checkBounce 0.5s ease-out;
            }
            
            /* 프로그레스 바 빛나는 효과 */
            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }
            
            .progress-shimmer {
                background: linear-gradient(
                    90deg,
                    rgba(255, 255, 255, 0.3) 0%,
                    rgba(255, 255, 255, 0.6) 50%,
                    rgba(255, 255, 255, 0.3) 100%
                );
                background-size: 1000px 100%;
                animation: shimmer 2s infinite;
            }
        </style>
                </form>
            </div>
        </div>

        <!-- 드래그 앤 드롭 배정 모달 -->
        <div id="assignmentModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
                <div class="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-t-lg">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xl font-semibold text-white">
                            <i class="fas fa-users-cog mr-3"></i>평가 항목 배정
                        </h3>
                        <button onclick="closeAssignmentModal()" class="text-white hover:text-gray-200">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>

                <div class="p-6">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- 조직 선택 -->
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-900 mb-3">
                                <i class="fas fa-sitemap mr-2"></i>조직 선택
                            </h4>
                            <div id="assignmentOrgList" class="space-y-2">
                                <!-- 동적으로 채워짐 -->
                            </div>
                        </div>

                        <!-- 평가 항목 -->
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-900 mb-3">
                                <i class="fas fa-list-alt mr-2"></i>평가 항목
                            </h4>
                            <div id="assignmentItemPool" class="space-y-2 max-h-96 overflow-y-auto">
                                <!-- 동적으로 채워짐 -->
                            </div>
                        </div>

                        <!-- 배정 결과 -->
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-900 mb-3">
                                <i class="fas fa-clipboard-check mr-2"></i>배정 결과
                            </h4>
                            <div id="assignmentDropZone" class="min-h-64 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
                                조직을 선택하고 평가 항목을 드래그해서 배정하세요
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                        <button onclick="closeAssignmentModal()" class="px-6 py-2 text-gray-600 hover:text-gray-800">
                            취소
                        </button>
                        <button onclick="saveAssignments()" class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            <i class="fas fa-save mr-2"></i>배정 저장
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 페이지 초기화 스크립트 -->
        <script>
        // 페이지 로드 시 초기 탭 설정
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 페이지 초기화 시작');
            
            // 사용자 정보 확인
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('👤 현재 사용자:', user);
            
            // 모든 탭 숨기기
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            // 초기 탭 표시 (관리자는 adminDashboard, 일반 사용자는 dashboard)
            if (user.role === 'admin' || user.role === 'admin_user') {
                const adminDashboard = document.getElementById('adminDashboard');
                if (adminDashboard) {
                    adminDashboard.classList.remove('hidden');
                    console.log('✅ 관리자 대시보드 표시');
                }
            } else {
                const dashboard = document.getElementById('dashboard');
                if (dashboard) {
                    dashboard.classList.remove('hidden');
                    console.log('✅ 사용자 대시보드 표시');
                }
            }
            
            // 초기 통계 업데이트
            if (typeof updateDashboardStats === 'function' && user.role === 'admin') {
                setTimeout(() => {
                    updateDashboardStats();
                    console.log('📊 대시보드 통계 업데이트');
                }, 500);
            }
        });
        </script>
    </body>
    </html>
  `)
})

// 이메일 서비스 초기화
initializeEmailService()

// Hono 미들웨어: 환경 변수 초기화
app.use('*', async (c, next) => {
  // 이메일 서비스가 초기화되지 않은 경우 초기화
  if (!emailService) {
    console.log('⚙️ Initializing email service in middleware...')
    await initializeEmailService(c.env)
  }
  await next()
})

// ============================================
// 평가 항목 관리 API
// ============================================

// 평가 항목 데이터 구조 (엑셀 파일 기준 + 기획안 주기/적용범위)
interface EvaluationItem {
  id: string;
  name: string; // 평가 항목 (엑셀: 평가 항목)
  type: 'quantitative' | 'qualitative'; // 구분 (엑셀: 정량평가/정성평가)
  category: string; // 카테고리 분류용
  points: number; // 배점 (엑셀: 30점, 10점, 5점 등)
  guide: string; // 직장 가이드 (엑셀: 직장 가이드)
  scoreStandard: string; // 점수 기준 (엑셀: 5점: 110% 이상, 4점: 90% 이상...)
  
  // 기획안 추가 요소
  period: 'monthly' | 'quarterly' | 'semi-annual' | 'annual'; // 주기
  scope: 'individual' | 'part' | 'team' | 'department'; // 적용 범위
  
  description: string; // 상세 설명
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// 글로벌 평가 항목 저장소
let evaluationItems: { [key: string]: EvaluationItem } = {};

// 평가 항목 통계 (구체적인 경로를 먼저 정의)
app.get('/api/evaluation-items/stats', async (c) => {
  const items = Object.values(evaluationItems);
  
  const stats = {
    total: items.length,
    byType: {
      quantitative: items.filter(item => item.type === 'quantitative').length,
      qualitative: items.filter(item => item.type === 'qualitative').length
    },
    byPeriod: {
      monthly: items.filter(item => item.period === 'monthly').length,
      quarterly: items.filter(item => item.period === 'quarterly').length,
      'semi-annual': items.filter(item => item.period === 'semi-annual').length,
      annual: items.filter(item => item.period === 'annual').length
    },
    byScope: {
      individual: items.filter(item => item.scope === 'individual').length,
      part: items.filter(item => item.scope === 'part').length,
      team: items.filter(item => item.scope === 'team').length,
      department: items.filter(item => item.scope === 'department').length
    },
    totalPoints: items.reduce((sum, item) => sum + item.points, 0)
  };
  
  return c.json({ success: true, stats });
});

// 평가 항목 목록 조회
app.get('/api/evaluation-items', async (c) => {
  return c.json({ 
    success: true, 
    items: Object.values(evaluationItems),
    total: Object.keys(evaluationItems).length
  });
});

// 평가 항목 상세 조회
app.get('/api/evaluation-items/:id', async (c) => {
  const id = c.req.param('id');
  const item = evaluationItems[id];
  
  if (!item) {
    return c.json({ success: false, message: '평가 항목을 찾을 수 없습니다.' }, 404);
  }
  
  return c.json({ success: true, item });
});

// 평가 항목 생성 (빠른 추가)
app.post('/api/evaluation-items', async (c) => {
  const data = await c.req.json();
  const { name, type, category, points, guide, period, scope, description, scoreStandard, createdBy } = data;
  
  // 필수 필드 검증
  if (!name || !type || !category || !points || !guide || !period || !scope || !description || !scoreStandard || !createdBy) {
    return c.json({ success: false, message: '모든 필수 필드를 입력해주세요.' }, 400);
  }
  
  // 배점 검증 (1-100 사이)
  if (points < 1 || points > 100) {
    return c.json({ success: false, message: '배점은 1~100 사이여야 합니다.' }, 400);
  }
  
  const id = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();
  
  const newItem: EvaluationItem = {
    id,
    name,
    type,
    category,
    points,
    guide,
    scoreStandard,
    period,
    scope,
    description,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy
  };
  
  evaluationItems[id] = newItem;
  
  console.log(`📊 새 평가 항목 생성: ${name} (${type === 'quantitative' ? '정량' : '정성'}, ${points}점)`);
  
  return c.json({ 
    success: true, 
    message: '평가 항목이 생성되었습니다.',
    item: newItem 
  });
});

// 평가 항목 수정
app.put('/api/evaluation-items/:id', async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  
  const existingItem = evaluationItems[id];
  if (!existingItem) {
    return c.json({ success: false, message: '평가 항목을 찾을 수 없습니다.' }, 404);
  }
  
  const { name, type, category, points, guide, period, scope, description, scoreStandard } = data;
  
  // 배점 검증
  if (points && (points < 1 || points > 100)) {
    return c.json({ success: false, message: '배점은 1~100 사이여야 합니다.' }, 400);
  }
  
  // 항목 업데이트
  evaluationItems[id] = {
    ...existingItem,
    name: name || existingItem.name,
    type: type || existingItem.type,
    category: category || existingItem.category,
    points: points !== undefined ? points : existingItem.points,
    guide: guide || existingItem.guide,
    period: period || existingItem.period,
    scope: scope || existingItem.scope,
    description: description || existingItem.description,
    scoreStandard: scoreStandard || existingItem.scoreStandard,
    updatedAt: new Date().toISOString()
  };
  
  console.log(`📊 평가 항목 수정: ${evaluationItems[id].name}`);
  
  return c.json({ 
    success: true, 
    message: '평가 항목이 수정되었습니다.',
    item: evaluationItems[id] 
  });
});

// 평가 항목 삭제
app.delete('/api/evaluation-items/:id', async (c) => {
  const id = c.req.param('id');
  
  if (!evaluationItems[id]) {
    return c.json({ success: false, message: '평가 항목을 찾을 수 없습니다.' }, 404);
  }
  
  const deletedItem = evaluationItems[id];
  delete evaluationItems[id];
  
  console.log(`🗑️ 평가 항목 삭제: ${deletedItem.name}`);
  
  return c.json({ 
    success: true, 
    message: '평가 항목이 삭제되었습니다.' 
  });
});

// 평가 항목 일괄 생성 (마법사 추가)
app.post('/api/evaluation-items/bulk', async (c) => {
  const data = await c.req.json();
  const { items, createdBy } = data;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return c.json({ success: false, message: '생성할 항목이 없습니다.' }, 400);
  }
  
  if (!createdBy) {
    return c.json({ success: false, message: '생성자 정보가 필요합니다.' }, 400);
  }
  
  const createdItems = [];
  const errors = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    try {
      // 필수 필드 검증
      if (!item.name || !item.type || !item.category || !item.points || !item.guide || !item.period || !item.scope || !item.description || !item.scoreStandard) {
        errors.push(`${i + 1}번째 항목: 필수 필드가 누락되었습니다.`);
        continue;
      }
      
      // 배점 검증
      if (item.points < 1 || item.points > 100) {
        errors.push(`${i + 1}번째 항목: 배점은 1~100 사이여야 합니다.`);
        continue;
      }
      
      const id = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      
      const newItem: EvaluationItem = {
        id,
        name: item.name,
        type: item.type,
        category: item.category,
        points: item.points,
        guide: item.guide,
        scoreStandard: item.scoreStandard,
        period: item.period,
        scope: item.scope,
        description: item.description,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy
      };
      
      evaluationItems[id] = newItem;
      createdItems.push(newItem);
      
    } catch (error) {
      errors.push(`${i + 1}번째 항목: ${error.message}`);
    }
  }
  
  console.log(`📊 일괄 생성 완료: ${createdItems.length}개 성공, ${errors.length}개 실패`);
  
  return c.json({ 
    success: true, 
    message: `${createdItems.length}개의 평가 항목이 생성되었습니다.`,
    created: createdItems,
    errors: errors
  });
});



// Static files 처리
app.use('/static/*', serveStatic({ root: './public' }))

export default app