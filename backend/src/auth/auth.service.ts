import { createClient } from '@supabase/supabase-js';

export class AuthService {
  constructor(
    // Import and initialize Supabase client
    supabaseUrl = "http://kong:8000",
    supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q",
    public supabase = createClient(supabaseUrl, supabaseKey)
  ) { }
}
