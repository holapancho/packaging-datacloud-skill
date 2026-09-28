# Data Kit Metadata Cheatsheet

Practical types and path patterns in a retrieved **Standard** data kit package (post-retrieve / 2GP pitfalls).

**Official lists (what can be packaged):**

- [Metadata Components for Data 360 Cheat Sheet](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/component-cheatsheet.html)
- [Data 360 Metadata Types (Metadata API)](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_data_cloud_types.htm) — full packaging compatibility

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
| `ObjectSourceTargetMap` (runtime DLO→DMO) | Points at `__dll` as CustomObject — **breaks** version create; not a typical kit-manifest member — [packaging-oddities.md](packaging-oddities.md) |
| Kit field maps (when present) | Prefer manifest `DataSrcDataModelFieldMap` over hand-added `ObjectSourceTargetMap` |

## Manifest

Download from UI per kit — members are org-specific (timestamp suffixes). Store at package root next to `main/` or `force-app/`.

## Related

- Official: [component-cheatsheet](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/component-cheatsheet.html) · [Data 360 Metadata Types](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_data_cloud_types.htm)
- [retrieve-workflow.md](retrieve-workflow.md)
- [kit-definition-metadata.md](kit-definition-metadata.md)
- [packaging-oddities.md](packaging-oddities.md)
