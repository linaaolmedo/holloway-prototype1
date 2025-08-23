# 🔧 **CRITICAL: Environment Setup Instructions**

## 📋 **Step-by-Step Setup Guide**

### **1. Create Local Environment File**

Create `.env.local` file in your project root:

```bash
# Supabase Configuration (REQUIRED)
# Get these from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (CRITICAL for PDF generation and advanced features)
# Get from: Supabase Dashboard → Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Site URL for password resets
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### **2. Configure Vercel Environment Variables**

Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Add these variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |

### **3. Get Your Supabase Keys**

1. **Go to**: [Supabase Dashboard](https://supabase.com/dashboard)
2. **Select your project**
3. **Navigate to**: Settings → API
4. **Copy these keys**:
   - **Project URL**: Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - **service_role**: Use for `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **CRITICAL**

### **4. Verify Setup**

Run the environment checker:
```bash
node check-env.js
```

Or test the health check API after starting your dev server:
```bash
npm run dev
# Then visit: http://localhost:3000/api/health
```

## 🚨 **Common Issues & Solutions**

### **Issue: "useAuth must be used within an AuthProvider"**
- **Cause**: AuthContext import mismatch or missing environment variables
- **Fix**: Verify all environment variables are set correctly

### **Issue: "NULL role" in debug panel**  
- **Cause**: User profile doesn't exist in database
- **Fix**: Run `FIX_NULL_ROLE.sql` in Supabase SQL Editor

### **Issue: "No data loading" / Empty dashboard**
- **Cause**: Database RLS policies blocking access
- **Fix**: Run `COMPREHENSIVE_VERCEL_FIXES_CORRECTED.sql` in Supabase SQL Editor

### **Issue: PDF generation fails**
- **Cause**: Missing `SUPABASE_SERVICE_ROLE_KEY` environment variable
- **Fix**: Add the service role key to both `.env.local` and Vercel

## 🔍 **Debug Mode**

After setup, use the built-in debug panel:
1. **Go to**: Dashboard in your app
2. **Click**: 🔍 Debug button (top right)
3. **Check**: All status indicators should be green ✅
4. **Fix**: Any red ❌ indicators using the guidance above

## ✅ **Success Criteria**

Your setup is complete when:
- ✅ Environment checker shows all variables are set
- ✅ API health check returns `"status": "healthy"`
- ✅ Debug panel shows all green indicators
- ✅ Dashboard loads data without errors
- ✅ All functionality works (customers, billing, PDFs, etc.)

---

**🆘 Need Help?** 
- Check the debug panel for specific guidance
- Look at browser console for detailed error messages
- Verify database fixes have been applied
