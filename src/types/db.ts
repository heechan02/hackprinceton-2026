export type EventKind = 'med_check' | 'pantry_check' | 'reorder' | 'txn_flagged' | 'system';
export type EventStatus = 'pending' | 'in_progress' | 'completed' | 'approved' | 'blocked' | 'failed';

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string;
          name: string;
          timezone: string;
          caretaker_phone: string;
          poa_confirmed_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          timezone?: string;
          caretaker_phone: string;
          poa_confirmed_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          timezone?: string;
          caretaker_phone?: string;
          poa_confirmed_at?: string | null;
        };
      };
      prescriptions: {
        Row: {
          id: string;
          patient_id: string;
          name: string;
          dose_times: string[];
          compartments_per_dose: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          name: string;
          dose_times?: string[];
          compartments_per_dose?: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string;
          name?: string;
          dose_times?: string[];
          compartments_per_dose?: number;
          notes?: string | null;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          patient_id: string;
          name: string;
          reorder_threshold: number;
          typical_qty: number;
        };
        Insert: {
          id?: string;
          patient_id: string;
          name: string;
          reorder_threshold?: number;
          typical_qty?: number;
        };
        Update: {
          id?: string;
          patient_id?: string;
          name?: string;
          reorder_threshold?: number;
          typical_qty?: number;
        };
      };
      spending_rules: {
        Row: {
          id: string;
          patient_id: string;
          max_single_txn: number;
          daily_limit: number;
          blocked_categories: string[];
        };
        Insert: {
          id?: string;
          patient_id: string;
          max_single_txn?: number;
          daily_limit?: number;
          blocked_categories?: string[];
        };
        Update: {
          id?: string;
          patient_id?: string;
          max_single_txn?: number;
          daily_limit?: number;
          blocked_categories?: string[];
        };
      };
      events: {
        Row: {
          id: string;
          patient_id: string;
          kind: EventKind;
          status: EventStatus;
          payload: Record<string, unknown>;
          snapshot_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          kind: EventKind;
          status?: EventStatus;
          payload?: Record<string, unknown>;
          snapshot_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          kind?: EventKind;
          status?: EventStatus;
          payload?: Record<string, unknown>;
          snapshot_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          patient_id: string;
          knot_id: string;
          total: number;
          merchant: string;
          skus: unknown[];
          flagged: boolean;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          knot_id: string;
          total: number;
          merchant: string;
          skus?: unknown[];
          flagged?: boolean;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          knot_id?: string;
          total?: number;
          merchant?: string;
          skus?: unknown[];
          flagged?: boolean;
          reason?: string | null;
          created_at?: string;
        };
      };
      system_health: {
        Row: {
          id: string;
          cam_kind: string;
          last_heartbeat_at: string;
        };
        Insert: {
          id?: string;
          cam_kind: string;
          last_heartbeat_at?: string;
        };
        Update: {
          id?: string;
          cam_kind?: string;
          last_heartbeat_at?: string;
        };
      };
    };
    Enums: {
      event_kind: EventKind;
      event_status: EventStatus;
    };
  };
}
