#!/bin/bash

# 🕒 자동 백업 스케줄러 설정
# 주기적으로 자동 백업을 실행하도록 설정

echo "🕒 자동 백업 스케줄러 설정 중..."

PROJECT_DIR="/home/user/webapp"
CRONTAB_FILE="/tmp/webapp_crontab"

# 현재 crontab 백업
crontab -l > "$CRONTAB_FILE" 2>/dev/null || touch "$CRONTAB_FILE"

# 기존 webapp 백업 작업 제거 (중복 방지)
sed -i '/webapp.*backup/d' "$CRONTAB_FILE"

# 새로운 자동 백업 작업 추가
cat >> "$CRONTAB_FILE" << EOF
# 📦 webapp 자동 백업 (매 30분마다)
*/30 * * * * cd $PROJECT_DIR && ./scripts/auto-backup.sh >> /tmp/webapp-backup.log 2>&1

# 🚀 webapp 빠른 저장 (매 10분마다 변경사항이 있을 때만)
*/10 * * * * cd $PROJECT_DIR && ./scripts/quick-save.sh >> /tmp/webapp-save.log 2>&1

EOF

# 새로운 crontab 설치
crontab "$CRONTAB_FILE"

echo "✅ 자동 백업 스케줄러 설정 완료!"
echo "📋 백업 스케줄:"
echo "   - 전체 백업: 매 30분마다"
echo "   - 빠른 저장: 매 10분마다"
echo "📂 로그 파일:"
echo "   - 백업 로그: /tmp/webapp-backup.log"
echo "   - 저장 로그: /tmp/webapp-save.log"

# 로그 파일 권한 설정
touch /tmp/webapp-backup.log /tmp/webapp-save.log
chmod 644 /tmp/webapp-backup.log /tmp/webapp-save.log

# 설정된 crontab 확인
echo -e "\n📋 설정된 crontab:"
crontab -l | grep webapp