import { requireSupabase } from './supabase';
import { PROJECT_REF } from '../utils/constants';

export function isSupportedCabinImageUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      ['images.unsplash.com', `${PROJECT_REF}.supabase.co`].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

export async function getCabins() {
  const { data, error } = await requireSupabase()
    .from('cabins')
    .select('*')
    .order('display_order')
    .order('name');
  if (error) throw new Error(error.message);
  return data;
}

export function validateCabin(values) {
  if (values.name.trim().length < 2 || values.name.length > 100)
    throw new Error('Cabin names must be 2–100 characters.');
  if (!Number.isFinite(values.regular_price) || values.regular_price <= 0)
    throw new Error('Price must be greater than zero.');
  if (
    !Number.isFinite(values.discount) ||
    values.discount < 0 ||
    values.discount >= values.regular_price
  )
    throw new Error('Discount must be smaller than the regular price.');
  if (!Number.isInteger(values.max_capacity) || values.max_capacity < 1 || values.max_capacity > 20)
    throw new Error('Capacity must be between 1 and 20.');
}

export async function uploadCabinImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Upload a JPEG, PNG, or WebP image.');
  if (file.size > 10485760) throw new Error('Images must be no larger than 10 MB.');
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
  const path = `cabins/${crypto.randomUUID()}.${extension}`;
  const client = requireSupabase();
  const { error } = await client.storage
    .from('cabin-images')
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = client.storage.from('cabin-images').getPublicUrl(path);
  return data.publicUrl;
}

async function saveCabin({ values, imageFile, id }) {
  validateCabin(values);
  const client = requireSupabase();
  let image = values.image;
  if (imageFile) image = await uploadCabinImage(imageFile);
  if (!isSupportedCabinImageUrl(image) || !values.gallery.every(isSupportedCabinImageUrl)) {
    throw new Error(
      'Use HTTPS images from Unsplash or this project’s Supabase Storage so they display on the customer site.',
    );
  }
  const cabin = {
    name: values.name.trim(),
    subtitle: values.subtitle.trim(),
    description: values.description.trim(),
    max_capacity: values.max_capacity,
    regular_price: values.regular_price,
    discount: values.discount,
    image,
    gallery: values.gallery,
    amenities: values.amenities,
    is_featured: values.is_featured,
    is_active: values.is_active,
    display_order: values.display_order,
  };
  let query = client.from('cabins');
  if (id) query = query.update(cabin).eq('id', id);
  else query = query.insert(cabin);
  const { data, error } = await query.select().single();
  // Never roll back a saved record or delete shared images on upload/save errors.
  if (error)
    throw new Error(
      `${error.message}${imageFile ? ' The uploaded image was preserved; it may need manual cleanup after checking references.' : ''}`,
    );
  return data;
}

export async function createCabin(input) {
  return saveCabin(input);
}
export async function editCabin(input) {
  return saveCabin(input);
}

export async function deleteCabin(id) {
  const { data, error } = await requireSupabase()
    .from('cabins')
    .delete()
    .eq('id', id)
    .select('id')
    .single();
  if (error?.code === '23503')
    throw new Error('This cabin has booking history. Mark it inactive instead.');
  if (error) throw new Error(error.message);
  return data;
}
