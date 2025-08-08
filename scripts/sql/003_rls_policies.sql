-- Activer RLS
alter table public.commerciaux enable row level security;
alter table public.prospects enable row level security;
alter table public.prospect_contracts enable row level security;
alter table public.teleconsultations enable row level security;

-- Politiques simples pour utilisateurs authentifiés (à affiner selon vos rôles/équipes)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'commerciaux' and policyname = 'commerciaux_select_auth'
  ) then
    create policy commerciaux_select_auth on public.commerciaux
      for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'commerciaux' and policyname = 'commerciaux_write_auth'
  ) then
    create policy commerciaux_write_auth on public.commerciaux
      for all to authenticated using (true) with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='prospects' and policyname='prospects_select_auth'
  ) then
    create policy prospects_select_auth on public.prospects
      for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='prospects' and policyname='prospects_write_auth'
  ) then
    create policy prospects_write_auth on public.prospects
      for all to authenticated using (true) with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='prospect_contracts' and policyname='contracts_select_auth'
  ) then
    create policy contracts_select_auth on public.prospect_contracts
      for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='prospect_contracts' and policyname='contracts_write_auth'
  ) then
    create policy contracts_write_auth on public.prospect_contracts
      for all to authenticated using (true) with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='teleconsultations' and policyname='teleco_select_auth'
  ) then
    create policy teleco_select_auth on public.teleconsultations
      for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='teleconsultations' and policyname='teleco_write_auth'
  ) then
    create policy teleco_write_auth on public.teleconsultations
      for all to authenticated using (true) with check (true);
  end if;
end
$$;
