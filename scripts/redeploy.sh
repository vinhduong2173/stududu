#!/bin/bash
# ==============================================================================
# Stududu Redeployment Script for Linux / VPS (Bash)
# Flow: Kill Containers -> Delete Old Images -> Fetch Code -> Build -> Run
# ==============================================================================

set -e

BRANCH="${1:-}"

echo -e "\n======================================================="
echo -e "   🚀 STUDUDU AUTOMATED DEPLOYMENT / REDEPLOY SCRIPT   "
echo -e "=======================================================\n"

# 1. Kill Containers
echo -e "\033[1;33m[1/5] 🛑 Đang dừng & gỡ bỏ các container cũ (Kill containers)...\033[0m"
docker compose down --remove-orphans || docker-compose down --remove-orphans || true
echo -e "\033[1;32m  -> Đã dừng container thành công!\033[0m\n"

# 2 & 3. Delete Old Images
echo -e "\033[1;33m[2/5] 🗑️  Đang dọn dẹp và xóa các Docker Image cũ (Delete old images)...\033[0m"
docker images "stududu-main*" -q | xargs -r docker rmi -f || true
docker image prune -f || true
echo -e "\033[1;32m  -> Dọn dẹp image hoàn tất!\033[0m\n"

# 4. Fetch Code
echo -e "\033[1;33m[3/5] 📥 Đang cập nhật mã nguồn mới từ Git (Fetch & Pull code)...\033[0m"
git fetch origin
if [ -n "$BRANCH" ]; then
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    CURRENT_BRANCH=$(git branch --show-current)
    echo -e "\033[1;36m  -> Đang ở nhánh: $CURRENT_BRANCH\033[0m"
    git pull origin "$CURRENT_BRANCH"
fi
echo -e "\033[1;32m  -> Cập nhật code mới nhất thành công!\033[0m\n"

# 5. Docker Build
echo -e "\033[1;33m[4/5] 🔨 Đang đóng gói bản dựng mới (Docker build --no-cache)...\033[0m"
docker compose build --no-cache || docker-compose build --no-cache
echo -e "\033[1;32m  -> Build image mới hoàn tất!\033[0m\n"

# 6. Docker Run
echo -e "\033[1;33m[5/5] 🚀 Đang khởi chạy hệ thống (Docker run / up -d)...\033[0m"
docker compose up -d || docker-compose up -d
echo -e "\033[1;32m  -> Hệ thống đã khởi chạy thành công!\033[0m\n"

# Summary
echo -e "======================================================="
echo -e "               🎉 TRIỂN KHAI HOÀN TẤT                 "
echo -e "======================================================="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
