/**
 * Aquarium Photos Data Access Layer
 */

import { supabase } from '@/integrations/supabase/client';
import { ensureFreshSession } from '@/lib/sessionUtils';

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


// Fetch photos for an aquarium with optional pagination
export async function fetchAquariumPhotos(
  aquariumId: string,
  options?: { limit?: number; offset?: number }
) {
  await ensureFreshSession();

  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  const authResult = await supabase.auth.getUser();
  const user = authResult?.data?.user;

  let query = supabase
    .from('aquarium_photos')
    .select('*', { count: 'exact' })
    .eq('aquarium_id', aquariumId);

  if (user?.id) {
    query = query.eq('user_id', user.id);
  }

  const { data, error, count } = await query
    .order('taken_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return {
    data: data as AquariumPhoto[],
    total: count ?? 0,
    hasMore: (count ?? 0) > offset + limit
  };
}

/** Maximum number of photos to return in a single query */
const MAX_PHOTOS_LIMIT = 500;

/**
 * @deprecated Use fetchAquariumPhotos with pagination instead
 * Fetch all photos for an aquarium (legacy support)
 */
export async function fetchAllAquariumPhotos(aquariumId: string) {
  await ensureFreshSession();

  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from('aquarium_photos')
    .select('*')
    .eq('aquarium_id', aquariumId);

  if (user?.id) {
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query
    .order('taken_at', { ascending: false })
    .limit(MAX_PHOTOS_LIMIT);

  if (error) throw error;
  return data as AquariumPhoto[];
}

// Upload a photo
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export async function uploadAquariumPhoto(
  aquariumId: string,
  userId: string,
  file: File,
  caption?: string,
  takenAt?: string
) {
  if (file.size > MAX_FILE_SIZE) throw new Error('File too large (max 10MB)');
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');

  await ensureFreshSession();

  const parts = file.name.split('.');
  const fileExt = parts.length > 1 ? parts.pop() : 'jpg';
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

  if (!urlData?.publicUrl) {
    throw new Error('Failed to retrieve public URL for uploaded photo');
  }

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

// Update photo (caption, date, primary status) with ownership verification
export async function updateAquariumPhoto(
  photoId: string,
  userId: string,
  updates: Partial<Pick<AquariumPhoto, 'caption' | 'taken_at' | 'is_primary'>>
) {
  const { data, error } = await supabase
    .from('aquarium_photos')
    .update(updates)
    .eq('id', photoId)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Photo not found');
  return data as AquariumPhoto;
}

// Set as primary photo (also updates aquarium.primary_photo_url) with ownership verification
export async function setAsPrimaryAquariumPhoto(
  photoId: string,
  aquariumId: string,
  userId: string,
  photoUrl: string
) {
  // Clear existing primary (only for this user's photos)
  await supabase
    .from('aquarium_photos')
    .update({ is_primary: false })
    .eq('aquarium_id', aquariumId)
    .eq('user_id', userId);

  // Set new primary (with ownership verification)
  const { error: photoError } = await supabase
    .from('aquarium_photos')
    .update({ is_primary: true })
    .eq('id', photoId)
    .eq('user_id', userId);

  if (photoError) throw photoError;

  // Update aquarium primary_photo_url (with ownership verification)
  const { error: aquariumError } = await supabase
    .from('aquariums')
    .update({ primary_photo_url: photoUrl })
    .eq('id', aquariumId)
    .eq('user_id', userId);

  if (aquariumError) throw aquariumError;
}

// Delete photo (with ownership verification)
// If the deleted photo is the cover photo, clears primary_photo_url on the aquarium.
export async function deleteAquariumPhoto(photoId: string, userId: string, photoUrl: string, aquariumId?: string) {
  // Check if this photo is the primary/cover photo and clear it
  if (aquariumId) {
    const { data: aquarium } = await supabase
      .from('aquariums')
      .select('primary_photo_url')
      .eq('id', aquariumId)
      .eq('user_id', userId)
      .maybeSingle();

    if (aquarium?.primary_photo_url === photoUrl) {
      await supabase
        .from('aquariums')
        .update({ primary_photo_url: null })
        .eq('id', aquariumId)
        .eq('user_id', userId);
    }
  }

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
    .eq('id', photoId)
    .eq('user_id', userId);

  if (error) throw error;
}

// Get photo count for an aquarium
export async function getAquariumPhotoCount(aquariumId: string) {
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from('aquarium_photos')
    .select('*', { count: 'exact', head: true })
    .eq('aquarium_id', aquariumId);

  if (user?.id) {
    query = query.eq('user_id', user.id);
  }

  const { count, error } = await query;

  if (error) throw error;
  return count || 0;
}
