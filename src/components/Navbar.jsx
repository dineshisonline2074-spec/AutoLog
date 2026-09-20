import { Bell, LogOut, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../services/authService';

function Navbar() {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <header className="top-navbar">
      <div className="navbar-page-info">
        <div className="navbar-mobile-spacer" />

        <div className="navbar-heading">
          <span className="navbar-app-name">AutoLog</span>
          <span className="navbar-tagline">
            Your vehicle, organized.
          </span>
        </div>
      </div>

      <div className="navbar-right">
        <button
          type="button"
          className="navbar-icon-button"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={19} strokeWidth={2} />
          <span className="notification-dot" />
        </button>

        <button
          type="button"
          className="navbar-profile-button"
          onClick={() => navigate('/profile')}
        >
          <UserCircle size={20} strokeWidth={2} />
          <span>Profile</span>
        </button>

        <button
          type="button"
          className="navbar-logout-button"
          onClick={handleLogout}
        >
          <LogOut size={18} strokeWidth={2} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;