# 🛡️ 소스코드 손실 방지 완전 가이드

## 🚨 **코드 손실 방지를 위한 핵심 원칙**

### 1. **자주 저장하기 - 작업 중 습관화**
```bash
# 작업 중 언제든지 실행 (5-10분마다 권장)
npm run save

# 또는 직접 명령어로
./scripts/quick-save.sh
```

### 2. **의미있는 단계마다 커밋하기**
```bash
# 기능 완성 또는 중요한 변경 후
npm run git:save

# 커스텀 메시지와 함께
./scripts/quick-save.sh "로그인 기능 완성"
```

### 3. **정기적인 전체 백업**
```bash
# 수동 전체 백업 실행
npm run backup

# 또는 직접 명령어로
./scripts/auto-backup.sh
```

## 📋 **백업 시스템 구성**

### 🔄 **자동 백업 시스템**
- **매 10분**: 변경사항 Git 커밋 및 푸시
- **매 30분**: 전체 프로젝트 백업 파일 생성
- **매일**: AI Drive에 프로젝트 아카이브 저장

### 💾 **백업 저장 위치**
1. **Git 저장소** (GitHub): 모든 소스코드 버전 관리
2. **로컬 백업**: `/home/user/webapp/backups/`
3. **AI Drive**: `/mnt/aidrive/` (영구 보관)

### 📂 **백업되는 내용**
- ✅ 모든 소스코드 파일
- ✅ 설정 파일 (package.json, wrangler.toml 등)
- ✅ 데이터베이스 스키마 및 데이터
- ✅ 중요 문서 및 가이드

## 🚀 **빠른 명령어 참고**

### 📝 **일상적인 저장 명령어**
```bash
npm run save                    # 빠른 저장 (Git 커밋 + 푸시)
npm run backup                  # 전체 백업
npm run git:status              # 현재 변경사항 확인
npm run git:log                 # 최근 커밋 히스토리 확인
```

### 🔍 **상태 확인 명령어**
```bash
git status                      # 변경사항 확인
git log --oneline -5           # 최근 5개 커밋 확인
ls -la backups/                # 백업 파일 목록 확인
crontab -l | grep webapp       # 자동 백업 스케줄 확인
```

### 🆘 **응급 복구 명령어**
```bash
# 최근 백업에서 복구
cd /home/user/webapp/backups
ls -t webapp_backup_*.tar.gz | head -1   # 최신 백업 파일 확인
tar -xzf [백업파일명]                    # 백업 파일 복원

# Git에서 특정 버전으로 복원
git log --oneline              # 복원할 커밋 찾기
git reset --hard [커밋해시]     # 해당 버전으로 복원
```

## ⚠️ **코드 손실 방지 체크리스트**

### 📋 **작업 시작 전**
- [ ] 최신 코드가 GitHub에서 동기화되었는지 확인
- [ ] 백업 시스템이 활성화되었는지 확인
- [ ] 작업 환경이 올바르게 설정되었는지 확인

### 💼 **작업 중**
- [ ] 5-10분마다 `npm run save` 실행
- [ ] 기능 완성 후 의미있는 커밋 메시지로 저장
- [ ] 복잡한 변경 전에는 백업 실행

### 🏁 **작업 완료 후**
- [ ] 최종 변경사항 커밋 및 푸시
- [ ] 전체 백업 실행
- [ ] README.md 업데이트 (필요시)

## 🛠️ **트러블슈팅**

### ❌ **GitHub 푸시 실패 시**
```bash
# 원격 저장소 상태 확인
git remote -v

# GitHub 인증 재설정 (필요시)
# 관리자에게 문의하여 GitHub 접근 권한 확인
```

### ❌ **백업 파일 접근 불가 시**
```bash
# 권한 확인 및 수정
chmod +x scripts/*.sh
ls -la scripts/

# 백업 디렉토리 재생성
mkdir -p backups
chmod 755 backups
```

### ❌ **crontab 자동 실행 안됨**
```bash
# crontab 재설정
./scripts/setup-auto-backup.sh

# cron 서비스 확인
service cron status
```

## 📞 **도움이 필요할 때**

1. **즉시 실행할 수 있는 명령어**:
   ```bash
   npm run save    # 현재 상태 즉시 저장
   npm run backup  # 전체 백업 실행
   ```

2. **백업 상태 확인**:
   ```bash
   ls -la backups/        # 로컬 백업 확인
   git log --oneline -5   # GitHub 저장 상태 확인
   ```

3. **응급 복구 필요시**: 위의 응급 복구 명령어 참조

---

## 🎯 **핵심 메시지**

> **"작은 변경이라도 자주 저장하세요!"**
> 
> 가장 좋은 백업은 **습관적으로 하는 백업**입니다.
> 작업 중 5-10분마다 `npm run save`를 실행하는 습관을 만들어 보세요.

**📞 이 가이드를 따르면 더 이상 코드를 잃어버릴 걱정이 없습니다!**