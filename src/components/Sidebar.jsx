import {
  Car,
  ChevronRight,
  CircleUserRound,
  Fuel,
  Gauge,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Wrench,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

function Sidebar({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'My Vehicles',
      path: '/vehicles',
      icon: Car,
    },
    {
      label: 'Fuel Logs',
      path: '/fuel',
      icon: Fuel,
    },
    {
      label: 'Maintenance',
      path: '/maintenance',
      icon: Wrench,
    },
    {
      label: 'Expenses',
      path: '/expenses',
      icon: ReceiptText,
    },
  ];

  const accountItems = [
    {
      label: 'Profile',
      path: '/profile',
      icon: CircleUserRound,
    },
  ];

  function handleNavigation() {
    if (onNavigate) {
      onNavigate();
    }
  }

  function handleLogoClick() {
    navigate('/dashboard');
    handleNavigation();
  }

  function isVehicleDetailsPage() {
    return (
      location.pathname.startsWith('/vehicles/') &&
      location.pathname !== '/vehicles'
    );
  }

  return (
    <div className="sidebar-inner">
      {/* Brand */}
      <button
        type="button"
        className="sidebar-brand"
        onClick={handleLogoClick}
        aria-label="Go to AutoLog dashboard"
      >
        <div className="brand-mark">A</div>

        <div className="brand-text">
          <strong>AutoLog</strong>
          <span>Vehicle Manager</span>
        </div>
      </button>

      {/* Main navigation */}
      <nav className="sidebar-navigation">
        <div className="sidebar-section-label">MAIN MENU</div>

        <div className="sidebar-menu">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavigation}
                className={({ isActive }) => {
                  const active =
                    isActive ||
                    (item.path === '/vehicles' &&
                      isVehicleDetailsPage());

                  return `sidebar-link ${
                    active ? 'sidebar-link-active' : ''
                  }`;
                }}
              >
                <Icon size={19} strokeWidth={2} />

                <span>{item.label}</span>

                <ChevronRight
                  className="sidebar-link-arrow"
                  size={16}
                  strokeWidth={2}
                />
              </NavLink>
            );
          })}
        </div>

        {/* Account */}
        <div className="sidebar-section-label sidebar-account-label">
          ACCOUNT
        </div>

        <div className="sidebar-menu">
          {accountItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavigation}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive ? 'sidebar-link-active' : ''
                  }`
                }
              >
                <Icon size={19} strokeWidth={2} />

                <span>{item.label}</span>

                <ChevronRight
                  className="sidebar-link-arrow"
                  size={16}
                  strokeWidth={2}
                />
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Bottom card */}
      <div className="sidebar-bottom">
        <div className="sidebar-status-card">
          <div className="sidebar-status-icon">
            <Gauge size={18} strokeWidth={2} />
          </div>

          <div className="sidebar-status-content">
            <strong>AutoLog</strong>
            <span>Track. Maintain. Drive.</span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-settings-button"
          onClick={() => {
            navigate('/profile');
            handleNavigation();
          }}
        >
          <Settings size={17} strokeWidth={2} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;