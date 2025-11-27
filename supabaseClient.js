import { createClient } from '@supabase/supabase-js';

// STEP 1: Replace these with your actual Supabase project credentials
const supabaseUrl = "https://ordnlzqaxmavnhogfnmq.supabase.co";  // Replace with your Project URL
const supabaseAnonKey = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZG5senFheG1hdm5ob2dmbm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzI3MzEsImV4cCI6MjA3OTgwODczMX0.GYnzYU18sFr_WRTjJ1-KP7kR6FXnOktFggNjgLecosY; // Replace with your Anon/public key

// STEP 2: Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

