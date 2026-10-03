from datetime import datetime, timezone
from pathlib import Path
import shutil
import subprocess
import urllib.request

health = urllib.request.urlopen("http://127.0.0.1:3280/health", timeout=5)
if health.status != 200:
    raise SystemExit("BlueClue is not healthy; monitoring not changed")

target = Path("/opt/scripts/healthcheck.sh")
source = target.read_text()
start = source.find("SERVICES=(\n")
end = source.find("\n)", start)
if start < 0 or end < 0:
    raise SystemExit("Unknown monitor format; no changes")

entries = [
    '  "BlueClue|blueclue-web|docker"',
    '  "BlueClue-HTTP|http://127.0.0.1:3280/health|http"',
]
existing = source[start:end]
missing = [entry for entry in entries if entry.strip() not in existing]
if missing:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = target.with_name(f"healthcheck.sh.before-blueclue-{stamp}")
    shutil.copy2(target, backup)
    backup.chmod(0o600)
    replacement = source[:end] + "\n" + "\n".join(missing) + source[end:]
    target.write_text(replacement)
    check = subprocess.run(["bash", "-n", str(target)], capture_output=True)
    if check.returncode:
        shutil.copy2(backup, target)
        raise SystemExit("Syntax check failed; original monitor restored")
    print("Added only BlueClue container and HTTP checks; original backed up securely.")
else:
    print("BlueClue checks already registered; nothing changed.")
