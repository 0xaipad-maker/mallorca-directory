export interface Business {
  id: string;
  name: string;
  address: string;
  area: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: {
    en: string;
    es: string;
    de: string;
    ru: string;
  };
  category: string;
  subcategory?: string;
  rating?: number;
  verified?: boolean;
  premium?: boolean;
  premiumType?: 'starter' | 'pro';
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
  claimedBy?: string;
  claimEmail?: string;
  events?: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MallorcaEvent {
  id: string;
  businessId?: string;
  businessName?: string;
  title: string;
  description?: {
    en: string;
    es: string;
    de: string;
    ru: string;
  };
  date: string;
  endDate?: string;
  time?: string;
  location?: string;
  area?: string;
  category: string;
  image?: string;
  price?: string;
  source?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface Guide {
  id: string;
  title: { en: string; es: string; de: string; ru: string };
  slug: string;
  excerpt?: { en: string; es: string; de: string; ru: string };
  content?: { en: string; es: string; de: string; ru: string };
  category: string;
  image?: string;
  author?: string;
  publishedAt?: string;
}

export interface TripDay {
  id: string;
  date: string;
  label: string;
  businessIds: string[];
  events?: Array<{ id: string; time?: string }>;
  notes?: string;
}

export interface TripPlan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  days: TripDay[];
  createdAt: string;
}

export interface ClaimRequest {
  id: string;
  businessId: string;
  businessName: string;
  userId: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  phone?: string;
  message?: string;
  createdAt: string;
  updatedAt?: string;
}
