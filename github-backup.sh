#!/bin/bash

# GitHub 백업 시스템 스크립트
# 클라우드사업본부 업무평가 시스템 GitHub 버전별 백업 관리

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 설정
PROJECT_DIR="/home/user/webapp"
GITHUB_REPO="https://github.com/rayben80/performance-review.git"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
VERSION_PREFIX="v"

# 도움말 함수
show_help() {
    echo -e "${BLUE}🐙 GitHub 백업 관리 도구${NC}"
    echo ""
    echo "사용법:"
    echo "  ./github-backup.sh [옵션]"
    echo ""
    echo "📦 백업 옵션:"
    echo "  backup [메시지]     - 변경사항 커밋 후 GitHub 푸시"
    echo "  version [버전명]    - 버전 태그 생성 및 릴리스"
    echo "  stable             - 안정 버전으로 태그 (자동 버전)"
    echo ""
    echo "📋 조회 옵션:"  
    echo "  list               - 로컬 백업 목록"
    echo "  versions           - GitHub 버전 목록"
    echo "  status             - Git/GitHub 상태"
    echo "  log                - 커밋 히스토리"
    echo ""
    echo "🔄 복원 옵션:"
    echo "  pull               - GitHub에서 최신 변경사항 가져오기"
    echo "  restore [태그/커밋] - 특정 버전으로 복원"
    echo "  sync               - GitHub와 동기화"
    echo ""
    echo "🧹 관리 옵션:"
    echo "  clean              - 오래된 로컬 브랜치 정리"
    echo "  help               - 이 도움말 표시"
}

# GitHub 백업 (커밋 + 푸시)
github_backup() {
    local message="$1"
    
    echo -e "${YELLOW}🐙 GitHub 백업 수행 중...${NC}"
    
    cd "$PROJECT_DIR"
    
    # 변경사항 확인
    if git diff --quiet && git diff --cached --quiet; then
        echo -e "${BLUE}💡 변경사항이 없습니다.${NC}"
        return 0
    fi
    
    # 기본 메시지 설정
    if [ -z "$message" ]; then
        message="🔄 AUTO BACKUP: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    # 스테이징 및 커밋
    git add .
    git commit -m "$message"
    
    # GitHub 푸시
    echo -e "${CYAN}📤 GitHub에 푸시 중...${NC}"
    git push origin main
    
    # 커밋 해시 가져오기
    local commit_hash=$(git rev-parse HEAD)
    local short_hash=$(git rev-parse --short HEAD)
    
    echo -e "${GREEN}✅ GitHub 백업 완료${NC}"
    echo -e "${BLUE}📍 커밋: ${short_hash}${NC}"
    echo -e "${BLUE}🔗 GitHub: ${GITHUB_REPO}${NC}"
    
    return 0
}

# 버전 태그 생성
create_version() {
    local version="$1"
    
    cd "$PROJECT_DIR"
    
    # 버전명이 없으면 자동 생성
    if [ -z "$version" ]; then
        # 마지막 태그 가져오기
        local last_tag=$(git tag -l "${VERSION_PREFIX}*" | sort -V | tail -1)
        if [ -z "$last_tag" ]; then
            version="${VERSION_PREFIX}1.0.0"
        else
            # 버전 번호 증가 (예: v1.0.0 -> v1.0.1)
            local last_version=${last_tag#$VERSION_PREFIX}
            local patch_version=$(echo $last_version | cut -d. -f3)
            local new_patch=$((patch_version + 1))
            local major_minor=$(echo $last_version | cut -d. -f1-2)
            version="${VERSION_PREFIX}${major_minor}.${new_patch}"
        fi
    fi
    
    echo -e "${YELLOW}🏷️  버전 태그 생성 중: ${version}${NC}"
    
    # 현재 변경사항 커밋 (있다면)
    if ! git diff --quiet || ! git diff --cached --quiet; then
        git add .
        git commit -m "🚀 RELEASE: ${version} 버전 준비"
    fi
    
    # 태그 생성 및 푸시
    git tag -a "$version" -m "📦 Release ${version}: $(date '+%Y-%m-%d %H:%M:%S')"
    git push origin main
    git push origin "$version"
    
    echo -e "${GREEN}✅ 버전 ${version} 생성 완료${NC}"
    echo -e "${BLUE}🔗 GitHub 릴리스: ${GITHUB_REPO}/releases/tag/${version}${NC}"
    
    return 0
}

# 안정 버전 태그 생성
create_stable_version() {
    echo -e "${YELLOW}🌟 안정 버전 생성 중...${NC}"
    
    cd "$PROJECT_DIR"
    
    # 현재 시점의 안정 버전 생성
    local stable_version="${VERSION_PREFIX}stable-${TIMESTAMP}"
    
    # 변경사항 커밋
    if ! git diff --quiet || ! git diff --cached --quiet; then
        git add .
        git commit -m "✅ STABLE: 안정 버전 ${stable_version}"
    fi
    
    # 안정 태그 생성
    git tag -a "$stable_version" -m "🌟 Stable Release: $(date '+%Y-%m-%d %H:%M:%S')

🔧 주요 기능:
- 드래그앤드롭 문제 해결
- 사이드바 패널 시스템
- Excel 업로드/다운로드
- 백업/복원 시스템
- GitHub 버전 관리

🎯 이 버전은 검증된 안정 버전입니다."
    
    git push origin main
    git push origin "$stable_version"
    
    echo -e "${GREEN}✅ 안정 버전 ${stable_version} 생성 완료${NC}"
    
    return 0
}

# GitHub 버전 목록 조회
list_github_versions() {
    echo -e "${BLUE}🏷️  GitHub 버전 목록${NC}"
    echo ""
    
    cd "$PROJECT_DIR"
    
    # 원격 태그 가져오기
    git fetch --tags 2>/dev/null || true
    
    # 태그 목록 표시
    if git tag -l | grep -q .; then
        echo -e "${PURPLE}버전          날짜/시간${NC}"
        echo "--------------------------------"
        
        git tag -l --sort=-version:refname | while read tag; do
            # 태그의 커밋 날짜 가져오기
            local commit_date=$(git log -1 --format=%cd --date=format:'%Y-%m-%d %H:%M:%S' "$tag" 2>/dev/null)
            if [ -n "$commit_date" ]; then
                echo -e "${tag}      ${commit_date}"
            else
                echo -e "${tag}      (날짜 불명)"
            fi
        done
        
        echo ""
        echo -e "${CYAN}💡 최신 태그: $(git tag -l --sort=-version:refname | head -1)${NC}"
    else
        echo -e "${YELLOW}생성된 버전이 없습니다.${NC}"
    fi
    
    return 0
}

# GitHub에서 가져오기
github_pull() {
    echo -e "${CYAN}📥 GitHub에서 최신 변경사항 가져오는 중...${NC}"
    
    cd "$PROJECT_DIR"
    
    # 변경사항 백업
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo -e "${YELLOW}⚠️  현재 변경사항을 임시 저장합니다...${NC}"
        git stash push -m "임시 저장: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    # GitHub에서 가져오기
    git fetch origin
    git merge origin/main
    
    # 임시 저장된 변경사항이 있으면 복원 제안
    if git stash list | grep -q "임시 저장"; then
        echo -e "${BLUE}💡 임시 저장된 변경사항이 있습니다.${NC}"
        echo -e "${BLUE}   복원하려면: git stash pop${NC}"
    fi
    
    echo -e "${GREEN}✅ GitHub 동기화 완료${NC}"
    
    return 0
}

# 특정 버전으로 복원
restore_version() {
    local version="$1"
    
    if [ -z "$version" ]; then
        echo -e "${RED}❌ 복원할 버전을 지정하세요.${NC}"
        list_github_versions
        return 1
    fi
    
    echo -e "${YELLOW}🔄 버전 ${version}으로 복원 중...${NC}"
    
    cd "$PROJECT_DIR"
    
    # 현재 상태 백업
    echo -e "${BLUE}💾 현재 상태 백업 중...${NC}"
    ./backup-system.sh backup
    
    # PM2 서비스 중지
    pm2 delete webapp 2>/dev/null || true
    
    # 버전으로 체크아웃
    git fetch --tags 2>/dev/null || true
    git checkout "$version"
    
    # 새 브랜치 생성 (태그는 수정 불가이므로)
    local restore_branch="restore-${version}-${TIMESTAMP}"
    git checkout -b "$restore_branch"
    git checkout main
    git merge "$restore_branch"
    
    # 브랜치 정리
    git branch -D "$restore_branch"
    
    # 서비스 재시작
    echo -e "${YELLOW}🚀 서비스 재시작 중...${NC}"
    pm2 start ecosystem.config.cjs 2>/dev/null || true
    
    echo -e "${GREEN}✅ 버전 ${version} 복원 완료${NC}"
    
    return 0
}

# GitHub와 동기화
sync_github() {
    echo -e "${CYAN}🔄 GitHub 완전 동기화 중...${NC}"
    
    cd "$PROJECT_DIR"
    
    # 로컬 변경사항 커밋
    if ! git diff --quiet || ! git diff --cached --quiet; then
        git add .
        git commit -m "🔄 SYNC: 동기화 전 로컬 변경사항 커밋"
    fi
    
    # GitHub에서 가져오기
    git fetch origin
    
    # 충돌 방지를 위한 병합
    if ! git merge origin/main --no-edit; then
        echo -e "${RED}❌ 병합 충돌이 발생했습니다.${NC}"
        echo -e "${YELLOW}수동으로 충돌을 해결한 후 다음 명령을 실행하세요:${NC}"
        echo "  git add ."
        echo "  git commit -m 'Resolve merge conflicts'"
        echo "  git push origin main"
        return 1
    fi
    
    # GitHub로 푸시
    git push origin main
    
    # 태그도 동기화
    git push --tags
    
    echo -e "${GREEN}✅ GitHub 완전 동기화 완료${NC}"
    
    return 0
}

# Git 상태 확인
check_git_status() {
    echo -e "${BLUE}📊 Git/GitHub 상태 확인${NC}"
    echo ""
    
    cd "$PROJECT_DIR"
    
    # 브랜치 정보
    echo -e "${PURPLE}현재 브랜치:${NC}"
    git branch --show-current
    echo ""
    
    # 원격 저장소 정보
    echo -e "${PURPLE}원격 저장소:${NC}"
    git remote -v | head -1
    echo ""
    
    # 로컬 변경사항
    echo -e "${PURPLE}로컬 변경사항:${NC}"
    if git diff --quiet && git diff --cached --quiet; then
        echo "변경사항 없음"
    else
        git status --porcelain | head -5
    fi
    echo ""
    
    # GitHub와의 동기화 상태
    echo -e "${PURPLE}GitHub 동기화 상태:${NC}"
    git fetch origin 2>/dev/null || true
    local ahead=$(git rev-list --count HEAD ^origin/main 2>/dev/null || echo "0")
    local behind=$(git rev-list --count origin/main ^HEAD 2>/dev/null || echo "0")
    
    if [ "$ahead" -gt 0 ]; then
        echo -e "${YELLOW}⬆️  GitHub보다 ${ahead}개 커밋 앞섬 (푸시 필요)${NC}"
    elif [ "$behind" -gt 0 ]; then
        echo -e "${YELLOW}⬇️  GitHub보다 ${behind}개 커밋 뒤처짐 (풀 필요)${NC}"
    else
        echo -e "${GREEN}✅ GitHub와 동기화됨${NC}"
    fi
    echo ""
    
    # 최근 커밋
    echo -e "${PURPLE}최근 커밋 (최대 3개):${NC}"
    git log --oneline -3
    echo ""
    
    # 태그 정보
    echo -e "${PURPLE}생성된 버전 수:${NC}"
    local tag_count=$(git tag -l | wc -l)
    echo "${tag_count}개"
    
    return 0
}

# 커밋 히스토리 조회
show_commit_log() {
    echo -e "${BLUE}📜 커밋 히스토리${NC}"
    echo ""
    
    cd "$PROJECT_DIR"
    
    # 그래프 형태로 로그 표시
    git log --oneline --graph --decorate --all -10
    
    return 0
}

# 오래된 브랜치 정리
clean_branches() {
    echo -e "${YELLOW}🧹 로컬 브랜치 정리 중...${NC}"
    
    cd "$PROJECT_DIR"
    
    # 병합된 로컬 브랜치 삭제 (main 제외)
    git branch --merged | grep -v "\* main" | grep -v "main" | xargs -r git branch -d
    
    # 원격 추적 브랜치 정리
    git remote prune origin
    
    echo -e "${GREEN}✅ 브랜치 정리 완료${NC}"
    
    return 0
}

# 메인 실행 부분
case "${1:-help}" in
    "backup")
        github_backup "$2"
        ;;
    "version")
        create_version "$2"
        ;;
    "stable")
        create_stable_version
        ;;
    "list")
        ./backup-system.sh list
        ;;
    "versions")
        list_github_versions
        ;;
    "pull")
        github_pull
        ;;
    "restore")
        restore_version "$2"
        ;;
    "sync")
        sync_github
        ;;
    "status")
        check_git_status
        ;;
    "log")
        show_commit_log
        ;;
    "clean")
        clean_branches
        ;;
    "help"|*)
        show_help
        ;;
esac