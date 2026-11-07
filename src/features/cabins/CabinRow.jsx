import { useState } from 'react';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import { useCreateCabin } from './useCreateCabin';
import { useDeleteCabin } from './useDeleteCabin';
import CreateCabinForm from './CreateCabinForm';
import Modal from '../../ui/Modal';
import Menus from '../../ui/Menus';
import Button from '../../ui/Button';
import ConfirmDelete from '../../ui/ConfirmDelete';
import { formatCurrency } from '../../utils/helpers';

function CabinRow({ cabin }) {
  const [modal, setModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { createCabin, isCreating } = useCreateCabin();
  const { deleteCabin, isDeleting } = useDeleteCabin();
  function handleDuplicate() {
    createCabin({
      values: {
        ...cabin,
        name: `${cabin.name.slice(0, 75)} (copy ${crypto.randomUUID().slice(0, 6)})`,
        is_active: false,
        is_featured: false,
      },
    });
  }
  return (
    <tr className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
      <td className="px-5 py-4">
        <div className="flex items-center gap-4">
          <img src={cabin.image} alt={cabin.name} className="h-14 w-20 rounded-lg object-cover" />
          <div className="min-w-40">
            <p className="font-semibold">{cabin.name}</p>
            <p className="mt-1 text-xs text-stone-500">{cabin.subtitle}</p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-5 py-4">{cabin.max_capacity} guests</td>
      <td className="px-5 py-4 font-medium tabular-nums">{formatCurrency(cabin.regular_price)}</td>
      <td className="px-5 py-4 text-emerald-700 dark:text-emerald-400">
        {cabin.discount > 0 ? formatCurrency(cabin.discount) : '—'}
      </td>
      <td className="px-5 py-4">
        <span
          className={`rounded-full px-2 py-1 text-xs ${cabin.is_active ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'}`}
        >
          {cabin.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-5 py-4">
        <Menus label={`Actions for ${cabin.name}`}>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setModal('edit')}>
            <Pencil size={15} />
            Edit
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            disabled={isCreating}
            onClick={handleDuplicate}
          >
            <Copy size={15} />
            Duplicate
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-700"
            onClick={() => setModal('delete')}
          >
            <Trash2 size={15} />
            Delete
          </Button>
        </Menus>
        {modal === 'edit' && (
          <Modal title="Edit cabin" onClose={() => setModal(null)} busy={isSaving}>
            <CreateCabinForm
              cabinToEdit={cabin}
              onClose={() => setModal(null)}
              onBusyChange={setIsSaving}
            />
          </Modal>
        )}
        {modal === 'delete' && (
          <Modal title="Delete cabin" onClose={() => setModal(null)} busy={isDeleting}>
            <ConfirmDelete
              resourceName={cabin.name}
              disabled={isDeleting}
              onClose={() => setModal(null)}
              onConfirm={() => deleteCabin(cabin.id, { onSuccess: () => setModal(null) })}
            />
          </Modal>
        )}
      </td>
    </tr>
  );
}
export default CabinRow;
