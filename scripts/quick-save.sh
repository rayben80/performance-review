#!/bin/bash

# 🚀 빠른 저장 스크립트 - 코드 손실 방지
# 작업 중 언제든지 실행하여 즉시 백업

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/user/webapp"
cd "$PROJECT_DIR" || exit 1

echo -e "${BLUE}🚀 빠른 저장 시작...${NC}"

# 메시지 입력 받기 (옵션)
COMMIT_MESSAGE="${1:-🔄 빠른 저장 - $(date '+%Y-%m-%d %H:%M:%S')}"

# 1. 모든 변경사항 추가
echo -e "${YELLOW}📝 변경사항 감지 중...${NC}"
git add .

# 2. 변경사항이 있는지 확인
if git diff --cached --quiet; then
    echo -e "${GREEN}✅ 변경사항 없음${NC}"
else
    echo -e "${YELLOW}💾 커밋 중...${NC}"
    git commit -m "$COMMIT_MESSAGE"
    
    echo -e "${YELLOW}📤 GitHub에 푸시 중...${NC}"
    if git push origin main; then
        echo -e "${GREEN}🎉 저장 완료!${NC}"
    else
        echo -e "${YELLOW}⚠️  로컬 저장만 완료 (GitHub 연결 확인)${NC}"
    fi
fi

echo -e "${BLUE}✨ 빠른 저장 종료${NC}"