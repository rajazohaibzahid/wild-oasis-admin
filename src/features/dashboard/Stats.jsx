import { CalendarDays, Wallet, LogIn, BedDouble } from 'lucide-react';
import Stat from './Stat';
import { formatCurrency } from '../../utils/helpers';
function Stats({ data }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat
        title="New reservations"
        value={data.booking_count}
        detail="Created in the selected period"
        icon={CalendarDays}
      />
      <Stat
        title="Recorded collections"
        value={formatCurrency(data.paid_revenue)}
        detail="Payments recorded in period · excludes demo"
        icon={Wallet}
      />
      <Stat
        title="Arrivals checked in"
        value={data.checkins}
        detail="Check-in events in the selected period"
        icon={LogIn}
      />
      <Stat
        title="Occupancy"
        value={`${data.occupancy}%`}
        detail="Occupied cabin nights / available inventory"
        icon={BedDouble}
      />
    </div>
  );
}
export default Stats;
