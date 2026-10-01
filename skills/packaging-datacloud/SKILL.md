---
name: packaging-datacloud
description: >
  Package and ship Salesforce Data 360 (Data Cloud) Data Kits as managed 2GP packages: Standard vs DevOps
  kit types, retrieve workflow, SSOT dependency, publishing sequence, KQ cleanup, Connect REST deploy /
  undeploy after install, packaging oddities, and DLO/DMO field naming (stream-backed vs owned write-target
  lakes; subscriber-owned transforms). Use when packaging data kits, DataPackageKitDefinition, DMOs, data
  streams, Connect ssot/data-kits deploy or undeploy, or Data Cloud metadata for AppExchange or managed
  package distribution.
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
10. **Subscriber:** install package → deploy kit components — [post-install-deploy-runbook.md](references/post-install-deploy-runbook.md) (workflow) + [deploy-kit-components.md](references/deploy-kit-components.md) (payloads). **Managed 2GP:** namespace on kit **lookup** fields in deploy payloads only; **runtime** stream/DLO/`apiName`s usually stay unqualified but still **belong to the kit** (Undeploy via kit API).

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
| Official considerations / common issues | [data-kit-considerations.md](references/data-kit-considerations.md) — KB 003960830 |
| Post-install deploy (Connect payloads + naming) | [deploy-kit-components.md](references/deploy-kit-components.md) — Connect preferred; Flow legacy |
| Post-install runbook (operator steps) | [post-install-deploy-runbook.md](references/post-install-deploy-runbook.md) — sequence, lake checks, transform run, checklist |
| Undeploy / uninstall (generic) | [undeploy-uninstall-runbook.md](references/undeploy-uninstall-runbook.md) — reverse sequence; Currency Connection before `StaticCurrencyRatesTransform_*` |
| Transform → DMO → search data cascade | [catalog-search-data-cascade.md](references/catalog-search-data-cascade.md) — generic; deploy vs run; manual full-run + search redeploy |
| Stream vs owned DLO/DMO field naming | [dlo-dmo-field-naming.md](references/dlo-dmo-field-naming.md) — connector names vs write contract; kit without packaged transform |
| DevOps CLI sandbox→prod (not 2GP) | [devops-cli-workflow.md](references/devops-cli-workflow.md) |
| Governance mergeback (not CLI) | [governance-mergeback-devops.md](references/governance-mergeback-devops.md) |
| Connect data-kit endpoints (slim index) | [openapi/data-kit-endpoints.md](openapi/data-kit-endpoints.md) |
| Failures | [troubleshooting.md](references/troubleshooting.md) |

## Critical rules

- **Standard** kit for packaging; **DevOps** for in-house sandbox→prod only
- **Winter '25+:** no Apex/LWC/Flow/agents in the Data Kit package directory
- **Publishing sequence** required; verify `deploymentOrder` after retrieve
- **KQ cleanup:** delete standalone `objects/*/fields/KQ_*` only; keep embedded `keyQualifierName` in `dataSourceObject`
- **No hand-added `ObjectSourceTargetMap`** — breaks `package version create` ([packaging-oddities.md](references/packaging-oddities.md))
- **SSOT:** current Help `04t` ID; **version create** wait **90+** minutes (official samples use `-w 45`; too short for many Data Kit builds)
- **Undeploy before uninstall**; **Currency Connection** off before `StaticCurrencyRatesTransform_*` (KB [002774314](https://help.salesforce.com/s/articleView?id=002774314&type=1)) — more undeploy traps: [undeploy-uninstall-runbook.md](references/undeploy-uninstall-runbook.md)
- **Kit ownership ≠ runtime namespace:** unqualified runtime lakes/streams stay kit-owned; never force `Namespace__` on Connect `apiName` ([deploy-kit-components.md](references/deploy-kit-components.md)). Field naming: [dlo-dmo-field-naming.md](references/dlo-dmo-field-naming.md). Retrieved `dataKitType: NONE` / `isDeployed: false` is normal ([kit-definition-metadata.md](references/kit-definition-metadata.md)).

## Official sources

- [2GP workflow for Data Kits (Dev Guide)](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/data-cloud-2gp-workflow.html)
- [Packages and Data Kits (Dev Guide)](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/packages-data-kits.html)
- [Metadata Components for Data 360 Cheat Sheet](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/component-cheatsheet.html)
- [Data 360 Metadata Types (Metadata API)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_data_cloud_types.htm)
- [Deploy Data Kits — Connect REST (Dev Guide)](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-deploy-data-kits-using-connect-api.html)
- [Supported Component Types for Data Kit Deployment (payloads)](https://developer.salesforce.com/docs/data/connectapi/guide/deploy-data-kit-payloads.html)
- [Deploy Data Kit Components — Flow (legacy)](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-deploy_data_kit_components.html)
- [CLI Deploy Data Kit from Sandbox (DevOps)](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-deploy_data_kit_using_cli.html)
- [Help — Data Kits](https://help.salesforce.com/s/articleView?id=data.c360_a_data_package_kits.htm&type=5)
- [Data 360 Limits and Guidelines](https://help.salesforce.com/s/articleView?id=data.c360_a_limits_and_guidelines.htm&type=5)
- [Currency Data Streams / DLOs / DMOs (002774314)](https://help.salesforce.com/s/articleView?id=002774314&type=1)
- Help child articles / KBs: [references/help-articles-index.md](references/help-articles-index.md)
- Local Connect path index: [openapi/data-kit-endpoints.md](openapi/data-kit-endpoints.md)
