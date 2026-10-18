-- Additive: separate Basilisk tables, membership and private bucket; GridSwitch is unchanged.
create table if not exists public.basilisk_tenants(id uuid primary key default gen_random_uuid(), name text not null);
create table if not exists public.basilisk_memberships(tenant_id uuid references public.basilisk_tenants(id),user_id uuid references auth.users(id),primary key(tenant_id,user_id));
create or replace function public.basilisk_member(t uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.basilisk_memberships where tenant_id=t and user_id=auth.uid()); $$;
revoke all on function public.basilisk_member(uuid) from public;
grant execute on function public.basilisk_member(uuid) to authenticated;
create table if not exists public.basilisk_facilities(
 id text primary key,tenant_id uuid not null references public.basilisk_tenants(id),site_key text not null,
 payload jsonb not null,version integer not null default 1,updated_at timestamptz not null default now(),unique(tenant_id,site_key)
);
create table if not exists public.basilisk_jobs(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.basilisk_tenants(id),
 kind text not null check(kind in ('discovery','research')),status text not null default 'queued' check(status in ('queued','running','complete','failed')),
 config jsonb not null,checkpoint integer not null default 0,imported integer not null default 0,attempts integer not null default 0,
 diagnostics text not null default '',lease_until timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists basilisk_jobs_queue on public.basilisk_jobs(tenant_id,status,created_at);
create table if not exists public.basilisk_research(
 tenant_id uuid not null references public.basilisk_tenants(id),facility_id text not null references public.basilisk_facilities(id),
 result jsonb not null,model text not null,created_at timestamptz not null default now(),primary key(tenant_id,facility_id)
);
create table if not exists public.basilisk_documents(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.basilisk_tenants(id),facility_id text not null references public.basilisk_facilities(id),
 storage_path text not null unique,original_name text not null,kind text not null,uploaded_by uuid not null references auth.users(id),authorized_at timestamptz not null,created_at timestamptz not null default now()
);
create table if not exists public.basilisk_audit(
 id bigint generated always as identity primary key,tenant_id uuid not null,actor uuid,action text not null,record_id text,created_at timestamptz not null default now()
);
alter table public.basilisk_tenants enable row level security;
alter table public.basilisk_memberships enable row level security;
alter table public.basilisk_facilities enable row level security;
alter table public.basilisk_jobs enable row level security;
alter table public.basilisk_research enable row level security;
alter table public.basilisk_documents enable row level security;
alter table public.basilisk_audit enable row level security;
create policy basilisk_tenant_read on public.basilisk_tenants for select to authenticated using(public.basilisk_member(id));
create policy basilisk_membership_read on public.basilisk_memberships for select to authenticated using(user_id=auth.uid());
create policy basilisk_facility_access on public.basilisk_facilities for all to authenticated using(public.basilisk_member(tenant_id)) with check(public.basilisk_member(tenant_id));
create policy basilisk_job_access on public.basilisk_jobs for all to authenticated using(public.basilisk_member(tenant_id)) with check(public.basilisk_member(tenant_id));
create policy basilisk_research_access on public.basilisk_research for all to authenticated using(public.basilisk_member(tenant_id)) with check(public.basilisk_member(tenant_id));
create policy basilisk_document_access on public.basilisk_documents for all to authenticated using(public.basilisk_member(tenant_id)) with check(public.basilisk_member(tenant_id));
create policy basilisk_audit_read on public.basilisk_audit for select to authenticated using(public.basilisk_member(tenant_id));
-- Audit changes transactionally; provenance values stay in the versioned facility payload.
create or replace function public.basilisk_audit_change() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.basilisk_audit(tenant_id,actor,action,record_id) values(new.tenant_id,auth.uid(),TG_TABLE_NAME||':'||TG_OP,new.id::text); return new; end $$;
create trigger basilisk_facility_audit after insert or update on public.basilisk_facilities for each row execute function public.basilisk_audit_change();
create trigger basilisk_job_audit after insert or update on public.basilisk_jobs for each row execute function public.basilisk_audit_change();
create trigger basilisk_document_audit after insert or update on public.basilisk_documents for each row execute function public.basilisk_audit_change();
-- Queue claims are atomic, short-lived and recoverable after a worker timeout.
create or replace function public.basilisk_claim_job(job_id uuid) returns setof public.basilisk_jobs language sql security invoker as $$
 update public.basilisk_jobs set status='running',lease_until=now()+interval '2 minutes',updated_at=now()
 where id=job_id and (status='queued' or (status='running' and lease_until<now())) returning *;
$$;
revoke all on function public.basilisk_claim_job(uuid) from public;
grant execute on function public.basilisk_claim_job(uuid) to authenticated,service_role;
create or replace function public.basilisk_enqueue_job(workspace uuid,job_kind text,job_config jsonb) returns setof public.basilisk_jobs language plpgsql security invoker as $$
begin
 if not public.basilisk_member(workspace) then raise exception 'Unauthorized'; end if;
 if job_kind not in ('research','discovery') then raise exception 'Invalid job kind'; end if;
 perform pg_advisory_xact_lock(hashtext(workspace::text||job_kind));
 if (select count(*) from public.basilisk_jobs where tenant_id=workspace and kind=job_kind and created_at>now()-interval '24 hours') >= (case when job_kind='research' then 5 else 10 end) then return; end if;
 return query insert into public.basilisk_jobs(tenant_id,kind,config) values(workspace,job_kind,job_config) returning *;
end $$;
revoke all on function public.basilisk_enqueue_job(uuid,text,jsonb) from public;
grant execute on function public.basilisk_enqueue_job(uuid,text,jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('basilisk-confidential','basilisk-confidential',false,5242880,array['application/pdf','text/csv','image/jpeg','image/png']) on conflict(id) do nothing;
create policy basilisk_private_objects on storage.objects for all to authenticated
 using(bucket_id='basilisk-confidential' and public.basilisk_member(((storage.foldername(name))[1])::uuid))
 with check(bucket_id='basilisk-confidential' and public.basilisk_member(((storage.foldername(name))[1])::uuid));
grant select on public.basilisk_tenants,public.basilisk_memberships,public.basilisk_audit to authenticated;
grant select,insert,update,delete on public.basilisk_facilities,public.basilisk_jobs,public.basilisk_research,public.basilisk_documents to authenticated;
