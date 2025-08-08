-- Extensions utiles
create extension if not exists pgcrypto;

-- Types énumérés
do $$
begin
  if not exists (select 1 from pg_type where typname = 'secteur_type') then
    create type secteur_type as enum ('clinique','ehpad','medecin','hopital','maison_retraite');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'prospect_statut') then
    create type prospect_statut as enum ('nouveau','qualifie','rdv_planifie','en_negociation','signe');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'contract_status') then
    create type contract_status as enum ('brouillon','actif','resilie','expire');
  end if;
end
$$;
