export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          answer_value: string
          id: string
          question_id: string
          response_id: string
        }
        Insert: {
          answer_value: string
          id?: string
          question_id: string
          response_id: string
        }
        Update: {
          answer_value?: string
          id?: string
          question_id?: string
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          customer_id: string
          id: string
          responded: boolean | null
          sent_at: string | null
        }
        Insert: {
          campaign_id: string
          customer_id: string
          id?: string
          responded?: boolean | null
          sent_at?: string | null
        }
        Update: {
          campaign_id?: string
          customer_id?: string
          id?: string
          responded?: boolean | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          id: string
          name: string
          survey_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          survey_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          building_number: string | null
          created_at: string
          delivery_date: string | null
          has_responded: boolean | null
          id: string
          is_delivered: boolean | null
          name: string
          phone: string
          project_name: string | null
          token: string
          unit_number: string | null
          updated_at: string
        }
        Insert: {
          building_number?: string | null
          created_at?: string
          delivery_date?: string | null
          has_responded?: boolean | null
          id?: string
          is_delivered?: boolean | null
          name: string
          phone: string
          project_name?: string | null
          token?: string
          unit_number?: string | null
          updated_at?: string
        }
        Update: {
          building_number?: string | null
          created_at?: string
          delivery_date?: string | null
          has_responded?: boolean | null
          id?: string
          is_delivered?: boolean | null
          name?: string
          phone?: string
          project_name?: string | null
          token?: string
          unit_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nps_after_year_responses: {
        Row: {
          building_number: string | null
          communication_score: number | null
          community_score: number | null
          created_at: string
          customer_name: string | null
          delivery_commitment_score: number | null
          documents_received: string | null
          engineer_score: number | null
          finishing_quality_score: number | null
          id: string
          maintenance_score: number | null
          maintenance_speed_score: number | null
          match_status: string | null
          nps_score: number | null
          open_feedback: string | null
          phone: string | null
          project_name: string | null
          timestamp: string | null
          transparency_score: number | null
          unit_number: string | null
        }
        Insert: {
          building_number?: string | null
          communication_score?: number | null
          community_score?: number | null
          created_at?: string
          customer_name?: string | null
          delivery_commitment_score?: number | null
          documents_received?: string | null
          engineer_score?: number | null
          finishing_quality_score?: number | null
          id?: string
          maintenance_score?: number | null
          maintenance_speed_score?: number | null
          match_status?: string | null
          nps_score?: number | null
          open_feedback?: string | null
          phone?: string | null
          project_name?: string | null
          timestamp?: string | null
          transparency_score?: number | null
          unit_number?: string | null
        }
        Update: {
          building_number?: string | null
          communication_score?: number | null
          community_score?: number | null
          created_at?: string
          customer_name?: string | null
          delivery_commitment_score?: number | null
          documents_received?: string | null
          engineer_score?: number | null
          finishing_quality_score?: number | null
          id?: string
          maintenance_score?: number | null
          maintenance_speed_score?: number | null
          match_status?: string | null
          nps_score?: number | null
          open_feedback?: string | null
          phone?: string | null
          project_name?: string | null
          timestamp?: string | null
          transparency_score?: number | null
          unit_number?: string | null
        }
        Relationships: []
      }
      nps_new_responses: {
        Row: {
          building_number: string | null
          created_at: string
          customer_name: string | null
          delivery_commitment_score: number | null
          documents_received: string | null
          engineer_score: number | null
          finishing_notes_score: number | null
          id: string
          maintenance_score: number | null
          match_status: string | null
          nps_score: number | null
          open_feedback: string | null
          phone: string | null
          project_name: string | null
          sales_score: number | null
          satisfaction_score: number | null
          timestamp: string | null
          unit_number: string | null
        }
        Insert: {
          building_number?: string | null
          created_at?: string
          customer_name?: string | null
          delivery_commitment_score?: number | null
          documents_received?: string | null
          engineer_score?: number | null
          finishing_notes_score?: number | null
          id?: string
          maintenance_score?: number | null
          match_status?: string | null
          nps_score?: number | null
          open_feedback?: string | null
          phone?: string | null
          project_name?: string | null
          sales_score?: number | null
          satisfaction_score?: number | null
          timestamp?: string | null
          unit_number?: string | null
        }
        Update: {
          building_number?: string | null
          created_at?: string
          customer_name?: string | null
          delivery_commitment_score?: number | null
          documents_received?: string | null
          engineer_score?: number | null
          finishing_notes_score?: number | null
          id?: string
          maintenance_score?: number | null
          match_status?: string | null
          nps_score?: number | null
          open_feedback?: string | null
          phone?: string | null
          project_name?: string | null
          sales_score?: number | null
          satisfaction_score?: number | null
          timestamp?: string | null
          unit_number?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          order_index: number
          question_text: string
          question_type: string
          survey_id: string
        }
        Insert: {
          id?: string
          order_index?: number
          question_text: string
          question_type: string
          survey_id: string
        }
        Update: {
          id?: string
          order_index?: number
          question_text?: string
          question_type?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          campaign_id: string | null
          customer_id: string
          id: string
          submitted_at: string
          survey_id: string
        }
        Insert: {
          campaign_id?: string | null
          customer_id: string
          id?: string
          submitted_at?: string
          survey_id: string
        }
        Update: {
          campaign_id?: string | null
          customer_id?: string
          id?: string
          submitted_at?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
