import { supabase } from '@/lib/supabase';
import { 
  LoadWithDetails, 
  CreateLoadData, 
  LoadFilters,
  CustomerLocation,
  EquipmentType
} from '@/types/loads';
import { InvoiceWithDetails, BillingFilters } from '@/types/billing';

export interface CustomerShipmentRequest extends CreateLoadData {
  // Customer-specific fields for shipment requests
  special_instructions?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  urgency?: 'Normal' | 'Urgent' | 'Emergency';
}

export interface CustomerDashboardStats {
  total_shipments: number;
  pending_pickup: number;
  in_transit: number;
  delivered: number;
  outstanding_invoices: number;
  outstanding_amount: number;
  recent_shipments: LoadWithDetails[];
  recent_invoices: InvoiceWithDetails[];
}

export class CustomerPortalService {
  // Get dashboard stats for a specific customer
  static async getDashboardStats(customerId: number): Promise<CustomerDashboardStats> {
    try {
      // Get shipment counts
      const { data: shipments, error: shipmentsError } = await supabase
        .from('loads')
        .select('id, status')
        .eq('customer_id', customerId);

      if (shipmentsError) throw shipmentsError;

      const total_shipments = shipments?.length || 0;
      const pending_pickup = shipments?.filter(s => s.status === 'Pending Pickup').length || 0;
      const in_transit = shipments?.filter(s => s.status === 'In Transit').length || 0;
      const delivered = shipments?.filter(s => s.status === 'Delivered').length || 0;

      // Get invoice stats
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, total_amount, is_paid')
        .eq('customer_id', customerId);

      if (invoicesError) throw invoicesError;

      const outstanding_invoices = invoices?.filter(i => !i.is_paid).length || 0;
      const outstanding_amount = invoices
        ?.filter(i => !i.is_paid)
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      // Get recent shipments (last 5)
      const { data: recentShipments, error: recentShipmentsError } = await supabase
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
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentShipmentsError) throw recentShipmentsError;

      // Get recent invoices (last 5)
      const { data: recentInvoices, error: recentInvoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentInvoicesError) throw recentInvoicesError;

      return {
        total_shipments,
        pending_pickup,
        in_transit,
        delivered,
        outstanding_invoices,
        outstanding_amount,
        recent_shipments: recentShipments || [],
        recent_invoices: recentInvoices || []
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }

  // Get shipments for a specific customer
  static async getCustomerShipments(customerId: number, filters?: LoadFilters): Promise<LoadWithDetails[]> {
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
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    // Apply additional filters if provided
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
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
        query = query.ilike('commodity', `%${filters.search}%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch customer shipments: ${error.message}`);
    }

    return data || [];
  }

  // Get invoices for a specific customer
  static async getCustomerInvoices(customerId: number, filters?: BillingFilters): Promise<InvoiceWithDetails[]> {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    // Apply filters if provided
    if (filters) {
      if (filters.is_paid !== undefined) {
        query = query.eq('is_paid', filters.is_paid);
      }
      if (filters.date_from) {
        query = query.gte('date_created', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('date_created', filters.date_to);
      }
      if (filters.invoice_number) {
        query = query.ilike('invoice_number', `%${filters.invoice_number}%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch customer invoices: ${error.message}`);
    }

    return data || [];
  }

  // Create a new shipment request
  static async createShipmentRequest(customerId: number, requestData: CustomerShipmentRequest): Promise<LoadWithDetails> {
    const loadData: CreateLoadData = {
      customer_id: customerId,
      origin_location_id: requestData.origin_location_id,
      destination_location_id: requestData.destination_location_id,
      equipment_type_id: requestData.equipment_type_id,
      commodity: requestData.commodity,
      weight: requestData.weight,
      pickup_date: requestData.pickup_date,
      delivery_date: requestData.delivery_date,
      rate_customer: requestData.rate_customer
    };

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
      throw new Error(`Failed to create shipment request: ${error.message}`);
    }

    // Send notification to dispatchers (non-blocking - don't fail shipment creation if notifications fail)
    this.notifyDispatchersOfNewRequest(data).catch(error => {
      console.error('Failed to send dispatcher notifications, but shipment was created successfully:', error);
    });

    return data;
  }

  // Get customer locations for the shipment form
  static async getCustomerLocations(customerId: number): Promise<CustomerLocation[]> {
    const { data, error } = await supabase
      .from('customer_locations')
      .select('*')
      .eq('customer_id', customerId)
      .order('location_name');

    if (error) {
      throw new Error(`Failed to fetch customer locations: ${error.message}`);
    }

    return data || [];
  }

  // Get equipment types for the shipment form
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

  // Notify dispatchers of new shipment request
  private static async notifyDispatchersOfNewRequest(load: LoadWithDetails): Promise<void> {
    try {
      // Use the notification service to notify dispatchers
      const { NotificationService } = await import('./notificationService');
      await NotificationService.notifyDispatchersOfNewShipmentRequest(load);
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  // Get a single shipment by ID (customer must own it)
  static async getCustomerShipmentById(customerId: number, shipmentId: number): Promise<LoadWithDetails | null> {
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
      .eq('id', shipmentId)
      .eq('customer_id', customerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No row found
      }
      throw new Error(`Failed to fetch shipment: ${error.message}`);
    }

    return data;
  }
}
