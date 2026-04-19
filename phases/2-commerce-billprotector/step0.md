# Step 0: Knot services

## Task

Implement the Knot API service layer:

- `src/services/knot/auth.ts` — exports `knotAuthHeader()` returning `"Basic base64(clientId:secret)"`
- `src/services/knot/client.ts` — exports `knotFetch(path, init?)` wrapping fetch against `env.KNOT_BASE_URL` with auth header and JSON error handling
- `src/services/knot/transactions.ts` — exports `getTransaction(id: string)` and `syncTransactions()` using knotFetch
- `src/services/knot/shopping.ts` — exports `syncCart(items: CartItem[])` and `checkout(cartId: string)` using knotFetch

Add `CartItem` type to `src/types/domain.ts`.

## AC

- `knotAuthHeader()` returns correct Basic auth string (unit test in `src/services/knot/__tests__/auth.test.ts`)
- All functions typecheck
- No direct `process.env` access — use `env.*`
- Typecheck passes
