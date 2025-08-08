-- Vue d'agrégat : total de téléconsultations par prospect
create or replace view public.prospect_teleconsultation_counts as
select
  p.id as prospect_id,
  p.nom_entite,
  coalesce(sum(t.count), 0) as total_teleconsultations
from public.prospects p
left join public.teleconsultations t on t.prospect_id = p.id
group by p.id, p.nom_entite;

-- Index sur la vue matérialisée si vous décidez d'en faire une (optionnel)
-- create materialized view public.prospect_teleconsultation_counts_mv as
-- select * from public.prospect_teleconsultation_counts;
-- create unique index on public.prospect_teleconsultation_counts_mv (prospect_id);
-- refresh materialized view public.prospect_teleconsultation_counts_mv;

-- Helper: fonction pour incrémenter le compteur de téléconsultations d'un prospect
create or replace function public.log_teleconsultation(_prospect_id uuid, _count int default 1, _source text default null, _metadata jsonb default '{}'::jsonb)
returns void language sql as $$
  insert into public.teleconsultations (prospect_id, count, source, metadata)
  values (_prospect_id, greatest(_count,1), _source, coalesce(_metadata, '{}'::jsonb));
$$;
