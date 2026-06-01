@echo off
chcp 65001 > nul
title Inicializador TechLibras Cloud

echo ====================================================
echo         INICIALIZANDO SISTEMA TECHLIBRAS            
echo ====================================================
echo.

:: 1. VERIFICAÇÃO DO DOCKER
echo [1/4] Verificando o Docker Desktop...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERRO: O Docker Desktop nao esta pronto! Abra o programa e espere ficar verde.
    pause
    exit
)
echo  - Docker operacional!

:: 2. VERIFICAÇÃO DO ARQUIVO DE CONFIGURAÇÃO
if not exist .env (
    echo ❌ ERRO: O arquivo de configuracao '.env' nao foi encontrado nesta pasta!
    pause
    exit
)

:: 3. BAIXANDO O FRONTEND DO AR (REPOSITÓRIO)
echo.
echo [2/4] Baixando a interface do sistema (Frontend)...
:: Se a pasta do front já existir de um boot anterior, ele pula. Se não, ele baixa o zip limpo do seu GitHub.
if not exist frontend_temp (
    echo  - Baixando arquivos da nuvem...
    :: SUBSTITUA a URL abaixo pela URL do seu repositório público do GitHub onde está a pasta do front
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/Heitotosouza/TechLibras/archive/refs/heads/main.zip' -OutFile 'projeto.zip'"
    powershell -Command "Expand-Archive -Path 'projeto.zip' -DestinationPath '.'"
    :: Ajusta os nomes das pastas para o Docker Compose ler
    move seu_repositorio-main\frontend .\frontend_temp >nul
    :: Limpa os restos do download
    rd /s /q seu_repositorio-main
    del projeto.zip
)
echo  - Frontend pronto!

:: 4. CRIANDO O ARQUIVO DOCKER COMPOSE EM TEMPO REAL
echo.
echo [3/4] Configurando conexoes...
(
echo name: techlibras
echo services:
echo   backend:
echo     image: heitorsouzasoares/techlibras-backend:latest
echo     ports:
echo       - "10000:10000"
echo     restart: always
echo     env_file:
echo       - .env
echo   frontend:
echo     image: node:22-slim
echo     working_dir: /app
echo     volumes:
echo       - ./frontend_temp:/app
echo     ports:
echo       - "3000:3000"
echo     command: sh -c "npm install && npm run dev"
echo     restart: always
echo     depends_on:
echo       - backend
) > docker-compose-cloud.yml

:: 5. SUBINDO O SISTEMA
echo.
echo [4/4] Ligando os servidores...
docker compose -f docker-compose-cloud.yml up -d

echo.
echo ====================================================
echo   SISTEMA ONLINE! ACESSE: http://localhost:3000
echo ====================================================
timeout /t 3 /nobreak > nul
start http://localhost:3000

:loop
timeout /t 2 /nobreak > nul
goto loop