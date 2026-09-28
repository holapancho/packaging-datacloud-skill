# Deploy Data Kit Components (Connect preferred; Flow legacy)

**Payload and naming catalog** for activating a data kit after package/metadata install.  
**Operator workflow** (order, lake checks, transform run, checklist): [post-install-deploy-runbook.md](post-install-deploy-runbook.md).

**Read order:** naming → Connect payloads → Flow appendix (legacy only).

## Which API

| API | When |
|-----|------|
| **Connect REST** (`POST …/ssot/data-kits/{kit}`) | **Preferred.** Official replacement for Flow single-click deploy. Use for DLO, batch/streaming transform, semantic search, CRM/file bundles, undeploy. Always `asyncMode=true`. |
| **Flow REST** (`sfdatakit__DeployDataKitComponents`) | **Legacy.** Still works for many bundle/DLO patterns; keep for older scripts. Prefer Connect for new work. |

Sources:

- [Deploy Data Kits — Connect REST](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-deploy-data-kits-using-connect-api.html)
- [Supported Component Types (payload schemas)](https://developer.salesforce.com/docs/data/connectapi/guide/deploy-data-kit-payloads.html)
- [Deploy via Flow (legacy)](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-deploy_data_kit_components.html)
- [Deploy Data Kit Components Action (Invocable)](https://developer.salesforce.com/docs/platform/api-action/guide/actions-obj-deploy-datakit-components.html)
- Local Connect path index: [data-kit-endpoints.md](../openapi/data-kit-endpoints.md)

## Connect REST (preferred)

```http
POST /services/data/v{version}/ssot/data-kits/{qualifiedDataKitDevName}?asyncMode=true&dataspace=default
Authorization: Bearer <token>
Content-Type: application/json
```

Body shape: `{ "components": [ { "type": "...", "config": { ... } } ] }`.

Response: `{ "jobId": "08P..." }` — poll **`DataKitDeploymentLog`** for outcome (not `BackgroundOperation`).

**Do not** wrap Connect payloads in Flow `inputs` / `dataKitComponentsInput`. Connect examples: [Connect payload examples](#connect-payload-examples). Full type list: [deploy-data-kit-payloads](https://developer.salesforce.com/docs/data/connectapi/guide/deploy-data-kit-payloads.html).

## Managed 2GP subscriber naming (critical)

After a **managed package** install, kit member names in the **subscriber org** are **namespace-qualified**. Git/source metadata stays **unqualified** — do **not** add the namespace prefix to retrieved files or rebuild the package for deploy naming.

| Context | Example |
|---------|---------|
| Git / publisher org | `MyCatalogDlo2`, `MyDataKitStandard` |
| Subscriber org kit lookup | `Namespace__MyCatalogDlo2`, `Namespace__MyDataKitStandard` |

**Rule:** fields that **look up a kit template member** use the subscriber qualified name (`Namespace__MemberDevName`). Fields that set the **runtime object created in the org** (`apiName`, `label`) typically stay **unqualified** (same as publisher dev name).

| Component | Kit lookup field (qualified) | Runtime field (usually unqualified) |
|-----------|----------------------------|-------------------------------------|
| Data kit | URL path / `dataKitNameInput` / `dataKitName` | — |
| CRM bundle | `bundleName` | `bundleCRMConfig.orgId` (15-char org Id) |
| DLO | `dataSourceObjectDevName` | `apiName`, `label` |
| Batch transform | `dataTransformDevName` | `apiName`, `label` |
| Semantic search | `searchIndexName` | — |

**Common errors:**

| Message | Fix |
|---------|-----|
| `Provided bundle does not exist in the data kit` | Use `Namespace__BundleName` |
| `MyCatalogDlo2 does not exist in the Data kit` | Use `Namespace__MyCatalogDlo2` in `dataSourceObjectDevName` |
| `Internal Error (860597989)` on Flow REST with wrong names | Retry via Connect API with qualified kit lookup fields |
| `Internal Error (860597989)` when `apiName` is `Namespace__…` | Use **unqualified** runtime `apiName` / `label` |

Resolve namespace: inspect `DataKitDeploymentLog.ComponentName` after a partial deploy, or query installed package namespace in the subscriber org.

## Kit ownership vs runtime naming

**Missing `Namespace__` on a deployed stream/DLO API name does not mean the asset left the data kit.**

| Layer | What it is | Typical name in subscriber |
|-------|------------|----------------------------|
| **Kit template** (package install) | Blueprint inside `Namespace__MyDataKit` | Lookups use `Namespace__MemberDevName` |
| **Runtime instance** (kit Deploy) | Live stream / DLO / transform in Data 360 | Often **unqualified** (`MyCatalog__dll`, `Account_Home`) |

Deploy creates the runtime object **from** the kit template and keeps the association. That is why:

- **Undeploy** goes through `POST …/ssot/data-kits/{Namespace__Kit}/undeploy` (UI Undeploy too) and can remove unqualified runtime names.
- Managed kit-deployed components are **locked** for subscribers (Help: [Packages and Data Kits](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/packages-data-kits.html)); kit-owned objects are updated by **redeploying the same kit**, not by treating them as hand-built local lakes ([data-kit-considerations.md](data-kit-considerations.md)).

**Evidence in org:** `DataKitDeploymentLog` rows after Deploy:

| Field | Meaning |
|-------|---------|
| `DataKitName` | Qualified kit (`Namespace__MyDataKit`) |
| `ComponentName` | Runtime / member name (often **unqualified**) |
| `BundleName` | Qualified bundle when applicable |
| `ComponentTemplateId` | Kit template |
| `SubscriberOrgComponentId` | Runtime component Id when populated |

**Do not** set Connect `apiName` to `Namespace__DevName` to “force” a namespaced lake — validated failures return Internal Error (`860597989`). Keep runtime `apiName` unqualified; keep kit lookups namespaced.

**Publisher / packaging org** may show `Namespace__…` on lakes because metadata is authored under the packaging namespace. **Subscriber** runtime copies from kit Deploy are a different naming surface — compare lakes with `DataKitDeploymentLog`, not with the packaging org alone.

## CRM stream bundle activation hints

Payload notes only — full operator steps: [post-install-deploy-runbook.md](post-install-deploy-runbook.md) § CRM stream bundle.

- Pass `connectorType: "CRM"` and the target org’s 15-char CRM `orgId`
- Re-authorize the Salesforce CRM connection before bundle deploy
- After deploy, refresh CRM streams in **UI** when lakes are empty — Connect REST run is blocked for `SalesforceDotCom` UPSERT (`not allowed to run in non-interactive mode`)
- Verify with lake SOQL, not stream `totalRecords` alone

Connect CRM payload: [below](#datastreambundle--crm-connect).

## Troubleshooting deploy status

`isSuccess: true` with `Flow__InterviewStatus: "Waiting"` only starts the job. Query outcomes on **`DataKitDeploymentLog`** (not `BackgroundOperation` — usually empty):

```sql
SELECT ComponentName, ComponentType, DeploymentStatus, DeploymentError,
       FlowInterviewIdentifier, DataKitName, LastModifiedDate
FROM DataKitDeploymentLog
ORDER BY LastModifiedDate DESC
```

See also: [Stack Exchange — troubleshoot DataKit Connect API deployment](https://salesforce.stackexchange.com/questions/429129/how-can-i-troubleshoot-datakit-connect-api-deployment-issues).

## Connect payload examples

Endpoint (repeat):

```http
POST /services/data/v{version}/ssot/data-kits/{qualifiedDataKitDevName}?asyncMode=true&dataspace=default
```

Response: `{ "jobId": "08P..." }` — poll **`DataKitDeploymentLog`** for outcome.

**Do not** wrap Connect payloads in Flow `inputs` / `dataKitComponentsInput`. **Do not** use nested `"components"` inside Flow REST (Flow rejects unknown variable `components`).

### DataLakeObject (Connect)

```json
{
  "components": [{
    "type": "DataLakeObject",
    "config": {
      "dataSourceObjectDevName": "MyNamespace__MyDloKitMember",
      "apiName": "MyDloKitMember",
      "label": "My DLO Label",
      "dataSpaceName": "default"
    }
  }]
}
```

### DataTransform — batch (Connect)

```json
{
  "components": [{
    "type": "DataTransform",
    "config": {
      "dataTransformType": "BATCH",
      "dataTransformDevName": "MyNamespace__MyTransformKitMember",
      "apiName": "MyTransformKitMember",
      "label": "My Transform",
      "dataSpaceName": "default"
    }
  }]
}
```

### DataSemanticSearch (Connect only — not documented on Flow REST)

```json
{
  "components": [{
    "type": "DataSemanticSearch",
    "config": {
      "dataSpaceName": "default",
      "dataKitName": "MyNamespace__MyDataKit",
      "searchIndexName": "MyNamespace__MySearchIndexKitMember"
    }
  }]
}
```

### DataStreamBundle — CRM (Connect)

```json
{
  "components": [{
    "type": "DataStreamBundle",
    "config": {
      "connectorType": "CRM",
      "bundleName": "MyNamespace__MyCrmBundle",
      "forceNoRefresh": false,
      "bundleConfig": { "orgId": "00Dxxxxxxxxxxxx" }
    }
  }]
}
```

### DataStreamBundle — File Upload (Connect)

Same connector enum as Connector Framework — `MORECONNECTORS` with `connectionName: "UploadedFiles"` (or your file-upload connection name):

```json
{
  "components": [{
    "type": "DataStreamBundle",
    "config": {
      "connectorType": "MORECONNECTORS",
      "bundleName": "MyNamespace__MyFileUploadBundle",
      "forceNoRefresh": false,
      "bundleConfig": {
        "connectionName": "UploadedFiles"
      }
    }
  }]
}
```

Note: Connect API rejects `connectorType: "UploadedFiles"` / `"UPLOADEDFILES"` — use `MORECONNECTORS`.

Note: Connect uses `bundleConfig` nesting for CRM org Id; Flow REST uses `bundleCRMConfig` at the same level as `bundleConfig` fields — payload shapes differ slightly between APIs.

### Run batch transform (Connect — after deploy)

Deploy registers the transform; **run** is separate. Operator gates (lake checks, SKIPPED_NO_CHANGES, Full Run): [post-install-deploy-runbook.md](post-install-deploy-runbook.md) § Deploy batch transform.

```bash
sf api request rest -o <alias> -X POST \
  "/services/data/v66.0/ssot/data-transforms/<RuntimeTransformName>/actions/run" \
  -H "Content-Type: application/json" \
  -b '{"definitionName":"<DefinitionName>"}'
```

- `<RuntimeTransformName>` — org runtime name (often matches `label`, not kit member dev name)
- `<DefinitionName>` — from GET `/ssot/data-transforms/{name}` → `definitions[].name`

```bash
sf api request rest -o <alias> -X GET \
  "/services/data/v66.0/ssot/data-transforms/<RuntimeTransformName>/run-history?limit=1"
```

### DataTransform — batch with lake overrides (Connect)

```json
{
  "components": [{
    "type": "DataTransform",
    "config": {
      "dataTransformType": "BATCH",
      "dataTransformDevName": "MyNamespace__MyTransformKitMember",
      "apiName": "MyTransformKitMember",
      "label": "My Transform",
      "dataSpaceName": "default",
      "dataObjectOverrides": [{
        "nameOfObjInPublishingOrg": "PublisherCsv__dll",
        "nameOfObjInSubscriberOrg": "UploadedFiles_MyCsv_1783__dll"
      }]
    }
  }]
}
```

Full component list: [Supported Component Types for Data Kit Deployment](https://developer.salesforce.com/docs/data/connectapi/guide/deploy-data-kit-payloads.html).

---

## Appendix — Flow REST (legacy)

Prefer Connect for new work. Keep this appendix for older scripts and invocable-action callers.

API version **61.0+**. Use Flow only for older scripts or when you need the invocable action surface.

Docs:

- [Deploy via Flow (Data 360 Dev Guide)](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-deploy_data_kit_components.html)
- [Deploy Data Kit Components Action (Actions / Invocable)](https://developer.salesforce.com/docs/platform/api-action/guide/actions-obj-deploy-datakit-components.html)

```http
POST /services/data/v{version}/actions/custom/flow/sfdatakit__DeployDataKitComponents
Authorization: Bearer <token>
Content-Type: application/json
```

### Request inputs

| Field | Required | Description |
|-------|----------|-------------|
| `dataKitNameInput` | Yes | Data kit developer name |
| `dataKitComponentsInput` | Yes | Components to deploy (see below) |
| `dataKitDataSpaceInput` | No | Data space name; defaults to default data space |

Flow deploys components **sequentially**, waiting for each to complete.

### Response

```json
{
  "actionName": "sfdatakit__DeployDataKitComponents",
  "isSuccess": true,
  "outputValues": {
    "Flow__InterviewGuid": "<guid>",
    "Flow__InterviewStatus": "Waiting"
  }
}
```

Track status via Flow interview GUID; confirm outcome on **`DataKitDeploymentLog`**.

## Flow component payload patterns (legacy)

### DataStreamBundle — CRM

```json
{
  "componentType": "DataStreamBundle",
  "bundleConfig": {
    "connectorType": "CRM",
    "bundleName": "<namespace__BundleName>",
    "forceNoRefresh": false,
    "bundleCRMConfig": { "orgId": "00Dxxxxxxxxxxxx" }
  }
}
```

### DataStreamBundle — File Upload (UploadedFiles)

File Upload bundles use the **Connector Framework** path, not CRM. The connection (`UploadedFiles`) must exist and be **Active** first — it is often auto-created when Data 360 is provisioned; verify via `GET /ssot/connections?connectorType=UploadedFiles`.

**Flow REST** (use `bundleConnectorFrameworkConfig`, not `bundleConfig.connectionName`):

```json
{
  "componentType": "DataStreamBundle",
  "bundleConfig": {
    "connectorType": "MORECONNECTORS",
    "bundleName": "MyNamespace__MyFileUploadBundle",
    "forceNoRefresh": false,
    "bundleConnectorFrameworkConfig": {
      "connectionName": "UploadedFiles"
    }
  }
}
```

**Connect REST** uses the same `connectorType` / nested key pattern as Connector Framework (`MORECONNECTORS` + `bundleConfig.connectionName`).

After deploy, the stream is **INACTIVE** until a CSV is uploaded in Data Cloud UI (Data Streams → stream → upload). Transforms that join file data will fail until the stream has run at least once.

### DataStreamBundle — Connector Framework

```json
{
  "componentType": "DataStreamBundle",
  "bundleConfig": {
    "connectorType": "MORECONNECTORS",
    "bundleName": "<qualified_bundle_name>",
    "forceNoRefresh": false,
    "bundleConnectorFrameworkConfig": { "connectionName": "<connection_in_target_org>" }
  }
}
```

### DataStreamBundle — Ingest API

```json
{
  "componentType": "DataStreamBundle",
  "bundleConfig": {
    "connectorType": "INGESTAPI",
    "bundleName": "<qualified_bundle_name>",
    "bundleIngestApiConfig": { "connectorName": "<ingest_api_connector>" }
  }
}
```

### DataStreamBundle — Streaming App

```json
{
  "componentType": "DataStreamBundle",
  "bundleConfig": {
    "connectorType": "STREAMINGAPP",
    "bundleName": "<qualified_bundle_name>",
    "bundleStreamingAppConfig": {
      "connectorName": "<connector>",
      "streamingAppDataConnectorType": "MobileApp"
    }
  }
}
```

### DataLakeObject

```json
{
  "componentType": "DataLakeObject",
  "dloConfig": {
    "dataSourceObjectDevName": "<source_dlo_in_kit>",
    "apiName": "<target_dlo_api_name>",
    "label": "<label>"
  }
}
```

### DataTransform

```json
{
  "componentType": "DataTransform",
  "dataTransformConfig": {
    "dataTransformType": "BATCH",
    "dataTransformDevName": "<kit_transform_name>",
    "apiName": "<target_api_name>",
    "label": "<label>"
  }
}
```

### CalculatedInsight

```json
{
  "componentType": "CalculatedInsight",
  "calculatedInsightsConfig": {
    "apiName": "<kit_ci_api_name>",
    "apiNameOverride": "<target_ci_api_name>",
    "label": "<label>",
    "publishInterval": "NotScheduled"
  }
}
```

### IdentityResolution

```json
{
  "components": [{
    "type": "IdentityResolution",
    "config": {
      "dataSpaceName": "default",
      "templateDevName": "<ir_template>",
      "dataKitDevName": "<kit_dev_name>"
    }
  }]
}
```

### MarketSegment

```json
{
  "components": [{
    "type": "MarketSegment",
    "config": { "name": "<segment_name>", "dataKitName": "<kit_dev_name>" }
  }]
}
```

### DataGraph

```json
{
  "components": [{
    "type": "DataGraph",
    "config": {
      "templateDevName": "<template>",
      "name": "<name>",
      "label": "<label>"
    }
  }]
}
```

## Full Flow example request body (legacy)

```json
{
  "inputs": [{
    "dataKitNameInput": "MyTestDatakit",
    "dataKitDataSpaceInput": "default",
    "dataKitComponentsInput": [
      {
        "componentType": "DataStreamBundle",
        "bundleConfig": {
          "connectorType": "CRM",
          "bundleName": "CRMBundleTest",
          "forceNoRefresh": false,
          "bundleCRMConfig": { "orgId": "00DU200000051Q5" }
        }
      },
      {
        "componentType": "DataLakeObject",
        "dloConfig": {
          "dataSourceObjectDevName": "Account_A_New_DLO",
          "apiName": "Account_A_New_DLO",
          "label": "Account A New DLO"
        }
      },
      {
        "componentType": "DataTransform",
        "dataTransformConfig": {
          "dataTransformType": "BATCH",
          "dataTransformDevName": "BatchTransformAccount",
          "apiName": "BatchTransformAccount",
          "label": "BatchTransformAccount"
        }
      }
    ]
  }]
}
```

