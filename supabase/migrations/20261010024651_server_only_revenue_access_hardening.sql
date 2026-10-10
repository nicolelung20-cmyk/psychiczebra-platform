-- Revenue/customer records are server-only. The Stripe webhook uses the service_role client.
-- Explicit restrictive policies keep client roles denied even if a permissive policy is added later.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['customers','subscriptions','revenue_events','fulfillment_jobs']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS server_only_deny_client_access ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY server_only_deny_client_access ON public.%I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      t
    );
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO service_role', t);
  END LOOP;
END $$;

-- Revenue catalog remains readable to signed-in users; client writes are not needed.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.revenue_products FROM anon, authenticated;
GRANT SELECT ON TABLE public.revenue_products TO authenticated;
