import { useEffect, useState } from 'react';
import {
  Check,
  Mail,
  Save,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../services/authService';

function Profile() {
  const [user, setUser] = useState(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError('');

      const currentUser = await getCurrentUser();

      if (!currentUser) {
        setError(
          'Your session has expired. Please sign in again.'
        );
        return;
      }

      setUser(currentUser);

      const { data: profile, error: profileError } =
        await supabase
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('id', currentUser.id)
          .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      setFullName(
        profile?.full_name ||
          currentUser.user_metadata?.full_name ||
          ''
      );

      setEmail(
        profile?.email ||
          currentUser.email ||
          ''
      );
    } catch (err) {
      setError(
        err.message ||
          'Unable to load your profile.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!user) {
      setError('Please sign in again.');
      return;
    }

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const cleanName = fullName.trim();

      const { error: profileError } =
        await supabase
          .from('profiles')
          .update({
            full_name: cleanName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      const { error: authError } =
        await supabase.auth.updateUser({
          data: {
            full_name: cleanName,
          },
        });

      if (authError) {
        throw authError;
      }

      setUser((previous) => ({
        ...previous,
        user_metadata: {
          ...previous.user_metadata,
          full_name: cleanName,
        },
      }));

      setSuccess(
        'Profile updated successfully.'
      );

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(
        err.message ||
          'Unable to update your profile.'
      );
    } finally {
      setSaving(false);
    }
  }

  function getInitials(name) {
    if (!name) return 'A';

    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="page-header dashboard-header">
        <div>
          <p className="eyebrow">ACCOUNT</p>

          <h1>Profile</h1>

          <p>
            Manage your AutoLog account information.
          </p>
        </div>
      </section>

      {error && (
        <div className="dashboard-error" role="alert">
          <X size={17} />
          {error}
        </div>
      )}

      {success && (
        <div
          className="dashboard-success"
          role="status"
        >
          <Check size={17} />
          {success}
        </div>
      )}

      <div className="profile-page-grid">
        <section className="dashboard-card profile-summary-card">
          <div className="profile-avatar-large">
            {getInitials(fullName)}
          </div>

          <h2>
            {fullName || 'AutoLog user'}
          </h2>

          <p className="profile-summary-email">
            {email}
          </p>

          <div className="profile-account-status">
            <div className="profile-status-icon">
              <ShieldCheck size={18} />
            </div>

            <div>
              <strong>Account secured</strong>

              <span>
                Your account is protected by
                Supabase Authentication.
              </span>
            </div>
          </div>
        </section>

        <section className="dashboard-card profile-form-card">
          <div className="card-header">
            <div>
              <h2>Personal information</h2>

              <p>
                Update the information associated with
                your AutoLog account.
              </p>
            </div>

            <User size={20} />
          </div>

          <form
            className="profile-form"
            onSubmit={handleSave}
          >
            <div className="profile-form-group">
              <label htmlFor="profile-name">
                Full name
              </label>

              <div className="profile-input-wrapper">
                <User size={18} />

                <input
                  id="profile-name"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="profile-form-group">
              <label htmlFor="profile-email">
                Email address
              </label>

              <div className="profile-input-wrapper disabled">
                <Mail size={18} />

                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  disabled
                  readOnly
                />
              </div>

              <span className="profile-field-help">
                Your login email is managed by your
                authentication account.
              </span>
            </div>

            <div className="profile-form-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                <Save size={17} />

                {saving
                  ? 'Saving...'
                  : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="dashboard-card profile-security-card">
        <div className="profile-security-icon">
          <ShieldCheck size={22} />
        </div>

        <div>
          <h3>Account security</h3>

          <p>
            Your authentication is handled securely by
            Supabase. AutoLog never stores your password
            inside the application database.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Profile;