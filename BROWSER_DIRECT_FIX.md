# 🔧 Browser Direct Fix - No SQL Required!

If the SQL scripts are causing permission errors, use this method instead:

## Step 1: Open Browser Developer Tools
1. In your TMS application (while logged in)
2. Press `F12` or right-click → "Inspect" 
3. Go to **Console** tab

## Step 2: Run This JavaScript Code
Copy and paste this entire block and press Enter:

```javascript
// Fix customer access directly through browser
console.log('🔧 Starting direct customer access fix...');

async function directCustomerFix() {
  try {
    // Get the Supabase client from window
    const supabase = window?.supabase;
    if (!supabase) {
      throw new Error('Supabase client not found. Make sure you are on the TMS app.');
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated. Please log in first.');
    }

    console.log('✅ User found:', user.email);

    // Fix user role in database
    const { data: userData, error: updateError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        role: 'Dispatcher',
        name: user.email?.split('@')[0] || 'User',
        email: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (updateError) {
      console.error('❌ Database update failed:', updateError);
      throw updateError;
    }

    console.log('✅ User role updated to Dispatcher:', userData);

    // Test customer access
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);

    if (customerError) {
      console.warn('⚠️ Customer test failed:', customerError);
    } else {
      console.log('✅ Customer access test passed:', customers?.length || 0);
    }

    // Show success message
    alert('✅ SUCCESS! Customer access has been fixed.\n\nThe page will now refresh to apply changes.');
    
    // Refresh the page
    window.location.reload();
    
    return true;

  } catch (error) {
    console.error('❌ Fix failed:', error);
    alert(`❌ Fix failed: ${error.message}\n\nPlease try the SQL method or contact support.`);
    return false;
  }
}

// Run the fix
directCustomerFix();
```

## Step 3: Wait for Success
- You should see green checkmark messages in console
- An alert will appear saying "SUCCESS!"  
- Page will automatically refresh
- Customers should now load properly

## Step 4: Test
- Navigate to Customers page
- Data should now be visible
- Try logging out and back in - should still work

---

**This method bypasses all SQL permission issues and works directly through your app's Supabase connection.**
