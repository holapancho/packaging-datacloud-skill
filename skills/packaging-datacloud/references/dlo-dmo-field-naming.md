# DLO / DMO field naming (streams vs owned lakes)

Generic rules for Data Cloud / Data 360 when designing schemas for **Data Kits** and subscriber orgs. No product-specific names.

## Two kinds of lakes

| Lake origin | How it is created | Who owns field API names |
|---|---|---|
| **Stream-backed DLO** (e.g. CRM / SalesforceDotCom connector) | Data Stream (or stream bundle) | **Platform / connector** — derived from source object field APIs |
| **Owned / write-target DLO** (custom or transform-output) | Created as a standalone / transform-target lake | **You** — choose developer names at create time |
| **Custom DMO** | Harmonize / map from a DLO | **You** — should **match** the source DLO field contract |

### Stream-backed DLOs — do not chase renames

- Connector naming is deterministic. CRM-style custom fields typically flatten like `Namespace__Field__c` → lake segment `Namespace_Field_c` (plus lake `__c` / package namespace as applicable).
- Mid-name underscores and a `_c` echo of CRM `__c` are **normal**.
- **Deleting and recreating the stream** usually recreates the **same** lake field APIs.
- Free rename of every stream DLO field is **not** a reliable packaging strategy. Prefer leaving stream lakes as the connector emits them.
- Kit the **Data Stream / bundle**, not the stream DLO alone ([data-kit-considerations.md](data-kit-considerations.md)).

### Owned DLOs and custom DMOs — you define the contract

- On lakes you create for **transforms, enrichment, or subscriber write targets**, you may choose field API names (within platform limits).
- Prefer a stable **write contract**: CamelCase (or another consistent style), trailing `__c` only, no redundant `_c` echoes from CRM.
- Keep **DLO and DMO field developer names aligned** (1:1 maps) so mappings and subscriber transforms stay simple.
- Do **not** model `KQ_*` or `cdp_sys_*` as custom kit fields — system / retrieve-cleanup concerns ([packaging-oddities.md](packaging-oddities.md), KQ cleanup in skill).

## Namespace and length

- Managed package namespace prefixes (e.g. `MyNs__`) are applied to **packaged custom** Data Cloud members as documented for your kit type.
- Stream-backed CRM Home-style lakes often keep **source-package** naming on the lake; do not assume every `__dll` field is re-prefixed the same way as a custom DMO.
- Validate field API length in a **namespaced** packaging org before freezing the kit schema. A common working assumption to **prove in org**:

  | Piece | Notes |
  |---|---|
  | Local field developer name | Includes trailing `__c` where applicable |
  | Package prefix | `Namespace__` (length varies; max namespace length is 15) |
  | Practical check | Confirm whether the UI/API enforces ~40 on **local** only or on **prefix + local**; design the owned-lake contract to the stricter rule you observe |

- Object API names for DLOs/DMOs also have platform length limits (~40); confirm in org when naming long developer names.

## Pattern: kit owns storage, subscriber owns transform

Valid packaging pattern:

1. Kit ships **stream-backed source lakes** (via streams) + an **owned write-target DLO** + optional **custom DMO** (+ mappings).
2. Kit does **not** need to ship a batch transform.
3. Subscriber (or implementer) creates their **own** transform that **reads** stream lakes (and/or other sources) and **writes** into the packaged write-target DLO using the **published field API contract**.
4. Packaged DLO→DMO mappings then populate the DMO.

Implications:

- Freeze and document the write-target field list before packaging.
- Publishing sequence typically: **streams → write-target DLO → DMO** (no transform member).
- If the UI requires a transform to *birth* a standalone DLO in the packaging org, that transform may be scratch-only and **omitted** from the kit — confirm the DLO alone can be added to the kit.

## Delete / recreate

| Asset | Delete + recreate with new field APIs? |
|---|---|
| Owned DLO / custom DMO | **Yes** — normal in packaging scratch (remove maps/DMO before DLO; recreate; remap) |
| Stream-backed DLO | Recreate stream **yes**; expect **same** connector-derived field names unless custom create-time mappings are proven to override targets |

## Checklist before freezing a kit schema

- [ ] Stream lakes: accept connector field names; trim unused source fields on the stream if needed
- [ ] Write-target DLO: final field APIs chosen and length-checked under namespace
- [ ] Custom DMO: same field APIs as write-target DLO; mappings complete
- [ ] No custom `KQ_*` / `cdp_sys_*` fields in the contract
- [ ] Subscriber transform guidance references the write-target DLO API + field list
- [ ] Publishing sequence has no packaged transform unless you intentionally ship one
