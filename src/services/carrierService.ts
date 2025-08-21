import { supabase } from '@/lib/supabase';
import { Carrier, CarrierWithEquipment, CreateCarrierData, UpdateCarrierData, EquipmentType } from '@/types/carriers';

export class CarrierService {
  static async getAllCarriers(): Promise<CarrierWithEquipment[]> {
    const { data, error } = await supabase
      .from('carriers')
      .select(`
        *,
        carrier_equipment_types (
          equipment_type_id,
          equipment_types (
            id,
            name
          )
        )
      `)
      .order('name');

    if (error) {
      console.error('Error fetching carriers:', error);
      throw new Error('Failed to fetch carriers');
    }

    // Transform the data to include equipment_types directly
    return data.map(carrier => ({
      ...carrier,
      equipment_types: carrier.carrier_equipment_types?.map(
        (cet: any) => cet.equipment_types
      ) || []
    }));
  }

  static async getCarrierById(id: number): Promise<CarrierWithEquipment | null> {
    const { data, error } = await supabase
      .from('carriers')
      .select(`
        *,
        carrier_equipment_types (
          equipment_type_id,
          equipment_types (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching carrier:', error);
      throw new Error('Failed to fetch carrier');
    }

    return {
      ...data,
      equipment_types: data.carrier_equipment_types?.map(
        (cet: any) => cet.equipment_types
      ) || []
    };
  }

  static async createCarrier(carrierData: CreateCarrierData): Promise<Carrier> {
    const { equipment_type_ids, ...carrierFields } = carrierData;

    // Check for duplicate MC number before creating
    if (carrierFields.mc_number) {
      const isDuplicate = await this.validateMCNumber(carrierFields.mc_number);
      if (!isDuplicate) {
        throw new Error(`MC number ${carrierFields.mc_number} is already in use by another active carrier`);
      }
    }

    // Insert carrier
    const { data: carrier, error: carrierError } = await supabase
      .from('carriers')
      .insert([carrierFields])
      .select()
      .single();

    if (carrierError) {
      console.error('Error creating carrier:', carrierError);
      if (carrierError.code === '23505') {
        throw new Error('A carrier with this information already exists');
      }
      throw new Error('Failed to create carrier. Please check your information and try again.');
    }

    // Insert equipment type relationships if provided
    if (equipment_type_ids && equipment_type_ids.length > 0) {
      const equipmentData = equipment_type_ids.map(equipment_type_id => ({
        carrier_id: carrier.id,
        equipment_type_id
      }));

      const { error: equipmentError } = await supabase
        .from('carrier_equipment_types')
        .insert(equipmentData);

      if (equipmentError) {
        console.error('Error creating carrier equipment types:', equipmentError);
        console.log('Equipment data that failed to insert:', equipmentData);
        
        // If this is an RLS policy issue, don't fail the entire operation
        if (equipmentError.message?.includes('policy') || equipmentError.code === '42501') {
          console.warn('RLS policy prevented equipment type assignment - carrier created without equipment types');
          // Don't throw error - let the carrier be created successfully
        } else {
          // For other errors, still create the carrier but warn about equipment types
          console.warn('Carrier created successfully but equipment types could not be assigned:', equipmentError);
        }
      }
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    return carrier;
  }

  static async updateCarrier(id: number, carrierData: UpdateCarrierData): Promise<Carrier> {
    const { equipment_type_ids, ...carrierFields } = carrierData;

    // Check for duplicate MC number before updating
    if (carrierFields.mc_number) {
      const isDuplicate = await this.validateMCNumber(carrierFields.mc_number, id);
      if (!isDuplicate) {
        throw new Error(`MC number ${carrierFields.mc_number} is already in use by another active carrier`);
      }
    }

    // Update carrier
    const { data: carrier, error: carrierError } = await supabase
      .from('carriers')
      .update(carrierFields)
      .eq('id', id)
      .select()
      .single();

    if (carrierError) {
      console.error('Error updating carrier:', carrierError);
      if (carrierError.code === '23505') {
        throw new Error('A carrier with this information already exists');
      }
      throw new Error('Failed to update carrier. Please check your information and try again.');
    }

    // Update equipment type relationships if provided
    if (equipment_type_ids !== undefined) {
      // First, delete existing relationships
      const { error: deleteError } = await supabase
        .from('carrier_equipment_types')
        .delete()
        .eq('carrier_id', id);

      if (deleteError) {
        console.error('Error deleting carrier equipment types:', deleteError);
      }

      // Then, insert new relationships
      if (equipment_type_ids.length > 0) {
        const equipmentData = equipment_type_ids.map(equipment_type_id => ({
          carrier_id: id,
          equipment_type_id
        }));

        const { error: insertError } = await supabase
          .from('carrier_equipment_types')
          .insert(equipmentData);

        if (insertError) {
          console.error('Error creating carrier equipment types:', insertError);
          console.log('Equipment data that failed to insert:', equipmentData);
          
          // If this is an RLS policy issue, provide a helpful error message
          if (insertError.message?.includes('policy') || insertError.code === '42501') {
            throw new Error('Unable to update equipment types due to permission restrictions. Please contact your administrator.');
          }
        }
      }
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }

    return carrier;
  }

  static async deleteCarrier(id: number): Promise<void> {
    const { error } = await supabase
      .from('carriers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting carrier:', error);
      if (error.code === '23503') {
        throw new Error('Cannot delete carrier because it has active loads or relationships');
      }
      throw new Error('Failed to delete carrier. Please try again.');
    }

    // Trigger analytics refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }
  }

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

  static async validateMCNumber(mcNumber: string, carrierId?: number): Promise<boolean> {
    if (!mcNumber.trim()) {
      return true; // Empty MC number is allowed
    }

    try {
      let query = supabase
        .from('carriers')
        .select('id, dnu_flag')
        .eq('mc_number', mcNumber.trim())
        .eq('dnu_flag', false); // Only check active carriers

      // Exclude current carrier if updating
      if (carrierId) {
        query = query.neq('id', carrierId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error validating MC number:', error);
        throw new Error('Failed to validate MC number');
      }

      return data.length === 0; // Returns true if no active carriers have this MC number
    } catch (error) {
      console.error('MC number validation error:', error);
      // Return true to allow form submission if validation fails due to network/DB issues
      // The server-side validation will catch any actual duplicates
      return true;
    }
  }

  static async searchCarriers(filters: {
    search?: string;
    operating_state?: string;
    equipment_type?: string;
    dnu_flag?: boolean | null;
  }): Promise<CarrierWithEquipment[]> {
    let query = supabase
      .from('carriers')
      .select(`
        *,
        carrier_equipment_types (
          equipment_type_id,
          equipment_types (
            id,
            name
          )
        )
      `);

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,mc_number.ilike.%${filters.search}%,primary_contact_name.ilike.%${filters.search}%`);
    }

    if (filters.operating_state) {
      query = query.contains('operating_states', [filters.operating_state]);
    }

    if (filters.dnu_flag !== undefined && filters.dnu_flag !== null) {
      query = query.eq('dnu_flag', filters.dnu_flag);
    }

    // Equipment type filtering requires a join, so we'll filter after fetching
    const { data, error } = await query.order('name');

    if (error) {
      console.error('Error searching carriers:', error);
      throw new Error('Failed to search carriers');
    }

    let carriers = data.map(carrier => ({
      ...carrier,
      equipment_types: carrier.carrier_equipment_types?.map(
        (cet: any) => cet.equipment_types
      ) || []
    }));

    // Filter by equipment type if specified
    if (filters.equipment_type) {
      carriers = carriers.filter(carrier =>
        carrier.equipment_types.some(et => et.name === filters.equipment_type)
      );
    }

    return carriers;
  }
}
