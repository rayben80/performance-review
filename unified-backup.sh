#!/bin/bash

# 통합 백업 관리 시스템
# 로컬 백업 + GitHub 백업을 통합 관리

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="/home/user/webapp"

# 메뉴 표시 함수
show_main_menu() {
    clear
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║               🚀 통합 백업 관리 시스템                    ║${NC}"
    echo -e "${CYAN}║          클라우드사업본부 업무평가 시스템                  ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}📦 로컬 백업 관리${NC}"
    echo "  1) 로컬 백업 생성"
    echo "  2) 로컬 백업 목록"
    echo "  3) 로컬 백업 복원"
    echo "  4) Git 롤백"
    echo ""
    echo -e "${BLUE}🐙 GitHub 백업 관리${NC}"
    echo "  5) GitHub 백업 (커밋 + 푸시)"
    echo "  6) GitHub 버전 태그 생성"
    echo "  7) 안정 버전 생성"
    echo "  8) GitHub 버전 목록"
    echo "  9) GitHub에서 가져오기"
    echo " 10) 특정 버전으로 복원"
    echo ""
    echo -e "${PURPLE}📊 상태 및 관리${NC}"
    echo " 11) 통합 상태 확인"
    echo " 12) 커밋 히스토리"
    echo " 13) GitHub 완전 동기화"
    echo " 14) 백업 정리"
    echo ""
    echo -e "${YELLOW}🔧 고급 기능${NC}"
    echo " 15) 자동 백업 설정"
    echo " 16) 백업 스케줄링"
    echo ""
    echo " 17) 종료"
    echo ""
    echo -n "선택하세요 (1-17): "
}

# 로컬 백업 생성
create_local_backup() {
    echo -e "${YELLOW}📦 로컬 백업 생성 중...${NC}"
    cd "$PROJECT_DIR"
    ./backup-system.sh backup
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

# 로컬 백업 목록
show_local_backups() {
    echo -e "${BLUE}📋 로컬 백업 목록${NC}"
    cd "$PROJECT_DIR"
    ./backup-system.sh list
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

# 로컬 백업 복원
restore_local_backup() {
    echo -e "${BLUE}📋 사용 가능한 백업:${NC}"
    cd "$PROJECT_DIR"
    ./backup-system.sh list
    echo ""
    read -p "복원할 백업 파일명을 입력하세요: " backup_file
    if [ -n "$backup_file" ]; then
        ./backup-system.sh restore "$backup_file"
    fi
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

# Git 롤백
perform_git_rollback() {
    echo -e "${RED}⚠️  Git 롤백을 수행하시겠습니까?${NC}"
    echo -e "${YELLOW}현재 변경사항은 자동으로 백업됩니다.${NC}"
    read -p "계속하시겠습니까? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        cd "$PROJECT_DIR"
        ./backup-system.sh rollback
    else
        echo "롤백이 취소되었습니다."
    fi
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

# GitHub 백업
create_github_backup() {
    echo -e "${BLUE}🐙 GitHub 백업 생성${NC}"
    read -p "커밋 메시지를 입력하세요 (엔터: 자동 메시지): " commit_msg
    cd "$PROJECT_DIR"
    ./github-backup.sh backup "$commit_msg"
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

# GitHub 버전 태그 생성
create_github_version() {
    echo -e "${BLUE}🏷️  GitHub 버전 태그 생성${NC}"
    read -p "버전명을 입력하세요 (예: v1.2.3, 엔터: 자동): " version
    cd "$PROJECT_DIR"
    ./github-backup.sh version "$version"
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

# 안정 버전 생성
create_stable_version() {
    echo -e "${GREEN}🌟 안정 버전 생성${NC}"
    echo -e "${YELLOW}현재 상태를 안정 버전으로 태그합니다.${NC}"
    read -p "계속하시겠습니까? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        cd "$PROJECT_DIR"
        ./github-backup.sh stable
    else
        echo "취소되었습니다."
    fi
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

# GitHub 버전 목록
show_github_versions() {
    echo -e "${BLUE}🏷️  GitHub 버전 목록${NC}"
    cd "$PROJECT_DIR"
    ./github-backup.sh versions
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

# GitHub에서 가져오기
pull_from_github() {
    echo -e "${CYAN}📥 GitHub에서 최신 변경사항 가져오기${NC}"
    cd "$PROJECT_DIR"
    ./github-backup.sh pull
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

# 특정 버전으로 복원
restore_github_version() {
    echo -e "${BLUE}🔄 GitHub 버전 복원${NC}"
    echo ""
    cd "$PROJECT_DIR"
    ./github-backup.sh versions
    echo ""
    read -p "복원할 버전 태그를 입력하세요: " version_tag
    if [ -n "$version_tag" ]; then
        ./github-backup.sh restore "$version_tag"
    fi
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

# 통합 상태 확인
show_integrated_status() {
    echo -e "${PURPLE}📊 통합 시스템 상태${NC}"
    echo ""
    
    echo -e "${BLUE}=== 로컬 백업 상태 ===${NC}"
    cd "$PROJECT_DIR"
    ./backup-system.sh status
    echo ""
    
    echo -e "${BLUE}=== GitHub 상태 ===${NC}"
    ./github-backup.sh status
    echo ""
    
    read -p "계속하려면 Enter를 누르세요..."
}

# 커밋 히스토리
show_commit_history() {
    echo -e "${PURPLE}📜 커밋 히스토리${NC}"
    cd "$PROJECT_DIR"
    ./github-backup.sh log
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

# GitHub 완전 동기화
sync_with_github() {
    echo -e "${CYAN}🔄 GitHub 완전 동기화${NC}"
    echo -e "${YELLOW}로컬과 GitHub를 완전히 동기화합니다.${NC}"
    read -p "계속하시겠습니까? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        cd "$PROJECT_DIR"
        ./github-backup.sh sync
    else
        echo "취소되었습니다."
    fi
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

# 백업 정리
clean_backups() {
    echo -e "${YELLOW}🧹 백업 정리${NC}"
    echo ""
    echo "1) 로컬 백업 정리 (7일 이상)"
    echo "2) Git 브랜치 정리"
    echo "3) 모두 정리"
    echo ""
    read -p "선택하세요 (1-3): " clean_choice
    
    cd "$PROJECT_DIR"
    case $clean_choice in
        1)
            ./backup-system.sh clean
            ;;
        2)
            ./github-backup.sh clean
            ;;
        3)
            ./backup-system.sh clean
            ./github-backup.sh clean
            ;;
        *)
            echo "취소되었습니다."
            ;;
    esac
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

# 자동 백업 설정
setup_auto_backup() {
    echo -e "${YELLOW}⚙️  자동 백업 설정${NC}"
    echo ""
    echo "자동 백업 cron 작업을 설정합니다:"
    echo "1) 매일 자정 백업"
    echo "2) 매주 일요일 백업"
    echo "3) 사용자 정의 스케줄"
    echo ""
    read -p "선택하세요 (1-3): " schedule_choice
    
    case $schedule_choice in
        1)
            echo "0 0 * * * cd $PROJECT_DIR && ./unified-backup.sh auto-daily" | crontab -
            echo -e "${GREEN}✅ 매일 자정 자동 백업이 설정되었습니다.${NC}"
            ;;
        2)
            echo "0 0 * * 0 cd $PROJECT_DIR && ./unified-backup.sh auto-weekly" | crontab -
            echo -e "${GREEN}✅ 매주 일요일 자동 백업이 설정되었습니다.${NC}"
            ;;
        3)
            echo "cron 형식으로 입력하세요 (예: 0 2 * * 1-5)"
            read -p "스케줄: " custom_schedule
            echo "$custom_schedule cd $PROJECT_DIR && ./unified-backup.sh auto-custom" | crontab -
            echo -e "${GREEN}✅ 사용자 정의 자동 백업이 설정되었습니다.${NC}"
            ;;
    esac
    echo ""
    read -p "계속하려면 Enter를 누르세요..."
}

# 자동 백업 실행 함수들
auto_daily_backup() {
    cd "$PROJECT_DIR"
    ./backup-system.sh backup
    ./github-backup.sh backup "🤖 AUTO: Daily backup $(date '+%Y-%m-%d')"
}

auto_weekly_backup() {
    cd "$PROJECT_DIR"
    ./backup-system.sh backup
    ./github-backup.sh stable
}

auto_custom_backup() {
    cd "$PROJECT_DIR"
    ./backup-system.sh backup
    ./github-backup.sh backup "🤖 AUTO: Custom backup $(date '+%Y-%m-%d %H:%M')"
}

# 메인 루프
main_loop() {
    while true; do
        show_main_menu
        read choice
        
        case $choice in
            1) create_local_backup ;;
            2) show_local_backups ;;
            3) restore_local_backup ;;
            4) perform_git_rollback ;;
            5) create_github_backup ;;
            6) create_github_version ;;
            7) create_stable_version ;;
            8) show_github_versions ;;
            9) pull_from_github ;;
            10) restore_github_version ;;
            11) show_integrated_status ;;
            12) show_commit_history ;;
            13) sync_with_github ;;
            14) clean_backups ;;
            15) setup_auto_backup ;;
            16) echo "백업 스케줄링은 cron으로 관리됩니다." ; read -p "Enter..." ;;
            17) echo -e "${GREEN}시스템을 종료합니다.${NC}" ; exit 0 ;;
            *) echo -e "${RED}잘못된 선택입니다.${NC}" ; read -p "Enter..." ;;
        esac
    done
}

# 명령줄 인수 처리
case "${1:-menu}" in
    "auto-daily") auto_daily_backup ;;
    "auto-weekly") auto_weekly_backup ;;
    "auto-custom") auto_custom_backup ;;
    *) main_loop ;;
esac