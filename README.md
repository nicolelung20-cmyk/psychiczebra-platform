# Elevated AI

Elevated AI is a premium AI workspace for ambitious leaders and growth teams. Built with Next.js, Supabase, OpenRouter, and Stripe, it includes passwordless sign-in, server-side message quotas, Stripe Checkout, and a verified webhook that upgrades customers to Pro.

Elevated AI is a product of Elevated Associates LLC.

## Launch locally

1. Install Node.js 20 or later and run `npm install`.
2. Copy `.env.example` to `.env.local`, then fill in the values from Supabase, OpenRouter, and Stripe. Never commit this file.
3. In Supabase, open the SQL Editor and run `supabase/schema.sql`.
4. In **Authentication > URL Configuration**, set the Site URL to `http://localhost:3000` and add `http://localhost:3000` to Redirect URLs.
5. Create a recurring monthly Stripe product, copy its Price ID into `STRIPE_PRICE_ID`, then run `npm run dev`.

Open [http://localhost:3000](http://localhost:3000), sign in through the emailed magic link, and send a message.

## Configure payments

Create a Stripe webhook endpoint at:

```text
https://your-domain.com/api/billing/webhook
```

Subscribe to `checkout.session.completed`, then put the endpoint signing secret in `STRIPE_WEBHOOK_SECRET`. The webhook verifies Stripe's signature before setting the authenticated customer profile to the `pro` plan.

Free accounts receive 20 messages and Pro accounts receive 500 messages. Quotas are enforced inside a Supabase database function, rather than trusted to the browser.

## Deploy to Vercel

1. Push this repository to GitHub and import it into Vercel.
2. Add every value from `.env.example` in the Vercel project environment settings.
3. Set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS URL.
4. Update the Supabase Site URL and redirect URLs, plus the Stripe webhook URL, to that domain.

## Commands

```bash
npm run dev       # Start local development
npm run typecheck # Check TypeScript
npm run build     # Create production build
```

## Approval-first support drafts

The included SupportFlow AI service creates support-reply drafts that require
human review before sending. Start it with `npm run supportflow`; see
[`docs/OPERATIONS.md`](docs/OPERATIONS.md) for its API, pilot safeguards, and
separate deployment requirements.
