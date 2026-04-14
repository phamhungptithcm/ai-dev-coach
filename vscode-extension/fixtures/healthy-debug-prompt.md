Role:
Software Engineer

Level:
Senior

Task:
Debug why `POST /orders` returns HTTP 500 in `src/orders/service.ts` after a customer submits checkout.

Context:
The service is a Node.js 20 Express API with PostgreSQL. The failure happens in production-like staging, and the exact error is `TypeError: Cannot read properties of null (reading 'id')` in `src/orders/service.ts:118`. Expected behavior is HTTP 201 with a persisted order row. The request payload already passed schema validation.

What I Tried:
I replayed the request with the staging payload, added logs around the customer lookup, and confirmed the crash happens after `findCustomerByEmail` returns `null`. I also checked the migration history and saw a recent data backfill changed the customer import job.

Constraints:
Keep the public API contract unchanged and avoid broad refactors because the team needs a safe patch today.

Acceptance Criteria:
Identify the root cause, propose the safest fix, and explain how to verify the regression is covered with a test.
