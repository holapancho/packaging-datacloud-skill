# DataPackageKitDefinition — Normal Retrieved Values

What to expect in retrieved `DataPackageKitDefinition` metadata after a successful kit retrieve from a **Standard** kit prepared for managed 2GP.

Use when values look “wrong” compared to the Data Cloud UI.

## Expected values (source org, pre-subscriber-deploy)

| Field | Typical retrieved value | UI may show | Action |
|-------|-------------------------|-------------|--------|
| `dataKitType` | `NONE` | **Standard** | **Normal** — do not change for packaging |
| `isDeployed` | `false` | — | **Normal** in publisher org; deploy happens in subscriber after install |
| `isEnabled` | `false` | — | **Normal** in source metadata |
| `dataKitSource` | `LOCAL` | — | Expected |
| `dataSpaceDefinitionDevName` | `default` (or your data space) | Data space name | Match subscriber target if non-default |
| `deploymentOrder` | JSON with `isAutoSequence` + `sequence[]` | Publishing Sequence tab | **Retrieved** — verify in Git after retrieve |
| `versionNumber` | Increments on kit updates | — | Informational |

**Do not treat `dataKitType: NONE` as “not Standard”.** Kit type is chosen in the UI at creation; metadata retrieve often stores Standard kits as `NONE`. Confirm kit type in the source org UI, not from this field alone.

## `deploymentOrder` (publishing sequence)

Publishing sequence is stored on retrieve in `DataPackageKitDefinition.deploymentOrder` (API 61.0+):

```json
{
  "isAutoSequence": false,
  "sequence": [
    { "devName": "UploadedFiles", "type": "MktDataConnection" },
    { "devName": "MyStreamBundle", "type": "DataStream" },
    { "devName": "MyBatchTransform", "type": "MktDataTransform" }
  ]
}
```

| Fact | Implication |
|------|-------------|
| Set in UI (**Edit Sequence** → Save) | Required before packaging |
| Stored in `deploymentOrder` on retrieve | Diff in Git; UI banner may still show stale “not defined” |
| `isAutoSequence: false` | Custom sequence saved |
| DMOs often **absent** from `sequence[]` | Normal — DMOs ship via `DataPackageKitObject` + field maps |
| `sequence[]` lists **runtime deploy** steps | Connections, streams, transforms, search index — not every kit member |

Example pattern: many DMOs in `DataPackageKitObject`, but only connection + stream bundles in `deploymentOrder` until transforms or search indexes are added.

After retrieve, open:

`dataPackageKitDefinitions/<KitName>.dataPackageKitDefinition-meta.xml`

Verify `deploymentOrder` even if the UI banner persists.

## Related

- [retrieve-workflow.md](retrieve-workflow.md)
- [packaging-oddities.md](packaging-oddities.md)
- [metadata-cheatsheet.md](metadata-cheatsheet.md)
