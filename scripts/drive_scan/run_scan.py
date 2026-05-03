#!/usr/bin/env python3
"""
Scan automatico das pastas de obras no Google Drive.

Sem .env separado: le DATABASE_OBRAS_URL do .env do portal-esol direto.
Default: DRY_RUN. Use --apply para gravar de verdade.

USO:
  bash scripts/drive_scan/run.sh            # dry-run (so simula)
  bash scripts/drive_scan/run.sh --apply    # aplica: muda permissoes + grava DB
"""
from __future__ import annotations
import os, re, sys
from urllib.parse import urlparse, unquote
from pathlib import Path

# Defaults — pode override via env var
PROJECT_ROOT = Path(__file__).resolve().parents[2]
SERVICE_ACCOUNT_FILE = os.getenv(
    "SERVICE_ACCOUNT_FILE", "/var/www/api-pbi/config/esol-pbi-api.json"
)
PARENT_FOLDER_ID = os.getenv(
    "PARENT_FOLDER_ID", "1MX2k_-VUC9k8ctt0fQLzbQ-Ij4C0dSVP"
)

# DATABASE_OBRAS_URL: tenta env var, depois .env do portal-esol
def _read_dotenv_var(path: Path, key: str) -> str | None:
    if not path.exists():
        return None
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith(f"{key}="):
            return line.split("=", 1)[1].strip()
    return None

DATABASE_OBRAS_URL = (
    os.getenv("DATABASE_OBRAS_URL")
    or _read_dotenv_var(PROJECT_ROOT / ".env", "DATABASE_OBRAS_URL")
    or ""
)

DRY_RUN = "--apply" not in sys.argv

PHOTOS_FOLDER_PREFIXES = ("6. fotos", "6.fotos")
SCOPES = ["https://www.googleapis.com/auth/drive"]
PROJECT_CODE_RE = re.compile(r"\bP\d{2,5}(?:-[A-Z0-9]+)?\b")


def get_drive_service():
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    return build("drive", "v3", credentials=creds)


def get_db():
    import mysql.connector
    if not DATABASE_OBRAS_URL:
        raise RuntimeError(f"DATABASE_OBRAS_URL nao encontrada em env nem em {PROJECT_ROOT}/.env")
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
    folders, page_token = [], None
    while True:
        resp = svc.files().list(
            q=f"'{parent_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields="nextPageToken, files(id, name)",
            pageSize=1000, pageToken=page_token,
            supportsAllDrives=True, includeItemsFromAllDrives=True,
        ).execute()
        folders.extend(resp.get("files", []))
        page_token = resp.get("nextPageToken")
        if not page_token: break
    return folders


def find_photos_folder(svc, project_folder_id):
    resp = svc.files().list(
        q=f"'{project_folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields="files(id, name)", pageSize=100,
        supportsAllDrives=True, includeItemsFromAllDrives=True,
    ).execute()
    for f in resp.get("files", []):
        normalized = f["name"].strip().lower()
        if any(normalized.startswith(p) for p in PHOTOS_FOLDER_PREFIXES):
            return f
    return None


def make_public(svc, file_id):
    from googleapiclient.errors import HttpError
    try:
        perms = svc.permissions().list(
            fileId=file_id, fields="permissions(id, type, role)",
            supportsAllDrives=True,
        ).execute()
        for p in perms.get("permissions", []):
            if p.get("type") == "anyone" and p.get("role") in ("reader", "writer"):
                return "already_public"
        svc.permissions().create(
            fileId=file_id, body={"type": "anyone", "role": "reader"},
            supportsAllDrives=True,
        ).execute()
        return "made_public"
    except HttpError as e:
        return f"error: {e}"


def extract_project_code(folder_name: str) -> str | None:
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
    print(f"Scan de Fotos do Drive — modo: {'DRY-RUN' if DRY_RUN else 'APLICAR'}")
    print(f"Pasta-mae: {PARENT_FOLDER_ID}")
    print(f"SA file:   {SERVICE_ACCOUNT_FILE}")
    print(f"DB:        {urlparse(DATABASE_OBRAS_URL).hostname or '(nenhum)'}")
    print("=" * 60)

    if not Path(SERVICE_ACCOUNT_FILE).exists():
        print(f"\n❌ Service account nao encontrada em {SERVICE_ACCOUNT_FILE}")
        sys.exit(1)
    if not DATABASE_OBRAS_URL:
        print("\n❌ DATABASE_OBRAS_URL nao configurada (verificar .env do portal-esol)")
        sys.exit(1)

    svc = get_drive_service()
    db = None if DRY_RUN else get_db()

    print("\n[1/3] Listando subpastas da pasta-mae...")
    subfolders = list_subfolders(svc, PARENT_FOLDER_ID)
    print(f"      {len(subfolders)} subpastas encontradas\n")

    counts = {"matched": 0, "no_code": 0, "no_photos": 0, "saved": 0, "errors": 0}
    samples_no_code = []
    samples_no_photos = []

    for proj_folder in subfolders:
        code = extract_project_code(proj_folder["name"])
        if not code:
            counts["no_code"] += 1
            if len(samples_no_code) < 5:
                samples_no_code.append(proj_folder["name"])
            continue
        counts["matched"] += 1

        photos = find_photos_folder(svc, proj_folder["id"])
        if not photos:
            counts["no_photos"] += 1
            if len(samples_no_photos) < 5:
                samples_no_photos.append(f"{code} ({proj_folder['name'][:40]})")
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

        icon = "✅" if "public" in perm_result else "📁"
        print(f"  {icon} {code:8} -> {photos['id']} [{perm_result}]")

    print("\n[3/3] Resumo:")
    print(f"  Subpastas com codigo identificado:     {counts['matched']}")
    print(f"  Sem codigo (ignoradas):                {counts['no_code']}")
    print(f"  Sem pasta '6. Fotos...':                {counts['no_photos']}")
    print(f"  Salvas no DB:                          {counts['saved']}")
    print(f"  Erros:                                 {counts['errors']}")

    if samples_no_code:
        print("\n  Exemplos de pastas SEM codigo (revisar nomes):")
        for s in samples_no_code:
            print(f"    - {s[:60]}")
    if samples_no_photos:
        print("\n  Exemplos SEM pasta '6. Fotos...':")
        for s in samples_no_photos:
            print(f"    - {s}")

    if DRY_RUN:
        print("\n" + "=" * 60)
        print("Esta foi uma SIMULACAO. Para aplicar de verdade:")
        print("  bash scripts/drive_scan/run.sh --apply")
        print("=" * 60)

    if db: db.close()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(1)
