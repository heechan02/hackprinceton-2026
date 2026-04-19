# Step 1: Env accessor

## Task

Implement `src/lib/env.ts` that parses `process.env` through a Zod schema and exports a typed `env` object. Throw at import time if required vars are missing in server context. Client-safe vars (NEXT*PUBLIC*\*) go through a separate `clientEnv` export.

## AC

- Importing `env` with a missing required var throws a clear error listing the missing key
- Types are strict (no `z.any()`)
- Test in `src/lib/__tests__/env.test.ts` verifies missing-key error and happy path
