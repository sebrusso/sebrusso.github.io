#!/usr/bin/env python3
"""Fetch per-trial metadata for every Terminal-Bench 4.0 leaderboard config.

For each config in public/tb4-data/pertask.json (which carries its Harbor Hub
leaderboard row id), read the job id from the row's results page, then call
Harbor Hub's public `get_job_trials` RPC for the latest attempt of every
trial: reward, error type, cost, tokens, timing. Uses the publishable
(anonymous, read-only) key that Harbor ships in its open-source client,
fetched from that repo at run time rather than copied here.

Writes:
  public/tb4-data/trials/<task>.json   one row per config x trial for that task
  public/tb4-data/trials-meta.json     configs (with job ids) and column names

    python3 scripts/tb4/fetch_trials.py
"""

import json
import os
import re
import sys
import time
import urllib.request
from datetime import datetime

HUB = "https://hub.harborframework.com"
ROWS = f"{HUB}/datasets/terminal-bench/terminal-bench/4/leaderboards/4-0-0/rows"
CONSTANTS = "https://raw.githubusercontent.com/harbor-framework/harbor/main/src/harbor/auth/constants.py"
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "tb4-data")
DELAY = 1.0  # seconds between requests; this is someone else's database
COLUMNS = ["config", "trial", "reward", "error", "costUsd", "inputTokens", "outputTokens", "cacheTokens", "seconds", "attempts"]


def get(url: str, headers: dict | None = None, body: dict | None = None) -> bytes:
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, headers=headers or {})
    req.add_header("User-Agent", "sebrusso.github.io tb4 browser (private analysis)")
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def harbor_supabase() -> tuple[str, str]:
    src = get(CONSTANTS).decode()
    url = re.search(r'DEFAULT_SUPABASE_URL\s*=\s*"([^"]+)"', src).group(1)
    key = re.search(r'DEFAULT_SUPABASE_PUBLISHABLE_KEY\s*=\s*\(?\s*"([^"]+)"', src).group(1)
    return url, key


def seconds(start: str | None, end: str | None) -> float | None:
    if not start or not end:
        return None
    return round((datetime.fromisoformat(end) - datetime.fromisoformat(start)).total_seconds(), 1)


def main() -> None:
    per = json.load(open(os.path.join(OUT, "pertask.json")))
    url, key = harbor_supabase()
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    by_task: dict[str, list] = {}
    configs = []
    for i, cfg in enumerate(per["configs"]):
        html = get(f"{ROWS}/{cfg['hub_row_id']}?tab=results&page=1").decode("utf-8", "ignore")
        job = re.search(r'job_id\\?":\\?"([0-9a-f-]{36})', html).group(1)
        time.sleep(DELAY)
        page = json.loads(
            get(
                f"{url}/rest/v1/rpc/get_job_trials",
                headers,
                {"p_job_ids": [job], "p_page": 1, "p_page_size": 1000, "p_attempts": "latest"},
            )
        )
        time.sleep(DELAY)
        items = page["items"]
        if page["total"] != len(items):
            sys.exit(f"{cfg['id']}: got {len(items)} of {page['total']} trials; paginate")
        configs.append({"id": cfg["id"], "job": job, "trials": len(items)})
        for t in items:
            task = t["task_name"].split("/", 1)[-1]
            by_task.setdefault(task, []).append(
                [
                    i,
                    t["id"],
                    t["reward"],
                    t["error_type"],
                    round(t["cost_usd"], 4) if t["cost_usd"] is not None else None,
                    t["input_tokens"],
                    t["output_tokens"],
                    t["cache_tokens"],
                    seconds(t["started_at"], t["finished_at"]),
                    t["n_attempts"],
                ]
            )
        print(f"{i + 1:2}/{len(per['configs'])} {cfg['id']}: {len(items)} trials", flush=True)

    os.makedirs(os.path.join(OUT, "trials"), exist_ok=True)
    for task, rows in by_task.items():
        with open(os.path.join(OUT, "trials", f"{task}.json"), "w") as fh:
            json.dump(rows, fh, separators=(",", ":"))
    with open(os.path.join(OUT, "trials-meta.json"), "w") as fh:
        json.dump(
            {"source": f"{url}/rest/v1/rpc/get_job_trials (Harbor Hub, public read)", "retrieved_at": datetime.now().date().isoformat(), "columns": COLUMNS, "configs": configs},
            fh,
            indent=1,
        )
    print(f"{len(by_task)} tasks written")


if __name__ == "__main__":
    main()
