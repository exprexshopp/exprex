export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export interface CustomUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  gender?: string;
  is_staff?: boolean;
  password: string;
  permissions: string[];
}

export type ShopStatus = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'DRAFT';
export type ShopThemePreset = 'modern' | 'elegant' | 'nature' | 'vif' | 'classic';

export interface ShopHoursDay {
  opening_time: string | null;
  closing_time: string | null;
  is_closed: boolean;
}

export interface ShopHours {
  monday: ShopHoursDay;
  tuesday: ShopHoursDay;
  wednesday: ShopHoursDay;
  thursday: ShopHoursDay;
  friday: ShopHoursDay;
  saturday: ShopHoursDay;
  sunday: ShopHoursDay;
}

export interface Shop {
  id: string;
  owner_id: string;
  owner_email?: string;
  name: string;
  slug: string;
  description: string;
  city: string;
  location: string;
  phone: string;
  whatsapp_number: string;
  logo?: string;
  theme: ShopThemePreset;
  custom_theme_color: string;
  facebook?: string;
  instagram?: string;
  hours: ShopHours;
  status: ShopStatus;
  is_active: boolean;
  rejection_reason?: string;
  created_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  shop_name: string;
  shop_slug: string;
  shop_whatsapp?: string;
  name: string;
  description: string;
  slug: string;
  price: number;
  image?: string;
  category: string;
  subcategory_id?: string;
  subcategory_name?: string;
  in_stock: boolean;
  created_at: string;
  views_count?: number;
  whatsapp_clicks?: number;
  reviews_count?: number;
  favorites_count?: number;
  engagement_score?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface SubCategory {
  id: string;
  category_id: string;
  category_name: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface Review {
  id: string;
  user_id: string;
  user_name: string;
  product_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface ProductAnalytics {
  id: string;
  product_id: string;
  views_count: number;
  whatsapp_clicks: number;
  updated_at: string;
}

export interface ModerationLog {
  id: string;
  shop_id: string;
  shop_name: string;
  actor_email: string;
  action: 'approve' | 'reject';
  note: string;
  created_at: string;
}

export interface CatalogFilterParams {
  city: string;
  q: string;
  category: string;
  subcategory: string;
  price_min: number | null;
  price_max: number | null;
  sort_by?: 'relevance' | 'rating' | 'favorites' | 'price_asc' | 'price_desc' | 'newest';
}
