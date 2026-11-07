import PageHeading from '../ui/PageHeading';
import Spinner from '../ui/Spinner';
import ErrorFallback from '../ui/ErrorFallback';
import { useSettings } from '../features/settings/useSettings';
import UpdateSettingsForm from '../features/settings/UpdateSettingsForm';
function Settings() {
  const { settings, isLoading, error, refetch } = useSettings();
  if (isLoading) return <Spinner />;
  if (error) return <ErrorFallback error={error} onRetry={refetch} />;
  return (
    <>
      <PageHeading title="Property settings" description="The ground rules for a wonderful stay." />
      <UpdateSettingsForm settings={settings} />
    </>
  );
}
export default Settings;
