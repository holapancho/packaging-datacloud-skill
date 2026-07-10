# Deploy Data Kit Components Flow (REST Activation)

Source: [Deploy Data Kit Components by Using Deploy Data Kit Components Flow](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-deploy_data_kit_components.html)

API version **61.0+**. Use **after** metadata/package deploy installs the data kit in the target org.

## Endpoint

```http
POST /services/data/v{version}/actions/custom/flow/sfdatakit__DeployDataKitComponents
Authorization: Bearer <token>
Content-Type: application/json
```

## Request inputs

| Field | Required | Description |
|-------|----------|-------------|
| `dataKitNameInput` | Yes | Data kit developer name |
| `dataKitComponentsInput` | Yes | Components to deploy (see below) |
| `dataKitDataSpaceInput` | No | Data space name; defaults to default data space |

Flow deploys components **sequentially**, waiting for each to complete.

## Response

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

Track status via Flow interview GUID.

## Component payload patterns

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

## Full example request body

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

## CRM stream bundle activation hints

For kits that include a **CRM** data stream bundle:

- Pass `connectorType: "CRM"` and the target org’s production CRM `orgId` in deploy payload
- Re-authorize the Salesforce CRM connection in the target org before bundle deploy
- Deploy DLOs and transforms after streams per kit `deploymentOrder` / publishing sequence
- **After deploy:** refresh individual CRM streams in **UI** when CRM has records but lake objects are empty — Connect REST run is blocked for `SalesforceDotCom` UPSERT streams (`not allowed to run in non-interactive mode`)
- **Verify with lake SOQL** (`SELECT ... FROM <Object>_Home__dll`) — stream `totalRecords` can show 0 while lakes have rows or vice versa

Connect REST alternative: `POST ssot/data-kits/{dataKitDevName}` — see [Connect API deploy payloads](#connect-rest-api-preferred-for-dlo-transform-semantic-search) below.

## Troubleshooting deploy status

`isSuccess: true` with `Flow__InterviewStatus: "Waiting"` only starts the job. Query outcomes on **`DataKitDeploymentLog`** (not `BackgroundOperation` — usually empty):

```sql
SELECT ComponentName, ComponentType, DeploymentStatus, DeploymentError,
       FlowInterviewIdentifier, DataKitName, LastModifiedDate
FROM DataKitDeploymentLog
ORDER BY LastModifiedDate DESC
```

See also: [Stack Exchange — troubleshoot DataKit Connect API deployment](https://salesforce.stackexchange.com/questions/429129/how-can-i-troubleshoot-datakit-connect-api-deployment-issues).

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

Resolve namespace: inspect `DataKitDeploymentLog.ComponentName` after a partial deploy, or query installed package namespace in the subscriber org.

## Connect REST API (preferred for DLO, transform, semantic search)

Endpoint:

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

Deploy registers the transform; **run** is a separate step once input lake objects have rows.

```bash
sf api request rest -o <alias> -X POST \
  "/services/data/v66.0/ssot/data-transforms/<RuntimeTransformName>/actions/run" \
  -H "Content-Type: application/json" \
  -b '{"definitionName":"<DefinitionName>"}'
```

- `<RuntimeTransformName>` — org runtime name (often matches `label`, not kit member dev name)
- `<DefinitionName>` — from GET `/ssot/data-transforms/{name}` → `definitions[].name`

Poll:

```bash
sf api request rest -o <alias> -X GET \
  "/services/data/v66.0/ssot/data-transforms/<RuntimeTransformName>/run-history?limit=1"
```

**Re-run:** API may return run history status `SKIPPED_NO_CHANGES` after an earlier empty run — use UI **Run Now / Full Run**. See [post-install-deploy-runbook.md](post-install-deploy-runbook.md).

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
