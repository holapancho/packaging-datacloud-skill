# Standard vs DevOps Data Kits

When to use each kit type, and whether it can be **packaged** (managed 2GP) vs **promoted** (metadata deploy only).

## Short answer

| Kit type | Packaging? | Target data space | Managed 2GP? | Primary doc |
|----------|------------|-------------------|--------------|-------------|
| **Standard** | **Yes** — share with customers | **Any** data space in target org | **Yes** | [2GP workflow](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/data-cloud-2gp-workflow.html) |
| **DevOps** | **No** — *"not to package Data 360 metadata"* (Help) | **Same** data space as source | **No** | [CLI sandbox→prod](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-deploy_data_kit_using_cli.html) |

**Help hub:** [Data Kits](https://help.salesforce.com/s/articleView?id=data.c360_a_data_package_kits.htm&type=5) · Full Help index: [help-articles-index.md](help-articles-index.md)

Salesforce’s packaging / 2GP documentation uses **Standard** kits only. DevOps is **mergeback** between linked orgs, not ISV distribution.

## What Salesforce officially says

### [Help — Data Kits hub](https://help.salesforce.com/s/articleView?id=data.c360_a_data_package_kits.htm&type=5)

- **Standard Data Kit:** Package and share with customers; deploy to **any data space** in the target org.
- **DevOps Data Kit:** Migrate sandbox→production; **not to package** Data 360 metadata; deploy to the **same data space** in the target org.

### [Packages and Data Kits](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/packages-data-kits.html)

- All Data 360 metadata in a package must live in a **data kit** first.
- **Winter '25+:** Data 360 metadata and platform metadata (Apex, LWC, agents) **cannot** share one package.
- **You cannot add Data 360 metadata in an unlocked package.**
- **Customer developers (in-house):** data kits + **unmanaged** style promotion from test → production.
- **Partners (ISV):** **managed packages** (2GP) for distribution.

The page does **not** name “DevOps” vs “Standard” — but the partner path aligns with the **2GP + Standard kit** guide.

### [2GP workflow](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/data-cloud-2gp-workflow.html)

- Step 3: **Create a Standard Data Kit** (explicit).
- Then retrieve → `sf package create` → `sf package version create` → promote.

No DevOps kit step in this workflow.

### [CLI Deploy from Sandbox](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-deploy_data_kit_using_cli.html)

- Step 4: **Create a DevOps Data Kit** (`Data Kit Type: DevOps`).
- Download manifest → retrieve → **`sf project deploy start --manifest`** to production.
- Activate kit in target org; re-authorize connectors.

No `sf package create`, no managed 2GP, no subscriber install story.

### [Help — Data Kit Considerations (003960830)](https://help.salesforce.com/s/articleView?id=003960830&type=1)

- **Standard and DevOps kits are not interchangeable** for updating the same objects.
- **Sandbox → Production** (change sets / DevOps rules): use **DevOps** kit + outbound/inbound rules.
- **Production → Production:** non-default objects **cannot** go in a kit.

### [Help — Governance mergeback (DevOps only)](https://help.salesforce.com/s/articleView?id=data.c360_a_mergeback_devops_datakits.htm&type=5)

- DevOps kits for **governance** sandbox→prod (tags, RLS, FLS, masking).
- **CLI does not support governance policy deployment** — use change sets / kit mechanisms.
- Standard tags only for mergeback-supported policies.

See [governance-mergeback-devops.md](governance-mergeback-devops.md).

## Metadata note: `dataKitType`

`DataPackageKitDefinition` includes `dataKitType` (API 63.0+) — values include **Standard** and **DevOps**. Both kit types produce retrievable metadata (`DataPackageKitDefinition`, `DataPackageKitObject`, stream templates, etc.).

That does **not** mean both are supported for **managed 2GP distribution**. Salesforce only documents **Standard** kits for the ISV packaging pipeline.

**Retrieve quirk:** `dataKitType` often returns **`NONE`** even for Standard kits in published managed packages. Use UI kit type + workflow, not this field alone. See [kit-definition-metadata.md](kit-definition-metadata.md).

## Practical decision tree

```text
Need to ship to customers / AppExchange / subscriber orgs?
  → Standard Data Kit + managed 2GP (ISV / subscriber path)

Need to move config between your own sandbox and production?
  → DevOps Data Kit + CLI metadata deploy (or DevOps Center + rules)

Need Git + CI but NOT AppExchange?
  → DevOps kit + retrieve/deploy pipeline (still not 2GP)

Building agents + Data Kit?
  → Two packages: Data Kit (Standard, 2GP) + agent package (platform metadata)
```

## Third-party blogs (e.g. Apex Hours)

Useful for **deploy mechanics** (manifest download, CLI, publishing order) but often **blur** Standard vs DevOps:

- Some blogs say Standard kits are for change sets; Salesforce Help **003960830** says **sandbox→prod change sets need DevOps** kits.
- Prefer **developer.salesforce.com** and **help.salesforce.com** over community posts when choosing kit type for **packaging**.

## Related

- [help-articles-index.md](help-articles-index.md) — Help hub and child articles
- [governance-mergeback-devops.md](governance-mergeback-devops.md) — DevOps governance only
- [2gp-workflow.md](2gp-workflow.md) — Standard + managed 2GP
- [devops-cli-workflow.md](devops-cli-workflow.md) — DevOps + metadata deploy
- [data-kit-considerations.md](data-kit-considerations.md) — limits, env rules, common errors
- [packages-data-kits](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/packages-data-kits.html) — unmanaged vs managed overview
