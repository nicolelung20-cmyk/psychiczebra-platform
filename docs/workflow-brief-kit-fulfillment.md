# Workflow Brief Kit payment and delivery

## Environment isolation

- Preview and local deployments default to Stripe test mode. Configure `STRIPE_SECRET_KEY_TEST`, `STRIPE_WEBHOOK_SECRET_TEST`, and the test product webhook secret independently.
- Production defaults to live mode. It uses only the existing live variables and the separately created live product-webhook signing secret.
- A test-mode checkout requires test-specific product, price, and payment-link IDs. The application intentionally fails closed rather than falling back to live identifiers or credentials.
- Stripe event `livemode` and Checkout Session `livemode` must match the deployment mode.
- Delivery requires a successful server-only `revenue_transactions` write before the download response is released.

## Production contract

- Product: Elevat Workflow Brief Kit
- Price: USD 47.00 one-time
- Stripe Payment Link: `plink_1UGfrw0t6SDBlU8gNn6N5MwR`
- Stripe Product: `prod_VHEKO9lALM6JKQ`
- Stripe Price: `price_1UGfrm0t6SDBlU8genTsVpTP`
- Checkout completion redirects to `/delivery?session_id={CHECKOUT_SESSION_ID}`.
- The delivery endpoint is `GET /api/delivery/workflow-brief-kit?session_id=...`.

## Confirmation and fulfillment

1. Stripe sends `checkout.session.completed` or `checkout.session.async_payment_succeeded` to `/api/billing/product-webhook`.
2. The webhook validates the Stripe signature with the mode-specific `STRIPE_PRODUCT_WEBHOOK_SECRET` (live) or `STRIPE_PRODUCT_WEBHOOK_SECRET_TEST` (test).
3. Only the expected payment link/product, a complete session, `payment_status=paid`, and USD 47.00 are accepted.
4. Confirmed orders are idempotently upserted into `public.revenue_transactions` by unique `stripe_session_id`.
5. The download endpoint independently retrieves the Checkout Session using the matching test/live secret and its line items from Stripe. A query-string session ID alone never authorizes delivery.
6. The deliverable is streamed as an attachment only after Stripe confirms the paid session and exact product/price. The endpoint then records status `delivered` when the service-role database write is available.

## Required production configuration

- `STRIPE_SECRET_KEY`: existing server-only live Stripe secret used to retrieve the Checkout Session and line items.
- `SUPABASE_SERVICE_ROLE_KEY`: existing server-only service key used for revenue reconciliation.
- `STRIPE_PRODUCT_WEBHOOK_SECRET`: encrypted Vercel environment variable for the dedicated live Stripe endpoint.
- Preview-only test configuration: `STRIPE_SECRET_KEY_TEST`, `STRIPE_WEBHOOK_SECRET_TEST`, `STRIPE_PRODUCT_WEBHOOK_SECRET_TEST`, `STRIPE_WORKFLOW_BRIEF_KIT_PAYMENT_LINK_ID_TEST`, and `STRIPE_WORKFLOW_BRIEF_KIT_PRODUCT_ID_TEST`.

Never expose these variables through `NEXT_PUBLIC_*`, browser code, or Git. No live test charge was created. Validate the full flow using Stripe test mode before making any additional changes to the live checkout.
