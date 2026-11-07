import { beforeEach, describe, expect, it, vi } from 'vitest';
import { editCabin, uploadCabinImage } from '../src/services/apiCabins';
const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  from: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('../src/services/supabase', () => ({
  requireSupabase: () => ({
    storage: {
      from: () => ({
        upload: mocks.upload,
        getPublicUrl: mocks.getPublicUrl,
        remove: mocks.remove,
      }),
    },
    from: mocks.from,
  }),
}));
beforeEach(() => vi.resetAllMocks());

describe('Cabin image safety', () => {
  it('rejects unsupported or oversized files before touching storage', async () => {
    await expect(uploadCabinImage({ type: 'image/svg+xml', size: 10 })).rejects.toThrow('JPEG');
    await expect(uploadCabinImage({ type: 'image/png', size: 10485761 })).rejects.toThrow('10 MB');
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it('uploads a unique immutable path rather than overwriting another cabin image', async () => {
    mocks.upload.mockResolvedValue({ error: null });
    mocks.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.invalid/new.png' } });
    const file = { type: 'image/png', size: 100 };
    await expect(uploadCabinImage(file)).resolves.toBe('https://example.invalid/new.png');
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^cabins\/[a-f0-9-]+\.png$/),
      file,
      { upsert: false, contentType: 'image/png' },
    );
  });
  it('preserves uploaded files and does not roll back an edited record when save fails', async () => {
    mocks.upload.mockResolvedValue({ error: null });
    mocks.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.invalid/new.png' } });
    const query = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({ error: { message: 'Network save failed' } }),
    };
    query.update.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);
    mocks.from.mockReturnValue(query);
    const values = {
      name: 'Cedar',
      subtitle: 'Test',
      description: 'Test',
      max_capacity: 2,
      regular_price: 200,
      discount: 0,
      image: 'https://example.invalid/old.png',
      gallery: [],
      amenities: [],
      is_active: true,
      is_featured: false,
      display_order: 1,
    };
    await expect(
      editCabin({ id: 'cabin-id', values, imageFile: { type: 'image/png', size: 10 } }),
    ).rejects.toThrow('uploaded image was preserved');
    expect(query.update).toHaveBeenCalledTimes(1);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
