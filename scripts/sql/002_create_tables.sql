-- Prospects
create table if not exists prospects (
  id serial primary key,
  nom text not null,
  secteur secteur_enum not null,
  ville text not null,
  statut statut_enum not null default 'nouveau',
  region region_enum not null,
  contact text default '',
  telephone text default '',
  email text default '',
  score int not null default 3 check (score between 1 and 5),
  budget text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function trg_set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists prospects_set_updated on prospects;
create trigger prospects_set_updated
before update on prospects
for each row execute procedure trg_set_updated_at();

-- Unique index for upsert
create unique index if not exists uq_prospects_nom_ville on prospects (lower(nom), lower(ville));

-- Appointments
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  prospect_id int not null references prospects(id) on delete cascade,
  titre text not null,
  commercial text not null,
  date_time timestamptz not null,
  type_visite visite_type not null default 'decouverte',
  priorite rdv_priorite not null default 'normale',
  duree_min int not null default 60,
  notes text default '',
  created_at timestamptz not null default now()
);

-- Contracts metadata (files in storage bucket 'contracts')
create table if not exists contracts (
  id uuid primary key default uuid_generate_v4(),
  prospect_id int not null references prospects(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  fee_mur numeric(12,2),
  uploaded_at timestamptz not null default now()
);

-- Consultation logs (for revenue MUR)
create table if not exists consultation_logs (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid references contracts(id) on delete set null,
  date date not null,
  fee_mur numeric(12,2) not null default 0
);

-- Helpful indexes
create index if not exists idx_appointments_prospect on appointments(prospect_id);
create index if not exists idx_contracts_prospect on contracts(prospect_id);
create index if not exists idx_consultations_date on consultation_logs(date);
