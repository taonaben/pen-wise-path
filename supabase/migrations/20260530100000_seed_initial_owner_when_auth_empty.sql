-- Seed a first owner user + farm + farm membership only when auth.users is empty.
-- This migration is intentionally guarded so it does nothing once users already exist.

do $$
declare
  v_user_count bigint;
  v_owner_id uuid;
  v_farm_id uuid;
  v_now timestamptz := now();
  v_owner_email text := 'owner@example.com';
  v_owner_password text := 'ChangeMe123!';
  v_owner_name text := 'Default Owner';
  v_farm_name text := 'Default Farm';
begin
  select count(*) into v_user_count from auth.users;

  if v_user_count > 0 then
    raise notice 'Skipping seed migration: auth.users already has % record(s).', v_user_count;
    return;
  end if;

  v_owner_id := gen_random_uuid();
  v_farm_id := gen_random_uuid();

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_owner_id,
    'authenticated',
    'authenticated',
    v_owner_email,
    crypt(v_owner_password, gen_salt('bf')),
    v_now,
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', v_owner_name),
    v_now,
    v_now,
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    provider,
    provider_id,
    identity_data,
    created_at,
    updated_at,
    last_sign_in_at
  )
  values (
    gen_random_uuid(),
    v_owner_id,
    'email',
    v_owner_email,
    jsonb_build_object(
      'sub', v_owner_id::text,
      'email', v_owner_email,
      'email_verified', true
    ),
    v_now,
    v_now,
    v_now
  );

  insert into public.profiles (
    id,
    full_name,
    email,
    created_at,
    updated_at
  )
  values (
    v_owner_id,
    v_owner_name,
    v_owner_email,
    v_now,
    v_now
  );

  insert into public.farms (
    id,
    name,
    owner_id,
    created_at,
    updated_at
  )
  values (
    v_farm_id,
    v_farm_name,
    v_owner_id,
    v_now,
    v_now
  );

  insert into public.farm_members (
    farm_id,
    user_id,
    role,
    status,
    created_by,
    created_at,
    updated_at
  )
  values (
    v_farm_id,
    v_owner_id,
    'owner',
    'active',
    v_owner_id,
    v_now,
    v_now
  );

  raise notice 'Seeded initial owner user (%), farm (%), and owner membership.', v_owner_email, v_farm_name;
end;
$$;
