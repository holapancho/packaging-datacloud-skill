# Salesforce Standard Data Model (SSOT) — 2GP dependency

ISV Data Kit **managed 2GP** packages typically depend on Salesforce’s **Salesforce Standard Data Model** package (namespace `ssot`). Partner Community may label this **“Data Cloud Package ID for 2GP Dependencies”** — it is the same SSOT / standard data model subscriber package.

## When to declare it

Declare in `sfdx-project.json` when your Data Kit:

- Maps CRM streams to **standard DMOs** (e.g. Account)
- References `ssot__*` objects or standard model metadata
- Fails `sf package version create` without the dependency

Many ISV kits declare it by default for CRM-backed streams even when the manifest shows mostly custom DMOs.

## Where to get the current `04t` ID

IDs and version numbers **change frequently**. Do not copy stale IDs from old docs or screenshots.

| Source | Use for |
|--------|---------|
| [Salesforce Help — SSOT package versions](https://help.salesforce.com/s/articleView?id=002234049&type=1) | **Authoritative** version list and install links (`p0=04t…`) |
| Partner Community → **Data Cloud for ISVs** | ISV-oriented pointer (may lag Help; verify against Help) |
| [Data 360 2GP workflow](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/data-cloud-2gp-workflow.html) | Describes *that* a dependency is required; points to Partner Community |

Install URL pattern:

```text
https://login.salesforce.com/packaging/installPackage.apexp?p0=<04t_subscriber_package_version_id>
```

## Example (verify before use)

As of **30-Mar-2026** (Help article):

| Field | Value |
|-------|--------|
| Package name | Salesforce Standard Data Model |
| Version | 1.132 |
| Subscriber package version ID | `04tKe000000Pc76` |

## `sfdx-project.json` pattern

Use a **versioned alias** in `packageAliases`, then reference the alias in the package directory `dependencies`:

```json
{
  "packageDirectories": [
    {
      "path": "force-app",
      "package": "MY_DATA_KIT_PACKAGE",
      "dependencies": [{ "package": "ssot-standard-data-model@1.132" }]
    }
  ],
  "packageAliases": {
    "ssot-standard-data-model@1.132": "04tKe000000Pc76"
  }
}
```

When Help publishes a newer version, add a new alias (e.g. `@1.133`) and update the `dependencies` entry.

## Subscriber org / scratch org notes

- The SSOT package is **1GP**, installed automatically or manually in Data Cloud orgs.
- **Do not downgrade**: installing an older `04t` (e.g. 1.73) fails if a **newer** version (e.g. 1.132) is already installed — *“A newer version of this package is currently installed.”*
- For 2GP **package version create**, the dependency in `sfdx-project.json` should match a **current** SSOT version, not an outdated Partner Community post.
- Installed Packages UI shows namespace `ssot` and links to [sfdc.co/dcssot](https://sfdc.co/dcssot) for version errors.

## Related

- [2gp-workflow.md](2gp-workflow.md) — full managed 2GP steps
- [packaging-oddities.md](packaging-oddities.md) — KQ_*, relations, publishing sequence
