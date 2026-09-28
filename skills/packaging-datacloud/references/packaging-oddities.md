# Data Kit Packaging Oddities

Practical quirks for **managed 2GP** Data Kit packages, beyond official DevOps-only documentation.

## SSOT / Standard Data Model dependency

Managed 2GP Data Kit packages depend on Salesforce’s **Salesforce Standard Data Model** package (namespace `ssot`).

```json
"dependencies": [{ "package": "ssot-standard-data-model@<version>" }]
```

Get the current subscriber package version ID (`04t…`) from the [Salesforce Help version list](https://help.salesforce.com/s/articleView?id=002234049&type=1). Partner Community “Data Cloud for ISVs” may list an older ID — **prefer Help**.

Full guidance: [ssot-package-dependency.md](ssot-package-dependency.md)

**Downgrade trap:** Installing an old `04t` fails if the org already has a newer SSOT version.

## Key Qualifier (`KQ_*`) — two different shapes

Data Cloud uses **Key Qualifiers** for lake/DMO identity. Retrieve can surface them in **two** ways. Only one must be deleted.

### 1. Embedded references (KEEP)

Inside `dataSourceObject-meta.xml`, fields include:

```xml
<keyQualifierName>KQ_Id</keyQualifierName>
```

These are **part of DLO schema**, not separate deployable fields. Published kits retain hundreds of embedded `keyQualifierName` entries and **zero** standalone KQ field files. **Do not remove or edit these.**

### 2. Standalone field files (DELETE)

Retrieve sometimes also emits **extra** CustomField metadata files:

```text
objects/MyDmo__dlm/fields/KQ_Id__c.field-meta.xml
objects/MyOtherDmo__dlm/fields/KQ_SomeField__c.field-meta.xml
```

These **break** `sf package version create` if left in the project.

After every retrieve:

```bash
find <package-root> -path '*/objects/*/fields/KQ_*' -name '*.field-meta.xml' -delete
```

This targets standalone field files only — not `dataSourceObject` files.

**Why both exist:** Salesforce generates key-qualifier logic for DLO/DMO mapping. Retrieve occasionally duplicates that as phantom DMO custom fields. Embedded references alone are sufficient for packaging.

## DMO relations and packaging

`FieldSrcTrgtRelationship` and DMO relationship metadata **often fails at `sf package version create`**.

- **Packaging phase:** omit relations from kit/manifest if version create fails.
- **Deploy phase:** missing relationships may cause deploy errors — different phase, different fix.
- Test in a scratch subscriber org before committing to either approach.

## `ObjectSourceTargetMap` vs kit DLO (do not hand-add)

Runtime DLO→DMO mappings created via Connect / Harmonize often retrieve as **`ObjectSourceTargetMap`**, with fields like:

```xml
<sourceObjectName>Namespace__MyCatalog__dll</sourceObjectName>
<sourceField>Namespace__MyCatalog__dll.Namespace__Field__c</sourceField>
<targetObjectName>Namespace__MyCatalog__dlm</targetObjectName>
```

**Do not** add that metadata to a managed Data Kit package just because it exists in the packaging org.

| Fact | Implication |
|------|-------------|
| Kit lakes ship as **`DataSource` / `DataSourceObject`** (templates) | Not as packageable `CustomObject` `*__dll` |
| Kit DMOs ship as **`CustomObject` `*__dlm`** | Version create can resolve `__dlm` targets |
| `ObjectSourceTargetMap` treats source `__dll` as a **CustomObject** | `sf package version create` fails: *no CustomObject named …__dll found* |
| Connect / UI **kit manifest** usually omits `ObjectSourceTargetMap` | Trust the downloaded manifest; prefer `DataSrcDataModelFieldMap` when the kit UI includes field maps |

**Fix:** Remove `objectSourceTargetMaps/` and any `ObjectSourceTargetMap` members from `package.xml`. Rebuild from the kit manifest only.

**If subscriber maps are missing after deploy:** re-establish mappings via kit deploy / UI, or ensure the kit includes the supported map type from the **official manifest** (often `DataSrcDataModelFieldMap`) — do not package raw runtime `ObjectSourceTargetMap` that points at `__dll` CustomObjects.

## Publishing sequence

| Fact | Implication |
|------|-------------|
| Set in Data Kit UI (**Edit Sequence** → Save) | Do before building package version |
| Stored in `DataPackageKitDefinition.deploymentOrder` on retrieve | Diff in Git; see [kit-definition-metadata.md](kit-definition-metadata.md) |
| UI banner “sequence not defined” | Can be stale — trust retrieved `deploymentOrder` if `isAutoSequence: false` |
| Controls **deploy order** after install | Not runtime ingestion order |
| DMOs often not listed in `sequence[]` | Normal |
| Missing/wrong sequence | Subscriber cannot deploy kit after install |

Workflow: [retrieve-workflow.md](retrieve-workflow.md) → verify `deploymentOrder` → test deploy on scratch subscriber → `package version create`.

## Long package version builds

Official Dev Guide samples use `-w 45`. Data Kit `sf package version create` often exceeds **1 hour** — prefer **`-w 90` or higher**:

```bash
sf package version create -v <devhub> -p <0ho_id> -w 90 -f config/project-scratch-def.json
```

## No mixed metadata (Winter '25+)

Data Kit package path must contain **only** Data Cloud metadata. No Apex, LWC, Flow, or agent metadata in the same package directory.

## Connector credentials

Connection config copies; secrets do not. Subscribers re-authorize connectors after install.

## Stale or wrong manifest

Manifest members are org-specific (`DataPackageKitObject` timestamps, `DataStreamTemplate` suffixes). Retrieve against the wrong org yields mass "entity cannot be found" warnings.

Verify:

```bash
sf data query -o <alias> -q "SELECT DeveloperName FROM DataPackageKitDefinition" -t
```

## UI Publish vs 2GP

**Publish** on the data kit record may open **Package Manager** (1GP upload). For managed **2GP**, skip that modal — download manifest, retrieve, then `sf package version create`.
