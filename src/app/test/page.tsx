export default function TestPage() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ color: 'green', fontSize: '2rem' }}>✅ Test Page Works!</h1>
      <p style={{ color: 'blue', fontSize: '1.2rem' }}>
        If you can see this, basic Next.js routing is working.
      </p>
      <p style={{ color: '#666' }}>
        Current time: {new Date().toISOString()}
      </p>
      <div style={{ 
        marginTop: '20px',
        padding: '10px',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '5px'
      }}>
        <strong>This means the issue is with the AuthProvider/Supabase integration.</strong>
      </div>
    </div>
  );
}
