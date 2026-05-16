
-- Attach trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing profiles
INSERT INTO public.profiles (user_id, display_id, name, phone, referral_code)
SELECT
  u.id,
  'USR-' || substr(md5(u.id::text), 1, 5),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email,'@',1)),
  COALESCE(u.raw_user_meta_data->>'phone', u.phone),
  upper(substr(md5(u.id::text), 1, 8))
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;

-- Backfill missing 'user' roles
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'user'
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.id IS NULL
ON CONFLICT DO NOTHING;
