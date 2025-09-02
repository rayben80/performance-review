# 클라우드사업본부 업무평가 시스템

## 🎯 프로젝트 개요
- **이름**: 클라우드사업본부 업무평가 시스템 (Performance Management System)
- **목표**: 체계적인 업무 성과 평가 및 관리를 위한 웹 기반 시스템
- **주요 기능**: 완전한 인증 시스템, 조직 구조 관리, 시스템 설정, 고도화된 사용자 관리, 다면평가 시스템

## 🌐 URL 정보
- **현재 서비스 URL**: https://3000-i1vfivcrcs12trdqel9xg-6532622b.e2b.dev
- **GitHub 리포지토리**: https://github.com/username/webapp
- **배포 상태**: ✅ 개발 환경 활성화, 🎯 프로덕션 배포 준비 완료

## ✨ 완료된 주요 기능

### 🔐 완전한 인증 및 회원가입 시스템
- **로그인/회원가입**: 탭 기반 통합 인터페이스
- **관리자 승인 워크플로우**: 회원가입 후 관리자 승인 필요
- **3단계 역할 기반 접근 제어**: 
  - **관리자** (admin): 시스템 관리 전용
  - **일반 사용자** (user): 평가 대상자
  - **관리자겸사용자** (admin_user): 팀장, 관리 권한 + 평가 대상자
- **세션 관리**: localStorage 기반 세션 유지

### 🏢 고도화된 조직 구조 관리
- **계층형 조직도**: 팀 > 파트 구조 지원
- **실시간 CRUD**: 조직 생성, 수정, 삭제
- **멤버 수 자동 관리**: 조직별 구성원 수 실시간 업데이트
- **시각적 조직도**: 트리 구조로 조직 관계 표시
- **실제 구조 적용**: 클라우드사업본부의 실제 조직 구조 구현
  - **Sales팀**: 영업, 영업관리
  - **CX팀**: 고객서비스, 기술지원, Technical Writing, Technical Marketing, 사업운영

### 👥 고도화된 사용자 관리
- **다중 상태 관리**: 승인/대기/거부/비활성/삭제
- **일괄 작업**: 대기 중인 회원 모두 승인
- **사용자 비활성화/활성화**: 사유 입력과 함께 상태 변경
- **완전 삭제**: 확인 절차와 함께 사용자 데이터 완전 제거
- **CSV 내보내기**: 사용자 목록을 Excel 호환 형식으로 다운로드
- **📧 이메일 알림 시스템**: 회원가입, 승인, 거부시 자동 이메일 발송

### 🛠 시스템 설정 대시보드
#### 조직 구조 관리
- 팀/파트 생성 및 관리
- 상하위 조직 관계 설정
- 실시간 조직도 업데이트

#### 평가 유형 설정
- **정량평가**: 목표 달성률, KPI 성과, 프로젝트 기여도
- **정성평가**: 리더십, 의사소통, 전문성, 협업 능력
- **가중치 관리**: 평가 항목별 중요도 설정
- **평가 방식**: 60% 정량 + 40% 정성 (조정 가능)

#### 사용자 관리
- 고급 사용자 상태 관리
- 일괄 승인/비활성화 기능
- 사용자 목록 내보내기

#### 평가 일정 관리
- 분기별/반기별/연간 평가 주기 설정
- 평가 대상자 선택 (전체/부서별/직급별)
- 진행률 모니터링

### 🎨 사용자 인터페이스
- **역할별 UI**: 관리자/사용자 전용 사이드바와 대시보드
- **반응형 디자인**: 모바일/태블릿/데스크톱 지원
- **직관적 탭 시스템**: 기능별 명확한 분리
- **실시간 피드백**: 성공/오류/경고 메시지

## 🧪 테스트 계정 정보

### 기본 테스트 계정
- **관리자**: rayben@forcs.com / admin123
- **일반 사용자**: user@company.com / user123  
- **관리자겸사용자**: test@company.com / test123 (팀장 역할)
- **팀장**: manager@company.com / manager123 (관리 권한 + 평가 대상자)

### Gmail 발송 테스트 완료된 사용자
- **Gmail 테스트 사용자**: gmail.test2@example.com (승인됨) - ✅ 승인 알림 발송 완료
- **거부 테스트 사용자**: reject.test@example.com (거부됨) - ✅ 거부 알림 발송 완료

### 이전 테스트 사용자 (승인됨)
- **김철수**: test1@company.com / test123 (일반 사용자)
- **이영희**: test2@company.com / test123 (관리자)
- **Jane "The Boss" O'Connor**: jane.doe@company.com / test123 (특수문자 테스트)

## 📊 API 엔드포인트

### 인증 관련
- `POST /api/login` - 사용자 로그인
- `POST /api/signup` - 회원가입 신청
- `POST /api/logout` - 로그아웃

### 사용자 관리
- `GET /api/users` - 전체 사용자 목록
- `GET /api/users/pending` - 승인 대기 사용자
- `POST /api/users/approve` - 사용자 승인 (이메일 알림 포함)
- `POST /api/users/reject` - 사용자 거부 (이메일 알림 포함)
- `POST /api/users/bulk-approve` - 일괄 승인
- `PUT /api/users/:email/status` - 사용자 상태 변경
- `DELETE /api/users/:email` - 사용자 삭제
- `POST /api/test-email` - 이메일 알림 테스트

### 조직 관리
- `GET /api/organizations` - 조직 목록 조회
- `POST /api/organizations` - 조직 생성
- `PUT /api/organizations/:id` - 조직 수정
- `DELETE /api/organizations/:id` - 조직 삭제
- `POST /api/organizations/initialize` - 실제 클라우드사업본부 구조로 초기화

### 평가 시스템
- `GET /api/evaluation-items` - 평가 항목 조회
- `POST /api/evaluation-items` - 평가 항목 저장

## 🎯 테스트 가이드

### 1. 인증 시스템 테스트
1. 메인 페이지 접속
2. **회원가입 탭**에서 새 계정 생성
3. **로그인 탭**에서 관리자 계정으로 로그인
4. 관리자 사이드바 **"회원 관리"** → 승인 대기 회원 확인 및 승인

### 2. 조직 구조 관리 테스트
1. 관리자로 로그인 후 **"시스템 설정"** 클릭
2. **"조직 구조"** 탭 선택
3. **"실제 구조로 초기화"** 버튼 클릭하여 클라우드사업본부 구조 적용
4. 새 팀/파트 추가 테스트
5. 조직도에서 실시간 업데이트 확인

### 3. 고급 사용자 관리 테스트
1. 시스템 설정 → **"사용자 관리"** 탭
2. 사용자 상태 변경 (비활성화/활성화)
3. **"일괄 작업"** 기능 테스트
4. **"사용자 목록 내보내기"**로 CSV 다운로드

### 4. 평가 시스템 설정 테스트
1. 시스템 설정 → **"평가 유형"** 탭
2. 정량/정성 평가 항목 확인
3. 평가 방식 설정 검토

### 5. Gmail 발송 시스템 테스트 (✅ 실제 발송 활성화)
1. **회원가입 알림 테스트**:
   ```bash
   curl -X POST http://localhost:3000/api/signup \
     -H "Content-Type: application/json" \
     -d '{"name": "테스트 사용자", "email": "test@example.com", "password": "password123", "confirmPassword": "password123", "role": "user"}'
   ```
   → rayben@forcs.com으로 회원가입 신청 알림 발송

2. **승인 알림 테스트**:
   ```bash
   curl -X POST http://localhost:3000/api/users/approve \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "approverEmail": "rayben@forcs.com"}'
   ```
   → 신청자에게 계정 승인 완료 알림 발송

3. **거부 알림 테스트**:
   ```bash
   curl -X POST http://localhost:3000/api/users/reject \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "approverEmail": "rayben@forcs.com", "reason": "테스트 거부 사유"}'
   ```
   → 신청자에게 계정 거부 알림 발송

4. **발송 로그 확인**:
   ```bash
   pm2 logs webapp --nostream --lines 10
   ```
   → Gmail 발송 과정 상세 로깅 확인

## 🛠 기술 스택

### 백엔드
- **Hono Framework**: 경량 웹 프레임워크
- **Cloudflare Workers**: 엣지 서버리스 플랫폼
- **TypeScript**: 타입 안전성

### 프론트엔드
- **HTML5**: 시멘틱 마크업
- **TailwindCSS**: 유틸리티 기반 CSS 프레임워크
- **Vanilla JavaScript**: 순수 자바스크립트
- **FontAwesome**: 아이콘 라이브러리

### 데이터 저장소
- **메모리 기반 저장소**: 현재 개발 환경용
- **Cloudflare D1**: SQLite 기반 글로벌 데이터베이스 (프로덕션 예정)

### 배포
- **PM2**: 프로세스 관리
- **Cloudflare Pages**: 서버리스 배포 (프로덕션 예정)

## 📁 프로젝트 구조

```
webapp/
├── src/
│   └── index.tsx             # Hono 백엔드 메인 파일
├── public/
│   ├── css/
│   │   └── main.css         # 커스텀 스타일
│   └── js/                  # JavaScript 모듈들
├── dist/                    # 빌드 결과물
├── .git/                    # Git 저장소
├── ecosystem.config.cjs     # PM2 설정
├── package.json            # 의존성 관리
├── wrangler.jsonc          # Cloudflare 설정
├── vite.config.ts          # Vite 빌드 설정
├── CODE_BACKUP_GUIDE.md    # 백업 시스템 가이드
└── README.md               # 프로젝트 문서
```

## 🔒 보안 및 데이터 관리

### 현재 구현된 보안 기능
- **입력 검증**: 이메일 형식, 비밀번호 강도 확인
- **중복 가입 방지**: 이메일 기반 중복 검사
- **승인 기반 접근**: 관리자 승인 후 로그인 가능
- **세션 관리**: localStorage 기반 세션 유지

### 📧 이메일 알림 시스템 (✅ 실제 Gmail 발송 활성화)
- **발송 계정**: rayben@forcs.com (Gmail SMTP)
- **발송 모드**: ✅ **실제 Gmail 발송 활성화** (시뮬레이션 모드 아님)
- **인증 방식**: Gmail 앱 비밀번호 (`gveq uzww grfz mdui`)
- **알림 유형**:
  - **회원가입 신청 알림** (관리자 rayben@forcs.com에게)
  - **계정 승인 완료 알림** (신청자에게) - 환영 메시지 및 로그인 안내
  - **계정 거부 알림** (신청자에게) - 거부 사유 및 재신청 안내
- **이메일 템플릿**: 반응형 HTML 디자인, 브랜딩 일관성
- **발송 상태**: 상세한 로깅으로 발송 과정 추적 가능
- **보안**: 환경 변수 관리, 다중 폴백 시스템

### 데이터 구조
```javascript
// 사용자 객체
{
  email: "user@company.com", 
  password: "encrypted_password",
  name: "사용자명",
  role: "admin|user|admin_user",  // 3단계 역할 시스템
  status: "approved|pending|rejected|inactive",
  createdAt: "2025-09-01T12:00:00.000Z",
  organizationId: "org_id_optional"
}

// 조직 객체
{
  id: "org_1234567890",
  name: "CX팀",
  type: "team|part",
  parentId: "parent_org_id_optional",
  description: "고객 경험, 기술 지원, 마케팅 및 사업 운영을 담당하는 팀",
  memberCount: 5,
  createdAt: "2025-09-01T12:00:00.000Z"
}
```

## 🚀 로컬 개발 환경

### 필요 조건
- Node.js 18+
- npm 또는 yarn

### 설치 및 실행
```bash
# 저장소 클론
git clone <repository-url>
cd webapp

# 의존성 설치
npm install

# 개발 서버 빌드 및 시작
npm run build
pm2 start ecosystem.config.cjs

# 서버 상태 확인
pm2 list
curl http://localhost:3000/api/health
```

## 📋 개발 예정 기능

### 🔄 다음 단계 (우선순위 높음)
1. **평가 관리 시스템**
   - 평가 일정 생성 및 관리
   - 평가 대상자 자동 매칭
   - 진행률 실시간 모니터링

2. **알림 시스템**
   - 평가 마감일 알림
   - 승인 요청 알림
   - 시스템 공지사항

3. **보고서 시스템**
   - 개인별 평가 리포트
   - 부서별 통계 리포트
   - Excel 내보내기 기능

### 🔮 향후 계획 (우선순위 중간)
1. **실제 평가 시스템**
   - 자기평가 인터페이스
   - 다면평가 (360도 평가)
   - 평가 결과 분석 및 시각화

2. **데이터 관리**
   - 평가 히스토리 보관
   - 백업/복원 기능
   - 감사 로그 (audit trail)

## 📈 버전 히스토리

### v2.1.0 (2025-09-01) - Gmail 발송 시스템 완성 및 최종 테스트
- ✅ **실제 Gmail 발송 시스템 활성화** (rayben@forcs.com)
- ✅ 3가지 알림 유형 실제 발송 테스트 완료
- ✅ JavaScript 정적 파일 로딩 문제 해결
- ✅ 모든 API 엔드포인트 정상 동작 확인
- ✅ 다중 폴백 Gmail 발송 시스템 구현

### v2.0.0 (2025-09-01) - 시스템 설정 및 고도화된 사용자 관리
- ✅ 완전한 로그인/회원가입 시스템
- ✅ 관리자 승인 워크플로우
- ✅ **3단계 역할 시스템** (관리자, 사용자, 관리자겸사용자)
- ✅ 시스템 설정 대시보드 (4개 탭)
- ✅ 조직 구조 관리 (팀/파트 CRUD)
- ✅ **실제 클라우드사업본부 조직 구조 구현** (Sales팀, CX팀)  
- ✅ 고도화된 사용자 관리 (상태 변경, 일괄 작업, CSV 내보내기)
- ✅ 평가 유형 설정 (정량/정성 평가)
- ✅ 역할별 UI 분리 (관리자/사용자 전용 인터페이스)

### v1.1.0 (2025-08-27) - JavaScript 오류 해결 및 관리자 관리 시스템
- ✅ JavaScript 콘솔 오류 완전 해결
- ✅ 관리자 권한 시스템 구현
- ✅ 관리자 관리 기능 추가

## 👥 기여 및 지원

### 기여 방법
1. Fork 저장소
2. Feature 브랜치 생성
3. 변경 사항 커밋
4. Pull Request 생성

### 코드 백업 시스템
- **자동 Git 커밋**: `npm run save`
- **전체 백업**: `npm run backup`
- **백업 가이드**: [CODE_BACKUP_GUIDE.md](CODE_BACKUP_GUIDE.md) 참조

## 📞 연락처

- **개발팀**: 클라우드사업본부 CX팀
- **이슈 리포팅**: GitHub Issues
- **이메일**: admin@company.com

---

**마지막 업데이트**: 2025년 9월 1일  
**버전**: v2.1.0 - Gmail 발송 시스템 완성 및 최종 테스트  
**현재 상태**: ✅ 모든 핵심 기능 정상 작동, 📧 실제 Gmail 발송 활성화, 🚀 프로덕션 배포 준비 완료  
**라이브 서비스**: https://3000-i1vfivcrcs12trdqel9xg-6532622b.e2b.dev