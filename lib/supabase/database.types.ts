export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          biological_sex: "male" | "female" | null;
          birth_date: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          activity_level: Database["public"]["Enums"]["activity_level"];
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          biological_sex?: "male" | "female" | null;
          birth_date?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          activity_level?: Database["public"]["Enums"]["activity_level"];
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      food_items: {
        Row: {
          id: string;
          name: string;
          normalized_name: string;
          serving_size_g: number;
          calories_per_100g: number;
          protein_g_per_100g: number;
          carbs_g_per_100g: number;
          fat_g_per_100g: number;
          food_kind: "dish" | "ingredient" | "seasoning" | "drink";
          category_slug:
            | "rice-dishes"
            | "noodles"
            | "soups"
            | "bread"
            | "protein"
            | "staples"
            | "vegetables"
            | "fruit"
            | "dairy"
            | "drinks"
            | "seasonings"
            | "other";
          image_key: string | null;
          source: string;
          source_reference: string | null;
          is_verified: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          normalized_name: string;
          serving_size_g?: number;
          calories_per_100g: number;
          protein_g_per_100g?: number;
          carbs_g_per_100g?: number;
          fat_g_per_100g?: number;
          food_kind?: "dish" | "ingredient" | "seasoning" | "drink";
          category_slug?:
            | "rice-dishes"
            | "noodles"
            | "soups"
            | "bread"
            | "protein"
            | "staples"
            | "vegetables"
            | "fruit"
            | "dairy"
            | "drinks"
            | "seasonings"
            | "other";
          image_key?: string | null;
          source: string;
          source_reference?: string | null;
          is_verified?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["food_items"]["Insert"]>;
        Relationships: [];
      };
      meal_entries: {
        Row: {
          id: string;
          user_id: string;
          food_item_id: string | null;
          meal_type: Database["public"]["Enums"]["meal_type"];
          food_name_snapshot: string;
          food_image_key_snapshot: string | null;
          amount_g: number;
          calories_per_100g: number;
          protein_g_per_100g: number;
          carbs_g_per_100g: number;
          fat_g_per_100g: number;
          total_calories: number;
          total_protein_g: number;
          total_carbs_g: number;
          total_fat_g: number;
          eaten_at: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          food_item_id?: string | null;
          meal_type: Database["public"]["Enums"]["meal_type"];
          food_name_snapshot: string;
          food_image_key_snapshot?: string | null;
          amount_g: number;
          calories_per_100g: number;
          protein_g_per_100g?: number;
          carbs_g_per_100g?: number;
          fat_g_per_100g?: number;
          total_calories?: never;
          total_protein_g?: never;
          total_carbs_g?: never;
          total_fat_g?: never;
          eaten_at?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["meal_entries"]["Insert"]>;
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          start_weight_kg: number;
          target_weight_kg: number;
          start_date: string;
          target_date: string;
          estimated_bmr: number;
          estimated_tdee: number;
          daily_calorie_target: number;
          status: Database["public"]["Enums"]["goal_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_weight_kg: number;
          target_weight_kg: number;
          start_date?: string;
          target_date: string;
          estimated_bmr: number;
          estimated_tdee: number;
          daily_calorie_target: number;
          status?: Database["public"]["Enums"]["goal_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Insert"]>;
        Relationships: [];
      };
      water_entries: {
        Row: {
          id: string;
          user_id: string;
          amount_ml: number;
          drank_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount_ml: number;
          drank_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["water_entries"]["Insert"]>;
        Relationships: [];
      };
      workout_reminders: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          scheduled_at: string;
          timezone: string;
          status: Database["public"]["Enums"]["reminder_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          scheduled_at: string;
          timezone?: string;
          status?: Database["public"]["Enums"]["reminder_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workout_reminders"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      save_goal_plan: {
        Args: {
          p_biological_sex: "male" | "female";
          p_height_cm: number;
          p_weight_kg: number;
          p_activity_level: Database["public"]["Enums"]["activity_level"];
          p_target_weight_kg: number;
          p_target_date: string;
          p_estimated_bmr: number;
          p_estimated_tdee: number;
          p_daily_calorie_target: number;
        };
        Returns: string;
      };
    };
    Enums: {
      activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active";
      meal_type: "breakfast" | "lunch" | "dinner" | "snack";
      goal_status: "active" | "completed" | "cancelled";
      reminder_status: "scheduled" | "completed" | "skipped";
    };
    CompositeTypes: Record<string, never>;
  };
};
