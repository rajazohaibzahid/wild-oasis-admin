import { useSearchParams } from 'react-router-dom';
import PageHeading from '../ui/PageHeading';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Filter from '../ui/Filter';
import GuestTable from '../features/guests/GuestTable';
function Guests() {
  const [params, setParams] = useSearchParams();
  function handleSearch(event) {
    event.preventDefault();
    const next = new URLSearchParams(params);
    next.set('search', new FormData(event.currentTarget).get('search').trim());
    next.set('page', '1');
    setParams(next);
  }
  return (
    <>
      <PageHeading
        title="People behind the stays"
        description="Get to know your guests and their journey with Wild Oasis."
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex w-full max-w-md gap-2">
          <Input
            aria-label="Search guests by name or email"
            name="search"
            defaultValue={params.get('search') || ''}
            placeholder="Search name or email…"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <Filter
          field="contact"
          options={[
            { value: 'all', label: 'All guests' },
            { value: 'with-phone', label: 'Phone provided' },
          ]}
        />
      </div>
      <GuestTable />
    </>
  );
}
export default Guests;
