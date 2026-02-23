-- Dashboard RPC functions for admin analytics
-- All functions filter by date range on emails.received_at

-- 1. Total email volume
CREATE OR REPLACE FUNCTION get_email_volume(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS BIGINT
LANGUAGE sql STABLE
AS $$
  SELECT count(*)
  FROM emails
  WHERE received_at >= start_date
    AND received_at < end_date;
$$;

-- 2. Emails grouped by suggested_team
CREATE OR REPLACE FUNCTION get_emails_by_team(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS TABLE(team TEXT, count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT
    coalesce(suggested_team, 'unclassified') AS team,
    count(*) AS count
  FROM emails
  WHERE received_at >= start_date
    AND received_at < end_date
  GROUP BY suggested_team
  ORDER BY count DESC;
$$;

-- 3. Unread email count
CREATE OR REPLACE FUNCTION get_unread_count(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS BIGINT
LANGUAGE sql STABLE
AS $$
  SELECT count(*)
  FROM emails
  WHERE received_at >= start_date
    AND received_at < end_date
    AND is_read = false;
$$;

-- 4. Top senders by volume
CREATE OR REPLACE FUNCTION get_top_senders(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ, sender_limit INT DEFAULT 10)
RETURNS TABLE(from_address TEXT, count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT
    e.from_address,
    count(*) AS count
  FROM emails e
  WHERE e.received_at >= start_date
    AND e.received_at < end_date
  GROUP BY e.from_address
  ORDER BY count DESC
  LIMIT sender_limit;
$$;

-- 5. Daily email volume (IST timezone)
CREATE OR REPLACE FUNCTION get_daily_volume(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS TABLE(date DATE, count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT
    (received_at AT TIME ZONE 'Asia/Kolkata')::date AS date,
    count(*) AS count
  FROM emails
  WHERE received_at >= start_date
    AND received_at < end_date
  GROUP BY (received_at AT TIME ZONE 'Asia/Kolkata')::date
  ORDER BY date;
$$;

-- 6. Emails grouped by mailbox (support_email_id)
CREATE OR REPLACE FUNCTION get_emails_by_mailbox(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS TABLE(support_email_id UUID, email_address TEXT, display_name TEXT, count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT
    e.support_email_id,
    se.email_address,
    se.display_name,
    count(*) AS count
  FROM emails e
  JOIN support_emails se ON se.id = e.support_email_id
  WHERE e.received_at >= start_date
    AND e.received_at < end_date
  GROUP BY e.support_email_id, se.email_address, se.display_name
  ORDER BY count DESC;
$$;
