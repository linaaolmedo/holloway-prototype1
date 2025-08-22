// =====================================================================
// BROWSER CONSOLE FIX - Run this in your browser's developer console
// Alternative to the SQL fix - works directly in your TMS application
// =====================================================================

console.log('🔧 Starting customer access fix...');

// Function to fix user role via Supabase client
async function fixCustomerAccess() {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await window.supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ No authenticated user found:', authError);
      alert('Please make sure you are logged in first!');
      return false;
    }

    console.log('✅ Found authenticated user:', user.email);

    // Try to update user role to Dispatcher
    const { data, error } = await window.supabase
      .from('users')
      .upsert({
        id: user.id,
        role: 'Dispatcher',
        name: user.email.split('@')[0],
        email: user.email,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating user role:', error);
      alert(`Error: ${error.message}\n\nPlease try the SQL fix instead.`);
      return false;
    }

    console.log('✅ Successfully updated user role:', data);

    // Force refresh the auth context
    console.log('🔄 Refreshing auth context...');
    
    // Trigger a page refresh to reload all contexts
    alert('✅ User role fixed! Page will refresh to apply changes.');
    window.location.reload();
    
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    alert(`Unexpected error: ${error.message}\n\nPlease try the SQL fix instead.`);
    return false;
  }
}

// Check if we're in the right environment
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🎯 Supabase client found - running fix...');
  fixCustomerAccess();
} else {
  console.error('❌ This fix must be run in your TMS application while logged in.');
  alert('Please run this code in your TMS application\'s browser console while logged in.');
}
