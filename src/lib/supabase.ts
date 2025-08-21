import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      loads: {
        Row: {
          id: number;
          customer_id: number;
          origin_location_id: number;
          destination_location_id: number;
          equipment_type_id: number;
          commodity: string | null;
          weight: number | null;
          status: string;
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
        };
        Insert: {
          customer_id: number;
          origin_location_id: number;
          destination_location_id: number;
          equipment_type_id: number;
          commodity?: string | null;
          weight?: number | null;
          status?: string;
          pickup_date?: string | null;
          delivery_date?: string | null;
          carrier_id?: number | null;
          driver_id?: number | null;
          truck_id?: number | null;
          trailer_id?: number | null;
          rate_customer?: number | null;
          rate_carrier?: number | null;
          invoice_id?: number | null;
          pod_uploaded?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          customer_id?: number;
          origin_location_id?: number;
          destination_location_id?: number;
          equipment_type_id?: number;
          commodity?: string | null;
          weight?: number | null;
          status?: string;
          pickup_date?: string | null;
          delivery_date?: string | null;
          carrier_id?: number | null;
          driver_id?: number | null;
          truck_id?: number | null;
          trailer_id?: number | null;
          rate_customer?: number | null;
          rate_carrier?: number | null;
          invoice_id?: number | null;
          pod_uploaded?: boolean;
          updated_by?: string | null;
        };
      };
      customers: {
        Row: {
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
        };
      };
      customer_locations: {
        Row: {
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
        };
      };
      carriers: {
        Row: {
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
        };
        Insert: {
          name: string;
          mc_number?: string | null;
          primary_contact_name?: string | null;
          primary_contact_email?: string | null;
          primary_contact_phone?: string | null;
          operating_states?: string[];
          dnu_flag?: boolean;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          mc_number?: string | null;
          primary_contact_name?: string | null;
          primary_contact_email?: string | null;
          primary_contact_phone?: string | null;
          operating_states?: string[];
          dnu_flag?: boolean;
          updated_by?: string | null;
        };
      };
      carrier_equipment_types: {
        Row: {
          carrier_id: number;
          equipment_type_id: number;
        };
        Insert: {
          carrier_id: number;
          equipment_type_id: number;
        };
        Update: {
          carrier_id?: number;
          equipment_type_id?: number;
        };
      };
      equipment_types: {
        Row: {
          id: number;
          name: string;
        };
      };
      drivers: {
        Row: {
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
      };
      trucks: {
        Row: {
          id: number;
          truck_number: string;
          license_plate: string | null;
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
      };
      trailers: {
        Row: {
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
      };
    };
  };
};
