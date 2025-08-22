-- Check loads that should appear in billing center
-- For loads to be ready for invoice, they need:
-- 1. status = 'Delivered'
-- 2. invoice_id IS NULL
-- 3. rate_customer IS NOT NULL

-- First, check all loads to understand the current data
SELECT 
  id,
  customer_id,
  status,
  rate_customer,
  invoice_id,
  delivery_date,
  commodity,
  created_at
FROM loads 
ORDER BY delivery_date DESC NULLS LAST 
LIMIT 20;

-- Check specifically loads that meet the billing criteria
SELECT 
  id,
  customer_id,
  status,
  rate_customer,
  invoice_id,
  delivery_date,
  commodity
FROM loads 
WHERE status = 'Delivered' 
  AND invoice_id IS NULL 
  AND rate_customer IS NOT NULL
ORDER BY delivery_date DESC;

-- Check loads that have 'Delivered' status but might be missing other criteria
SELECT 
  'Missing rate_customer' as issue,
  COUNT(*) as count
FROM loads 
WHERE status = 'Delivered' 
  AND invoice_id IS NULL 
  AND rate_customer IS NULL

UNION ALL

SELECT 
  'Already invoiced' as issue,
  COUNT(*) as count
FROM loads 
WHERE status = 'Delivered' 
  AND invoice_id IS NOT NULL

UNION ALL

SELECT 
  'Not delivered status' as issue,
  COUNT(*) as count
FROM loads 
WHERE status != 'Delivered' 
  AND invoice_id IS NULL;

-- Check available load statuses
SELECT DISTINCT status, COUNT(*) as count
FROM loads
GROUP BY status
ORDER BY count DESC;
