# Salesforce Help — Data Kits (index)

Official Help hub and child articles. Prefer these over community blogs when choosing kit type or troubleshooting.

## Hub

| Article | URL | Use when |
|---------|-----|----------|
| **Data Kits** (overview) | [data.c360_a_data_package_kits.htm](https://help.salesforce.com/s/articleView?id=data.c360_a_data_package_kits.htm&type=5) | Choosing Standard vs DevOps; managed package lifecycle overview |

**Key quotes from hub:**

- **Standard:** Package and share with customers; deploy to **any data space** in target org.
- **DevOps:** Migrate sandbox→prod; **not to package** Data 360 metadata; deploy to **same data space** in target org.

## Standard kit + packaging

| Article | URL |
|---------|-----|
| Create and Publish a Standard Data Kit | [data.c360_a_data_stream_bundle_package_kits.htm](https://help.salesforce.com/s/articleView?id=data.c360_a_data_stream_bundle_package_kits.htm&type=5) |
| Add a Data Kit to a Package | [data.c360_a_publish_package_kit.htm](https://help.salesforce.com/s/articleView?id=data.c360_a_publish_package_kit.htm&type=5) |
| Deploy Data Kit Components | [data.c360_deploy_data_kit_components.htm](https://help.salesforce.com/s/articleView?id=data.c360_deploy_data_kit_components.htm&type=5) |
| Update a Data Kit | [data.c360_a_update_a_data_kit_in_customer_data_platform.htm](https://help.salesforce.com/s/articleView?id=data.c360_a_update_a_data_kit_in_customer_data_platform.htm&type=5) |
| Uninstall a Deployed Data Kit | [data.c360_uninstall_data_kit.htm](https://help.salesforce.com/s/articleView?id=data.c360_uninstall_data_kit.htm&type=5) |

Hub workflow (1GP Package Manager style) parallels **2GP CLI** — same **Standard** kit type; different upload tooling. See [2gp-workflow.md](2gp-workflow.md).

Agent runbook for undeploy/uninstall (including Currency): [undeploy-uninstall-runbook.md](undeploy-uninstall-runbook.md).

## Considerations & troubleshooting

| Article | URL |
|---------|-----|
| Considerations for Data Kits | [003960830](https://help.salesforce.com/s/articleView?id=003960830&type=1) — also [data-kit-considerations.md](data-kit-considerations.md) |
| SSOT package versions (2GP dependency) | [002234049](https://help.salesforce.com/s/articleView?id=002234049&type=1) — also [ssot-package-dependency.md](ssot-package-dependency.md) |
| Currency Data Streams / DLOs / DMOs (`StaticCurrencyRates*`) | [002774314](https://help.salesforce.com/s/articleView?id=002774314&type=1) — disable **Currency Connection** before deleting related streams; blocks kit Undeploy when CRM bundle includes `CurrencyType_*` |

## DevOps-only

| Article | URL |
|---------|-----|
| Governance mergeback with DevOps kits | [data.c360_a_mergeback_devops_datakits.htm](https://help.salesforce.com/s/articleView?id=data.c360_a_mergeback_devops_datakits.htm&type=5) — see [governance-mergeback-devops.md](governance-mergeback-devops.md) |

## Developer docs (complement Help)

- [Packages and Data Kits](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/packages-data-kits.html)
- [2GP workflow](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/data-cloud-2gp-workflow.html)
- [CLI sandbox → prod (DevOps)](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-deploy_data_kit_using_cli.html)
- [Deploy Components Flow (REST)](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-deploy_data_kit_components.html)
