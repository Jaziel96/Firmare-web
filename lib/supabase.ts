import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ikauljvlhivmxxhsndir.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYXVsanZsaGl2bXh4aHNuZGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1Nzg2NzEsImV4cCI6MjA0NDE1NDY3MX0.Q-xkK5vnmXndqEv6F3fQesNLmXpsgzfni9FfXldihCc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);