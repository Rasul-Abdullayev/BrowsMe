# BrowsMe Educational Browser - Runtime Dependency Enforcer
# Python LTS & Node.js LTS Dynamic Installer & Validator

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "      BrowsMe - Python və Node.js Quraşdırma Yoxlanışı   " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# -------------------------------------------------------------------
# Köməkçi: PATH mühit dəyişənini yeniləmək
# -------------------------------------------------------------------
function Update-EnvPath {
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    $extraPaths = @(
        "$env:ProgramFiles\nodejs",
        "${env:ProgramFiles(x86)}\nodejs",
        "$env:LOCALAPPDATA\Programs\nodejs",
        "$env:ProgramFiles\Python313",
        "$env:ProgramFiles\Python313\Scripts",
        "$env:ProgramFiles\Python312",
        "$env:ProgramFiles\Python312\Scripts",
        "$env:ProgramFiles\Python311",
        "$env:ProgramFiles\Python311\Scripts",
        "$env:ProgramFiles\Python310",
        "$env:ProgramFiles\Python310\Scripts",
        "$env:SystemDrive\Python313",
        "$env:SystemDrive\Python312",
        "$env:SystemDrive\Python311",
        "$env:SystemDrive\Python310",
        "$env:LOCALAPPDATA\Programs\Python\Python313",
        "$env:LOCALAPPDATA\Programs\Python\Python313\Scripts",
        "$env:LOCALAPPDATA\Programs\Python\Python312",
        "$env:LOCALAPPDATA\Programs\Python\Python312\Scripts",
        "$env:LOCALAPPDATA\Programs\Python\Python311",
        "$env:LOCALAPPDATA\Programs\Python\Python311\Scripts"
    )
    
    $combined = "$machinePath;$userPath;" + ($extraPaths -join ";")
    $env:Path = $combined
}

# -------------------------------------------------------------------
# 1. Python mühitinin dəqiq yoxlanışı (WindowsApps fake stub istisna olunur)
# -------------------------------------------------------------------
function Test-PythonRuntime {
    Update-EnvPath

    # 1.1 py launcher yoxlanışı
    $pyLauncher = Get-Command py -ErrorAction SilentlyContinue
    if ($pyLauncher) {
        try {
            $out = & py -3 -c 'import sys; print("Python " + sys.version.split()[0])' 2>&1
            if ($LASTEXITCODE -eq 0 -and $out -match 'Python 3\.') {
                return @{ Installed = $true; Version = $out.ToString().Trim(); Executable = "py -3" }
            }
        } catch {}
    }

    # 1.2 python komandası yoxlanışı (WindowsApps dummy stub qəbul edilmir)
    $pyCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pyCmd -and $pyCmd.Source -notmatch 'WindowsApps') {
        try {
            $out = & $pyCmd.Source -c 'import sys; print("Python " + sys.version.split()[0])' 2>&1
            if ($LASTEXITCODE -eq 0 -and $out -match 'Python 3\.') {
                return @{ Installed = $true; Version = $out.ToString().Trim(); Executable = $pyCmd.Source }
            }
        } catch {}
    }

    # 1.3 Registry yoxlanışı (HKLM və HKCU)
    $regRoots = @('HKLM:\SOFTWARE\Python\PythonCore', 'HKCU:\SOFTWARE\Python\PythonCore')
    foreach ($root in $regRoots) {
        if (Test-Path $root) {
            $versions = Get-ChildItem $root -ErrorAction SilentlyContinue
            foreach ($v in $versions) {
                $vPath = $v.PSPath
                $ip = (Get-ItemProperty "$vPath\InstallPath" -ErrorAction SilentlyContinue).'(default)'
                if ($ip -and (Test-Path (Join-Path $ip 'python.exe'))) {
                    $exe = Join-Path $ip 'python.exe'
                    try {
                        $out = & $exe -c 'import sys; print("Python " + sys.version.split()[0])' 2>&1
                        if ($LASTEXITCODE -eq 0 -and $out -match 'Python 3\.') {
                            return @{ Installed = $true; Version = $out.ToString().Trim(); Executable = $exe }
                        }
                    } catch {}
                }
            }
        }
    }

    # 1.4 Standart disk qovluqları dinamik axtarışı
    $searchRoots = @(
        "$env:ProgramFiles\Python*",
        "${env:ProgramFiles(x86)}\Python*",
        "$env:SystemDrive\Python*",
        "$env:LOCALAPPDATA\Programs\Python\Python*"
    )
    foreach ($pattern in $searchRoots) {
        $dirs = Get-Item $pattern -ErrorAction SilentlyContinue
        foreach ($d in $dirs) {
            $candidate = Join-Path $d.FullName 'python.exe'
            if (Test-Path $candidate) {
                try {
                    $out = & $candidate -c 'import sys; print("Python " + sys.version.split()[0])' 2>&1
                    if ($LASTEXITCODE -eq 0 -and $out -match 'Python 3\.') {
                        return @{ Installed = $true; Version = $out.ToString().Trim(); Executable = $candidate }
                    }
                } catch {}
            }
        }
    }

    return @{ Installed = $false; Version = $null; Executable = $null }
}

# -------------------------------------------------------------------
# 2. Node.js mühitinin dəqiq yoxlanışı
# -------------------------------------------------------------------
function Test-NodeRuntime {
    Update-EnvPath

    # 2.1 node komandası
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCmd) {
        try {
            $out = & $nodeCmd.Source -v 2>&1
            if ($LASTEXITCODE -eq 0 -and $out -match '^v\d+') {
                return @{ Installed = $true; Version = $out.ToString().Trim(); Executable = $nodeCmd.Source }
            }
        } catch {}
    }

    # 2.2 Standart disk qovluqları
    $nodeDirs = @(
        "$env:ProgramFiles\nodejs\node.exe",
        "${env:ProgramFiles(x86)}\nodejs\node.exe",
        "$env:SystemDrive\nodejs\node.exe",
        "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
    )
    foreach ($nExe in $nodeDirs) {
        if (Test-Path $nExe) {
            try {
                $out = & $nExe -v 2>&1
                if ($LASTEXITCODE -eq 0 -and $out -match '^v\d+') {
                    return @{ Installed = $true; Version = $out.ToString().Trim(); Executable = $nExe }
                }
            } catch {}
        }
    }

    return @{ Installed = $false; Version = $null; Executable = $null }
}

# -------------------------------------------------------------------
# 3. Python LTS Dinamik Quraşdırılması (Arxa planda səssiz)
# -------------------------------------------------------------------
function Install-PythonLTS {
    Write-Host "-> Python LTS quraşdırılmasına başlanılır (arxa planda)..." -ForegroundColor Cyan

    # 3.1 Cəhd 1: Winget (varsa)
    $hasWinget = Get-Command winget -ErrorAction SilentlyContinue
    if ($hasWinget) {
        Write-Host "   [1/2] Winget vasitəsilə quraşdırılır (Python.Python.3.12)..." -ForegroundColor Yellow
        $wgArgs = @("install", "Python.Python.3.12", "--silent", "--accept-source-agreements", "--accept-package-agreements", "--force")
        try {
            $wingetProc = Start-Process -FilePath "winget" -ArgumentList $wgArgs -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
            if ($wingetProc -and $wingetProc.ExitCode -eq 0) {
                Update-EnvPath
                $verify = Test-PythonRuntime
                if ($verify.Installed) {
                    Write-Host "   [OK] Python winget ilə uğurla quraşdırıldı: $($verify.Version)" -ForegroundColor Green
                    return $true
                }
            }
        } catch {}
        Write-Host "   Winget uğursuz oldu. Python.org rəsmi serverindən dinamik yükləməyə keçilir..." -ForegroundColor Yellow
    }

    # 3.2 Cəhd 2: Python.org-dan birbaşa dinamik yükləmə və səssiz quraşdırma
    Write-Host "   [2/2] Python.org rəsmi serverindən dinamik installer yüklənir..." -ForegroundColor Yellow
    $pyCandidateVersions = @("3.12.9", "3.12.8", "3.12.7", "3.11.9")
    $tempDir = [System.IO.Path]::GetTempPath()
    $installerPath = Join-Path $tempDir "python-lts-amd64.exe"
    $downloaded = $false

    foreach ($ver in $pyCandidateVersions) {
        $pyUrl = "https://www.python.org/ftp/python/" + $ver + "/python-" + $ver + "-amd64.exe"
        try {
            Write-Host "   Yüklənir: $pyUrl" -ForegroundColor Gray
            (New-Object System.Net.WebClient).DownloadFile($pyUrl, $installerPath)
            if (Test-Path $installerPath) {
                $fileSize = (Get-Item $installerPath).Length
                if ($fileSize -gt 10000000) {
                    $downloaded = $true
                    break
                }
            }
        } catch {}
    }

    if ($downloaded) {
        try {
            Write-Host "   Sistemə səssiz quraşdırılır (InstallAllUsers=1 PrependPath=1)..." -ForegroundColor Yellow
            $installArgs = @("/quiet", "InstallAllUsers=1", "PrependPath=1", "Include_test=0", "Include_doc=0", "Include_launcher=1", "Shortcuts=0")
            Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -NoNewWindow
            
            Remove-Item -Path $installerPath -Force -ErrorAction SilentlyContinue

            Update-EnvPath
            $verify = Test-PythonRuntime
            if ($verify.Installed) {
                Write-Host "   [OK] Python uğurla quraşdırıldı: $($verify.Version)" -ForegroundColor Green
                return $true
            }
        } catch {
            Write-Host "   Quraşdırma xətası: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    Write-Host "   Python avtomatik quraşdırıla bilmədi." -ForegroundColor Red
    return $false
}

# -------------------------------------------------------------------
# 4. Node.js LTS Dinamik Quraşdırılması (Arxa planda səssiz)
# -------------------------------------------------------------------
function Install-NodeLTS {
    Write-Host "-> Node.js LTS quraşdırılmasına başlanılır (arxa planda)..." -ForegroundColor Cyan

    # 4.1 Cəhd 1: Winget (varsa)
    $hasWinget = Get-Command winget -ErrorAction SilentlyContinue
    if ($hasWinget) {
        Write-Host "   [1/2] Winget vasitəsilə quraşdırılır (OpenJS.NodeJS.LTS)..." -ForegroundColor Yellow
        $wgArgs = @("install", "OpenJS.NodeJS.LTS", "--silent", "--accept-source-agreements", "--accept-package-agreements", "--force")
        try {
            $wingetNodeProc = Start-Process -FilePath "winget" -ArgumentList $wgArgs -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
            if ($wingetNodeProc -and $wingetNodeProc.ExitCode -eq 0) {
                Update-EnvPath
                $verify = Test-NodeRuntime
                if ($verify.Installed) {
                    Write-Host "   [OK] Node.js winget ilə uğurla quraşdırıldı: $($verify.Version)" -ForegroundColor Green
                    return $true
                }
            }
        } catch {}
        Write-Host "   Winget uğursuz oldu. Nodejs.org rəsmi serverindən dinamik yükləməyə keçilir..." -ForegroundColor Yellow
    }

    # 4.2 Cəhd 2: Nodejs.org-dan birbaşa MSI yükləmə və səssiz quraşdırma
    Write-Host "   [2/2] Nodejs.org rəsmi serverindən dinamik LTS MSI yüklənir..." -ForegroundColor Yellow
    $tempDir = [System.IO.Path]::GetTempPath()
    $nodeMsiPath = Join-Path $tempDir "nodejs-lts-x64.msi"

    try {
        $nodeMsiUrl = $null
        try {
            $releases = Invoke-RestMethod -Uri "https://nodejs.org/dist/index.json" -UseBasicParsing -TimeoutSec 10
            $latestLts = $releases | Where-Object { $_.lts -ne $false } | Select-Object -First 1
            if ($latestLts -and $latestLts.version) {
                $ver = $latestLts.version
                $nodeMsiUrl = "https://nodejs.org/dist/" + $ver + "/node-" + $ver + "-x64.msi"
            }
        } catch {}

        if (-not $nodeMsiUrl) {
            $nodeMsiUrl = "https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi"
        }

        Write-Host "   Yüklənir: $nodeMsiUrl" -ForegroundColor Gray
        (New-Object System.Net.WebClient).DownloadFile($nodeMsiUrl, $nodeMsiPath)

        Write-Host "   MSI səssiz quraşdırılır (msiexec /i ... /qn ALLUSERS=1)..." -ForegroundColor Yellow
        $msiArgs = @("/i", $nodeMsiPath, "/qn", "/norestart", "ALLUSERS=1")
        Start-Process -FilePath "msiexec.exe" -ArgumentList $msiArgs -Wait -NoNewWindow

        Remove-Item -Path $nodeMsiPath -Force -ErrorAction SilentlyContinue

        Update-EnvPath
        $verify = Test-NodeRuntime
        if ($verify.Installed) {
            Write-Host "   [OK] Node.js uğurla quraşdırıldı: $($verify.Version)" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "   Node.js yüklənməsi zamanı xəta: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "   Node.js avtomatik quraşdırıla bilmədi." -ForegroundColor Red
    return $false
}

# ===================================================================
# ƏSAS İCRA VƏ ŞƏRT YOXLANIŞI
# ===================================================================

Write-Host "1. Sistemdə Python və Node.js mühitləri yoxlanılır..." -ForegroundColor Yellow
$pyStatus = Test-PythonRuntime
$nodeStatus = Test-NodeRuntime

if ($pyStatus.Installed) {
    Write-Host "   - Python:  [OK] Mövcuddur ($($pyStatus.Version))" -ForegroundColor Green
} else {
    Write-Host "   - Python:  [TAPILMADI] Quraşdırılmayıb" -ForegroundColor Red
}

if ($nodeStatus.Installed) {
    Write-Host "   - Node.js: [OK] Mövcuddur ($($nodeStatus.Version))" -ForegroundColor Green
} else {
    Write-Host "   - Node.js: [TAPILMADI] Quraşdırılmayıb" -ForegroundColor Red
}
Write-Host ""

# ŞƏRT: Əgər hər iki mühit artıq mövcuddursa, addımı dərhal ötürərək davam edirik!
if ($pyStatus.Installed -and $nodeStatus.Installed) {
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host "Python və Node.js artıq mövcuddur!" -ForegroundColor Green
    Write-Host "Quraşdırma addımı ötürülür və BrowsMe davam edir." -ForegroundColor Green
    Write-Host "=========================================================" -ForegroundColor Green
    Exit 0
}

# Çatışmayan mühitləri arxa planda dinamik quraşdırırıq
Write-Host "Bəzi tələb olunan mühitlər çatışmır. Avtomatik arxa planda quraşdırmaya başlanılır..." -ForegroundColor Yellow
Write-Host ""

if (-not $pyStatus.Installed) {
    $null = Install-PythonLTS
    Write-Host ""
}

if (-not $nodeStatus.Installed) {
    $null = Install-NodeLTS
    Write-Host ""
}

# Yekun yoxlama
Update-EnvPath
$finalPy = Test-PythonRuntime
$finalNode = Test-NodeRuntime

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Yekun Nəticə:" -ForegroundColor Cyan
if ($finalPy.Installed) {
    Write-Host "   - Python:  [OK] Hazırdır ($($finalPy.Version))" -ForegroundColor Green
} else {
    Write-Host "   - Python:  [MƏLUMAT] Tətbiq daxilindən də tamamlana bilər" -ForegroundColor Yellow
}

if ($finalNode.Installed) {
    Write-Host "   - Node.js: [OK] Hazırdır ($($finalNode.Version))" -ForegroundColor Green
} else {
    Write-Host "   - Node.js: [MƏLUMAT] Tətbiq daxilindən də tamamlana bilər" -ForegroundColor Yellow
}

if ($finalPy.Installed -and $finalNode.Installed) {
    Write-Host "BrowsMe üçün bütün mühitlər tam hazırdır!" -ForegroundColor Green
}
Write-Host "=========================================================" -ForegroundColor Cyan

Exit 0
