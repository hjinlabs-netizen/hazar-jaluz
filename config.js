// Supabase Bağlantı Ayarları
window.SUPABASE_URL = "https://tdfmaqbsceiskfeoceaw.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZm1hcWJzY2Vpc2tmZW9jZWF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNzYwNjIsImV4cCI6MjEwMDc1MjA2Mn0.YjqcyjY_kyFaC8M73Zc3g2BBes6vJVywmgDt5wz0lhY";

// Supabase istemcisini başlat
window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
