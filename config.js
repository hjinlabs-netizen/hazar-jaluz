// Supabase Bağlantı Ayarları
// Adım adım rehberdeki bilgileri buraya yapıştırın.

const SUPABASE_URL = "https://tdfmaqbsceiskfeoceaw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZm1hcWJzY2Vpc2tmZW9jZWF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNzYwNjIsImV4cCI6MjEwMDc1MjA2Mn0.YjqcyjY_kyFaC8M73Zc3g2BBes6vJVywmgDt5wz0lhY";

// Supabase istemcisini başlat
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
