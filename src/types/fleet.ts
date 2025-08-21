export type Truck = {
  id: number;
  truck_number: string;
  license_plate: string | null;
  // Note: make, model, year exist in forms but not in database
  make?: string | null;
  model?: string | null;
  year?: string | null;
  maintenance_due: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type Trailer = {
  id: number;
  trailer_number: string;
  license_plate: string | null;
  equipment_type_id: number;
  maintenance_due: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type Driver = {
  id: number;
  name: string;
  phone: string | null;
  license_number: string | null;
  license_expiry_date: string | null;
  medical_card_expiry: string | null;
  status: string;
  truck_id: number | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type EquipmentType = {
  id: number;
  name: string;
};

// Extended types with relationships
export type TrailerWithEquipment = Trailer & {
  equipment_type?: EquipmentType;
};

export type DriverWithTruck = Driver & {
  truck?: Truck;
};

export type TruckWithDriver = Truck & {
  driver?: Driver;
};

// Create/Update types
export type CreateTruckData = {
  truck_number: string;
  license_plate?: string;
  // These fields are displayed in form but not saved to database
  make?: string;
  model?: string;
  year?: string;
  maintenance_due?: string;
  status?: string;
};

export type UpdateTruckData = Partial<CreateTruckData>;

export type CreateTrailerData = {
  trailer_number: string;
  license_plate?: string;
  equipment_type_id: number;
  maintenance_due?: string;
  status?: string;
};

export type UpdateTrailerData = Partial<CreateTrailerData>;

export type CreateDriverData = {
  name: string;
  phone?: string;
  license_number?: string;
  license_expiry_date?: string;
  medical_card_expiry?: string;
  status?: string;
  truck_id?: number;
};

export type UpdateDriverData = Partial<CreateDriverData>;

// Filter types
export type TruckFilters = {
  search?: string;
  status?: string;
  maintenance_due?: 'overdue' | 'upcoming' | 'current';
};

export type TrailerFilters = {
  search?: string;
  status?: string;
  equipment_type?: string;
  maintenance_due?: 'overdue' | 'upcoming' | 'current';
};

export type DriverFilters = {
  search?: string;
  status?: string;
  license_expiry?: 'expired' | 'expiring' | 'current';
  medical_card_expiry?: 'expired' | 'expiring' | 'current';
  assigned?: boolean;
};

// Status constants
export const TRUCK_STATUSES = ['Available', 'In Use', 'Maintenance'] as const;
export const TRAILER_STATUSES = ['Available', 'In Use', 'Maintenance'] as const;
export const DRIVER_STATUSES = ['Active', 'On Leave', 'Inactive'] as const;

export type TruckStatus = typeof TRUCK_STATUSES[number];
export type TrailerStatus = typeof TRAILER_STATUSES[number];
export type DriverStatus = typeof DRIVER_STATUSES[number];

// Active dispatch view types
export type ActiveDispatch = {
  driver_id: number;
  driver_name: string;
  driver_phone: string | null;
  truck: Truck | null;
  current_load: {
    load_id: string;
    status: string;
    commodity: string | null;
    origin: string;
    destination: string;
  } | null;
  available_hours: string;
  status: string;
};
