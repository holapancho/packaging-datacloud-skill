# Post-install: Deploy a Standard Data Kit (managed 2GP)

Runbook for activating a **Standard Data Kit** in a **subscriber org** after managed 2GP package install. Applies to any kit packaged with `DataPackageKitDefinition` and a defined **publishing sequence**.

Payload details: [deploy-components-flow.md](deploy-components-flow.md).

---

## Core concepts

| Concept | Detail |
|---------|--------|
| **Install ≠ deploy** | Package install copies kit **metadata** into the org. Components are not live in Data 360 until **deployed/activated** per publishing sequence. |
| **Git stays unqualified** | Retrieved source uses publisher dev names (`MyDlo2`, `MyDataKit`). Do **not** namespace-prefix files in Git or rebuild the package for subscriber deploy naming. |
| **Kit lookup vs runtime names** | Deploy payloads use **`Namespace__KitMemberDevName`** on fields that reference a **kit template member**. Fields that set the **runtime object** in the org (`apiName`, `label`) usually stay **unqualified**. |
| **Sequence matters** | Order is defined in `DataPackageKitDefinition.deploymentOrder` (set in source org before packaging). Deploy dependencies before dependents. |
| **Status polling** | Query **`DataKitDeploymentLog`**, not `BackgroundOperation`. Flow `Waiting` / Connect `jobId` only means the job **started**. |
| **Deploy success ≠ run success** | Batch transforms register on deploy but produce data only after **Run Now** when upstream lake objects have rows. |
| **Trust lake queries over stream counters** | CRM/file streams may show **Success + 0 records** while `*__dll` objects already have data (or lakes empty while stream shows success). Verify with lake SOQL before running transforms. |

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| Data 360 / Data Cloud provisioned | Target of all deploy operations |
| Package dependencies installed | e.g. SSOT package if the kit maps to standard DMOs |
| Companion packages / CRM objects | If the kit includes CRM stream bundles |
| Data kit package installed | Kit visible under Setup → Data Kits |
| Subscriber namespace known | Managed 2GP → `Namespace__` prefix on kit members in the org |
| 15-character org Id | Required for CRM bundle deploy |

```bash
# Org Id (15 chars) for CRM bundles
sf org display -o <alias> --json | jq -r '.result.id' | cut -c1-15

# Installed package namespace (example)
sf package installed list -o <alias> --json | jq '.result[] | select(.SubscriberPackageName | test("YourPackage"))'
```

---

## Determine deploy order

Read publishing sequence from retrieved metadata:

```text
force-app/main/default/dataPackageKitDefinitions/<KitDevName>.dataPackageKitDefinition-meta.xml
```

Field: `deploymentOrder` → JSON array of `{ "devName", "type" }`.

Common `type` values:

| Type | Typical role |
|------|----------------|
| `MktDataConnection` | Connector (File Upload, external, etc.) |
| `DataStream` | Stream bundle (CRM, file upload, ingest API, …) |
| `MktDataTransform` | Batch or streaming transform |
| `MktDataLakeObject` | Data lake object (DLO) |
| `DataSemanticSearch` | Vector / semantic search index |

Deploy **in sequence order**. Parallel branches are only safe when components have no data dependency (document per kit).

---

## Deploy APIs

### Connect REST

Preferred for **DLO**, **batch/streaming transform**, **semantic search**, and some connections.

```http
POST /services/data/v{version}/ssot/data-kits/{Namespace__KitDevName}?asyncMode=true&dataspace=default
Content-Type: application/json

{ "components": [ { "type": "...", "config": { ... } } ] }
```

Response: `{ "jobId": "08P..." }`.

```bash
sf api request rest -o <alias> -X POST \
  "/services/data/v66.0/ssot/data-kits/Namespace__MyDataKit?asyncMode=true&dataspace=default" \
  -H "Content-Type: application/json" \
  -b @payload.json
```

### Flow REST

Used for **stream bundles** (CRM, file upload via connector framework, ingest API, etc.) and matches the invocable flow shape.

```http
POST /services/data/v{version}/actions/custom/flow/sfdatakit__DeployDataKitComponents

{
  "inputs": [{
    "dataKitNameInput": "Namespace__MyDataKit",
    "dataKitDataSpaceInput": "default",
    "dataKitComponentsInput": [ ... ]
  }]
}
```

**Do not** embed Connect-style top-level `"components"` in Flow payloads.

Connector enum casing matters (e.g. `INGESTAPI`, not `"Ingestion API"`).

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

### 0 — Confirm kit installed

Setup → **Data Kits** → kit appears (API name may be namespace-qualified).

---

### 1 — Connections (`MktDataConnection`)

**File Upload (`UploadedFiles`)** is often **already Active** after Data 360 provisioning:

```bash
sf api request rest -o <alias> -X GET \
  "/services/data/v66.0/ssot/connections?connectorType=UploadedFiles"
```

If missing, deploy via Connect **DataConnection** (see [deploy-components-flow.md](deploy-components-flow.md)). External connectors may require credentials in `newCredentials`.

---

### 2 — CRM stream bundle (`DataStream` + CRM platform)

**Flow REST:**

```json
{
  "componentType": "DataStreamBundle",
  "bundleConfig": {
    "connectorType": "CRM",
    "bundleName": "Namespace__MyCrmBundle",
    "forceNoRefresh": false,
    "bundleCRMConfig": { "orgId": "<15-char-org-id>" }
  }
}
```

Wait until constituent streams show **ACTIVE**. Zero rows on the stream counter is acceptable for **deploy**; downstream transforms need lake rows at **run** time.

**CRM stream refresh:** `SalesforceDotCom` connector streams in UPSERT mode typically **cannot** be refreshed via Connect REST (`not allowed to run in non-interactive mode` / interactive mode requires FULL_REFRESH). Use **Data Cloud UI** → Data Streams → **Refresh** when CRM has records but lake objects are empty.

**Verify lakes, not only stream status:**

```bash
sf data query -o <alias> -q "SELECT Id__c FROM <CrmLakeObject>__dll LIMIT 5"
```

**Error:** `Provided bundle does not exist in the data kit` → qualify `bundleName` with namespace.

---

### 3 — File upload stream bundle (`DataStream` + UploadedFiles platform)

**Not** a CRM bundle. Use **Connector Framework** (`MORECONNECTORS`):

**Flow REST:**

```json
{
  "componentType": "DataStreamBundle",
  "bundleConfig": {
    "connectorType": "MORECONNECTORS",
    "bundleName": "Namespace__MyFileUploadBundle",
    "forceNoRefresh": false,
    "bundleConnectorFrameworkConfig": {
      "connectionName": "UploadedFiles"
    }
  }
}
```

Connect REST: same `connectorType`; `bundleConfig.connectionName` (not `UploadedFiles` as connector type — API rejects it).

**Subscriber lake object name drift:** Deployed stream runtime name may differ from publisher template (e.g. `UploadedFiles_<templateId>__dll` vs `MyCsv__dll`). Note actual names under **Data Lake Objects** after deploy.

---

### 3b — Upload file data (not in package)

File upload kits define **schema**, not **content**. Subscribers must upload files in Data Cloud UI:

1. **Data Streams** → deployed file stream → upload file(s)
2. Wait until stream **ACTIVE**

Validate:

```bash
sf data query -o <alias> -q \
  "SELECT <field>__c FROM <ActualLakeObjectName>__dll LIMIT 5"
```

Ship sample files separately (docs, sample-data directory, or customer data onboarding)—never in the Data Kit package itself.

---

### 3c — Seed join-side CRM data (when transforms require it)

Batch transforms that **join** file data to CRM lake objects need **matching keys** on both sides at **run** time.

Example failure (runtime):

> Output field mapped as **primary key** must not contain null values (often after a LEFT JOIN when the right side has no rows).

**Mitigation:**

1. Create CRM records that match join keys (e.g. `Name` = file column value)
2. **Refresh** the relevant CRM data stream
3. Confirm lake object rows: `SELECT ... FROM <CrmLakeObject>__dll`
4. Re-run the transform

Design-time note: non-null PK on a field populated only from an optional join forces subscriber seed data or kit design change.

---

### 4 — Deploy batch transform (`MktDataTransform`)

**Connect REST:**

```json
{
  "components": [{
    "type": "DataTransform",
    "config": {
      "dataTransformType": "BATCH",
      "dataTransformDevName": "Namespace__MyBatchTransform",
      "apiName": "MyBatchTransform",
      "label": "My Batch Transform",
      "dataSpaceName": "default"
    }
  }]
}
```

**Deploy success ≠ run success.** Do not run until upstream lake objects return rows (see pre-run gate below).

Optional when publisher/subscriber lake object names differ:

```json
"dataObjectOverrides": [{
  "nameOfObjInPublishingOrg": "PublisherCsv__dll",
  "nameOfObjInSubscriberOrg": "UploadedFiles_MyCsv_1783__dll"
}]
```

Redeploying overrides on an **already deployed** transform can fail with internal errors — prefer fixing the graph in UI if runtime definition already references the correct subscriber lake name.

#### Pre-run gate

Before **Run Now**, confirm every input lake object in the transform graph has data:

```bash
sf data query -o <alias> -q "SELECT <key_field>__c FROM <InputLake>__dll LIMIT 3"
```

For transforms with **INNER** joins, one empty input lake yields **SUCCESS with 0 output rows**.

#### Run batch transform

**UI:** Data Transforms → transform → **Run Now** (use **Full Run** when re-running after late-arriving stream data).

**Connect REST:**

```bash
sf api request rest -o <alias> -X POST \
  "/services/data/v66.0/ssot/data-transforms/<RuntimeTransformName>/actions/run" \
  -H "Content-Type: application/json" \
  -b '{"definitionName":"<DefinitionNameFromTransformGraph>"}'
```

Poll status:

```bash
sf data query -o <alias> -q \
  "SELECT Name, LastRunStatus FROM MktDataTransform WHERE Name = '<RuntimeTransformName>'"

sf api request rest -o <alias> -X GET \
  "/services/data/v66.0/ssot/data-transforms/<RuntimeTransformName>/run-history?limit=1"
```

**Definition name:** Required for multi-definition transforms. Read from Connect GET on the transform (`definitions[].name`) — not always `{label}_Definition`.

**Re-run pitfall:** After a run that processed 0 rows, a subsequent API run may return **`SKIPPED_NO_CHANGES`** in run history even after lakes fill. Use UI **Full Run** to force reprocessing; there is no documented `forceFullRun` body field on the run API.

---

### 5 — Deploy DLO (`MktDataLakeObject`)

**Connect REST:**

```json
{
  "components": [{
    "type": "DataLakeObject",
    "config": {
      "dataSourceObjectDevName": "Namespace__MyDloKitMember",
      "apiName": "MyDloKitMember",
      "label": "My DLO Label",
      "dataSpaceName": "default"
    }
  }]
}
```

**Error:** `<Member> does not exist in the Data kit` → qualify `dataSourceObjectDevName`.

DLO deploy can succeed before transforms run; data appears after transform output or stream mapping.

---

### 6 — Deploy semantic search (`DataSemanticSearch`)

**Prerequisites:** Upstream DLO/transform/data per kit design; for vector search, **Agentforce enabled in the org** (deploy may fail with internal errors such as `(-1256768968)` without it). Kit template name (e.g. `Namespace__MySearchIndexMember`) differs from runtime search index API name (e.g. `MySearchIndex` from template payload) — verify via `DataSemanticSearch` / Connect `GET /ssot/search-index/{developerName}`, not UI label alone.

**Connect REST only** (not on Flow REST docs):

```json
{
  "components": [{
    "type": "DataSemanticSearch",
    "config": {
      "dataSpaceName": "default",
      "dataKitName": "Namespace__MyDataKit",
      "searchIndexName": "Namespace__MySearchIndexMember"
    }
  }]
}
```

Requires upstream DLO/transform/data per kit design. Internal errors after correct naming may require Salesforce Support.

**Data cascade hypothesis:** Search index deploy is typically *after* output DLO + batch transform in the publishing sequence. DLO/transform deploy does **not** require lake data, but the **source DMO usually needs rows** on indexed field(s) before search is useful — and may affect deploy success. Filling upstream lakes does **not** auto-deploy search or re-run the transform; operators must **Full Run** the transform, verify output DLO/DMO, then **retry** search deploy. See [catalog-search-data-cascade.md](catalog-search-data-cascade.md).

---

## Verify runtime state

| Check | How |
|-------|-----|
| Streams active | Data Cloud → Data Streams, or Connect GET `/ssot/data-streams` (`status`, `totalRecords`) |
| Lake object rows | Query `*__dll` where SOQL supported — **authoritative** for transform inputs |
| Transform last run | `MktDataTransform` → `LastRunStatus`; run history via Connect API |
| Transform output rows | Run history `outputStatus[].totalRows` or query output `*__dll` |
| DMO rows | Data Cloud UI preview; `*__dlm` SOQL may be **unsupported** on some orgs |
| Deploy history | `DataKitDeploymentLog` |

```bash
sf data query -o <alias> -q \
  "SELECT Name, LastRunStatus FROM MktDataTransform WHERE Name = 'MyRuntimeTransformName'"

sf api request rest -o <alias> -X GET \
  "/services/data/v66.0/ssot/data-streams?limit=50"
```

**Stream vs lake:** `totalRecords` on a CRM stream can lag or disagree with lake row counts. Always query the lake object before declaring upstream data ready.

---

## Managed 2GP naming cheat sheet

| Field / context | Subscriber value |
|-----------------|------------------|
| Kit URL / `dataKitNameInput` | `Namespace__KitDevName` |
| `bundleName` | `Namespace__BundleDevName` |
| `dataSourceObjectDevName` | `Namespace__DloKitMember` |
| `dataTransformDevName` | `Namespace__TransformKitMember` |
| `searchIndexName` | `Namespace__SearchIndexMember` |
| `apiName`, `label` (runtime) | Usually **unqualified** (publisher dev name) |

Resolve namespace from `DataKitDeploymentLog.ComponentName` after a partial deploy, or from installed package metadata.

---

## UI alternative

Setup → **Data Kits** → select kit → **Publishing Sequence** → deploy each component in order.

Manual steps still required for:

- File uploads
- Connector re-authentication (credentials not in kit)
- CRM seed data for joins
- Running batch transforms after deploy

---

## Common errors

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Bundle / member not in data kit | Unqualified kit lookup in payload | Add `Namespace__` prefix |
| Internal Error on Flow deploy for DLO/transform | Wrong API or wrong name; use Connect | Retry Connect with qualified names |
| CRM error on file upload bundle | `connectorType: CRM` on non-CRM bundle | Use `MORECONNECTORS` + connection name |
| Transform deploy OK, run fails | Missing file data, missing join data, null PK on output | Upload files, seed CRM, refresh streams, verify lakes, re-run |
| Transform SUCCESS, 0 output rows | Ran before lakes populated; or INNER join with empty side | Verify all input lakes; UI full re-run |
| Transform re-run SKIPPED_NO_CHANGES | Incremental optimization after empty first run | UI **Run Now / Full Run** |
| Transform cannot load dataset | Lake object name mismatch publisher vs subscriber | Fix graph in UI or `dataObjectOverrides` on first deploy |
| CRM stream REST refresh blocked | SalesforceDotCom UPSERT connector | Refresh in Data Cloud UI |
| Wrong API definition name | Multi-definition transform | GET transform; pass correct `definitionName` in run body |
| DMO SOQL unsupported | DMO not exposed to CRM API | Use Data Cloud UI / lake queries |
| Semantic search internal error | Prerequisites or platform issue | Verify DLO/data; open Support with error id |

Forum note: generic **Internal Error** on DLO deploy has masked **“Data Lake Object ID cannot be empty”** when streams/DMOs exist but DLOs were never deployed—deploy DLOs with qualified `dataSourceObjectDevName`.

---

## Post-install checklist template

Copy and fill per kit:

```markdown
- [ ] Package + dependencies installed
- [ ] Publishing sequence read from `deploymentOrder`
- [ ] Namespace prefix applied on kit lookup fields in REST payloads
- [ ] Connections active (list: ___)
- [ ] Stream bundles deployed (list: ___)
- [ ] CRM streams refreshed / active
- [ ] **Lake object row counts verified** (not only stream counters)
- [ ] File data uploaded (if applicable): ___
- [ ] CRM seed data for joins (if applicable): ___
- [ ] DLOs deployed (list: ___)
- [ ] Transforms deployed and **run** successfully with **output rows > 0** (list: ___)
- [ ] Full re-run used if first run had SKIPPED_NO_CHANGES or 0 output
- [ ] Semantic search deployed (if applicable)
- [ ] DMO/lake row counts verified in UI
```

---

## Automation notes

- Wrap REST payloads in post-install scripts, Apex, or CI; keep namespace logic in **deploy automation only**.
- Store sample CSV / seed scripts outside the Data Kit package (Winter '25: kit package directory is Data Cloud metadata only).
- Log `DataKitDeploymentLog` after each step for subscriber support.

---

## References

- [Deploy Data Kit Components Flow](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-deploy_data_kit_components.html)
- [Supported Component Types (Connect payloads)](https://developer.salesforce.com/docs/data/connectapi/guide/deploy-data-kit-payloads.html)
- [Stack Exchange: troubleshoot DataKit deploy](https://salesforce.stackexchange.com/questions/429129/how-can-i-troubleshoot-datakit-connect-api-deployment-issues)
- Kit-specific example runbooks may live under individual package `docs/` directories.
