/**
 * Aquarium Photos Data Access Layer
 */

import { supabase } from '@/integrations/supabase/client';

export interface AquariumPhoto {
  id: string;
  aquarium_id: string;
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

// Fetch all photos for an aquarium
export async function fetchAquariumPhotos(aquariumId: string) {
  await ensureFreshSession();
  
  const { data, error } = await supabase
    .from('aquarium_photos')
    .select('*')
    .eq('aquarium_id', aquariumId)
    .order('taken_at', { ascending: false });

  if (error) throw error;
  return data as AquariumPhoto[];
}

// Upload a photo
export async function uploadAquariumPhoto(
  aquariumId: string,
  userId: string,
  file: File,
  caption?: string,
  takenAt?: string
) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${aquariumId}/${Date.now()}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('aquarium-photos')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('aquarium-photos')
    .getPublicUrl(fileName);

  // Create photo record
  const { data, error } = await supabase
    .from('aquarium_photos')
    .insert({
      aquarium_id: aquariumId,
      user_id: userId,
      photo_url: urlData.publicUrl,
      caption: caption || null,
      taken_at: takenAt || new Date().toISOString().split('T')[0],
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Failed to create photo record');
  return data as AquariumPhoto;
}

// Update photo (caption, date, primary status)
export async function updateAquariumPhoto(
  photoId: string,
  updates: Partial<Pick<AquariumPhoto, 'caption' | 'taken_at' | 'is_primary'>>
) {
  const { data, error } = await supabase
    .from('aquarium_photos')
    .update(updates)
    .eq('id', photoId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Photo not found');
  return data as AquariumPhoto;
}

// Set as primary photo (also updates aquarium.primary_photo_url)
export async function setAsPrimaryAquariumPhoto(
  photoId: string,
  aquariumId: string,
  photoUrl: string
) {
  // Clear existing primary
  await supabase
    .from('aquarium_photos')
    .update({ is_primary: false })
    .eq('aquarium_id', aquariumId);

  // Set new primary
  const { error: photoError } = await supabase
    .from('aquarium_photos')
    .update({ is_primary: true })
    .eq('id', photoId);

  if (photoError) throw photoError;

  // Update aquarium primary_photo_url
  const { error: aquariumError } = await supabase
    .from('aquariums')
    .update({ primary_photo_url: photoUrl })
    .eq('id', aquariumId);

  if (aquariumError) throw aquariumError;
}

// Delete photo
export async function deleteAquariumPhoto(photoId: string, photoUrl: string) {
  // Extract file path from URL
  const urlParts = photoUrl.split('/aquarium-photos/');
  if (urlParts[1]) {
    await supabase.storage
      .from('aquarium-photos')
      .remove([urlParts[1]]);
  }

  const { error } = await supabase
    .from('aquarium_photos')
    .delete()
    .eq('id', photoId);

  if (error) throw error;
}

// Get photo count for an aquarium
export async function getAquariumPhotoCount(aquariumId: string) {
  const { count, error } = await supabase
    .from('aquarium_photos')
    .select('*', { count: 'exact', head: true })
    .eq('aquarium_id', aquariumId);

  if (error) throw error;
  return count || 0;
}
