export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admins: {
        Row: {
          auth_user_id: string
          id: string
        }
        Insert: {
          auth_user_id: string
          id?: string
        }
        Update: {
          auth_user_id?: string
          id?: string
        }
        Relationships: []
      }
      assignment_assignees: {
        Row: {
          assigned_at: string
          assigned_via: Database["public"]["Enums"]["assigned_via"]
          assignment_id: string
          event_staff_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_via?: Database["public"]["Enums"]["assigned_via"]
          assignment_id: string
          event_staff_id: string
        }
        Update: {
          assigned_at?: string
          assigned_via?: Database["public"]["Enums"]["assigned_via"]
          assignment_id?: string
          event_staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_assignees_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_assignees_event_staff_id_fkey"
            columns: ["event_staff_id"]
            isOneToOne: false
            referencedRelation: "event_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          event_id: string
          id: string
          parent_assignment_id: string | null
          pickup_setting: Database["public"]["Enums"]["pickup_setting"]
          priority: Database["public"]["Enums"]["assignment_priority"]
          status: Database["public"]["Enums"]["assignment_status"]
          tags: string[]
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id: string
          id?: string
          parent_assignment_id?: string | null
          pickup_setting?: Database["public"]["Enums"]["pickup_setting"]
          priority?: Database["public"]["Enums"]["assignment_priority"]
          status?: Database["public"]["Enums"]["assignment_status"]
          tags?: string[]
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id?: string
          id?: string
          parent_assignment_id?: string | null
          pickup_setting?: Database["public"]["Enums"]["pickup_setting"]
          priority?: Database["public"]["Enums"]["assignment_priority"]
          status?: Database["public"]["Enums"]["assignment_status"]
          tags?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_parent_assignment_id_fkey"
            columns: ["parent_assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          company_name: string | null
          contact_id: string
          created_at: string
          id: string
          notes: string | null
        }
        Insert: {
          company_name?: string | null
          contact_id: string
          created_at?: string
          id?: string
          notes?: string | null
        }
        Update: {
          company_name?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_categories: {
        Row: {
          category_id: string
          contact_id: string
        }
        Insert: {
          category_id: string
          contact_id: string
        }
        Update: {
          category_id?: string
          contact_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_categories_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          event_staff_id: string
        }
        Insert: {
          conversation_id: string
          event_staff_id: string
        }
        Update: {
          conversation_id?: string
          event_staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_event_staff_id_fkey"
            columns: ["event_staff_id"]
            isOneToOne: false
            referencedRelation: "event_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by_admin_id: string | null
          created_by_event_staff_id: string | null
          event_id: string
          id: string
        }
        Insert: {
          created_at?: string
          created_by_admin_id?: string | null
          created_by_event_staff_id?: string | null
          event_id: string
          id?: string
        }
        Update: {
          created_at?: string
          created_by_admin_id?: string | null
          created_by_event_staff_id?: string | null
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_created_by_event_staff_id_fkey"
            columns: ["created_by_event_staff_id"]
            isOneToOne: false
            referencedRelation: "event_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      email_recipients: {
        Row: {
          contact_id: string
          email_send_id: string
        }
        Insert: {
          contact_id: string
          email_send_id: string
        }
        Update: {
          contact_id?: string
          email_send_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_recipients_email_send_id_fkey"
            columns: ["email_send_id"]
            isOneToOne: false
            referencedRelation: "email_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          body_html: string
          form_attachment_id: string | null
          id: string
          sent_at: string
          subject: string
        }
        Insert: {
          body_html: string
          form_attachment_id?: string | null
          id?: string
          sent_at?: string
          subject: string
        }
        Update: {
          body_html?: string
          form_attachment_id?: string | null
          id?: string
          sent_at?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_form_attachment_id_fkey"
            columns: ["form_attachment_id"]
            isOneToOne: false
            referencedRelation: "form_attachments"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          created_at: string
          id: string
          name: string
          source: Database["public"]["Enums"]["email_template_source"]
        }
        Insert: {
          body_html: string
          created_at?: string
          id?: string
          name: string
          source?: Database["public"]["Enums"]["email_template_source"]
        }
        Update: {
          body_html?: string
          created_at?: string
          id?: string
          name?: string
          source?: Database["public"]["Enums"]["email_template_source"]
        }
        Relationships: []
      }
      event_attendance: {
        Row: {
          contact_id: string
          created_at: string
          event_id: string
          id: string
          source: Database["public"]["Enums"]["attendance_source"]
        }
        Insert: {
          contact_id: string
          created_at?: string
          event_id: string
          id?: string
          source?: Database["public"]["Enums"]["attendance_source"]
        }
        Update: {
          contact_id?: string
          created_at?: string
          event_id?: string
          id?: string
          source?: Database["public"]["Enums"]["attendance_source"]
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_series: {
        Row: {
          client_id: string
          created_at: string
          id: string
          label: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          label: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_series_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff: {
        Row: {
          auth_user_id: string | null
          contact_id: string
          id: string
          invite_status: Database["public"]["Enums"]["staff_invite_status"]
          invited_at: string
        }
        Insert: {
          auth_user_id?: string | null
          contact_id: string
          id?: string
          invite_status?: Database["public"]["Enums"]["staff_invite_status"]
          invited_at?: string
        }
        Update: {
          auth_user_id?: string | null
          contact_id?: string
          id?: string
          invite_status?: Database["public"]["Enums"]["staff_invite_status"]
          invited_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          series_id: string | null
          staff_can_start_conversations: boolean
          starts_at: string | null
          status: Database["public"]["Enums"]["event_status"]
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          series_id?: string | null
          staff_can_start_conversations?: boolean
          starts_at?: string | null
          status?: Database["public"]["Enums"]["event_status"]
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          series_id?: string | null
          staff_can_start_conversations?: boolean
          starts_at?: string | null
          status?: Database["public"]["Enums"]["event_status"]
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "event_series"
            referencedColumns: ["id"]
          },
        ]
      }
      form_attachments: {
        Row: {
          created_at: string
          form_template_id: string
          id: string
          staff_visible: boolean
          target_id: string
          target_type: Database["public"]["Enums"]["form_attachment_target"]
        }
        Insert: {
          created_at?: string
          form_template_id: string
          id?: string
          staff_visible?: boolean
          target_id: string
          target_type: Database["public"]["Enums"]["form_attachment_target"]
        }
        Update: {
          created_at?: string
          form_template_id?: string
          id?: string
          staff_visible?: boolean
          target_id?: string
          target_type?: Database["public"]["Enums"]["form_attachment_target"]
        }
        Relationships: [
          {
            foreignKeyName: "form_attachments_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      form_fields: {
        Row: {
          description: string | null
          field_type: Database["public"]["Enums"]["form_field_type"]
          form_template_id: string
          id: string
          label: string
          position: number
          required: boolean
          styling: Json
        }
        Insert: {
          description?: string | null
          field_type: Database["public"]["Enums"]["form_field_type"]
          form_template_id: string
          id?: string
          label: string
          position: number
          required?: boolean
          styling?: Json
        }
        Update: {
          description?: string | null
          field_type?: Database["public"]["Enums"]["form_field_type"]
          form_template_id?: string
          id?: string
          label?: string
          position?: number
          required?: boolean
          styling?: Json
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          theme: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          theme?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          theme?: Json
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_admin_id: string | null
          sender_event_staff_id: string | null
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_admin_id?: string | null
          sender_event_staff_id?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_admin_id?: string | null
          sender_event_staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_admin_id_fkey"
            columns: ["sender_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_event_staff_id_fkey"
            columns: ["sender_event_staff_id"]
            isOneToOne: false
            referencedRelation: "event_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_entries: {
        Row: {
          added_at: string
          event_id: string
          event_staff_id: string
        }
        Insert: {
          added_at?: string
          event_id: string
          event_staff_id: string
        }
        Update: {
          added_at?: string
          event_id?: string
          event_staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_entries_event_staff_id_fkey"
            columns: ["event_staff_id"]
            isOneToOne: false
            referencedRelation: "event_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_answers: {
        Row: {
          file_ref: string | null
          form_field_id: string
          id: string
          submission_id: string
          value: string | null
        }
        Insert: {
          file_ref?: string | null
          form_field_id: string
          id?: string
          submission_id: string
          value?: string | null
        }
        Update: {
          file_ref?: string | null
          form_field_id?: string
          id?: string
          submission_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_answers_form_field_id_fkey"
            columns: ["form_field_id"]
            isOneToOne: false
            referencedRelation: "form_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          contact_id: string | null
          form_attachment_id: string
          id: string
          submitted_at: string
        }
        Insert: {
          contact_id?: string | null
          form_attachment_id: string
          id?: string
          submitted_at?: string
        }
        Update: {
          contact_id?: string | null
          form_attachment_id?: string
          id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_form_attachment_id_fkey"
            columns: ["form_attachment_id"]
            isOneToOne: false
            referencedRelation: "form_attachments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_own_staff_account: { Args: never; Returns: undefined }
      can_staff_view_form_attachment: {
        Args: { target_attachment_id: string }
        Returns: boolean
      }
      create_conversation: {
        Args: { participant_event_staff_ids: string[]; target_event_id: string }
        Returns: string
      }
      current_event_staff_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_conversation_participant: {
        Args: { target_conversation_id: string }
        Returns: boolean
      }
      is_on_roster: { Args: { target_event_id: string }; Returns: boolean }
      is_on_roster_for_assignment: {
        Args: { target_assignment_id: string }
        Returns: boolean
      }
      pickup_assignment: {
        Args: { target_assignment_id: string }
        Returns: undefined
      }
      set_assignment_status: {
        Args: {
          new_status: Database["public"]["Enums"]["assignment_status"]
          target_assignment_id: string
        }
        Returns: undefined
      }
      shares_roster_with: { Args: { other_staff_id: string }; Returns: boolean }
    }
    Enums: {
      assigned_via: "admin" | "pickup"
      assignment_priority: "low" | "medium" | "high"
      assignment_status: "ready" | "in_progress" | "blocked" | "done"
      attendance_source: "manual" | "form_submission"
      email_template_source: "manual" | "ai_draft"
      event_status: "active" | "completed"
      form_attachment_target: "event" | "assignment" | "email_send"
      form_field_type:
        | "text"
        | "email"
        | "tel"
        | "number"
        | "date"
        | "textarea"
        | "select"
        | "file"
      pickup_setting: "admin_only" | "open_pickup"
      staff_invite_status: "invited" | "active" | "revoked"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      assigned_via: ["admin", "pickup"],
      assignment_priority: ["low", "medium", "high"],
      assignment_status: ["ready", "in_progress", "blocked", "done"],
      attendance_source: ["manual", "form_submission"],
      email_template_source: ["manual", "ai_draft"],
      event_status: ["active", "completed"],
      form_attachment_target: ["event", "assignment", "email_send"],
      form_field_type: [
        "text",
        "email",
        "tel",
        "number",
        "date",
        "textarea",
        "select",
        "file",
      ],
      pickup_setting: ["admin_only", "open_pickup"],
      staff_invite_status: ["invited", "active", "revoked"],
    },
  },
} as const

