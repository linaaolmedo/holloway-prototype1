import { supabase } from '@/lib/supabase';

export interface DashboardMetrics {
  totalLoads: number;
  inTransit: number;
  pendingPickup: number;
  delivered: number;
  readyToInvoice: number;
}

export class DashboardService {
  // Get dashboard metrics for load status counts
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Get all load status counts in parallel
      const [
        totalLoadsResult,
        inTransitResult,
        pendingPickupResult,
        deliveredResult,
        readyToInvoiceResult
      ] = await Promise.all([
        // Total loads (all active loads, excluding cancelled)
        supabase
          .from('loads')
          .select('*', { count: 'exact', head: true })
          .neq('status', 'Cancelled'),
        
        // In Transit loads
        supabase
          .from('loads')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'In Transit'),
        
        // Pending Pickup loads
        supabase
          .from('loads')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Pending Pickup'),
        
        // Delivered loads
        supabase
          .from('loads')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Delivered'),
        
        // Ready to Invoice (delivered loads without invoices)
        this.getReadyToInvoiceCount()
      ]);

      // Check for errors
      if (totalLoadsResult.error) throw totalLoadsResult.error;
      if (inTransitResult.error) throw inTransitResult.error;
      if (pendingPickupResult.error) throw pendingPickupResult.error;
      if (deliveredResult.error) throw deliveredResult.error;

      return {
        totalLoads: totalLoadsResult.count || 0,
        inTransit: inTransitResult.count || 0,
        pendingPickup: pendingPickupResult.count || 0,
        delivered: deliveredResult.count || 0,
        readyToInvoice: readyToInvoiceResult
      };
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      throw new Error('Failed to fetch dashboard metrics');
    }
  }

  // Get count of delivered loads that don't have invoices yet
  private static async getReadyToInvoiceCount(): Promise<number> {
    try {
      // Get delivered loads that don't have an invoice_id yet
      const { count, error } = await supabase
        .from('loads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Delivered')
        .is('invoice_id', null);

      if (error) {
        console.error('Error fetching ready to invoice count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error calculating ready to invoice count:', error);
      return 0;
    }
  }

  // Get recent active loads for the dashboard
  static async getRecentActiveLoads(limit: number = 6): Promise<Array<{ id: string; status: string; destination: string; puDate: string; delDate: string }>> {
    try {
      const { data, error } = await supabase
        .from('loads')
        .select(`
          id,
          pickup_date,
          delivery_date,
          status,
          destination_location:customer_locations!destination_location_id(city, state)
        `)
        .in('status', ['Pending Pickup', 'In Transit', 'Delivered'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(load => ({
        id: `HC-${load.id.toString().padStart(4, '0')}`,
        puDate: load.pickup_date ? new Date(load.pickup_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : 'N/A',
        delDate: load.delivery_date ? new Date(load.delivery_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : 'N/A',
        destination: load.destination_location ? 
          Array.isArray(load.destination_location) 
            ? `${(load.destination_location[0] as { city?: string; state?: string }).city}, ${(load.destination_location[0] as { city?: string; state?: string }).state}`
            : `${(load.destination_location as { city?: string; state?: string }).city}, ${(load.destination_location as { city?: string; state?: string }).state}`
          : 'Unknown',
        status: load.status
      }));
    } catch (error) {
      console.error('Failed to fetch recent active loads:', error);
      return [];
    }
  }
}
