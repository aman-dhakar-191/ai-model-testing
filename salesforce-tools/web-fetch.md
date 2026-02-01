# Web Fetch Tool

## Overview
Fetch content from web URLs. Useful for reading external documentation, calling APIs, or retrieving data from external resources.

## Tool Name
`web_fetch`

## Parameters

### Required
- **url** (string): The URL to fetch (must be http or https)
  - Example: `https://api.example.com/data`

### Optional
- **method** (enum): HTTP method to use
  - Options: `GET`, `POST`, `PUT`, `DELETE`
  - Default: `GET`

- **headers** (object): HTTP headers as key-value pairs
  - Example: `{"Authorization": "Bearer token123", "Content-Type": "application/json"}`

- **body** (string): Request body for POST/PUT requests
  - Example: `{"name": "value"}`

## Return Values

Success:
```json
{
  "status": "success",
  "message": "Fetched https://api.example.com/data",
  "url": "https://api.example.com/data",
  "status_code": 200,
  "headers": {
    "content-type": "application/json",
    "content-length": "1234"
  },
  "body": "response content here (max 10KB shown)",
  "body_length": 1234
}
```

Error:
```json
{
  "status": "error",
  "message": "Connection refused",
  "url": "https://invalid-domain.example"
}
```

## Common Use Cases

### 1. Read Documentation
```json
{
  "url": "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/"
}
```

### 2. Check API Endpoint
```json
{
  "url": "https://api.github.com/repos/salesforce/lwc"
}
```

### 3. Fetch JSON Data
```json
{
  "url": "https://api.example.com/salesforce/metadata",
  "method": "GET",
  "headers": {
    "Accept": "application/json"
  }
}
```

### 4. POST Request with Authentication
```json
{
  "url": "https://api.example.com/data",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer your-token-here",
    "Content-Type": "application/json"
  },
  "body": "{\"key\": \"value\"}"
}
```

### 5. Fetch External Config
```json
{
  "url": "https://example.com/config.json"
}
```

## Best Practices

1. **Documentation Research**: Fetch Salesforce docs, library docs, or API specifications
2. **API Integration**: Test external APIs before implementing in Apex
3. **Configuration**: Pull external config or metadata
4. **Validation**: Verify URLs and endpoints before generating integration code
5. **Size Limit**: Response body is limited to 10KB to prevent memory issues

## Security Notes

- Only http and https protocols are supported
- Response body is truncated at 10KB for display
- Full body length is reported in `body_length`
- Useful for reading public documentation and APIs

## Examples in Context

### Scenario: Researching Salesforce API
```json
// 1. Check Salesforce REST API docs
{
  "url": "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/"
}

// 2. Verify API version
{
  "url": "https://login.salesforce.com/services/data"
}
```

### Scenario: External Integration
```json
// 1. Test external API endpoint
{
  "url": "https://api.example.com/health",
  "method": "GET"
}

// 2. Verify authentication works
{
  "url": "https://api.example.com/auth",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "{\"username\": \"test\", \"password\": \"test\"}"
}
```

## Response Headers

The `headers` object in the response contains useful information:
- `content-type`: MIME type of the response
- `content-length`: Size of the response
- `server`: Server software
- Plus any custom headers returned by the API

## Limitations

- Response body truncated at 10KB for display (full length reported)
- 60-second timeout on requests
- Follows redirects automatically
- No cookie persistence between requests
