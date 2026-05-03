#!/bin/bash
# Wrapper: cria venv se preciso, instala deps, roda o scan.
# Default: dry-run. Use "bash run.sh --apply" pra aplicar.
set -e

cd "$(dirname "$0")/../.."

VENV="scripts/drive_scan/.venv"
PY="$VENV/bin/python3"
PIP="$VENV/bin/pip"

if [ ! -d "$VENV" ]; then
  echo "[setup] Criando venv em $VENV..."
  python3 -m venv "$VENV"
fi

# Verifica se as deps estão instaladas (importa silenciosamente)
if ! "$PY" -c "import googleapiclient, mysql.connector" 2>/dev/null; then
  echo "[setup] Instalando dependencias..."
  "$PIP" install --quiet google-api-python-client google-auth mysql-connector-python python-dotenv
fi

# Passa --apply pro Python se foi passado pro bash
if [ "$1" = "--apply" ]; then
  echo "[run] Modo APLICAR — vai gravar no DB e mudar permissoes do Drive"
  "$PY" scripts/drive_scan/run_scan.py --apply
else
  echo "[run] Modo DRY-RUN — apenas simulacao"
  "$PY" scripts/drive_scan/run_scan.py
fi
