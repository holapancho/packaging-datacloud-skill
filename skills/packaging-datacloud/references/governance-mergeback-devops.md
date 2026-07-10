# Governance Mergeback with DevOps Data Kits

Source: [Salesforce Help — Data 360 Governance Mergeback with DevOps Data Kits](https://help.salesforce.com/s/articleView?id=data.c360_a_mergeback_devops_datakits.htm&type=5)

**Scope:** Moving **governance metadata** (tags, RLS, FLS, OLS, structured masking) from sandbox to linked production via **DevOps** kits — **not** ISV managed packaging.

## Kit type (official)

| Kit type | Use |
|----------|-----|
| **DevOps** | Sandbox-to-production **mergeback** between **linked** environments |
| **Standard** | **Packaging and deployment across orgs** (managed 2GP / subscribers) |

Do **not** use DevOps mergeback for AppExchange / managed 2GP subscriber distribution. Use a **Standard** kit + 2GP.

## What mergeback moves

- Tag assignments on DMOs, DLOs, CIOs
- Governance policies (RLS, FLS, OLS, structured masking)

Policies and tag assignments **cannot** be added to a kit alone. Add **DMOs/DLOs** to the DevOps kit; associated governance policies and tag assignments are included automatically.

## Supported governance (mergeback)

- **Standard tags** only on Data 360 objects
- Policies based on standard tags: RLS, FLS, object-level structured masking

## Not supported — workarounds

| Unsupported | Workaround |
|-------------|------------|
| Custom tags created in sandbox → prod | Recreate custom tags manually in target prod |
| Assigning custom tags via mergeback | Assign manually in target after deploy |
| Policies based on custom tags | Use **standard tags** only |
| Policies mixing standard + custom tags | Redesign to standard tags only |
| Unstructured data masking policies | Configure separately in target org |
| RLS hierarchy operator policies | Use supported RLS policy types |
| Deleting governance metadata via mergeback | Remove manually in target via Data Governance UI/API |

## Deployment constraints

- **Paths:** Only between **related** Data 360 environments (sandbox→prod, sandbox→sandbox).
- **Deletion:** Removing a policy in sandbox does **not** remove it in target.
- **CLI:** **Salesforce CLI does not support governance policy deployment.** Use DevOps kit built-in mechanisms (e.g. change sets), not `sf project deploy` for governance-only promotion.
- **System-defined tags:** Do not rename, delete, or reassign — platform reverts on updates.
- **RLS with joins:** All referenced objects must exist in target (deploy via DevOps kits first).

## Relation to general DevOps CLI workflow

[devops-cli-workflow.md](devops-cli-workflow.md) covers **general** Data Kit metadata (streams, DMOs, transforms) via `sf project retrieve/deploy`. Governance mergeback is a **narrower** DevOps use case with **CLI excluded** for policies.

## Related

- [standard-vs-devops-data-kits.md](standard-vs-devops-data-kits.md)
- [data-kit-considerations.md](data-kit-considerations.md) — standard tags for stream bundles in kits
- [help-articles-index.md](help-articles-index.md)
