import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface TestKitTemplate {
  id: string;
  brand: string;
  model: string;
  kit_type: string;
  parameters: string[];
  development_times: Record<string, number>;
  pad_order: string[];
}

export interface TestKitProfile {
  id: string;
  user_id: string;
  name: string;
  brand: string;
  model: string | null;
  kit_type: string;
  parameters: string[];
  reference_chart_url: string | null;
  development_times: Record<string, number>;
  pad_order: string[];
  notes: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateKitProfileInput {
  name: string;
  brand: string;
  model?: string;
  kit_type: string;
  parameters: string[];
  development_times?: Record<string, number>;
  pad_order?: string[];
  notes?: string;
  is_default?: boolean;
}

export function useTestKitProfiles() {
  const [profiles, setProfiles] = useState<TestKitProfile[]>([]);
  const [templates, setTemplates] = useState<TestKitTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultProfile, setDefaultProfile] = useState<TestKitProfile | null>(null);

  const fetchProfiles = async () => {
    try {
      // Fetch user profiles and templates in parallel
      const [profilesRes, templatesRes] = await Promise.all([
        supabase
          .from('test_kit_profiles')
          .select('*')
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('test_kit_templates')
          .select('*')
          .order('brand'),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (templatesRes.error) throw templatesRes.error;

      const userProfiles = (profilesRes.data || []) as unknown as TestKitProfile[];
      setProfiles(userProfiles);
      setDefaultProfile(userProfiles.find(p => p.is_default) || null);
      setTemplates((templatesRes.data || []) as unknown as TestKitTemplate[]);
    } catch (error) {
      logger.error('Failed to fetch test kit profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const createProfile = async (input: CreateKitProfileInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Not authenticated');

      // If setting as default, unset other defaults first
      if (input.is_default) {
        await supabase
          .from('test_kit_profiles')
          .update({ is_default: false } as Record<string, unknown>)
          .eq('user_id', userData.user.id)
          .eq('is_default', true);
      }

      const { data, error } = await supabase
        .from('test_kit_profiles')
        .insert({
          user_id: userData.user.id,
          name: input.name,
          brand: input.brand,
          model: input.model || null,
          kit_type: input.kit_type,
          parameters: input.parameters,
          development_times: input.development_times || {},
          pad_order: input.pad_order || [],
          notes: input.notes || null,
          is_default: input.is_default || false,
        } as Record<string, unknown>)
        .select()
        .single();

      if (error) throw error;

      toast.success('Test kit saved');
      await fetchProfiles();
      return data as unknown as TestKitProfile;
    } catch (error) {
      logger.error('Failed to create test kit profile:', error);
      toast.error('Failed to save test kit');
      return null;
    }
  };

  const createFromTemplate = async (templateId: string, name?: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return null;

    return createProfile({
      name: name || `${template.brand} ${template.model}`,
      brand: template.brand,
      model: template.model,
      kit_type: template.kit_type,
      parameters: template.parameters,
      development_times: template.development_times,
      pad_order: template.pad_order,
      is_default: profiles.length === 0, // First profile is default
    });
  };

  const updateProfile = async (id: string, updates: Partial<CreateKitProfileInput>) => {
    try {
      const { error } = await supabase
        .from('test_kit_profiles')
        .update(updates as Record<string, unknown>)
        .eq('id', id);

      if (error) throw error;

      toast.success('Test kit updated');
      await fetchProfiles();
    } catch (error) {
      logger.error('Failed to update test kit profile:', error);
      toast.error('Failed to update test kit');
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      const { error } = await supabase
        .from('test_kit_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Test kit removed');
      await fetchProfiles();
    } catch (error) {
      logger.error('Failed to delete test kit profile:', error);
      toast.error('Failed to remove test kit');
    }
  };

  const setDefault = async (id: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      // Unset all defaults first
      await supabase
        .from('test_kit_profiles')
        .update({ is_default: false } as Record<string, unknown>)
        .eq('user_id', userData.user.id);

      // Set new default
      await supabase
        .from('test_kit_profiles')
        .update({ is_default: true } as Record<string, unknown>)
        .eq('id', id);

      await fetchProfiles();
    } catch (error) {
      logger.error('Failed to set default kit:', error);
    }
  };

  const uploadReferenceChart = async (profileId: string, file: File): Promise<string | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Not authenticated');

      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${userData.user.id}/reference-charts/${profileId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('water-test-photos')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('water-test-photos')
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;

      // Save URL to profile
      await supabase
        .from('test_kit_profiles')
        .update({ reference_chart_url: publicUrl } as Record<string, unknown>)
        .eq('id', profileId);

      toast.success('Reference chart uploaded');
      await fetchProfiles();
      return publicUrl;
    } catch (error) {
      logger.error('Failed to upload reference chart:', error);
      toast.error('Failed to upload reference chart');
      return null;
    }
  };

  return {
    profiles,
    templates,
    defaultProfile,
    loading,
    createProfile,
    createFromTemplate,
    updateProfile,
    deleteProfile,
    setDefault,
    uploadReferenceChart,
    refetch: fetchProfiles,
  };
}
