#!/bin/bash

# 백업 시스템 스크립트
# 클라우드사업본부 업무평가 시스템 백업 및 복원 도구

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 설정
PROJECT_DIR="/home/user/webapp"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

# 도움말 함수
show_help() {
    echo -e "${BLUE}클라우드사업본부 업무평가 시스템 백업 도구${NC}"
    echo ""
    echo "사용법:"
    echo "  ./backup-system.sh [옵션]"
    echo ""
    echo "옵션:"
    echo "  backup          - 현재 상태 백업"
    echo "  list            - 백업 목록 표시"
    echo "  restore [파일]  - 백업 복원"
    echo "  rollback        - 마지막 Git 커밋으로 롤백"
    echo "  clean           - 오래된 백업 정리"
    echo "  status          - 현재 상태 확인"
    echo "  help            - 이 도움말 표시"
}

# 현재 상태 백업
backup_current() {
    echo -e "${YELLOW}📦 현재 상태를 백업 중...${NC}"
    
    # Git 커밋 먼저 생성
    cd "$PROJECT_DIR"
    git add .
    git commit -m "🔄 AUTO BACKUP: $(date '+%Y-%m-%d %H:%M:%S')" || echo "변경사항 없음"
    
    # tar.gz 백업 생성
    BACKUP_FILE="${BACKUP_DIR}/webapp_backup_${TIMESTAMP}.tar.gz"
    tar -czf "$BACKUP_FILE" \
        --exclude="backups" \
        --exclude="logs" \
        --exclude=".git" \
        --exclude="node_modules" \
        -C "$(dirname "$PROJECT_DIR")" \
        "$(basename "$PROJECT_DIR")"
    
    echo -e "${GREEN}✅ 백업 완료: ${BACKUP_FILE}${NC}"
    echo -e "${BLUE}📊 백업 크기: $(du -h "$BACKUP_FILE" | cut -f1)${NC}"
    
    # Git 커밋 해시 저장
    git rev-parse HEAD > "${BACKUP_FILE}.commit"
    
    return 0
}

# 백업 목록 표시
list_backups() {
    echo -e "${BLUE}📋 백업 목록${NC}"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        echo -e "${YELLOW}백업 파일이 없습니다.${NC}"
        return 0
    fi
    
    echo -e "${PURPLE}날짜/시간          크기    파일명${NC}"
    echo "----------------------------------------"
    
    for backup in "$BACKUP_DIR"/*.tar.gz; do
        if [ -f "$backup" ]; then
            filename=$(basename "$backup")
            size=$(du -h "$backup" | cut -f1)
            # 파일명에서 날짜/시간 추출
            datetime=$(echo "$filename" | grep -o '[0-9]\{8\}_[0-9]\{6\}' | sed 's/_/ /')
            if [ -n "$datetime" ]; then
                formatted_date=$(date -d "${datetime:0:8} ${datetime:9:2}:${datetime:11:2}:${datetime:13:2}" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "$datetime")
                echo -e "${formatted_date}  ${size}     ${filename}"
            else
                echo -e "Unknown Date      ${size}     ${filename}"
            fi
        fi
    done
}

# 백업 복원
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        echo -e "${RED}❌ 복원할 백업 파일을 지정하세요.${NC}"
        list_backups
        return 1
    fi
    
    # 상대 경로 처리
    if [ ! -f "$backup_file" ]; then
        backup_file="${BACKUP_DIR}/${backup_file}"
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌ 백업 파일을 찾을 수 없습니다: $backup_file${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🔄 백업 복원 중...${NC}"
    echo -e "${BLUE}복원 파일: $(basename "$backup_file")${NC}"
    
    # 현재 상태 백업 (안전을 위해)
    echo -e "${YELLOW}현재 상태를 임시 백업 중...${NC}"
    backup_current
    
    # PM2 프로세스 중지
    echo -e "${YELLOW}서비스 중지 중...${NC}"
    pm2 delete webapp 2>/dev/null || true
    
    # 현재 파일들 백업
    TEMP_BACKUP="${BACKUP_DIR}/temp_before_restore_${TIMESTAMP}.tar.gz"
    tar -czf "$TEMP_BACKUP" -C "$(dirname "$PROJECT_DIR")" "$(basename "$PROJECT_DIR")"
    
    # 복원 수행
    cd "$(dirname "$PROJECT_DIR")"
    tar -xzf "$backup_file"
    
    # 서비스 재시작
    echo -e "${YELLOW}서비스 재시작 중...${NC}"
    cd "$PROJECT_DIR"
    pm2 start ecosystem.config.cjs 2>/dev/null || true
    
    echo -e "${GREEN}✅ 복원 완료${NC}"
    echo -e "${BLUE}💡 임시 백업: $TEMP_BACKUP${NC}"
    
    return 0
}

# Git 롤백
rollback_git() {
    echo -e "${YELLOW}🔄 Git 롤백 수행 중...${NC}"
    
    cd "$PROJECT_DIR"
    
    # 현재 상태 백업
    backup_current
    
    # PM2 프로세스 중지
    pm2 delete webapp 2>/dev/null || true
    
    # Git 롤백 (마지막 커밋으로)
    git reset --hard HEAD~1
    
    # 서비스 재시작
    pm2 start ecosystem.config.cjs 2>/dev/null || true
    
    echo -e "${GREEN}✅ Git 롤백 완료${NC}"
    
    return 0
}

# 백업 정리
clean_backups() {
    echo -e "${YELLOW}🧹 오래된 백업 정리 중...${NC}"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${BLUE}정리할 백업이 없습니다.${NC}"
        return 0
    fi
    
    # 7일 이상 된 백업 파일 삭제
    find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +7 -delete
    find "$BACKUP_DIR" -name "*.commit" -type f -mtime +7 -delete
    
    echo -e "${GREEN}✅ 정리 완료${NC}"
    
    return 0
}

# 현재 상태 확인
check_status() {
    echo -e "${BLUE}📊 시스템 상태 확인${NC}"
    echo ""
    
    # PM2 상태
    echo -e "${PURPLE}PM2 서비스 상태:${NC}"
    pm2 list | grep webapp || echo "webapp 서비스가 실행되지 않음"
    echo ""
    
    # Git 상태
    echo -e "${PURPLE}Git 상태:${NC}"
    cd "$PROJECT_DIR"
    git status --porcelain | head -10
    echo ""
    
    # 마지막 커밋
    echo -e "${PURPLE}마지막 커밋:${NC}"
    git log -1 --oneline
    echo ""
    
    # 백업 개수
    echo -e "${PURPLE}백업 파일 개수:${NC}"
    if [ -d "$BACKUP_DIR" ]; then
        backup_count=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
        echo "${backup_count}개 백업 파일"
    else
        echo "0개 백업 파일"
    fi
    
    return 0
}

# 메인 실행 부분
case "${1:-help}" in
    "backup")
        backup_current
        ;;
    "list")
        list_backups
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "rollback")
        rollback_git
        ;;
    "clean")
        clean_backups
        ;;
    "status")
        check_status
        ;;
    "help"|*)
        show_help
        ;;
esac