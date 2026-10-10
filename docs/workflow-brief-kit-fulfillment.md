# Workflow Brief Kit payment and delivery

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
2. The webhook validates the Stripe signature with the production-only `STRIPE_PRODUCT_WEBHOOK_SECRET`.
3. Only the expected payment link/product, a complete session, `payment_status=paid`, and USD 47.00 are accepted.
4. Confirmed orders are idempotently upserted into `public.revenue_transactions` by unique `stripe_session_id`.
5. The download endpoint independently retrieves the live Checkout Session and its line items from Stripe. A query-string session ID alone never authorizes delivery.
6. The deliverable is streamed as an attachment only after Stripe confirms the paid session and exact product/price. The endpoint then records status `delivered` when the service-role database write is available.

## Required production configuration

- `STRIPE_SECRET_KEY`: existing server-only live Stripe secret used to retrieve the Checkout Session and line items.
- `SUPABASE_SERVICE_ROLE_KEY`: existing server-only service key used for revenue reconciliation.
- `STRIPE_PRODUCT_WEBHOOK_SECRET`: new production-only encrypted Vercel environment variable for the dedicated Stripe endpoint.

Never expose these variables through `NEXT_PUBLIC_*`, browser code, or Git. No live test charge was created. Validate the full flow using Stripe test mode before making any additional changes to the live checkout.
