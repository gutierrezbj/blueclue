import ast
from datetime import datetime, timezone
from pathlib import Path
import shutil
import subprocess

target = Path("/opt/sa99/backend/app/modules/infra/service.py")
source = target.read_text()
tree = ast.parse(source)
service = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == "InfraService")
seed = next(node for node in service.body if isinstance(node, ast.Assign) and any(isinstance(name, ast.Name) and name.id == "SEED_SERVERS" for name in node.targets))
servers = ast.literal_eval(seed.value)
server = next(item for item in servers if item["_id"] == "vps-staging")
project = {"containers": ["blueclue-web"], "domain": "blueclue.jrgblanco.com"}
existing = server["projects"].get("BlueClue")
if existing is not None and existing != project:
    raise SystemExit("Conflicting BlueClue seed; no changes")
if existing is None:
    anchor = '                "RadioPirata": {'
    if source.count(anchor) != 1:
        raise SystemExit("Unknown seed layout; no changes")
    addition = '                "BlueClue": {\n                    "containers": ["blueclue-web"],\n                    "domain": "blueclue.jrgblanco.com",\n                },\n'
    replacement = source.replace(anchor, addition + anchor)
    ast.parse(replacement)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    shutil.copy2(target, target.with_name(f"service.py.before-blueclue-{stamp}"))
    target.write_text(replacement)

program = '''
import asyncio
import json
from app.core.database import connect_db, close_db, get_db
from app.modules.infra.service import InfraService

async def main():
    await connect_db()
    try:
        collection = get_db()["servers"]
        project = {"containers": ["blueclue-web"], "domain": "blueclue.jrgblanco.com"}
        server = await collection.find_one({"_id": "vps-staging"})
        if not server:
            raise RuntimeError("Missing staging server; inventory not replaced")
        existing = server.get("projects", {}).get("BlueClue")
        if existing is not None and existing != project:
            raise RuntimeError("Conflicting BlueClue project; no database changes")
        await collection.update_one({"_id": "vps-staging", "projects.BlueClue": {"$exists": False}}, {"$set": {"projects.BlueClue": project}})
        stored = await collection.find_one({"_id": "vps-staging"}, {"projects.BlueClue": 1})
        assert stored["projects"]["BlueClue"] == project
        metrics = await InfraService().scan_server("vps-staging")
        containers = [item for item in (metrics or {}).get("containers", []) if item.get("name") == "blueclue-web"]
        print(json.dumps({"registered": True, "scan_status": (metrics or {}).get("status"), "containers": containers}))
        if not containers or "healthy" not in containers[0].get("status", "") or "unhealthy" in containers[0].get("status", ""):
            raise RuntimeError("Registration saved, but healthy BlueClue not verified in scan")
    finally:
        await close_db()

asyncio.run(main())
'''
subprocess.run(["docker", "exec", "-i", "sa99-cerebro", "python", "-"], input=program, text=True, check=True)
print("Only projects.BlueClue updated; seed saved on host for the next image build. No SA99 restart.")
