# ==============================================================================
# Stududu Redeployment Script for Windows (PowerShell)
# Flow: Kill Containers -> Delete Old Images -> Fetch Code -> Build -> Run
# ==============================================================================

param (
    [string]$Branch = ""
)

$ErrorActionPreference = "Stop"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "   🚀 STUDUDU AUTOMATED DEPLOYMENT / REDEPLOY SCRIPT   " -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# BƯỚC 1: Kill Containers (Dừng & Xóa các container đang chạy)
# ------------------------------------------------------------------------------
Write-Host "[1/5] 🛑 Đang dừng & gỡ bỏ các container cũ (Kill containers)..." -ForegroundColor Yellow
try {
    docker-compose down --remove-orphans
    Write-Host "  -> Đã dừng container thành công!`n" -ForegroundColor Green
} catch {
    Write-Host "  -> Lưu ý: Không có container nào đang chạy hoặc docker-compose đã dừng.`n" -ForegroundColor DarkGray
}

# ------------------------------------------------------------------------------
# BƯỚC 2 & 3: Docker Image & Delete Image (Xóa các Image cũ của dự án)
# ------------------------------------------------------------------------------
Write-Host "[2/5] 🗑️  Đang dọn dẹp và xóa các Docker Image cũ (Delete old images)..." -ForegroundColor Yellow
try {
    # Xóa image local build của dự án để tránh cache cũ
    $images = docker images "stududu-main*" -q
    if ($images) {
        docker rmi -f $images | Out-Null
        Write-Host "  -> Đã xóa các image stududu cũ!" -ForegroundColor Green
    }
    # Dọn dẹp dangling images (image rác không tên)
    docker image prune -f | Out-Null
    Write-Host "  -> Dọn dẹp image hoàn tất!`n" -ForegroundColor Green
} catch {
    Write-Host "  -> Đã dọn dẹp image.`n" -ForegroundColor DarkGray
}

# ------------------------------------------------------------------------------
# BƯỚC 4: Fetch Code (Lấy code mới nhất từ GitHub)
# ------------------------------------------------------------------------------
Write-Host "[3/5] 📥 Đang cập nhật mã nguồn mới từ Git (Fetch & Pull code)..." -ForegroundColor Yellow
try {
    git fetch origin
    if ($Branch -ne "") {
        git checkout $Branch
        git pull origin $Branch
    } else {
        $currentBranch = (git branch --show-current).Trim()
        Write-Host "  -> Đang ở nhánh: $currentBranch" -ForegroundColor Cyan
        git pull origin $currentBranch
    }
    Write-Host "  -> Cập nhật code mới nhất thành công!`n" -ForegroundColor Green
} catch {
    Write-Host "  -> Cảnh báo khi git pull, tiếp tục build với code hiện tại.`n" -ForegroundColor DarkYellow
}

# ------------------------------------------------------------------------------
# BƯỚC 5: Docker Build (Đóng gói Image mới không dùng cache cũ)
# ------------------------------------------------------------------------------
Write-Host "[4/5] 🔨 Đang đóng gói bản dựng mới (Docker build --no-cache)..." -ForegroundColor Yellow
docker-compose build --no-cache
Write-Host "  -> Build image mới hoàn tất!`n" -ForegroundColor Green

# ------------------------------------------------------------------------------
# BƯỚC 6: Docker Run (Khởi chạy hệ thống)
# ------------------------------------------------------------------------------
Write-Host "[5/5] 🚀 Đang khởi chạy hệ thống (Docker run / up -d)..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "  -> Hệ thống đã khởi chạy thành công!`n" -ForegroundColor Green

# ------------------------------------------------------------------------------
# TỔNG KẾT & KIỂM TRA TRẠNG THÁI
# ------------------------------------------------------------------------------
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "               🎉 TRIỂN KHAI HOÀN TẤT                 " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host "`n🌐 Địa chỉ truy cập:" -ForegroundColor White
Write-Host "   - Ứng dụng chính (Nginx): http://localhost" -ForegroundColor Green
Write-Host "   - Frontend trực tiếp:     http://localhost:3000" -ForegroundColor Gray
Write-Host "   - Backend API trực tiếp:  http://localhost:3001`n" -ForegroundColor Gray
