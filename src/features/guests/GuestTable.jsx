import { Link } from 'react-router-dom';
import { useGuests } from './useGuests';
import Table from '../../ui/Table';
import Spinner from '../../ui/Spinner';
import Empty from '../../ui/Empty';
import ErrorFallback from '../../ui/ErrorFallback';
import Pagination from '../../ui/Pagination';
import { formatDate } from '../../utils/helpers';
function GuestTable() {
  const { guests, count, isLoading, error, refetch } = useGuests();
  if (isLoading) return <Spinner />;
  if (error) return <ErrorFallback error={error} onRetry={refetch} />;
  if (!guests?.length)
    return (
      <>
        <Empty resource="guests" />
        {count > 0 && <Pagination count={count} />}
      </>
    );
  return (
    <>
      <Table
        columns={['Guest', 'Contact', 'Nationality', 'Joined', 'Details']}
        caption="Guest directory"
      >
        {guests.map((guest) => (
          <tr key={guest.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
            <td className="whitespace-nowrap px-5 py-5 font-semibold">
              {guest.full_name || 'Unnamed guest'}
            </td>
            <td className="px-5 py-5">
              <p>{guest.email}</p>
              <p className="mt-1 text-xs text-stone-500">{guest.phone || 'No phone provided'}</p>
            </td>
            <td className="px-5 py-5">{guest.nationality || '—'}</td>
            <td className="whitespace-nowrap px-5 py-5 text-stone-500">
              {formatDate(guest.created_at)}
            </td>
            <td className="px-5 py-5">
              <Link
                to={`/guests/${guest.id}`}
                className="whitespace-nowrap font-semibold text-emerald-800 hover:underline dark:text-emerald-400"
              >
                View guest →
              </Link>
            </td>
          </tr>
        ))}
      </Table>
      <Pagination count={count} />
    </>
  );
}
export default GuestTable;
