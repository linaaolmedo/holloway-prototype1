# Fix for Carrier Equipment Types Error

## Problem
When creating a carrier, you may encounter an error: **"Error creating carrier equipment types: {}"**

This is caused by Row Level Security (RLS) policies that prevent the insertion of equipment type relationships.

## Solution
Run the SQL script `fix_carrier_equipment_types_rls.sql` in your Supabase dashboard.

### Steps:
1. Open your Supabase dashboard
2. Navigate to **SQL Editor**
3. Open the file `fix_carrier_equipment_types_rls.sql`
4. Execute the script

### What the script does:
- Fixes RLS policies for the `carrier_equipment_types` table
- Ensures dispatchers can create carrier equipment type relationships
- Maintains proper security for carrier-specific access

## Temporary Workaround
Until you run the fix script, you can:
- Create carriers without selecting equipment types
- Add equipment types later after running the fix script

## Files Modified:
- `fix_carrier_equipment_types_rls.sql` - The fix script
- `src/services/carrierService.ts` - Better error handling
- `src/app/dashboard/carriers/page.tsx` - User-friendly error messages

The carrier creation will now work even if equipment types can't be assigned, with a warning message instead of a complete failure.
