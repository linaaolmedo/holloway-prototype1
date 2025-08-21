import { supabase } from '@/lib/supabase';
import { 
  Report, 
  CreateReportData, 
  UpdateReportData, 
  ReportGenerationRequest,
  LoadReportData,
  CarrierReportData,
  FleetReportData,
  CustomerReportData,
  ReportFilters,
  ReportSearchFilters
} from '@/types/reports';

export class ReportService {
  // Get all reports with optional filters
  static async getReports(filters?: ReportSearchFilters): Promise<Report[]> {
    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters) {
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.created_from) {
        query = query.gte('created_at', filters.created_from);
      }
      if (filters.created_to) {
        query = query.lte('created_at', filters.created_to);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }

    return data || [];
  }

  // Get a single report by ID
  static async getReportById(id: number): Promise<Report | null> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No row found
      }
      throw new Error(`Failed to fetch report: ${error.message}`);
    }

    return data;
  }

  // Create a new report
  static async createReport(reportData: CreateReportData): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        ...reportData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create report: ${error.message}`);
    }

    return data;
  }

  // Update an existing report
  static async updateReport(id: number, reportData: UpdateReportData): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .update({
        ...reportData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update report: ${error.message}`);
    }

    return data;
  }

  // Delete a report
  static async deleteReport(id: number): Promise<void> {
    // First, delete the file from storage if it exists
    const report = await this.getReportById(id);
    if (report?.file_url) {
      try {
        const fileName = report.file_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('reports')
            .remove([fileName]);
        }
      } catch (error) {
        console.warn('Failed to delete report file from storage:', error);
      }
    }

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete report: ${error.message}`);
    }
  }

  // Generate load report data
  static async generateLoadReportData(filters: ReportFilters): Promise<LoadReportData[]> {
    let query = supabase
      .from('loads')
      .select(`
        *,
        customer:customers(name),
        origin_location:customer_locations!origin_location_id(city, state),
        destination_location:customer_locations!destination_location_id(city, state),
        equipment_type:equipment_types(name),
        carrier:carriers(name),
        driver:drivers(name),
        truck:trucks(truck_number),
        trailer:trailers(trailer_number)
      `);

    // Apply filters
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters.status_filter && filters.status_filter.length > 0) {
      query = query.in('status', filters.status_filter);
    }
    if (filters.customer_ids && filters.customer_ids.length > 0) {
      query = query.in('customer_id', filters.customer_ids);
    }
    if (filters.carrier_ids && filters.carrier_ids.length > 0) {
      query = query.in('carrier_id', filters.carrier_ids);
    }
    if (filters.equipment_type_ids && filters.equipment_type_ids.length > 0) {
      query = query.in('equipment_type_id', filters.equipment_type_ids);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to generate load report data: ${error.message}`);
    }

    return (data || []).map(load => ({
      id: load.id,
      load_number: `BF-${load.id.toString().padStart(4, '0')}`,
      customer_name: load.customer?.name || '',
      origin_city: load.origin_location?.city || '',
      origin_state: load.origin_location?.state || '',
      destination_city: load.destination_location?.city || '',
      destination_state: load.destination_location?.state || '',
      equipment_type: load.equipment_type?.name || '',
      commodity: load.commodity || '',
      weight: load.weight || 0,
      status: load.status,
      pickup_date: load.pickup_date || '',
      delivery_date: load.delivery_date || '',
      carrier_name: load.carrier?.name || '',
      driver_name: load.driver?.name || '',
      truck_number: load.truck?.truck_number || '',
      trailer_number: load.trailer?.trailer_number || '',
      customer_rate: load.rate_customer || 0,
      carrier_rate: load.rate_carrier || 0,
      margin: (load.rate_customer || 0) - (load.rate_carrier || 0),
      margin_percent: (load.rate_customer && load.rate_carrier && load.rate_customer > 0) 
        ? ((load.rate_customer - load.rate_carrier) / load.rate_customer * 100) 
        : 0,
      pod_uploaded: load.pod_uploaded,
      created_at: load.created_at
    }));
  }

  // Generate carrier report data
  static async generateCarrierReportData(filters: ReportFilters): Promise<CarrierReportData[]> {
    let query = supabase
      .from('carriers')
      .select(`
        *,
        carrier_equipment_types(equipment_type:equipment_types(name)),
        loads(id, status, rate_carrier, delivery_date, pickup_date)
      `);

    if (filters.carrier_ids && filters.carrier_ids.length > 0) {
      query = query.in('id', filters.carrier_ids);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to generate carrier report data: ${error.message}`);
    }

    return (data || []).map(carrier => {
      const loads = carrier.loads || [];
      const activeLoads = loads.filter(load => ['Pending Pickup', 'In Transit'].includes(load.status));
      const totalRevenue = loads.reduce((sum, load) => sum + (load.rate_carrier || 0), 0);
      const averageRate = loads.length > 0 ? totalRevenue / loads.length : 0;
      
      // Calculate on-time percentage (simplified)
      const deliveredLoads = loads.filter(load => load.status === 'Delivered' && load.delivery_date);
      const onTimeCount = deliveredLoads.length; // Simplified - would need actual delivery vs scheduled comparison
      const onTimePercentage = deliveredLoads.length > 0 ? (onTimeCount / deliveredLoads.length * 100) : 0;

      const equipmentTypes = carrier.carrier_equipment_types?.map(cet => cet.equipment_type?.name).filter(Boolean) || [];

      return {
        id: carrier.id,
        name: carrier.name,
        mc_number: carrier.mc_number || '',
        contact_name: carrier.primary_contact_name || '',
        contact_email: carrier.primary_contact_email || '',
        contact_phone: carrier.primary_contact_phone || '',
        operating_states: carrier.operating_states.join(', '),
        equipment_types: equipmentTypes.join(', '),
        total_loads: loads.length,
        active_loads: activeLoads.length,
        total_revenue: totalRevenue,
        average_rate: averageRate,
        on_time_percentage: onTimePercentage,
        dnu_flag: carrier.dnu_flag,
        created_at: carrier.created_at
      };
    });
  }

  // Generate fleet report data
  static async generateFleetReportData(filters: ReportFilters): Promise<FleetReportData[]> {
    const reportData: FleetReportData[] = [];

    // Get trucks data
    const { data: trucks, error: trucksError } = await supabase
      .from('trucks')
      .select(`
        *,
        driver:drivers(name),
        loads!truck_id(id, status, rate_customer, pickup_date, delivery_date)
      `);

    if (trucksError) {
      throw new Error(`Failed to generate truck report data: ${trucksError.message}`);
    }

    trucks?.forEach(truck => {
      const loads = truck.loads || [];
      const currentLoad = loads.find(load => ['Pending Pickup', 'In Transit'].includes(load.status));
      const revenueGenerated = loads.reduce((sum, load) => sum + (load.rate_customer || 0), 0);

      reportData.push({
        id: truck.id,
        type: 'truck',
        identifier: truck.truck_number,
        license_plate: truck.license_plate || '',
        equipment_type: '',
        status: truck.status,
        current_load_id: currentLoad?.id || 0,
        utilization_rate: loads.length > 0 ? (loads.filter(load => load.status === 'Delivered').length / loads.length * 100) : 0,
        maintenance_due: truck.maintenance_due || '',
        total_miles: 0, // Would need additional tracking
        revenue_generated: revenueGenerated,
        last_assignment: loads.length > 0 ? loads[0].pickup_date || '' : '',
        created_at: truck.created_at
      });
    });

    // Get trailers data
    const { data: trailers, error: trailersError } = await supabase
      .from('trailers')
      .select(`
        *,
        equipment_type:equipment_types(name),
        loads!trailer_id(id, status, rate_customer, pickup_date, delivery_date)
      `);

    if (trailersError) {
      throw new Error(`Failed to generate trailer report data: ${trailersError.message}`);
    }

    trailers?.forEach(trailer => {
      const loads = trailer.loads || [];
      const currentLoad = loads.find(load => ['Pending Pickup', 'In Transit'].includes(load.status));
      const revenueGenerated = loads.reduce((sum, load) => sum + (load.rate_customer || 0), 0);

      reportData.push({
        id: trailer.id,
        type: 'trailer',
        identifier: trailer.trailer_number,
        license_plate: trailer.license_plate || '',
        equipment_type: trailer.equipment_type?.name || '',
        status: trailer.status,
        current_load_id: currentLoad?.id || 0,
        utilization_rate: loads.length > 0 ? (loads.filter(load => load.status === 'Delivered').length / loads.length * 100) : 0,
        maintenance_due: trailer.maintenance_due || '',
        total_miles: 0, // Would need additional tracking
        revenue_generated: revenueGenerated,
        last_assignment: loads.length > 0 ? loads[0].pickup_date || '' : '',
        created_at: trailer.created_at
      });
    });

    // Get drivers data
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select(`
        *,
        truck:trucks(truck_number),
        loads!driver_id(id, status, rate_customer, pickup_date, delivery_date)
      `);

    if (driversError) {
      throw new Error(`Failed to generate driver report data: ${driversError.message}`);
    }

    drivers?.forEach(driver => {
      const loads = driver.loads || [];
      const currentLoad = loads.find(load => ['Pending Pickup', 'In Transit'].includes(load.status));
      const revenueGenerated = loads.reduce((sum, load) => sum + (load.rate_customer || 0), 0);

      reportData.push({
        id: driver.id,
        type: 'driver',
        identifier: driver.name,
        license_plate: '',
        equipment_type: '',
        status: driver.status,
        current_load_id: currentLoad?.id || 0,
        utilization_rate: loads.length > 0 ? (loads.filter(load => load.status === 'Delivered').length / loads.length * 100) : 0,
        maintenance_due: driver.medical_card_expiry || '',
        total_miles: 0, // Would need additional tracking
        revenue_generated: revenueGenerated,
        last_assignment: loads.length > 0 ? loads[0].pickup_date || '' : '',
        created_at: driver.created_at
      });
    });

    return reportData;
  }

  // Generate customer report data
  static async generateCustomerReportData(filters: ReportFilters): Promise<CustomerReportData[]> {
    let query = supabase
      .from('customers')
      .select(`
        *,
        customer_locations(id),
        loads(id, status, rate_customer, created_at),
        invoices(id, total_amount, is_paid, date_created)
      `);

    if (filters.customer_ids && filters.customer_ids.length > 0) {
      query = query.in('id', filters.customer_ids);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to generate customer report data: ${error.message}`);
    }

    return (data || []).map(customer => {
      const loads = customer.loads || [];
      const invoices = customer.invoices || [];
      const activeLoads = loads.filter(load => ['Pending Pickup', 'In Transit'].includes(load.status));
      const totalRevenue = loads.reduce((sum, load) => sum + (load.rate_customer || 0), 0);
      const averageRate = loads.length > 0 ? totalRevenue / loads.length : 0;
      
      const outstandingInvoices = invoices.filter(inv => !inv.is_paid);
      const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      
      // Simplified payment history score
      const paidInvoices = invoices.filter(inv => inv.is_paid);
      const paymentHistoryScore = invoices.length > 0 ? (paidInvoices.length / invoices.length * 100) : 100;

      return {
        id: customer.id,
        name: customer.name,
        contact_name: customer.primary_contact_name || '',
        contact_email: customer.primary_contact_email || '',
        contact_phone: customer.primary_contact_phone || '',
        credit_limit: customer.credit_limit || 0,
        payment_terms: customer.payment_terms || 0,
        total_loads: loads.length,
        active_loads: activeLoads.length,
        total_revenue: totalRevenue,
        average_rate: averageRate,
        outstanding_invoices: outstandingInvoices.length,
        outstanding_amount: outstandingAmount,
        payment_history_score: paymentHistoryScore,
        locations_count: customer.customer_locations?.length || 0,
        created_at: customer.created_at
      };
    });
  }

  // Convert data to CSV format
  static dataToCSV(data: any[], headers: string[]): string {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value?.toString() || '';
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  }

  // Upload report file to Supabase storage
  static async uploadReportFile(fileName: string, content: string, contentType: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(fileName, content, {
        contentType,
        upsert: true
      });

    if (error) {
      throw new Error(`Failed to upload report file: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  // Download report file
  static async downloadReportFile(fileName: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('reports')
      .download(fileName);

    if (error) {
      throw new Error(`Failed to download report file: ${error.message}`);
    }

    return data;
  }

  // Generate and save report
  static async generateAndSaveReport(request: ReportGenerationRequest): Promise<Report> {
    try {
      // Update status to generating
      const report = await this.createReport({
        name: request.name,
        type: request.type,
        filters: request.filters,
        format: request.format
      });

      await this.updateReport(report.id, { status: 'generating' });

      let data: any[] = [];
      let headers: string[] = [];

      // Generate data based on report type
      switch (request.type) {
        case 'loads':
          data = await this.generateLoadReportData(request.filters);
          headers = [
            'id', 'load_number', 'customer_name', 'origin_city', 'origin_state',
            'destination_city', 'destination_state', 'equipment_type', 'commodity',
            'weight', 'status', 'pickup_date', 'delivery_date', 'carrier_name',
            'driver_name', 'truck_number', 'trailer_number', 'customer_rate',
            'carrier_rate', 'margin', 'margin_percent', 'pod_uploaded', 'created_at'
          ];
          break;
        case 'carriers':
          data = await this.generateCarrierReportData(request.filters);
          headers = [
            'id', 'name', 'mc_number', 'contact_name', 'contact_email', 'contact_phone',
            'operating_states', 'equipment_types', 'total_loads', 'active_loads',
            'total_revenue', 'average_rate', 'on_time_percentage', 'dnu_flag', 'created_at'
          ];
          break;
        case 'fleet':
          data = await this.generateFleetReportData(request.filters);
          headers = [
            'id', 'type', 'identifier', 'license_plate', 'equipment_type', 'status',
            'current_load_id', 'utilization_rate', 'maintenance_due', 'total_miles',
            'revenue_generated', 'last_assignment', 'created_at'
          ];
          break;
        case 'customers':
          data = await this.generateCustomerReportData(request.filters);
          headers = [
            'id', 'name', 'contact_name', 'contact_email', 'contact_phone',
            'credit_limit', 'payment_terms', 'total_loads', 'active_loads',
            'total_revenue', 'average_rate', 'outstanding_invoices', 'outstanding_amount',
            'payment_history_score', 'locations_count', 'created_at'
          ];
          break;
        default:
          throw new Error(`Unsupported report type: ${request.type}`);
      }

      // Convert to CSV (for now, PDF generation could be added later)
      const csvContent = this.dataToCSV(data, headers);
      const fileName = `${request.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`;
      
      // Upload to storage
      const fileUrl = await this.uploadReportFile(fileName, csvContent, 'text/csv');
      const fileSize = new Blob([csvContent]).size;

      // Update report with file info
      const updatedReport = await this.updateReport(report.id, {
        status: 'completed',
        file_url: fileUrl,
        file_size: fileSize
      });

      return updatedReport;
    } catch (error) {
      // Update status to failed on error
      throw error;
    }
  }
}
