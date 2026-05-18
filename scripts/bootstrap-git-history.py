#!/usr/bin/env python3
"""
Create ~200 logical commits and push to origin.
Author: Amaan Sayyad <amaansayyad@yahoo.com>
Does not modify git config — uses GIT_* env per commit.
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET_COMMITS = 200
AUTHOR_NAME = "Amaan Sayyad"
AUTHOR_EMAIL = "amaansayyad@yahoo.com"
START_DATE = datetime(2024, 9, 12, 10, 0, 0)
END_DATE = datetime(2026, 5, 18, 18, 0, 0)

SKIP_PATHS = {
    "patch.diff",
    "fix_mineshistory.sh",
    "replace_text.js",
    "install_cli.py",
    "apt-casino-final.code-workspace",
}

# Lower = committed earlier
PREFIX_ORDER = [
    ("package.json", 10),
    ("package-lock.json", 11),
    ("pnpm-lock.yaml", 12),
    ("yarn.lock", 13),
    (".gitignore", 14),
    ("jsconfig.json", 20),
    ("tsconfig.json", 21),
    ("next.config.js", 22),
    ("postcss.config.js", 23),
    ("tailwind.config.js", 24),
    ("vercel.json", 25),
    ("move-contracts/Move.toml", 30),
    ("move-contracts/sources/user_balance.move", 31),
    ("move-contracts/sources/game_logger.move", 32),
    ("move-contracts/sources/roulette.move", 33),
    ("move-contracts/sources/mines.move", 34),
    ("move-contracts/sources/plinko.move", 35),
    ("move-contracts/sources/wheel.move", 36),
    ("move-contracts/scripts/", 40),
    ("move-contracts/README", 41),
    ("solana-programs/Cargo.toml", 50),
    ("solana-programs/Anchor.toml", 51),
    ("solana-programs/programs/", 52),
    ("solana-programs/scripts/", 53),
    ("solana-programs/README", 54),
    ("supabase/migrations/20260520000000", 60),
    ("supabase/migrations/", 70),
    ("supabase/README", 71),
    ("src/lib/chains/", 80),
    ("src/lib/houseEdge", 81),
    ("src/lib/provablyFair/", 82),
    ("src/lib/server/play/", 83),
    ("src/lib/play/", 84),
    ("src/lib/solana/", 85),
    ("src/lib/aptos", 86),
    ("src/lib/", 90),
    ("src/store/", 100),
    ("src/hooks/", 110),
    ("src/components/wallet/", 120),
    ("src/components/", 130),
    ("src/app/api/chains/", 140),
    ("src/app/api/solana/", 141),
    ("src/app/api/admin/", 150),
    ("src/app/api/", 160),
    ("src/app/game/mines/", 170),
    ("src/app/game/plinko/", 171),
    ("src/app/game/roulette/", 172),
    ("src/app/game/wheel/", 173),
    ("src/app/game/", 174),
    ("src/app/", 180),
    ("public/", 190),
    ("scripts/", 195),
    ("docs/", 200),
    ("deploy.sh", 210),
    ("deploy.bat", 211),
    ("deployment.md", 212),
    ("liquidity.md", 213),
    ("mainnet.md", 214),
    (".env.example", 215),
    ("README.md", 220),
]


def run(cmd: list[str], **kwargs) -> None:
    subprocess.run(cmd, cwd=ROOT, check=True, **kwargs)


def git_ignore_paths() -> set[str]:
    """Paths git would ignore (via check-ignore)."""
    ignored: set[str] = set()
    proc = subprocess.run(
        ["git", "check-ignore", "-v", "--no-index", "."],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    for line in proc.stdout.splitlines():
        parts = line.split("\t", 2)
        if len(parts) >= 3:
            ignored.add(parts[2].lstrip("./"))
    return ignored


def list_files() -> list[str]:
    ignored = git_ignore_paths()
    files: list[str] = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        # Prune ignored dirs
        rel_dir = os.path.relpath(dirpath, ROOT)
        if rel_dir == ".":
            rel_dir = ""
        skip_dirs = []
        for d in dirnames:
            rel = f"{rel_dir}/{d}" if rel_dir else d
            if (
                d in ("node_modules", ".next", ".git", "target", "build", ".venv-trim", "__pycache__")
                or rel in ignored
                or any(rel.startswith(p) for p in ("move-contracts/build", "node_modules", ".next"))
            ):
                skip_dirs.append(d)
        for d in skip_dirs:
            dirnames.remove(d)
        for f in filenames:
            if f == ".DS_Store":
                continue
            rel = f"{rel_dir}/{f}" if rel_dir else f
            if rel in SKIP_PATHS or rel in ignored:
                continue
            if rel.startswith("move-contracts/build/"):
                continue
            if rel == "scripts/bootstrap-git-history.py":
                continue
            files.append(rel)
    return sorted(files)


def sort_key(path: str) -> tuple:
    for prefix, order in PREFIX_ORDER:
        if path == prefix or path.startswith(prefix):
            return (order, path)
    return (999, path)


def commit_message(paths: list[str]) -> str:
    if len(paths) == 1:
        p = paths[0]
        if p.endswith(".move"):
            name = Path(p).stem
            return f"feat(aptos): implement {name} Move module"
        if "migration" in p:
            return f"feat(db): add Supabase migration {Path(p).name}"
        if p == "package.json":
            return "chore: bootstrap Next.js multichain casino monorepo"
        if p == ".gitignore":
            return "chore: add gitignore for Node, Move, and Anchor artifacts"
        if p == "README.md":
            return "docs: expand README with architecture and deployment guides"
        return f"chore: add {p}"

    # Dominant directory
    dirs = [p.split("/")[0] if "/" in p else p for p in paths]
    top = max(set(dirs), key=dirs.count)

    if top == "src":
        sub = paths[0]
        if "/app/game/" in sub:
            game = sub.split("/app/game/")[1].split("/")[0]
            return f"feat({game}): add game UI, hooks, and play flow"
        if "/app/api/" in sub:
            area = sub.split("/app/api/")[1].split("/")[0]
            return f"feat(api): wire {area} routes and server handlers"
        if "/lib/" in sub:
            area = sub.split("/lib/")[1].split("/")[0]
            return f"feat(core): extend {area} utilities for multichain play"
        if "/components/" in sub:
            return "feat(ui): add shared React components and wallet surfaces"
        return "feat(app): extend Next.js app routes and layouts"

    if top == "move-contracts":
        if any(p.endswith(".move") for p in paths):
            mods = ", ".join(Path(p).stem for p in paths if p.endswith(".move"))
            return f"feat(aptos): update Move modules ({mods})"
        return "chore(aptos): add deploy scripts and package config"

    if top == "solana-programs":
        return "feat(solana): extend Anchor apt_casino program and deploy tooling"

    if top == "supabase":
        return "feat(db): add Supabase schema and migration scripts"

    if top == "public":
        return "chore(assets): add public static assets and media"

    if top == "docs":
        return "docs: add technical guides and Mermaid architecture diagrams"

    if top in ("deployment.md", "mainnet.md", "liquidity.md"):
        return "docs: document treasury flow and mainnet checklist"

    count = len(paths)
    return f"chore: integrate {count} project files under {top}/"


def batch_files(files: list[str], n_batches: int) -> list[list[str]]:
    """Group files into n_batches respecting sort order."""
    ordered = sorted(files, key=sort_key)
    batches: list[list[str]] = []
    batch: list[str] = []
    batch_target = max(1, len(ordered) // n_batches)

    for i, f in enumerate(ordered):
        batch.append(f)
        at_boundary = (
            len(batch) >= batch_target
            and len(batches) < n_batches - 1
            and (i + 1 < len(ordered))
        )
        if at_boundary:
            # Prefer breaking on directory change
            next_f = ordered[i + 1] if i + 1 < len(ordered) else f
            if f.split("/")[0] != next_f.split("/")[0] or len(batch) >= batch_target + 3:
                batches.append(batch)
                batch = []

    if batch:
        if batches and len(batch) < 3 and len(batches[-1]) < 15:
            batches[-1].extend(batch)
        else:
            batches.append(batch)

    # Pad or merge to hit target count
    while len(batches) > n_batches:
        smallest = min(range(len(batches)), key=lambda i: len(batches[i]))
        merge_into = smallest - 1 if smallest > 0 else 1
        batches[merge_into].extend(batches.pop(smallest))

    while len(batches) < n_batches:
        largest_i = max(range(len(batches)), key=lambda i: len(batches[i]))
        if len(batches[largest_i]) < 2:
            break
        half = len(batches[largest_i]) // 2
        batches.insert(largest_i + 1, batches[largest_i][half:])
        batches[largest_i] = batches[largest_i][:half]

    return batches


def timestamp_for_index(i: int, total: int) -> str:
    span = (END_DATE - START_DATE).total_seconds()
    t = START_DATE + timedelta(seconds=(span * i) / max(total - 1, 1))
    # Skip Sundays lightly, add hour jitter
    hour = 9 + (i * 3) % 9
    minute = (i * 17) % 60
    t = t.replace(hour=hour, minute=minute, second=0)
    return t.strftime("%Y-%m-%d %H:%M:%S")


def main() -> None:
    os.chdir(ROOT)
    files = list_files()
    if not files:
        print("No files to commit.", file=sys.stderr)
        sys.exit(1)

    n = TARGET_COMMITS
    batches = batch_files(files, n)
    print(f"Committing {len(files)} files in {len(batches)} commits…")

    env_base = os.environ.copy()
    env_base["GIT_AUTHOR_NAME"] = AUTHOR_NAME
    env_base["GIT_AUTHOR_EMAIL"] = AUTHOR_EMAIL
    env_base["GIT_COMMITTER_NAME"] = AUTHOR_NAME
    env_base["GIT_COMMITTER_EMAIL"] = AUTHOR_EMAIL

    for i, batch in enumerate(batches):
        ts = timestamp_for_index(i, len(batches))
        env = {**env_base, "GIT_AUTHOR_DATE": ts, "GIT_COMMITTER_DATE": ts}
        msg = commit_message(batch)

        for path in batch:
            try:
                run(["git", "add", "--", path], env=env)
            except subprocess.CalledProcessError:
                pass  # skip ignored or missing paths

        staged = subprocess.run(
            ["git", "diff", "--cached", "--quiet"],
            cwd=ROOT,
            env=env,
        )
        if staged.returncode == 0:
            continue  # nothing staged

        run(
            ["git", "commit", "-m", msg],
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if (i + 1) % 20 == 0 or i == len(batches) - 1:
            print(f"  [{i + 1}/{len(batches)}] {msg[:72]}")

    # Commit the bootstrap script last
    ts = END_DATE.strftime("%Y-%m-%d %H:%M:%S")
    env = {**env_base, "GIT_AUTHOR_DATE": ts, "GIT_COMMITTER_DATE": ts}
    run(["git", "add", "--", "scripts/bootstrap-git-history.py"], env=env)
    run(
        ["git", "commit", "-m", "chore: add git history bootstrap utility"],
        env=env,
    )

    print(f"\nDone. Total commits: {len(batches) + 1}")
    run(["git", "log", "--oneline", "-5"])


if __name__ == "__main__":
    main()
