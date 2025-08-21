export interface MonthlyRevenue {
  month: string;
  year: number;
  revenue: number;
  load_count: number;
}

export interface ShipmentStatusCount {
  status: string;
  count: number;
  percentage: number;
}

export interface TopCustomer {
  customer_id: number;
  customer_name: string;
  total_revenue: number;
  load_count: number;
}

export interface CarrierPerformance {
  carrier_id: number;
  carrier_name: string;
  total_loads: number;
  total_revenue: number;
  average_rate: number;
  on_time_percentage: number;
}

export interface FleetUtilization {
  total_trucks: number;
  active_trucks: number;
  available_trucks: number;
  maintenance_trucks: number;
  utilization_percentage: number;
}

export interface AnalyticsDashboard {
  monthly_revenue: MonthlyRevenue[];
  shipment_status: ShipmentStatusCount[];
  top_customers: TopCustomer[];
  carrier_performance: CarrierPerformance[];
  fleet_utilization: FleetUtilization;
  total_revenue_ytd: number;
  total_loads_ytd: number;
  average_load_value: number;
}

export interface AnalyticsFilters {
  start_date?: string;
  end_date?: string;
  customer_id?: number;
  carrier_id?: number;
}
