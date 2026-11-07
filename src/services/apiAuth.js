import { requireSupabase } from './supabase';

export async function login({ email, password }) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function getCurrentUser() {
  const {
    data: { session },
  } = await requireSupabase().auth.getSession();
  if (!session) return null;
  const { data, error } = await requireSupabase().auth.getUser();
  if (error) throw new Error('Your session could not be verified. Please sign in again.');
  return data.user;
}

export async function getStaffAccess() {
  const { data, error } = await requireSupabase().rpc('staff_access');
  if (error) {
    if (error.code === 'PGRST202')
      throw new Error(
        'The staff access migration is awaiting owner approval. See docs/DATABASE_REVIEW.md.',
      );
    throw new Error(error.message);
  }
  return data === true;
}

export async function logout() {
  const { error } = await requireSupabase().auth.signOut({ scope: 'local' });
  if (error) throw new Error(error.message);
}

export async function updateCurrentUser({ fullName, password, currentPassword }) {
  const client = requireSupabase();
  if (password) {
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user) throw new Error('Please sign in again.');
    const { error: verifyError } = await client.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError) throw new Error('Your current password is incorrect.');
    const { error } = await client.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  } else {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error('Please sign in again.');
    const { error } = await client.from('guests').update({ full_name: fullName }).eq('id', user.id);
    if (error) throw new Error(error.message);
    const { error: authError } = await client.auth.updateUser({ data: { full_name: fullName } });
    if (authError) throw new Error(authError.message);
  }
}
