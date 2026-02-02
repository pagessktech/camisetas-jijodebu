export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  active: boolean;
  usage_limit?: number;
  used_count: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  image_url: string;
  colors: string[];
  sizes: string[];
  stock: number;
  category_id?: string;
  categories?: Category; // Join result
}

export interface CartItem {
  id: string; // unique cart item id
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  customDesignUrl?: string; // Generated AI image or uploaded image
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface GeneratedDesign {
  imageUrl: string;
  prompt: string;
}