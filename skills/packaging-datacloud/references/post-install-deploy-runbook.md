# Post-install: Deploy a Standard Data Kit (managed 2GP)

Runbook for activating a **Standard Data Kit** in a **subscriber org** after managed 2GP package install. Applies to any kit with `DataPackageKitDefinition` and a defined **publishing sequence**.

**Payloads, naming, and API shapes:** [deploy-kit-components.md](deploy-kit-components.md) (Connect preferred; Flow legacy).

**After a package upgrade:** run this same deploy again for the same kit to apply added or modified components. Do not undeploy first — [promoted-version-changes.md](promoted-version-changes.md).

---

## Core concepts

| Concept | Detail |
|---------|--------|
| **Install ≠ deploy** | Package install copies kit **metadata**. Components are not live until **deployed/activated** per publishing sequence. |
| **Git stays unqualified** | Retrieved source uses publisher dev names. Do **not** namespace-prefix files in Git for subscriber deploy naming. |
| **Kit lookup vs runtime** | Kit template lookups use `Namespace__MemberDevName`. Runtime `apiName` / `label` usually stay **unqualified**. Full table: [deploy-kit-components.md](deploy-kit-components.md) § Managed 2GP subscriber naming. |
| **Runtime still kit-owned** | Unqualified stream/DLO names after Deploy are normal (locked; Undeploy via kit). Details: [deploy-kit-components.md](deploy-kit-components.md) § Kit ownership vs runtime naming. |
| **Sequence matters** | Order from `DataPackageKitDefinition.deploymentOrder`. Deploy dependencies before dependents. |
| **Status polling** | Query **`DataKitDeploymentLog`**, not `BackgroundOperation`. Flow `Waiting` / Connect `jobId` only means the job **started**. |
| **Deploy success ≠ run success** | Batch transforms register on deploy; produce data only after **Run Now** when upstream lakes have rows. |
| **Trust lake queries** | Stream counters can disagree with lake rows. Verify with lake SOQL before running transforms. |

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| Data 360 / Data Cloud provisioned | Target of all deploy operations |
| Package dependencies installed | e.g. SSOT if the kit maps to standard DMOs |
| Companion packages / CRM objects | If the kit includes CRM stream bundles |
| Data kit package installed | Kit visible under Setup → Data Kits |
| Subscriber namespace known | Managed 2GP → `Namespace__` on kit lookups |
| 15-character org Id | Required for CRM bundle deploy |

```bash
sf org display -o <alias> --json | jq -r '.result.id' | cut -c1-15

sf package installed list -o <alias> --json | jq '.result[] | select(.SubscriberPackageName | test("YourPackage"))'
```

---

## Determine deploy order

```text
force-app/main/default/dataPackageKitDefinitions/<KitDevName>.dataPackageKitDefinition-meta.xml
```

Field: `deploymentOrder` → JSON array of `{ "devName", "type" }`.

| Type | Typical role |
|------|----------------|
| `MktDataConnection` | Connector (File Upload, external, …) |
| `DataStream` | Stream bundle (CRM, file upload, ingest API, …) |
| `MktDataTransform` | Batch or streaming transform |
| `MktDataLakeObject` | Data lake object (DLO) |
| `DataSemanticSearch` | Vector / semantic search index |

Deploy **in sequence order**. Parallel branches only when components have no data dependency (document per kit).

---

## Deploy APIs (summary)

| API | Role |
|-----|------|
| **Connect REST** | **Preferred** for all kit activation. `POST …/ssot/data-kits/{Namespace__Kit}?asyncMode=true&dataspace=default` |
| **Flow REST** | **Legacy** (`sfdatakit__DeployDataKitComponents`). Prefer Connect for new work. |

```bash
sf api request rest -o <alias> -X POST \
  "/services/data/v66.0/ssot/data-kits/Namespace__MyDataKit?asyncMode=true&dataspace=default" \
  -H "Content-Type: application/json" \
  -b @payload.json
```

Full endpoints, Flow inputs, and JSON payloads: [deploy-kit-components.md](deploy-kit-components.md) · [Supported Component Types](https://developer.salesforce.com/docs/data/connectapi/guide/deploy-data-kit-payloads.html).

---

## Monitor deployment

```bash
sf data query -o <alias> -q "
SELECT ComponentName, ComponentType, DeploymentStatus, DeploymentError,
       FlowInterviewIdentifier, LastModifiedDate
FROM DataKitDeploymentLog
ORDER BY LastModifiedDate DESC
LIMIT 20
"
```

Filter by `FlowInterviewIdentifier` when using Flow REST.

---

## Step-by-step workflow (generic)

Replace placeholders: `Namespace__`, `<KitDevName>`, `<MemberDevName>`, `<alias>`.  
For each deploy step, copy the matching payload from [deploy-kit-components.md](deploy-kit-components.md).

### 0 — Confirm kit installed

Setup → **Data Kits** → kit appears (API name may be namespace-qualified).

### 1 — Connections (`MktDataConnection`)

**File Upload (`UploadedFiles`)** is often **already Active** after Data 360 provisioning:

```bash
sf api request rest -o <alias> -X GET \
  "/services/data/v66.0/ssot/connections?connectorType=UploadedFiles"
```

If missing, deploy via Connect **DataConnection** (payload catalog). External connectors may need credentials in `newCredentials`.

### 2 — CRM stream bundle (`DataStream`)

1. Deploy CRM bundle payload (Connect or Flow) with `bundleName: Namespace__…` and 15-char `orgId`.
2. Wait until constituent streams show **ACTIVE**. Zero stream-counter rows is OK for **deploy**.
3. **CRM refresh:** `SalesforceDotCom` UPSERT streams typically **cannot** refresh via Connect REST (`not allowed to run in non-interactive mode`). Use Data Cloud UI → Data Streams → **Refresh** when CRM has records but lakes are empty.
4. **Verify lakes:** `sf data query -o <alias> -q "SELECT Id__c FROM <CrmLakeObject>__dll LIMIT 5"`

**Error:** `Provided bundle does not exist in the data kit` → qualify `bundleName`.

### 3 — File upload stream bundle (`DataStream` + UploadedFiles)

1. Deploy with Connector Framework (`MORECONNECTORS` + `connectionName: UploadedFiles`) — not CRM. See payload catalog.
2. Note **subscriber lake name drift** (e.g. `UploadedFiles_<id>__dll` vs publisher template).

### 3b — Upload file data (not in package)

File kits define **schema**, not **content**. Upload in Data Cloud UI (Data Streams → stream → upload). Wait until **ACTIVE**, then query the actual lake object.

Ship sample files outside the Data Kit package.

### 3c — Seed join-side CRM data (when transforms require it)

Batch transforms that **join** file → CRM lakes need matching keys on both sides at **run** time.

Typical failure: output **primary key** null after LEFT JOIN when the CRM side has no rows.

**Mitigation:** create matching CRM records → refresh CRM stream → confirm lake rows → re-run transform.

### 4 — Deploy batch transform (`MktDataTransform`)

1. Deploy Connect `DataTransform` payload (qualified `dataTransformDevName`, unqualified `apiName` / `label`).
2. Optional `dataObjectOverrides` when publisher/subscriber lake names differ — prefer on **first** deploy; redeploying overrides on an already-deployed transform can fail.
3. **Pre-run gate:** every input lake in the graph must return rows (`SELECT … FROM <InputLake>__dll LIMIT 3`). INNER join + empty side → SUCCESS with 0 output rows.
4. **Run:** UI **Run Now** / **Full Run**, or Connect `POST …/ssot/data-transforms/<RuntimeName>/actions/run` with `definitionName` from GET transform (`definitions[].name`).
5. **Re-run pitfall:** after a 0-row run, API may return **`SKIPPED_NO_CHANGES`** even after lakes fill — use UI **Full Run**.

Run API details: [deploy-kit-components.md](deploy-kit-components.md) § Run batch transform.

### 5 — Deploy DLO (`MktDataLakeObject`)

Deploy Connect `DataLakeObject` payload. Qualify `dataSourceObjectDevName`. Data appears after stream mapping or transform output.

### 6 — Deploy semantic search (`DataSemanticSearch`)

**Prerequisites:** upstream DLO/transform/data; for vector search, **Agentforce enabled** (internal errors such as `(-1256768968)` without it).

Connect only — see payload catalog. Kit template name ≠ runtime search index API name; verify via `DataSemanticSearch` / `GET /ssot/search-index/{developerName}`.

Filling lakes does **not** auto-deploy search or re-run transforms — **Full Run** transform, verify output, then retry search deploy. Cascade pattern: [catalog-search-data-cascade.md](catalog-search-data-cascade.md).

---

## Verify runtime state

| Check | How |
|-------|-----|
| Streams active | Data Cloud → Data Streams, or Connect GET `/ssot/data-streams` |
| Lake object rows | Query `*__dll` — **authoritative** for transform inputs |
| Transform last run | `MktDataTransform.LastRunStatus`; Connect run-history |
| Transform output | Run history `outputStatus[].totalRows` or output `*__dll` |
| DMO rows | Data Cloud UI; `*__dlm` SOQL may be unsupported |
| Deploy history | `DataKitDeploymentLog` |

```bash
sf data query -o <alias> -q \
  "SELECT Name, LastRunStatus FROM MktDataTransform WHERE Name = 'MyRuntimeTransformName'"

sf api request rest -o <alias> -X GET \
  "/services/data/v66.0/ssot/data-streams?limit=50"
```

---

## UI alternative

Setup → **Data Kits** → kit → **Publishing Sequence** → deploy each component in order.

Still manual: file uploads, connector re-auth, CRM seed for joins, running batch transforms after deploy.

---

## Common errors

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Bundle / member not in data kit | Unqualified kit lookup | Add `Namespace__` (see naming table in payload catalog) |
| Internal Error on Flow for DLO/transform | Wrong API or names | Retry Connect with qualified kit lookups |
| CRM error on file upload bundle | `connectorType: CRM` on non-CRM bundle | Use `MORECONNECTORS` + connection name |
| Transform deploy OK, run fails | Missing file/join data, null PK | Upload, seed CRM, refresh, verify lakes, re-run |
| Transform SUCCESS, 0 output rows | Ran before lakes filled; INNER join empty | Verify all input lakes; UI full re-run |
| Transform re-run SKIPPED_NO_CHANGES | Incremental after empty first run | UI **Full Run** |
| Transform cannot load dataset | Lake name mismatch publisher vs subscriber | Fix graph in UI or `dataObjectOverrides` on first deploy |
| CRM stream REST refresh blocked | SalesforceDotCom UPSERT | Refresh in Data Cloud UI |
| Wrong API definition name | Multi-definition transform | GET transform; pass correct `definitionName` |
| DMO SOQL unsupported | DMO not on CRM API | Use Data Cloud UI / lake queries |
| Semantic search internal error | Prerequisites or platform | Verify DLO/data; Support with error id |

Forum note: generic **Internal Error** on DLO deploy can mask **“Data Lake Object ID cannot be empty”** when streams/DMOs exist but DLOs were never deployed — deploy DLOs with qualified `dataSourceObjectDevName`.

---

## Post-install checklist template

```markdown
- [ ] Package + dependencies installed
- [ ] Publishing sequence read from `deploymentOrder`
- [ ] Namespace prefix on kit lookup fields in REST payloads
- [ ] Connections active (list: ___)
- [ ] Stream bundles deployed (list: ___)
- [ ] CRM streams refreshed / active
- [ ] Lake object row counts verified (not only stream counters)
- [ ] File data uploaded (if applicable): ___
- [ ] CRM seed data for joins (if applicable): ___
- [ ] DLOs deployed (list: ___)
- [ ] Transforms deployed and **run** with **output rows > 0** (list: ___)
- [ ] Full re-run if SKIPPED_NO_CHANGES or 0 output
- [ ] Semantic search deployed (if applicable)
- [ ] DMO/lake row counts verified in UI
```

---

## Automation notes

- Keep namespace logic in **deploy automation only** (not in Git kit source).
- Sample CSV / seed scripts stay outside the Data Kit package (Winter '25).
- Log `DataKitDeploymentLog` after each step for subscriber support.

---

## References

- Payload / naming catalog: [deploy-kit-components.md](deploy-kit-components.md)
- [Deploy Data Kits — Connect REST](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-deploy-data-kits-using-connect-api.html)
- [Supported Component Types (Connect payloads)](https://developer.salesforce.com/docs/data/connectapi/guide/deploy-data-kit-payloads.html)
- [Deploy Data Kit Components — Flow (legacy)](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-deploy_data_kit_components.html)
- [Stack Exchange: troubleshoot DataKit deploy](https://salesforce.stackexchange.com/questions/429129/how-can-i-troubleshoot-datakit-connect-api-deployment-issues)
- Local OpenAPI (data-kit paths only): [data-kit-endpoints.md](../openapi/data-kit-endpoints.md)
- Kit-specific runbooks may live under individual package `docs/` directories.
