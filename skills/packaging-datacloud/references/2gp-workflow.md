# Managed 2GP — Data Kit Package Version

End-to-end for **Standard** data kits in a **managed 2GP** package (AppExchange / ISV distribution).

## Prerequisites

- Dev Hub org with 2GP enabled
- **Standard** data kit built in a source org (not DevOps for packaging)
- Publishing sequence saved in UI
- Kit retrieved into Git — [retrieve-workflow.md](retrieve-workflow.md)
- Post-retrieve KQ cleanup done
- `sfdx-project.json`: dedicated package directory, SSOT dependency — [ssot-package-dependency.md](ssot-package-dependency.md)

## 1. Package directory (Winter '25+)

Data Kit package path must contain **only** Data Cloud metadata — no Apex, LWC, Flow, or agents.

```json
{
  "packageDirectories": [
    {
      "path": "data-kit",
      "package": "My Data Kit Package",
      "versionNumber": "1.0.0.NEXT",
      "default": true,
      "dependencies": [
        { "package": "ssot-standard-data-model@<version>" }
      ]
    }
  ]
}
```

For monorepos using `force-app`, set `path` to that subdirectory — see [retrieve-workflow.md](retrieve-workflow.md) Layout B.

## 2. Create unmanaged package (once)

```bash
sf package create --name "My Data Kit Package" --path data-kit --package-type Managed
```

Record `0Ho…` Id in `sfdx-project.json` if not auto-written.

## 3. Retrieve (if not already in Git)

Follow [retrieve-workflow.md](retrieve-workflow.md):

```bash
sf project retrieve start --manifest <package-root>/package.xml -o <source_org>
find <package-root> -path '*/objects/*/fields/KQ_*' -name '*.field-meta.xml' -delete
```

Verify `DataPackageKitDefinition.deploymentOrder` — [kit-definition-metadata.md](kit-definition-metadata.md).

## 4. Test deploy (scratch subscriber)

Create scratch org with Data Cloud features; install SSOT dependency if needed; deploy package metadata:

```bash
sf project deploy start --source-dir <package-root> -o <scratch_org>
```

Fix packaging blockers (KQ files, mixed metadata, invalid types) before version create.

## 5. Create package version

```bash
sf package version create \
  -v <devhub_alias> \
  -p <0Ho_package_id> \
  -w 90 \
  -f config/project-scratch-def.json \
  --code-coverage
```

Data Kit builds often exceed 1 hour — use `-w 90` or higher.

## 6. Promote & distribute

```bash
sf package version promote -v <devhub> -p <04t_version_id>
```

Subscriber flow: [deploy-components-flow.md](deploy-components-flow.md).

## Related

- [retrieve-workflow.md](retrieve-workflow.md)
- [packaging-oddities.md](packaging-oddities.md)
- [troubleshooting.md](troubleshooting.md)
