-- Fonction trigger pour updated_at
create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Table commerciaux (équipe commerciale)
create table if not exists public.commerciaux (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null,
  email text,
  phone text,
  region text,
  notes text
);

create trigger set_timestamp_commerciaux
before update on public.commerciaux
for each row execute function public.trigger_set_timestamp();

-- Table prospects (entités cibles)
create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Identité et secteur
  nom_entite text not null,
  secteur secteur_type not null,

  -- Contact
  contact_nom text,
  contact_fonction text,
  telephone text,
  email text,
  site_web text,

  -- Localisation
  adresse text,
  ville text,
  code_postal text,
  region text,

  -- Suivi et qualification
  statut prospect_statut not null default 'nouveau',
  score_interet int default 3 check (score_interet between 1 and 5),
  suivi_statut text default 'a_suivre',
  suivi_score int default 50 check (suivi_score between 0 and 100),

  -- Assignation commerciale
  commercial_id uuid references public.commerciaux(id) on delete set null,

  -- Divers
  metadata jsonb not null default '{}'::jsonb
);

create trigger set_timestamp_prospects
before update on public.prospects
for each row execute function public.trigger_set_timestamp();

-- Table contracts (métadonnées fichiers stockés dans Supabase Storage, bucket recommandé: 'contracts')
create table if not exists public.prospect_contracts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  prospect_id uuid not null references public.prospects(id) on delete cascade,
  file_name text not null,
  file_type text,
  storage_bucket text not null default 'contracts',
  storage_path text not null, -- ex: contracts/{prospect_id}/{uuid}.pdf
  status contract_status not null default 'actif',
  signed_at timestamptz,
  notes text
);

create trigger set_timestamp_prospect_contracts
before update on public.prospect_contracts
for each row execute function public.trigger_set_timestamp();

-- Table des téléconsultations (événements) pour suivi par prospect
create table if not exists public.teleconsultations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  count int not null default 1 check (count > 0),
  source text,
  metadata jsonb not null default '{}'::jsonb
);

-- Index utiles
create index if not exists idx_prospects_nom on public.prospects using gin (to_tsvector('simple', coalesce(nom_entite,'')));
create index if not exists idx_prospects_region on public.prospects(region);
create index if not exists idx_prospects_statut on public.prospects(statut);
create index if not exists idx_prospects_commercial on public.prospects(commercial_id);

create index if not exists idx_teleconsultations_prospect_time on public.teleconsultations(prospect_id, occurred_at desc);
create index if not exists idx_contracts_prospect on public.prospect_contracts(prospect_id);
