// Quick environment check script
console.log('🔍 Checking environment variables...\n');

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set');

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('\n📋 Service role key info:');
  console.log('- Length:', key.length);
  console.log('- Starts with:', key.substring(0, 20) + '...');
  console.log('- Format check:', key.startsWith('eyJ') ? '✅ Looks like a JWT' : '❌ May not be correct format');
} else {
  console.log('\n❌ SUPABASE_SERVICE_ROLE_KEY is missing!');
  console.log('\n📖 To fix:');
  console.log('1. Go to Supabase Dashboard → Settings → API');
  console.log('2. Copy the "service_role" key (NOT the anon public key)');
  console.log('3. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  console.log('4. Restart your dev server');
}

console.log('\n🔧 If you have issues:');
console.log('- Make sure .env.local is in the project root');
console.log('- Restart your development server after adding the key');
console.log('- Check there are no extra spaces around the key');
