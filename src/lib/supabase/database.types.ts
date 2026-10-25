
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "apple_devices": {
                  Row: {
                    "created_at": string,"device_library_identifier": string,"id": string,"push_token": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"device_library_identifier": string,"id"?: string,"push_token": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"device_library_identifier"?: string,"id"?: string,"push_token"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"apple_registrations": {
                  Row: {
                    "created_at": string,"device_id": string,"pass_id": string
                  }
                  Insert: {
                    "created_at"?: string,"device_id": string,"pass_id": string
                  }
                  Update: {
                    "created_at"?: string,"device_id"?: string,"pass_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "apple_registrations_device_id_fkey"
      columns: ["device_id"]
isOneToOne: false
      referencedRelation: "apple_devices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "apple_registrations_pass_id_fkey"
      columns: ["pass_id"]
isOneToOne: false
      referencedRelation: "wallet_passes"
      referencedColumns: ["id"]
    }
                  ]
                },"members": {
                  Row: {
                    "created_at": string,"email": string,"first_name": string,"id": string,"last_name": string,"points": number,"program_id": string,"stamp_rewards": number,"stamps": number,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"email": string,"first_name": string,"id"?: string,"last_name": string,"points": number,"program_id": string,"stamp_rewards"?: number,"stamps"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"first_name"?: string,"id"?: string,"last_name"?: string,"points"?: number,"program_id"?: string,"stamp_rewards"?: number,"stamps"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "members_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "created_at": string,"id": number,"message": string,"program_id": string,"sent_by": string | null
                  }
                  Insert: {
                    "created_at"?: string,"id"?: never,"message": string,"program_id": string,"sent_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"message"?: string,"program_id"?: string,"sent_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"point_transactions": {
                  Row: {
                    "balance_after": number,"created_at": string,"created_by": string | null,"delta": number,"id": number,"kind": Database["public"]['Enums']["point_transaction_kind"],"member_id": string
                  }
                  Insert: {
                    "balance_after": number,"created_at"?: string,"created_by"?: string | null,"delta": number,"id"?: never,"kind": Database["public"]['Enums']["point_transaction_kind"],"member_id": string
                  }
                  Update: {
                    "balance_after"?: number,"created_at"?: string,"created_by"?: string | null,"delta"?: number,"id"?: never,"kind"?: Database["public"]['Enums']["point_transaction_kind"],"member_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "point_transactions_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"program_invitations": {
                  Row: {
                    "created_at": string,"email": string,"expires_at": string,"id": string,"invited_by": string | null,"program_id": string,"role": Database["public"]['Enums']["program_role"],"token_hash": string
                  }
                  Insert: {
                    "created_at"?: string,"email": string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"program_id": string,"role"?: Database["public"]['Enums']["program_role"],"token_hash": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"program_id"?: string,"role"?: Database["public"]['Enums']["program_role"],"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "program_invitations_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"program_members": {
                  Row: {
                    "created_at": string,"program_id": string,"role": Database["public"]['Enums']["program_role"],"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"program_id": string,"role"?: Database["public"]['Enums']["program_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"program_id"?: string,"role"?: Database["public"]['Enums']["program_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "program_members_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"programs": {
                  Row: {
                    "background_color": string,"created_at": string,"id": string,"initial_points": number,"initial_stamps": number,"kind": Database["public"]['Enums']["program_kind"],"logo_path": string | null,"name": string,"owner_id": string,"stamp_icon": string | null,"stamp_images_path": string | null,"stamp_reward": string | null,"updated_at": string,"wallet_message": string | null
                  }
                  Insert: {
                    "background_color": string,"created_at"?: string,"id"?: string,"initial_points"?: number,"initial_stamps"?: number,"kind"?: Database["public"]['Enums']["program_kind"],"logo_path"?: string | null,"name": string,"owner_id"?: string,"stamp_icon"?: string | null,"stamp_images_path"?: string | null,"stamp_reward"?: string | null,"updated_at"?: string,"wallet_message"?: string | null
                  }
                  Update: {
                    "background_color"?: string,"created_at"?: string,"id"?: string,"initial_points"?: number,"initial_stamps"?: number,"kind"?: Database["public"]['Enums']["program_kind"],"logo_path"?: string | null,"name"?: string,"owner_id"?: string,"stamp_icon"?: string | null,"stamp_images_path"?: string | null,"stamp_reward"?: string | null,"updated_at"?: string,"wallet_message"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"stamp_transactions": {
                  Row: {
                    "balance_after": number,"created_at": string,"created_by": string | null,"delta": number,"id": number,"kind": Database["public"]['Enums']["stamp_transaction_kind"],"member_id": string
                  }
                  Insert: {
                    "balance_after": number,"created_at"?: string,"created_by"?: string | null,"delta": number,"id"?: never,"kind": Database["public"]['Enums']["stamp_transaction_kind"],"member_id": string
                  }
                  Update: {
                    "balance_after"?: number,"created_at"?: string,"created_by"?: string | null,"delta"?: number,"id"?: never,"kind"?: Database["public"]['Enums']["stamp_transaction_kind"],"member_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stamp_transactions_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"wallet_passes": {
                  Row: {
                    "authentication_token": string,"created_at": string,"id": string,"installed_at": string | null,"member_id": string,"provider": Database["public"]['Enums']["wallet_provider"],"serial_number": string,"uninstalled_at": string | null,"updated_at": string
                  }
                  Insert: {
                    "authentication_token"?: string,"created_at"?: string,"id"?: string,"installed_at"?: string | null,"member_id": string,"provider": Database["public"]['Enums']["wallet_provider"],"serial_number"?: string,"uninstalled_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "authentication_token"?: string,"created_at"?: string,"id"?: string,"installed_at"?: string | null,"member_id"?: string,"provider"?: Database["public"]['Enums']["wallet_provider"],"serial_number"?: string,"uninstalled_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "wallet_passes_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_program_invitation":
{ Args: { "token": string,"user_id": string }; Returns: string
                           },
"add_stamps":
{ Args: { "count": number,"member_id": string }; Returns: {
              "reward_given": boolean,"stamps": number
            }[]
                           },
"adjust_points":
{ Args: { "delta": number,"member_id": string }; Returns: number
                           },
"create_notification":
{ Args: { "message": string,"monthly_cap": number,"program_id": string,"sent_by": string }; Returns: {
              "created_at": string,
"id": number,
"message": string,
"program_id": string,
"sent_by": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "notifications"
        isOneToOne: false
        isSetofReturn: true
      } },
"create_program_invitation":
{ Args: { "email": string,"invited_by": string,"program_id": string }; Returns: {
              "expires_at": string,"invitation_id": string,"token": string
            }[]
                           },
"enroll_member":
{ Args: { "email": string,"first_name": string,"last_name": string,"program_id": string,"provider": Database["public"]['Enums']["wallet_provider"] }; Returns: {
              "authentication_token": string,"serial_number": string
            }[]
                           },
"get_program_invitation":
{ Args: { "token": string }; Returns: {
              "email": string,"program_id": string,"program_name": string
            }[]
                           },
"issue_wallet_pass":
{ Args: { "email": string,"first_name": string,"last_name": string,"program_id": string,"provider": Database["public"]['Enums']["wallet_provider"] }; Returns: {
              "authentication_token": string,"member_created": boolean,"serial_number": string
            }[]
                           },
"list_apple_device_passes":
{ Args: { "device_library_identifier": string,"updated_since"?: string }; Returns: {
              "last_updated": string,"serial_number": string
            }[]
                           },
"list_members":
{ Args: { "after_created_at"?: string,"after_id"?: string,"page_size"?: number,"program_id": string,"search"?: string }; Returns: {
              "created_at": string,
"email": string,
"first_name": string,
"id": string,
"last_name": string,
"points": number,
"program_id": string,
"stamp_rewards": number,
"stamps": number,
"updated_at": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "members"
        isOneToOne: false
        isSetofReturn: true
      } },
"list_program_apple_devices":
{ Args: { "program_id": string }; Returns: {
              "device_library_identifier": string,"pass_ids": (string)[],"push_token": string
            }[]
                           },
"list_program_team":
{ Args: { "program_id": string }; Returns: {
              "email": string,"joined_at": string,"role": Database["public"]['Enums']["program_role"],"user_id": string
            }[]
                           },
"notification_usage":
{ Args: { "program_id": string }; Returns: {
              "last_sent_at": string,"sent_this_month": number
            }[]
                           },
"program_stats":
{ Args: { "program_id": string }; Returns: {
              "members": number,"members_in_wallet": number,"new_members": number,"point_additions": number,"redemptions": number
            }[]
                           },
"record_wallet_pass_install":
{ Args: { "installed": boolean,"pass_id": string }; Returns: undefined
                           },
"register_apple_device":
{ Args: { "device_library_identifier": string,"pass_id": string,"push_token": string }; Returns: boolean
                           },
"unregister_apple_device":
{ Args: { "device_library_identifier": string,"pass_id": string }; Returns: undefined
                           }
          }
          Enums: {
            "point_transaction_kind": "welcome"|"adjustment","program_kind": "points"|"stamps","program_role": "admin"|"member","stamp_transaction_kind": "welcome"|"stamp"|"reward"|"adjustment","wallet_provider": "apple"|"google"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "point_transaction_kind": ["welcome", "adjustment"],"program_kind": ["points", "stamps"],"program_role": ["admin", "member"],"stamp_transaction_kind": ["welcome", "stamp", "reward", "adjustment"],"wallet_provider": ["apple", "google"]
          }
        }
} as const
