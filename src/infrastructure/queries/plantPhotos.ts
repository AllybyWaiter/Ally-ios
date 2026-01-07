import { supabase } from '@/integrations/supabase/client';

export interface PlantPhoto {
  id: string;
  plant_id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  taken_at: string | null;
  is_primary: boolean | null;
  created_at: string;
}

async function ensureFreshSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const now = Date.now();
    if (expiresAt - now < 60000) {
      await supabase.auth.refreshSession();
    }
  }
}

export async function fetchPlantPhotos(plantId: string): Promise<PlantPhoto[]> {
  await ensureFreshSession();
  
  const { data, error } = await supabase
    .from('plant_photos')
    .select('*')
    .eq('plant_id', plantId)
    .order('taken_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function uploadPlantPhoto(
  plantId: string,
  userId: string,
  file: File,
  caption?: string,
  takenAt?: string
): Promise<PlantPhoto> {
  await ensureFreshSession();
  
  // Get file extension with fallback to jpg
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${userId}/${plantId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('plant-photos')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('plant-photos')
    .getPublicUrl(fileName);

  const { data, error } = await supabase
    .from('plant_photos')
    .insert({
      plant_id: plantId,
      user_id: userId,
      photo_url: publicUrl,
      caption: caption || null,
      taken_at: takenAt || new Date().toISOString().split('T')[0],
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Failed to create photo record');
  return data;
}

export async function setAsPrimaryPlantPhoto(photoId: string, plantId: string): Promise<void> {
  await ensureFreshSession();
  
  // First, unset all other primary photos for this plant
  await supabase
    .from('plant_photos')
    .update({ is_primary: false })
    .eq('plant_id', plantId);

  // Set the new primary photo
  const { data: photo, error: photoError } = await supabase
    .from('plant_photos')
    .update({ is_primary: true })
    .eq('id', photoId)
    .select('photo_url')
    .maybeSingle();

  if (photoError) throw photoError;
  if (!photo) throw new Error('Photo not found');

  // Update the plant's primary_photo_url
  const { error: plantError } = await supabase
    .from('plants')
    .update({ primary_photo_url: photo.photo_url })
    .eq('id', plantId);

  if (plantError) throw plantError;
}

export async function deletePlantPhoto(photoId: string, plantId: string): Promise<void> {
  await ensureFreshSession();
  
  // Get the photo to check if it's primary and get the URL for storage deletion
  const { data: photo, error: fetchError } = await supabase
    .from('plant_photos')
    .select('photo_url, is_primary')
    .eq('id', photoId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!photo) throw new Error('Photo not found');

  // Delete from storage
  const urlParts = photo.photo_url.split('/plant-photos/');
  if (urlParts[1]) {
    await supabase.storage.from('plant-photos').remove([urlParts[1]]);
  }

  // Delete the record
  const { error } = await supabase
    .from('plant_photos')
    .delete()
    .eq('id', photoId);

  if (error) throw error;

  // If it was primary, clear the plant's primary_photo_url
  if (photo.is_primary) {
    await supabase
      .from('plants')
      .update({ primary_photo_url: null })
      .eq('id', plantId);
  }
}
