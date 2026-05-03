#!/usr/bin/env python3
"""
Scan automatico das pastas de obras no Google Drive.

Pra cada subpasta da pasta-mae:
  1. Tenta extrair o codigo do projeto do nome da pasta (P774, P1044, etc).
  2. Lista o conteudo da pasta procurando por "6. Fotos Instalacao e Comissionamento".
  3. Pega o ID/link da pasta de fotos.
  4. Define a permissao da pasta de fotos como "anyone with link can view".
  5. Insere/atualiza no MySQL u155320717_esol_obras.project_assets.

PRE-REQUISITOS
  pip install google-api-python-client google-auth google-auth-oauthlib mysql-connector-python python-dotenv

EXECUCAO
  Defina as variaveis de ambiente:
    SERVICE_ACCOUNT_FILE     caminho pro JSON da service account (ex: dv2.api-pbi-esol/config/esol-pbi-api.json)
    PARENT_FOLDER_ID         ID da pasta-mae (atual: 1MX2k_-VUC9k8ctt0fQLzbQ-Ij4C0dSVP)
    DATABASE_OBRAS_URL       URL MySQL (ex: mysql://user:pass@host:3306/dbname)
    DRY_RUN                  '1' para simular sem gravar/alterar permissao

  python scripts/drive_scan/scan_photos_links.py
"""

from __future__ import annotations

import os
import re
import sys
from urllib.parse import urlparse, unquote

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

SERVICE_ACCOUNT_FILE = os.getenv(
    "SERVICE_ACCOUNT_FILE",
    "/var/www/dv2.api-pbi-esol/config/esol-pbi-api.json",
)
PARENT_FOLDER_ID = os.getenv(
    "PARENT_FOLDER_ID", "1MX2k_-VUC9k8ctt0fQLzbQ-Ij4C0dSVP"
)
DATABASE_OBRAS_URL = os.getenv("DATABASE_OBRAS_URL", "")
DRY_RUN = os.getenv("DRY_RUN", "0") == "1"

PHOTOS_FOLDER_NAMES = [
    "6. Fotos Instalação e Comissionamento",
    "6. Fotos Instalacao e Comissionamento",  # sem acento por garantia
]

SCOPES = ["https://www.googleapis.com/auth/drive"]

# Padrao de codigo de projeto: P seguido de digitos, opcionalmente com hifen e numero
PROJECT_CODE_RE = re.compile(r"\bP\d{2,5}(?:-[A-Z0-9]+)?\b")


def get_drive_service():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    return build("drive", "v3", credentials=creds)


def get_db():
    if not DATABASE_OBRAS_URL:
        raise RuntimeError("DATABASE_OBRAS_URL nao configurada")
    parsed = urlparse(DATABASE_OBRAS_URL)
    return mysql.connector.connect(
        host=parsed.hostname,
        port=parsed.port or 3306,
        user=unquote(parsed.username or ""),
        password=unquote(parsed.password or ""),
        database=parsed.path.lstrip("/"),
        charset="utf8mb4",
    )


def list_subfolders(svc, parent_id):
    """Lista todas as subpastas de uma pasta (paginado)."""
    folders = []
    page_token = None
    while True:
        resp = svc.files().list(
            q=f"'{parent_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields="nextPageToken, files(id, name)",
            pageSize=1000,
            pageToken=page_token,
            supportsAllDrives=True,
            includeItemsFromAllDrives=True,
        ).execute()
        folders.extend(resp.get("files", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return folders


def find_photos_folder(svc, project_folder_id):
    """Procura a pasta '6. Fotos...' dentro da pasta do projeto."""
    resp = svc.files().list(
        q=f"'{project_folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields="files(id, name)",
        pageSize=100,
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
    ).execute()
    for f in resp.get("files", []):
        normalized = f["name"].strip()
        if any(target in normalized for target in PHOTOS_FOLDER_NAMES):
            return f
        # Busca por prefixo "6. Fotos" pra tolerar variacoes
        if normalized.lower().startswith("6. fotos"):
            return f
    return None


def make_public(svc, file_id):
    """Define permissao 'anyone with link -> reader'. Idempotente."""
    try:
        # Verifica se ja tem permissao publica
        perms = svc.permissions().list(
            fileId=file_id, fields="permissions(id, type, role)",
            supportsAllDrives=True,
        ).execute()
        for p in perms.get("permissions", []):
            if p.get("type") == "anyone" and p.get("role") in ("reader", "writer"):
                return "already_public"
        # Cria
        svc.permissions().create(
            fileId=file_id,
            body={"type": "anyone", "role": "reader"},
            supportsAllDrives=True,
        ).execute()
        return "made_public"
    except HttpError as e:
        return f"error: {e}"


def extract_project_code(folder_name: str) -> str | None:
    """Extrai 'P774' de 'P774 - João Luiz Gonzaga' ou similar."""
    m = PROJECT_CODE_RE.search(folder_name.upper())
    return m.group(0) if m else None


def upsert_asset(db, project_code, drive_folder_id, photos_link, permission_status):
    cursor = db.cursor()
    cursor.execute(
        """
        INSERT INTO project_assets
          (project_code, drive_folder_id, photos_link, permission_status, last_synced_at)
        VALUES (%s, %s, %s, %s, NOW())
        ON DUPLICATE KEY UPDATE
          drive_folder_id = VALUES(drive_folder_id),
          photos_link = VALUES(photos_link),
          permission_status = VALUES(permission_status),
          last_synced_at = NOW()
        """,
        (project_code, drive_folder_id, photos_link, permission_status),
    )
    cursor.close()
    db.commit()


def main():
    print("=" * 60)
    print(f"Scan de Fotos do Drive — DRY_RUN={DRY_RUN}")
    print(f"Pasta-mae: {PARENT_FOLDER_ID}")
    print(f"SA file:   {SERVICE_ACCOUNT_FILE}")
    print("=" * 60)

    svc = get_drive_service()
    db = None if DRY_RUN else get_db()

    print("\n[1/3] Listando subpastas da pasta-mae...")
    subfolders = list_subfolders(svc, PARENT_FOLDER_ID)
    print(f"      {len(subfolders)} subpastas encontradas")

    counts = {"matched": 0, "no_code": 0, "no_photos": 0, "saved": 0, "errors": 0}

    print("\n[2/3] Processando cada projeto...")
    for proj_folder in subfolders:
        code = extract_project_code(proj_folder["name"])
        if not code:
            counts["no_code"] += 1
            continue
        counts["matched"] += 1

        photos = find_photos_folder(svc, proj_folder["id"])
        if not photos:
            counts["no_photos"] += 1
            print(f"  ⚠️  {code:8} ({proj_folder['name'][:40]}): sem pasta '6. Fotos...'")
            continue

        photos_link = f"https://drive.google.com/drive/folders/{photos['id']}"
        perm_result = "skipped (dry-run)" if DRY_RUN else make_public(svc, photos["id"])
        permission_status = "public" if "public" in perm_result else "unknown"

        if not DRY_RUN:
            try:
                upsert_asset(db, code, photos["id"], photos_link, permission_status)
                counts["saved"] += 1
            except Exception as e:
                counts["errors"] += 1
                print(f"  ❌ {code}: erro DB: {e}")
                continue

        status_icon = "✅" if "public" in perm_result else "📁"
        print(f"  {status_icon} {code:8} -> {photos['id']} [{perm_result}]")

    print("\n[3/3] Resumo:")
    print(f"  Subpastas com codigo identificado:   {counts['matched']}")
    print(f"  Subpastas SEM codigo (ignoradas):    {counts['no_code']}")
    print(f"  Sem pasta '6. Fotos...':              {counts['no_photos']}")
    print(f"  Salvas no DB:                        {counts['saved']}")
    print(f"  Erros:                               {counts['errors']}")

    if db:
        db.close()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrompido")
        sys.exit(1)
