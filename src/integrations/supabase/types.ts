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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_alerts: {
        Row: {
          alert_type: string
          created_at: string
          details: Json | null
          id: string
          is_resolved: boolean
          message: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          details?: Json | null
          id?: string
          is_resolved?: boolean
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          is_resolved?: boolean
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: []
      }
      ai_annotations: {
        Row: {
          admin_user_id: string
          annotation_type: string
          conversation_id: string | null
          created_at: string
          id: string
          message_id: string | null
          notes: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          annotation_type: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          notes?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          annotation_type?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          notes?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_annotations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_annotations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_feedback: {
        Row: {
          context: Json | null
          created_at: string
          feature: string
          feedback_text: string | null
          id: string
          message_id: string | null
          rating: string
          user_id: string
          water_test_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          feature: string
          feedback_text?: string | null
          id?: string
          message_id?: string | null
          rating: string
          user_id: string
          water_test_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          feature?: string
          feedback_text?: string | null
          id?: string
          message_id?: string | null
          rating?: string
          user_id?: string
          water_test_id?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string
          custom_user_ids: string[] | null
          id: string
          message: string
          scheduled_at: string | null
          send_email: boolean
          send_in_app: boolean
          sent_at: string | null
          status: string
          target_audience: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          custom_user_ids?: string[] | null
          id?: string
          message: string
          scheduled_at?: string | null
          send_email?: boolean
          send_in_app?: boolean
          sent_at?: string | null
          status?: string
          target_audience?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          custom_user_ids?: string[] | null
          id?: string
          message?: string
          scheduled_at?: string | null
          send_email?: boolean
          send_in_app?: boolean
          sent_at?: string | null
          status?: string
          target_audience?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      aquariums: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          name: string
          notes: string | null
          pool_adjustments: Json | null
          pool_dimensions: Json | null
          pool_shape: string | null
          setup_date: string | null
          status: string | null
          type: string
          updated_at: string
          user_id: string
          volume_calculation_method: string | null
          volume_confidence_range: Json | null
          volume_gallons: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          name: string
          notes?: string | null
          pool_adjustments?: Json | null
          pool_dimensions?: Json | null
          pool_shape?: string | null
          setup_date?: string | null
          status?: string | null
          type: string
          updated_at?: string
          user_id: string
          volume_calculation_method?: string | null
          volume_confidence_range?: Json | null
          volume_gallons?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          name?: string
          notes?: string | null
          pool_adjustments?: Json | null
          pool_dimensions?: Json | null
          pool_shape?: string | null
          setup_date?: string | null
          status?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          volume_calculation_method?: string | null
          volume_confidence_range?: Json | null
          volume_gallons?: number | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          author_name: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id: string
          author_name?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string
          author_name?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          aquarium_id: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aquarium_id?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aquarium_id?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          inquiry_type: string | null
          message: string
          name: string
          status: string | null
          subject: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          inquiry_type?: string | null
          message: string
          name: string
          status?: string | null
          subject?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          inquiry_type?: string | null
          message?: string
          name?: string
          status?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      custom_parameter_templates: {
        Row: {
          aquarium_type: string
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          parameters: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          aquarium_type: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          parameters: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          aquarium_type?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          parameters?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          aquarium_id: string
          brand: string | null
          created_at: string
          equipment_type: string
          id: string
          install_date: string | null
          last_maintenance_date: string | null
          maintenance_interval_days: number | null
          model: string | null
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          aquarium_id: string
          brand?: string | null
          created_at?: string
          equipment_type: string
          id?: string
          install_date?: string | null
          last_maintenance_date?: string | null
          maintenance_interval_days?: number | null
          model?: string | null
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          aquarium_id?: string
          brand?: string | null
          created_at?: string
          equipment_type?: string
          id?: string
          install_date?: string | null
          last_maintenance_date?: string | null
          maintenance_interval_days?: number | null
          model?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_aquarium_id_fkey"
            columns: ["aquarium_id"]
            isOneToOne: false
            referencedRelation: "aquariums"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flag_overrides: {
        Row: {
          created_at: string
          enabled: boolean
          flag_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled: boolean
          flag_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          flag_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flag_overrides_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          key: string
          name: string
          rollout_percentage: number
          target_roles: Database["public"]["Enums"]["app_role"][] | null
          target_tiers: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          name: string
          rollout_percentage?: number
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          target_tiers?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          name?: string
          rollout_percentage?: number
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          target_tiers?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      incident_updates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          incident_id: string
          message: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          incident_id: string
          message: string
          status: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          incident_id?: string
          message?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_updates_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "system_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock: {
        Row: {
          aquarium_id: string
          category: string
          created_at: string
          date_added: string
          health_status: string
          id: string
          name: string
          notes: string | null
          primary_photo_url: string | null
          quantity: number
          species: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aquarium_id: string
          category: string
          created_at?: string
          date_added?: string
          health_status?: string
          id?: string
          name: string
          notes?: string | null
          primary_photo_url?: string | null
          quantity?: number
          species: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aquarium_id?: string
          category?: string
          created_at?: string
          date_added?: string
          health_status?: string
          id?: string
          name?: string
          notes?: string | null
          primary_photo_url?: string | null
          quantity?: number
          species?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestock_aquarium_id_fkey"
            columns: ["aquarium_id"]
            isOneToOne: false
            referencedRelation: "aquariums"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          livestock_id: string
          photo_url: string
          taken_at: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          livestock_id: string
          photo_url: string
          taken_at?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          livestock_id?: string
          photo_url?: string
          taken_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestock_photos_livestock_id_fkey"
            columns: ["livestock_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
        ]
      }
      login_history: {
        Row: {
          failure_reason: string | null
          id: string
          ip_address: string | null
          login_at: string
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          login_at?: string
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          login_at?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      maintenance_tasks: {
        Row: {
          aquarium_id: string
          completed_date: string | null
          created_at: string
          due_date: string
          equipment_id: string | null
          id: string
          is_recurring: boolean | null
          notes: string | null
          recurrence_days: number | null
          recurrence_interval: string | null
          status: string | null
          task_name: string
          task_type: string
          updated_at: string
        }
        Insert: {
          aquarium_id: string
          completed_date?: string | null
          created_at?: string
          due_date: string
          equipment_id?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          recurrence_days?: number | null
          recurrence_interval?: string | null
          status?: string | null
          task_name: string
          task_type: string
          updated_at?: string
        }
        Update: {
          aquarium_id?: string
          completed_date?: string | null
          created_at?: string
          due_date?: string
          equipment_id?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          recurrence_days?: number | null
          recurrence_interval?: string | null
          status?: string | null
          task_name?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tasks_aquarium_id_fkey"
            columns: ["aquarium_id"]
            isOneToOne: false
            referencedRelation: "aquariums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tasks_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          body: string
          id: string
          notification_type: string
          reference_id: string | null
          sent_at: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          id?: string
          notification_type: string
          reference_id?: string | null
          sent_at?: string
          title?: string
          user_id: string
        }
        Update: {
          body?: string
          id?: string
          notification_type?: string
          reference_id?: string | null
          sent_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          announcements_enabled: boolean
          created_at: string
          health_alerts_enabled: boolean
          id: string
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reminder_hours_before: number
          sound_announcements: boolean
          sound_health_alerts: boolean
          sound_task_reminders: boolean
          sound_water_alerts: boolean
          sound_weather_alerts: boolean
          task_reminders_enabled: boolean
          updated_at: string
          user_id: string
          water_alerts_enabled: boolean
          weather_alerts_enabled: boolean
        }
        Insert: {
          announcements_enabled?: boolean
          created_at?: string
          health_alerts_enabled?: boolean
          id?: string
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_hours_before?: number
          sound_announcements?: boolean
          sound_health_alerts?: boolean
          sound_task_reminders?: boolean
          sound_water_alerts?: boolean
          sound_weather_alerts?: boolean
          task_reminders_enabled?: boolean
          updated_at?: string
          user_id: string
          water_alerts_enabled?: boolean
          weather_alerts_enabled?: boolean
        }
        Update: {
          announcements_enabled?: boolean
          created_at?: string
          health_alerts_enabled?: boolean
          id?: string
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_hours_before?: number
          sound_announcements?: boolean
          sound_health_alerts?: boolean
          sound_task_reminders?: boolean
          sound_water_alerts?: boolean
          sound_weather_alerts?: boolean
          task_reminders_enabled?: boolean
          updated_at?: string
          user_id?: string
          water_alerts_enabled?: boolean
          weather_alerts_enabled?: boolean
        }
        Relationships: []
      }
      partner_applications: {
        Row: {
          additional_links: string | null
          agreed_to_ftc: boolean
          agreed_to_terms: boolean
          audience_focus: string[]
          avg_views: number | null
          business_type: string | null
          channels: string[]
          company_name: string | null
          confirmed_accuracy: boolean
          country: string
          created_at: string
          email: string
          full_name: string
          id: string
          monthly_visitors: number | null
          newsletter_subscribers: number | null
          partnership_type: string
          payout_method: string
          paypal_email: string | null
          phone: string | null
          primary_channel_link: string
          promotion_plan: string | null
          referral_code: string | null
          referral_source: string | null
          role_title: string | null
          status: string
          timezone: string | null
          total_followers: number | null
          website_url: string | null
        }
        Insert: {
          additional_links?: string | null
          agreed_to_ftc?: boolean
          agreed_to_terms?: boolean
          audience_focus: string[]
          avg_views?: number | null
          business_type?: string | null
          channels: string[]
          company_name?: string | null
          confirmed_accuracy?: boolean
          country: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          monthly_visitors?: number | null
          newsletter_subscribers?: number | null
          partnership_type: string
          payout_method: string
          paypal_email?: string | null
          phone?: string | null
          primary_channel_link: string
          promotion_plan?: string | null
          referral_code?: string | null
          referral_source?: string | null
          role_title?: string | null
          status?: string
          timezone?: string | null
          total_followers?: number | null
          website_url?: string | null
        }
        Update: {
          additional_links?: string | null
          agreed_to_ftc?: boolean
          agreed_to_terms?: boolean
          audience_focus?: string[]
          avg_views?: number | null
          business_type?: string | null
          channels?: string[]
          company_name?: string | null
          confirmed_accuracy?: boolean
          country?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          monthly_visitors?: number | null
          newsletter_subscribers?: number | null
          partnership_type?: string
          payout_method?: string
          paypal_email?: string | null
          phone?: string | null
          primary_channel_link?: string
          promotion_plan?: string | null
          referral_code?: string | null
          referral_source?: string | null
          role_title?: string | null
          status?: string
          timezone?: string | null
          total_followers?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      photo_analysis_corrections: {
        Row: {
          ai_confidence: number | null
          ai_detected_value: number
          correction_delta: number
          created_at: string
          id: string
          parameter_name: string
          user_corrected_value: number
          user_id: string
          water_test_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_detected_value: number
          correction_delta: number
          created_at?: string
          id?: string
          parameter_name: string
          user_corrected_value: number
          user_id: string
          water_test_id: string
        }
        Update: {
          ai_confidence?: number | null
          ai_detected_value?: number
          correction_delta?: number
          created_at?: string
          id?: string
          parameter_name?: string
          user_corrected_value?: number
          user_id?: string
          water_test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_analysis_corrections_water_test_id_fkey"
            columns: ["water_test_id"]
            isOneToOne: false
            referencedRelation: "water_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          photo_url: string
          plant_id: string
          taken_at: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          photo_url: string
          plant_id: string
          taken_at?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          photo_url?: string
          plant_id?: string
          taken_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_photos_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      plants: {
        Row: {
          aquarium_id: string
          condition: string
          created_at: string
          date_added: string
          id: string
          name: string
          notes: string | null
          placement: string
          primary_photo_url: string | null
          quantity: number
          species: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aquarium_id: string
          condition?: string
          created_at?: string
          date_added?: string
          id?: string
          name: string
          notes?: string | null
          placement?: string
          primary_photo_url?: string | null
          quantity?: number
          species: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aquarium_id?: string
          condition?: string
          created_at?: string
          date_added?: string
          id?: string
          name?: string
          notes?: string | null
          placement?: string
          primary_photo_url?: string | null
          quantity?: number
          species?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plants_aquarium_id_fkey"
            columns: ["aquarium_id"]
            isOneToOne: false
            referencedRelation: "aquariums"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          hemisphere: string | null
          id: string
          language_preference: string | null
          last_ai_interaction: string | null
          latitude: number | null
          longitude: number | null
          name: string | null
          onboarding_completed: boolean | null
          skill_level: string | null
          status: string
          subscription_tier: string | null
          suspended_until: string | null
          suspension_reason: string | null
          theme_preference: string | null
          unit_preference: string | null
          updated_at: string
          user_id: string
          weather_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          hemisphere?: string | null
          id?: string
          language_preference?: string | null
          last_ai_interaction?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          onboarding_completed?: boolean | null
          skill_level?: string | null
          status?: string
          subscription_tier?: string | null
          suspended_until?: string | null
          suspension_reason?: string | null
          theme_preference?: string | null
          unit_preference?: string | null
          updated_at?: string
          user_id: string
          weather_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          hemisphere?: string | null
          id?: string
          language_preference?: string | null
          last_ai_interaction?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          onboarding_completed?: boolean | null
          skill_level?: string | null
          status?: string
          subscription_tier?: string | null
          suspended_until?: string | null
          suspension_reason?: string | null
          theme_preference?: string | null
          unit_preference?: string | null
          updated_at?: string
          user_id?: string
          weather_enabled?: boolean | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: string | null
          new_roles: string[]
          old_roles: string[]
          reason: string | null
          target_user_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_roles?: string[]
          old_roles?: string[]
          reason?: string | null
          target_user_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_roles?: string[]
          old_roles?: string[]
          reason?: string | null
          target_user_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_maintenance: {
        Row: {
          affected_services: string[]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          scheduled_end: string
          scheduled_start: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_services?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          scheduled_end: string
          scheduled_start: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_services?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          scheduled_end?: string
          scheduled_start?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      status_subscribers: {
        Row: {
          confirmed: boolean
          email: string
          id: string
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          confirmed?: boolean
          email: string
          id?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          confirmed?: boolean
          email?: string
          id?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_type: string
          sender_user_id: string | null
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_type: string
          sender_user_id?: string | null
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_type?: string
          sender_user_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          priority: Database["public"]["Enums"]["support_ticket_priority"]
          status: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_incidents: {
        Row: {
          affected_services: string[]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          resolved_at: string | null
          severity: string
          started_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_services?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          resolved_at?: string | null
          severity?: string
          started_at?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_services?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          resolved_at?: string | null
          severity?: string
          started_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_parameters: {
        Row: {
          created_at: string
          id: string
          parameter_name: string
          status: string | null
          test_id: string
          unit: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          parameter_name: string
          status?: string | null
          test_id: string
          unit: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          parameter_name?: string
          status?: string | null
          test_id?: string
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_parameters_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "water_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memories: {
        Row: {
          confidence: string | null
          created_at: string | null
          id: string
          memory_key: string
          memory_value: string
          source: string | null
          updated_at: string | null
          user_id: string
          water_type: string | null
        }
        Insert: {
          confidence?: string | null
          created_at?: string | null
          id?: string
          memory_key: string
          memory_value: string
          source?: string | null
          updated_at?: string | null
          user_id: string
          water_type?: string | null
        }
        Update: {
          confidence?: string | null
          created_at?: string | null
          id?: string
          memory_key?: string
          memory_value?: string
          source?: string | null
          updated_at?: string | null
          user_id?: string
          water_type?: string | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          announcement_id: string
          created_at: string
          id: string
          read: boolean
          read_at: string | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          id?: string
          read?: boolean
          read_at?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          id?: string
          read?: boolean
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          beta_access_granted: boolean | null
          beta_access_granted_at: string | null
          created_at: string
          email: string
          granted_by: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          beta_access_granted?: boolean | null
          beta_access_granted_at?: string | null
          created_at?: string
          email: string
          granted_by?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          beta_access_granted?: boolean | null
          beta_access_granted_at?: string | null
          created_at?: string
          email?: string
          granted_by?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      water_test_alerts: {
        Row: {
          affected_inhabitants: string[] | null
          alert_type: string
          analysis_model: string | null
          aquarium_id: string
          confidence: number | null
          created_at: string
          details: Json | null
          dismissed_at: string | null
          id: string
          is_dismissed: boolean
          message: string
          parameter_name: string
          predicted_impact: string | null
          recommendation: string | null
          severity: string
          timeframe: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          affected_inhabitants?: string[] | null
          alert_type: string
          analysis_model?: string | null
          aquarium_id: string
          confidence?: number | null
          created_at?: string
          details?: Json | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean
          message: string
          parameter_name: string
          predicted_impact?: string | null
          recommendation?: string | null
          severity?: string
          timeframe?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          affected_inhabitants?: string[] | null
          alert_type?: string
          analysis_model?: string | null
          aquarium_id?: string
          confidence?: number | null
          created_at?: string
          details?: Json | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean
          message?: string
          parameter_name?: string
          predicted_impact?: string | null
          recommendation?: string | null
          severity?: string
          timeframe?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_test_alerts_aquarium_id_fkey"
            columns: ["aquarium_id"]
            isOneToOne: false
            referencedRelation: "aquariums"
            referencedColumns: ["id"]
          },
        ]
      }
      water_tests: {
        Row: {
          aquarium_id: string
          confidence: string | null
          created_at: string
          entry_method: string | null
          id: string
          notes: string | null
          photo_url: string | null
          tags: string[] | null
          test_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aquarium_id: string
          confidence?: string | null
          created_at?: string
          entry_method?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          tags?: string[] | null
          test_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aquarium_id?: string
          confidence?: string | null
          created_at?: string
          entry_method?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          tags?: string[] | null
          test_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_tests_aquarium_id_fkey"
            columns: ["aquarium_id"]
            isOneToOne: false
            referencedRelation: "aquariums"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_alerts_notified: {
        Row: {
          alert_id: string
          expires_at: string | null
          headline: string
          id: string
          notified_at: string
          severity: string
          user_id: string
        }
        Insert: {
          alert_id: string
          expires_at?: string | null
          headline: string
          id?: string
          notified_at?: string
          severity: string
          user_id: string
        }
        Update: {
          alert_id?: string
          expires_at?: string | null
          headline?: string
          id?: string
          notified_at?: string
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_admin_view: {
        Row: {
          created_at: string | null
          hemisphere: string | null
          id: string | null
          language_preference: string | null
          masked_email: string | null
          name: string | null
          onboarding_completed: boolean | null
          skill_level: string | null
          status: string | null
          subscription_tier: string | null
          theme_preference: string | null
          unit_preference: string | null
          updated_at: string | null
          user_id: string | null
          weather_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          hemisphere?: string | null
          id?: string | null
          language_preference?: string | null
          masked_email?: never
          name?: string | null
          onboarding_completed?: boolean | null
          skill_level?: string | null
          status?: string | null
          subscription_tier?: string | null
          theme_preference?: string | null
          unit_preference?: string | null
          updated_at?: string | null
          user_id?: string | null
          weather_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          hemisphere?: string | null
          id?: string | null
          language_preference?: string | null
          masked_email?: never
          name?: string | null
          onboarding_completed?: boolean | null
          skill_level?: string | null
          status?: string | null
          subscription_tier?: string | null
          theme_preference?: string | null
          unit_preference?: string | null
          updated_at?: string | null
          user_id?: string | null
          weather_enabled?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          permission_name: string
        }[]
      }
      grant_random_beta_access: {
        Args: { admin_user_id: string; count_to_grant: number }
        Returns: {
          email: string
          granted_at: string
        }[]
      }
      has_beta_access: { Args: { user_email: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_user_active: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin"
      support_ticket_priority: "low" | "medium" | "high" | "urgent"
      support_ticket_status:
        | "open"
        | "in_progress"
        | "waiting_for_user"
        | "resolved"
        | "closed"
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
    Enums: {
      app_role: ["admin", "user", "super_admin"],
      support_ticket_priority: ["low", "medium", "high", "urgent"],
      support_ticket_status: [
        "open",
        "in_progress",
        "waiting_for_user",
        "resolved",
        "closed",
      ],
    },
  },
} as const
