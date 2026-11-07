import PageHeading from '../ui/PageHeading';
import Filter from '../ui/Filter';
import DashboardLayout from '../features/dashboard/DashboardLayout';
function Dashboard() {
  return (
    <>
      <PageHeading
        title="A good day at the oasis."
        description="A little perspective on your property, guests, and the days ahead."
      >
        <Filter
          field="last"
          options={[
            { value: '7', label: '7 days' },
            { value: '30', label: '30 days' },
            { value: '90', label: '90 days' },
          ]}
        />
      </PageHeading>
      <DashboardLayout />
    </>
  );
}
export default Dashboard;
