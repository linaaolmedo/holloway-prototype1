import { LoadWithDetails } from './loads';

export interface DriverAssignment extends LoadWithDetails {
  // Additional fields that might be useful for driver view
}

export interface LoadMessage {
  id: number;
  load_id: number;
  user_id: string;
  message: string;
  timestamp: string;
  // User details for display
  user_name?: string;
  user_role?: string;
}

export interface DriverProfile {
  id: number;
  name: string;
  phone: string | null;
  license_number: string | null;
  license_expiry_date: string | null;
  medical_card_expiry: string | null;
  status: 'Active' | 'On Leave' | 'Inactive';
  truck_id: number | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SendMessageData {
  load_id: number;
  message: string;
}

export interface StatusUpdateData {
  load_id: number;
  status: 'In Transit' | 'Delivered';
}

export interface DriverDashboardData {
  currentAssignment: DriverAssignment | null;
  messages: LoadMessage[];
  driverProfile: DriverProfile | null;
}
