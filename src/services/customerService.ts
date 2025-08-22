import { supabase } from '@/lib/supabase';
import { Customer, CustomerWithLocations, CreateCustomerData, UpdateCustomerData, CustomerLocation } from '@/types/customers';

// Helper to get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Helper to set audit context for current user
const setAuditContext = async (): Promise<void> => {
  const userId = await getCurrentUserId();
  if (userId) {
    await supabase.rpc('set_current_user_for_audit', { user_id: userId });
  }
};

export class CustomerService {
  static async getAllCustomers(): Promise<CustomerWithLocations[]> {
    // TEMPORARY: Try with service role bypassing RLS
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        customer_locations (*)
      `)
      .order('name');

    if (error) {
      console.error('Error fetching customers:', error);
      console.error('RLS might be blocking access. Error details:', error);
      
      // Return empty array instead of throwing to prevent app crash
      return [];
    }

    console.log('Successfully fetched customers:', data?.length || 0);
    return data || [];
  }

  static async getCustomerById(id: number): Promise<CustomerWithLocations | null> {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        customer_locations (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      throw new Error('Failed to fetch customer');
    }

    return data;
  }

  static async createCustomer(customerData: CreateCustomerData): Promise<Customer> {
    const { locations, ...customerFields } = customerData;
    const userId = await getCurrentUserId();

    // Set audit context for automatic tracking
    await setAuditContext();

    // Insert customer with audit fields
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert([{
        ...customerFields,
        created_by: userId,
        updated_by: userId
      }])
      .select()
      .single();

    if (customerError) {
      console.error('Error creating customer:', customerError);
      throw new Error('Failed to create customer');
    }

    // Insert customer locations if provided
    if (locations && locations.length > 0) {
      const locationData = locations.map(location => ({
        customer_id: customer.id,
        ...location
      }));

      const { error: locationError } = await supabase
        .from('customer_locations')
        .insert(locationData);

      if (locationError) {
        console.error('Error creating customer locations:', locationError);
        // Note: We don't throw here as the customer was already created
      }
    }

    return customer;
  }

  static async updateCustomer(id: number, customerData: UpdateCustomerData): Promise<Customer> {
    const { locations, ...customerFields } = customerData;
    const userId = await getCurrentUserId();

    // Set audit context for automatic tracking
    await setAuditContext();

    // Update customer with audit fields
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .update({
        ...customerFields,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (customerError) {
      console.error('Error updating customer:', customerError);
      throw new Error('Failed to update customer');
    }

    // Update customer locations if provided
    if (locations !== undefined) {
      // First, delete existing locations
      const { error: deleteError } = await supabase
        .from('customer_locations')
        .delete()
        .eq('customer_id', id);

      if (deleteError) {
        console.error('Error deleting customer locations:', deleteError);
      }

      // Then, insert new locations with audit fields
      if (locations.length > 0) {
        const locationData = locations.map(location => ({
          customer_id: id,
          created_by: userId,
          updated_by: userId,
          ...location
        }));

        const { error: insertError } = await supabase
          .from('customer_locations')
          .insert(locationData);

        if (insertError) {
          console.error('Error creating customer locations:', insertError);
        }
      }
    }

    return customer;
  }

  static async deleteCustomer(id: number): Promise<void> {
    // Set audit context for automatic tracking
    await setAuditContext();
    
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      throw new Error('Failed to delete customer');
    }
  }

  static async searchCustomers(filters: {
    search?: string;
    payment_terms?: number | null;
    consolidated_invoicing?: boolean | null;
    has_credit_limit?: boolean | null;
    state?: string;
  }): Promise<CustomerWithLocations[]> {
    let query = supabase
      .from('customers')
      .select(`
        *,
        customer_locations (*)
      `);

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,primary_contact_name.ilike.%${filters.search}%,primary_contact_email.ilike.%${filters.search}%`);
    }

    if (filters.payment_terms !== undefined && filters.payment_terms !== null) {
      query = query.eq('payment_terms', filters.payment_terms);
    }

    if (filters.consolidated_invoicing !== undefined && filters.consolidated_invoicing !== null) {
      query = query.eq('consolidated_invoicing', filters.consolidated_invoicing);
    }

    if (filters.has_credit_limit !== undefined && filters.has_credit_limit !== null) {
      if (filters.has_credit_limit) {
        query = query.not('credit_limit', 'is', null);
      } else {
        query = query.is('credit_limit', null);
      }
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('Error searching customers:', error);
      throw new Error('Failed to search customers');
    }

    let customers = data;

    // Filter by state if specified (requires checking customer locations)
    if (filters.state) {
      customers = customers.filter(customer =>
        customer.customer_locations?.some((location: CustomerLocation) => location.state === filters.state)
      );
    }

    return customers;
  }

  static async getCustomersByState(state: string): Promise<CustomerWithLocations[]> {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        customer_locations!inner (*)
      `)
      .eq('customer_locations.state', state)
      .order('name');

    if (error) {
      console.error('Error fetching customers by state:', error);
      throw new Error('Failed to fetch customers by state');
    }

    return data;
  }

  static async addCustomerLocation(customerId: number, locationData: Omit<CustomerLocation, 'id' | 'customer_id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<CustomerLocation> {
    const userId = await getCurrentUserId();
    
    // Set audit context for automatic tracking
    await setAuditContext();
    
    const { data, error } = await supabase
      .from('customer_locations')
      .insert([{
        customer_id: customerId,
        created_by: userId,
        updated_by: userId,
        ...locationData
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding customer location:', error);
      throw new Error('Failed to add customer location');
    }

    return data;
  }

  static async updateCustomerLocation(id: number, locationData: Partial<Omit<CustomerLocation, 'id' | 'customer_id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>): Promise<CustomerLocation> {
    const userId = await getCurrentUserId();
    
    // Set audit context for automatic tracking
    await setAuditContext();
    
    const { data, error } = await supabase
      .from('customer_locations')
      .update({
        ...locationData,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer location:', error);
      throw new Error('Failed to update customer location');
    }

    return data;
  }

  static async deleteCustomerLocation(id: number): Promise<void> {
    // Set audit context for automatic tracking
    await setAuditContext();
    
    const { error } = await supabase
      .from('customer_locations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer location:', error);
      throw new Error('Failed to delete customer location');
    }
  }
}
