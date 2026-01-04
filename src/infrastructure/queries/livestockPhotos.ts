/**
 * Livestock Photos Data Access Layer
 */

import { supabase } from '@/integrations/supabase/client';

export interface LivestockPhoto {
  id: string;
  livestock_id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  taken_at: string;
  is_primary: boolean;
  created_at: string;
}

// Helper to ensure session is fresh (iOS PWA fix)
async function ensureFreshSession() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    await supabase.auth.refreshSession();
  }
}

// Fetch all photos for a livestock
export async function fetchLivestockPhotos(livestockId: string) {
  await ensureFreshSession();
  
  const { data, error } = await supabase
    .from('livestock_photos')
    .select('*')
    .eq('livestock_id', livestockId)
    .order('taken_at', { ascending: false });

  if (error) throw error;
  return data as LivestockPhoto[];
}

// Upload a photo
export async function uploadLivestockPhoto(
  livestockId: string,
  userId: string,
  file: File,
  caption?: string,
  takenAt?: string
) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${livestockId}/${Date.now()}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('livestock-photos')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('livestock-photos')
    .getPublicUrl(fileName);

  // Create photo record
  const { data, error } = await supabase
    .from('livestock_photos')
    .insert({
      livestock_id: livestockId,
      user_id: userId,
      photo_url: urlData.publicUrl,
      caption: caption || null,
      taken_at: takenAt || new Date().toISOString().split('T')[0],
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Failed to create photo record');
  return data as LivestockPhoto;
}

// Update photo (caption, date, primary status)
export async function updateLivestockPhoto(
  photoId: string,
  updates: Partial<Pick<LivestockPhoto, 'caption' | 'taken_at' | 'is_primary'>>
) {
  const { data, error } = await supabase
    .from('livestock_photos')
    .update(updates)
    .eq('id', photoId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Photo not found');
  return data as LivestockPhoto;
}

// Set as primary photo (also updates livestock.primary_photo_url)
export async function setAsPrimaryPhoto(
  photoId: string,
  livestockId: string,
  photoUrl: string
) {
  // Clear existing primary
  await supabase
    .from('livestock_photos')
    .update({ is_primary: false })
    .eq('livestock_id', livestockId);

  // Set new primary
  const { error: photoError } = await supabase
    .from('livestock_photos')
    .update({ is_primary: true })
    .eq('id', photoId);

  if (photoError) throw photoError;

  // Update livestock primary_photo_url
  const { error: livestockError } = await supabase
    .from('livestock')
    .update({ primary_photo_url: photoUrl })
    .eq('id', livestockId);

  if (livestockError) throw livestockError;
}

// Delete photo
export async function deleteLivestockPhoto(photoId: string, photoUrl: string) {
  // Extract file path from URL
  const urlParts = photoUrl.split('/livestock-photos/');
  if (urlParts[1]) {
    await supabase.storage
      .from('livestock-photos')
      .remove([urlParts[1]]);
  }

  const { error } = await supabase
    .from('livestock_photos')
    .delete()
    .eq('id', photoId);

  if (error) throw error;
}

// Get photo count for a livestock
export async function getLivestockPhotoCount(livestockId: string) {
  const { count, error } = await supabase
    .from('livestock_photos')
    .select('*', { count: 'exact', head: true })
    .eq('livestock_id', livestockId);

  if (error) throw error;
  return count || 0;
}
