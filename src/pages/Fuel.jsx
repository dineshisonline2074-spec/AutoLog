import { useEffect, useMemo, useState } from 'react';
import {
  Car,
  Edit3,
  Fuel as FuelIcon,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

import { getCurrentUser } from '../services/authService';
import { getVehicles } from '../services/vehicleService';
import {
  createFuelLog,
  deleteFuelLog,
  getFuelLogs,
  updateFuelLog,
} from '../services/fuelService';

const initialForm = {
  vehicle_id: '',
  date: new Date().toISOString().split('T')[0],
  odometer: '',
  liters: '',
  price_per_liter: '',
  total_cost: '',
  fuel_station: '',
  notes: '',
};

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

function Fuel() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);

  const [selectedVehicle, setSelectedVehicle] =
    useState('all');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadFuelPage();
  }, []);

  async function loadFuelPage() {
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

      const [vehicleData, fuelData] = await Promise.all([
        getVehicles(currentUser.id),
        getFuelLogs(currentUser.id),
      ]);

      setVehicles(vehicleData);
      setFuelLogs(fuelData);
    } catch (err) {
      setError(
        err.message || 'Unable to load fuel records.'
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = useMemo(() => {
    if (selectedVehicle === 'all') {
      return fuelLogs;
    }

    return fuelLogs.filter(
      (log) => log.vehicle_id === selectedVehicle
    );
  }, [fuelLogs, selectedVehicle]);

  const totalFuel = useMemo(
    () =>
      filteredLogs.reduce(
        (total, item) =>
          total + Number(item.liters || 0),
        0
      ),
    [filteredLogs]
  );

  const totalCost = useMemo(
    () =>
      filteredLogs.reduce(
        (total, item) =>
          total + Number(item.total_cost || 0),
        0
      ),
    [filteredLogs]
  );

  const averagePrice =
    totalFuel > 0 ? totalCost / totalFuel : 0;

  function getVehicleName(vehicleId) {
    const vehicle = vehicles.find(
      (item) => item.id === vehicleId
    );

    return vehicle?.name || 'Unknown vehicle';
  }

  function openAddModal() {
    const defaultVehicle =
      selectedVehicle !== 'all'
        ? selectedVehicle
        : vehicles[0]?.id || '';

    setEditingLog(null);

    setForm({
      ...initialForm,
      vehicle_id: defaultVehicle,
    });

    setError('');
    setSuccess('');
    setShowModal(true);
  }

  function openEditModal(log) {
    setEditingLog(log);

    setForm({
      vehicle_id: log.vehicle_id || '',
      date: log.date || '',
      odometer: log.odometer || '',
      liters: log.liters || '',
      price_per_liter: log.price_per_liter || '',
      total_cost: log.total_cost || '',
      fuel_station: log.fuel_station || '',
      notes: log.notes || '',
    });

    setError('');
    setSuccess('');
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingLog(null);
    setForm(initialForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleFuelInputChange(event) {
    const { name, value } = event.target;

    setForm((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      };

      if (
        name === 'liters' ||
        name === 'price_per_liter'
      ) {
        const liters = Number(
          name === 'liters'
            ? value
            : previous.liters
        );

        const price = Number(
          name === 'price_per_liter'
            ? value
            : previous.price_per_liter
        );

        if (liters > 0 && price > 0) {
          updated.total_cost = (
            liters * price
          ).toFixed(2);
        }
      }

      return updated;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user) {
      setError('Please sign in again.');
      return;
    }

    if (!form.vehicle_id) {
      setError('Please select a vehicle.');
      return;
    }

    if (!form.date) {
      setError('Please select a fuel date.');
      return;
    }

    if (!form.odometer) {
      setError('Please enter the odometer reading.');
      return;
    }

    if (!form.liters || Number(form.liters) <= 0) {
      setError('Please enter a valid fuel quantity.');
      return;
    }

    if (
      !form.price_per_liter ||
      Number(form.price_per_liter) <= 0
    ) {
      setError('Please enter a valid price per liter.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const fuelData = {
        vehicle_id: form.vehicle_id,
        date: form.date,
        odometer: Number(form.odometer),
        liters: Number(form.liters),
        price_per_liter: Number(form.price_per_liter),
        total_cost: Number(form.total_cost),
        fuel_station:
          form.fuel_station.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editingLog) {
        const updatedLog = await updateFuelLog(
          editingLog.id,
          fuelData,
          user.id
        );

        setFuelLogs((previous) =>
          previous.map((log) =>
            log.id === updatedLog.id
              ? updatedLog
              : log
          )
        );

        setSuccess(
          'Fuel record updated successfully.'
        );
      } else {
        const newLog = await createFuelLog(
          fuelData,
          user.id
        );

        setFuelLogs((previous) => [
          newLog,
          ...previous,
        ]);

        setSuccess(
          'Fuel record added successfully.'
        );
      }

      setTimeout(() => {
        setShowModal(false);
        setEditingLog(null);
        setForm(initialForm);
        setSuccess('');
      }, 700);
    } catch (err) {
      setError(
        err.message || 'Unable to save the fuel record.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(log) {
    const confirmed = window.confirm(
      `Delete this fuel record for ${getVehicleName(
        log.vehicle_id
      )}?`
    );

    if (!confirmed || !user) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await deleteFuelLog(log.id, user.id);

      setFuelLogs((previous) =>
        previous.filter((item) => item.id !== log.id)
      );

      setSuccess(
        'Fuel record deleted successfully.'
      );

      setTimeout(() => {
        setSuccess('');
      }, 2500);
    } catch (err) {
      setError(
        err.message || 'Unable to delete the fuel record.'
      );
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading fuel records...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="page-header dashboard-header">
        <div>
          <p className="eyebrow">FUEL TRACKER</p>

          <h1>Fuel records</h1>

          <p>
            Track every refill, fuel cost and fuel station
            in one place.
          </p>
        </div>

        <button
          type="button"
          className="header-action-button"
          onClick={openAddModal}
          disabled={vehicles.length === 0}
        >
          <Plus size={18} />
          Add fuel record
        </button>
      </section>

      {error && (
        <div className="dashboard-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="dashboard-success" role="status">
          {success}
        </div>
      )}

      {vehicles.length === 0 ? (
        <section className="dashboard-card fuel-empty-page">
          <div className="empty-state">
            <div className="large-empty-icon">
              <Car size={42} />
            </div>

            <h2>Add a vehicle first</h2>

            <p>
              You need at least one vehicle before adding
              fuel records.
            </p>

            <a
              href="/vehicles"
              className="small-primary-button"
            >
              <Plus size={17} />
              Add vehicle
            </a>
          </div>
        </section>
      ) : (
        <>
          <section className="fuel-toolbar">
            <div className="fuel-filter">
              <label htmlFor="vehicle-filter">
                Vehicle
              </label>

              <select
                id="vehicle-filter"
                value={selectedVehicle}
                onChange={(event) =>
                  setSelectedVehicle(event.target.value)
                }
              >
                <option value="all">
                  All vehicles
                </option>

                {vehicles.map((vehicle) => (
                  <option
                    value={vehicle.id}
                    key={vehicle.id}
                  >
                    {vehicle.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="fuel-stat-grid">
            <article className="fuel-stat-card">
              <div className="fuel-stat-icon blue">
                <FuelIcon size={21} />
              </div>

              <div>
                <span>Total fuel</span>
                <strong>
                  {totalFuel.toFixed(1)} L
                </strong>
              </div>
            </article>

            <article className="fuel-stat-card">
              <div className="fuel-stat-icon green">
                <IndianRupeeIcon />
              </div>

              <div>
                <span>Total cost</span>
                <strong>
                  {formatCurrency(totalCost)}
                </strong>
              </div>
            </article>

            <article className="fuel-stat-card">
              <div className="fuel-stat-icon orange">
                <IndianRupeeIcon />
              </div>

              <div>
                <span>Average price</span>
                <strong>
                  {formatCurrency(averagePrice)}
                  /L
                </strong>
              </div>
            </article>

            <article className="fuel-stat-card">
              <div className="fuel-stat-icon purple">
                <Car size={21} />
              </div>

              <div>
                <span>Records</span>
                <strong>{filteredLogs.length}</strong>
              </div>
            </article>
          </section>

          <section className="dashboard-card fuel-records-card">
            <div className="card-header">
              <div>
                <h2>Fuel history</h2>
                <p>
                  Your latest fuel transactions.
                </p>
              </div>

              <FuelIcon size={20} />
            </div>

            {filteredLogs.length === 0 ? (
              <div className="empty-state compact">
                <FuelIcon size={32} />

                <h3>No fuel records</h3>

                <p>
                  Add your first fuel record to start
                  tracking fuel usage.
                </p>

                <button
                  type="button"
                  className="small-primary-button"
                  onClick={openAddModal}
                >
                  <Plus size={16} />
                  Add fuel record
                </button>
              </div>
            ) : (
              <div className="fuel-table-wrapper">
                <table className="fuel-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Vehicle</th>
                      <th>Odometer</th>
                      <th>Fuel</th>
                      <th>Price/L</th>
                      <th>Total</th>
                      <th>Station</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          {formatDate(log.date)}
                        </td>

                        <td>
                          <strong>
                            {getVehicleName(
                              log.vehicle_id
                            )}
                          </strong>
                        </td>

                        <td>
                          {Number(
                            log.odometer || 0
                          ).toLocaleString('en-IN')}{' '}
                          km
                        </td>

                        <td>
                          {Number(
                            log.liters || 0
                          ).toFixed(2)}{' '}
                          L
                        </td>

                        <td>
                          {formatCurrency(
                            log.price_per_liter
                          )}
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              log.total_cost
                            )}
                          </strong>
                        </td>

                        <td>
                          {log.fuel_station ||
                            'Not added'}
                        </td>

                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="icon-action-button"
                              title="Edit fuel record"
                              aria-label="Edit fuel record"
                              onClick={() =>
                                openEditModal(log)
                              }
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-action-button danger"
                              title="Delete fuel record"
                              aria-label="Delete fuel record"
                              onClick={() =>
                                handleDelete(log)
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {showModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            className="fuel-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fuel-modal-title"
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">
                  {editingLog
                    ? 'EDIT FUEL RECORD'
                    : 'NEW FUEL RECORD'}
                </p>

                <h2 id="fuel-modal-title">
                  {editingLog
                    ? 'Edit fuel record'
                    : 'Add fuel record'}
                </h2>

                <p>
                  Enter the details of your fuel refill.
                </p>
              </div>

              <button
                type="button"
                className="modal-close-button"
                aria-label="Close"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="vehicle-form"
              onSubmit={handleSubmit}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="fuel-vehicle">
                    Vehicle *
                  </label>

                  <select
                    id="fuel-vehicle"
                    name="vehicle_id"
                    value={form.vehicle_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select vehicle
                    </option>

                    {vehicles.map((vehicle) => (
                      <option
                        value={vehicle.id}
                        key={vehicle.id}
                      >
                        {vehicle.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="fuel-date">
                    Date *
                  </label>

                  <input
                    id="fuel-date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fuel-odometer">
                    Odometer (km) *
                  </label>

                  <input
                    id="fuel-odometer"
                    name="odometer"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 25000"
                    value={form.odometer}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fuel-liters">
                    Fuel quantity (L) *
                  </label>

                  <input
                    id="fuel-liters"
                    name="liters"
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="e.g. 12.5"
                    value={form.liters}
                    onChange={handleFuelInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fuel-price">
                    Price per liter *
                  </label>

                  <input
                    id="fuel-price"
                    name="price_per_liter"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 104.50"
                    value={form.price_per_liter}
                    onChange={handleFuelInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fuel-total">
                    Total cost *
                  </label>

                  <input
                    id="fuel-total"
                    name="total_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Automatically calculated"
                    value={form.total_cost}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fuel-station">
                    Fuel station
                  </label>

                  <input
                    id="fuel-station"
                    name="fuel_station"
                    type="text"
                    placeholder="e.g. HP Petrol Pump"
                    value={form.fuel_station}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fuel-notes">
                    Notes
                  </label>

                  <input
                    id="fuel-notes"
                    name="notes"
                    type="text"
                    placeholder="Optional notes"
                    value={form.notes}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingLog
                      ? 'Save changes'
                      : 'Add fuel record'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function IndianRupeeIcon() {
  return <span className="rupee-symbol">₹</span>;
}

export default Fuel;