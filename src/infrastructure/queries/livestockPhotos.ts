/**
 * Livestock Photos Data Access Layer
 */

import { supabase } from '@/integrations/supabase/client';
import { ensureFreshSession } from '@/lib/sessionUtils';

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


// Fetch all photos for a livestock
export async function fetchLivestockPhotos(livestockId: string) {
  await ensureFreshSession();

  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from('livestock_photos')
    .select('*')
    .eq('livestock_id', livestockId);

  if (user?.id) {
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query
    .order('taken_at', { ascending: false });

  if (error) throw error;
  return data as LivestockPhoto[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

// Upload a photo
export async function uploadLivestockPhoto(
  livestockId: string,
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

  if (!urlData?.publicUrl) {
    throw new Error('Failed to retrieve public URL for uploaded photo');
  }

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

// Update photo (caption, date, primary status) with ownership verification
export async function updateLivestockPhoto(
  photoId: string,
  userId: string,
  updates: Partial<Pick<LivestockPhoto, 'caption' | 'taken_at' | 'is_primary'>>
) {
  const { data, error } = await supabase
    .from('livestock_photos')
    .update(updates)
    .eq('id', photoId)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Photo not found');
  return data as LivestockPhoto;
}

// Set as primary photo (also updates livestock.primary_photo_url) with ownership verification
export async function setAsPrimaryPhoto(
  photoId: string,
  livestockId: string,
  userId: string,
  photoUrl: string
) {
  // Clear existing primary (only for this user's photos)
  await supabase
    .from('livestock_photos')
    .update({ is_primary: false })
    .eq('livestock_id', livestockId)
    .eq('user_id', userId);

  // Set new primary (with ownership verification)
  const { error: photoError } = await supabase
    .from('livestock_photos')
    .update({ is_primary: true })
    .eq('id', photoId)
    .eq('user_id', userId);

  if (photoError) throw photoError;

  // Update livestock primary_photo_url (with ownership verification)
  const { error: livestockError } = await supabase
    .from('livestock')
    .update({ primary_photo_url: photoUrl })
    .eq('id', livestockId)
    .eq('user_id', userId);

  if (livestockError) throw livestockError;
}

// Delete photo (with ownership verification)
export async function deleteLivestockPhoto(photoId: string, userId: string, photoUrl: string) {
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
    .eq('id', photoId)
    .eq('user_id', userId);

  if (error) throw error;
}

// Get photo count for a livestock
export async function getLivestockPhotoCount(livestockId: string) {
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from('livestock_photos')
    .select('*', { count: 'exact', head: true })
    .eq('livestock_id', livestockId);

  if (user?.id) {
    query = query.eq('user_id', user.id);
  }

  const { count, error } = await query;

  if (error) throw error;
  return count || 0;
}
