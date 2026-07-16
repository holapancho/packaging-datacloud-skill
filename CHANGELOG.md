# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-07-16

### Added

- Undeploy/uninstall workflow coverage: new [references/undeploy-uninstall-runbook.md](skills/packaging-datacloud/references/undeploy-uninstall-runbook.md) — reverse publishing sequence, Currency Connection blocker (`StaticCurrencyRatesTransform_*`), ghost `DataStreamDefinition` cleanup, and expected leftover DLOs after uninstall.
- 5 new troubleshooting entries in `references/troubleshooting.md` covering undeploy/uninstall failures.
- `SKILL.md` frontmatter `description`, reference table, and Critical rules updated to cover undeploy/uninstall.

## [1.0.0] - 2026-07-10

### Added

- `packaging-datacloud` Agent Skill, compliant with the [Agent Skills specification](https://agentskills.io/specification): package and ship Salesforce Data 360 (Data Cloud) Data Kits as managed 2GP packages.
- 14 reference documents under `skills/packaging-datacloud/references/` for progressive disclosure (retrieve workflow, 2GP workflow, SSOT dependency, troubleshooting, etc.).
- `package.json` for npm-ecosystem versioning (semantic versioning).
- `scripts/validate-skill.js` to check `SKILL.md` frontmatter compliance.
- CI workflow to run the validation script on every push and pull request.
