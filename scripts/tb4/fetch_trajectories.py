#!/usr/bin/env python3
"""Copy selected TB4 trajectories from Harbor Hub into our private Supabase bucket.

Harbor's trajectories belong to whoever submitted them and carry no license,
so they go into the private `tb4-trajectories` bucket (signed-in members
only), never into the public site or repo.

Selection: the suspect and never-solved tasks (public/tb4-data/analysis.json).
For each, every config's first failed trial, plus its first passed trial if it
has one. Each trajectory is gzipped, uploaded as <task>/<trial>.json.gz and
indexed in the tb4_trajectories table. Already-indexed trials are skipped, so
the script can be re-run or extended.

    python3 scripts/tb4/fetch_trajectories.py            # all selected
    python3 scripts/tb4/fetch_trajectories.py --tasks a,b # only these tasks
"""

import argparse
import gzip
import json
import os
import re
import ssl
import time
import urllib.error
import urllib.request

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
DATA = os.path.join(ROOT, "public", "tb4-data")
CLIENT = os.path.join(ROOT, "lib", "supabase", "client.ts")
HARBOR_CONSTANTS = "https://raw.githubusercontent.com/harbor-framework/harbor/main/src/harbor/auth/constants.py"
BUCKET = "tb4-trajectories"
DELAY = 1.0  # between Harbor requests


def http(method: str, url: str, headers: dict, body: bytes | None = None, tries: int = 4) -> bytes:
    for attempt in range(tries):
        req = urllib.request.Request(url, data=body, method=method, headers=headers)
        req.add_header("User-Agent", "sebrusso.github.io tb4 browser (private analysis)")
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code < 500 or attempt == tries - 1:
                raise
        except (OSError, ssl.SSLError):
            # Dropped connections and TLS hiccups on large downloads: back off and retry.
            if attempt == tries - 1:
                raise
        time.sleep(2 * (attempt + 1))
    raise RuntimeError("unreachable")


def outcome(reward, error) -> str:
    if (reward or 0) >= 1:
        return "passed"
    return "tests_failed" if error is None else error


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tasks", help="comma-separated task names (default: suspect + never solved)")
    args = ap.parse_args()

    # Our project: URL, publishable key and Seb's login, from the site's client.
    src = open(CLIENT).read()
    sb_url = re.search(r"SUPABASE_URL = '([^']+)'", src).group(1)
    sb_key = re.search(r"SUPABASE_KEY = '([^']+)'", src).group(1)
    seb = re.search(r"seb: \{ email: '([^']+)', password: '([^']+)' \}", src)
    tok = json.loads(
        http("POST", f"{sb_url}/auth/v1/token?grant_type=password", {"apikey": sb_key, "Content-Type": "application/json"}, json.dumps({"email": seb.group(1), "password": seb.group(2)}).encode())
    )["access_token"]
    ours = {"apikey": sb_key, "Authorization": f"Bearer {tok}"}

    # Harbor's public read endpoint and publishable key, from its open-source client.
    hc = http("GET", HARBOR_CONSTANTS, {}).decode()
    h_url = re.search(r'DEFAULT_SUPABASE_URL\s*=\s*"([^"]+)"', hc).group(1)
    h_key = re.search(r'DEFAULT_SUPABASE_PUBLISHABLE_KEY\s*=\s*\(?\s*"([^"]+)"', hc).group(1)
    harbor = {"apikey": h_key, "Authorization": f"Bearer {h_key}"}

    analysis = json.load(open(os.path.join(DATA, "analysis.json")))["tasks"]
    meta = json.load(open(os.path.join(DATA, "trials-meta.json")))
    cfg_ids = [c["id"] for c in meta["configs"]]
    tasks = args.tasks.split(",") if args.tasks else sorted(t for t, a in analysis.items() if a["suspect"] or a["passed"] == 0)

    have = {r["trial_id"] for r in json.loads(http("GET", f"{sb_url}/rest/v1/tb4_trajectories?select=trial_id", ours))}
    picks = []
    for task in tasks:
        rows = json.load(open(os.path.join(DATA, "trials", f"{task}.json")))
        by_cfg: dict[int, dict[str, list]] = {}
        for r in rows:
            kind = "pass" if (r[2] or 0) >= 1 else "fail"
            by_cfg.setdefault(r[0], {}).setdefault(kind, []).append(r)
        for i, kinds in by_cfg.items():
            for kind in ("fail", "pass"):
                if kinds.get(kind):
                    picks.append((task, cfg_ids[i], kinds[kind][0]))
    todo = [p for p in picks if p[2][1] not in have]
    print(f"{len(tasks)} tasks, {len(picks)} trials selected, {len(todo)} to fetch", flush=True)

    total = 0
    for n, (task, cfg, r) in enumerate(todo, 1):
        trial = r[1]
        try:
            raw = http("GET", f"{h_url}/storage/v1/object/authenticated/results/trials/{trial}/trajectory.json", harbor)
        except urllib.error.HTTPError as e:
            print(f"  skip {task} {trial}: Harbor {e.code}", flush=True)
            time.sleep(DELAY)
            continue
        time.sleep(DELAY)
        try:
            steps = len(json.loads(raw).get("steps", []))
        except ValueError:
            print(f"  skip {task} {trial}: not JSON", flush=True)
            continue
        path = f"{task}/{trial}.json.gz"
        http("POST", f"{sb_url}/storage/v1/object/{BUCKET}/{path}", {**ours, "Content-Type": "application/gzip", "x-upsert": "true"}, gzip.compress(raw, 6))
        http(
            "POST",
            f"{sb_url}/rest/v1/tb4_trajectories?on_conflict=trial_id",
            {**ours, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"},
            json.dumps({"trial_id": trial, "task": task, "config_id": cfg, "outcome": outcome(r[2], r[3]), "object_path": path, "size_bytes": len(raw), "steps": steps}).encode(),
        )
        total += len(raw)
        if n % 25 == 0 or n == len(todo):
            print(f"  {n}/{len(todo)} uploaded, {total / 1e6:.0f} MB raw", flush=True)


if __name__ == "__main__":
    main()
