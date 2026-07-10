# packaging-datacloud-skill

An [Agent Skill](https://agentskills.io) that teaches AI coding agents how to package and distribute Salesforce Data 360 (Data Cloud) **Data Kits** as managed 2GP packages: Standard vs DevOps kit types, the retrieve workflow, SSOT dependency handling, publishing sequence, KQ cleanup, post-install deploy, and known packaging oddities.

Because it follows the open [Agent Skills specification](https://agentskills.io/specification), this skill works the same way across every compatible agent — Claude Code, Cursor, Codex, OpenCode, GitHub Copilot, and 60+ others — without any adaptation.

## Repository layout

```
skills/
  packaging-datacloud/
    SKILL.md            # entry point: name, description, quick workflow
    references/          # 14 detail docs, loaded on demand (progressive disclosure)
```

This matches the standard `skills/<name>/SKILL.md` layout, so the skill is discoverable by any Agent Skills-compatible tool without extra configuration.

## Install

Skills in this repository are distributed through the [Agent Skills CLI](https://github.com/vercel-labs/skills) (`npx skills`), which pulls the skill directly from this GitHub repository — no npm registry publish step required.

```bash
# Install into whichever supported agent(s) you have locally
npx skills add holapancho/packaging-datacloud-skill
```

List the skills available in this repo first:

```bash
npx skills add holapancho/packaging-datacloud-skill --list
```

Install to a specific agent (e.g. Claude Code):

```bash
npx skills add holapancho/packaging-datacloud-skill -a claude-code
```

Try it once without installing:

```bash
npx skills use holapancho/packaging-datacloud-skill@packaging-datacloud | claude
```

Pin to a specific version by pointing at a tag or commit:

```bash
npx skills add https://github.com/holapancho/packaging-datacloud-skill/tree/v1.0.0
```

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

## License

[Apache-2.0](LICENSE)
