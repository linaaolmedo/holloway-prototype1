import { supabase } from '@/lib/supabase';
import { 
  LoadWithDetails, 
  CreateLoadData, 
  UpdateLoadData, 
  LoadFilters,
  LoadStatus,
  Customer,
  CustomerLocation,
  Carrier,
  EquipmentType,
  Driver,
  Truck,
  Trailer
} from '@/types/loads';

export class LoadService {
  // Get all loads with related data
  static async getLoads(filters?: LoadFilters): Promise<LoadWithDetails[]> {
    let query = supabase
      .from('loads')
      .select(`
        *,
        customer:customers(*),
        origin_location:customer_locations!origin_location_id(*),
        destination_location:customer_locations!destination_location_id(*),
        equipment_type:equipment_types(*),
        carrier:carriers(*),
        driver:drivers(*),
        truck:trucks(*),
        trailer:trailers(*)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters.carrier_id) {
        query = query.eq('carrier_id', filters.carrier_id);
      }
      if (filters.equipment_type_id) {
        query = query.eq('equipment_type_id', filters.equipment_type_id);
      }
      if (filters.pickup_date_from) {
        query = query.gte('pickup_date', filters.pickup_date_from);
      }
      if (filters.pickup_date_to) {
        query = query.lte('pickup_date', filters.pickup_date_to);
      }
      if (filters.delivery_date_from) {
        query = query.gte('delivery_date', filters.delivery_date_from);
      }
      if (filters.delivery_date_to) {
        query = query.lte('delivery_date', filters.delivery_date_to);
      }
      if (filters.search) {
        query = query.or(`commodity.ilike.%${filters.search}%,customer.name.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch loads: ${error.message}`);
    }

    return data || [];
  }

  // Get a single load by ID with related data
  static async getLoadById(id: number): Promise<LoadWithDetails | null> {
    const { data, error } = await supabase
      .from('loads')
      .select(`
        *,
        customer:customers(*),
        origin_location:customer_locations!origin_location_id(*),
        destination_location:customer_locations!destination_location_id(*),
        equipment_type:equipment_types(*),
        carrier:carriers(*),
        driver:drivers(*),
        truck:trucks(*),
        trailer:trailers(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No row found
      }
      throw new Error(`Failed to fetch load: ${error.message}`);
    }

    return data;
  }

  // Create a new load
  static async createLoad(loadData: CreateLoadData): Promise<LoadWithDetails> {
    const { data, error } = await supabase
      .from('loads')
      .insert([{
        ...loadData,
        status: 'Pending Pickup',
        pod_uploaded: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select(`
        *,
        customer:customers(*),
        origin_location:customer_locations!origin_location_id(*),
        destination_location:customer_locations!destination_location_id(*),
        equipment_type:equipment_types(*),
        carrier:carriers(*),
        driver:drivers(*),
        truck:trucks(*),
        trailer:trailers(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create load: ${error.message}`);
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    return data;
  }

  // Update an existing load
  static async updateLoad(id: number, loadData: UpdateLoadData): Promise<LoadWithDetails> {
    const { data, error } = await supabase
      .from('loads')
      .update({
        ...loadData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        customer:customers(*),
        origin_location:customer_locations!origin_location_id(*),
        destination_location:customer_locations!destination_location_id(*),
        equipment_type:equipment_types(*),
        carrier:carriers(*),
        driver:drivers(*),
        truck:trucks(*),
        trailer:trailers(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update load: ${error.message}`);
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    return data;
  }

  // Delete a load
  static async deleteLoad(id: number): Promise<void> {
    const { error } = await supabase
      .from('loads')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete load: ${error.message}`);
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }
  }

  // Get supporting data for forms
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

  static async getCustomerLocations(customerId?: number): Promise<CustomerLocation[]> {
    let query = supabase
      .from('customer_locations')
      .select('*')
      .order('location_name');

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch customer locations: ${error.message}`);
    }

    return data || [];
  }

  static async getCarriers(): Promise<Carrier[]> {
    const { data, error } = await supabase
      .from('carriers')
      .select('*')
      .eq('dnu_flag', false)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch carriers: ${error.message}`);
    }

    return data || [];
  }

  static async getEquipmentTypes(): Promise<EquipmentType[]> {
    const { data, error } = await supabase
      .from('equipment_types')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch equipment types: ${error.message}`);
    }

    return data || [];
  }

  static async getDrivers(): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', 'Active')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch drivers: ${error.message}`);
    }

    return data || [];
  }

  static async getTrucks(): Promise<Truck[]> {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('status', 'Available')
      .order('truck_number');

    if (error) {
      throw new Error(`Failed to fetch trucks: ${error.message}`);
    }

    return data || [];
  }

  static async getTrailers(): Promise<Trailer[]> {
    // First get all trailers to debug
    const { data: allTrailers, error: allError } = await supabase
      .from('trailers')
      .select('*')
      .order('trailer_number');

    if (allError) {
      console.error('Error fetching all trailers:', allError);
    } else {
      console.log('🚛 All trailers in database:', allTrailers);
      console.log('🚛 Trailer statuses:', allTrailers?.map(t => ({ id: t.id, number: t.trailer_number, status: t.status })));
    }

    const { data, error } = await supabase
      .from('trailers')
      .select('*')
      .eq('status', 'Available')
      .order('trailer_number');

    if (error) {
      throw new Error(`Failed to fetch trailers: ${error.message}`);
    }

    console.log('🚛 Available trailers returned:', data);

    return data || [];
  }

  // Bulk operations
  static async bulkUpdateStatus(loadIds: number[], status: string): Promise<void> {
    const { error } = await supabase
      .from('loads')
      .update({ 
        status,
        updated_at: new Date().toISOString() 
      })
      .in('id', loadIds);

    if (error) {
      throw new Error(`Failed to bulk update loads: ${error.message}`);
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }
  }

  static async bulkDelete(loadIds: number[]): Promise<void> {
    const { error } = await supabase
      .from('loads')
      .delete()
      .in('id', loadIds);

    if (error) {
      throw new Error(`Failed to bulk delete loads: ${error.message}`);
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }
  }

  // Carrier-specific methods for carrier portal

  // Get loads assigned to a specific carrier
  static async getCarrierLoads(carrierId: number): Promise<LoadWithDetails[]> {
    return this.getLoads({ carrier_id: carrierId });
  }

  // Get loads available for bidding (unassigned loads)
  static async getAvailableLoadsForBidding(): Promise<LoadWithDetails[]> {
    const query = supabase
      .from('loads')
      .select(`
        *,
        customer:customers(*),
        origin_location:customer_locations!origin_location_id(*),
        destination_location:customer_locations!destination_location_id(*),
        equipment_type:equipment_types(*)
      `)
      .is('carrier_id', null) // Only unassigned loads
      .in('status', ['Pending Pickup']) // Only loads pending pickup
      .order('pickup_date', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch available loads: ${error.message}`);
    }

    return data || [];
  }

  // Update load status (useful for carriers updating their assigned loads)
  static async updateLoadStatus(id: number, status: string): Promise<LoadWithDetails> {
    return this.updateLoad(id, { status: status as LoadStatus });
  }

  // Mark POD as uploaded
  static async markPODUploaded(id: number): Promise<LoadWithDetails> {
    return this.updateLoad(id, { pod_uploaded: true });
  }

  // Assign carrier to load (used when accepting bids)
  static async assignCarrierToLoad(loadId: number, carrierId: number): Promise<LoadWithDetails> {
    return this.updateLoad(loadId, { carrier_id: carrierId });
  }

  // Remove carrier assignment from load
  static async unassignCarrierFromLoad(loadId: number): Promise<LoadWithDetails> {
    return this.updateLoad(loadId, { carrier_id: undefined });
  }

  // Assign internal fleet to load (driver + truck + trailer)
  static async assignInternalFleet(
    loadId: number, 
    driverId: number, 
    truckId: number, 
    trailerId: number
  ): Promise<LoadWithDetails> {
    // Update the load with internal fleet assignment
    const { data, error } = await supabase
      .from('loads')
      .update({
        driver_id: driverId,
        truck_id: truckId,
        trailer_id: trailerId,
        carrier_id: null, // Clear any carrier assignment
        status: 'In Transit',
        updated_at: new Date().toISOString()
      })
      .eq('id', loadId)
      .select(`
        *,
        customer:customers(*),
        origin_location:customer_locations!origin_location_id(*),
        destination_location:customer_locations!destination_location_id(*),
        equipment_type:equipment_types(*),
        carrier:carriers(*),
        driver:drivers(*),
        truck:trucks(*),
        trailer:trailers(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to assign internal fleet: ${error.message}`);
    }

    // Update truck and trailer status to 'In Use'
    await Promise.all([
      supabase.from('trucks').update({ status: 'In Use' }).eq('id', truckId),
      supabase.from('trailers').update({ status: 'In Use' }).eq('id', trailerId)
    ]);

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    return data;
  }

  // Assign carrier to load (external assignment)
  static async assignCarrier(loadId: number, carrierId: number): Promise<LoadWithDetails> {
    const { data, error } = await supabase
      .from('loads')
      .update({
        carrier_id: carrierId,
        driver_id: null, // Clear internal fleet assignment
        truck_id: null,
        trailer_id: null,
        status: 'Pending Pickup',
        updated_at: new Date().toISOString()
      })
      .eq('id', loadId)
      .select(`
        *,
        customer:customers(*),
        origin_location:customer_locations!origin_location_id(*),
        destination_location:customer_locations!destination_location_id(*),
        equipment_type:equipment_types(*),
        carrier:carriers(*),
        driver:drivers(*),
        truck:trucks(*),
        trailer:trailers(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to assign carrier: ${error.message}`);
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    return data;
  }

  // Unassign load (remove all assignments)
  static async unassignLoad(loadId: number): Promise<LoadWithDetails> {
    // First get the current assignment to release resources
    const currentLoad = await this.getLoadById(loadId);
    if (!currentLoad) {
      throw new Error('Load not found');
    }

    // Release truck and trailer if they were assigned
    if (currentLoad.truck_id) {
      await supabase.from('trucks').update({ status: 'Available' }).eq('id', currentLoad.truck_id);
    }
    if (currentLoad.trailer_id) {
      await supabase.from('trailers').update({ status: 'Available' }).eq('id', currentLoad.trailer_id);
    }

    return this.updateLoad(loadId, {
      carrier_id: undefined,
      driver_id: undefined,
      truck_id: undefined,
      trailer_id: undefined,
      status: 'Pending Pickup'
    });
  }
}
