export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_label: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  product_slug?: string;
  primary_image?: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number | null;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  payment_method: 'cod' | 'card';
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_zip: string;
  notes: string;
  created_at: string;
  items?: OrderItem[];
}
