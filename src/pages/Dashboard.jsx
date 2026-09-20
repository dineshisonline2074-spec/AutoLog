import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Car,
  Fuel,
  IndianRupee,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { getCurrentUser } from '../services/authService';
import { getVehicles } from '../services/vehicleService';
import { getFuelLogs } from '../services/fuelService';
import { getMaintenanceRecords } from '../services/maintenanceService';
import { getExpenses } from '../services/expenseService';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(date) {
  if (!date) return '-';

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function Dashboard() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const currentUser = await getCurrentUser();

        if (!currentUser) {
          return;
        }

        setUser(currentUser);

        const [
          vehicleData,
          fuelData,
          maintenanceData,
          expenseData,
        ] = await Promise.all([
          getVehicles(currentUser.id),
          getFuelLogs(currentUser.id),
          getMaintenanceRecords(currentUser.id),
          getExpenses(currentUser.id),
        ]);

        setVehicles(vehicleData);
        setFuelLogs(fuelData);
        setMaintenanceRecords(maintenanceData);
        setExpenses(expenseData);
      } catch (err) {
        setError(err.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const totalFuel = useMemo(
    () =>
      fuelLogs.reduce(
        (total, item) => total + Number(item.total_cost || 0),
        0
      ),
    [fuelLogs]
  );

  const totalMaintenance = useMemo(
    () =>
      maintenanceRecords.reduce(
        (total, item) => total + Number(item.cost || 0),
        0
      ),
    [maintenanceRecords]
  );

  const totalExpenses = useMemo(
    () =>
      expenses.reduce(
        (total, item) => total + Number(item.amount || 0),
        0
      ),
    [expenses]
  );

  const totalSpending =
    totalFuel + totalMaintenance + totalExpenses;

  const totalFuelLiters = useMemo(
    () =>
      fuelLogs.reduce(
        (total, item) => total + Number(item.liters || 0),
        0
      ),
    [fuelLogs]
  );

  const averageFuelPrice =
    totalFuelLiters > 0
      ? totalFuel / totalFuelLiters
      : 0;

  const recentActivity = useMemo(() => {
    const activities = [
      ...fuelLogs.map((item) => ({
        id: `fuel-${item.id}`,
        type: 'Fuel',
        title: 'Fuel refill',
        date: item.date,
        amount: Number(item.total_cost || 0),
        icon: Fuel,
      })),

      ...maintenanceRecords.map((item) => ({
        id: `maintenance-${item.id}`,
        type: 'Maintenance',
        title: item.service_type || 'Maintenance service',
        date: item.date,
        amount: Number(item.cost || 0),
        icon: Wrench,
      })),

      ...expenses.map((item) => ({
        id: `expense-${item.id}`,
        type: 'Expense',
        title: item.category || 'Expense',
        date: item.date,
        amount: Number(item.amount || 0),
        icon: IndianRupee,
      })),
    ];

    return activities
      .sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      })
      .slice(0, 6);
  }, [fuelLogs, maintenanceRecords, expenses]);

  const upcomingMaintenance = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return maintenanceRecords
      .filter((item) => {
        if (!item.next_service_date) return false;

        return (
          new Date(`${item.next_service_date}T00:00:00`) >= today
        );
      })
      .sort(
        (a, b) =>
          new Date(`${a.next_service_date}T00:00:00`) -
          new Date(`${b.next_service_date}T00:00:00`)
      )
      .slice(0, 5);
  }, [maintenanceRecords]);

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="page-header dashboard-header">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>Good morning, {firstName} 👋</h1>
          <p>
            Keep your vehicles, fuel, maintenance and expenses
            organized in one place.
          </p>
        </div>

        <Link to="/vehicles" className="header-action-button">
          <Car size={18} />
          Manage vehicles
        </Link>
      </section>

      {error && (
        <div className="dashboard-error" role="alert">
          {error}
        </div>
      )}

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon blue">
            <Car size={21} />
          </div>

          <div>
            <p>Total vehicles</p>
            <strong>{vehicles.length}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon green">
            <IndianRupee size={21} />
          </div>

          <div>
            <p>Total spending</p>
            <strong>{formatCurrency(totalSpending)}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon orange">
            <Fuel size={21} />
          </div>

          <div>
            <p>Fuel spending</p>
            <strong>{formatCurrency(totalFuel)}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon purple">
            <Wrench size={21} />
          </div>

          <div>
            <p>Maintenance</p>
            <strong>{formatCurrency(totalMaintenance)}</strong>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-card activity-card">
          <div className="card-header">
            <div>
              <h2>Recent activity</h2>
              <p>Your latest vehicle records.</p>
            </div>

            <Activity size={20} />
          </div>

          {recentActivity.length === 0 ? (
            <div className="empty-state compact">
              <Activity size={30} />
              <h3>No activity yet</h3>
              <p>
                Add fuel, maintenance or expense records to see
                them here.
              </p>
            </div>
          ) : (
            <div className="activity-list">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;

                return (
                  <div className="activity-item" key={activity.id}>
                    <div className="activity-icon">
                      <Icon size={18} />
                    </div>

                    <div className="activity-details">
                      <strong>{activity.title}</strong>
                      <span>
                        {activity.type} · {formatDate(activity.date)}
                      </span>
                    </div>

                    <strong className="activity-amount">
                      {formatCurrency(activity.amount)}
                    </strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Fuel overview</h2>
              <p>Your overall fuel statistics.</p>
            </div>

            <Fuel size={20} />
          </div>

          <div className="fuel-overview">
            <div className="overview-number">
              <span>Total fuel</span>
              <strong>
                {totalFuelLiters.toFixed(1)} L
              </strong>
            </div>

            <div className="overview-number">
              <span>Average price</span>
              <strong>
                {formatCurrency(averageFuelPrice)}
                <small>/L</small>
              </strong>
            </div>
          </div>

          <Link to="/fuel" className="card-link">
            View fuel records
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="dashboard-card maintenance-card">
          <div className="card-header">
            <div>
              <h2>Upcoming maintenance</h2>
              <p>Stay ahead of your next service.</p>
            </div>

            <Wrench size={20} />
          </div>

          {upcomingMaintenance.length === 0 ? (
            <div className="empty-state compact">
              <Wrench size={30} />
              <h3>No upcoming service</h3>
              <p>
                Add a maintenance record with a next service
                date.
              </p>
            </div>
          ) : (
            <div className="maintenance-list">
              {upcomingMaintenance.map((item) => (
                <div
                  className="maintenance-item"
                  key={item.id}
                >
                  <div>
                    <strong>
                      {item.service_type}
                    </strong>
                    <span>
                      Next service ·{' '}
                      {formatDate(item.next_service_date)}
                    </span>
                  </div>

                  <span className="maintenance-cost">
                    {formatCurrency(item.cost)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link to="/maintenance" className="card-link">
            View maintenance
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="dashboard-card vehicles-card">
          <div className="card-header">
            <div>
              <h2>Your vehicles</h2>
              <p>Vehicles currently in AutoLog.</p>
            </div>

            <Car size={20} />
          </div>

          {vehicles.length === 0 ? (
            <div className="empty-state compact">
              <Car size={30} />
              <h3>No vehicles added</h3>
              <p>
                Add your first vehicle to start using AutoLog.
              </p>

              <Link
                to="/vehicles"
                className="small-primary-button"
              >
                Add vehicle
              </Link>
            </div>
          ) : (
            <div className="vehicle-mini-list">
              {vehicles.slice(0, 4).map((vehicle) => (
                <Link
                  to={`/vehicles/${vehicle.id}`}
                  className="vehicle-mini-item"
                  key={vehicle.id}
                >
                  <div className="vehicle-mini-icon">
                    <Car size={18} />
                  </div>

                  <div>
                    <strong>{vehicle.name}</strong>
                    <span>
                      {vehicle.brand || 'Vehicle'}{' '}
                      {vehicle.model || ''}
                    </span>
                  </div>

                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          )}

          {vehicles.length > 0 && (
            <Link to="/vehicles" className="card-link">
              View all vehicles
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;