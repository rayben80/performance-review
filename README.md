# 클라우드사업본부 업무평가 시스템

## 🎯 프로젝트 개요
- **이름**: 클라우드사업본부 업무평가 시스템 (Performance Management System)
- **목표**: 체계적인 업무 성과 평가 및 관리를 위한 웹 기반 시스템
- **주요 기능**: 관리자 권한 시스템, 평가 항목 관리, 조직도 관리, 자기평가/타인평가

## 🌐 URL 정보
- **테스트 서버**: https://8000-ihgr15q5utb535wovfkr8.e2b.dev
- **GitHub 리포지토리**: https://github.com/rayben80/performance-review
- **배포 상태**: ✅ 테스트 환경 활성화

## 🔐 완료된 기능 (관리자 권한 시스템)

### ✅ 구현 완료
1. **관리자/일반 사용자 권한 분리**
   - Admin 권한: 모든 메뉴 접근 가능
   - User 권한: 설정 관리 메뉴 접근 제한
   
2. **실시간 권한 변경**
   - 헤더 우상단 Admin/User 버튼으로 권한 전환 가능
   - 권한 변경 시 즉시 UI 업데이트

3. **설정 관리 접근 제한**
   - 일반 사용자가 설정 메뉴 접근 시 차단
   - 시각적 피드백 (자물쇠 아이콘, 투명도 조절)

4. **LocalStorage 데이터 저장**
   - 사용자 권한 정보 브라우저에 저장
   - 페이지 새로고침 후에도 권한 상태 유지

5. **Toast 알림 시스템**
   - 권한 변경 및 접근 제한 시 사용자 알림
   - 성공/오류/경고 메시지 타입별 색상 구분

### 🎨 사용자 인터페이스
- **권한 상태 표시**: 헤더에 사용자 이름과 권한 표시
- **메뉴 시각적 제어**: 권한 없는 메뉴에 자물쇠 아이콘과 비활성화 스타일
- **반응형 디자인**: 모바일/데스크톱 환경 지원

## 🧪 테스트 방법

### 1. 권한 전환 테스트
1. 웹사이트 접속: https://8000-ihgr15q5utb535wovfkr8.e2b.dev
2. 우상단 "Admin" / "User" 버튼 클릭하여 권한 변경
3. 권한 변경 시 Toast 메시지 확인

### 2. 설정 접근 제한 테스트  
1. "User" 모드로 변경
2. 좌측 사이드바 "설정 관리" 메뉴 클릭
3. 접근 차단 메시지 및 안내 화면 확인

### 3. 메뉴 UI 변화 확인
1. 권한 변경 시 "설정 관리" 메뉴의 시각적 변화 확인
2. 일반 사용자일 때: 자물쇠 아이콘, 반투명 처리
3. 관리자일 때: 정상 표시, 접근 가능

## 📋 개발 예정 기능

### 🔄 다음 단계 구현 예정
1. **구성원 이동 시 정보 수정 기능**
   - 조직 이동과 동시에 구성원 정보 편집
   - 모달 기반 통합 인터페이스

2. **평가 항목 관리 고도화**
   - 드래그 앤 드롭 순서 변경
   - 정량/정성 평가 분리 관리

3. **조직도 관리 시스템**
   - Excel 파일 업로드/다운로드
   - 수동 입력 인터페이스
   - 3계층 구조 (부서 > 팀 > 구성원)

4. **자기평가 시스템**
   - 평가 항목별 점수 입력
   - 서술형 답변 작성
   - 진행률 표시

5. **타인평가 및 결과 분석**
   - 다면 평가 시스템
   - 통계 및 차트 생성

## 🛠 기술 스택

### 프론트엔드
- **HTML5**: 시멘틱 마크업
- **TailwindCSS**: 유틸리티 기반 CSS 프레임워크
- **Vanilla JavaScript**: 순수 자바스크립트로 권한 관리
- **FontAwesome**: 아이콘 라이브러리
- **XLSX.js**: Excel 파일 처리 (예정)

### 백엔드 (예정)
- **Hono Framework**: 경량 웹 프레임워크
- **Cloudflare Workers**: 엣지 서버리스 플랫폼
- **TypeScript**: 타입 안전성

### 데이터 저장소
- **LocalStorage**: 클라이언트 사이드 임시 저장
- **Cloudflare D1**: SQLite 기반 글로벌 데이터베이스 (예정)

### 배포
- **GitHub Pages**: 정적 사이트 호스팅 (예정)
- **Cloudflare Pages**: 서버리스 배포 (예정)

## 📁 프로젝트 구조

```
webapp/
├── src/
│   └── index.ts                # Hono 백엔드 (미래)
├── public/
│   ├── css/
│   │   └── main.css           # 커스텀 스타일
│   └── js/                    # 모듈화된 JavaScript
│       ├── app.js
│       ├── utils.js
│       ├── organization.js
│       ├── manual-input.js
│       ├── member-management.js
│       └── excel-management.js
├── index.html                 # 메인 HTML 파일
├── package.json              # 의존성 관리
├── wrangler.toml             # Cloudflare 설정
└── README.md                 # 프로젝트 문서
```

## 🚀 로컬 개발 환경

### 필요 조건
- Node.js 18+ 
- npm 또는 yarn

### 설치 및 실행
```bash
# 저장소 클론
git clone https://github.com/rayben80/performance-review.git
cd performance-review

# 의존성 설치
npm install

# 개발 서버 시작 (Python)
python3 -m http.server 8000

# 또는 Cloudflare Pages 개발 환경
npm run build
npm run dev
```

## 📊 데이터 구조

### 사용자 객체
```javascript
{
  id: 'admin',
  name: '관리자',
  role: 'admin', // 'admin' 또는 'user'
  email: 'admin@company.com'
}
```

### LocalStorage 키
- `currentUser`: 현재 사용자 정보
- `evaluationItems`: 평가 항목 데이터 (예정)
- `organizationData`: 조직도 데이터 (예정)

## 🔒 보안 고려사항

- **클라이언트 사이드 권한**: 현재는 프론트엔드에서만 권한 제어
- **추후 개선**: 서버 사이드 인증 및 JWT 토큰 기반 보안 구현 예정
- **데이터 보호**: 중요한 데이터는 암호화된 백엔드 저장소 사용 예정

## 📈 향후 로드맵

### Phase 1: 권한 시스템 (완료)
- ✅ 기본 권한 분리
- ✅ 메뉴 접근 제어
- ✅ UI 피드백

### Phase 2: 조직 관리 (진행 중)
- 🔄 Excel 업로드/다운로드
- 🔄 수동 조직 입력
- 🔄 구성원 이동 및 정보 수정

### Phase 3: 평가 시스템
- ⏳ 자기평가 인터페이스
- ⏳ 타인평가 시스템
- ⏳ 평가 결과 분석

### Phase 4: 고도화
- ⏳ 서버 사이드 인증
- ⏳ 실시간 알림
- ⏳ 모바일 앱

## 👥 기여 방법

1. Fork 저장소
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경 사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 📞 연락처

- **개발자**: 클라우드사업본부 개발팀
- **이슈 리포팅**: GitHub Issues
- **이메일**: admin@company.com

---

**마지막 업데이트**: 2025년 8월 27일  
**버전**: v1.0.0 - 권한 시스템 초기 구현