#!/usr/bin/env python3
"""Per-task statistics for the TB4 browser, from the per-trial data.

Reads public/tb4-data/pertask.json and trials/*.json and writes
public/tb4-data/analysis.json with, per task: solve rate and its Wilson 95%
interval, a 2PL item-response fit (difficulty, discrimination), how well
passing tracks model strength, how often a config's 5 trials disagree, the
outcome breakdown, and median cost, time and output tokens per attempt.

Needs numpy and scipy; run locally after fetch_trials.py:
    python3 scripts/tb4/analyze.py
"""

import json
import math
import os
import statistics

import numpy as np
from scipy.optimize import minimize
from scipy.special import expit

DATA = os.path.join(os.path.dirname(__file__), "..", "..", "public", "tb4-data")

# Harbor error types grouped into outcomes a reader can act on. A trial whose
# reward is 1 counts as passed whatever error it also logged.
OUTCOMES = {
    "AgentTimeoutError": "timeout",
    "OutputTokenExceededError": "token_limit",
    "ContextWindowExceededError": "token_limit",
    "AgentSafetyRefusalError": "refusal",
    "NonZeroAgentExitCodeError": "crash",
    "ValueError": "crash",
}
# Everything else that isn't listed (API, network, verifier, setup errors) is "infra".
SUSPECT_CORR = 0.1  # passing barely tracks (or runs against) model strength


def outcome(reward, error):
    if (reward or 0) >= 1:
        return "passed"
    if error is None:
        return "tests_failed"
    return OUTCOMES.get(error, "infra")


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return (0.0, 1.0)
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (max(0.0, c - h), min(1.0, c + h))


def fit_2pl(P: np.ndarray, N: np.ndarray):
    """MAP 2PL IRT on binomial counts; priors keep never/always-solved tasks finite."""
    M, T = P.shape

    def f(x):
        th, b, la = x[:M], x[M : M + T], x[M + T :]
        a = np.exp(la)
        diff = th[:, None] - b[None, :]
        p = np.clip(expit(a[None, :] * diff), 1e-9, 1 - 1e-9)
        ll = (P * np.log(p) + (N - P) * np.log(1 - p)).sum()
        prior = -(th**2).sum() / 2 - (b**2).sum() / 18 - (la**2).sum() / (2 * 0.49)
        r = P - N * p
        g = np.concatenate([(r * a).sum(1) - th, -(r * a).sum(0) - b / 9, (r * diff * a).sum(0) - la / 0.49])
        return -(ll + prior), -g

    res = minimize(f, np.zeros(M + 2 * T), jac=True, method="L-BFGS-B", options={"maxiter": 20000})
    if not res.success:
        raise SystemExit(f"IRT fit did not converge: {res.message}")
    x = res.x
    return x[:M], x[M : M + T], np.exp(x[M + T :])


def main() -> None:
    per = json.load(open(os.path.join(DATA, "pertask.json")))
    cfg = [c["id"] for c in per["configs"]]
    tasks = sorted(per["results"])
    P = np.array([[per["results"][t][c]["passed"] for t in tasks] for c in cfg], float)
    N = np.array([[per["results"][t][c]["trials"] for t in tasks] for c in cfg], float)
    theta, difficulty, discrimination = fit_2pl(P, N)

    out = {}
    for j, task in enumerate(tasks):
        rows = json.load(open(os.path.join(DATA, "trials", f"{task}.json")))
        counts = {k: 0 for k in ["passed", "tests_failed", "timeout", "token_limit", "refusal", "crash", "infra"]}
        for r in rows:
            counts[outcome(r[2], r[3])] += 1
        k, n = int(P[:, j].sum()), int(N[:, j].sum())
        rates = P[:, j] / N[:, j]
        corr = float(np.corrcoef(theta, rates)[0, 1]) if 0 < k < n else None
        mixed = float(((P[:, j] > 0) & (P[:, j] < N[:, j])).mean())

        def med(i):
            vals = [r[i] for r in rows if r[i] is not None]
            return statistics.median(vals) if vals else None

        lo, hi = wilson(k, n)
        out[task] = {
            "passed": k,
            "trials": n,
            "solveCi": [round(lo, 4), round(hi, 4)],
            "difficulty": round(float(difficulty[j]), 3),
            "discrimination": round(float(discrimination[j]), 3),
            "abilityCorr": None if corr is None else round(corr, 3),
            "suspect": corr is not None and corr < SUSPECT_CORR,
            "mixedShare": round(mixed, 3),
            "outcomes": counts,
            "medianCostUsd": None if med(4) is None else round(med(4), 3),
            "medianSeconds": med(8),
            "medianOutputTokens": med(6),
        }
    with open(os.path.join(DATA, "analysis.json"), "w") as fh:
        json.dump(
            {
                "configs": {c: {"ability": round(float(theta[i]), 3)} for i, c in enumerate(cfg)},
                "suspectBelow": SUSPECT_CORR,
                "tasks": out,
            },
            fh,
            separators=(",", ":"),
        )
    flagged = [t for t, v in out.items() if v["suspect"]]
    print(f"{len(out)} tasks; {len(flagged)} suspect: {', '.join(flagged)}")


if __name__ == "__main__":
    main()
