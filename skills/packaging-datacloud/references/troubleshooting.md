# Data Kit Packaging — Troubleshooting

## Retrieve returns almost nothing

- Wrong org — kit not present: `sf data query -o <alias> -q "SELECT DeveloperName FROM DataPackageKitDefinition" -t`
- Wrong manifest path or package directory not default in `sfdx-project.json`
- See [retrieve-workflow.md](retrieve-workflow.md)

## `sf package version create` fails on KQ fields

Delete standalone files only:

```bash
find <package-root> -path '*/objects/*/fields/KQ_*' -name '*.field-meta.xml' -delete
```

Do **not** remove `<keyQualifierName>` from `dataSourceObject` files — [packaging-oddities.md](packaging-oddities.md).

## SSOT dependency / downgrade errors

Subscriber org has newer SSOT than your package declares. Update `ssot-standard-data-model@` to current Help version — [ssot-package-dependency.md](ssot-package-dependency.md).

## Mixed metadata error (Winter '25+)

Remove Apex, LWC, Flow, agents from Data Kit package directory. Agents belong in a separate package.

## Publishing sequence / deploy fails in subscriber

- Confirm `deploymentOrder` in retrieved `DataPackageKitDefinition` has expected `sequence[]`
- Re-save sequence in source org UI, re-retrieve
- UI “sequence not defined” banner may lie — trust Git metadata — [kit-definition-metadata.md](kit-definition-metadata.md)

## `dataKitType: NONE` looks wrong

Normal for Standard kits in metadata. Confirm type in source org UI — [kit-definition-metadata.md](kit-definition-metadata.md).

## FieldSrcTrgtRelationship / DMO relations fail packaging

Omit from manifest for version create; address relationships at deploy time if required — [packaging-oddities.md](packaging-oddities.md).

## Package version create timeout

Re-run with `-w 90` or higher. Data Kit builds often exceed 60 minutes.

## DevOps kit in 2GP path

DevOps kits are not for managed packaging. Create a **Standard** kit — [standard-vs-devops-data-kits.md](standard-vs-devops-data-kits.md).

## Publish button opens Package Manager

1GP upload path. For 2GP: retrieve + `sf package version create` — skip Publish modal.

## Connector / credential errors after subscriber deploy

Expected — subscribers re-authorize connections. Config copies; secrets do not.

## Entity cannot be found during retrieve

Stale manifest from another org or deleted components. Re-download manifest from kit that owns the metadata.

## Undeploy blocked by `StaticCurrencyRatesTransform_Home` (or similar)

Platform **Currency** dependency — not a kit component you can delete.

1. Data 360 Setup → Feature Management → Admin Tools → **Multi-Currency** → **disable Currency Connection** ([KB 002774314](https://help.salesforce.com/s/articleView?id=002774314&type=1))
2. Undeploy kit components one at a time (transforms **before** DLOs they reference)
3. Uninstall the managed package

Full runbook: [undeploy-uninstall-runbook.md](undeploy-uninstall-runbook.md).

## After uninstall: leftover Data Lake Objects still listed

**Expected, not a failed uninstall.** **All Data Lake Objects** can still show:

1. **Platform Currency** lakes (e.g. Static Currency Rates) — leave alone  
2. **Locked kit orphans** (file-upload / custom kit `__dll`) — UI: *can't delete… managed-package data kit* even with the package gone  

Success criteria: Data Kit package uninstalled + kit definition gone + transforms/streams cleared. Orphan lakes → leave or Support.

Full detail: [undeploy-uninstall-runbook.md](undeploy-uninstall-runbook.md).

## Undeploy: transform dependency on DLO

> Undeploying of component `…` of type `DataLakeObject` failed … Dependencies are: `SomeTransform`

Undeploy the **transform** first (try kit member name, runtime name, and `Namespace__` variants), then the DLO. Undeploying a `*_Definition` alone may leave the transform active.

## DataStreamBundle Undeploy: `Unable to get Data Streams for bundle`

Delete streams via Connect instead:

`DELETE /ssot/data-streams/{name}?shouldDeleteDataLakeObject=true` (body `{}` via `sf api request rest`).

## DLO delete: “has a Data Stream Associated” but Connect has no stream

**Ghost `DataStreamDefinition`**. Confirm with `sf org list metadata -m DataStreamDefinition` / Tooling SOQL, then:

```bash
sf data delete record -o <alias> --use-tooling-api \
  --sobject DataStreamDefinition --record-id <1sd...>
```

Then retry package uninstall. Orphan `__dll` may still refuse delete (Gack) — uninstall can succeed once the stream definition is gone.

## Package uninstall fails while kit still “deployed”

Runtime components or ghost stream defs still reference package templates. Undeploy / Tooling-delete stream defs first — [undeploy-uninstall-runbook.md](undeploy-uninstall-runbook.md).
