# packaging-datacloud scripts

```bash
# From this skill's directory — verify relative markdown links in this skill
python3 scripts/check-links.py
```

The script resolves paths from its own location, so it also works from any other directory. Point it at wherever the skill is installed, for example `skills/packaging-datacloud/` in the source repo, `.claude/skills/packaging-datacloud/` for Claude Code, or `.agents/skills/packaging-datacloud/` for Cursor.

Exit `0` if OK; `1` and a list of broken links otherwise.
