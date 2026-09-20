import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Car,
  Fuel,
  IndianRupee,
  Gauge,
  Wrench,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { getCurrentUser } from '../services/authService';
import { getVehicle } from '../services/vehicleService';
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

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}

function VehicleDetails() {
  const { vehicleId } = useParams();

  const [vehicle, setVehicle] = useState(null);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] =
    useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadVehicleDetails() {
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

        const [
          vehicleData,
          fuelData,
          maintenanceData,
          expenseData,
        ] = await Promise.all([
          getVehicle(vehicleId, currentUser.id),
          getFuelLogs(currentUser.id, vehicleId),
          getMaintenanceRecords(
            currentUser.id,
            vehicleId
          ),
          getExpenses(currentUser.id, vehicleId),
        ]);

        setVehicle(vehicleData);
        setFuelLogs(fuelData);
        setMaintenanceRecords(maintenanceData);
        setExpenses(expenseData);
      } catch (err) {
        setError(
          err.message ||
            'Unable to load vehicle details.'
        );
      } finally {
        setLoading(false);
      }
    }

    if (vehicleId) {
      loadVehicleDetails();
    }
  }, [vehicleId]);

  const fuelCost = useMemo(
    () =>
      fuelLogs.reduce(
        (total, item) =>
          total + Number(item.total_cost || 0),
        0
      ),
    [fuelLogs]
  );

  const maintenanceCost = useMemo(
    () =>
      maintenanceRecords.reduce(
        (total, item) =>
          total + Number(item.cost || 0),
        0
      ),
    [maintenanceRecords]
  );

  const expenseCost = useMemo(
    () =>
      expenses.reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      ),
    [expenses]
  );

  const totalCost =
    fuelCost + maintenanceCost + expenseCost;

  const totalFuel = useMemo(
    () =>
      fuelLogs.reduce(
        (total, item) =>
          total + Number(item.liters || 0),
        0
      ),
    [fuelLogs]
  );

  const averageFuelPrice =
    totalFuel > 0 ? fuelCost / totalFuel : 0;

  const latestFuel = fuelLogs[0];

  const latestMaintenance =
    maintenanceRecords[0];

  const upcomingMaintenance = useMemo(() => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return maintenanceRecords
      .filter((item) => {
        if (!item.next_service_date) {
          return false;
        }

        return (
          new Date(
            `${item.next_service_date}T00:00:00`
          ) >= today
        );
      })
      .sort(
        (a, b) =>
          new Date(
            `${a.next_service_date}T00:00:00`
          ) -
          new Date(
            `${b.next_service_date}T00:00:00`
          )
      )[0];
  }, [maintenanceRecords]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading vehicle details...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="dashboard-page">
        <Link
          to="/vehicles"
          className="back-link"
        >
          <ArrowLeft size={17} />
          Back to vehicles
        </Link>

        <section className="dashboard-card details-error-card">
          <div className="empty-state">
            <div className="large-empty-icon">
              <Car size={42} />
            </div>

            <h2>Vehicle not found</h2>

            <p>
              {error ||
                'This vehicle could not be found.'}
            </p>

            <Link
              to="/vehicles"
              className="small-primary-button"
            >
              Back to vehicles
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-page vehicle-details-page">
      <Link
        to="/vehicles"
        className="back-link"
      >
        <ArrowLeft size={17} />
        Back to vehicles
      </Link>

      <section className="vehicle-details-hero">
        <div className="vehicle-hero-icon">
          <Car size={32} />
        </div>

        <div className="vehicle-hero-content">
          <p className="eyebrow">VEHICLE DETAILS</p>

          <h1>{vehicle.name}</h1>

          <p className="vehicle-hero-model">
            {vehicle.brand || 'Vehicle'}{' '}
            {vehicle.model || ''}
          </p>

          <div className="vehicle-hero-meta">
            <span>
              {vehicle.registration_number ||
                'Registration not added'}
            </span>

            <span>•</span>

            <span>{vehicle.fuel_type}</span>

            {vehicle.year && (
              <>
                <span>•</span>
                <span>{vehicle.year}</span>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="vehicle-stat-grid">
        <article className="vehicle-stat-card">
          <div className="vehicle-stat-icon blue">
            <Gauge size={21} />
          </div>

          <div>
            <span>Current odometer</span>
            <strong>
              {Number(
                vehicle.current_odometer || 0
              ).toLocaleString('en-IN')}{' '}
              km
            </strong>
          </div>
        </article>

        <article className="vehicle-stat-card">
          <div className="vehicle-stat-icon green">
            <IndianRupee size={21} />
          </div>

          <div>
            <span>Total spending</span>
            <strong>
              {formatCurrency(totalCost)}
            </strong>
          </div>
        </article>

        <article className="vehicle-stat-card">
          <div className="vehicle-stat-icon orange">
            <Fuel size={21} />
          </div>

          <div>
            <span>Fuel spending</span>
            <strong>
              {formatCurrency(fuelCost)}
            </strong>
          </div>
        </article>

        <article className="vehicle-stat-card">
          <div className="vehicle-stat-icon purple">
            <Wrench size={21} />
          </div>

          <div>
            <span>Maintenance</span>
            <strong>
              {formatCurrency(maintenanceCost)}
            </strong>
          </div>
        </article>
      </section>

      <section className="vehicle-details-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Vehicle information</h2>
              <p>Basic information about this vehicle.</p>
            </div>

            <Car size={20} />
          </div>

          <div className="vehicle-info-grid">
            <div className="vehicle-info-item">
              <span>Vehicle name</span>
              <strong>{vehicle.name}</strong>
            </div>

            <div className="vehicle-info-item">
              <span>Brand</span>
              <strong>
                {vehicle.brand || 'Not added'}
              </strong>
            </div>

            <div className="vehicle-info-item">
              <span>Model</span>
              <strong>
                {vehicle.model || 'Not added'}
              </strong>
            </div>

            <div className="vehicle-info-item">
              <span>Registration</span>
              <strong>
                {vehicle.registration_number ||
                  'Not added'}
              </strong>
            </div>

            <div className="vehicle-info-item">
              <span>Fuel type</span>
              <strong>{vehicle.fuel_type}</strong>
            </div>

            <div className="vehicle-info-item">
              <span>Purchase date</span>
              <strong>
                {formatDate(vehicle.purchase_date)}
              </strong>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Fuel summary</h2>
              <p>Fuel usage and spending.</p>
            </div>

            <Fuel size={20} />
          </div>

          <div className="details-summary-list">
            <div>
              <span>Total refills</span>
              <strong>{fuelLogs.length}</strong>
            </div>

            <div>
              <span>Total fuel</span>
              <strong>
                {totalFuel.toFixed(1)} L
              </strong>
            </div>

            <div>
              <span>Average price</span>
              <strong>
                {formatCurrency(averageFuelPrice)}
                /L
              </strong>
            </div>

            <div>
              <span>Last refill</span>
              <strong>
                {latestFuel
                  ? formatDate(latestFuel.date)
                  : 'No records'}
              </strong>
            </div>
          </div>

          <Link
            to="/fuel"
            className="card-link"
          >
            Manage fuel records
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Maintenance summary</h2>
              <p>Keep your next service in sight.</p>
            </div>

            <Wrench size={20} />
          </div>

          <div className="details-summary-list">
            <div>
              <span>Total services</span>
              <strong>
                {maintenanceRecords.length}
              </strong>
            </div>

            <div>
              <span>Total maintenance cost</span>
              <strong>
                {formatCurrency(maintenanceCost)}
              </strong>
            </div>

            <div>
              <span>Last service</span>
              <strong>
                {latestMaintenance
                  ? formatDate(
                      latestMaintenance.date
                    )
                  : 'No records'}
              </strong>
            </div>

            <div>
              <span>Next service</span>
              <strong>
                {upcomingMaintenance
                  ? formatDate(
                      upcomingMaintenance.next_service_date
                    )
                  : 'Not scheduled'}
              </strong>
            </div>
          </div>

          <Link
            to="/maintenance"
            className="card-link"
          >
            Manage maintenance
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Expense summary</h2>
              <p>Other costs related to this vehicle.</p>
            </div>

            <IndianRupee size={20} />
          </div>

          <div className="details-summary-list">
            <div>
              <span>Total expense records</span>
              <strong>{expenses.length}</strong>
            </div>

            <div>
              <span>Total other expenses</span>
              <strong>
                {formatCurrency(expenseCost)}
              </strong>
            </div>

            <div>
              <span>Overall spending</span>
              <strong>
                {formatCurrency(totalCost)}
              </strong>
            </div>
          </div>

          <Link
            to="/expenses"
            className="card-link"
          >
            Manage expenses
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default VehicleDetails;