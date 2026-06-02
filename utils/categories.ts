export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  subcategories?: string[];
}

export const categories: Category[] = [
  { id: 'restaurants', name: 'Restaurants', emoji: '🍽️', color: '#fef2f2', subcategories: ['Italian', 'Spanish', 'Asian', 'German', 'International', 'Pizza', 'Sushi', 'Tapas', 'Seafood', 'Brunch', 'Vegetarian', 'Fine Dining'] },
  { id: 'cafes', name: 'Cafes', emoji: '☕', color: '#fef3c7', subcategories: ['Coffee', 'Tea House', 'Brunch', 'Bakery', 'Cocktail Bar', 'Wine Bar'] },
  { id: 'hotels', name: 'Hotels', emoji: '🏨', color: '#dbeafe', subcategories: ['5 Star', '4 Star', '3 Star', 'Boutique', 'Resort', 'Agrotourism', 'Apartment'] },
  { id: 'beaches', name: 'Beaches', emoji: '🏖️', color: '#fef9c3', subcategories: ['Family Beach', 'Cove', 'Blue Flag', 'Nude Beach', 'Beach Club'] },
  { id: 'parks', name: 'Parks & Gardens', emoji: '🌳', color: '#dcfce7' },
  { id: 'activities', name: 'Activities', emoji: '🎯', color: '#e9d5ff', subcategories: ['Water Sports', 'Hiking', 'Bike Rental', 'Boat Tour', 'Golf', 'Horse Riding', 'Diving', 'Wine Tasting'] },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', color: '#fce7f3', subcategories: ['Shopping Center', 'Fashion', 'Souvenirs', 'Local Market', 'Wine Shop'] },
  { id: 'supermarkets', name: 'Supermarkets', emoji: '🛒', color: '#f0fdf4' },
  { id: 'services', name: 'Services', emoji: '🔧', color: '#f3f4f6', subcategories: ['Handyman', 'Cleaning', 'Moving', 'IT Support', 'Insurance', 'Lawyer', 'Tax Advisor', 'Real Estate', 'Architect', 'Photographer', 'Web Design', 'Marketing'] },
  { id: 'transport', name: 'Transport', emoji: '🚗', color: '#e0e7ff', subcategories: ['Car Rental', 'Bike Rental', 'Taxi', 'Airport Transfer', 'Boat Rental'] },
  { id: 'health', name: 'Hospitals & Clinics', emoji: '🏥', color: '#dcfce7', subcategories: ['Hospital', 'Clinic', 'Doctor', 'Dentist', 'Optician', 'Physiotherapy', 'Alternative Medicine'] },
  { id: 'pharmacies', name: 'Pharmacies', emoji: '💊', color: '#f0fdf4' },
  { id: 'police', name: 'Police & Emergency', emoji: '👮', color: '#eff6ff' },
  { id: 'gasstations', name: 'Gas Stations', emoji: '⛽', color: '#fefce8' },
  { id: 'veterinarians', name: 'Veterinarians', emoji: '🐾', color: '#f5f3ff' },
  { id: 'banks', name: 'Banks & ATMs', emoji: '🏦', color: '#f3f4f6' },
  { id: 'postoffice', name: 'Post Office', emoji: '📮', color: '#fef2f2' },
  { id: 'industrial', name: 'Industrial Estates', emoji: '🏭', color: '#f3e8ff' },
];
