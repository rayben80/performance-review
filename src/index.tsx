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
app.get('/dashboard', serveStatic({ path: './dashboard.html' }))

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