CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE TABLE public.tenants (id uuid PRIMARY KEY);
CREATE TABLE public.clientes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, nome text);
CREATE TABLE public.enderecos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cliente_id uuid);
CREATE TABLE public.produtos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid, codigo text);
CREATE TABLE public._precos_stub (desde date, preco numeric);
CREATE FUNCTION public.preco_produto_em(p_tenant uuid, p_cliente uuid, p_produto uuid, p_dia date)
RETURNS TABLE (preco numeric, origem text) LANGUAGE sql STABLE AS $$
  SELECT s.preco, 'especial'::text FROM public._precos_stub s WHERE s.desde <= p_dia ORDER BY s.desde DESC LIMIT 1 $$;
CREATE FUNCTION public.set_atualizado_em() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.atualizado_em := now(); RETURN NEW; END $$;
CREATE SCHEMA supabase_migrations; CREATE TABLE supabase_migrations.schema_migrations (version text PRIMARY KEY, name text);
