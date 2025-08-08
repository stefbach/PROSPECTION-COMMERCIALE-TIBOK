-- Enable needed extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Basic enums
do $$ begin
  create type secteur_enum as enum ('clinique','ehpad','medecin','hopital','maison-retraite');
exception when duplicate_object then null; end $$;

do $$ begin
  create type region_enum as enum ('ile-de-france','paca','aura','grand-est','occitanie');
exception when duplicate_object then null; end $$;

do $$ begin
  create type statut_enum as enum ('nouveau','qualifie','rdv-planifie','en-negociation','signe');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rdv_priorite as enum ('normale','haute','urgente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type visite_type as enum ('decouverte','presentation','negociation','signature','suivi');
exception when duplicate_object then null; end $$;
