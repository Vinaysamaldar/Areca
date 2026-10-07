@echo off
echo ========================================================
echo  Pushing Arecanut AI Project to GitHub
echo  Repository: https://github.com/Vinaysamaldar/Areca
echo ========================================================
echo.

set "GIT_EXE=C:\Users\DELL\.gemini\antigravity\scratch\mingit\cmd\git.exe"

if not exist "%GIT_EXE%" (
    echo [ERROR] Git executable not found at %GIT_EXE%
    pause
    exit /b 1
)

cd /d "%~dp0"

echo [1/3] Adding files to git...
"%GIT_EXE%" add -A

echo [2/3] Checking commit...
"%GIT_EXE%" commit -m "Update Arecanut Disease Detection project files" 2>nul

echo [3/3] Pushing to https://github.com/Vinaysamaldar/Areca...
"%GIT_EXE%" push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo [SUCCESS] Project successfully pushed to GitHub!
    echo Check your repository: https://github.com/Vinaysamaldar/Areca
) else (
    echo.
    echo [NOTE] If prompted above, please enter your GitHub username and Personal Access Token (PAT).
    echo You can generate a Personal Access Token at: https://github.com/settings/tokens
)

echo.
pause
