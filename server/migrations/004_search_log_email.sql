-- Store the user's email on each search log at insert time. The admin log view
-- previously joined user_roles for the email, but regular users only get a
-- user_roles row when an admin sets them a limit — so most logs showed no email.
ALTER TABLE search_logs ADD COLUMN IF NOT EXISTS user_email TEXT;
