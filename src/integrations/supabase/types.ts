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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          active: boolean
          description_ar: string | null
          description_en: string | null
          id: string
          image_url: string | null
          name_ar: string
          name_en: string | null
          sort_order: number
        }
        Insert: {
          active?: boolean
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          name_ar: string
          name_en?: string | null
          sort_order?: number
        }
        Update: {
          active?: boolean
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          name_ar?: string
          name_en?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          amount: number
          category_ids: string[]
          code: string
          expires_at: string | null
          id: string
          kind: string
          minimum_order: number
          product_ids: string[]
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          active?: boolean
          amount: number
          category_ids?: string[]
          code: string
          expires_at?: string | null
          id?: string
          kind?: string
          minimum_order?: number
          product_ids?: string[]
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          active?: boolean
          amount?: number
          category_ids?: string[]
          code?: string
          expires_at?: string | null
          id?: string
          kind?: string
          minimum_order?: number
          product_ids?: string[]
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          business_name: string | null
          business_type: string | null
          city: string | null
          created_at: string
          id: string
          kind: string
          message: string | null
          name: string
          phone: string
          quantities: string | null
          status: string
        }
        Insert: {
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string
          id?: string
          kind: string
          message?: string | null
          name: string
          phone: string
          quantities?: string | null
          status?: string
        }
        Update: {
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string
          id?: string
          kind?: string
          message?: string | null
          name?: string
          phone?: string
          quantities?: string | null
          status?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          actor_id: string | null
          created_at: string
          delta: number
          id: string
          product_name: string
          reason: string
          size_label: string
          stock_after: number
          variant_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          delta: number
          id?: string
          product_name: string
          reason: string
          size_label: string
          stock_after: number
          variant_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          delta?: number
          id?: string
          product_name?: string
          reason?: string
          size_label?: string
          stock_after?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          discount_amount: number
          fragrance: string | null
          id: string
          order_id: string
          product_name: string
          quantity: number
          regular_price: number | null
          size_label: string
          unit_price: number
          variant_id: string | null
          variant_sku: string | null
        }
        Insert: {
          discount_amount?: number
          fragrance?: string | null
          id?: string
          order_id: string
          product_name: string
          quantity: number
          regular_price?: number | null
          size_label: string
          unit_price: number
          variant_id?: string | null
          variant_sku?: string | null
        }
        Update: {
          discount_amount?: number
          fragrance?: string | null
          id?: string
          order_id?: string
          product_name?: string
          quantity?: number
          regular_price?: number | null
          size_label?: string
          unit_price?: number
          variant_id?: string | null
          variant_sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          city: string
          coupon_code: string | null
          created_at: string
          customer_name: string
          discount: number
          id: string
          internal_notes: string | null
          notes: string | null
          order_number: string
          payment_method: string
          phone: string
          shipping_fee: number | null
          status: string
          stock_restored: boolean
          subtotal: number
          total: number
        }
        Insert: {
          address: string
          city: string
          coupon_code?: string | null
          created_at?: string
          customer_name: string
          discount?: number
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_number: string
          payment_method?: string
          phone: string
          shipping_fee?: number | null
          status?: string
          stock_restored?: boolean
          subtotal: number
          total: number
        }
        Update: {
          address?: string
          city?: string
          coupon_code?: string | null
          created_at?: string
          customer_name?: string
          discount?: number
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string
          phone?: string
          shipping_fee?: number | null
          status?: string
          stock_restored?: boolean
          subtotal?: number
          total?: number
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          active: boolean
          created_at: string
          fragrance: string | null
          fragrance_en: string | null
          id: string
          images: string[]
          low_stock_threshold: number
          price: number | null
          product_id: string
          sale_price: number | null
          size_label: string
          sku: string | null
          sort_order: number
          stock: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          fragrance?: string | null
          fragrance_en?: string | null
          id?: string
          images?: string[]
          low_stock_threshold?: number
          price?: number | null
          product_id: string
          sale_price?: number | null
          size_label: string
          sku?: string | null
          sort_order?: number
          stock?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          fragrance?: string | null
          fragrance_en?: string | null
          id?: string
          images?: string[]
          low_stock_threshold?: number
          price?: number | null
          product_id?: string
          sale_price?: number | null
          size_label?: string
          sku?: string | null
          sort_order?: number
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          archived: boolean
          benefits: string[]
          best_selling: boolean
          category_id: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          featured: boolean
          id: string
          images: string[]
          ingredients: string | null
          name_ar: string
          name_en: string | null
          scent: string | null
          short_ar: string | null
          slug: string
          sort_order: number
          updated_at: string
          usage_instructions: string | null
        }
        Insert: {
          active?: boolean
          archived?: boolean
          benefits?: string[]
          best_selling?: boolean
          category_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          ingredients?: string | null
          name_ar: string
          name_en?: string | null
          scent?: string | null
          short_ar?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
          usage_instructions?: string | null
        }
        Update: {
          active?: boolean
          archived?: boolean
          benefits?: string[]
          best_selling?: boolean
          category_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          ingredients?: string | null
          name_ar?: string
          name_en?: string | null
          scent?: string | null
          short_ar?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
          usage_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          active: boolean
          city: string
          delivery_info: string | null
          fee: number | null
          id: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          city: string
          delivery_info?: string | null
          fee?: number | null
          id?: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          city?: string
          delivery_info?: string | null
          fee?: number | null
          id?: string
          sort_order?: number
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          about_ar: string | null
          about_en: string | null
          address: string | null
          brand_name: string
          brand_name_ar: string
          cod_enabled: boolean
          email: string | null
          facebook_url: string | null
          faqs: Json
          favicon_url: string | null
          free_shipping_threshold: number | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_subtitle_en: string | null
          hero_title: string | null
          hero_title_en: string | null
          home_sections: Json
          id: number
          instagram_url: string | null
          logo_url: string | null
          phone: string | null
          privacy_policy: string | null
          restore_stock_on_cancel: boolean
          returns_policy: string | null
          seo_description: string | null
          seo_title: string | null
          shipping_policy: string | null
          show_wholesale_prices: boolean
          tagline: string | null
          tiktok_url: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          about_ar?: string | null
          about_en?: string | null
          address?: string | null
          brand_name?: string
          brand_name_ar?: string
          cod_enabled?: boolean
          email?: string | null
          facebook_url?: string | null
          faqs?: Json
          favicon_url?: string | null
          free_shipping_threshold?: number | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_subtitle_en?: string | null
          hero_title?: string | null
          hero_title_en?: string | null
          home_sections?: Json
          id?: number
          instagram_url?: string | null
          logo_url?: string | null
          phone?: string | null
          privacy_policy?: string | null
          restore_stock_on_cancel?: boolean
          returns_policy?: string | null
          seo_description?: string | null
          seo_title?: string | null
          shipping_policy?: string | null
          show_wholesale_prices?: boolean
          tagline?: string | null
          tiktok_url?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          about_ar?: string | null
          about_en?: string | null
          address?: string | null
          brand_name?: string
          brand_name_ar?: string
          cod_enabled?: boolean
          email?: string | null
          facebook_url?: string | null
          faqs?: Json
          favicon_url?: string | null
          free_shipping_threshold?: number | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_subtitle_en?: string | null
          hero_title?: string | null
          hero_title_en?: string | null
          home_sections?: Json
          id?: number
          instagram_url?: string | null
          logo_url?: string | null
          phone?: string | null
          privacy_policy?: string | null
          restore_stock_on_cancel?: boolean
          returns_policy?: string | null
          seo_description?: string | null
          seo_title?: string | null
          shipping_policy?: string | null
          show_wholesale_prices?: boolean
          tagline?: string | null
          tiktok_url?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wholesale_prices: {
        Row: {
          min_quantity: number
          price: number
          variant_id: string
        }
        Insert: {
          min_quantity?: number
          price: number
          variant_id: string
        }
        Update: {
          min_quantity?: number
          price?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wholesale_prices_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: true
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_stock: {
        Args: { _delta: number; _reason: string; _variant_id: string }
        Returns: undefined
      }
      get_public_wholesale_prices: {
        Args: never
        Returns: {
          min_quantity: number
          price: number
          variant_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      normalize_order_items: { Args: { _items: Json }; Returns: Json }
      place_order:
        | {
            Args: {
              _address: string
              _city: string
              _items: Json
              _name: string
              _notes: string
              _phone: string
            }
            Returns: Json
          }
        | {
            Args: {
              _address: string
              _city: string
              _coupon: string
              _items: Json
              _name: string
              _notes: string
              _phone: string
            }
            Returns: Json
          }
      quote_order: {
        Args: { _city: string; _coupon?: string; _items: Json }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
