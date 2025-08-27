# 클라우드사업본부 업무평가 시스템

## 프로젝트 개요
- **이름**: 클라우드사업본부 업무평가 시스템
- **목표**: 팀원 성과 평가 및 관리 시스템
- **주요 기능**: 평가 항목 관리, 성과 평가, 보고서 생성, 통계 분석

## 🌐 URL
- **로컬 개발**: http://localhost:3000
- **공개 URL**: https://3000-i19808c3wj7b5mjo50blk.e2b.dev
- **GitHub 저장소**: https://github.com/rayben80/performance-review

## 🔧 핵심 기능

### ✅ 해결된 문제들
- **드래그앤드롭 문제**: HTML5 드래그앤드롭을 화살표 버튼 시스템으로 완전 대체
- **순서 변경 버그**: 100% 안정적인 항목 순서 변경 기능
- **사이드바 토글**: X 버튼으로 숨긴 패널을 미니 토글 버튼으로 재열기 가능

### 🎯 주요 기능
- **설정 관리**: 평가 항목 추가/수정/삭제/순서변경
- **사이드바 패널**: 항목 클릭시 상세 정보 표시 및 편집
- **Excel 연동**: 평가 항목 업로드/다운로드/템플릿 제공
- **통계 시스템**: 실시간 가중치 합계 검증 및 항목 통계
- **키보드 단축키**: Ctrl+N(추가), Ctrl+S(저장), Ctrl+I(사이드바), Esc(닫기)

## 📊 데이터 구조
- **데이터 모델**: 평가 항목(이름, 가중치, 설명), 팀 정보, 평가 결과
- **저장소**: LocalStorage 기반 클라이언트 사이드 저장
- **데이터 플로우**: 브라우저 → LocalStorage → 실시간 동기화

## 🚀 사용 가이드
1. **설정 탭**에서 평가 항목 구성
2. **항목 클릭**으로 사이드바에서 상세 편집
3. **화살표 버튼**으로 순서 변경
4. **Excel 기능**으로 대량 데이터 처리
5. **평가 탭**에서 실제 성과 평가 수행

## 🔧 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript, TailwindCSS
- **Icons**: Font Awesome
- **Charts**: Chart.js
- **Excel**: SheetJS (XLSX.js)
- **서버**: Python HTTP Server + PM2

## 🗂️ 파일 구조
```
webapp/
├── index.html                 # 메인 시스템 (36KB)
├── enhanced-settings-ui.js    # 고급 UI/UX 시스템 (28KB)
├── ecosystem.config.cjs       # PM2 설정
├── backup-system.sh           # 로컬 백업/복원 도구
├── github-backup.sh          # GitHub 백업/버전 관리 도구  
├── unified-backup.sh         # 통합 백업 관리 인터페이스
├── quick-backup.sh           # 빠른 백업 도구
├── backups/                  # 자동 백업 저장소
└── logs/                     # 서비스 로그
```

## 🔄 백업 시스템

### 📦 4-Layer 통합 백업 전략
1. **Git 버전 관리**: 로컬 커밋 기반 변경사항 추적
2. **GitHub 원격 백업**: 클라우드 기반 안전한 코드 저장소
3. **로컬 tar.gz 백업**: 전체 프로젝트 압축 파일 백업
4. **ProjectBackup**: GenSpark AI 클라우드 저장소 백업

### 🐙 GitHub 백업 도구 (추천)

#### GitHub 백업 명령어
```bash
# GitHub 백업 (커밋 + 푸시)
./github-backup.sh backup "변경사항 설명"

# 버전 태그 생성 (v1.0.0, v1.0.1 등)
./github-backup.sh version "v1.0.0"

# 안정 버전 생성 (자동 타임스탬프)
./github-backup.sh stable

# GitHub 버전 목록 확인
./github-backup.sh versions

# GitHub에서 최신 변경사항 가져오기
./github-backup.sh pull

# 특정 버전으로 복원
./github-backup.sh restore "v1.0.0"

# GitHub 완전 동기화
./github-backup.sh sync

# Git/GitHub 상태 확인
./github-backup.sh status
```

### 🎛️ 통합 백업 관리 인터페이스
```bash
# 그래픽 메뉴 인터페이스 (추천)
./unified-backup.sh

# 메뉴를 통해 사용 가능한 기능:
# - 로컬 백업 관리 (생성/목록/복원)
# - GitHub 백업 관리 (버전 태그/복원)
# - 통합 상태 확인
# - 자동 백업 스케줄링
# - 백업 정리 및 관리
```

### 📦 로컬 백업 도구

#### 기본 백업 명령어
```bash
# 현재 상태 백업 (GitHub 푸시 포함)
./backup-system.sh backup

# GitHub 전용 도구 사용
./backup-system.sh github [옵션]

# 백업 목록 확인
./backup-system.sh list

# 백업 복원 (파일명 지정)
./backup-system.sh restore webapp_backup_20250827_074049.tar.gz

# Git 롤백 (마지막 커밋으로)
./backup-system.sh rollback

# 시스템 상태 확인
./backup-system.sh status
```

#### 빠른 백업 도구
```bash
# 인터랙티브 메뉴
./quick-backup.sh

# 또는 직접 명령어
./quick-backup.sh backup    # 빠른 백업
./quick-backup.sh status    # 상태 확인
./quick-backup.sh list      # 백업 목록
./quick-backup.sh rollback  # Git 롤백 (확인 후)
```

### 🏷️ 버전 관리 시스템
- **v1.0.0**: 메이저 릴리스 (주요 기능 완성)
- **vstable-YYYYMMDD_HHMMSS**: 안정 버전 (검증 완료)
- **커밋 해시**: 개발 과정 추적

#### 현재 생성된 버전
- ✅ **v1.0.0**: 완전 복원 + 백업 시스템
- ✅ **vstable-20250827_074715**: 안정 검증 버전

### 🛡️ 백업 전략 및 안전 기능
1. **GitHub 원격 백업**: 코드 손실 완전 방지
2. **버전 태그**: 특정 시점으로 정확한 복원
3. **자동 동기화**: GitHub와 로컬 자동 동기화
4. **충돌 해결**: 자동 병합 및 충돌 처리
5. **롤백 보호**: 복원 전 현재 상태 자동 백업
6. **자동 정리**: 7일 이상 된 로컬 백업 자동 삭제

### 🔒 복원 시나리오별 대응
1. **간단한 변경 취소** → `./github-backup.sh restore "HEAD~1"`
2. **특정 버전 복원** → `./github-backup.sh restore "v1.0.0"`
3. **GitHub 동기화** → `./github-backup.sh sync`
4. **완전한 시스템 복구** → `./github-backup.sh pull`
5. **응급 복구** → `./unified-backup.sh` (통합 메뉴)

### 🤖 자동 백업 설정
```bash
# 통합 백업 도구에서 자동 백업 설정
./unified-backup.sh
# → 15) 자동 백업 설정 선택
# → 매일/매주/사용자정의 스케줄 선택

# 수동 cron 설정 예시
# 매일 자정 GitHub 백업
0 0 * * * cd /home/user/webapp && ./github-backup.sh backup "Daily auto backup"

# 매주 일요일 안정 버전 생성
0 0 * * 0 cd /home/user/webapp && ./github-backup.sh stable
```

## 🎯 배포 상태
- **플랫폼**: Python HTTP Server
- **상태**: ✅ Active
- **프로세스 관리**: PM2
- **마지막 업데이트**: 2025-08-27

## 📋 현재 완료된 기능
- ✅ 드래그앤드롭 문제 완전 해결 (화살표 버튼 시스템)
- ✅ 사이드바 정보 패널 및 토글 기능
- ✅ Excel 업로드/다운로드 기능
- ✅ 통계 패널 및 가중치 검증
- ✅ 키보드 단축키 지원
- ✅ 완전한 백업/복원 시스템
- ✅ PM2 기반 서비스 관리

## 🔮 향후 개선 사항
- [ ] 목표 설정 시스템 통합 (필요시)
- [ ] 데이터베이스 연동 (필요시)
- [ ] 사용자 권한 관리 시스템
- [ ] 모바일 반응형 최적화
- [ ] 실시간 협업 기능

---

**🚨 중요**: 이 시스템은 완전히 복원된 상태이며, 모든 알려진 버그가 수정되었습니다. 백업 시스템을 통해 언제든지 안전한 상태로 롤백할 수 있습니다.