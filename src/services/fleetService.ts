import { supabase } from '@/lib/supabase';
import { 
  Truck, 
  Trailer, 
  Driver, 
  EquipmentType,
  TrailerWithEquipment,
  DriverWithTruck,
  TruckWithDriver,
  CreateTruckData,
  UpdateTruckData,
  CreateTrailerData,
  UpdateTrailerData,
  CreateDriverData,
  UpdateDriverData,
  TruckFilters,
  TrailerFilters,
  DriverFilters,
  ActiveDispatch
} from '@/types/fleet';

export class FleetService {
  // ==================== TRUCKS ====================
  static async getAllTrucks(): Promise<TruckWithDriver[]> {
    const { data, error } = await supabase
      .from('trucks')
      .select(`
        *,
        drivers (
          id,
          name,
          status
        )
      `)
      .order('truck_number');

    if (error) {
      console.error('Error fetching trucks:', error);
      throw new Error('Failed to fetch trucks');
    }

    return data.map(truck => ({
      ...truck,
      driver: truck.drivers?.[0] || null
    }));
  }

  static async getTruckById(id: number): Promise<TruckWithDriver | null> {
    const { data, error } = await supabase
      .from('trucks')
      .select(`
        *,
        drivers (
          id,
          name,
          phone,
          license_number,
          license_expiry_date,
          medical_card_expiry,
          status
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching truck:', error);
      throw new Error('Failed to fetch truck');
    }

    return {
      ...data,
      driver: data.drivers?.[0] || null
    };
  }

  static async createTruck(truckData: CreateTruckData): Promise<Truck> {
    // Only include fields that exist in the database schema
    const dbData = {
      truck_number: truckData.truck_number,
      license_plate: truckData.license_plate || null,
      status: truckData.status || 'Available'
    };

    const { data, error } = await supabase
      .from('trucks')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      // Handle specific database constraint violations
      if (error.code === '23505') { // Unique constraint violation
        if (error.message.includes('truck_number')) {
          throw new Error(`Truck number "${truckData.truck_number}" is already in use. Please choose a different unit number.`);
        } else if (error.message.includes('license_plate')) {
          throw new Error(`License plate "${truckData.license_plate}" is already registered to another truck.`);
        } else {
          throw new Error('This truck information already exists in the system.');
        }
      } else if (error.code === '23514') { // Check constraint violation
        if (error.message.includes('chk_truck_status')) {
          throw new Error('Invalid truck status. Please select Available, In Use, or Maintenance.');
        }
      } else if (error.code === '23502') { // Not null constraint violation
        throw new Error('Required truck information is missing. Please check that all required fields are filled.');
      }
      
      // Generic error for other cases
      throw new Error('Failed to create truck. Please check your information and try again.');
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    return data;
  }

  static async updateTruck(id: number, truckData: UpdateTruckData): Promise<Truck> {
    // Only include fields that exist in the database schema
    const dbData: Record<string, unknown> = {};
    if (truckData.truck_number !== undefined) dbData.truck_number = truckData.truck_number;
    if (truckData.license_plate !== undefined) dbData.license_plate = truckData.license_plate;
    if (truckData.status !== undefined) dbData.status = truckData.status;

    const { data, error } = await supabase
      .from('trucks')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Handle specific database constraint violations
      if (error.code === '23505') { // Unique constraint violation
        if (error.message.includes('truck_number')) {
          throw new Error(`Truck number "${truckData.truck_number}" is already in use. Please choose a different unit number.`);
        } else if (error.message.includes('license_plate')) {
          throw new Error(`License plate "${truckData.license_plate}" is already registered to another truck.`);
        } else {
          throw new Error('This truck information already exists in the system.');
        }
      } else if (error.code === '23514') { // Check constraint violation
        if (error.message.includes('chk_truck_status')) {
          throw new Error('Invalid truck status. Please select Available, In Use, or Maintenance.');
        }
      } else if (error.code === '23502') { // Not null constraint violation
        throw new Error('Required truck information is missing. Please check that all required fields are filled.');
      }
      
      // Generic error for other cases
      throw new Error('Failed to update truck. Please check your information and try again.');
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    return data;
  }

  static async deleteTruck(id: number): Promise<void> {
    const { error } = await supabase
      .from('trucks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting truck:', error);
      throw new Error('Failed to delete truck');
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }
  }

  static async searchTrucks(filters: TruckFilters): Promise<TruckWithDriver[]> {
    let query = supabase
      .from('trucks')
      .select(`
        *,
        drivers (
          id,
          name,
          status
        )
      `);

    // Apply filters
    if (filters.search) {
      query = query.or(`truck_number.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.maintenance_due) {
      const today = new Date().toISOString().split('T')[0];
      const upcoming = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      if (filters.maintenance_due === 'overdue') {
        query = query.lt('maintenance_due', today);
      } else if (filters.maintenance_due === 'upcoming') {
        query = query.gte('maintenance_due', today).lte('maintenance_due', upcoming);
      } else if (filters.maintenance_due === 'current') {
        query = query.or(`maintenance_due.is.null,maintenance_due.gt.${upcoming}`);
      }
    }

    const { data, error } = await query.order('truck_number');

    if (error) {
      console.error('Error searching trucks:', error);
      throw new Error('Failed to search trucks');
    }

    return data.map(truck => ({
      ...truck,
      driver: truck.drivers?.[0] || null
    }));
  }

  // ==================== TRAILERS ====================
  static async getAllTrailers(): Promise<TrailerWithEquipment[]> {
    const { data, error } = await supabase
      .from('trailers')
      .select(`
        *,
        equipment_types (
          id,
          name
        )
      `)
      .order('trailer_number');

    if (error) {
      console.error('Error fetching trailers:', error);
      throw new Error('Failed to fetch trailers');
    }

    return data.map(trailer => ({
      ...trailer,
      equipment_type: trailer.equipment_types || null
    }));
  }

  static async getTrailerById(id: number): Promise<TrailerWithEquipment | null> {
    const { data, error } = await supabase
      .from('trailers')
      .select(`
        *,
        equipment_types (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching trailer:', error);
      throw new Error('Failed to fetch trailer');
    }

    return {
      ...data,
      equipment_type: data.equipment_types || null
    };
  }

  static async createTrailer(trailerData: CreateTrailerData): Promise<Trailer> {
    // equipment_type_id is required in the database schema
    if (!trailerData.equipment_type_id) {
      throw new Error('Equipment type is required for trailers');
    }

    const dbData = {
      trailer_number: trailerData.trailer_number,
      license_plate: trailerData.license_plate || null,
      equipment_type_id: trailerData.equipment_type_id,
      status: trailerData.status || 'Available'
    };

    const { data, error } = await supabase
      .from('trailers')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      // Handle specific database constraint violations
      if (error.code === '23505') { // Unique constraint violation
        if (error.message.includes('trailer_number')) {
          throw new Error(`Trailer number "${trailerData.trailer_number}" is already in use. Please choose a different unit number.`);
        } else {
          throw new Error('This trailer information already exists in the system.');
        }
      } else if (error.code === '23503') { // Foreign key constraint violation
        if (error.message.includes('equipment_type_id')) {
          throw new Error('Invalid equipment type selected. Please choose a valid equipment type.');
        }
      } else if (error.code === '23514') { // Check constraint violation
        if (error.message.includes('chk_trailer_status')) {
          throw new Error('Invalid trailer status. Please select Available, In Use, or Maintenance.');
        }
      } else if (error.code === '23502') { // Not null constraint violation
        throw new Error('Required trailer information is missing. Please check that all required fields are filled.');
      }
      
      // Generic error for other cases
      throw new Error('Failed to create trailer. Please check your information and try again.');
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    return data;
  }

  static async updateTrailer(id: number, trailerData: UpdateTrailerData): Promise<Trailer> {
    // Only include fields that exist in the database schema
    const dbData: Record<string, unknown> = {};
    if (trailerData.trailer_number !== undefined) dbData.trailer_number = trailerData.trailer_number;
    if (trailerData.license_plate !== undefined) dbData.license_plate = trailerData.license_plate;
    if (trailerData.equipment_type_id !== undefined) dbData.equipment_type_id = trailerData.equipment_type_id;
    if (trailerData.status !== undefined) dbData.status = trailerData.status;

    const { data, error } = await supabase
      .from('trailers')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Handle specific database constraint violations
      if (error.code === '23505') { // Unique constraint violation
        if (error.message.includes('trailer_number')) {
          throw new Error(`Trailer number "${trailerData.trailer_number}" is already in use. Please choose a different unit number.`);
        } else {
          throw new Error('This trailer information already exists in the system.');
        }
      } else if (error.code === '23503') { // Foreign key constraint violation
        if (error.message.includes('equipment_type_id')) {
          throw new Error('Invalid equipment type selected. Please choose a valid equipment type.');
        }
      } else if (error.code === '23514') { // Check constraint violation
        if (error.message.includes('chk_trailer_status')) {
          throw new Error('Invalid trailer status. Please select Available, In Use, or Maintenance.');
        }
      } else if (error.code === '23502') { // Not null constraint violation
        throw new Error('Required trailer information is missing. Please check that all required fields are filled.');
      }
      
      // Generic error for other cases
      throw new Error('Failed to update trailer. Please check your information and try again.');
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    return data;
  }

  static async deleteTrailer(id: number): Promise<void> {
    const { error } = await supabase
      .from('trailers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting trailer:', error);
      throw new Error('Failed to delete trailer');
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }
  }

  static async searchTrailers(filters: TrailerFilters): Promise<TrailerWithEquipment[]> {
    let query = supabase
      .from('trailers')
      .select(`
        *,
        equipment_types (
          id,
          name
        )
      `);

    // Apply filters
    if (filters.search) {
      query = query.or(`trailer_number.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.maintenance_due) {
      const today = new Date().toISOString().split('T')[0];
      const upcoming = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      if (filters.maintenance_due === 'overdue') {
        query = query.lt('maintenance_due', today);
      } else if (filters.maintenance_due === 'upcoming') {
        query = query.gte('maintenance_due', today).lte('maintenance_due', upcoming);
      } else if (filters.maintenance_due === 'current') {
        query = query.or(`maintenance_due.is.null,maintenance_due.gt.${upcoming}`);
      }
    }

    const { data, error } = await query.order('trailer_number');

    if (error) {
      console.error('Error searching trailers:', error);
      throw new Error('Failed to search trailers');
    }

    let trailers = data.map(trailer => ({
      ...trailer,
      equipment_type: trailer.equipment_types || null
    }));

    // Filter by equipment type if specified
    if (filters.equipment_type) {
      trailers = trailers.filter(trailer =>
        trailer.equipment_type?.name === filters.equipment_type
      );
    }

    return trailers;
  }

  // ==================== DRIVERS ====================
  static async getAllDrivers(): Promise<DriverWithTruck[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        trucks (
          id,
          truck_number,
          status
        )
      `)
      .order('name');

    if (error) {
      console.error('Error fetching drivers:', error);
      throw new Error('Failed to fetch drivers');
    }

    return data.map(driver => ({
      ...driver,
      truck: driver.trucks || null
    }));
  }

  static async getDriverById(id: number): Promise<DriverWithTruck | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        trucks (
          id,
          truck_number,
          license_plate,
          status
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching driver:', error);
      throw new Error('Failed to fetch driver');
    }

    return {
      ...data,
      truck: data.trucks || null
    };
  }

  static async createDriver(driverData: CreateDriverData): Promise<Driver> {
    const dbData = {
      name: driverData.name,
      phone: driverData.phone || null,
      license_number: driverData.license_number || null,
      license_expiry_date: driverData.license_expiry_date || null,
      medical_card_expiry: driverData.medical_card_expiry || null,
      status: driverData.status || 'Active',
      truck_id: driverData.truck_id || null
    };

    const { data, error } = await supabase
      .from('drivers')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      // Handle specific database constraint violations
      if (error.code === '23505') { // Unique constraint violation
        if (error.message.includes('ux_driver_truck')) {
          throw new Error('This truck is already assigned to another driver. Please choose a different truck or unassign the current driver first.');
        } else {
          throw new Error('A driver with this information already exists in the system.');
        }
      } else if (error.code === '23503') { // Foreign key constraint violation
        if (error.message.includes('truck_id')) {
          throw new Error('Invalid truck selected. Please choose a valid truck or leave unassigned.');
        }
      } else if (error.code === '23514') { // Check constraint violation
        if (error.message.includes('chk_driver_status')) {
          throw new Error('Invalid driver status. Please select Active, On Leave, or Inactive.');
        }
      } else if (error.code === '23502') { // Not null constraint violation
        if (error.message.includes('name')) {
          throw new Error('Driver name is required. Please enter the driver\'s full name.');
        } else {
          throw new Error('Required driver information is missing. Please check that all required fields are filled.');
        }
      }
      
      // Generic error for other cases
      throw new Error('Failed to create driver. Please check your information and try again.');
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    return data;
  }

  static async updateDriver(id: number, driverData: UpdateDriverData): Promise<Driver> {
    // Only include fields that exist in the database schema
    const dbData: Record<string, unknown> = {};
    if (driverData.name !== undefined) dbData.name = driverData.name;
    if (driverData.phone !== undefined) dbData.phone = driverData.phone;
    if (driverData.license_number !== undefined) dbData.license_number = driverData.license_number;
    if (driverData.license_expiry_date !== undefined) dbData.license_expiry_date = driverData.license_expiry_date;
    if (driverData.medical_card_expiry !== undefined) dbData.medical_card_expiry = driverData.medical_card_expiry;
    if (driverData.status !== undefined) dbData.status = driverData.status;
    if (driverData.truck_id !== undefined) dbData.truck_id = driverData.truck_id;

    const { data, error } = await supabase
      .from('drivers')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Handle specific database constraint violations
      if (error.code === '23505') { // Unique constraint violation
        if (error.message.includes('ux_driver_truck')) {
          throw new Error('This truck is already assigned to another driver. Please choose a different truck or unassign the current driver first.');
        } else {
          throw new Error('A driver with this information already exists in the system.');
        }
      } else if (error.code === '23503') { // Foreign key constraint violation
        if (error.message.includes('truck_id')) {
          throw new Error('Invalid truck selected. Please choose a valid truck or leave unassigned.');
        }
      } else if (error.code === '23514') { // Check constraint violation
        if (error.message.includes('chk_driver_status')) {
          throw new Error('Invalid driver status. Please select Active, On Leave, or Inactive.');
        }
      } else if (error.code === '23502') { // Not null constraint violation
        if (error.message.includes('name')) {
          throw new Error('Driver name is required. Please enter the driver\'s full name.');
        } else {
          throw new Error('Required driver information is missing. Please check that all required fields are filled.');
        }
      }
      
      // Generic error for other cases
      throw new Error('Failed to update driver. Please check your information and try again.');
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    return data;
  }

  static async deleteDriver(id: number): Promise<void> {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting driver:', error);
      throw new Error('Failed to delete driver');
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }
  }

  static async searchDrivers(filters: DriverFilters): Promise<DriverWithTruck[]> {
    let query = supabase
      .from('drivers')
      .select(`
        *,
        trucks (
          id,
          truck_number,
          status
        )
      `);

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,license_number.ilike.%${filters.search}%`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.assigned !== undefined) {
      if (filters.assigned) {
        query = query.not('truck_id', 'is', null);
      } else {
        query = query.is('truck_id', null);
      }
    }

    if (filters.license_expiry || filters.medical_card_expiry) {
      const today = new Date().toISOString().split('T')[0];
      const upcoming = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      if (filters.license_expiry === 'expired') {
        query = query.lt('license_expiry_date', today);
      } else if (filters.license_expiry === 'expiring') {
        query = query.gte('license_expiry_date', today).lte('license_expiry_date', upcoming);
      }

      if (filters.medical_card_expiry === 'expired') {
        query = query.lt('medical_card_expiry', today);
      } else if (filters.medical_card_expiry === 'expiring') {
        query = query.gte('medical_card_expiry', today).lte('medical_card_expiry', upcoming);
      }
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('Error searching drivers:', error);
      throw new Error('Failed to search drivers');
    }

    return data.map(driver => ({
      ...driver,
      truck: driver.trucks || null
    }));
  }

  // ==================== EQUIPMENT TYPES ====================
  static async getEquipmentTypes(): Promise<EquipmentType[]> {
    const { data, error } = await supabase
      .from('equipment_types')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching equipment types:', error);
      throw new Error('Failed to fetch equipment types');
    }

    return data;
  }

  // ==================== ACTIVE DISPATCH ====================
  static async getActiveDispatch(): Promise<ActiveDispatch[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        id,
        name,
        phone,
        status,
        trucks (
          id,
          truck_number,
          status
        )
      `)
      .eq('status', 'Active');

    if (error) {
      console.error('Error fetching active dispatch:', error);
      throw new Error('Failed to fetch active dispatch');
    }

    // For each active driver, get their current loads separately to avoid join conflicts
    const driversWithLoads = await Promise.all(
      data.map(async (driver: { id: number; name: string; phone: string | null; status: string; trucks: { id: number; truck_number: string; status: string }[] }) => {
        // Get current loads for this driver
        const { data: loads, error: loadsError } = await supabase
          .from('loads')
          .select(`
            id,
            status,
            commodity,
            origin_location:customer_locations!loads_origin_location_id_fkey (
              city,
              state
            ),
            destination_location:customer_locations!loads_destination_location_id_fkey (
              city,
              state
            )
          `)
          .eq('driver_id', driver.id)
          .in('status', ['In Transit', 'Pending Pickup']);

        if (loadsError) {
          console.warn(`Error fetching loads for driver ${driver.id}:`, loadsError);
        }

        // Find active load for this driver
        const activeLoad = loads?.[0]; // Take the first active load

        return {
          driver_id: driver.id,
          driver_name: driver.name,
          driver_phone: driver.phone,
          truck: Array.isArray(driver.trucks) ? driver.trucks[0] as Partial<Truck> : driver.trucks as Partial<Truck>,
          current_load: activeLoad ? {
            load_id: `BF-${activeLoad.id}`,
            status: activeLoad.status,
            commodity: activeLoad.commodity,
            origin: activeLoad.origin_location ? 
              (Array.isArray(activeLoad.origin_location) 
                ? `${(activeLoad.origin_location[0] as { city?: string; state?: string })?.city}, ${(activeLoad.origin_location[0] as { city?: string; state?: string })?.state}`
                : `${(activeLoad.origin_location as { city?: string; state?: string })?.city}, ${(activeLoad.origin_location as { city?: string; state?: string })?.state}`)
              : 'N/A',
            destination: activeLoad.destination_location ? 
              (Array.isArray(activeLoad.destination_location)
                ? `${(activeLoad.destination_location[0] as { city?: string; state?: string })?.city}, ${(activeLoad.destination_location[0] as { city?: string; state?: string })?.state}`
                : `${(activeLoad.destination_location as { city?: string; state?: string })?.city}, ${(activeLoad.destination_location as { city?: string; state?: string })?.state}`)
              : 'N/A'
          } : null,
          available_hours: driver.trucks ? `${Math.floor(Math.random() * 8) + 4}h ${Math.floor(Math.random() * 60)}m` : 'N/A',
          status: driver.status
        };
      })
    );

    return driversWithLoads as ActiveDispatch[];
  }

  // ==================== UTILITY FUNCTIONS ====================
  static async getAvailableTrucks(): Promise<Truck[]> {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('status', 'Available')
      .order('truck_number');

    if (error) {
      console.error('Error fetching available trucks:', error);
      throw new Error('Failed to fetch available trucks');
    }

    return data;
  }

  static async assignDriverToTruck(driverId: number, truckId: number | null): Promise<void> {
    const { error } = await supabase
      .from('drivers')
      .update({ truck_id: truckId })
      .eq('id', driverId);

    if (error) {
      console.error('Error assigning driver to truck:', error);
      throw new Error('Failed to assign driver to truck');
    }
  }
}
