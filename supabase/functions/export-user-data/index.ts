import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Exporting data for user: ${user.id}`);

    // Fetch all user data in parallel
    const [
      profileResult,
      aquariumsResult,
      waterTestsResult,
      livestockResult,
      plantsResult,
      equipmentResult,
      tasksResult,
      memoriesResult,
      conversationsResult,
      notificationPrefsResult
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('aquariums').select('*').eq('user_id', user.id),
      supabase.from('water_tests').select('*, test_parameters(*)').eq('user_id', user.id),
      supabase.from('livestock').select('*').eq('user_id', user.id),
      supabase.from('plants').select('*').eq('user_id', user.id),
      supabase.from('equipment').select('*, aquariums!inner(user_id)').eq('aquariums.user_id', user.id),
      supabase.from('maintenance_tasks').select('*, aquariums!inner(user_id)').eq('aquariums.user_id', user.id),
      supabase.from('user_memories').select('*').eq('user_id', user.id),
      supabase.from('chat_conversations').select('*, chat_messages(*)').eq('user_id', user.id),
      supabase.from('notification_preferences').select('*').eq('user_id', user.id).single()
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      userId: user.id,
      email: user.email,
      profile: profileResult.data,
      aquariums: aquariumsResult.data || [],
      waterTests: waterTestsResult.data || [],
      livestock: livestockResult.data || [],
      plants: plantsResult.data || [],
      equipment: equipmentResult.data || [],
      maintenanceTasks: tasksResult.data || [],
      memories: memoriesResult.data || [],
      conversations: conversationsResult.data || [],
      notificationPreferences: notificationPrefsResult.data
    };

    console.log(`Export complete for user: ${user.id}`);

    return new Response(
      JSON.stringify(exportData, null, 2),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="aquadex-data-export-${new Date().toISOString().split('T')[0]}.json"`
        } 
      }
    );
  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to export data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
