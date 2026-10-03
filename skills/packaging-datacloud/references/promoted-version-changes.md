# Changes after a promoted Data Kit version

A promoted `04t` is frozen. The next version uses that promoted version as ancestor. A beta version cannot be upgraded; uninstall the beta before installing a different beta.

Upgrade and deploy stay separate. Package upgrade refreshes the **template**. Runtime in the data space changes only when that same Standard kit is deployed again. Objects from a Standard kit are updated by modifying and redeploying that same kit — [data-kit-considerations.md](data-kit-considerations.md).

## Subscriber path after an add or a modify

1. Create and promote the new package version.
2. Upgrade the installed package in the subscriber org.
3. Redeploy the **same** kit into the same data space — [post-install-deploy-runbook.md](post-install-deploy-runbook.md), payloads in [deploy-kit-components.md](deploy-kit-components.md).

Do not undeploy first. Undeploy removes runtime components and is the step **before uninstall**, not before an upgrade — [undeploy-uninstall-runbook.md](undeploy-uninstall-runbook.md).

Until the redeploy, already deployed components keep the previous definition, including local subscriber edits. Redeploy overwrites those edits with the kit definition. Managed-package subscribers cannot modify or delete deployed mappings or components ([Packages and Data Kits](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/packages-data-kits.html)).

## What is doable

| Change | Version creation | After upgrade | After redeploy of the same kit |
| --- | --- | --- | --- |
| Add a component | Succeeds when the new member is in the retrieved manifest | Template lists it. Existing runtime is unchanged | New component deploys. Dependencies must already be earlier in `deploymentOrder` |
| Modify, same API name | Succeeds when manageability rules allow it. `sf package version create` fails the version when they do not | Template shows the new definition. Runtime, including local edits, stays | Runtime matches the template. Local edits on that component are overwritten |
| Change a DLO, DMO, or stream API name | Expect version creation or deploy to fail. Names must stay identical between source and target | Stop if version creation fails | Stop if version creation fails |
| Remove the member from the kit and leave its metadata in the package | Can succeed | Template no longer lists it. Deployed copy remains | Deployed copy remains. A later version does not delete runtime |
| Delete the metadata files from the package | Expect failure. The [2GP removal list](https://developer.salesforce.com/docs/platform/pkg2-dev/guide/sfdx-dev-dev2gp-remove-md-components.html) does not include `DataPackageKitDefinition`, `DataStreamTemplate`, `DataPackageKitObject`, or the other Data 360 kit types. Ancestor membership and remaining references also fail version creation | No upgrade | No redeploy |
| Two Standard kits in one package | Supported. A package can contain one or more data kits, all Data Cloud metadata, in the dedicated package directory | Both kits are installed as templates. Deploy each kit on its own | Same API name in one data space fails the second deploy |

To remove a live component, undeploy that component (reverse `deploymentOrder`), then ship a package change only if version creation allows it. Do not describe a package upgrade as deleting runtime streams, lakes, or insights.

## Sources

- [Packages and Data Kits](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/packages-data-kits.html)
- [Upgrade a Second-Generation Managed Package Version](https://developer.salesforce.com/docs/platform/pkg2-dev/guide/sfdx-dev-dev2gp-install-pkg-upgrade.html)
- [Remove Metadata Components from Second-Generation Managed Packages](https://developer.salesforce.com/docs/platform/pkg2-dev/guide/sfdx-dev-dev2gp-remove-md-components.html)
