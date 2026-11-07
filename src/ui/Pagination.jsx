import { useSearchParams } from 'react-router-dom';
import Button from './Button';
import { PAGE_SIZE } from '../utils/constants';
import { getPage } from '../utils/helpers';
function Pagination({ count }) {
  const [params, setParams] = useSearchParams();
  const page = getPage(params.get('page'));
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  function changePage(nextPage) {
    const next = new URLSearchParams(params);
    next.set('page', String(nextPage));
    setParams(next);
  }
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-500">
      <p>
        {count} results · Page {page} of {pages}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => changePage(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" disabled={page >= pages} onClick={() => changePage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
export default Pagination;
