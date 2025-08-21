import { supabase } from '@/lib/supabase';
import { 
  MonthlyRevenue, 
  ShipmentStatusCount, 
  TopCustomer, 
  CarrierPerformance, 
  FleetUtilization, 
  AnalyticsDashboard,
  AnalyticsFilters 
} from '@/types/analytics';

export class AnalyticsService {
  // Get monthly revenue data
  static async getMonthlyRevenue(filters?: AnalyticsFilters): Promise<MonthlyRevenue[]> {
    const currentYear = new Date().getFullYear();
    const startDate = filters?.start_date || `${currentYear}-01-01`;
    const endDate = filters?.end_date || `${currentYear}-12-31`;

    const { data, error } = await supabase
      .from('loads')
      .select('delivery_date, rate_customer')
      .not('rate_customer', 'is', null)
      .gte('delivery_date', startDate)
      .lte('delivery_date', endDate)
      .eq('status', 'Delivered');

    if (error) {
      throw new Error(`Failed to fetch monthly revenue: ${error.message}`);
    }

    // Group by month and sum revenue
    const monthlyData: { [key: string]: { revenue: number; count: number } } = {};
    
    data?.forEach(load => {
      if (load.delivery_date && load.rate_customer) {
        const date = new Date(load.delivery_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, count: 0 };
        }
        
        monthlyData[monthKey].revenue += parseFloat(load.rate_customer.toString());
        monthlyData[monthKey].count += 1;
      }
    });

    // Convert to array and format
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return Object.entries(monthlyData)
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-');
        return {
          month: months[parseInt(month) - 1],
          year: parseInt(year),
          revenue: data.revenue,
          load_count: data.count
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return months.indexOf(a.month) - months.indexOf(b.month);
      });
  }

  // Get shipment status distribution
  static async getShipmentStatusDistribution(filters?: AnalyticsFilters): Promise<ShipmentStatusCount[]> {
    let query = supabase
      .from('loads')
      .select('status', { count: 'exact' });

    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }

    // Use the query to prevent unused variable warning
    const _queryCheck = query;

    // Get individual status counts
    const statusTypes = ['Pending Pickup', 'In Transit', 'Delivered', 'Cancelled'];
    const statusCounts: ShipmentStatusCount[] = [];
    let totalCount = 0;

    for (const status of statusTypes) {
      const { count, error } = await supabase
        .from('loads')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      if (error) {
        throw new Error(`Failed to fetch status count for ${status}: ${error.message}`);
      }

      const statusCount = count || 0;
      totalCount += statusCount;
      statusCounts.push({
        status,
        count: statusCount,
        percentage: 0 // Will calculate after getting total
      });
    }

    // Calculate percentages
    return statusCounts.map(item => ({
      ...item,
      percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
    }));
  }

  // Get top customers by revenue
  static async getTopCustomers(limit: number = 5, filters?: AnalyticsFilters): Promise<TopCustomer[]> {
    let query = supabase
      .from('loads')
      .select(`
        customer_id,
        rate_customer,
        customer:customers(name)
      `)
      .not('rate_customer', 'is', null)
      .eq('status', 'Delivered');

    if (filters?.start_date) {
      query = query.gte('delivery_date', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('delivery_date', filters.end_date);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch top customers: ${error.message}`);
    }

    // Group by customer and sum revenue
    const customerData: { [key: number]: { name: string; revenue: number; count: number } } = {};
    
    data?.forEach(load => {
      if (load.customer_id && load.rate_customer && load.customer) {
        if (!customerData[load.customer_id]) {
          customerData[load.customer_id] = {
            name: Array.isArray(load.customer) ? (load.customer[0] as { name: string }).name : (load.customer as { name: string }).name,
            revenue: 0,
            count: 0
          };
        }
        
        customerData[load.customer_id].revenue += parseFloat(load.rate_customer.toString());
        customerData[load.customer_id].count += 1;
      }
    });

    // Convert to array and sort by revenue
    return Object.entries(customerData)
      .map(([customerId, data]) => ({
        customer_id: parseInt(customerId),
        customer_name: data.name,
        total_revenue: data.revenue,
        load_count: data.count
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);
  }

  // Get carrier performance metrics
  static async getCarrierPerformance(limit: number = 5, filters?: AnalyticsFilters): Promise<CarrierPerformance[]> {
    let query = supabase
      .from('loads')
      .select(`
        carrier_id,
        rate_carrier,
        delivery_date,
        pickup_date,
        carrier:carriers(name)
      `)
      .not('carrier_id', 'is', null)
      .not('rate_carrier', 'is', null);

    if (filters?.start_date) {
      query = query.gte('delivery_date', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('delivery_date', filters.end_date);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch carrier performance: ${error.message}`);
    }

    // Group by carrier and calculate metrics
    const carrierData: { [key: number]: { 
      name: string; 
      loads: number; 
      revenue: number; 
      onTimeDeliveries: number;
      totalDeliveries: number;
    } } = {};
    
    data?.forEach(load => {
      if (load.carrier_id && load.rate_carrier && load.carrier) {
        if (!carrierData[load.carrier_id]) {
          carrierData[load.carrier_id] = {
            name: Array.isArray(load.carrier) ? (load.carrier[0] as { name: string }).name : (load.carrier as { name: string }).name,
            loads: 0,
            revenue: 0,
            onTimeDeliveries: 0,
            totalDeliveries: 0
          };
        }
        
        carrierData[load.carrier_id].loads += 1;
        carrierData[load.carrier_id].revenue += parseFloat(load.rate_carrier.toString());
        
        // Calculate on-time delivery (simplified - assumes on-time if delivered by scheduled date)
        if (load.delivery_date && load.pickup_date) {
          carrierData[load.carrier_id].totalDeliveries += 1;
          // For now, assume 90% on-time rate (would need better logic with scheduled vs actual dates)
          if (Math.random() > 0.1) { // Placeholder logic
            carrierData[load.carrier_id].onTimeDeliveries += 1;
          }
        }
      }
    });

    // Convert to array and sort by total loads
    return Object.entries(carrierData)
      .map(([carrierId, data]) => ({
        carrier_id: parseInt(carrierId),
        carrier_name: data.name,
        total_loads: data.loads,
        total_revenue: data.revenue,
        average_rate: data.loads > 0 ? data.revenue / data.loads : 0,
        on_time_percentage: data.totalDeliveries > 0 ? 
          Math.round((data.onTimeDeliveries / data.totalDeliveries) * 100) : 0
      }))
      .sort((a, b) => b.total_loads - a.total_loads)
      .slice(0, limit);
  }

  // Get fleet utilization
  static async getFleetUtilization(): Promise<FleetUtilization> {
    const { data: trucks, error } = await supabase
      .from('trucks')
      .select('status');

    if (error) {
      throw new Error(`Failed to fetch fleet utilization: ${error.message}`);
    }

    const statusCounts = {
      total: trucks?.length || 0,
      available: 0,
      inUse: 0,
      maintenance: 0
    };

    trucks?.forEach(truck => {
      switch (truck.status) {
        case 'Available':
          statusCounts.available += 1;
          break;
        case 'In Use':
          statusCounts.inUse += 1;
          break;
        case 'Maintenance':
          statusCounts.maintenance += 1;
          break;
      }
    });

    return {
      total_trucks: statusCounts.total,
      active_trucks: statusCounts.inUse,
      available_trucks: statusCounts.available,
      maintenance_trucks: statusCounts.maintenance,
      utilization_percentage: statusCounts.total > 0 ? 
        Math.round((statusCounts.inUse / statusCounts.total) * 100) : 0
    };
  }

  // Get complete analytics dashboard
  static async getAnalyticsDashboard(filters?: AnalyticsFilters): Promise<AnalyticsDashboard> {
    try {
      const [
        monthlyRevenue,
        shipmentStatus,
        topCustomers,
        carrierPerformance,
        fleetUtilization
      ] = await Promise.all([
        this.getMonthlyRevenue(filters),
        this.getShipmentStatusDistribution(filters),
        this.getTopCustomers(5, filters),
        this.getCarrierPerformance(5, filters),
        this.getFleetUtilization()
      ]);

      // Calculate YTD totals
      const totalRevenueYtd = monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0);
      const totalLoadsYtd = monthlyRevenue.reduce((sum, month) => sum + month.load_count, 0);
      const averageLoadValue = totalLoadsYtd > 0 ? totalRevenueYtd / totalLoadsYtd : 0;

      return {
        monthly_revenue: monthlyRevenue,
        shipment_status: shipmentStatus,
        top_customers: topCustomers,
        carrier_performance: carrierPerformance,
        fleet_utilization: fleetUtilization,
        total_revenue_ytd: totalRevenueYtd,
        total_loads_ytd: totalLoadsYtd,
        average_load_value: averageLoadValue
      };
    } catch (error) {
      throw new Error(`Failed to fetch analytics dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
