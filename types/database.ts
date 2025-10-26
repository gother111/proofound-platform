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
      analytics_events: {
        Row: {
          created_at: string | null
          event_category: string | null
          event_name: string
          id: string
          ip_address: unknown
          properties: Json | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_category?: string | null
          event_name: string
          id?: string
          ip_address?: unknown
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_category?: string | null
          event_name?: string
          id?: string
          ip_address?: unknown
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_time_to_first_match"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts: {
        Row: {
          artifact_date: string | null
          artifact_type: string | null
          category: string | null
          created_at: string | null
          description: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: string
          profile_id: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          url: string | null
          visibility: string | null
        }
        Insert: {
          artifact_date?: string | null
          artifact_type?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          profile_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          url?: string | null
          visibility?: string | null
        }
        Update: {
          artifact_date?: string | null
          artifact_type?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          profile_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          url?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "admin_time_to_first_match"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "artifacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          accepted_matches_count: number | null
          assignment_type: string | null
          budget_currency: string | null
          budget_masked: boolean | null
          budget_max: number | null
          budget_min: number | null
          closed_at: string | null
          core_expertise_weight: number | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          duration_text: string | null
          end_date: string | null
          expected_outcomes: string | null
          id: string
          impact_goals: string | null
          is_remote: boolean | null
          location: string | null
          logistics_weight: number | null
          max_matches_to_show: number | null
          mission_alignment_weight: number | null
          organization_id: string | null
          proof_requirements: Json | null
          published_at: string | null
          recency_weight: number | null
          refresh_frequency: string | null
          required_expertise: Json | null
          required_languages: string[] | null
          start_date: string | null
          status: string | null
          time_commitment: string | null
          timezone_preference: string | null
          title: string
          tools_weight: number | null
          total_matches_generated: number | null
          updated_at: string | null
          values_keywords: Json | null
        }
        Insert: {
          accepted_matches_count?: number | null
          assignment_type?: string | null
          budget_currency?: string | null
          budget_masked?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          closed_at?: string | null
          core_expertise_weight?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_text?: string | null
          end_date?: string | null
          expected_outcomes?: string | null
          id?: string
          impact_goals?: string | null
          is_remote?: boolean | null
          location?: string | null
          logistics_weight?: number | null
          max_matches_to_show?: number | null
          mission_alignment_weight?: number | null
          organization_id?: string | null
          proof_requirements?: Json | null
          published_at?: string | null
          recency_weight?: number | null
          refresh_frequency?: string | null
          required_expertise?: Json | null
          required_languages?: string[] | null
          start_date?: string | null
          status?: string | null
          time_commitment?: string | null
          timezone_preference?: string | null
          title: string
          tools_weight?: number | null
          total_matches_generated?: number | null
          updated_at?: string | null
          values_keywords?: Json | null
        }
        Update: {
          accepted_matches_count?: number | null
          assignment_type?: string | null
          budget_currency?: string | null
          budget_masked?: boolean | null
          budget_max?: number | null
          budget_min?: number | null
          closed_at?: string | null
          core_expertise_weight?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_text?: string | null
          end_date?: string | null
          expected_outcomes?: string | null
          id?: string
          impact_goals?: string | null
          is_remote?: boolean | null
          location?: string | null
          logistics_weight?: number | null
          max_matches_to_show?: number | null
          mission_alignment_weight?: number | null
          organization_id?: string | null
          proof_requirements?: Json | null
          published_at?: string | null
          recency_weight?: number | null
          refresh_frequency?: string | null
          required_expertise?: Json | null
          required_languages?: string[] | null
          start_date?: string | null
          status?: string | null
          time_commitment?: string | null
          timezone_preference?: string | null
          title?: string
          tools_weight?: number | null
          total_matches_generated?: number | null
          updated_at?: string | null
          values_keywords?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_time_to_first_match"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expertise_atlas: {
        Row: {
          created_at: string | null
          id: string
          is_core_expertise: boolean | null
          is_verified: boolean | null
          last_used_date: string | null
          proficiency_level: string | null
          profile_id: string | null
          proof_count: number | null
          rank_order: number | null
          skill_category: string | null
          skill_name: string
          updated_at: string | null
          years_of_experience: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_core_expertise?: boolean | null
          is_verified?: boolean | null
          last_used_date?: string | null
          proficiency_level?: string | null
          profile_id?: string | null
          proof_count?: number | null
          rank_order?: number | null
          skill_category?: string | null
          skill_name: string
          updated_at?: string | null
          years_of_experience?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_core_expertise?: boolean | null
          is_verified?: boolean | null
          last_used_date?: string | null
          proficiency_level?: string | null
          profile_id?: string | null
          proof_count?: number | null
          rank_order?: number | null
          skill_category?: string | null
          skill_name?: string
          updated_at?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expertise_atlas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "admin_time_to_first_match"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "expertise_atlas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          assignment_id: string | null
          communication_stage: string | null
          core_expertise_score: number | null
          core_expertise_weight: number | null
          decline_reason: string | null
          expires_at: string | null
          gaps: Json | null
          generated_at: string | null
          id: string
          improvement_suggestions: Json | null
          is_cold_start: boolean | null
          is_near_match: boolean | null
          is_strong_match: boolean | null
          logistics_score: number | null
          logistics_weight: number | null
          mission_values_score: number | null
          mission_values_weight: number | null
          overall_score: number
          profile_id: string | null
          recency_score: number | null
          recency_weight: number | null
          responded_at: string | null
          status: string | null
          strengths: Json | null
          tools_score: number | null
          tools_weight: number | null
          viewed_at: string | null
        }
        Insert: {
          assignment_id?: string | null
          communication_stage?: string | null
          core_expertise_score?: number | null
          core_expertise_weight?: number | null
          decline_reason?: string | null
          expires_at?: string | null
          gaps?: Json | null
          generated_at?: string | null
          id?: string
          improvement_suggestions?: Json | null
          is_cold_start?: boolean | null
          is_near_match?: boolean | null
          is_strong_match?: boolean | null
          logistics_score?: number | null
          logistics_weight?: number | null
          mission_values_score?: number | null
          mission_values_weight?: number | null
          overall_score: number
          profile_id?: string | null
          recency_score?: number | null
          recency_weight?: number | null
          responded_at?: string | null
          status?: string | null
          strengths?: Json | null
          tools_score?: number | null
          tools_weight?: number | null
          viewed_at?: string | null
        }
        Update: {
          assignment_id?: string | null
          communication_stage?: string | null
          core_expertise_score?: number | null
          core_expertise_weight?: number | null
          decline_reason?: string | null
          expires_at?: string | null
          gaps?: Json | null
          generated_at?: string | null
          id?: string
          improvement_suggestions?: Json | null
          is_cold_start?: boolean | null
          is_near_match?: boolean | null
          is_strong_match?: boolean | null
          logistics_score?: number | null
          logistics_weight?: number | null
          mission_values_score?: number | null
          mission_values_weight?: number | null
          overall_score?: number
          profile_id?: string | null
          recency_score?: number | null
          recency_weight?: number | null
          responded_at?: string | null
          status?: string | null
          strengths?: Json | null
          tools_score?: number | null
          tools_weight?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "admin_time_to_first_match"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "matches_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          deleted_at: string | null
          flagged_reason: string | null
          id: string
          is_flagged: boolean | null
          is_read: boolean | null
          match_id: string | null
          moderation_status: string | null
          read_at: string | null
          receiver_id: string | null
          sender_id: string | null
          sent_at_stage: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          deleted_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_read?: boolean | null
          match_id?: string | null
          moderation_status?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          sent_at_stage?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_read?: boolean | null
          match_id?: string | null
          moderation_status?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          sent_at_stage?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "admin_time_to_first_match"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "admin_time_to_first_match"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active_assignments_count: number | null
          admin_ids: string[] | null
          causes: Json | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          headquarters_location: string | null
          id: string
          is_ngo: boolean | null
          is_remote_friendly: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          max_active_assignments: number | null
          mission: string | null
          name: string
          org_type: string | null
          registry_number: string | null
          slug: string | null
          subscription_tier: string | null
          updated_at: string | null
          values: Json | null
          verification_method: string | null
          verified_at: string | null
          verified_domain: string | null
          website: string | null
        }
        Insert: {
          active_assignments_count?: number | null
          admin_ids?: string[] | null
          causes?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          headquarters_location?: string | null
          id?: string
          is_ngo?: boolean | null
          is_remote_friendly?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          max_active_assignments?: number | null
          mission?: string | null
          name: string
          org_type?: string | null
          registry_number?: string | null
          slug?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          values?: Json | null
          verification_method?: string | null
          verified_at?: string | null
          verified_domain?: string | null
          website?: string | null
        }
        Update: {
          active_assignments_count?: number | null
          admin_ids?: string[] | null
          causes?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          headquarters_location?: string | null
          id?: string
          is_ngo?: boolean | null
          is_remote_friendly?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          max_active_assignments?: number | null
          mission?: string | null
          name?: string
          org_type?: string | null
          registry_number?: string | null
          slug?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          values?: Json | null
          verification_method?: string | null
          verified_at?: string | null
          verified_domain?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_time_to_first_match"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string | null
          availability_status: string | null
          available_for_match: boolean | null
          available_start_date: string | null
          avatar_url: string | null
          causes: Json | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          field_visibility: Json | null
          full_name: string | null
          id: string
          industry: string[] | null
          languages: string[] | null
          last_active_at: string | null
          mission: string | null
          phone: string | null
          professional_summary: string | null
          profile_completion_percentage: number | null
          profile_ready_for_match: boolean | null
          region: string | null
          salary_band_max: number | null
          salary_band_min: number | null
          timezone: string | null
          updated_at: string | null
          values: Json | null
          vision: string | null
        }
        Insert: {
          account_type?: string | null
          availability_status?: string | null
          available_for_match?: boolean | null
          available_start_date?: string | null
          avatar_url?: string | null
          causes?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          field_visibility?: Json | null
          full_name?: string | null
          id: string
          industry?: string[] | null
          languages?: string[] | null
          last_active_at?: string | null
          mission?: string | null
          phone?: string | null
          professional_summary?: string | null
          profile_completion_percentage?: number | null
          profile_ready_for_match?: boolean | null
          region?: string | null
          salary_band_max?: number | null
          salary_band_min?: number | null
          timezone?: string | null
          updated_at?: string | null
          values?: Json | null
          vision?: string | null
        }
        Update: {
          account_type?: string | null
          availability_status?: string | null
          available_for_match?: boolean | null
          available_start_date?: string | null
          avatar_url?: string | null
          causes?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          field_visibility?: Json | null
          full_name?: string | null
          id?: string
          industry?: string[] | null
          languages?: string[] | null
          last_active_at?: string | null
          mission?: string | null
          phone?: string | null
          professional_summary?: string | null
          profile_completion_percentage?: number | null
          profile_ready_for_match?: boolean | null
          region?: string | null
          salary_band_max?: number | null
          salary_band_min?: number | null
          timezone?: string | null
          updated_at?: string | null
          values?: Json | null
          vision?: string | null
        }
        Relationships: []
      }
      proofs: {
        Row: {
          artifact_id: string | null
          claim_reference_id: string | null
          claim_text: string | null
          claim_type: string | null
          confidence_score: number | null
          created_at: string | null
          decline_reason: string | null
          id: string
          profile_id: string | null
          proof_type: string | null
          updated_at: string | null
          verification_method: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
          verifier_organization: string | null
          verifier_relationship: string | null
        }
        Insert: {
          artifact_id?: string | null
          claim_reference_id?: string | null
          claim_text?: string | null
          claim_type?: string | null
          confidence_score?: number | null
          created_at?: string | null
          decline_reason?: string | null
          id?: string
          profile_id?: string | null
          proof_type?: string | null
          updated_at?: string | null
          verification_method?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          verifier_organization?: string | null
          verifier_relationship?: string | null
        }
        Update: {
          artifact_id?: string | null
          claim_reference_id?: string | null
          claim_text?: string | null
          claim_type?: string | null
          confidence_score?: number | null
          created_at?: string | null
          decline_reason?: string | null
          id?: string
          profile_id?: string | null
          proof_type?: string | null
          updated_at?: string | null
          verification_method?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          verifier_organization?: string | null
          verifier_relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proofs_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proofs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "admin_time_to_first_match"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "proofs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proofs_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_time_to_first_match"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "proofs_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          action_details: string | null
          action_taken: string | null
          actioned_at: string | null
          ai_confidence_score: number | null
          ai_flag_reasons: Json | null
          ai_flagged: boolean | null
          assigned_moderator_id: string | null
          created_at: string | null
          id: string
          moderation_status: string | null
          moderator_notes: string | null
          reason_category: string | null
          reason_text: string | null
          reported_entity_id: string
          reported_entity_type: string | null
          reporter_id: string | null
          resolved_at: string | null
          sla_target_resolution_at: string | null
          updated_at: string | null
        }
        Insert: {
          action_details?: string | null
          action_taken?: string | null
          actioned_at?: string | null
          ai_confidence_score?: number | null
          ai_flag_reasons?: Json | null
          ai_flagged?: boolean | null
          assigned_moderator_id?: string | null
          created_at?: string | null
          id?: string
          moderation_status?: string | null
          moderator_notes?: string | null
          reason_category?: string | null
          reason_text?: string | null
          reported_entity_id: string
          reported_entity_type?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          sla_target_resolution_at?: string | null
          updated_at?: string | null
        }
        Update: {
          action_details?: string | null
          action_taken?: string | null
          actioned_at?: string | null
          ai_confidence_score?: number | null
          ai_flag_reasons?: Json | null
          ai_flagged?: boolean | null
          assigned_moderator_id?: string | null
          created_at?: string | null
          id?: string
          moderation_status?: string | null
          moderator_notes?: string | null
          reason_category?: string | null
          reason_text?: string | null
          reported_entity_id?: string
          reported_entity_type?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          sla_target_resolution_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_assigned_moderator_id_fkey"
            columns: ["assigned_moderator_id"]
            isOneToOne: false
            referencedRelation: "admin_time_to_first_match"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reports_assigned_moderator_id_fkey"
            columns: ["assigned_moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "admin_time_to_first_match"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          appeal_notes: string | null
          appeal_requested: boolean | null
          appeal_reviewed_at: string | null
          artifact_link: string | null
          claim_description: string | null
          context_notes: string | null
          created_at: string | null
          declined_reason: string | null
          first_reminder_sent_at: string | null
          id: string
          proof_id: string | null
          requester_id: string | null
          second_reminder_sent_at: string | null
          status: string | null
          token_expires_at: string | null
          updated_at: string | null
          verification_token: string
          verified_at: string | null
          verifier_email: string
          verifier_name: string | null
          verifier_organization: string | null
          verifier_relationship: string | null
          verifier_response: string | null
          verifier_seniority_weight: number | null
        }
        Insert: {
          appeal_notes?: string | null
          appeal_requested?: boolean | null
          appeal_reviewed_at?: string | null
          artifact_link?: string | null
          claim_description?: string | null
          context_notes?: string | null
          created_at?: string | null
          declined_reason?: string | null
          first_reminder_sent_at?: string | null
          id?: string
          proof_id?: string | null
          requester_id?: string | null
          second_reminder_sent_at?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          verification_token: string
          verified_at?: string | null
          verifier_email: string
          verifier_name?: string | null
          verifier_organization?: string | null
          verifier_relationship?: string | null
          verifier_response?: string | null
          verifier_seniority_weight?: number | null
        }
        Update: {
          appeal_notes?: string | null
          appeal_requested?: boolean | null
          appeal_reviewed_at?: string | null
          artifact_link?: string | null
          claim_description?: string | null
          context_notes?: string | null
          created_at?: string | null
          declined_reason?: string | null
          first_reminder_sent_at?: string | null
          id?: string
          proof_id?: string | null
          requester_id?: string | null
          second_reminder_sent_at?: string | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          verification_token?: string
          verified_at?: string | null
          verifier_email?: string
          verifier_name?: string | null
          verifier_organization?: string | null
          verifier_relationship?: string | null
          verifier_response?: string | null
          verifier_seniority_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_proof_id_fkey"
            columns: ["proof_id"]
            isOneToOne: false
            referencedRelation: "proofs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "admin_time_to_first_match"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "verification_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_match_stats: {
        Row: {
          acceptance_rate_pct: number | null
          accepted_matches: number | null
          assignments_with_3plus_qualified: number | null
          assignments_with_matches: number | null
          avg_match_score: number | null
          declined_matches: number | null
          pending_matches: number | null
          total_matches: number | null
        }
        Relationships: []
      }
      admin_org_verification_stats: {
        Row: {
          unverified_orgs: number | null
          verification_rate_pct: number | null
          verified_orgs: number | null
        }
        Relationships: []
      }
      admin_profile_readiness_stats: {
        Row: {
          incomplete_profiles: number | null
          profiles_created_24h: number | null
          profiles_ready_24h: number | null
          readiness_rate_24h_pct: number | null
          ready_profiles: number | null
        }
        Relationships: []
      }
      admin_safety_stats: {
        Row: {
          actioned_reports: number | null
          avg_resolution_hours: number | null
          pending_reports: number | null
          sla_breached: number | null
          total_reports: number | null
          under_review_reports: number | null
        }
        Relationships: []
      }
      admin_time_to_first_match: {
        Row: {
          first_match_at: string | null
          hours_to_first_match: number | null
          profile_created_at: string | null
          profile_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_profile_completion: {
        Args: { profile_uuid: string }
        Returns: number
      }
      expire_old_verification_requests: { Args: never; Returns: undefined }
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
