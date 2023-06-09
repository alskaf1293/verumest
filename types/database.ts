export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      
      replies: {
        Row: {
          comment: string
          post_id: string
          reply_id: string
          user_id: string
        }
        Insert: {
          comment: string
          post_id: string
          reply_id?: string
          user_id: string
        }
        Update: {
          comment?: string
          post_id?: string
          reply_id?: string
          user_id?: string
        }
      }
      users: {
        Row: {
          first_name: string | null
          last_name: string | null
          user_id: string
        }
        Insert: {
          first_name?: string | null
          last_name?: string | null
          user_id: string
        }
        Update: {
          first_name?: string | null
          last_name?: string | null
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
