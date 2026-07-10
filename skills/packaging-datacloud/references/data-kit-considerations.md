# Data Kit Considerations & Common Issues

Source: [Salesforce Help — Data 360: Data Kit Considerations & Common Issues](https://help.salesforce.com/s/articleView?id=003960830&type=1) (KB 003960830, Jun 2026)

Official supplement to DevOps/2GP workflow docs. Use when building kits, choosing Standard vs DevOps type, or diagnosing deploy failures.

## Considerations

### Kit ownership and updates

- Objects deployed via a **Standard** or **DevOps** Data Kit can **only** be updated by modifying and redeploying the **same** kit (same type).
- **Standard and DevOps kits are not interchangeable** for updating the same object.
- Objects **created manually** in the org (not via a kit) **cannot** be updated using any Data Kit.

### What cannot go in a kit

| Asset | Rule |
|-------|------|
| **DBT segments** (created via API) | End users cannot add them; excluded from kits |
| **DLO linked to a Data Stream** | Do not add the DLO manually — select the **Data Stream**; the DLO is added automatically |
| **Standalone DLO** | Only DLOs created from a **Data Transform** can be added manually |

### DMO dependencies in the kit UI

If a DMO or its fields have dependencies, add the **DMO and all relevant fields** explicitly to the kit. If the dependency picker spans **multiple pages**, open **each page** and select everything required.

### FieldSrcTrgtRelationship (deploy vs package)

- **Deploy error** `DMO relationships require a FieldSrcTrgtRelationship…` → include the matching `FieldSrcTrgtRelationship` in the manifest/package.
- DMO relationships can only be packaged when the DMO type is **Standard** or **Custom** (not other DMO types).
- **Packaging** (`sf package version create`) may still fail with relations present — see [packaging-oddities.md](packaging-oddities.md). Deploy and package requirements differ.

### Data Stream bundles

For kit deployments involving stream bundles, only **standard tags** are supported.

## Environment considerations

| Path | Non-default objects in kit |
|------|----------------------------|
| **Production → Production** | **Not supported** — cannot put non-default objects in a kit |
| **Sandbox → Production** or **Sandbox → Sandbox** | Supported with **DevOps** kit + **Outbound Rules** + **Inbound Rules** + Deploy workflow |
| DevOps deploy to non-default objects | Object **API names ≤ 40 characters** or deploy may fail |

**Implication for ISV 2GP:** Use a **Standard** kit only — see [standard-vs-devops-data-kits.md](standard-vs-devops-data-kits.md). DevOps kits are for sandbox→prod **metadata deploy**, not managed package distribution.

## Common issues

| Issue | Cause / fix |
|-------|-------------|
| **Data Kit type mismatch** | Sandbox→Production via change sets requires a **DevOps** kit, not Standard |
| `Expected source (User_00Dxxxx__dll) to have field (ColumnName__c)` | Field missing on source DLO, or **Data Cloud Salesforce Connector** permission set lacks field access — see [Enable CRM connection permissions](https://help.salesforce.com/s/articleView?id=data.c360_a_enable_user_permissions_external_salesforce_org.htm&type=5) |
| **Publishing sequence failures** | Streams depend on **connections** — include connection in deploy order / sequence |
| **Connection inactive** after kit deploy with streams | See [Impact of deploying via Data Kit on external connectors](https://help.salesforce.com/s/articleView?id=004695449&type=1) — re-authorize; plan connector impact |
| **Data Transform in non-default data space** | Transforms tied to non-default data spaces **cannot** be deployed via Data Kits today |

## Related skill docs

- [devops-cli-workflow.md](devops-cli-workflow.md) — DevOps kit sandbox→prod
- [2gp-workflow.md](2gp-workflow.md) — Standard kit + managed 2GP
- [troubleshooting.md](troubleshooting.md) — FieldSrcTrgtRelationship, publishing sequence
- [packaging-oddities.md](packaging-oddities.md) — KQ_*, relations at package version create
