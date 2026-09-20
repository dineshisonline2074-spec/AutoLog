import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Car,
  ChevronRight,
  CircleAlert,
  Fuel,
  IndianRupee,
  TrendingUp,
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

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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
          setLoading(false);
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
        console.error('Dashboard loading failed:', err);
        setError(
          err.message || 'Unable to load dashboard data.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const totalFuel = useMemo(
    () =>
      fuelLogs.reduce(
        (total, item) =>
          total + Number(item.total_cost || 0),
        0
      ),
    [fuelLogs]
  );

  const totalMaintenance = useMemo(
    () =>
      maintenanceRecords.reduce(
        (total, item) =>
          total + Number(item.cost || 0),
        0
      ),
    [maintenanceRecords]
  );

  const totalExpenses = useMemo(
    () =>
      expenses.reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      ),
    [expenses]
  );

  const totalSpending =
    totalFuel + totalMaintenance + totalExpenses;

  const totalFuelLiters = useMemo(
    () =>
      fuelLogs.reduce(
        (total, item) =>
          total + Number(item.liters || 0),
        0
      ),
    [fuelLogs]
  );

  const averageFuelPrice =
    totalFuelLiters > 0
      ? totalFuel / totalFuelLiters
      : 0;

  const spendingBreakdown = useMemo(() => {
    const items = [
      {
        label: 'Fuel',
        value: totalFuel,
        icon: Fuel,
      },
      {
        label: 'Maintenance',
        value: totalMaintenance,
        icon: Wrench,
      },
      {
        label: 'Other expenses',
        value: totalExpenses,
        icon: IndianRupee,
      },
    ];

    return items.map((item) => ({
      ...item,
      percentage:
        totalSpending > 0
          ? Math.round((item.value / totalSpending) * 100)
          : 0,
    }));
  }, [
    totalFuel,
    totalMaintenance,
    totalExpenses,
    totalSpending,
  ]);

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
        title:
          item.service_type || 'Maintenance service',
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
      .sort(
        (a, b) =>
          new Date(`${b.date}T00:00:00`) -
          new Date(`${a.date}T00:00:00`)
      )
      .slice(0, 6);
  }, [fuelLogs, maintenanceRecords, expenses]);

  const maintenanceStatus = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const records = maintenanceRecords
      .filter((item) => item.next_service_date)
      .map((item) => {
        const serviceDate = new Date(
          `${item.next_service_date}T00:00:00`
        );

        const difference =
          Math.ceil(
            (serviceDate - today) /
              (1000 * 60 * 60 * 24)
          );

        return {
          ...item,
          daysUntilService: difference,
          isOverdue: difference < 0,
        };
      })
      .sort(
        (a, b) =>
          new Date(
            `${a.next_service_date}T00:00:00`
          ) -
          new Date(
            `${b.next_service_date}T00:00:00`
          )
      );

    return records;
  }, [maintenanceRecords]);

  const upcomingMaintenance =
    maintenanceStatus.filter(
      (item) => !item.isOverdue
    );

  const overdueMaintenance =
    maintenanceStatus.filter(
      (item) => item.isOverdue
    );

  const firstName =
    user?.user_metadata?.full_name?.trim()?.split(' ')[0] ||
    'there';

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
          <p className="eyebrow">YOUR VEHICLE OVERVIEW</p>

          <h1>
            {getGreeting()}, {firstName} 👋
          </h1>

          <p>
            Everything you need to track, maintain and
            understand your vehicles in one place.
          </p>
        </div>

        <Link
          to="/vehicles"
          className="header-action-button"
        >
          <Car size={18} />
          Manage vehicles
        </Link>
      </section>

      {error && (
        <div className="dashboard-error" role="alert">
          <CircleAlert size={18} />
          <span>{error}</span>
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
            <span className="stat-description">
              Registered in AutoLog
            </span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon green">
            <IndianRupee size={21} />
          </div>

          <div>
            <p>Total spending</p>
            <strong>
              {formatCurrency(totalSpending)}
            </strong>
            <span className="stat-description">
              Across all records
            </span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon orange">
            <Fuel size={21} />
          </div>

          <div>
            <p>Fuel spending</p>
            <strong>{formatCurrency(totalFuel)}</strong>
            <span className="stat-description">
              {totalFuelLiters.toFixed(1)} liters recorded
            </span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon purple">
            <Wrench size={21} />
          </div>

          <div>
            <p>Maintenance</p>
            <strong>
              {formatCurrency(totalMaintenance)}
            </strong>
            <span className="stat-description">
              {maintenanceRecords.length} service records
            </span>
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
                Add your first fuel, maintenance or expense
                record to start building your vehicle history.
              </p>
            </div>
          ) : (
            <div className="activity-list">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;

                return (
                  <div
                    className="activity-item"
                    key={activity.id}
                  >
                    <div className="activity-icon">
                      <Icon size={18} />
                    </div>

                    <div className="activity-details">
                      <strong>{activity.title}</strong>

                      <span>
                        {activity.type} ·{' '}
                        {formatDate(activity.date)}
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

          {recentActivity.length > 0 && (
            <Link
              to="/expenses"
              className="card-link"
            >
              View records
              <ArrowRight size={16} />
            </Link>
          )}
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Spending overview</h2>
              <p>Where your vehicle money is going.</p>
            </div>

            <TrendingUp size={20} />
          </div>

          <div className="spending-overview">
            {spendingBreakdown.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="spending-row"
                  key={item.label}
                >
                  <div className="spending-row-info">
                    <div className="spending-icon">
                      <Icon size={16} />
                    </div>

                    <div>
                      <strong>{item.label}</strong>
                      <span>
                        {item.percentage}% of total
                      </span>
                    </div>
                  </div>

                  <strong>
                    {formatCurrency(item.value)}
                  </strong>
                </div>
              );
            })}
          </div>

          <div className="spending-total">
            <span>Total</span>
            <strong>
              {formatCurrency(totalSpending)}
            </strong>
          </div>
        </div>

        <div className="dashboard-card maintenance-card">
          <div className="card-header">
            <div>
              <h2>Maintenance</h2>
              <p>Keep your next service on track.</p>
            </div>

            <Wrench size={20} />
          </div>

          {overdueMaintenance.length > 0 && (
            <div className="maintenance-alert">
              <CircleAlert size={17} />

              <div>
                <strong>
                  {overdueMaintenance.length}{' '}
                  overdue service
                  {overdueMaintenance.length !== 1
                    ? 's'
                    : ''}
                </strong>

                <span>
                  Check your maintenance records.
                </span>
              </div>
            </div>
          )}

          {upcomingMaintenance.length === 0 ? (
            <div className="empty-state compact">
              <Wrench size={30} />

              <h3>No upcoming service</h3>

              <p>
                Add a maintenance record with a next
                service date to see reminders here.
              </p>
            </div>
          ) : (
            <div className="maintenance-list">
              {upcomingMaintenance
                .slice(0, 4)
                .map((item) => (
                  <div
                    className="maintenance-item"
                    key={item.id}
                  >
                    <div>
                      <strong>
                        {item.service_type ||
                          'Maintenance service'}
                      </strong>

                      <span>
                        Next service ·{' '}
                        {formatDate(
                          item.next_service_date
                        )}
                      </span>
                    </div>

                    <span className="maintenance-cost">
                      {item.daysUntilService === 0
                        ? 'Today'
                        : item.daysUntilService === 1
                        ? 'Tomorrow'
                        : `${item.daysUntilService} days`}
                    </span>
                  </div>
                ))}
            </div>
          )}

          <Link
            to="/maintenance"
            className="card-link"
          >
            View maintenance
            <ArrowRight size={16} />
          </Link>
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

          <div className="fuel-summary">
            <span>{fuelLogs.length} fuel records</span>

            <span>
              {totalFuelLiters > 0
                ? `${formatCurrency(
                    averageFuelPrice
                  )}/L average`
                : 'No fuel data yet'}
            </span>
          </div>

          <Link
            to="/fuel"
            className="card-link"
          >
            View fuel records
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
                Add your first vehicle to start tracking
                fuel, maintenance and expenses.
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

                  <div className="vehicle-mini-content">
                    <strong>{vehicle.name}</strong>

                    <span>
                      {vehicle.brand || 'Vehicle'}{' '}
                      {vehicle.model || ''}
                    </span>

                    <small>
                      {vehicle.current_odometer
                        ? `${Number(
                            vehicle.current_odometer
                          ).toLocaleString(
                            'en-IN'
                          )} km`
                        : 'Odometer not added'}
                      {' · '}
                      {vehicle.fuel_type ||
                        'Fuel type not set'}
                    </small>
                  </div>

                  <ChevronRight size={17} />
                </Link>
              ))}
            </div>
          )}

          {vehicles.length > 0 && (
            <Link
              to="/vehicles"
              className="card-link"
            >
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