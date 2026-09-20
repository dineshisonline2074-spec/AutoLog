import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { onAuthStateChange } from './services/authService';

import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import VehicleDetails from './pages/VehicleDetails';
import Fuel from './pages/Fuel';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import Profile from './pages/Profile';

function ProtectedPage({ user, loading, children }) {
  return (
    <ProtectedRoute user={user} loading={loading}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = onAuthStateChange((event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />

        <Route
          path="/register"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Register />
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedPage user={user} loading={loading}>
              <Dashboard />
            </ProtectedPage>
          }
        />

        <Route
          path="/vehicles"
          element={
            <ProtectedPage user={user} loading={loading}>
              <Vehicles />
            </ProtectedPage>
          }
        />

        <Route
          path="/vehicles/:vehicleId"
          element={
            <ProtectedPage user={user} loading={loading}>
              <VehicleDetails />
            </ProtectedPage>
          }
        />

        <Route
          path="/fuel"
          element={
            <ProtectedPage user={user} loading={loading}>
              <Fuel />
            </ProtectedPage>
          }
        />

        <Route
          path="/maintenance"
          element={
            <ProtectedPage user={user} loading={loading}>
              <Maintenance />
            </ProtectedPage>
          }
        />

        <Route
          path="/expenses"
          element={
            <ProtectedPage user={user} loading={loading}>
              <Expenses />
            </ProtectedPage>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedPage user={user} loading={loading}>
              <Profile />
            </ProtectedPage>
          }
        />

        {/* Default route */}
        <Route
          path="/"
          element={
            <Navigate
              to={user ? '/dashboard' : '/login'}
              replace
            />
          }
        />

        {/* Unknown routes */}
        <Route
          path="*"
          element={
            <Navigate
              to={user ? '/dashboard' : '/login'}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;