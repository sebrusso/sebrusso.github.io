#!/usr/bin/env python3
"""Package Terminal-Bench 4.0 tasks for the task browser.

Reads a checkout of github.com/harbor-framework/terminal-bench at tag v4.0.0
and writes public/tb4-data/: index.json (metadata for every task) plus one
tasks/<name>.json per task with its text files. Files are copied verbatim,
canary lines included, so training-data filters can still recognise them.
Large data files and binaries are listed (path, size, GitHub link) but not
copied.

    git clone --depth 1 --branch v4.0.0 https://github.com/harbor-framework/terminal-bench.git /tmp/tb4
    python3 scripts/tb4/build_data.py /tmp/tb4
"""

import json
import os
import re
import subprocess
import sys
import tomllib

TAG = "v4.0.0"
REPO = "https://github.com/harbor-framework/terminal-bench"
TEXT_EXT = {
    ".md", ".toml", ".py", ".sh", ".txt", ".json", ".yaml", ".yml", ".cfg", ".ini",
    ".js", ".mjs", ".ts", ".tsx", ".jsx", ".rs", ".c", ".h", ".cpp", ".hpp", ".cu",
    ".go", ".java", ".lean", ".v", ".sv", ".html", ".css", ".sql", ".r", ".jl",
    ".ml", ".scm", ".cob", ".csv", ".xml", ".patch", ".diff",
}
TEXT_NAMES = {"Dockerfile", "Makefile", ".gitignore", "LICENSE", "requirements.txt"}
MAX_CODE = 150_000  # source and config files up to this size are copied
MAX_DATA = 20_000  # files under a data/ folder are copied only when small
SECTIONS = ["instruction.md", "task.toml", "environment", "tests", "solution"]


def section_of(rel: str) -> str:
    head = rel.split("/", 1)[0]
    return head if head in SECTIONS else "other"


def describe(task_dir: str, rel: str) -> dict:
    path = os.path.join(task_dir, rel)
    size = os.path.getsize(path)
    name = os.path.basename(rel)
    ext = os.path.splitext(name)[1].lower()
    is_text = ext in TEXT_EXT or name in TEXT_NAMES
    in_data = "/data/" in f"/{rel}"
    entry = {"path": rel, "size": size, "section": section_of(rel)}
    limit = MAX_DATA if in_data else MAX_CODE
    if is_text and size <= limit:
        try:
            with open(path, encoding="utf-8") as fh:
                entry["content"] = fh.read()
            entry["kind"] = "text"
        except UnicodeDecodeError:
            entry["kind"] = "binary"
    else:
        entry["kind"] = "data" if is_text else "binary"
    return entry


def authors(meta: dict) -> list[str]:
    raw = meta.get("author_name")
    if isinstance(raw, list):
        return [str(a) for a in raw]
    return [str(raw)] if raw else []


def main(repo: str) -> None:
    out = os.path.join(os.path.dirname(__file__), "..", "..", "public", "tb4-data")
    os.makedirs(os.path.join(out, "tasks"), exist_ok=True)
    commit = subprocess.run(["git", "-C", repo, "rev-parse", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()
    tasks_root = os.path.join(repo, "tasks")
    index = []
    for name in sorted(os.listdir(tasks_root)):
        task_dir = os.path.join(tasks_root, name)
        toml_path = os.path.join(task_dir, "task.toml")
        if not os.path.isfile(toml_path):
            continue
        with open(toml_path, "rb") as fh:
            spec = tomllib.load(fh)
        meta = spec.get("metadata", {})
        env = spec.get("environment", {})
        with open(os.path.join(task_dir, "instruction.md"), encoding="utf-8") as fh:
            instruction = fh.read()
        plain = re.sub(r"<!--.*?-->", "", instruction, flags=re.S)
        files = []
        for dirpath, dirnames, filenames in os.walk(task_dir):
            dirnames.sort()
            for f in sorted(filenames):
                rel = os.path.relpath(os.path.join(dirpath, f), task_dir)
                files.append(describe(task_dir, rel))
        tests = sum(
            len(re.findall(r"^\s*def test_", f.get("content", ""), re.M))
            for f in files
            if f["section"] == "tests" and f["path"].endswith(".py")
        )
        row = {
            "name": name,
            "category": meta.get("category"),
            "subcategory": meta.get("subcategory"),
            "tags": meta.get("tags", []),
            "authors": authors(meta),
            "expertHours": float(meta.get("expert_time_estimate_hours") or 0),
            "instructionWords": len(plain.split()),
            "tests": tests,
            "gpus": int(env.get("gpus") or 0),
            "cpus": env.get("cpus"),
            "memoryMb": env.get("memory_mb"),
            "agentTimeoutSec": spec.get("agent", {}).get("timeout_sec"),
            "verifierTimeoutSec": spec.get("verifier", {}).get("timeout_sec"),
            "fileCount": len(files),
        }
        index.append(row)
        detail = {**row, "instruction": instruction, "files": files}
        with open(os.path.join(out, "tasks", f"{name}.json"), "w", encoding="utf-8") as fh:
            json.dump(detail, fh, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(out, "index.json"), "w", encoding="utf-8") as fh:
        json.dump(
            {"tag": TAG, "commit": commit, "repo": REPO, "tasks": index},
            fh,
            ensure_ascii=False,
            separators=(",", ":"),
        )
    print(f"{len(index)} tasks -> {os.path.relpath(out)} (commit {commit[:7]})")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
