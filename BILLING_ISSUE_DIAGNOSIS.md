# Billing Center Issue Diagnosis & Solutions

## Issue Summary

The billing center is showing "No results found" and download functionality isn't working. This is likely due to one or more of the following:

1. **Load Data Issues**: Loads don't meet billing criteria
2. **Authentication/RLS Issues**: Row Level Security policies blocking data access  
3. **Environment Configuration**: Missing environment variables or storage setup
4. **PDF Service Issues**: API or storage bucket configuration problems

## Diagnostic Tools Added

I've added two diagnostic components to the billing page to help identify the root cause:

### 1. BillingDataDebugger
- Tests billing service methods directly
- Shows summary data, load counts, and sample data
- Reveals exactly what data the billing service is returning

### 2. EnvironmentDebugger  
- Checks environment variables
- Tests database connectivity
- Verifies storage bucket access
- Tests PDF generation API

## Load Billing Criteria

For loads to appear in "Ready for Invoice", they must meet ALL these criteria:

```sql
SELECT * FROM loads 
WHERE status = 'Delivered'          -- Exact match, case-sensitive
  AND invoice_id IS NULL            -- Not already invoiced
  AND rate_customer IS NOT NULL     -- Has customer rate set
ORDER BY delivery_date DESC;
```

## Common Issues & Solutions

### 1. Load Status Issues
**Problem**: Loads have wrong status or no delivery date
**Solution**: Check load statuses in database
```sql
-- Check load statuses
SELECT status, COUNT(*) 
FROM loads 
GROUP BY status;

-- Update loads to 'Delivered' if needed
UPDATE loads 
SET status = 'Delivered', delivery_date = CURRENT_DATE 
WHERE id IN (1, 2, 3); -- Replace with actual load IDs
```

### 2. Missing Customer Rates
**Problem**: Loads don't have `rate_customer` values
**Solution**: Add customer rates to delivered loads
```sql
-- Check loads missing customer rates
SELECT id, customer_id, status, rate_customer 
FROM loads 
WHERE status = 'Delivered' AND rate_customer IS NULL;

-- Update with customer rates
UPDATE loads 
SET rate_customer = 1500.00 
WHERE id IN (1, 2, 3); -- Replace with actual values
```

### 3. RLS Policy Issues (MOST LIKELY CAUSE)
**Problem**: Row Level Security policies blocking data access
**Solution**: Ensure user has proper role - billing access requires 'Dispatcher' role

```sql
-- Check current user's role
SELECT role FROM users WHERE id = auth.uid();

-- Check if get_user_role() function works
SELECT get_user_role() as current_role;

-- If user should be dispatcher, update their role
UPDATE users 
SET role = 'Dispatcher' 
WHERE id = auth.uid();

-- Check loads policies in effect
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'loads';
```

**Current RLS Policies for loads table:**
- **Dispatchers**: Can access ALL loads (required for billing center)
- **Customers**: Can only see their own loads  
- **Carriers**: Can only see available/assigned loads
- **Drivers**: Can only see assigned loads

**The billing center requires Dispatcher role to access all delivered loads.**

### 4. Environment Variables Missing
**Problem**: PDF generation fails due to missing environment variables
**Solution**: Add required variables to `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 5. Storage Bucket Issues
**Problem**: Invoices bucket doesn't exist or has wrong permissions
**Solution**: Create bucket and set permissions in Supabase dashboard:
1. Go to Storage → Buckets
2. Create "invoices" bucket if it doesn't exist
3. Set appropriate permissions for file uploads

## Quick Fixes to Test

### Option 1: Create Test Data
Add some test loads that meet billing criteria:
```sql
INSERT INTO loads (
  customer_id, origin_location_id, destination_location_id, 
  equipment_type_id, commodity, status, delivery_date, 
  rate_customer, created_at, updated_at
) VALUES (
  1, 1, 2, 1, 'Test Commodity', 'Delivered', 
  CURRENT_DATE - INTERVAL '5 days', 1500.00, NOW(), NOW()
);
```

### Option 2: Update Existing Loads
If you have existing loads, update them to meet criteria:
```sql
UPDATE loads 
SET status = 'Delivered', 
    delivery_date = CURRENT_DATE - INTERVAL '10 days',
    rate_customer = 1500.00
WHERE id IN (
  SELECT id FROM loads 
  WHERE rate_customer IS NULL 
  LIMIT 5
);
```

### Option 3: Check User Permissions
Verify the current user has proper role and permissions:
```sql
-- Check current user profile
SELECT * FROM users WHERE id = auth.uid();

-- Check if user has proper role
SELECT role FROM users WHERE id = auth.uid();
```

## Testing Steps

1. **Visit the billing center** and click "Run Billing Diagnostics"
2. **Check the output** for any error messages or empty data
3. **Run Environment Diagnostics** to check connectivity and configuration
4. **Review the console logs** for any additional error details
5. **If data is empty**, run the SQL queries above to add test data
6. **Refresh the billing center** to see if data now appears

## Next Steps

After running the diagnostics:

1. **If no data is returned**: The issue is likely in the database (no qualifying loads)
2. **If data is returned but UI shows empty**: There's a frontend rendering issue
3. **If API errors appear**: Environment or configuration issue
4. **If authentication errors**: RLS policy or user permission issue

Once the root cause is identified, I can provide specific fixes for the exact problem found.
