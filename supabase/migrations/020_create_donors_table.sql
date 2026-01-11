-- 020_create_donors_table.sql

create table donors (
  id bigserial primary key,
  name text not null,
  email text,
  phone text,
  address text,
  amount numeric(12,2) not null,
  currency varchar(8) not null default 'INR',
  amount_in_inr bigint not null default 0,
  tx_id text,
  source text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index donors_created_at_idx on donors(created_at desc);
create index donors_tx_id_idx on donors(tx_id);
