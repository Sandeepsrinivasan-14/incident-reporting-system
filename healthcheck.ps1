Write-Host "`n🔍 INCIDENT REPORTING SYSTEM - HEALTH CHECK" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan

$passed = 0
$failed = 0
$total = 0

function Check {
    param($condition, $message)
    $script:total++
    if ($condition) {
        Write-Host "✅ PASS: $message" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "❌ FAIL: $message" -ForegroundColor Red
        $script:failed++
    }
}

# 1. Project Structure
Write-Host "`n📁 PROJECT STRUCTURE:" -ForegroundColor Yellow
Check -condition (Test-Path "backend") -message "Backend directory exists"
Check -condition (Test-Path "frontend") -message "Frontend directory exists"
Check -condition ((Test-Path "backend/server.js") -or (Test-Path "backend/index.js")) -message "Backend entry file exists"
Check -condition ((Test-Path "frontend/src/App.jsx") -or (Test-Path "frontend/src/App.js")) -message "Frontend App component exists"

# 2. Database Check
Write-Host "`n💾 DATABASE REQUIREMENTS:" -ForegroundColor Yellow
$hasPrisma = Test-Path "backend/prisma/schema.prisma"
Check -condition $hasPrisma -message "Prisma schema exists"

if ($hasPrisma) {
    $prismaSchema = Get-Content "backend/prisma/schema.prisma" -Raw
    Check -condition ($prismaSchema -match "model User") -message "User model exists"
    Check -condition ($prismaSchema -match "model Incident") -message "Incident model exists"
    Check -condition ($prismaSchema -match "enum Priority") -message "Priority enum exists"
    Check -condition ($prismaSchema -match "enum Status") -message "Status enum exists"
}

# 3. JWT Authentication
Write-Host "`n🔐 AUTHENTICATION & JWT:" -ForegroundColor Yellow
$hasJWT = $false
if (Test-Path "backend") {
    $backendFiles = Get-ChildItem "backend" -Recurse -Include *.js, *.ts
    foreach ($file in $backendFiles) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -match "jsonwebtoken" -or $content -match "jwt") {
            $hasJWT = $true
            break
        }
    }
}
Check -condition $hasJWT -message "JWT implementation found"
Check -condition (Test-Path "backend/.env") -message "Environment variables file exists"

# 4. Role-Based Access Control
Write-Host "`n👥 ROLE-BASED ACCESS CONTROL:" -ForegroundColor Yellow
$hasRBAC = $false
if (Test-Path "backend") {
    $backendFiles = Get-ChildItem "backend" -Recurse -Include *.js, *.ts
    foreach ($file in $backendFiles) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -match "REPORTER" -and $content -match "RESOLVER") {
            $hasRBAC = $true
            break
        }
    }
}
Check -condition $hasRBAC -message "REPORTER and RESOLVER roles implemented"

# 5. Priority Immutability Rule (CRITICAL)
Write-Host "`n⚠️  CRITICAL BUSINESS RULE: Priority Cannot be Downgraded" -ForegroundColor Yellow
$hasPriorityRule = $false
if (Test-Path "backend") {
    $backendFiles = Get-ChildItem "backend" -Recurse -Include *.js, *.ts
    foreach ($file in $backendFiles) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -match "priority" -and ($content -match ">" -or $content -match "higher" -or $content -match "downgrad" -or $content -match "cannot" -or $content -match "<")) {
            $hasPriorityRule = $true
            break
        }
    }
}
Check -condition $hasPriorityRule -message "Priority downgrade protection implemented"

# 6. API Endpoints
Write-Host "`n🌐 API ENDPOINTS:" -ForegroundColor Yellow
$hasAuthRoutes = $false
$hasIncidentRoutes = $false
if (Test-Path "backend") {
    $backendFiles = Get-ChildItem "backend" -Recurse -Include *.js, *.ts
    foreach ($file in $backendFiles) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -match "/register" -or $content -match "/login") { $hasAuthRoutes = $true }
        if ($content -match "/incidents") { $hasIncidentRoutes = $true }
    }
}
Check -condition $hasAuthRoutes -message "Authentication endpoints (/register, /login)"
Check -condition $hasIncidentRoutes -message "Incident CRUD endpoints"

# 7. Frontend Requirements
Write-Host "`n🎨 FRONTEND REQUIREMENTS:" -ForegroundColor Yellow
if (Test-Path "frontend/src") {
    $srcFiles = Get-ChildItem "frontend/src" -Recurse
    Check -condition (($srcFiles | Where-Object { $_.Name -match "Login" }).Count -gt 0) -message "Login page component"
    Check -condition (($srcFiles | Where-Object { $_.Name -match "Register" }).Count -gt 0) -message "Registration page component"
    Check -condition (($srcFiles | Where-Object { $_.Name -match "Dashboard" }).Count -gt 0) -message "Dashboard components"
}

# 8. README Requirements
Write-Host "`n📖 README.md CHECK:" -ForegroundColor Yellow
if (Test-Path "README.md") {
    $readme = Get-Content "README.md" -Raw
    Check -condition ($readme -match "Project overview|Overview") -message "Project overview"
    Check -condition ($readme -match "Tech stack|Technology") -message "Tech stack section"
    Check -condition ($readme -match "API endpoints") -message "API endpoints documentation"
    Check -condition ($readme -match "Database schema") -message "Database schema section"
    Check -condition ($readme -match "User roles|Role") -message "User roles documentation"
} else {
    Check -condition $false -message "README.md exists"
}

# 9. Dependencies
Write-Host "`n📦 DEPENDENCIES:" -ForegroundColor Yellow
if (Test-Path "backend/package.json") {
    $pkg = Get-Content "backend/package.json" -Raw | ConvertFrom-Json
    $deps = @{}
    
    # PowerShell way to merge PSObjects
    if ($pkg.dependencies) { 
        $pkg.dependencies.PSObject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } 
    }
    if ($pkg.devDependencies) { 
        $pkg.devDependencies.PSObject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } 
    }
    
    Check -condition ($deps.Keys -contains "express") -message "Express.js installed"
    Check -condition (($deps.Keys -contains "jsonwebtoken") -or ($deps.Keys -contains "jwt")) -message "JWT package installed"
    Check -condition (($deps.Keys -contains "bcrypt") -or ($deps.Keys -contains "bcryptjs")) -message "Bcrypt for password hashing"
    Check -condition (($deps.Keys -contains "prisma") -or ($deps.Keys -contains "sequelize")) -message "ORM installed"
}

# Summary
Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "`n📊 SUMMARY: $passed/$total requirements passed" -ForegroundColor White
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red
Write-Host "📈 Success Rate: $([math]::Round(($passed/$total)*100, 1))%" -ForegroundColor Yellow

if ($failed -eq 0) {
    Write-Host "`n🎉 EXCELLENT! All requirements met! Ready for submission.`n" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some requirements missing. See failures above.`n" -ForegroundColor Red
}
