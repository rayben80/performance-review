#!/bin/bash

# 🛡️ 소스코드 손실 방지 자동 백업 스크립트
# 작성일: 2024-09-01
# 목적: 코드 손실 방지를 위한 다중 백업 시스템

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 디렉토리 설정
PROJECT_DIR="/home/user/webapp"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${BLUE}🛡️  소스코드 자동 백업 시스템 시작${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

cd "$PROJECT_DIR" || exit 1

# 1. Git 상태 확인 및 자동 커밋
echo -e "\n${YELLOW}📊 Git 상태 확인 중...${NC}"
git add .
if git diff --cached --quiet; then
    echo -e "${GREEN}✅ 변경사항 없음 - 커밋 생략${NC}"
else
    echo -e "${YELLOW}📝 변경사항 발견 - 자동 커밋 실행${NC}"
    git commit -m "🔄 자동 백업 - $(date '+%Y-%m-%d %H:%M:%S')"
    
    # 원격 저장소에 푸시 시도
    echo -e "${YELLOW}📤 GitHub에 푸시 시도 중...${NC}"
    if git push origin main 2>/dev/null; then
        echo -e "${GREEN}✅ GitHub 푸시 성공${NC}"
    else
        echo -e "${RED}❌ GitHub 푸시 실패 - 인터넷 연결 확인 필요${NC}"
    fi
fi

# 2. 로컬 프로젝트 전체 백업 (tar.gz)
echo -e "\n${YELLOW}📦 로컬 백업 파일 생성 중...${NC}"
BACKUP_FILE="$BACKUP_DIR/webapp_backup_$TIMESTAMP.tar.gz"
tar --exclude='.git' --exclude='node_modules' --exclude='.wrangler' --exclude='dist' \
    -czf "$BACKUP_FILE" -C "$PROJECT_DIR" .

if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ 백업 완료: $BACKUP_FILE ($BACKUP_SIZE)${NC}"
else
    echo -e "${RED}❌ 백업 실패${NC}"
fi

# 3. 중요 파일 개별 백업
echo -e "\n${YELLOW}📋 중요 파일 개별 백업 중...${NC}"
IMPORTANT_FILES=(
    "src/index.tsx"
    "package.json"
    "wrangler.toml"
    "index.html"
    "public/js/app.js"
    "public/css/main.css"
)

for file in "${IMPORTANT_FILES[@]}"; do
    if [ -f "$PROJECT_DIR/$file" ]; then
        cp "$PROJECT_DIR/$file" "$BACKUP_DIR/$(basename "$file")_$TIMESTAMP.backup"
        echo -e "${GREEN}  ✅ $file${NC}"
    fi
done

# 4. 데이터베이스 백업 (D1)
echo -e "\n${YELLOW}🗄️  데이터베이스 백업 중...${NC}"
if command -v wrangler &> /dev/null; then
    DB_BACKUP="$BACKUP_DIR/database_backup_$TIMESTAMP.sql"
    if wrangler d1 execute webapp-production --local --command=".dump" > "$DB_BACKUP" 2>/dev/null; then
        echo -e "${GREEN}✅ 데이터베이스 백업 완료${NC}"
    else
        echo -e "${YELLOW}⚠️  데이터베이스 백업 건너뜀 (D1 없음)${NC}"
    fi
fi

# 5. 백업 파일 정리 (7일 이상 된 파일 삭제)
echo -e "\n${YELLOW}🧹 오래된 백업 파일 정리 중...${NC}"
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete 2>/dev/null
find "$BACKUP_DIR" -name "*.backup" -mtime +7 -delete 2>/dev/null
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete 2>/dev/null

# 6. AI Drive 백업 (가능한 경우)
if [ -d "/mnt/aidrive" ]; then
    echo -e "\n${YELLOW}☁️  AI Drive 백업 중...${NC}"
    AI_BACKUP="/mnt/aidrive/webapp_backup_$TIMESTAMP.tar.gz"
    if cp "$BACKUP_FILE" "$AI_BACKUP" 2>/dev/null; then
        echo -e "${GREEN}✅ AI Drive 백업 완료${NC}"
    else
        echo -e "${RED}❌ AI Drive 백업 실패${NC}"
    fi
fi

# 7. 백업 요약
echo -e "\n${BLUE}📊 백업 요약${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Git 커밋 및 푸시 완료${NC}"
echo -e "${GREEN}✅ 로컬 tar.gz 백업 완료${NC}"
echo -e "${GREEN}✅ 중요 파일 개별 백업 완료${NC}"
echo -e "${GREEN}✅ 백업 위치: $BACKUP_DIR${NC}"
echo -e "${GREEN}✅ 타임스탬프: $TIMESTAMP${NC}"

echo -e "\n${BLUE}🎉 자동 백업 완료!${NC}"