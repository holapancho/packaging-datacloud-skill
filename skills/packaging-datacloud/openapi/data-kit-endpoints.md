# Data Kit Connect endpoints (index)

Slim index of **data-kit** Connect REST paths used for packaging / post-install / undeploy. Prefer this over downloading the full Connect OpenAPI.

Payload schemas: [Supported Component Types](https://developer.salesforce.com/docs/data/connectapi/guide/deploy-data-kit-payloads.html).  
How-to: [deploy-kit-components.md](../references/deploy-kit-components.md) · [post-install-deploy-runbook.md](../references/post-install-deploy-runbook.md).

| Method | Path | Use |
|--------|------|-----|
| GET, POST | `/ssot/data-kits` | List / create kits |
| GET | `/ssot/data-kits/available-components` | Components available to add |
| GET, PATCH, **POST** | `/ssot/data-kits/{dataKitDevName}` | Get / update / **deploy** (`?asyncMode=true`) |
| GET | `/ssot/datakit/{dataKitDevName}/manifest` | Kit member manifest — **singular `datakit`** (see note) |
| POST | `/ssot/data-kits/{dataKitName}/undeploy` | Undeploy components |
| GET | `/ssot/data-kits/{dataKitName}/components/{componentName}/dependencies` | Component deps |
| GET | `/ssot/data-kits/{dataKitName}/components/{componentName}/deployment-status` | Deploy status |

**Manifest path quirk:** Almost every data-kit Connect resource is under `/ssot/data-kits/…` (plural). The **get manifest** operation is the exception: OpenAPI + generated clients use **`GET /ssot/datakit/{dataKitDevName}/manifest`** (singular `datakit`). The Connect API HTML summary table sometimes lists the plural form for that row — treat that as a docs inconsistency; do **not** “normalize” the manifest call to `/ssot/data-kits/…/manifest`.

Related (not under `/ssot/data-kits*` but used post-deploy):

| Method | Path | Use |
|--------|------|-----|
| POST | `/ssot/data-transforms/{name}/actions/run` | Run batch transform |
| GET | `/ssot/data-transforms/{name}/run-history` | Transform run history |
| GET | `/ssot/data-streams` | List streams |
| GET | `/ssot/connections` | List connections |
| GET | `/ssot/search-index/{developerName}` | Search index config |

Always call with `asyncMode=true` on deploy/undeploy. Poll **`DataKitDeploymentLog`** for outcome.
