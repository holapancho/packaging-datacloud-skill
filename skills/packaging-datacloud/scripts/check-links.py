#!/usr/bin/env python3
"""Check relative markdown links under packaging-datacloud (SKILL + references + openapi).

Usage (from this skill's directory; paths resolve from this file, so any cwd works):
  python3 scripts/check-links.py

Exit 0 if all relative file links resolve; 1 otherwise.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parents[1]
LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")


def iter_md_files() -> list[Path]:
    files = [SKILL_ROOT / "SKILL.md"]
    files.extend(sorted((SKILL_ROOT / "references").glob("*.md")))
    openapi = SKILL_ROOT / "openapi"
    if openapi.is_dir():
        files.extend(sorted(openapi.glob("*.md")))
    return [f for f in files if f.is_file()]


def check_file(path: Path) -> list[str]:
    errors: list[str] = []
    text = path.read_text(encoding="utf-8")
    for match in LINK_RE.finditer(text):
        url = match.group(2).strip()
        if not url or url.startswith(("#", "http://", "https://", "mailto:")):
            continue
        # strip title / optional angle brackets
        if url.startswith("<") and ">" in url:
            url = url[1 : url.index(">")]
        target = url.split("#", 1)[0].split(" ", 1)[0]
        if not target:
            continue
        resolved = (path.parent / target).resolve()
        try:
            resolved.relative_to(SKILL_ROOT.resolve())
        except ValueError:
            # allow links that escape skill root only if they exist
            pass
        if not resolved.exists():
            errors.append(f"{path.relative_to(SKILL_ROOT)}: broken → {url}")
    return errors


def main() -> int:
    all_errors: list[str] = []
    for md in iter_md_files():
        all_errors.extend(check_file(md))
    if all_errors:
        print(f"Found {len(all_errors)} broken relative link(s):")
        for err in all_errors:
            print(f"  {err}")
        return 1
    print(f"OK — checked {len(iter_md_files())} markdown files under {SKILL_ROOT.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
