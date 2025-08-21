# Row Level Security (RLS) Implementation Guide

This guide explains how to implement Row Level Security for the BulkFlow TMS application using Supabase.

## Overview

Row Level Security (RLS) provides database-level access control that automatically filters data based on the authenticated user's role and permissions. This ensures that users can only access data they're authorized to see.

## User Roles and Access Patterns

### 1. Dispatcher
- **Full access** to all data in all tables
- Can create, read, update, and delete all records
- No restrictions

### 2. Customer
- **Restricted access** to their own data only
- Can access their own customer record and locations
- Can see loads for their customer_id
- Can create new loads for themselves
- Can view invoices for their customer_id
- Can see load documents and messages for their loads

### 3. Carrier
- **Bidding access** to available loads
- Can see unassigned loads (for bidding)
- Can access loads assigned to them
- Can manage their own carrier profile and equipment types
- Can place and manage bids
- Can see load documents and messages for assigned loads

### 4. Driver
- **Assignment-based access** to loads
- Can see loads assigned to them
- Can update status of assigned loads
- Can access their own driver profile
- Can view all trucks and trailers (for reference)
- Can upload documents and send messages for assigned loads

## Implementation Steps

### Step 1: Run the RLS Setup Scripts

Execute these SQL scripts in your Supabase database in order:

1. **Enable RLS and Create Policies**
   ```bash
   # Run in Supabase SQL Editor
   psql -f enable_rls_policies.sql
   ```

2. **Create Audit Functions**
   ```bash
   # Run in Supabase SQL Editor
   psql -f create_audit_functions.sql
   ```

3. **Test the Implementation**
   ```bash
   # Run in Supabase SQL Editor
   psql -f test_rls_policies.sql
   ```

### Step 2: Verify User Profiles

Ensure all users have proper profiles in the `users` table with correct roles and associated IDs:

```sql
-- Check user profiles
SELECT 
  u.id,
  u.role,
  u.customer_id,
  u.carrier_id,
  u.name,
  u.email
FROM users u
JOIN auth.users au ON u.id = au.id;
```

### Step 3: Client-Side Considerations

The existing client-side service functions require minimal changes because RLS is enforced at the database level. However, consider these updates:

#### Error Handling
When RLS blocks access, queries return empty results rather than errors. Update error handling:

```typescript
// Before
const loads = await LoadService.getLoads();
if (!loads.length) {
  // This could mean no data OR no access
}

// After - Add context-aware error handling
const loads = await LoadService.getLoads();
if (!loads.length && userRole !== 'Dispatcher') {
  // Check if user should have access to loads
  console.log('No loads accessible to current user');
}
```

#### Role-Based UI Components
Update components to show/hide features based on user roles:

```typescript
// Example: Only show carrier management for dispatchers
if (userProfile.role === 'Dispatcher') {
  return <CarrierManagement />;
}
```

#### Automatic Filtering
Services will now automatically filter data based on the user's role:

```typescript
// CustomerService.getAllCustomers() will now:
// - Return ALL customers for Dispatchers
// - Return ONLY their customer for Customer users
// - Return empty array for Carriers/Drivers
```

## RLS Policy Details

### Key Helper Functions

The RLS implementation uses several helper functions:

- `get_user_role()` - Returns the current user's role
- `get_user_customer_id()` - Returns the customer_id for customer users
- `get_user_carrier_id()` - Returns the carrier_id for carrier users  
- `get_user_driver_id()` - Returns the driver_id for driver users

### Critical Policies

#### Loads Table (Most Complex)
- **Dispatchers**: Full access
- **Customers**: Only loads for their customer_id
- **Carriers**: Available loads for bidding + assigned loads
- **Drivers**: Only loads assigned to them

#### Customer Data
- **Customers**: Only their own customer record and locations
- **Others**: Access based on business need (dispatchers see all)

#### Fleet Data
- **Drivers**: Can see trucks/trailers for reference, update own driver record
- **Dispatchers**: Full fleet management access

## Testing Your Implementation

### 1. Create Test Users
Create users for each role in Supabase Auth, then add corresponding entries to the `users` table.

### 2. Test Data Access
Sign in as different user types and verify they can only access appropriate data:

```typescript
// Test as Customer user
const loads = await LoadService.getLoads();
// Should only return loads for this customer

// Test as Carrier user  
const availableLoads = await BidService.getAvailableLoads();
// Should return unassigned loads + loads assigned to this carrier

// Test as Driver user
const assignment = await DriverService.getCurrentAssignment();
// Should only return loads assigned to this driver
```

### 3. Test Unauthorized Access
Try accessing data that should be blocked:

```typescript
// As Customer, try to access another customer's data
// As Carrier, try to access internal fleet data
// As Driver, try to access all loads
```

## Performance Considerations

### Indexing
The implementation includes indexes on key columns used in RLS policies:

```sql
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_loads_customer_id ON loads(customer_id);
CREATE INDEX idx_loads_carrier_id ON loads(carrier_id);
CREATE INDEX idx_loads_driver_id ON loads(driver_id);
```

### Query Optimization
- RLS policies are evaluated on every query
- Use specific queries rather than broad SELECT statements
- Consider caching user role/ID lookups

## Security Best Practices

### 1. Never Bypass RLS
- Don't use service role keys in client code
- Always use authenticated user context
- Test thoroughly with different user roles

### 2. Validate Client-Side Too
While RLS provides database security, also implement client-side role checks for better UX:

```typescript
// Hide features that users can't access anyway
if (!['Dispatcher', 'Customer'].includes(userRole)) {
  return null; // Don't show customer management
}
```

### 3. Audit Trail
The implementation includes automatic audit trails:
- `created_by` and `updated_by` fields are automatically set
- Timestamps are automatically managed
- Changes are trackable by user

## Troubleshooting

### Common Issues

1. **Empty Results**: Check if user has proper role and associated IDs
2. **Permission Errors**: Verify RLS policies are applied correctly
3. **Performance Issues**: Check if indexes are in place

### Debug Queries

```sql
-- Check current user context
SELECT 
  auth.uid() as current_user_id,
  get_user_role() as current_role;

-- Test policy evaluation
SELECT * FROM loads WHERE true; -- Should respect RLS
```

### Monitoring

Monitor query performance and RLS policy evaluation:

```sql
-- Check slow queries with RLS
SELECT query, mean_exec_time 
FROM pg_stat_statements 
WHERE query LIKE '%loads%'
ORDER BY mean_exec_time DESC;
```

## Migration Checklist

- [ ] Run `enable_rls_policies.sql`
- [ ] Run `create_audit_functions.sql`
- [ ] Verify all users have proper profiles in `users` table
- [ ] Test data access for each user role
- [ ] Update client-side error handling
- [ ] Add role-based UI components
- [ ] Test performance with realistic data volume
- [ ] Monitor for any access issues

## Support

If you encounter issues:
1. Check Supabase logs for RLS policy violations
2. Verify user profiles and role assignments
3. Test with the provided test script
4. Review query execution plans for performance issues
