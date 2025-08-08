-- Enable RLS if you use auth; adjust as needed.
alter table prospects enable row level security;
alter table appointments enable row level security;
alter table contracts enable row level security;
alter table consultation_logs enable row level security;

-- Simple permissive policies for demo (adjust for production)
do $$ begin
  create policy "read_all_prospects" on prospects for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "write_all_prospects" on prospects for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "update_all_prospects" on prospects for update using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "delete_all_prospects" on prospects for delete using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "read_all_appointments" on appointments for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "write_all_appointments" on appointments for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "read_all_contracts" on contracts for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "write_all_contracts" on contracts for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "delete_all_contracts" on contracts for delete using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "read_all_consultations" on consultation_logs for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "write_all_consultations" on consultation_logs for insert with check (true);
exception when duplicate_object then null; end $$;
