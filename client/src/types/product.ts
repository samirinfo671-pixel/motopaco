export interface ProductVariant {
  id: number;
  product_id: number;
  size: string | null;
  color: string | null;
  sku: string;
  stock: number;
  low_stock_threshold: number;
  image_url?: string | null;
  description?: string | null;
  price_override?: number | null;
}

export interface ProductImage {
  id?: number;
  url: string;
  is_primary: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category_id: number;
  brand_id: number;
  base_price: number;
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
  status: 'published' | 'draft' | 'archived';
  meta_title: string;
  meta_description: string;
  sold_count?: number;
  is_featured?: number;
  is_bestseller?: number;
  is_promo_featured?: number;
  is_out_of_stock?: number;
  created_at: string;
  
  // Enhanced/joined query fields
  brand_name?: string;
  brand_logo?: string;
  category_name?: string;
  category_slug?: string;
  primary_image?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  total_stock?: number;
  rating?: number;
  review_count?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  image_url: string;
  meta_title: string;
  meta_description: string;
  sort_order: number;
  subcategories?: Category[];
  product_count: number;
  total_products?: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url: string;
  is_featured: number;
  product_count?: number;
}

export interface Bundle {
  id: number;
  name: string;
  discount_percent: number | null;
  fixed_price: number | null;
  is_active: number;
  products: Product[];
}

export interface PromoCode {
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order: number;
  message?: string;
}
