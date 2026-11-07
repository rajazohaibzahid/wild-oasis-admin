import { useSearchParams } from 'react-router-dom';
import Select from './Select';
function SortBy({ options }) {
  const [params, setParams] = useSearchParams();
  function handleChange(event) {
    const next = new URLSearchParams(params);
    next.set('sortBy', event.target.value);
    next.set('page', '1');
    setParams(next);
  }
  return (
    <Select
      aria-label="Sort records"
      value={params.get('sortBy') || options[0].value}
      onChange={handleChange}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
export default SortBy;
