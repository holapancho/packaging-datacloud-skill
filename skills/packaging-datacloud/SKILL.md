---
name: packaging-datacloud
description: >
  Package and ship Salesforce Data 360 (Data Cloud) Data Kits as managed 2GP packages: Standard vs DevOps
  kit types, retrieve workflow, SSOT dependency, publishing sequence, KQ cleanup, deploy after install,
  undeploy/uninstall (including Currency Connection / StaticCurrencyRates blockers), and packaging oddities.
  Use when packaging data kits, DataPackageKitDefinition, DMOs, data streams, or Data Cloud metadata for
  AppExchange or managed package distribution.
---

# packaging-datacloud

Workflow for **Standard** data kits in **managed 2GP** packages (Data Cloud / Data 360). **DevOps** kits are for sandbox→prod mergeback — not for packaging. See [references/standard-vs-devops-data-kits.md](references/standard-vs-devops-data-kits.md).

## Quick workflow

1. **Create Standard kit** in source org — add components, set **Publishing Sequence** (Edit Sequence → Save)
2. **Dedicated package directory** in `sfdx-project.json` — Data Cloud metadata only (Winter '25+)
3. **Download manifest** → save as `package.xml` at package root
4. **Retrieve** — [references/retrieve-workflow.md](references/retrieve-workflow.md)
5. **Post-retrieve cleanup** — delete standalone `KQ_*.field-meta.xml` under `objects/`; keep embedded `keyQualifierName` in DLOs
6. **Verify** `DataPackageKitDefinition.deploymentOrder` in Git
7. **SSOT dependency** — current version from Help, not outdated Partner Community IDs — [references/ssot-package-dependency.md](references/ssot-package-dependency.md)
8. **Test deploy** on scratch subscriber org
9. **`sf package version create -w 90`** — [references/2gp-workflow.md](references/2gp-workflow.md)
10. **Subscriber:** install package → deploy kit components — [post-install-deploy-runbook.md](references/post-install-deploy-runbook.md) (workflow) + [deploy-components-flow.md](references/deploy-components-flow.md) (payloads). **Managed 2GP:** namespace on kit **lookup** fields in deploy payloads only.

**Do not use UI Publish → Package Manager** for 2GP — that is the 1GP path. Use retrieve + CLI version create.

## When to use which reference

| Goal | Document |
|------|----------|
| Retrieve kit from org into Git | [retrieve-workflow.md](references/retrieve-workflow.md) |
| Standard vs DevOps kit types | [standard-vs-devops-data-kits.md](references/standard-vs-devops-data-kits.md) |
| Help article index | [help-articles-index.md](references/help-articles-index.md) |
| Managed 2GP build & promote | [2gp-workflow.md](references/2gp-workflow.md) |
| SSOT package dependency | [ssot-package-dependency.md](references/ssot-package-dependency.md) |
| Metadata types in kit | [metadata-cheatsheet.md](references/metadata-cheatsheet.md) |
| Kit definition flags & sequence | [kit-definition-metadata.md](references/kit-definition-metadata.md) |
| KQ cleanup, sequence, SSOT traps | [packaging-oddities.md](references/packaging-oddities.md) |
| Post-install deploy (payloads) | [deploy-components-flow.md](references/deploy-components-flow.md) |
| Post-install runbook (generic) | [post-install-deploy-runbook.md](references/post-install-deploy-runbook.md) — includes lake verification, transform run API, SKIPPED_NO_CHANGES |
| Undeploy / uninstall (generic) | [undeploy-uninstall-runbook.md](references/undeploy-uninstall-runbook.md) — reverse sequence; Currency Connection before `StaticCurrencyRatesTransform_*` |
| Transform → DMO → search data cascade | [catalog-search-data-cascade.md](references/catalog-search-data-cascade.md) — generic; deploy vs run; manual full-run + search redeploy |
| DevOps CLI sandbox→prod (not 2GP) | [devops-cli-workflow.md](references/devops-cli-workflow.md) |
| Governance mergeback (not CLI) | [governance-mergeback-devops.md](references/governance-mergeback-devops.md) |
| Failures | [troubleshooting.md](references/troubleshooting.md) |

## Critical rules

- **Standard** kit for packaging; **DevOps** for in-house sandbox→prod only
- **Winter '25+:** no Apex/LWC/Flow/agents in the Data Kit package directory
- **Publishing sequence** required before packaging; verify `deploymentOrder` after retrieve
- **`dataKitType: NONE`** + **`isDeployed: false`** in retrieved metadata is normal — [kit-definition-metadata.md](references/kit-definition-metadata.md)
- **KQ cleanup:** delete standalone `objects/*/fields/KQ_*` only; keep embedded `keyQualifierName` in `dataSourceObject`
- **SSOT:** use Help article version list for `04t` ID
- **Package version create:** allow 90+ minutes wait time
- **Undeploy before uninstall** when components were activated; reverse `deploymentOrder`, trust dependency errors (transforms before DLOs)
- **Currency:** Undeploy blocked by `StaticCurrencyRatesTransform_*` → **disable Currency Connection** first (KB [002774314](https://help.salesforce.com/s/articleView?id=002774314&type=1))
- **Ghost streams:** Connect says stream gone but DLO/uninstall still blocked → delete Tooling `DataStreamDefinition` — [undeploy-uninstall-runbook.md](references/undeploy-uninstall-runbook.md)
- **Leftover DLOs after uninstall are expected** (locked kit orphans + platform `StaticCurrencyRates_*`) — package gone ≠ empty Data Lake Objects list — [undeploy-uninstall-runbook.md](references/undeploy-uninstall-runbook.md)

## Official sources

- [Package and Distribute Data Kits (Dev Guide)](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/c360-a-data-kit-package-and-distribute.html)
- [Deploy Data Kit Components (Dev Guide)](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/c360-a-data-kit-deploy-components.html)
- [Help — Data Kits](https://help.salesforce.com/s/articleView?id=data.c360_a_data_package_kits.htm&type=5)
- [Currency Data Streams / DLOs / DMOs (002774314)](https://help.salesforce.com/s/articleView?id=002774314&type=1)
