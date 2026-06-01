@echo off
chcp 65001 > nul
title Finalizador TechLibras Cloud

echo Parando servidores na nuvem...
if exist docker-compose-cloud.yml (
    docker compose -f docker-compose-cloud.yml down
    del docker-compose-cloud.yml
)

echo.
echo ✅ Sistema desligado!
pause