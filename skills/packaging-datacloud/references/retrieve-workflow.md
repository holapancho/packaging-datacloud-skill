# Retrieve Data Kit Metadata into Git

Standard workflow for pulling a **Standard** data kit from a source org into an SFDX package directory for managed 2GP. Validated against a published managed Data Kit package (dedicated package directory, SSOT dependency, successful `package version create`).

## Project layout

Use a **dedicated package directory** — Data Cloud metadata only (Winter '25+).

**Layout A** — metadata directly under package root (common for kit-only repos):

```text
data-kit/
  package.xml                 ← Download Manifest from UI
  main/default/
    dataPackageKitDefinitions/
    DataPackageKitObjects/
    objects/*__dlm/
    dataSourceObjects/
    dataSourceBundleDefinitions/
    dataStreamTemplates/
    dataSrcDataModelFieldMaps/
    ...
```

**Layout B** — `force-app` wrapper (common in multi-package monorepos):

```text
packages/my-data-kit/
  package.xml
  force-app/main/default/
    ... (same metadata folders as above)
```

`sfdx-project.json` `path` must match where retrieve lands:

```json
{
  "packageDirectories": [
    {
      "path": "data-kit",
      "package": "My Data Kit Package",
      "dependencies": [{ "package": "ssot-standard-data-model@<version>" }]
    }
  ]
}
```

For Layout B, set `"path": "packages/my-data-kit/force-app"` (the CLI default package directory).

## Prerequisites

- **Standard** data kit in source org (not DevOps for 2GP)
- Components added on kit **Contents** tab
- **Publishing sequence** saved (**Edit Sequence** → Save)
- Source org alias authorized; kit exists there:

```bash
sf data query -o <source_org> -q "SELECT DeveloperName FROM DataPackageKitDefinition" -t
```

## Steps

### 1. Download manifest

Data Cloud Setup → Developer Tools → **Data Kits** → select kit → **Download Manifest**.

Save as `package.xml` at the **package root** (same folder level as `main/` or `force-app/`).

Do **not** use UI **Publish** → Package Manager for 2GP — that modal is the 1GP upload path. Skip to retrieve.

### 2. Retrieve

From repo root, with the Data Kit package set as `default: true` in `sfdx-project.json` (or pass explicit target):

```bash
sf project retrieve start --manifest <package-root>/package.xml -o <source_org>
```

Examples:

```bash
# Layout A
sf project retrieve start --manifest data-kit/package.xml -o <source_org>

# Layout B
sf project retrieve start --manifest packages/my-data-kit/package.xml -o <source_org>
```

**Success check:** hundreds of files, not just `package.xml`. Expect `DataPackageKitDefinition`, DMOs, stream templates, field maps, etc.

### 3. Post-retrieve cleanup

Delete **standalone** Key Qualifier field files only (see [packaging-oddities.md](packaging-oddities.md)):

```bash
find <package-root> -path '*/objects/*/fields/KQ_*' -name '*.field-meta.xml' -delete
```

Or:

```bash
find <package-root>/main/default/objects -name 'KQ_*' -delete
# Layout B: .../force-app/main/default/objects
```

**Keep** embedded `<keyQualifierName>` inside `dataSourceObject` metadata.

### 4. Verify kit definition metadata

Open:

`<package-root>/.../dataPackageKitDefinitions/<KitDeveloperName>.dataPackageKitDefinition-meta.xml`

Confirm:

| Field | Expected |
|-------|----------|
| `dataKitType` | Often `NONE` (normal for Standard kits in metadata) |
| `isDeployed` / `isEnabled` | `false` in source org |
| `deploymentOrder` | JSON with `"isAutoSequence": false` and ordered `sequence[]` |

UI “sequence not defined” banner can persist — trust retrieved `deploymentOrder`. See [kit-definition-metadata.md](kit-definition-metadata.md).

### 5. Commit

Commit `package.xml` + all retrieved metadata. Manifest members are org-specific (timestamp suffixes on `DataPackageKitObject`).

## Re-retrieve

When kit contents change in the org:

1. **Update** kit in UI (if underlying streams/DMOs changed)
2. Download **new** manifest (overwrites `package.xml`)
3. Retrieve again
4. Re-run KQ cleanup
5. Diff `deploymentOrder` if sequence changed

Sequence-only changes may not require a new manifest if you retrieve `DataPackageKitDefinition` — but full-kit refresh is safer before `package version create`.

## Next steps

- Test deploy: [2gp-workflow.md](2gp-workflow.md) step 4
- Build version: `sf package version create -w 90`
- Post-install activation: [deploy-components-flow.md](deploy-components-flow.md)

## Related

- [2gp-workflow.md](2gp-workflow.md)
- [packaging-oddities.md](packaging-oddities.md)
- [kit-definition-metadata.md](kit-definition-metadata.md)
