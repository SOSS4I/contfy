@echo off
echo ============================================
echo SETUP COMPLETO DO BACKEND
echo ============================================
echo.

echo [1/4] Parando processos anteriores...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo [2/4] Gerando Prisma Client...
call npx prisma generate

echo.
echo [3/4] Aplicando schema ao banco de dados...
call npx prisma db push --skip-generate

echo.
echo [4/4] Criando conta admin do contador...
call npx ts-node src/scripts/create-specific-admin.ts

echo.
echo ============================================
echo SETUP COMPLETO!
echo ============================================
echo.
echo Credenciais do Admin:
echo Email: admin@contabilidade.com
echo Senha: Admin@Contabil2025
echo.
echo Para iniciar o backend, execute:
echo npm run dev
echo.
pause
