# Setup checklist

This is a real launch checklist for the Elevated AI SaaS. It does not require sharing API keys in chat; keep them only in your local `.env.local` file and the encrypted environment-variable settings of your deployment host.

Elevated AI is a product of Elevated Associates LLC.

## Accounts

Create projects or accounts with:

- [Supabase](https://supabase.com) for authentication and metered customer profiles.
- [OpenRouter](https://openrouter.ai) for AI model access.
- [Stripe](https://stripe.com) for subscriptions.
- [Vercel](https://vercel.com) for hosting.

## Local configuration

1. Copy `.env.example` to `.env.local`.
2. Add your Supabase project URL and **anon** key to the two `NEXT_PUBLIC_SUPABASE_*` values.
3. Add your OpenRouter, Stripe secret, Stripe price, Stripe webhook, and Supabase service-role values. These must remain server-only; do not prefix them with `NEXT_PUBLIC_`.
4. Run the SQL in `supabase/schema.sql` once in the Supabase SQL Editor.
5. Configure Supabase passwordless email authentication and add the local and production URLs as valid redirect URLs.
6. Run `npm install && npm run dev`.

## Subscription configuration

Create one recurring monthly Stripe Price and set `STRIPE_PRICE_ID` to its ID. Add the production webhook endpoint:

```text
https://your-domain.com/api/billing/webhook
```

Select the `checkout.session.completed` event and copy that endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`.

## Before accepting customers

- Use Stripe test keys and test checkout before switching to live keys.
- Set a custom domain, update `NEXT_PUBLIC_APP_URL`, then mirror the URL in Supabase and Stripe.
- Configure transactional email delivery in Supabase so magic links reach customers reliably.
- Publish a privacy policy, terms of service, refund policy, and support contact appropriate to your jurisdiction.
