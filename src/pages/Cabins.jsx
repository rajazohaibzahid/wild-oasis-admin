import { useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeading from '../ui/PageHeading';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Filter from '../ui/Filter';
import SortBy from '../ui/SortBy';
import CabinTable from '../features/cabins/CabinTable';
import CreateCabinForm from '../features/cabins/CreateCabinForm';

function Cabins() {
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  return (
    <>
      <PageHeading
        title="Your cabin collection"
        description="Thoughtful spaces. Every detail, in one place."
      >
        <Button onClick={() => setIsOpen(true)}>
          <Plus size={17} />
          Add cabin
        </Button>
      </PageHeading>
      <div className="mb-5 flex flex-wrap justify-between gap-3">
        <Filter
          field="discount"
          options={[
            { value: 'all', label: 'All cabins' },
            { value: 'with-discount', label: 'With discount' },
            { value: 'no-discount', label: 'No discount' },
          ]}
        />
        <SortBy
          options={[
            { value: 'name-asc', label: 'Name (A–Z)' },
            { value: 'regular_price-asc', label: 'Price (low first)' },
            { value: 'regular_price-desc', label: 'Price (high first)' },
            { value: 'max_capacity-desc', label: 'Capacity (high first)' },
          ]}
        />
      </div>
      <CabinTable />
      {isOpen && (
        <Modal title="Add a cabin" busy={isBusy} onClose={() => setIsOpen(false)}>
          <CreateCabinForm onClose={() => setIsOpen(false)} onBusyChange={setIsBusy} />
        </Modal>
      )}
    </>
  );
}
export default Cabins;
