---
name: Orval mutation hooks with no request body
description: Type error when calling a generated mutation hook for an OpenAPI operation with no requestBody.
---

When an OpenAPI operation has no `requestBody`, Orval generates the React
Query mutation hook's `mutate` variables type as `void`. Calling
`someMutation.mutate({})` fails typecheck (`{}` is not assignable to `void`).
Call `someMutation.mutate()` with no argument instead.

**Why:** Discovered porting mining start/claim endpoints (no request body) —
Orval infers `void` variables, not an empty object, when the schema declares
no body.

**How to apply:** Any time you add/port a mutation hook for a bodyless
endpoint, check the generated hook's variables type before wiring up the
`.mutate()` call.
