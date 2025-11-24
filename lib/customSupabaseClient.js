import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pwnaqienrpcypyqexltp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bmFxaWVucnBjeXB5cWV4bHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDc3MTUsImV4cCI6MjA3ODk4MzcxNX0.VpePDgbcnw5kzOj7U7DPDlbTiJPFqVP4nit_ULpOonE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);