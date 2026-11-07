import { useSearchParams } from 'react-router-dom';
import { useCabins } from './useCabins';
import CabinRow from './CabinRow';
import Table from '../../ui/Table';
import Spinner from '../../ui/Spinner';
import Empty from '../../ui/Empty';
import ErrorFallback from '../../ui/ErrorFallback';

function CabinTable() {
  const { cabins, isLoading, error, refetch } = useCabins();
  const [params] = useSearchParams();
  if (isLoading) return <Spinner />;
  if (error) return <ErrorFallback error={error} onRetry={refetch} />;
  let filteredCabins = cabins;
  if (params.get('discount') === 'with-discount')
    filteredCabins = cabins.filter((cabin) => cabin.discount > 0);
  if (params.get('discount') === 'no-discount')
    filteredCabins = cabins.filter((cabin) => cabin.discount === 0);
  const [field, direction] = (params.get('sortBy') || 'name-asc').split('-');
  const sortField = ['name', 'regular_price', 'max_capacity'].includes(field) ? field : 'name';
  const sortedCabins = [...filteredCabins].sort((a, b) => {
    const result =
      sortField === 'name' ? a.name.localeCompare(b.name) : a[sortField] - b[sortField];
    return direction === 'desc' ? -result : result;
  });
  if (!sortedCabins.length) return <Empty resource="cabins" />;
  return (
    <Table
      columns={['Cabin', 'Capacity', 'Nightly price', 'Discount', 'Visibility', 'Actions']}
      caption="Cabin catalog"
    >
      {sortedCabins.map((cabin) => (
        <CabinRow key={cabin.id} cabin={cabin} />
      ))}
    </Table>
  );
}
export default CabinTable;
