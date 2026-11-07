import { useForm } from 'react-hook-form';
import { useCreateCabin } from './useCreateCabin';
import { useEditCabin } from './useEditCabin';
import { isSupportedCabinImageUrl } from '../../services/apiCabins';
import Input from '../../ui/Input';
import Textarea from '../../ui/Textarea';
import FormRow from '../../ui/FormRow';
import Button from '../../ui/Button';

function CreateCabinForm({ cabinToEdit, onClose, onBusyChange }) {
  const isEditSession = Boolean(cabinToEdit?.id);
  const { createCabin, isCreating } = useCreateCabin();
  const { editCabin, isEditing } = useEditCabin();
  const isWorking = isCreating || isEditing;
  let submitLabel = isEditSession ? 'Save changes' : 'Create cabin';
  if (isWorking) submitLabel = 'Saving…';
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      subtitle: '',
      description: '',
      max_capacity: 2,
      regular_price: 200,
      discount: 0,
      image: '',
      is_featured: false,
      is_active: true,
      display_order: 0,
      ...cabinToEdit,
      gallery: cabinToEdit?.gallery?.join('\n') || '',
      amenities: cabinToEdit?.amenities?.join(', ') || '',
    },
  });

  function onSubmit(data) {
    const imageFile = data.imageFile?.[0];
    const values = {
      ...data,
      gallery: data.gallery
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean),
      amenities: data.amenities
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };
    onBusyChange?.(true);
    const options = { onSuccess: onClose, onSettled: () => onBusyChange?.(false) };
    if (isEditSession) editCabin({ id: cabinToEdit.id, values, imageFile }, options);
    else createCabin({ values, imageFile }, options);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <fieldset disabled={isWorking} className="space-y-5">
        <FormRow id="name" label="Cabin name" error={errors.name?.message}>
          <Input
            id="name"
            {...register('name', {
              required: 'Enter a cabin name.',
              minLength: { value: 2, message: 'Use at least 2 characters.' },
              maxLength: { value: 100, message: 'Use no more than 100 characters.' },
            })}
          />
        </FormRow>
        <FormRow id="subtitle" label="Subtitle" error={errors.subtitle?.message}>
          <Input id="subtitle" {...register('subtitle', { required: 'Enter a short subtitle.' })} />
        </FormRow>
        <div className="grid gap-5 sm:grid-cols-3">
          <FormRow id="max_capacity" label="Capacity" error={errors.max_capacity?.message}>
            <Input
              id="max_capacity"
              type="number"
              {...register('max_capacity', {
                valueAsNumber: true,
                required: 'Required',
                min: { value: 1, message: 'Minimum 1 guest.' },
                max: { value: 20, message: 'Maximum 20 guests.' },
                validate: Number.isInteger,
              })}
            />
          </FormRow>
          <FormRow
            id="regular_price"
            label="Nightly price (USD)"
            error={errors.regular_price?.message}
          >
            <Input
              id="regular_price"
              type="number"
              step="0.01"
              {...register('regular_price', {
                valueAsNumber: true,
                required: 'Required',
                min: { value: 0.01, message: 'Price must be positive.' },
              })}
            />
          </FormRow>
          <FormRow id="discount" label="Discount (USD)" error={errors.discount?.message}>
            <Input
              id="discount"
              type="number"
              step="0.01"
              {...register('discount', {
                valueAsNumber: true,
                required: 'Required',
                min: 0,
                validate: (value) =>
                  value < getValues('regular_price') || 'Discount must be below price.',
              })}
            />
          </FormRow>
        </div>
        <FormRow id="description" label="Description" error={errors.description?.message}>
          <Textarea
            id="description"
            {...register('description', { required: 'Enter a description.' })}
          />
        </FormRow>
        <FormRow id="image" label="Cover image URL" error={errors.image?.message}>
          <Input
            id="image"
            type="url"
            {...register('image', {
              validate: (value) =>
                Boolean(getValues('imageFile')?.length) ||
                isSupportedCabinImageUrl(value) ||
                'Use an Unsplash or this project’s Storage HTTPS URL, or upload an image.',
            })}
          />
        </FormRow>
        <FormRow id="imageFile" label="Or upload a new cover image (up to 10 MB)">
          <Input
            id="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            {...register('imageFile')}
          />
        </FormRow>
        <p className="text-xs leading-5 text-stone-500">
          Use images.unsplash.com or this project’s Supabase Storage URLs. Existing image files stay
          in storage when edited, duplicated, or deleted. Shared references are preserved.
        </p>
        <FormRow id="gallery" label="Gallery URLs (one per line)">
          <Textarea
            id="gallery"
            {...register('gallery', {
              validate: (value) =>
                value
                  .split('\n')
                  .filter((url) => url.trim())
                  .every((url) => isSupportedCabinImageUrl(url.trim())) ||
                'Gallery URLs must use supported HTTPS image hosts.',
            })}
          />
          {errors.gallery && (
            <p role="alert" className="text-sm text-red-700">
              {errors.gallery.message}
            </p>
          )}
        </FormRow>
        <FormRow id="amenities" label="Amenities (comma separated)">
          <Input id="amenities" {...register('amenities')} />
        </FormRow>
        <FormRow id="display_order" label="Display order">
          <Input
            id="display_order"
            type="number"
            {...register('display_order', {
              valueAsNumber: true,
              min: -32768,
              max: 32767,
              validate: Number.isInteger,
            })}
          />
        </FormRow>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('is_active')} className="accent-emerald-800" />
            Available on customer site
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('is_featured')} className="accent-emerald-800" />
            Featured cabin
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-stone-200 pt-5 dark:border-stone-700">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isWorking}>
            {submitLabel}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
export default CreateCabinForm;
