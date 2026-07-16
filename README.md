# packaging-datacloud-skill

[![Validate](https://github.com/holapancho/packaging-datacloud-skill/actions/workflows/validate.yml/badge.svg)](https://github.com/holapancho/packaging-datacloud-skill/actions/workflows/validate.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

An [Agent Skill](https://agentskills.io) that teaches AI coding agents how to package and distribute Salesforce Data 360 (Data Cloud) **Data Kits** as managed 2GP packages: Standard vs DevOps kit types, the retrieve workflow, SSOT dependency handling, publishing sequence, KQ cleanup, post-install deploy, and known packaging oddities.

Because it follows the open [Agent Skills specification](https://agentskills.io/specification), this skill works the same way across every compatible agent — Claude Code, Cursor, Codex, OpenCode, GitHub Copilot, and 60+ others — without any adaptation.

## Prerequisites

- **Node.js 18+** — only needed to run the `npx skills` installer below; the skill itself has no runtime dependency on Node.
- **Salesforce CLI (`sf`)** — the workflow this skill teaches drives `sf` commands (retrieve, `sf package version create`, deploy).
- **A Data Cloud (Data 360) enabled Salesforce org** with a Standard Data Kit to package, and a Dev Hub for 2GP package creation.

## Repository layout

```
skills/
  packaging-datacloud/
    SKILL.md        # entry point: name, description, quick workflow
    references/      # 16 detail docs, loaded on demand (progressive disclosure)
```

This matches the standard `skills/<name>/SKILL.md` layout, so the skill is discoverable by any Agent Skills-compatible tool without extra configuration.

See [`skills/packaging-datacloud/SKILL.md`](skills/packaging-datacloud/SKILL.md) for the full quick workflow, the "when to use which reference" table covering all 16 reference docs, and links to the official Salesforce Dev Guide and Help articles it's based on.

## Install

Skills in this repository are distributed through the [Agent Skills CLI](https://github.com/vercel-labs/skills) (`npx skills`), which pulls the skill directly from this GitHub repository — no npm registry publish step required.

```bash
# Install into whichever supported agent(s) you have locally
npx skills add holapancho/packaging-datacloud-skill
```

The package is also published on [npm](https://www.npmjs.com/package/packaging-datacloud-skill), mainly so it's discoverable in registry search:

```bash
npm install packaging-datacloud-skill
```

List the skills available in this repo first:

```bash
npx skills add holapancho/packaging-datacloud-skill --list
```

### Claude Code

```bash
npx skills add holapancho/packaging-datacloud-skill -a claude-code
```

This symlinks (or copies, with `--copy`) the skill into `.claude/skills/packaging-datacloud/` for the current project, or `~/.claude/skills/packaging-datacloud/` with `-g` for all projects. Without the CLI, you can get the same result by copying `skills/packaging-datacloud/` from this repo into either of those paths directly. See the [Claude Code Skills docs](https://code.claude.com/docs/en/skills).

### Cursor

```bash
npx skills add holapancho/packaging-datacloud-skill -a cursor
```

This installs to `.agents/skills/packaging-datacloud/` for the current project, or `~/.cursor/skills/packaging-datacloud/` with `-g` globally. Without the CLI, copy `skills/packaging-datacloud/` from this repo into either of those paths directly. See the [Cursor Skills docs](https://cursor.com/docs/context/skills).

### Multiple agents at once

```bash
npx skills add holapancho/packaging-datacloud-skill -a claude-code -a cursor
```

Try it once without installing:

```bash
npx skills use holapancho/packaging-datacloud-skill@packaging-datacloud | claude
```

Pin to a specific version by pointing at a tag or commit:

```bash
npx skills add https://github.com/holapancho/packaging-datacloud-skill/tree/v1.0.0
```

## Usage

Once installed, the skill activates automatically when your prompt matches its `description`. For example:

> "Package this Standard Data Kit as a managed 2GP package and walk me through the retrieve and publish steps."
>
> "I retrieved a Data Kit and the `deploymentOrder` looks off — help me debug it."
>
> "What's the SSOT dependency version I should use for this Data Kit package?"

The agent loads `SKILL.md` first, then pulls in the specific reference doc it needs (e.g. `retrieve-workflow.md`, `troubleshooting.md`) instead of loading all 16 references up front.

## Versioning

This repository follows [Semantic Versioning](https://semver.org/):

- The version of record lives in [`package.json`](package.json).
- Every release is documented in [`CHANGELOG.md`](CHANGELOG.md) (Keep a Changelog format).
- Releases are tagged in Git as `vX.Y.Z` on `main`, so consumers can pin `npx skills add` to an exact version (see above).

Bump rules: **patch** for reference/doc fixes that don't change behavior, **minor** for new references or expanded workflow coverage, **major** for a breaking change to the skill's `name`, structure, or documented workflow.

## Validating changes

```bash
npm install
npm run validate
```

`npm run validate` runs [`scripts/validate-skill.js`](scripts/validate-skill.js), which checks every `skills/*/SKILL.md` against the Agent Skills spec: the frontmatter must declare `name` (lowercase, hyphen-separated, matching the folder name) and a non-empty `description`. This also runs in CI on every push and pull request ([`.github/workflows/validate.yml`](.github/workflows/validate.yml)).

## Contributing

Issues and pull requests are welcome — this covers a fast-moving part of the Data Cloud product, so corrections to the workflow or new reference docs are useful. Before pushing, run `npm run validate` locally so CI doesn't catch avoidable frontmatter issues, and add a `CHANGELOG.md` entry for any change that affects the documented workflow.

## License

Copyright 2026 holapancho

Licensed under the [Apache-2.0](LICENSE) license.
