#!/bin/bash

# 빠른 백업 스크립트
# 한 줄 명령어로 빠른 백업 및 복원

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/home/user/webapp"

# 빠른 백업
quick_backup() {
    echo -e "${BLUE}⚡ 빠른 백업 실행...${NC}"
    cd "$PROJECT_DIR"
    ./backup-system.sh backup
}

# 빠른 상태 확인
quick_status() {
    echo -e "${BLUE}⚡ 빠른 상태 확인...${NC}"
    cd "$PROJECT_DIR"
    ./backup-system.sh status
}

# 빠른 목록 확인
quick_list() {
    echo -e "${BLUE}⚡ 백업 목록...${NC}"
    cd "$PROJECT_DIR"
    ./backup-system.sh list
}

# 빠른 Git 롤백
quick_rollback() {
    echo -e "${BLUE}⚡ Git 롤백 실행...${NC}"
    read -p "정말로 마지막 커밋으로 롤백하시겠습니까? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        cd "$PROJECT_DIR"
        ./backup-system.sh rollback
    else
        echo "롤백이 취소되었습니다."
    fi
}

# 메뉴 표시
show_menu() {
    echo -e "${GREEN}🚀 빠른 백업 도구${NC}"
    echo ""
    echo "1) 백업 실행"
    echo "2) 상태 확인" 
    echo "3) 백업 목록"
    echo "4) Git 롤백"
    echo "5) 종료"
    echo ""
    read -p "선택하세요 (1-5): " choice
    
    case $choice in
        1) quick_backup ;;
        2) quick_status ;;
        3) quick_list ;;
        4) quick_rollback ;;
        5) echo "종료합니다."; exit 0 ;;
        *) echo "잘못된 선택입니다."; show_menu ;;
    esac
}

# 인수가 없으면 메뉴 표시
if [ $# -eq 0 ]; then
    show_menu
else
    case "$1" in
        "backup"|"b") quick_backup ;;
        "status"|"s") quick_status ;;
        "list"|"l") quick_list ;;
        "rollback"|"r") quick_rollback ;;
        *) echo "사용법: $0 [backup|status|list|rollback]" ;;
    esac
fi