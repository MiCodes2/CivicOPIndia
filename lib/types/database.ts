// Database types for Supabase tables
// This file defines TypeScript types matching your database schema

export type Profile = {
  id: string; // UUID from auth.users
  full_name: string | null;
  role: 'admin' | 'editor' | 'member';
  phone: string | null;
  avatar_url: string | null;
};

export type Activity = {
  id: number;
  created_at: string;
  activity_date: string; // The actual date of the activity (can be backdated)
  title: string;
  content: string | null;
  location: string | null;
  image_url: string | null;
  image_urls: string[] | null; // Array of image URLs for multiple images
  image_captions: string[] | null; // Array of captions corresponding to image URLs
  author_id: string | null;
  author_name: string | null; // Display name for the author
  tags: string[] | null;
  likes_count: number;
  shares_count: number;
  type: string | null; // e.g., 'Meeting', 'Protest', 'Campaign', 'Plantation'
};

export type Archive = {
  id: number;
  title: string;
  category: string | null;
  file_url: string;
  year: number | null;
};

export type Campaign = {
  id: number;
  title: string;
  description: string | null;
  goal_count: number;
  current_count: number;
  status: 'active' | 'victory' | 'closed';
};

export type Signature = {
  id: number;
  campaign_id: number;
  user_id: string | null;
  comment: string | null;
};

export type Donation = {
  id: number;
  amount: number;
  payment_id: string | null;
  donor_name: string | null;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
};

// Response types for API calls
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      activities: {
        Row: Activity;
        Insert: Omit<Activity, 'id' | 'created_at'>;
        Update: Partial<Omit<Activity, 'id' | 'created_at'>>;
      };
      archives: {
        Row: Archive;
        Insert: Omit<Archive, 'id'>;
        Update: Partial<Omit<Archive, 'id'>>;
      };
      campaigns: {
        Row: Campaign;
        Insert: Omit<Campaign, 'id'>;
        Update: Partial<Omit<Campaign, 'id'>>;
      };
      signatures: {
        Row: Signature;
        Insert: Omit<Signature, 'id'>;
        Update: Partial<Omit<Signature, 'id'>>;
      };
      donations: {
        Row: Donation;
        Insert: Omit<Donation, 'id' | 'created_at'>;
        Update: Partial<Omit<Donation, 'id' | 'created_at'>>;
      };
    };
  };
};
