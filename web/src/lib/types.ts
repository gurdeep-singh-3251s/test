export type Category = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  image: string;
  _count?: { products: number };
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAt: number | null;
  image: string;
  gallery: string[];
  sizes: string[];
  featured: boolean;
  category: Category;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  quantity: number;
};

export type Order = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  country?: string;
  shipping?: "india" | "international";
  shippingFee?: number;
  total: number;
  status: string;
  tracking?: string;
  channel?: "online" | "store";
  cashierName?: string;
  createdAt?: string;
  items: { name: string; quantity: number; price: number; size?: string | null }[];
};
