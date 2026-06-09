import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xuhodkbusnprpwtkazmc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aG9ka2J1c25wcnB3dGthem1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTk2NzAsImV4cCI6MjA5NjEzNTY3MH0.7QLyr5YYMNeYQyEpLvk4JUSNkWTD50OjiXfkCakbIrQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'implicit'
  }
})
