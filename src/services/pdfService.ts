import { supabase } from '@/lib/supabase';
import { InvoiceWithDetails } from '@/types/billing';

export class PDFService {
  private static readonly STORAGE_BUCKET = 'invoices';
  
  /**
   * Generate PDF invoice and store in Supabase storage
   */
  static async generateInvoicePDF(invoice: InvoiceWithDetails): Promise<string> {
    try {
      // Transform invoice data for PDF generation
      const invoiceData = this.transformInvoiceData(invoice);
      
      // Generate filename
      const filename = `invoice-${invoice.invoice_number || invoice.id}-${Date.now()}.pdf`;
      
      // Call API to generate PDF and save to storage
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          invoiceData: invoiceData,
          filename: filename
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `PDF generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      const filePath = result.filePath;

      // Update invoice record with PDF path
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          pdf_path: filePath,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (updateError) {
        console.error('Failed to update invoice with PDF path:', updateError);
      }

      return filePath;
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw error;
    }
  }

  /**
   * Transform InvoiceWithDetails to format expected by PDF API
   */
  private static transformInvoiceData(invoice: InvoiceWithDetails) {
    return {
      invoice_number: invoice.invoice_number || `INV-${invoice.id}`,
      customer_name: invoice.customer?.name || 'Unknown Customer',
      customer_email: invoice.customer?.primary_contact_email,
      customer_phone: invoice.customer?.primary_contact_phone,
      payment_terms: invoice.customer?.payment_terms || 30,
      date_created: invoice.date_created,
      due_date: invoice.due_date || invoice.date_created,
      total_amount: invoice.total_amount || 0,
      is_paid: invoice.is_paid,
      paid_date: invoice.paid_date,
      loads: (invoice.loads || []).map(load => ({
        id: load.id,
        commodity: load.commodity,
        origin: `${load.origin_location?.city || 'Unknown'}, ${load.origin_location?.state || ''}`,
        destination: `${load.destination_location?.city || 'Unknown'}, ${load.destination_location?.state || ''}`,
        pickup_date: load.pickup_date,
        delivery_date: load.delivery_date,
        rate_customer: load.rate_customer || 0
      }))
    };
  }

  /**
   * Get download URL for invoice PDF
   */
  static async getInvoiceDownloadURL(pdfPath: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .createSignedUrl(pdfPath, 3600); // 1 hour expiration

      if (error) {
        throw new Error(`Failed to create download URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error creating download URL:', error);
      throw error;
    }
  }

  /**
   * Download invoice PDF directly
   */
  static async downloadInvoicePDF(invoice: InvoiceWithDetails): Promise<void> {
    try {
      let pdfPath = invoice.pdf_path;
      
      // Generate PDF if it doesn't exist
      if (!pdfPath) {
        pdfPath = await this.generateInvoicePDF(invoice);
      }

      // Get download URL
      const downloadUrl = await this.getInvoiceDownloadURL(pdfPath);
      
      // Fetch the PDF content as blob to force download
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF for download');
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Trigger download using blob URL
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `invoice-${invoice.invoice_number || invoice.id}.pdf`;
      link.style.display = 'none'; // Hide the link
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      
      // If PDF generation fails, offer print alternative
      if (error instanceof Error && error.message.includes('PDF generation service is not configured')) {
        throw new Error('PDF generation is not available. Would you like to open the invoice for printing instead?');
      }
      
      throw error;
    }
  }

  /**
   * Open invoice in new window for printing (fallback when PDF generation is not available)
   */
  static openInvoiceForPrint(invoice: InvoiceWithDetails): void {
    try {
      const htmlContent = this.generateInvoiceHTML(invoice);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocker prevented opening print window. Please allow popups and try again.');
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Trigger print dialog after content loads
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } catch (error) {
      console.error('Error opening invoice for print:', error);
      throw new Error('Failed to open invoice for printing. Please try again.');
    }
  }



  /**
   * Generate HTML content for invoice
   */
  private static generateInvoiceHTML(invoice: InvoiceWithDetails): string {
    const formatCurrency = (amount: number | null) => {
      if (amount === null || amount === undefined) return '$0.00';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    };

    const subtotal = invoice.loads?.reduce((sum, load) => sum + (load.rate_customer || 0), 0) || 0;
    const tax = 0; // Adjust if tax calculation is needed
    const total = subtotal + tax;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoice_number || invoice.id}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 40px; 
          color: #333;
          line-height: 1.4;
        }
        .invoice-header { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 40px;
          border-bottom: 3px solid #e74c3c;
          padding-bottom: 20px;
        }
        .company-info h1 { 
          margin: 0; 
          color: #e74c3c; 
          font-size: 28px;
        }
        .company-info p { 
          margin: 5px 0; 
          color: #666;
        }
        .invoice-info { 
          text-align: right; 
        }
        .invoice-info h2 { 
          margin: 0; 
          color: #333; 
          font-size: 24px;
        }
        .invoice-details { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 40px;
        }
        .invoice-details > div { 
          width: 48%; 
        }
        .invoice-details h3 { 
          margin-bottom: 10px; 
          color: #e74c3c;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .invoice-details p { 
          margin: 5px 0; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 30px;
        }
        th, td { 
          padding: 12px; 
          text-align: left; 
          border-bottom: 1px solid #ddd; 
        }
        th { 
          background-color: #f8f9fa; 
          font-weight: bold;
          color: #333;
        }
        .amount { 
          text-align: right; 
        }
        .totals { 
          float: right; 
          width: 300px; 
          margin-top: 20px;
        }
        .totals table { 
          margin: 0; 
        }
        .totals .total-row { 
          font-weight: bold; 
          font-size: 18px;
          background-color: #f8f9fa;
        }
        .footer { 
          margin-top: 60px; 
          padding-top: 20px; 
          border-top: 1px solid #ddd; 
          color: #666;
          font-size: 14px;
        }
        .status-paid { 
          background-color: #d4edda; 
          color: #155724; 
          padding: 8px 16px; 
          border-radius: 4px; 
          display: inline-block; 
          font-weight: bold;
        }
        .status-outstanding { 
          background-color: #fff3cd; 
          color: #856404; 
          padding: 8px 16px; 
          border-radius: 4px; 
          display: inline-block; 
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <div class="company-info">
          <h1>Holloway Logistics</h1>
          <p>Transportation Management System</p>
          <p>Phone: (555) 123-4567</p>
          <p>Email: billing@hollowaylogistics.com</p>
        </div>
        <div class="invoice-info">
          <h2>INVOICE</h2>
          <p><strong>Invoice #:</strong> ${invoice.invoice_number || `INV-${invoice.id}`}</p>
          <p><strong>Date:</strong> ${formatDate(invoice.date_created)}</p>
          <p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
          ${invoice.is_paid 
            ? `<div class="status-paid">PAID</div>` 
            : `<div class="status-outstanding">OUTSTANDING</div>`
          }
        </div>
      </div>

      <div class="invoice-details">
        <div class="bill-to">
          <h3>Bill To:</h3>
          <p><strong>${invoice.customer?.name || 'Unknown Customer'}</strong></p>
          ${invoice.customer?.primary_contact_name ? `<p>Attn: ${invoice.customer.primary_contact_name}</p>` : ''}
          ${invoice.customer?.primary_contact_email ? `<p>Email: ${invoice.customer.primary_contact_email}</p>` : ''}
          ${invoice.customer?.primary_contact_phone ? `<p>Phone: ${invoice.customer.primary_contact_phone}</p>` : ''}
        </div>
        <div class="payment-terms">
          <h3>Payment Terms:</h3>
          <p><strong>Payment Terms:</strong> Net ${invoice.customer?.payment_terms || 30} days</p>
          <p><strong>Total Amount:</strong> ${formatCurrency(invoice.total_amount)}</p>
          ${invoice.is_paid ? `<p><strong>Paid Date:</strong> ${formatDate(invoice.paid_date)}</p>` : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Load ID</th>
            <th>Commodity</th>
            <th>Origin</th>
            <th>Destination</th>
            <th>Pickup Date</th>
            <th>Delivery Date</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.loads?.map(load => `
            <tr>
              <td>${load.id}</td>
              <td>${load.commodity || 'N/A'}</td>
              <td>${load.origin_location ? `${load.origin_location.city}, ${load.origin_location.state}` : 'N/A'}</td>
              <td>${load.destination_location ? `${load.destination_location.city}, ${load.destination_location.state}` : 'N/A'}</td>
              <td>${formatDate(load.pickup_date)}</td>
              <td>${formatDate(load.delivery_date)}</td>
              <td class="amount">${formatCurrency(load.rate_customer)}</td>
            </tr>
          `).join('') || '<tr><td colspan="7">No loads found</td></tr>'}
        </tbody>
      </table>

      <div class="totals">
        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="amount">${formatCurrency(subtotal)}</td>
          </tr>
          ${tax > 0 ? `
          <tr>
            <td>Tax:</td>
            <td class="amount">${formatCurrency(tax)}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td>Total:</td>
            <td class="amount">${formatCurrency(total)}</td>
          </tr>
        </table>
      </div>

      <div style="clear: both;"></div>

      <div class="footer">
        <p><strong>Payment Instructions:</strong></p>
        <p>Please remit payment within ${invoice.customer?.payment_terms || 30} days of invoice date. Include invoice number on payment.</p>
        <p>For questions regarding this invoice, please contact our billing department at billing@hollowaylogistics.com</p>
        
        <p style="margin-top: 20px; text-align: center; font-size: 12px;">
          Thank you for your business!
        </p>
      </div>
    </body>
    </html>`;
  }
}
