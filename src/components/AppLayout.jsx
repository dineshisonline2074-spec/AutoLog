import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import Sidebar from './Sidebar';
import Navbar from './Navbar';

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent background scrolling while mobile menu is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }

    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [sidebarOpen]);

  return (
    <div className="app-shell">
      {/* Mobile menu button */}
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={sidebarOpen}
      >
        <Menu size={22} strokeWidth={2} />
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`app-sidebar ${
          sidebarOpen ? 'app-sidebar-open' : ''
        }`}
      >
        <div className="mobile-sidebar-header">
          <div className="mobile-sidebar-brand">
            <div className="brand-mark">A</div>
            <div>
              <strong>AutoLog</strong>
              <span>Vehicle Manager</span>
            </div>
          </div>

          <button
            type="button"
            className="mobile-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* Main application area */}
      <div className="app-main">
        <Navbar />

        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;