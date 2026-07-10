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
