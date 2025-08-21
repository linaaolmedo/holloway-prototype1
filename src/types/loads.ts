export interface Load {
  id: number;
  customer_id: number;
  origin_location_id: number;
  destination_location_id: number;
  equipment_type_id: number;
  commodity: string | null;
  weight: number | null;
  status: LoadStatus;
  pickup_date: string | null;
  delivery_date: string | null;
  carrier_id: number | null;
  driver_id: number | null;
  truck_id: number | null;
  trailer_id: number | null;
  rate_customer: number | null;
  rate_carrier: number | null;
  invoice_id: number | null;
  pod_uploaded: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface LoadWithDetails extends Load {
  customer?: Customer;
  origin_location?: CustomerLocation;
  destination_location?: CustomerLocation;
  equipment_type?: EquipmentType;
  carrier?: Carrier;
  driver?: Driver;
  truck?: Truck;
  trailer?: Trailer;
}

export interface Customer {
  id: number;
  name: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  credit_limit: number | null;
  payment_terms: number | null;
  consolidated_invoicing: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface CustomerLocation {
  id: number;
  customer_id: number;
  location_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Carrier {
  id: number;
  name: string;
  mc_number: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  operating_states: string[];
  dnu_flag: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface EquipmentType {
  id: number;
  name: string;
}

export interface Driver {
  id: number;
  name: string;
  phone: string | null;
  license_number: string | null;
  license_expiry_date: string | null;
  medical_card_expiry: string | null;
  status: DriverStatus;
  truck_id: number | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Truck {
  id: number;
  truck_number: string;
  license_plate: string | null;
  maintenance_due: string | null;
  status: FleetStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Trailer {
  id: number;
  trailer_number: string;
  license_plate: string | null;
  equipment_type_id: number;
  maintenance_due: string | null;
  status: FleetStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type LoadStatus = 'Pending Pickup' | 'In Transit' | 'Delivered' | 'Cancelled';
export type DriverStatus = 'Active' | 'On Leave' | 'Inactive' | 'In Use';
export type FleetStatus = 'Available' | 'In Use' | 'Maintenance';

export interface CreateLoadData {
  customer_id: number;
  origin_location_id: number;
  destination_location_id: number;
  equipment_type_id: number;
  commodity?: string;
  weight?: number;
  pickup_date?: string;
  delivery_date?: string;
  rate_customer?: number;
  rate_carrier?: number;
  carrier_id?: number;
  driver_id?: number;
  truck_id?: number;
  trailer_id?: number;
}

export interface UpdateLoadData {
  customer_id?: number;
  origin_location_id?: number;
  destination_location_id?: number;
  equipment_type_id?: number;
  commodity?: string;
  weight?: number;
  status?: LoadStatus;
  pickup_date?: string;
  delivery_date?: string;
  rate_customer?: number;
  rate_carrier?: number;
  carrier_id?: number;
  driver_id?: number;
  truck_id?: number;
  trailer_id?: number;
  pod_uploaded?: boolean;
}

export interface LoadFilters {
  status?: LoadStatus;
  customer_id?: number;
  carrier_id?: number;
  equipment_type_id?: number;
  pickup_date_from?: string;
  pickup_date_to?: string;
  delivery_date_from?: string;
  delivery_date_to?: string;
  search?: string;
}

export interface LoadTableProps {
  loads: LoadWithDetails[];
  loading?: boolean;
  onEdit: (load: LoadWithDetails) => void;
  onDelete: (load: LoadWithDetails) => void;
  onView: (load: LoadWithDetails) => void;
}

export interface LoadFormProps {
  load?: LoadWithDetails;
  onSubmit: (data: CreateLoadData | UpdateLoadData) => void;
  onCancel: () => void;
  loading?: boolean;
}
