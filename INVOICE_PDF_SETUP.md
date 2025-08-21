# Invoice PDF Generation Setup

This document outlines the setup process for invoice PDF generation functionality using Supabase storage and MCP server.

## Overview

The invoice PDF generation system allows users to:
- Automatically generate PDF invoices when creating new invoices
- Download PDF invoices from the billing table
- Store PDFs securely in Supabase storage
- Regenerate PDFs if needed

## Prerequisites

1. **Supabase Project**: Active Supabase project with storage enabled
2. **MCP Server**: Running MCP server with PDF generation capability
3. **Environment Variables**: Proper configuration

## Setup Steps

### 1. Database Setup

Run the SQL script to set up the storage bucket and policies:

```bash
# Run this in your Supabase SQL Editor
cat setup_invoice_storage.sql
```

This will:
- Create the `invoices` storage bucket
- Set up RLS policies for authenticated users
- Add `pdf_path` column to the `invoices` table
- Create necessary indexes

### 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# MCP Server Configuration
MCP_SERVER_URL=http://localhost:3001  # Your MCP server URL
MCP_SERVER_TOKEN=your_mcp_server_token  # Your MCP server authentication token

# Supabase Configuration (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. MCP Server Setup

Your MCP server should expose a PDF generation endpoint at `/pdf/generate` that accepts:

```json
{
  "html": "HTML content to convert",
  "options": {
    "format": "A4",
    "margin": {
      "top": "20mm",
      "bottom": "20mm", 
      "left": "15mm",
      "right": "15mm"
    },
    "printBackground": true,
    "displayHeaderFooter": false
  }
}
```

And returns the PDF as binary data.

### 4. Supabase Storage Bucket Configuration

1. Go to your Supabase Dashboard
2. Navigate to Storage
3. Verify the `invoices` bucket was created
4. Ensure proper RLS policies are applied

## Usage

### Automatic PDF Generation

PDFs are automatically generated when:
- Creating new invoices through the billing interface
- The generation happens asynchronously to avoid blocking the UI

### Manual PDF Download

Users can download PDFs by:
1. Going to the billing page
2. Switching to "Outstanding" or "Paid" tabs
3. Clicking the download button (purple icon) in the Actions column
4. If PDF doesn't exist, it will be generated on-demand

### PDF Features

Generated PDFs include:
- Professional invoice layout with company branding
- Complete customer information
- Detailed load information (origin, destination, dates)
- Proper totaling and formatting
- Payment terms and instructions
- Status indicators (paid/outstanding)

## File Structure

```
src/
├── app/api/generate-pdf/
│   └── route.ts              # PDF generation API endpoint
├── services/
│   ├── pdfService.ts         # PDF generation and storage service
│   └── billingService.ts     # Updated with PDF functionality
├── components/billing/
│   └── BillingTable.tsx      # Updated with download button
├── types/
│   └── billing.ts            # Updated with PDF-related types
└── app/dashboard/billing/
    └── page.tsx              # Updated with download handler
```

## Security Considerations

1. **Storage Policies**: PDFs are protected by RLS policies
2. **Authentication**: Only authenticated users can access PDFs
3. **Signed URLs**: Download URLs expire after 1 hour
4. **File Validation**: Only PDF files are allowed in the storage bucket

## Troubleshooting

### PDF Generation Fails
- Check MCP server is running and accessible
- Verify MCP server token is correct
- Check console for HTML rendering errors

### Storage Upload Fails
- Verify Supabase storage is enabled
- Check storage bucket exists and has correct policies
- Ensure user is authenticated

### Download Fails
- Check if PDF exists in storage
- Verify signed URL generation is working
- Check browser console for errors

### Performance Considerations
- PDFs are generated asynchronously to avoid blocking
- Large invoices with many loads may take longer to generate
- Consider implementing background job processing for high volume

## Future Enhancements

- Email PDF directly to customers
- Bulk PDF generation for multiple invoices
- PDF customization options (templates, branding)
- Automatic PDF archival and cleanup
- Integration with accounting systems
