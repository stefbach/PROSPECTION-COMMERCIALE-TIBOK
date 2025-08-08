-- Add pricing fields to contracts for Mauritian Rupees (MUR)
alter table public.prospect_contracts
  add column if not exists currency text not null default 'MUR',
  add column if not exists fee_per_consultation_mur numeric(12,2) not null default 0;

-- Revenue per contract based on teleconsultations since the contract start (signed_at)
create or replace view public.prospect_contract_revenue_mur as
select
  c.id as contract_id,
  c.prospect_id,
  c.status,
  c.currency,
  c.fee_per_consultation_mur,
  c.signed_at,
  coalesce(sum(t.count), 0) as consultations_count,
  (coalesce(sum(t.count), 0) * coalesce(c.fee_per_consultation_mur, 0))::numeric(18,2) as revenue_mur
from public.prospect_contracts c
left join public.teleconsultations t
  on t.prospect_id = c.prospect_id
  and (c.signed_at is null or t.occurred_at >= c.signed_at)
group by c.id;

-- Optional: simple view for total revenue across active contracts
create or replace view public.total_revenue_mur as
select
  coalesce(sum(case when status = 'actif' then revenue_mur else 0 end), 0)::numeric(18,2) as total_mur
from public.prospect_contract_revenue_mur;

-- RLS note: views inherit RLS of base tables. Current policies allow authenticated read; admin client bypasses RLS.
