-- =====================================================================
-- Create Audit Functions for BulkFlow TMS
-- This script creates the audit functions referenced in the client services
-- =====================================================================

-- Create function to set current user for audit trails
CREATE OR REPLACE FUNCTION public.set_current_user_for_audit(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function sets the current user context for audit purposes
  -- In PostgreSQL, we can use session variables or just rely on auth.uid()
  -- For now, we'll make this a no-op since auth.uid() is available in RLS policies
  
  -- Optional: You could set a session variable if needed for more complex audit trails
  -- PERFORM set_config('app.current_user_id', user_id::text, true);
  
  RETURN;
END;
$$;

-- Create function to get current user for audit (if needed elsewhere)
CREATE OR REPLACE FUNCTION public.get_current_user_for_audit()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the current authenticated user ID
  RETURN auth.uid();
END;
$$;

-- Create audit trigger function for automatically tracking changes
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

-- Create audit trigger function for automatically setting created_by
CREATE OR REPLACE FUNCTION public.handle_created_by()
RETURNS trigger  
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.created_by = auth.uid();
  NEW.updated_by = auth.uid();
  NEW.created_at = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply audit triggers to tables that have audit fields
-- (Only add if triggers don't already exist)

-- Customers table
DROP TRIGGER IF EXISTS handle_customers_updated_at ON public.customers;
CREATE TRIGGER handle_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_customers_created_by ON public.customers;
CREATE TRIGGER handle_customers_created_by
  BEFORE INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_by();

-- Customer locations table
DROP TRIGGER IF EXISTS handle_customer_locations_updated_at ON public.customer_locations;
CREATE TRIGGER handle_customer_locations_updated_at
  BEFORE UPDATE ON public.customer_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_customer_locations_created_by ON public.customer_locations;
CREATE TRIGGER handle_customer_locations_created_by
  BEFORE INSERT ON public.customer_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_by();

-- Carriers table
DROP TRIGGER IF EXISTS handle_carriers_updated_at ON public.carriers;
CREATE TRIGGER handle_carriers_updated_at
  BEFORE UPDATE ON public.carriers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_carriers_created_by ON public.carriers;
CREATE TRIGGER handle_carriers_created_by
  BEFORE INSERT ON public.carriers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_by();

-- Drivers table
DROP TRIGGER IF EXISTS handle_drivers_updated_at ON public.drivers;
CREATE TRIGGER handle_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_drivers_created_by ON public.drivers;
CREATE TRIGGER handle_drivers_created_by
  BEFORE INSERT ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_by();

-- Trucks table
DROP TRIGGER IF EXISTS handle_trucks_updated_at ON public.trucks;
CREATE TRIGGER handle_trucks_updated_at
  BEFORE UPDATE ON public.trucks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_trucks_created_by ON public.trucks;
CREATE TRIGGER handle_trucks_created_by
  BEFORE INSERT ON public.trucks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_by();

-- Trailers table
DROP TRIGGER IF EXISTS handle_trailers_updated_at ON public.trailers;
CREATE TRIGGER handle_trailers_updated_at
  BEFORE UPDATE ON public.trailers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_trailers_created_by ON public.trailers;
CREATE TRIGGER handle_trailers_created_by
  BEFORE INSERT ON public.trailers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_by();

-- Loads table
DROP TRIGGER IF EXISTS handle_loads_updated_at ON public.loads;
CREATE TRIGGER handle_loads_updated_at
  BEFORE UPDATE ON public.loads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_loads_created_by ON public.loads;
CREATE TRIGGER handle_loads_created_by
  BEFORE INSERT ON public.loads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_by();

-- Invoices table
DROP TRIGGER IF EXISTS handle_invoices_updated_at ON public.invoices;
CREATE TRIGGER handle_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_invoices_created_by ON public.invoices;
CREATE TRIGGER handle_invoices_created_by
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_by();

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.set_current_user_for_audit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_for_audit() TO authenticated;

COMMIT;
