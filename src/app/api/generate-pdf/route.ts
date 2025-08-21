import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';

// Initialize Supabase client for server-side operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Please add it to your .env.local file.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

interface InvoiceData {
  invoice_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  payment_terms: number;
  date_created: string;
  due_date: string;
  total_amount: number;
  is_paid: boolean;
  paid_date?: string;
  loads: Array<{
    id: number;
    commodity?: string;
    origin: string;
    destination: string;
    pickup_date?: string;
    delivery_date?: string;
    rate_customer: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { invoiceData, filename } = await request.json();

    if (!invoiceData) {
      return NextResponse.json({ error: 'Invoice data is required' }, { status: 400 });
    }

    // Generate PDF content
    const pdfBuffer = await generateSimpleInvoicePDF(invoiceData);
    
    // Upload to Supabase storage
    const fileName = filename || `invoice-${invoiceData.invoice_number}-${Date.now()}.pdf`;
    const filePath = `invoices/${fileName}`;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) {
      console.error('Error uploading PDF to Supabase storage:', error);
      return NextResponse.json(
        { error: 'Failed to save PDF to storage', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      filePath: filePath,
      fileName: fileName,
      message: 'PDF generated and saved successfully'
    });

  } catch (error) {
    console.error('Error in PDF generation endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error during PDF generation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function generateSimpleInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  try {
    const doc = new jsPDF();
    
    // Set font
    doc.setFont('helvetica');
    
    // Company Header
    doc.setFontSize(24);
    doc.setTextColor(231, 76, 60); // Red color
    doc.text('Holloway Logistics', 20, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100); // Gray color
    doc.text('Transportation Management System', 20, 40);
    doc.text('Phone: (555) 123-4567', 20, 48);
    doc.text('Email: billing@hollowaylogistics.com', 20, 56);
    
    // Invoice Title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0); // Black
    doc.text('INVOICE', 150, 30);
    
    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoiceData.invoice_number}`, 150, 40);
    doc.text(`Date: ${formatDate(invoiceData.date_created)}`, 150, 48);
    doc.text(`Due Date: ${formatDate(invoiceData.due_date)}`, 150, 56);
    
    // Status
    doc.setFontSize(12);
    if (invoiceData.is_paid) {
      doc.setTextColor(16, 185, 129); // Green
      doc.text('PAID', 150, 64);
      if (invoiceData.paid_date) {
        doc.setTextColor(0, 0, 0);
        doc.text(`Paid: ${formatDate(invoiceData.paid_date)}`, 150, 72);
      }
    } else {
      doc.setTextColor(245, 158, 11); // Yellow
      doc.text('OUTSTANDING', 150, 64);
    }
    
    // Customer Information
    doc.setFontSize(14);
    doc.setTextColor(231, 76, 60); // Red
    doc.text('Bill To:', 20, 90);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black
    doc.text(invoiceData.customer_name, 20, 102);
    
    let yPos = 110;
    if (invoiceData.customer_email) {
      doc.text(`Email: ${invoiceData.customer_email}`, 20, yPos);
      yPos += 8;
    }
    if (invoiceData.customer_phone) {
      doc.text(`Phone: ${invoiceData.customer_phone}`, 20, yPos);
      yPos += 8;
    }
    
    // Payment Terms
    doc.setFontSize(14);
    doc.setTextColor(231, 76, 60); // Red
    doc.text('Payment Terms:', 120, 90);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Net ${invoiceData.payment_terms} days`, 120, 102);
    doc.text(`Total: ${formatCurrency(invoiceData.total_amount)}`, 120, 110);
    
    // Loads Table
    yPos = 130;
    doc.setFontSize(14);
    doc.setTextColor(231, 76, 60);
    doc.text('Loads:', 20, yPos);
    
    yPos += 15;
    
    // Table Headers
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Load ID', 20, yPos);
    doc.text('Commodity', 45, yPos);
    doc.text('Origin', 80, yPos);
    doc.text('Destination', 120, yPos);
    doc.text('Delivery', 160, yPos);
    doc.text('Amount', 185, yPos);
    
    yPos += 5;
    // Draw line under headers
    doc.line(20, yPos, 200, yPos);
    
    yPos += 10;
    
    // Table Data
    let subtotal = 0;
    invoiceData.loads.forEach(load => {
      if (yPos > 250) { // Start new page if needed
        doc.addPage();
        yPos = 30;
      }
      
      doc.setFontSize(9);
      doc.text(load.id.toString(), 20, yPos);
      doc.text((load.commodity || 'N/A').substring(0, 12), 45, yPos);
      doc.text(load.origin.substring(0, 15), 80, yPos);
      doc.text(load.destination.substring(0, 15), 120, yPos);
      doc.text(formatDate(load.delivery_date), 160, yPos);
      doc.text(formatCurrency(load.rate_customer), 185, yPos);
      
      subtotal += load.rate_customer;
      yPos += 12;
    });
    
    // Total Section
    yPos += 10;
    doc.line(140, yPos, 200, yPos);
    
    yPos += 10;
    doc.setFontSize(12);
    doc.text('Subtotal:', 160, yPos);
    doc.text(formatCurrency(subtotal), 185, yPos);
    
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 160, yPos);
    doc.text(formatCurrency(invoiceData.total_amount), 185, yPos);
    
    // Footer
    yPos += 30;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Payment Instructions:', 20, yPos);
    doc.text(`Please remit payment within ${invoiceData.payment_terms} days of invoice date.`, 20, yPos + 8);
    doc.text('Include invoice number on payment.', 20, yPos + 16);
    doc.text('For questions, contact billing@hollowaylogistics.com', 20, yPos + 24);
    
    doc.setFontSize(8);
    doc.text('Thank you for your business!', 85, yPos + 40);
    
    // Convert to buffer
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
    
  } catch (error) {
    console.error('Error in generateSimpleInvoicePDF:', error);
    throw error;
  }
}



function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}
