# Scan automático: Fotos da Instalação no Drive

## O que faz
1. Lista todas as subpastas da pasta-mãe `1MX2k_-VUC9k8ctt0fQLzbQ-Ij4C0dSVP`
2. Pra cada subpasta, extrai o código do projeto (`P774`, `P1044`, etc) do nome
3. Procura dentro pela pasta "6. Fotos Instalação e Comissionamento"
4. Define permissão pública (anyone with link → reader)
5. Salva no `u155320717_esol_obras.project_assets`

## Pré-requisitos

```bash
pip install google-api-python-client google-auth mysql-connector-python python-dotenv
```

## Configuração

Crie um `.env` na pasta `scripts/drive_scan/` (ou exporte as vars):

```env
# JSON da service account com acesso à pasta-mãe (já compartilhada com a SA do form-pbi)
SERVICE_ACCOUNT_FILE=/var/www/dv2.api-pbi-esol/config/esol-pbi-api.json

# ID da pasta-mãe (pode mudar se for migrada)
PARENT_FOLDER_ID=1MX2k_-VUC9k8ctt0fQLzbQ-Ij4C0dSVP

# String de conexão MySQL (a mesma do .env do portal-esol)
DATABASE_OBRAS_URL=mysql://u155320717_esol_obras:senha@srv1883.hstgr.io:3306/u155320717_esol_obras

# Modo simulação — não grava no DB nem altera permissões
DRY_RUN=1
```

## Execução

**Sempre rode primeiro com `DRY_RUN=1`** pra ver o que seria feito:

```bash
DRY_RUN=1 python scripts/drive_scan/scan_photos_links.py
```

Se a saída estiver OK (códigos extraídos corretamente, pastas encontradas), rode pra valer:

```bash
DRY_RUN=0 python scripts/drive_scan/scan_photos_links.py
```

## Idempotência
- O `INSERT ... ON DUPLICATE KEY UPDATE` permite rodar quantas vezes precisar.
- A definição de permissão também é idempotente (verifica antes de criar).
- Pode rodar via cron diariamente / semanalmente pra pegar projetos novos.

## Cron sugerido (todo dia às 03:00)

```cron
0 3 * * * cd /var/www/portal-esol && DRY_RUN=0 python3 scripts/drive_scan/scan_photos_links.py >> /var/log/drive_scan.log 2>&1
```
