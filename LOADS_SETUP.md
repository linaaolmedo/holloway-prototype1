# Loads CRUD System Setup Guide

This guide explains how to set up and use the comprehensive loads management system for the Holloway TMS dashboard.

## Features

✅ **Complete CRUD Operations**
- Create new loads with detailed form validation
- Edit existing loads with dynamic field updates
- Delete individual loads or bulk delete multiple loads
- View comprehensive load details

✅ **Advanced Filtering & Search**
- Real-time search across commodities and customers
- Filter by status, customer, equipment type, dates
- Advanced filter panel with date range selectors
- Quick status filters for rapid navigation

✅ **Professional UI**
- Dark theme matching dashboard design
- Responsive table with horizontal scrolling
- Loading skeletons and error handling
- Modal-based forms with validation

✅ **Bulk Operations**
- Select multiple loads with checkboxes
- Bulk status updates for multiple loads
- Bulk delete with confirmation
- Clear selection functionality

✅ **Data Relationships**
- Customer and location management
- Equipment type assignments
- Carrier vs internal fleet assignments
- Rate and margin calculations

## Environment Setup

### 1. Supabase Configuration

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your Supabase project dashboard:
- Go to [Supabase Dashboard](https://app.supabase.com)
- Select your project
- Go to Settings > API
- Copy the Project URL and anon/public key

### 2. Database Schema

Apply the provided database schema from `TMS-database-schema.md` to your Supabase project:

1. Go to Supabase Dashboard > SQL Editor
2. Copy and paste the entire schema from `TMS-database-schema.md`
3. Run the SQL to create all tables and relationships

### 3. Sample Data (Optional)

For testing purposes, you can add sample data:

```sql
-- Sample customers
INSERT INTO customers (name, primary_contact_name, primary_contact_email, primary_contact_phone) VALUES
('Agri-King Inc', 'John Smith', 'john@agri-king.com', '555-0001'),
('Golden Valley Produce', 'Sarah Johnson', 'sarah@goldenvalley.com', '555-0002'),
('Summit Logistics', 'Mike Brown', 'mike@summit.com', '555-0003');

-- Sample customer locations
INSERT INTO customer_locations (customer_id, location_name, city, state, postal_code) VALUES
(1, 'Main Facility', 'Boise', 'ID', '83702'),
(1, 'Secondary Plant', 'Portland', 'OR', '97209'),
(2, 'Warehouse', 'Sacramento', 'CA', '95814'),
(3, 'Distribution Center', 'Phoenix', 'AZ', '85007');

-- Sample carriers
INSERT INTO carriers (name, mc_number, primary_contact_name) VALUES
('Holloway Logistics', 'MC123456', 'Bob Wilson'),
('TBD Transport', 'MC789012', 'Lisa Davis');
```

## Usage Guide

### Creating Loads

1. Click the "Add Load" button in the top right
2. Fill in the required fields:
   - **Customer**: Select from existing customers
   - **Origin/Destination**: Choose locations (filtered by selected customer)
   - **Equipment Type**: Select appropriate equipment
3. Optional fields:
   - Commodity description
   - Weight in pounds
   - Pickup and delivery dates
   - Customer and carrier rates
4. Choose assignment type:
   - **External Carrier**: Assign to a third-party carrier
   - **Own Fleet**: Assign driver, truck, and trailer from your fleet

### Filtering and Search

- **Quick Search**: Use the search bar for commodities and customers
- **Status Filters**: Click status buttons for quick filtering
- **Advanced Filters**: Click "Filters" to expand date ranges and detailed options
- **Clear Filters**: Reset all filters with the "Clear All Filters" button

### Bulk Operations

1. Select loads using checkboxes in the table
2. Bulk actions bar appears when loads are selected
3. Available operations:
   - **Update Status**: Change status for all selected loads
   - **Delete**: Remove multiple loads at once
   - **Clear Selection**: Deselect all loads

### Table Features

- **Sorting**: Click column headers to sort
- **Load ID**: Shows formatted load numbers (BF-0001, BF-0002, etc.)
- **Margin Calculation**: Automatically calculates profit margins
- **Status Badges**: Color-coded status indicators
- **Actions**: View, edit, and delete buttons for each load

## Component Architecture

```
src/
├── app/dashboard/loads/
│   └── page.tsx                 # Main loads page
├── components/loads/
│   ├── LoadsTable.tsx           # Data table component
│   ├── LoadsFilters.tsx         # Search and filter controls
│   ├── LoadFormModal.tsx        # Create/edit modal form
│   ├── DeleteConfirmationModal.tsx # Delete confirmation
│   ├── BulkActions.tsx          # Bulk operation controls
│   └── LoadingSkeleton.tsx      # Loading state component
├── services/
│   └── loadService.ts           # API service layer
├── types/
│   └── loads.ts                 # TypeScript interfaces
└── lib/
    └── supabase.ts              # Database client
```

## API Integration

The system uses Supabase for all database operations:

- **Real-time**: Automatically updates when data changes
- **Row Level Security**: Secure access to data
- **Relationships**: Proper foreign key relationships
- **Performance**: Optimized queries with joins

## Error Handling

- **Network Errors**: Graceful handling of connection issues
- **Validation Errors**: Client-side form validation
- **Server Errors**: User-friendly error messages
- **Loading States**: Skeleton loaders during data fetching

## Customization

### Adding Fields

1. Update the database schema in Supabase
2. Add field to TypeScript interfaces in `src/types/loads.ts`
3. Update the form in `LoadFormModal.tsx`
4. Add column to table in `LoadsTable.tsx`

### Styling

The system uses Tailwind CSS with a dark theme. Key colors:
- Primary: Red (#DC2626)
- Background: Gray-900/800
- Text: White/Gray-300
- Borders: Gray-700

### New Features

The modular architecture makes it easy to add:
- Export functionality
- Print capabilities
- Advanced reporting
- Real-time notifications
- Mobile responsiveness

## Troubleshooting

### Common Issues

1. **Supabase Connection**: Verify environment variables
2. **Database Errors**: Check schema is properly applied
3. **TypeScript Errors**: Ensure all types are properly imported
4. **Styling Issues**: Verify Tailwind CSS is configured

### Support

For additional help:
1. Check Supabase dashboard for database issues
2. Review browser console for JavaScript errors
3. Verify network requests in developer tools
4. Ensure all dependencies are installed: `npm install`

## Performance Tips

- Use filters to limit large datasets
- Leverage the search functionality for quick finds
- Take advantage of bulk operations for efficiency
- Monitor Supabase usage in the dashboard

---

The loads CRUD system provides a complete foundation for managing transportation loads with room for future enhancements and customizations.
