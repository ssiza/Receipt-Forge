export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_user_id: string
          email: string
          name: string | null
          role: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          auth_user_id: string
          email: string
          name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          auth_user_id?: string
          email?: string
          name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      receipts: {
        Row: {
          id: string
          team_id: string
          user_id: string
          issue_date: string
          customer_name: string
          customer_email: string | null
          customer_phone: string | null
          customer_address: string | null
          items: Json[]
          subtotal: number
          tax_amount: number
          total_amount: number
          currency: string
          status: string
          notes: string | null
          business_name: string | null
          business_address: string | null
          business_phone: string | null
          business_email: string | null
          due_date: string | null
          payment_terms: string | null
          reference: string | null
          item_additional_fields: Json[] | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          issue_date: string
          customer_name: string
          customer_email?: string | null
          customer_phone?: string | null
          customer_address?: string | null
          items: Json[]
          subtotal: number
          tax_amount?: number
          total_amount: number
          currency?: string
          status?: string
          notes?: string | null
          business_name?: string | null
          business_address?: string | null
          business_phone?: string | null
          business_email?: string | null
          due_date?: string | null
          payment_terms?: string | null
          reference?: string | null
          item_additional_fields?: Json[] | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          issue_date?: string
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string | null
          customer_address?: string | null
          items?: Json[]
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          currency?: string
          status?: string
          notes?: string | null
          business_name?: string | null
          business_address?: string | null
          business_phone?: string | null
          business_email?: string | null
          due_date?: string | null
          payment_terms?: string | null
          reference?: string | null
          item_additional_fields?: Json[] | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: 'admin' | 'member'
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: 'admin' | 'member'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_legacy_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_team_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
