# 🔧 Environment Setup for PDF Generation

## ⚡ Quick Fix for Current Error

The PDF generation is failing because of missing environment variables. Here's how to fix it:

### 1. **Add Environment Variable**

Create or update your `.env.local` file in the project root with:

```bash
# Your existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ADD THIS - Required for PDF storage
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. **Get Your Service Role Key**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the **`service_role`** key (NOT the anon public key)
5. Add it to your `.env.local` file

### 3. **Restart Development Server**

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

## 🎯 **What's Fixed**

- ✅ **jsPDF Integration** - Professional PDF generation without external dependencies
- ✅ **Supabase Storage** - Direct upload to your "invoices" bucket
- ✅ **Better Error Handling** - Clearer error messages and debugging

## 📋 **Updated PDF Features**

### **Professional Layout:**
- Company header with Holloway Logistics branding
- Invoice details (number, dates, status)
- Customer billing information
- Detailed load breakdown table
- Payment terms and instructions
- Professional formatting with colors

### **Technical Improvements:**
- Uses jsPDF library (already installed)
- No external MCP server dependencies
- Direct Supabase storage integration
- Proper error handling and logging

## 🚀 **Test After Setup**

1. **Create a new invoice** → Should work without errors
2. **Click "Download PDF"** → Should generate and download PDF
3. **Check Supabase Storage** → PDF should appear in "invoices" bucket

## 🔧 **If Still Getting Errors**

Check the browser console for specific error messages. The most common issues are:

1. **Missing SUPABASE_SERVICE_ROLE_KEY** - Add the service role key
2. **Wrong Supabase URL** - Verify your project URL
3. **Storage bucket permissions** - Ensure RLS policies are set up

## 📞 **Need Help?**

If you're still getting errors after setting up the environment variable, share the specific error message from the console and I can help debug further!
