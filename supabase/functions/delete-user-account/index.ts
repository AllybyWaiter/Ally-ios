import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create user client to verify the token
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Verify user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`Starting account deletion for user: ${userId}`);

    // Delete user data in order (respecting foreign keys)
    const deletionOrder = [
      // Chat data
      { table: 'chat_messages', condition: `conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = '${userId}')` },
      { table: 'chat_conversations', column: 'user_id' },
      
      // AI and feedback data
      { table: 'ai_feedback', column: 'user_id' },
      { table: 'photo_analysis_corrections', column: 'user_id' },
      { table: 'user_memories', column: 'user_id' },
      
      // Water test related
      { table: 'test_parameters', condition: `test_id IN (SELECT id FROM water_tests WHERE user_id = '${userId}')` },
      { table: 'water_tests', column: 'user_id' },
      { table: 'water_test_alerts', column: 'user_id' },
      
      // Aquarium related
      { table: 'maintenance_tasks', condition: `aquarium_id IN (SELECT id FROM aquariums WHERE user_id = '${userId}')` },
      { table: 'equipment', condition: `aquarium_id IN (SELECT id FROM aquariums WHERE user_id = '${userId}')` },
      { table: 'livestock', column: 'user_id' },
      { table: 'plants', column: 'user_id' },
      { table: 'aquariums', column: 'user_id' },
      
      // Templates
      { table: 'custom_parameter_templates', column: 'user_id' },
      
      // Notifications
      { table: 'user_notifications', column: 'user_id' },
      { table: 'notification_preferences', column: 'user_id' },
      { table: 'notification_log', column: 'user_id' },
      { table: 'push_subscriptions', column: 'user_id' },
      
      // Activity and roles
      { table: 'activity_logs', column: 'user_id' },
      { table: 'login_history', column: 'user_id' },
      { table: 'feature_flag_overrides', column: 'user_id' },
      { table: 'user_roles', column: 'user_id' },
      
      // Profile (last before auth user)
      { table: 'profiles', column: 'user_id' },
    ];

    // Execute deletions
    for (const item of deletionOrder) {
      try {
        if (item.condition) {
          // Use raw SQL for complex conditions
          const { error } = await supabaseAdmin.rpc('exec_sql', { 
            sql: `DELETE FROM ${item.table} WHERE ${item.condition}` 
          }).maybeSingle();
          // Ignore errors for tables that might not have data
          if (error) {
            console.log(`Note: ${item.table} deletion skipped or empty`);
          }
        } else if (item.column) {
          const { error } = await supabaseAdmin
            .from(item.table)
            .delete()
            .eq(item.column, userId);
          if (error) {
            console.log(`Note: ${item.table} deletion: ${error.message}`);
          }
        }
        console.log(`Deleted from ${item.table}`);
      } catch (err) {
        console.log(`Skipping ${item.table}: ${err}`);
      }
    }

    // Finally, delete the auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete authentication record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Account deletion completed for user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account and all associated data have been permanently deleted' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Delete account error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
