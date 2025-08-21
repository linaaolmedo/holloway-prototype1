import { supabase } from '@/lib/supabase';
import { 
  InvoiceWithDetails,
  LoadReadyForInvoice,
  CreateInvoiceData,
  UpdateInvoiceData,
  BillingFilters,
  BillingSummary,
  Customer
} from '@/types/billing';
import { PDFService } from './pdfService';

export class BillingService {
  // Get all invoices with related data
  static async getInvoices(filters?: BillingFilters): Promise<InvoiceWithDetails[]> {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        loads!loads_invoice_id_fkey(
          id,
          commodity,
          pickup_date,
          delivery_date,
          rate_customer,
          status,
          origin_location:customer_locations!origin_location_id(
            id, location_name, city, state
          ),
          destination_location:customer_locations!destination_location_id(
            id, location_name, city, state
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters) {
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters.invoice_number) {
        query = query.ilike('invoice_number', `%${filters.invoice_number}%`);
      }
      if (filters.date_from) {
        query = query.gte('date_created', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('date_created', filters.date_to);
      }
      if (filters.is_paid !== undefined) {
        query = query.eq('is_paid', filters.is_paid);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    return data || [];
  }

  // Get loads ready for invoicing (delivered, no invoice_id)
  static async getLoadsReadyForInvoice(filters?: BillingFilters): Promise<LoadReadyForInvoice[]> {
    let query = supabase
      .from('loads')
      .select(`
        id,
        customer_id,
        commodity,
        pickup_date,
        delivery_date,
        rate_customer,
        status,
        customer:customers(*),
        origin_location:customer_locations!origin_location_id(
          id, location_name, city, state
        ),
        destination_location:customer_locations!destination_location_id(
          id, location_name, city, state
        )
      `)
      .eq('status', 'Delivered')
      .is('invoice_id', null)
      .not('rate_customer', 'is', null)
      .order('delivery_date', { ascending: true });

    // Apply customer filter if specified
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch loads ready for invoice: ${error.message}`);
    }

    // Calculate days since delivery for each load and fix array types
    const now = new Date();
    return (data || []).map(load => ({
      ...load,
      customer: Array.isArray(load.customer) ? load.customer[0] : load.customer,
      origin_location: Array.isArray(load.origin_location) ? load.origin_location[0] : load.origin_location,
      destination_location: Array.isArray(load.destination_location) ? load.destination_location[0] : load.destination_location,
      days_since_delivery: load.delivery_date 
        ? Math.floor((now.getTime() - new Date(load.delivery_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0
    }));
  }

  // Get outstanding invoices (not paid)
  static async getOutstandingInvoices(filters?: BillingFilters): Promise<InvoiceWithDetails[]> {
    const invoiceFilters = {
      ...filters,
      is_paid: false
    };
    return this.getInvoices(invoiceFilters);
  }

  // Get paid invoices from last 30 days
  static async getPaidInvoicesLast30Days(filters?: BillingFilters): Promise<InvoiceWithDetails[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const invoiceFilters = {
      ...filters,
      is_paid: true,
      date_from: thirtyDaysAgo.toISOString().split('T')[0]
    };
    return this.getInvoices(invoiceFilters);
  }

  // Create a new invoice from selected loads
  static async createInvoice(invoiceData: CreateInvoiceData): Promise<InvoiceWithDetails> {
    const { load_ids, customer_id, due_date } = invoiceData;

    // Calculate total amount from selected loads
    const { data: loads, error: loadsError } = await supabase
      .from('loads')
      .select('rate_customer')
      .in('id', load_ids)
      .eq('customer_id', customer_id)
      .eq('status', 'Delivered')
      .is('invoice_id', null);

    if (loadsError) {
      throw new Error(`Failed to fetch loads for invoice: ${loadsError.message}`);
    }

    const totalAmount = loads?.reduce((sum, load) => sum + (load.rate_customer || 0), 0) || 0;

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate due date if not provided
    const calculatedDueDate = due_date || await this.calculateDueDate(customer_id);

    // Create invoice
    const invoiceRecord = {
      invoice_number: invoiceNumber,
      customer_id,
      date_created: new Date().toISOString().split('T')[0],
      due_date: calculatedDueDate,
      total_amount: totalAmount,
      is_paid: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([invoiceRecord])
      .select()
      .single();

    if (invoiceError) {
      throw new Error(`Failed to create invoice: ${invoiceError.message}`);
    }

    // Update loads to reference the new invoice
    const { error: updateError } = await supabase
      .from('loads')
      .update({ 
        invoice_id: invoice.id,
        updated_at: new Date().toISOString() 
      })
      .in('id', load_ids);

    if (updateError) {
      throw new Error(`Failed to update loads with invoice ID: ${updateError.message}`);
    }

    // Generate PDF for the invoice (async, don't wait for completion)
    this.generateInvoicePDFAsync(invoice.id);

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    // Return the complete invoice with details
    return this.getInvoiceById(invoice.id);
  }

  // Get a single invoice by ID
  static async getInvoiceById(id: number): Promise<InvoiceWithDetails> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        loads!loads_invoice_id_fkey(
          id,
          commodity,
          pickup_date,
          delivery_date,
          rate_customer,
          status,
          origin_location:customer_locations!origin_location_id(
            id, location_name, city, state
          ),
          destination_location:customer_locations!destination_location_id(
            id, location_name, city, state
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch invoice: ${error.message}`);
    }

    return data;
  }

  // Update an existing invoice
  static async updateInvoice(id: number, invoiceData: UpdateInvoiceData): Promise<InvoiceWithDetails> {
    const { error } = await supabase
      .from('invoices')
      .update({
        ...invoiceData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update invoice: ${error.message}`);
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    return this.getInvoiceById(id);
  }

  // Mark invoice as paid
  static async markInvoicePaid(id: number, paidDate?: string): Promise<InvoiceWithDetails> {
    return this.updateInvoice(id, {
      is_paid: true,
      paid_date: paidDate || new Date().toISOString().split('T')[0]
    });
  }

  // Delete an invoice (and unlink loads)
  static async deleteInvoice(id: number): Promise<void> {
    // First unlink loads from this invoice
    const { error: unlinkError } = await supabase
      .from('loads')
      .update({ 
        invoice_id: null,
        updated_at: new Date().toISOString() 
      })
      .eq('invoice_id', id);

    if (unlinkError) {
      throw new Error(`Failed to unlink loads from invoice: ${unlinkError.message}`);
    }

    // Then delete the invoice
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete invoice: ${error.message}`);
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }
  }

  // Get billing summary statistics
  static async getBillingSummary(): Promise<BillingSummary> {
    const [readyLoads, outstandingInvoices, paidInvoices] = await Promise.all([
      this.getLoadsReadyForInvoice(),
      this.getOutstandingInvoices(),
      this.getPaidInvoicesLast30Days()
    ]);

    return {
      ready_to_invoice: {
        count: readyLoads.length,
        amount: readyLoads.reduce((sum, load) => sum + (load.rate_customer || 0), 0)
      },
      outstanding_invoices: {
        count: outstandingInvoices.length,
        amount: outstandingInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)
      },
      paid_last_30_days: {
        count: paidInvoices.length,
        amount: paidInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)
      }
    };
  }

  // Get customers for filters
  static async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    return data || [];
  }

  // Helper: Generate invoice number
  private static async generateInvoiceNumber(): Promise<string> {
    const { error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.warn('Could not fetch last invoice number, using default format');
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Get the last invoice number for this month
    const prefix = `INV-${year}${month}`;
    
    const { data: monthlyInvoices } = await supabase
      .from('invoices')
      .select('invoice_number')
      .ilike('invoice_number', `${prefix}%`)
      .order('invoice_number', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (monthlyInvoices && monthlyInvoices.length > 0) {
      const lastNumber = monthlyInvoices[0].invoice_number;
      if (lastNumber) {
        const matches = lastNumber.match(/(\d+)$/);
        if (matches) {
          nextNumber = parseInt(matches[1]) + 1;
        }
      }
    }

    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
  }

  // Helper: Calculate due date based on customer payment terms
  private static async calculateDueDate(customerId: number): Promise<string> {
    const { data: customer } = await supabase
      .from('customers')
      .select('payment_terms')
      .eq('id', customerId)
      .single();

    const paymentTerms = customer?.payment_terms || 30; // Default to Net 30
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentTerms);
    
    return dueDate.toISOString().split('T')[0];
  }

  // Generate PDF for invoice asynchronously
  private static async generateInvoicePDFAsync(invoiceId: number): Promise<void> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      await PDFService.generateInvoicePDF(invoice);
    } catch (error) {
      console.error('Error generating PDF for invoice:', invoiceId, error);
    }
  }

  // Download invoice PDF
  static async downloadInvoicePDF(invoice: InvoiceWithDetails): Promise<void> {
    try {
      await PDFService.downloadInvoicePDF(invoice);
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      throw new Error('Failed to download invoice PDF. Please try again.');
    }
  }

  // Open invoice for printing (fallback when PDF is not available)
  static openInvoiceForPrint(invoice: InvoiceWithDetails): void {
    try {
      PDFService.openInvoiceForPrint(invoice);
    } catch (error) {
      console.error('Error opening invoice for print:', error);
      throw new Error('Failed to open invoice for printing. Please try again.');
    }
  }

  // Check if invoice has PDF available
  static async hasInvoicePDF(invoice: InvoiceWithDetails): Promise<boolean> {
    return !!invoice.pdf_path;
  }

  // Regenerate invoice PDF
  static async regenerateInvoicePDF(invoice: InvoiceWithDetails): Promise<string> {
    try {
      return await PDFService.generateInvoicePDF(invoice);
    } catch (error) {
      console.error('Error regenerating invoice PDF:', error);
      throw new Error('Failed to regenerate invoice PDF. Please try again.');
    }
  }
}
