export interface Business {
  id: string;
  name: string;
  address: string;
  area: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  category: string;
  subcategory?: string;
  rating?: number;
  verified?: boolean;
  location: {
    lat: number;
    lng: number;
  };
  hours?: {
    open: string;
    close: string;
  };
  photos?: string[];
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}
