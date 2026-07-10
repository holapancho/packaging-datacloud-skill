# DevOps Data Kit — CLI Sandbox to Production

Source: [Use CLI to Deploy Changes from a Sandbox to Data 360](https://developer.salesforce.com/docs/data/data-cloud-dev/guide/dc-deploy_data_kit_using_cli.html)

## Audience

In-house teams moving Data Cloud config between sandboxes or sandbox → production via **metadata API deploy**. This is **not** the managed 2GP / AppExchange packaging path — use a **Standard** kit and [2gp-workflow.md](2gp-workflow.md) for that.

See [standard-vs-devops-data-kits.md](standard-vs-devops-data-kits.md). Per [Help — Data Kits](https://help.salesforce.com/s/articleView?id=data.c360_a_data_package_kits.htm&type=5): DevOps kits deploy to the **same data space** in the target org. For **governance** mergeback, CLI is **not** supported — [governance-mergeback-devops.md](governance-mergeback-devops.md).

## Prerequisites

- Deployment connection authorized between production and sandbox
- VS Code + Salesforce CLI
- **Matching data space prefix** in sandbox and production (create in Data Cloud Setup in both orgs)

## Steps

### 1. SFDX project with manifest

Create project; in `sfdx-project.json`:
- Production login: `https://login.salesforce.com`
- Sandbox login: `https://test.salesforce.com`

### 2. Authorize orgs

```bash
sf org login web -a prod --instance-url https://login.salesforce.com
sf org login web -a sandbox --instance-url https://test.salesforce.com
```

### 3. Create DevOps data kit (sandbox)

1. Data Cloud Setup → create data kit
2. **Data Kit Type: DevOps**
3. Add components (streams, DLOs, CIs, data graphs, …)
4. Review publishing sequence

### 4. Download manifest

Data Kits → DevOps kit → **Download Manifest**

Or Connect REST: **get data kit manifest**

Save as e.g. `<package-root>/package.xml`

### 5. Retrieve

```bash
sf project retrieve start \
  --manifest <package-root>/package.xml \
  -o sandbox
```

See [retrieve-workflow.md](retrieve-workflow.md) for layout and validation.

### 6. Post-retrieve cleanup (required)

```bash
find <package-root> -path '*/objects/*/fields/KQ_*' -name '*.field-meta.xml' -delete
```

Windows: search project for `KQ_*` and delete manually.

Commit to source control.

### 7. Deploy to production

```bash
sf project deploy start \
  --manifest <package-root>/package.xml \
  -o prod
```

Check **Deployment History** in target org.

### 8. Activate

Metadata deploy alone is insufficient:
- Open data kit in production → **Deploy**, or
- Call `sfdatakit__DeployDataKitComponents` (see deploy-components-flow.md)

### 9. Re-authorize connectors

Connection config copies; **credentials do not**. In production:
1. Data Cloud → Connectors
2. Reauthorize inactive connectors
3. Redeploy / re-activate kit if needed

## Sample package.xml structure

Typical DevOps kit manifest includes:

```xml
<types><members>DMO1__dlm</members><name>CustomObject</name></types>
<types><members>AwsS3</members><name>DataKitObjectDependency</name></types>
<types><members>Batch11</members><name>DataKitObjectTemplate</name></types>
<types><members>datakit2</members><name>DataPackageKitDefinition</name></types>
<types><members>datakit2_1732213958278</members><name>DataPackageKitObject</name></types>
<types><members>Bundlets1</members><name>DataSourceBundleDefinition</name></types>
<types><members>datakit2AwsS3_...</members><name>DataSrcDataModelFieldMap</name></types>
<types><members>DLO1_1732213960766</members><name>DataStreamTemplate</name></types>
```

See troubleshooting.md for deploy failure fixes.
