# Data Kit Metadata Cheatsheet

Common metadata types in a retrieved **Standard** data kit package.

## Kit anchor

| Type | Path pattern | Notes |
|------|--------------|-------|
| `DataPackageKitDefinition` | `dataPackageKitDefinitions/*.dataPackageKitDefinition-meta.xml` | Kit name, `deploymentOrder`, flags |
| `DataPackageKitObject` | `DataPackageKitObjects/*.dataPackageKitObject-meta.xml` | Links kit to DMOs, streams, etc. |

## Data model (DMOs)

| Type | Path pattern |
|------|--------------|
| `CustomObject` (DMO) | `objects/*__dlm/` |
| DMO fields | `objects/*__dlm/fields/*.field-meta.xml` |
| **Exclude** standalone KQ fields | `objects/*__dlm/fields/KQ_*` — delete after retrieve |

## Ingestion & transforms

| Type | Path pattern |
|------|--------------|
| `DataSourceObject` | `dataSourceObjects/` — includes embedded `keyQualifierName` |
| `DataSourceBundleDefinition` | `dataSourceBundleDefinitions/` |
| `DataStreamTemplate` | `dataStreamTemplates/` |
| `DataSrcDataModelFieldMap` | `dataSrcDataModelFieldMaps/` |
| `MktDataTransform` | `mktDataTransforms/` (if in kit) |

## Connections & search

| Type | Path pattern |
|------|--------------|
| `MktDataConnection` | `mktDataConnections/` |
| `SearchIndex` | `searchIndexes/` (if in kit) |

## Often problematic for packaging

| Type | Notes |
|------|-------|
| `FieldSrcTrgtRelationship` | Often fails version create — omit if needed |
| Standalone `KQ_*` field files | Delete after retrieve |

## Manifest

Download from UI per kit — members are org-specific (timestamp suffixes). Store at package root next to `main/` or `force-app/`.

## Related

- [retrieve-workflow.md](retrieve-workflow.md)
- [kit-definition-metadata.md](kit-definition-metadata.md)
- [packaging-oddities.md](packaging-oddities.md)
