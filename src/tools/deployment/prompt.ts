/**
 * Tool instructions for deployment tools
 */

export const DEPLOYMENT_TOOLS_PROMPT = `### Deployment Tools

#### sf_validate_deploy
Validates deployment without deploying.

**Parameters:**
- \`source_path\` (string) - Path to deploy
- \`target_org\` (string, optional) - Org username/alias
- \`test_level\` (string, optional) - "NoTestRun" | "RunSpecifiedTests" | "RunLocalTests" | "RunAllTestsInOrg"
- \`tests\` (array, optional) - Test class names

#### sf_deploy_metadata
Deploys metadata to org. Same parameters as sf_validate_deploy.

#### sf_quick_deploy
Quick deploy using validation job ID.

**Parameters:**
- \`job_id\` (string) - Job ID from recent validation
- \`target_org\` (string, optional) - Org username/alias

#### sf_retrieve_metadata
Retrieves metadata from org.

**Parameters:**
- \`source_path\` (string) - Where to save retrieved metadata
- \`target_org\` (string, optional) - Org username/alias`;
