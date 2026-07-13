---
name: Importing an external same-template repo
description: Workflow for porting a full app from a GitHub repo built on the same pnpm-workspace/artifact template into this project.
---

When a user asks to import/fetch an external repo that turns out to be built on
the same monorepo template (pnpm workspace, `artifact.toml`, OpenAPI-first
API-server, Expo scaffold, etc.):

- Clone into `/tmp` (outside the workspace) with an authenticated HTTPS URL
  built from the `GITHUB_PERSONAL_ACCESS_TOKEN` secret — never print/log the
  token or the URL containing it.
- Create the destination artifact first via the normal artifact scaffolding
  flow (createArtifact) so all boilerplate (babel/metro/tsconfig, build/serve
  scripts, ErrorBoundary, etc.) is regenerated fresh and matches the current
  template version.
- Before overwriting anything, `diff` each scaffold file against the fetched
  repo's equivalent. In practice, template boilerplate (package.json, tsconfig,
  babel/metro config, ErrorBoundary/ErrorFallback/KeyboardAwareScrollViewCompat,
  build/serve scripts) is usually byte-identical — skip those and only copy
  files that actually differ (app screens, schema, routes, business logic).
- Port in this order: OpenAPI spec → run codegen → DB schema → backend
  routes/lib → frontend screens/context — since frontend code depends on
  generated API client types.
- Run a full typecheck after copying; template-generated hooks/utilities can
  surface latent type errors that didn't matter in the source repo's own
  tsconfig strictness settings.
