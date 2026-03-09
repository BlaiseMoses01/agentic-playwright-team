---
name: api-exploration
description: guide for exploring REST and GraphQL APIs, intercepting network requests, and building typed request helpers
---

# Skill: API Exploration

## When to use

Use this skill when the user asks you to:

- Explore or document a REST or GraphQL API
- Intercept and inspect network requests during browser exploration
- Read and parse OpenAPI/Swagger specifications
- Test API endpoints manually with curl or fetch
- Build typed request builders or API helpers for test support code
- Set up API-level test data seeding or teardown

## Intercepting Network Requests with Agent-Browser

Use agent-browser to observe what API calls the application makes during user flows.

### Capture network activity

```bash
agent-browser open <url>
agent-browser wait --load networkidle

# Perform an action and watch network requests
agent-browser click @e5
agent-browser wait --load networkidle

# Get network log
agent-browser eval "JSON.stringify(performance.getEntriesByType('resource').filter(r => r.initiatorType === 'fetch' || r.initiatorType === 'xmlhttprequest').map(r => ({url: r.name, duration: r.duration})))"
```

### Intercept with Playwright in tests

In Cucumber step definitions, use Playwright's route interception:

```typescript
// Listen to API calls
const requests: { url: string; method: string; body: any }[] = [];
await this.page.route("**/api/**", async (route) => {
  requests.push({
    url: route.request().url(),
    method: route.request().method(),
    body: route.request().postDataJSON(),
  });
  await route.continue();
});

// Perform the action
await this.page.click('button[type="submit"]');

// Inspect captured requests
console.log(requests);
```

### Mock API responses

```typescript
await this.page.route("**/api/users", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ users: [{ id: 1, name: "Test User" }] }),
  });
});
```

## Reading OpenAPI/Swagger Specs

If the application exposes an OpenAPI spec:

```bash
# Common spec locations
curl -s ${TARGET}/api-docs | jq '.'
curl -s ${TARGET}/swagger.json | jq '.'
curl -s ${TARGET}/openapi.json | jq '.'
curl -s ${TARGET}/v3/api-docs | jq '.'
```

### Extract key information

```bash
# List all endpoints
curl -s ${TARGET}/swagger.json | jq '.paths | keys[]'

# Get details for a specific endpoint
curl -s ${TARGET}/swagger.json | jq '.paths["/api/users"]'

# List all schemas/models
curl -s ${TARGET}/swagger.json | jq '.components.schemas // .definitions | keys[]'
```

## Testing Endpoints with curl

### REST endpoints

```bash
# GET
curl -s -H "Authorization: Bearer $TOKEN" ${TARGET}/api/users | jq '.'

# POST
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Test", "email": "test@example.com"}' \
  ${TARGET}/api/users | jq '.'

# PUT
curl -s -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Updated"}' \
  ${TARGET}/api/users/123 | jq '.'

# DELETE
curl -s -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  ${TARGET}/api/users/123
```

### GraphQL endpoints

```bash
# Query
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "{ users { id name email } }"}' \
  ${TARGET}/graphql | jq '.'

# Mutation
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "mutation { createUser(input: {name: \"Test\"}) { id } }"}' \
  ${TARGET}/graphql | jq '.'

# Introspection (discover schema)
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name fields { name type { name } } } } }"}' \
  ${TARGET}/graphql | jq '.'
```

## Authentication Handling

### Bearer token (JWT)

```bash
# Login to get a token
TOKEN=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_USER_ADMIN_EMAIL\", \"password\": \"$TEST_USER_ADMIN_PASSWORD\"}" \
  ${TARGET}/api/auth/login | jq -r '.token // .access_token // .jwt')

# Use token in subsequent requests
curl -s -H "Authorization: Bearer $TOKEN" ${TARGET}/api/protected-resource
```

### Cookie-based auth

```bash
# Login and save cookies
curl -s -X POST -c cookies.txt \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_USER_ADMIN_EMAIL\", \"password\": \"$TEST_USER_ADMIN_PASSWORD\"}" \
  ${TARGET}/api/auth/login

# Use saved cookies
curl -s -b cookies.txt ${TARGET}/api/protected-resource
```

### API key

```bash
curl -s -H "X-API-Key: $API_KEY" ${TARGET}/api/resource
# or as query parameter
curl -s "${TARGET}/api/resource?api_key=$API_KEY"
```

## Documenting Request/Response Schemas

After exploring endpoints, document them in a structured format:

```markdown
## POST /api/users

**Description**: Create a new user
**Auth**: Bearer token required (admin role)

### Request

| Field | Type   | Required | Description                                |
| ----- | ------ | -------- | ------------------------------------------ |
| name  | string | yes      | User's full name                           |
| email | string | yes      | Valid email address                        |
| role  | string | no       | One of: admin, user, viewer. Default: user |

### Response (201)

| Field     | Type   | Description        |
| --------- | ------ | ------------------ |
| id        | number | Auto-generated ID  |
| name      | string | User's name        |
| email     | string | User's email       |
| createdAt | string | ISO 8601 timestamp |

### Error Responses

| Status | Condition                                |
| ------ | ---------------------------------------- |
| 400    | Missing required fields or invalid email |
| 401    | No auth token or expired token           |
| 403    | Insufficient role permissions            |
| 409    | Email already exists                     |
```

## Building Typed Request Builders

Create reusable API helpers in `support/api/`:

```typescript
// support/api/client.ts
import type { APIRequestContext } from "@playwright/test";

export class ApiClient {
  constructor(
    private request: APIRequestContext,
    private baseUrl: string,
    private token?: string,
  ) {}

  private headers() {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    return h;
  }

  async get<T>(path: string): Promise<T> {
    const res = await this.request.get(`${this.baseUrl}${path}`, {
      headers: this.headers(),
    });
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    const res = await this.request.post(`${this.baseUrl}${path}`, {
      headers: this.headers(),
      data,
    });
    return res.json() as Promise<T>;
  }

  async delete(path: string): Promise<void> {
    await this.request.delete(`${this.baseUrl}${path}`, {
      headers: this.headers(),
    });
  }
}
```

### Usage in Cucumber hooks for data setup

```typescript
import { Before, After } from "@cucumber/cucumber";
import { request } from "@playwright/test";
import { ApiClient } from "./api/client.js";

Before({ tags: "@needs-user" }, async function () {
  const ctx = await request.newContext();
  const api = new ApiClient(ctx, process.env.TARGET!, process.env.API_TOKEN);
  this.testUser = await api.post("/api/users", {
    name: "Test User",
    email: `test-${Date.now()}@example.com`,
  });
});

After({ tags: "@needs-user" }, async function () {
  // Clean up created data
  const ctx = await request.newContext();
  const api = new ApiClient(ctx, process.env.TARGET!, process.env.API_TOKEN);
  await api.delete(`/api/users/${this.testUser.id}`);
});
```

## Tips

- Start exploration by intercepting network requests during a browser flow — this shows you exactly which endpoints the app uses and in what order.
- Always check for OpenAPI/Swagger docs before manually exploring — they give you the complete picture faster.
- Use Playwright's `request` context for API calls in tests rather than `fetch` or `axios` — it integrates with Playwright's tracing and reporting.
- Save response examples as fixtures in `support/fixtures/` for use in mocked tests.
- When building API helpers, keep them in `support/api/` and import them in step definitions — don't put API logic directly in steps.
- Use environment variables from `.env` for all URLs, tokens, and credentials — never hardcode them.
