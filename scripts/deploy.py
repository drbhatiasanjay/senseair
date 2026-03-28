"""SenseAir deployment script — triggers Render deployments.

Usage:
    python scripts/deploy.py              # Deploy all
    python scripts/deploy.py backend      # Backend only
    python scripts/deploy.py web          # Web only
    python scripts/deploy.py --skip-git   # Skip git push
"""

import argparse
import os
import subprocess
import sys
import time

import requests

# Render service IDs (set these after first Render deploy)
SERVICES = {
    "backend": {
        "id": os.environ.get("RENDER_BACKEND_SERVICE_ID", ""),
        "name": "senseair-api",
        "url": "https://senseair-api.onrender.com",
        "health": "/api/health",
    },
    "web": {
        "id": os.environ.get("RENDER_WEB_SERVICE_ID", ""),
        "name": "senseair-web",
        "url": "https://senseair-web.onrender.com",
        "health": "/",
    },
}

RENDER_API_KEY = os.environ.get("RENDER_API_KEY", "")


def git_push():
    print("\n  Pushing to git...")
    subprocess.run(["git", "add", "-A"], check=True)
    try:
        subprocess.run(
            ["git", "commit", "-m", "deploy: update SenseAir"],
            check=True, capture_output=True,
        )
    except subprocess.CalledProcessError:
        print("  No changes to commit")
    subprocess.run(["git", "push"], check=True)
    print("  Git push complete")


def trigger_deploy(service_key: str):
    svc = SERVICES[service_key]
    if not svc["id"]:
        print(f"  WARNING: No service ID for {service_key}. Set RENDER_{service_key.upper()}_SERVICE_ID")
        return False

    if not RENDER_API_KEY:
        print("  WARNING: RENDER_API_KEY not set")
        return False

    print(f"\n  Deploying {svc['name']}...")
    resp = requests.post(
        f"https://api.render.com/v1/services/{svc['id']}/deploys",
        headers={
            "Authorization": f"Bearer {RENDER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={"clearCache": "do_not_clear"},
    )

    if resp.status_code in (200, 201):
        deploy_id = resp.json().get("id", "unknown")
        print(f"  Deploy triggered: {deploy_id}")
        return True
    else:
        print(f"  Deploy failed: {resp.status_code} {resp.text}")
        return False


def check_health(service_key: str, retries: int = 10):
    svc = SERVICES[service_key]
    url = svc["url"] + svc["health"]
    print(f"\n  Checking health: {url}")

    for i in range(retries):
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                print(f"  {svc['name']} is healthy!")
                return True
        except requests.RequestException:
            pass
        print(f"  Attempt {i + 1}/{retries}... waiting 15s")
        time.sleep(15)

    print(f"  WARNING: {svc['name']} health check failed after {retries} attempts")
    return False


def main():
    parser = argparse.ArgumentParser(description="Deploy SenseAir to Render")
    parser.add_argument("target", nargs="?", default="all", choices=["all", "backend", "web"])
    parser.add_argument("--skip-git", action="store_true", help="Skip git commit/push")
    args = parser.parse_args()

    print("=" * 50)
    print("  SenseAir Deploy")
    print("=" * 50)

    if not args.skip_git:
        git_push()

    targets = ["backend", "web"] if args.target == "all" else [args.target]

    for target in targets:
        trigger_deploy(target)

    # Wait and check health
    print("\n  Waiting 30s for deploy to start...")
    time.sleep(30)

    for target in targets:
        check_health(target)

    print("\n  Deploy complete!")
    for target in targets:
        svc = SERVICES[target]
        print(f"  {svc['name']}: {svc['url']}")


if __name__ == "__main__":
    main()
