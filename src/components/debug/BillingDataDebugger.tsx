'use client';

import { useState } from 'react';
import { BillingService } from '@/services/billingService';

export default function BillingDataDebugger() {
  const [debugOutput, setDebugOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    setDebugOutput('');
    
    let output = '';
    
    try {
      // Test 1: Check billing summary
      output += '=== BILLING SUMMARY ===\n';
      const summary = await BillingService.getBillingSummary();
      output += JSON.stringify(summary, null, 2) + '\n\n';
      
      // Test 2: Check loads ready for invoice
      output += '=== LOADS READY FOR INVOICE ===\n';
      const readyLoads = await BillingService.getLoadsReadyForInvoice();
      output += `Count: ${readyLoads.length}\n`;
      if (readyLoads.length > 0) {
        output += JSON.stringify(readyLoads.slice(0, 3), null, 2) + '\n\n';
      } else {
        output += 'No loads found ready for invoice\n\n';
      }
      
      // Test 3: Check outstanding invoices
      output += '=== OUTSTANDING INVOICES ===\n';
      const outstandingInvoices = await BillingService.getOutstandingInvoices();
      output += `Count: ${outstandingInvoices.length}\n`;
      if (outstandingInvoices.length > 0) {
        output += JSON.stringify(outstandingInvoices.slice(0, 2), null, 2) + '\n\n';
      }
      
      // Test 4: Check customers
      output += '=== CUSTOMERS ===\n';
      const customers = await BillingService.getCustomers();
      output += `Count: ${customers.length}\n`;
      if (customers.length > 0) {
        output += JSON.stringify(customers.slice(0, 3).map(c => ({ 
          id: c.id, 
          name: c.name, 
          payment_terms: c.payment_terms 
        })), null, 2) + '\n\n';
      }
      
    } catch (error) {
      output += '=== ERROR ===\n';
      output += `Error: ${error instanceof Error ? error.message : JSON.stringify(error)}\n`;
      console.error('Billing diagnostics error:', error);
    }
    
    setDebugOutput(output);
    setLoading(false);
    
    // Also log to console for easy copying
    console.log('=== BILLING DIAGNOSTICS ===');
    console.log(output);
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">Billing Data Debugger</h2>
      
      <button
        onClick={runDiagnostics}
        disabled={loading}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-md transition-colors mb-4"
      >
        {loading ? 'Running Diagnostics...' : 'Run Billing Diagnostics'}
      </button>
      
      {debugOutput && (
        <div className="bg-gray-900 border border-gray-600 rounded-md p-4">
          <h3 className="text-lg font-medium text-white mb-2">Debug Output:</h3>
          <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono overflow-x-auto">
            {debugOutput}
          </pre>
        </div>
      )}
    </div>
  );
}
