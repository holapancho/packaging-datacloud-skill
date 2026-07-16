# Undeploy Data Kit Components & Uninstall Package

**Install ≠ deploy** still applies in reverse: uninstalling a managed Data Kit package fails (or UI Undeploy fails) while **runtime** components remain. Remove deployed components first, then uninstall the package.

Official Help: [Uninstall a Deployed Data Kit](https://help.salesforce.com/s/articleView?id=data.c360_uninstall_data_kit.htm&type=5).

Validated end-to-end pattern (Connect undeploy → stream delete → Tooling ghost cleanup → `sf package uninstall`) on a managed Standard kit subscriber org.

---

## Order of operations

1. **Undeploy runtime components** — reverse of `DataPackageKitDefinition.deploymentOrder`, **overridden by UI/API dependency errors**.
2. Clear **platform / system dependencies** that block Undeploy (Currency — below).
3. If kit **DataStreamBundle** undeploy fails, delete **individual streams** via Connect (below).
4. Clear **ghost `DataStreamDefinition`** rows if Connect says the stream is gone but metadata/Tooling still list it (blocks DLO delete + package uninstall).
5. **Uninstall** the managed package (`sf package uninstall` or Setup → Installed Packages).
6. Optional: delete leftover orphan DLOs / leave platform `StaticCurrencyRates_*` alone.

Do **not** rely on bulk “Undeploy” of the whole kit when any dependency graph exists — undeploy **one component (or stream) at a time**.

---

## Prefer authenticated CLI for Connect

Use `sf api request rest` against the target org (handles OAuth). Avoid shelling `Bearer` tokens from `sf org display` JSON into scripts — tokens can be redacted in intermediate files and yield `INVALID_AUTH_HEADER`.

```bash
sf api request rest \
  '/services/data/v64.0/ssot/data-kits/<Namespace__KitDevName>/undeploy?asyncMode=true&dataspace=default' \
  -o <alias> -X POST -H 'Content-Type: application/json' \
  -b @payload.json
```

Poll `DataKitDeploymentLog` (`DeploymentAction`, `DeploymentStatus`, `DeploymentError`, `ComponentName`, `BundleName`).

---

## Reverse publishing sequence

Read `deploymentOrder` from the kit definition. Undeploy from the **end** of `sequence[]` back to the start **unless** the UI/API names a dependency — then remove the **dependent** first.

| Typical type (deploy) | Undeploy after dependents cleared |
|-----------------------|-----------------------------------|
| `DataSemanticSearch` | First out (may Internal Error if never fully activated — often safe to skip) |
| `MktDataTransform` / `DataTransform` | **Before** input/output DLOs it still references |
| `MktDataLakeObject` / `DataLakeObject` | After transforms that read/write it |
| `DataStream` / stream bundles | After lakes/transforms using those streams; if bundle Undeploy fails, delete streams one-by-one |
| `MktDataConnection` | Last (only if nothing else uses it) |

**Example:** Undeploy of a DLO fails with dependency `MyBatchTransform` → undeploy the **transform** first (try kit member name, runtime name, and `Namespace__` variants), then retry the DLO.

Payload shape:

```json
{ "components": [{ "type": "DataTransform", "name": "Namespace__MyTransform" }] }
```

Try both qualified (`Namespace__DevName`) and unqualified runtime names when one variant 404s/fails.

APIs:

| Action | Endpoint |
|--------|----------|
| Undeploy component(s) | `POST /ssot/data-kits/{Namespace__KitDevName}/undeploy?asyncMode=true&dataspace=default` |
| List transforms / DLOs / streams | `GET /ssot/data-transforms`, `/ssot/data-lake-objects`, `/ssot/data-streams` |
| Delete stream (+ optional lake) | `DELETE /ssot/data-streams/{streamDevName}?shouldDeleteDataLakeObject=true` |
| Status | `DataKitDeploymentLog` |

UI: Data Cloud → **Data Kits** → Undeploy per component. Prefer per-component when bulk Undeploy reports dependencies.

---

## Blocker: Currency platform objects (`StaticCurrencyRates*`)

### Symptom

UI Undeploy (often on a **CRM DataStreamBundle** that includes `CurrencyType_Home`) fails with dependencies like:

- **DataStreamBundle** → `StaticCurrencyRatesTransform_Home`

Platform Currency feature — not kit-authored metadata.

### Do this first (Salesforce KB)

[Data 360: Currency Data Streams, DLOs, and DMOs (002774314)](https://help.salesforce.com/s/articleView?id=002774314&type=1):

1. **Data 360 Setup** → **Feature Management** → **Admin Tools**
2. Under **Multi-Currency**, **disable the Currency Connection**
3. Then delete/undeploy related CRM streams (including `CurrencyType_*`)

Org-wide: re-enable afterward if needed. Leave `StaticCurrencyRates_*__dll` / related DMOs alone; package uninstall does **not** require deleting them.

---

## Blocker: DataStreamBundle Undeploy (`Unable to get Data Streams for bundle`)

Kit Undeploy of a **DataStreamBundle** may fail even when streams exist:

> Unable to get Data Streams for bundle: `…`

**Workaround — delete streams via Connect**, not (only) kit Undeploy:

```bash
# Body file: {}
sf api request rest \
  '/services/data/v64.0/ssot/data-streams/<StreamDevName>?shouldDeleteDataLakeObject=true' \
  -o <alias> -X DELETE -H 'Content-Type: application/json' -b @empty.json
```

`shouldDeleteDataLakeObject` is **required** (omitting it → `MALFORMED_QUERY`). Stream may enter `DELETING` then disappear from `GET /ssot/data-streams`.

CRM and file-upload streams from a kit are often deleted this way after transforms/DLOs are undeployed.

---

## Blocker: Ghost `DataStreamDefinition` (stream gone in Connect, still in metadata)

### Symptoms

| Check | Ghost state |
|-------|-------------|
| `GET /ssot/data-streams/{name}` | `ITEM_NOT_FOUND` / null |
| `GET /ssot/data-streams` | `totalSize: 1` but empty `dataStreams[]` (weird pagination) |
| `sf org list metadata -m DataStreamDefinition` | Stream **still listed** |
| Tooling SOQL `DataStreamDefinition` | Row still present |
| UI delete DLO | “Unable to delete Data Lake Object. Since it has a Data Stream Associated… GackId: …” |
| `sf package uninstall` | External reference to stream template / Data Kit Component Template Mapping |

### Fix

Delete the Tooling row (validated):

```bash
# Find Id
sf data query -o <alias> --use-tooling-api -q \
  "SELECT Id, DeveloperName FROM DataStreamDefinition WHERE DeveloperName = '<StreamDevName>'"

# Delete
sf data delete record -o <alias> --use-tooling-api \
  --sobject DataStreamDefinition --record-id <1sd...>
```

Then:

1. Retry DLO delete in UI/API if an orphan `__dll` remains (may still Gack/Internal Error — non-blocking for uninstall once stream def is gone).
2. Retry **`sf package uninstall --package 04t… -o <alias>`**.

Metadata destructive deploy of `DataStreamDefinition` is unreliable once Connect already dropped the runtime stream (“not found in zipped directory”).

---

## After uninstall: leftover Data Lake Objects in the UI

**Expected:** Setup / Data Cloud → **All Data Lake Objects** can still list lakes after a successful package uninstall. Uninstall removes the **managed package + kit definition**; it does **not** always delete every activated runtime lake.

Common leftovers:

| Kind | Example pattern | Who owns it | Subscriber action |
|------|-----------------|-------------|-------------------|
| **Kit orphan (locked)** | File-upload or custom kit `__dll` that was deployed from the package | Was kit-deployed; UI may say *You can't delete a component deployed from a managed-package data kit* even though the package is gone | Leave it, or Salesforce Support. Usually does **not** block a later reinstall |
| **Platform Currency** | `StaticCurrencyRates_*__dll` / “Static Currency Rates …” | Data 360 Currency feature ([KB 002774314](https://help.salesforce.com/s/articleView?id=002774314&type=1)) | Leave it. Optional: disable Currency Connection if policy requires |

Connect `DELETE` on a locked kit orphan may return `INTERNAL_ERROR`. Do **not** treat these leftovers as “uninstall failed” if:

- `sf package installed list` no longer shows the Data Kit package
- Tooling `DataPackageKitDefinition` for that kit is empty
- Kit transforms / kit CRM streams are gone

**Meaning:** Package uninstall removed kit metadata / package membership but did **not** always remove every activated DLO.

**What to do**

| Option | When |
|--------|------|
| **Leave the leftover(s)** | Preferred for reinstall/retest — confirm package + kit definition are gone |
| **Salesforce Support** | Need the orphan lake physically deleted |
| Do **not** keep retrying UI delete on locked kit orphans | Lock will not clear via subscriber actions |

---

## Package uninstall without prior deploy

If nothing was activated (no Deploy success logs, no kit `__dll` / streams), uninstall directly. Always verify `DataKitDeploymentLog` and `DataStreamDefinition` metadata first.

Leftover **platform** Currency lakes and locked kit-orphan DLOs can remain after a successful uninstall — see above.

---

## Checklist template

```markdown
- [ ] Read `deploymentOrder`; plan reverse list
- [ ] Undeploy transforms **before** DLOs they reference (trust dependency errors over sequence)
- [ ] If `StaticCurrencyRatesTransform_*`: disable **Currency Connection** (KB 002774314)
- [ ] Undeploy search / transforms / DLOs via Connect kit undeploy (qualified + unqualified names)
- [ ] If bundle Undeploy fails: `DELETE /ssot/data-streams/{name}?shouldDeleteDataLakeObject=true`
- [ ] If DLO delete / uninstall blocked but Connect has no stream: delete Tooling `DataStreamDefinition`
- [ ] `sf package uninstall` targeted package only
- [ ] Verify package + kit definition gone; accept leftover locked kit DLOs / `StaticCurrencyRates_*` unless Support cleanup is required
- [ ] Re-enable Currency Connection if needed
```

---

## References

- [Uninstall a Deployed Data Kit](https://help.salesforce.com/s/articleView?id=data.c360_uninstall_data_kit.htm&type=5)
- [Currency Data Streams / DLOs / DMOs — 002774314](https://help.salesforce.com/s/articleView?id=002774314&type=1)
- Connect undeploy / streams — [Data 360 Connect API](https://developer.salesforce.com/docs/data/connectapi/references/spec)
- Deploy side (inverse): [post-install-deploy-runbook.md](post-install-deploy-runbook.md)

> **Scope:** This skill is **generic** Data 360 packaging. Product-specific customer guides and package names belong in the product repo / internal skills — do not link them from here.