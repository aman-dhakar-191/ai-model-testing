/**
 * Tool instruction for create_lwc_component
 */

export const CREATE_LWC_COMPONENT_PROMPT = `### create_lwc_component
Creates a Lightning Web Component bundle.

**When to use:** Creating new LWC

**Parameters:**
- \`name\` (string) - kebab-case name (e.g., "account-card")
- \`html\` (string) - HTML template
- \`javascript\` (string) - JavaScript controller
- \`css\` (string, optional) - CSS styles
- \`meta_xml\` (string) - js-meta.xml configuration
- \`is_create_apex_controller\` (boolean, optional) - Create Apex controller
- \`apex_controller_name\` (string, optional) - Apex controller class name
- \`apex_controller_body\` (string, optional) - Apex controller code

**Example:**
\`\`\`xml
<tool_call>
<tool_name>create_lwc_component</tool_name>
<name>accountCard</name>
<html><template>
    <lightning-card title="Account Details">
        <p>{accountName}</p>
    </lightning-card>
</template></html>
<javascript>import { LightningElement, api } from 'lwc';

export default class AccountCard extends LightningElement {
    @api accountName;
}</javascript>
<meta_xml><?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>60.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__AppPage</target>
    </targets>
</LightningComponentBundle></meta_xml>
</tool_call>
\`\`\``;
