import PageHeading from '../ui/PageHeading';
import UpdateUserDataForm from '../features/authentication/UpdateUserDataForm';
import UpdatePasswordForm from '../features/authentication/UpdatePasswordForm';
function Account() {
  return (
    <>
      <PageHeading
        title="Your account"
        description="Keep your staff profile and sign-in details up to date."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <UpdateUserDataForm />
        </section>
        <section className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <UpdatePasswordForm />
        </section>
      </div>
    </>
  );
}
export default Account;
