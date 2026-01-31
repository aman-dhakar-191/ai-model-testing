# Lightning Web Components (LWC) Standards

## Component Structure
Every LWC should follow this file structure:
```
myComponent/
  myComponent.html
  myComponent.js
  myComponent.css (optional)
  myComponent.js-meta.xml
  __tests__/
    myComponent.test.js (optional)
```

## Naming Conventions
- Component folder and files: camelCase (`contactList`, `accountCard`)
- HTML references in parent: kebab-case (`<c-contact-list>`)
- Public properties: camelCase with `@api` decorator
- Private reactive: camelCase with no decorator (tracked by default)

## JavaScript Best Practices

### Use Decorators Correctly
```javascript
import { LightningElement, api, wire } from 'lwc';

export default class AccountCard extends LightningElement {
    @api recordId;           // Public property from parent
    accountData;             // Private reactive
    _internalState = false;  // Private non-reactive (underscore prefix)
}
```

### Wire Service for Data
```javascript
import { wire } from 'lwc';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';

export default class AccountList extends LightningElement {
    @wire(getAccounts)
    wiredAccounts({ data, error }) {
        if (data) this.accounts = data;
        if (error) this.handleError(error);
    }
}
```

### Imperative Apex Calls
```javascript
import getAccount from '@salesforce/apex/AccountController.getAccount';

async handleLoad() {
    try {
        this.account = await getAccount({ accountId: this.recordId });
    } catch (error) {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error', message: error.body.message, variant: 'error'
        }));
    }
}
```

## HTML Template Rules
- Use `if:true` / `if:false` for conditional rendering (or `lwc:if` in newer API versions)
- Use `for:each` with `key` directive for list rendering
- Use `lightning-*` base components when available
- Keep templates declarative — avoid complex logic in HTML

```html
<template>
    <lightning-card title="Contacts">
        <template for:each={contacts} for:item="contact">
            <div key={contact.Id} class="slds-p-around_small">
                <p>{contact.Name}</p>
            </div>
        </template>
        <template if:true={isEmpty}>
            <p class="slds-text-body_regular">No contacts found.</p>
        </template>
    </lightning-card>
</template>
```

## CSS Styling
- Use SLDS (Salesforce Lightning Design System) classes
- Scope custom CSS within the component — LWC Shadow DOM handles isolation
- Avoid `!important`
- Use CSS custom properties for theming

## Meta XML Configuration
```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__RecordPage</target>
        <target>lightning__AppPage</target>
        <target>lightning__HomePage</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightning__RecordPage">
            <objects>
                <object>Account</object>
            </objects>
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
```

## Error Handling
- Always handle errors in wire and imperative calls
- Use `lightning/platformShowToastEvent` for user-facing errors
- Log technical errors for debugging

## Performance
- Minimize wire calls — cache data when possible
- Use `@wire` over imperative for reactive data
- Lazy-load components with dynamic imports when appropriate
- Debounce search inputs
