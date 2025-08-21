# Driver Message RLS Issue Fix

This document provides instructions to fix the Row-Level Security (RLS) violation that prevents drivers from sending messages about their loads.

## Problem Description

When a driver tries to send a message (e.g., "I have marked the recent delivery as delivered"), they encounter this error:

```
Failed to send message: new row violates row-level security policy for table "load_messages"
```

This happens because the driver's user account is not properly linked to their driver record, or the RLS policies are too restrictive.

## Root Causes

The most common causes are:
1. Driver user account not properly linked to driver record
2. RLS helper functions not working correctly  
3. Load not assigned to the correct driver
4. Missing permissions on RLS helper functions

## Solution

### Step 1: Apply Database Fix

Run the SQL fix script to resolve database-level issues:

```sql
-- Connect to your Supabase database and run:
\i fix_driver_message_rls_issue.sql
```

Or if you don't have SQL access, copy the contents of `fix_driver_message_rls_issue.sql` and run it in your Supabase SQL editor.

### Step 2: Verify the Fix

The fix script includes a test function. To verify it worked:

```sql
-- Replace USER_ID and LOAD_ID with actual values
SELECT * FROM test_driver_message_permissions('USER_ID_HERE', LOAD_ID_HERE);
```

This will return information about whether the driver can send messages and why.

### Step 3: Test in the Application

1. Log in as a driver user
2. Navigate to the driver dashboard
3. Try to send a message about a load status
4. If it still fails, check the browser console for enhanced debugging information

## What the Fix Does

### Database Changes

1. **Recreates RLS helper functions** with better error handling
2. **Links orphaned drivers** to user accounts  
3. **Updates RLS policies** to be more permissive for valid drivers
4. **Grants necessary permissions** for authenticated users
5. **Creates test functions** for debugging

### Client-Side Changes

The `DriverService.sendMessage()` method now includes:

- **Enhanced error handling** with detailed debugging information
- **Automatic diagnosis** of common RLS issues
- **User-friendly error messages** that explain what went wrong
- **Debug logging** to help identify the root cause

## Testing the Enhanced Error Handling

If the issue persists after applying the database fix, the enhanced error handling will now provide detailed information like:

```
RLS Policy Violation - Cannot send message. 
User role is 'Customer', expected 'Driver'. 
Please contact support with this information: User ID abc123, Load ID 456.
```

This makes it much easier to identify and resolve the specific issue.

## Common Issues and Solutions

### Issue: "No driver record found for user"
**Solution**: The user account exists but isn't linked to a driver record.
```sql
-- Check if driver exists
SELECT * FROM drivers WHERE name = 'Driver Name';

-- If driver exists, link it to user
UPDATE drivers SET user_id = 'USER_ID_HERE' WHERE name = 'Driver Name';
```

### Issue: "Load is assigned to driver ID X, but user is driver ID Y"
**Solution**: The load is assigned to the wrong driver.
```sql
-- Update load assignment
UPDATE loads SET driver_id = CORRECT_DRIVER_ID WHERE id = LOAD_ID;
```

### Issue: "User role is 'Customer', expected 'Driver'"
**Solution**: The user account has the wrong role.
```sql
-- Fix user role
UPDATE users SET role = 'Driver' WHERE id = 'USER_ID_HERE';
```

## Verification Steps

After applying the fix:

1. **Check driver-user mappings**:
   ```sql
   SELECT 
     u.name as user_name,
     u.role,
     d.name as driver_name,
     d.user_id
   FROM users u
   LEFT JOIN drivers d ON u.id = d.user_id
   WHERE u.role = 'Driver';
   ```

2. **Check load assignments**:
   ```sql
   SELECT 
     l.id as load_id,
     l.status,
     d.name as driver_name,
     u.name as user_name
   FROM loads l
   JOIN drivers d ON l.driver_id = d.id
   JOIN users u ON d.user_id = u.id
   WHERE l.status IN ('In Transit', 'Pending Delivery');
   ```

3. **Test message permissions**:
   ```sql
   SELECT * FROM test_driver_message_permissions('USER_ID', LOAD_ID);
   ```

## Cleanup

After confirming the fix works, you can remove the temporary debug policy:

```sql
DROP POLICY IF EXISTS "load_messages_driver_temp_debug" ON public.load_messages;
```

## Support

If issues persist after applying this fix, the enhanced error messages will provide specific diagnostic information. Include this information when contacting support:

- User ID
- Load ID  
- Complete error message from the browser console
- Results from `test_driver_message_permissions()` function

The enhanced debugging in `DriverService.sendMessage()` will also log detailed information to the browser console to help diagnose any remaining issues.
