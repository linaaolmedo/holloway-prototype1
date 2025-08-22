'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function EnvironmentDebugger() {
  const [debugOutput, setDebugOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runEnvironmentChecks = async () => {
    setLoading(true);
    setDebugOutput('');
    
    let output = '';
    
    try {
      // Check 1: Environment variables (client-side only)
      output += '=== ENVIRONMENT VARIABLES (Client-side) ===\n';
      output += `NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET'}\n`;
      output += `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}\n\n`;
      
      // Check 2: Supabase connection
      output += '=== SUPABASE CONNECTION ===\n';
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        output += `Session Error: ${sessionError.message}\n`;
      } else {
        output += `User: ${session.session?.user?.email || 'Not authenticated'}\n`;
        output += `User ID: ${session.session?.user?.id || 'N/A'}\n`;
      }
      
      // Check 3: Database access test
      output += '\n=== DATABASE ACCESS TEST ===\n';
      try {
        const { data: testData, error: testError } = await supabase
          .from('loads')
          .select('id, status, rate_customer, invoice_id')
          .limit(5);
        
        if (testError) {
          output += `Database Error: ${testError.message}\n`;
        } else {
          output += `Successfully connected to database\n`;
          output += `Sample loads count: ${testData?.length || 0}\n`;
          if (testData && testData.length > 0) {
            output += 'Sample load data:\n';
            testData.forEach(load => {
              output += `  - Load ${load.id}: status=${load.status}, rate_customer=${load.rate_customer}, invoice_id=${load.invoice_id}\n`;
            });
          }
        }
      } catch (dbError) {
        output += `Database Connection Error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}\n`;
      }
      
      // Check 4: Storage bucket access
      output += '\n=== STORAGE BUCKET ACCESS ===\n';
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) {
          output += `Storage Error: ${bucketsError.message}\n`;
        } else {
          output += `Available buckets: ${buckets.map(b => b.name).join(', ')}\n`;
          
          // Test invoice bucket specifically
          const { data: invoiceFiles, error: invoiceError } = await supabase.storage
            .from('invoices')
            .list('', { limit: 3 });
          
          if (invoiceError) {
            output += `Invoice bucket error: ${invoiceError.message}\n`;
          } else {
            output += `Invoice bucket files: ${invoiceFiles?.length || 0}\n`;
          }
        }
      } catch (storageError) {
        output += `Storage Connection Error: ${storageError instanceof Error ? storageError.message : 'Unknown error'}\n`;
      }
      
      // Check 5: API endpoint test
      output += '\n=== API ENDPOINT TEST ===\n';
      try {
        const testResponse = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceData: {
              invoice_number: 'TEST-001',
              customer_name: 'Test Customer',
              date_created: new Date().toISOString(),
              due_date: new Date().toISOString(),
              total_amount: 100,
              is_paid: false,
              payment_terms: 30,
              loads: []
            },
            filename: 'test.pdf'
          })
        });
        
        output += `API Response Status: ${testResponse.status}\n`;
        if (testResponse.ok) {
          const result = await testResponse.json();
          output += `API Response: ${JSON.stringify(result, null, 2)}\n`;
        } else {
          const errorText = await testResponse.text();
          output += `API Error: ${errorText}\n`;
        }
      } catch (apiError) {
        output += `API Connection Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}\n`;
      }
      
    } catch (error) {
      output += '=== GENERAL ERROR ===\n';
      output += `Error: ${error instanceof Error ? error.message : JSON.stringify(error)}\n`;
      console.error('Environment diagnostics error:', error);
    }
    
    setDebugOutput(output);
    setLoading(false);
    
    // Also log to console
    console.log('=== ENVIRONMENT DIAGNOSTICS ===');
    console.log(output);
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 mt-4">
      <h2 className="text-xl font-semibold text-white mb-4">Environment Debugger</h2>
      
      <button
        onClick={runEnvironmentChecks}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md transition-colors mb-4"
      >
        {loading ? 'Running Environment Checks...' : 'Run Environment Diagnostics'}
      </button>
      
      {debugOutput && (
        <div className="bg-gray-900 border border-gray-600 rounded-md p-4">
          <h3 className="text-lg font-medium text-white mb-2">Environment Debug Output:</h3>
          <pre className="text-sm text-blue-400 whitespace-pre-wrap font-mono overflow-x-auto">
            {debugOutput}
          </pre>
        </div>
      )}
    </div>
  );
}
