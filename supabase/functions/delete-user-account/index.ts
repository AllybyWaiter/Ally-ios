import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import { handleCors, getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const logger = createLogger('delete-user-account');

  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.warn('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
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
      logger.error('Auth error', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    // Validate userId is a UUID before using in .or() filters (defense-in-depth)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      logger.error('Invalid user ID format', { userId });
      return new Response(
        JSON.stringify({ error: 'Invalid user ID' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }
    logger.setUserId(userId);
    logger.info('Starting account deletion');

    // Delete user data using parameterized queries via Supabase client
    // Order matters due to foreign key constraints
    
    // 1. Delete chat messages (must delete before conversations)
    const { data: conversations } = await supabaseAdmin
      .from('chat_conversations')
      .select('id')
      .eq('user_id', userId)
      .limit(10000);

    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id);
      const { error: messagesError } = await supabaseAdmin
        .from('chat_messages')
        .delete()
        .in('conversation_id', conversationIds);
      if (messagesError) logger.warn('chat_messages deletion', { error: messagesError.message });
      else logger.info('Deleted chat_messages');
    }

    // 2. Delete chat conversations
    const { error: convError } = await supabaseAdmin
      .from('chat_conversations')
      .delete()
      .eq('user_id', userId);
    if (convError) logger.warn('chat_conversations deletion', { error: convError.message });
    else logger.info('Deleted chat_conversations');

    // 3. Delete test parameters (must delete before water_tests)
    const { data: waterTests } = await supabaseAdmin
      .from('water_tests')
      .select('id')
      .eq('user_id', userId)
      .limit(10000);

    if (waterTests && waterTests.length > 0) {
      const testIds = waterTests.map(t => t.id);
      const { error: paramsError } = await supabaseAdmin
        .from('test_parameters')
        .delete()
        .in('test_id', testIds);
      if (paramsError) logger.warn('test_parameters deletion', { error: paramsError.message });
      else logger.info('Deleted test_parameters');
    }

    // 4. Delete maintenance_tasks and equipment (must delete before aquariums)
    const { data: aquariums } = await supabaseAdmin
      .from('aquariums')
      .select('id')
      .eq('user_id', userId)
      .limit(10000);

    if (aquariums && aquariums.length > 0) {
      const aquariumIds = aquariums.map(a => a.id);

      // Delete aquarium photos (has aquarium_id FK, must be before aquariums)
      const { error: photosError } = await supabaseAdmin
        .from('aquarium_photos')
        .delete()
        .in('aquarium_id', aquariumIds);
      if (photosError) logger.warn('aquarium_photos deletion', { error: photosError.message });
      else logger.info('Deleted aquarium_photos');

      // Clean up aquarium-photos storage bucket
      for (const aquariumId of aquariumIds) {
        try {
          const { data: files } = await supabaseAdmin.storage
            .from('aquarium-photos')
            .list(aquariumId);
          if (files && files.length > 0) {
            const filePaths = files.map(f => `${aquariumId}/${f.name}`);
            await supabaseAdmin.storage
              .from('aquarium-photos')
              .remove(filePaths);
            logger.info('Deleted storage files', { aquariumId, count: filePaths.length });
          }
        } catch (storageErr) {
          logger.warn('Storage cleanup failed', { aquariumId, error: String(storageErr) });
        }
      }

      // Clean up livestock-photos storage bucket
      const { data: livestockData } = await supabaseAdmin
        .from('livestock')
        .select('id')
        .eq('user_id', userId)
        .limit(10000);

      if (livestockData && livestockData.length > 0) {
        const livestockIds = livestockData.map(l => l.id);

        // Delete livestock_photos DB rows
        const { error: lsPhotosError } = await supabaseAdmin
          .from('livestock_photos')
          .delete()
          .in('livestock_id', livestockIds);
        if (lsPhotosError) logger.warn('livestock_photos deletion', { error: lsPhotosError.message });
        else logger.info('Deleted livestock_photos');

        // Delete livestock-photos storage files
        for (const livestock of livestockData) {
          try {
            const { data: files } = await supabaseAdmin.storage
              .from('livestock-photos')
              .list(livestock.id);
            if (files && files.length > 0) {
              const filePaths = files.map(f => `${livestock.id}/${f.name}`);
              await supabaseAdmin.storage.from('livestock-photos').remove(filePaths);
              logger.info('Deleted livestock storage files', { livestockId: livestock.id, count: filePaths.length });
            }
          } catch (storageErr) {
            logger.warn('Livestock photo storage cleanup failed', { livestockId: livestock.id, error: String(storageErr) });
          }
        }
      }

      // Clean up plant-photos storage bucket
      const { data: plantsData } = await supabaseAdmin
        .from('plants')
        .select('id')
        .eq('user_id', userId)
        .limit(10000);

      if (plantsData && plantsData.length > 0) {
        const plantIds = plantsData.map(p => p.id);

        // Delete plant_photos DB rows
        const { error: plantPhotosError } = await supabaseAdmin
          .from('plant_photos')
          .delete()
          .in('plant_id', plantIds);
        if (plantPhotosError) logger.warn('plant_photos deletion', { error: plantPhotosError.message });
        else logger.info('Deleted plant_photos');

        // Delete plant-photos storage files
        for (const plant of plantsData) {
          try {
            const { data: files } = await supabaseAdmin.storage
              .from('plant-photos')
              .list(plant.id);
            if (files && files.length > 0) {
              const filePaths = files.map(f => `${plant.id}/${f.name}`);
              await supabaseAdmin.storage.from('plant-photos').remove(filePaths);
              logger.info('Deleted plant storage files', { plantId: plant.id, count: filePaths.length });
            }
          } catch (storageErr) {
            logger.warn('Plant photo storage cleanup failed', { plantId: plant.id, error: String(storageErr) });
          }
        }
      }

      const { error: tasksError } = await supabaseAdmin
        .from('maintenance_tasks')
        .delete()
        .in('aquarium_id', aquariumIds);
      if (tasksError) logger.warn('maintenance_tasks deletion', { error: tasksError.message });
      else logger.info('Deleted maintenance_tasks');

      const { error: equipError } = await supabaseAdmin
        .from('equipment')
        .delete()
        .in('aquarium_id', aquariumIds);
      if (equipError) logger.warn('equipment deletion', { error: equipError.message });
      else logger.info('Deleted equipment');
    }

    // Delete referral_rewards (references referral_id FK, must be before referrals)
    const { data: referrals } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .or(`referrer_id.eq.${userId},referee_id.eq.${userId}`)
      .limit(10000);

    if (referrals && referrals.length > 0) {
      const referralIds = referrals.map(r => r.id);
      const { error: rewardsError } = await supabaseAdmin
        .from('referral_rewards')
        .delete()
        .in('referral_id', referralIds);
      if (rewardsError) logger.warn('referral_rewards deletion', { error: rewardsError.message });
      else logger.info('Deleted referral_rewards');
    }

    // Delete referrals (user can be referrer or referee)
    const { error: referralsError } = await supabaseAdmin
      .from('referrals')
      .delete()
      .or(`referrer_id.eq.${userId},referee_id.eq.${userId}`);
    if (referralsError) logger.warn('referrals deletion', { error: referralsError.message });
    else logger.info('Deleted referrals');

    // 5. Delete tables with direct user_id reference (no dependencies)
    const tablesToDelete = [
      'ai_feedback',
      'photo_analysis_corrections',
      'user_memories',
      'water_tests',
      'water_test_alerts',
      'livestock',
      'plants',
      'aquariums',
      'custom_parameter_templates',
      'user_notifications',
      'notification_preferences',
      'notification_log',
      'push_subscriptions',
      'activity_logs',
      'login_history',
      'feature_flag_overrides',
      'user_roles',
      'profiles',
    ];

    // Tables that MUST be deleted before removing the auth user
    const criticalTables = ['profiles', 'activity_logs', 'login_history', 'push_subscriptions'];
    const failedDeletions: string[] = [];

    for (const table of tablesToDelete) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .eq('user_id', userId);
        if (error) {
          logger.error(`${table} deletion failed`, { error: error.message });
          failedDeletions.push(table);
        } else {
          logger.info(`Deleted from ${table}`);
        }
      } catch (err) {
        logger.error(`${table} deletion threw`, { error: String(err) });
        failedDeletions.push(table);
      }
    }

    // Abort auth deletion if any critical table failed
    const criticalFailures = failedDeletions.filter(t => criticalTables.includes(t));
    if (criticalFailures.length > 0) {
      logger.error('Critical table deletions failed, aborting auth deletion', { criticalFailures, allFailures: failedDeletions });
      return new Response(
        JSON.stringify({ error: 'Account deletion failed: could not remove critical user data', failedTables: criticalFailures }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Finally, delete the auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      logger.error('Error deleting auth user', { error: deleteUserError.message });
      return new Response(
        JSON.stringify({ error: 'Failed to delete authentication record' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Account deletion completed', { failedNonCritical: failedDeletions });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account and all associated data have been permanently deleted' 
      }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Delete account error', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: 'Account deletion failed' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
