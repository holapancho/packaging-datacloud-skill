# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.3.0] - 2026-10-03

### Added

- New [references/promoted-version-changes.md](skills/packaging-datacloud/references/promoted-version-changes.md): what happens when you add, modify, rename, or delete components after a promoted Data Kit version (version creation → upgrade → redeploy of the same kit), why undeploy is for uninstall only, and multiple Standard data kits in one package.

### Changed

- `SKILL.md` frontmatter `description` now covers changes to a promoted package version and multiple data kits per package; reference table links the new doc; Critical rules add the upgrade-then-redeploy rule, scope "undeploy before uninstall" to uninstall only, and note that a package can hold one or more Standard data kits deployed individually.
- `references/2gp-workflow.md` and `references/data-kit-considerations.md` link to the new promoted-version reference.
- `references/post-install-deploy-runbook.md` and `references/undeploy-uninstall-runbook.md` point to it: after an upgrade, redeploy the same kit; do not undeploy first.
- README: reference count updated to 18, version-pin example now uses `v1.3.0`, new usage example for changes after a promoted version.

## [1.2.0] - 2026-09-28

### Added

- New `openapi/` directory: [openapi/data-kit-endpoints.md](skills/packaging-datacloud/openapi/data-kit-endpoints.md), a slim index of Connect REST paths for data-kit packaging/deploy/undeploy (deliberately not the full multi-MB Connect OpenAPI dump).
- New `scripts/check-links.py`: verifies every relative markdown link under `SKILL.md`, `references/`, and `openapi/` resolves to a real file. Runnable standalone or by an agent via bash.
- New [references/dlo-dmo-field-naming.md](skills/packaging-datacloud/references/dlo-dmo-field-naming.md) — stream-backed vs owned write-target lake field naming, subscriber-owned transforms.
- `references/data-kit-considerations.md` now linked directly from the SKILL.md reference table (KB 003960830).

### Changed

- `references/deploy-components-flow.md` renamed and rewritten as [references/deploy-kit-components.md](skills/packaging-datacloud/references/deploy-kit-components.md): Connect REST payloads and naming as the preferred path, Flow marked legacy.
- `references/post-install-deploy-runbook.md` trimmed to operator steps/sequence/checklist; payload and naming detail moved to `deploy-kit-components.md`.
- `SKILL.md` frontmatter `description`, reference table, Critical rules, and Official sources refreshed for Connect-first deploy/undeploy and DLO/DMO field naming; several reference docs (`2gp-workflow.md`, `catalog-search-data-cascade.md`, `data-kit-considerations.md`, `devops-cli-workflow.md`, `help-articles-index.md`, `metadata-cheatsheet.md`, `packaging-oddities.md`, `retrieve-workflow.md`, `ssot-package-dependency.md`, `troubleshooting.md`) updated for consistency with the above.

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
