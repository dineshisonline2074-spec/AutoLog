import { useEffect, useMemo, useState } from 'react';
import {
  Car,
  Edit3,
  IndianRupee,
  Plus,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { getCurrentUser } from '../services/authService';
import { getVehicles } from '../services/vehicleService';
import {
  createMaintenanceRecord,
  deleteMaintenanceRecord,
  getMaintenanceRecords,
  updateMaintenanceRecord,
} from '../services/maintenanceService';

const initialForm = {
  vehicle_id: '',
  service_type: '',
  date: new Date().toISOString().split('T')[0],
  odometer: '',
  cost: '',
  service_center: '',
  next_service_date: '',
  next_service_odometer: '',
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

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getDateValue(date) {
  if (!date) return null;

  return new Date(`${date}T00:00:00`);
}

function Maintenance() {
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [records, setRecords] = useState([]);

  const [selectedVehicle, setSelectedVehicle] =
    useState('all');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState(null);

  const [form, setForm] = useState({
    ...initialForm,
  });

  useEffect(() => {
    const vehicleFromUrl = searchParams.get('vehicle');

    if (vehicleFromUrl) {
      setSelectedVehicle(vehicleFromUrl);
    } else {
      setSelectedVehicle('all');
    }
  }, [searchParams]);

  useEffect(() => {
    loadMaintenancePage();
  }, []);

  async function loadMaintenancePage() {
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

      const [vehicleData, maintenanceData] =
        await Promise.all([
          getVehicles(currentUser.id),
          getMaintenanceRecords(currentUser.id),
        ]);

      setVehicles(vehicleData);
      setRecords(maintenanceData);
    } catch (err) {
      console.error(
        'Maintenance page loading failed:',
        err
      );

      setError(
        err.message ||
          'Unable to load maintenance records.'
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredRecords = useMemo(() => {
    if (selectedVehicle === 'all') {
      return records;
    }

    return records.filter(
      (record) =>
        record.vehicle_id === selectedVehicle
    );
  }, [records, selectedVehicle]);

  const totalCost = useMemo(
    () =>
      filteredRecords.reduce(
        (total, record) =>
          total + Number(record.cost || 0),
        0
      ),
    [filteredRecords]
  );

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const upcomingRecords = useMemo(() => {
    return filteredRecords
      .filter((record) => {
        if (!record.next_service_date) {
          return false;
        }

        const nextDate = getDateValue(
          record.next_service_date
        );

        return nextDate && nextDate >= today;
      })
      .sort(
        (a, b) =>
          getDateValue(a.next_service_date) -
          getDateValue(b.next_service_date)
      );
  }, [filteredRecords, today]);

  const overdueRecords = useMemo(() => {
    return filteredRecords
      .filter((record) => {
        if (!record.next_service_date) {
          return false;
        }

        const nextDate = getDateValue(
          record.next_service_date
        );

        return nextDate && nextDate < today;
      })
      .sort(
        (a, b) =>
          getDateValue(b.next_service_date) -
          getDateValue(a.next_service_date)
      );
  }, [filteredRecords, today]);

  const scheduledRecords = useMemo(
    () =>
      filteredRecords.filter(
        (record) =>
          record.next_service_date ||
          record.next_service_odometer
      ),
    [filteredRecords]
  );

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

    setEditingRecord(null);

    setForm({
      ...initialForm,
      vehicle_id: defaultVehicle,
    });

    setError('');
    setSuccess('');
    setShowModal(true);
  }

  function openEditModal(record) {
    setEditingRecord(record);

    setForm({
      vehicle_id: record.vehicle_id || '',
      service_type: record.service_type || '',
      date: record.date || '',
      odometer: record.odometer ?? '',
      cost: record.cost ?? '',
      service_center:
        record.service_center || '',
      next_service_date:
        record.next_service_date || '',
      next_service_odometer:
        record.next_service_odometer ?? '',
      notes: record.notes || '',
    });

    setError('');
    setSuccess('');
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingRecord(null);
    setForm({
      ...initialForm,
    });
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
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

    if (!form.service_type.trim()) {
      setError('Please enter the service type.');
      return;
    }

    if (!form.date) {
      setError('Please select the service date.');
      return;
    }

    if (
      form.odometer === '' ||
      Number(form.odometer) < 0
    ) {
      setError(
        'Please enter a valid odometer reading.'
      );
      return;
    }

    if (
      form.cost !== '' &&
      Number(form.cost) < 0
    ) {
      setError('Please enter a valid service cost.');
      return;
    }

    if (
      form.next_service_odometer !== '' &&
      Number(form.next_service_odometer) < 0
    ) {
      setError(
        'Please enter a valid next service odometer.'
      );
      return;
    }

    if (
      form.next_service_date &&
      form.next_service_date < form.date
    ) {
      setError(
        'Next service date cannot be earlier than the service date.'
      );
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const maintenanceData = {
        vehicle_id: form.vehicle_id,
        service_type: form.service_type.trim(),
        date: form.date,
        odometer: Number(form.odometer),
        cost: Number(form.cost || 0),
        service_center:
          form.service_center.trim() || null,
        next_service_date:
          form.next_service_date || null,
        next_service_odometer:
          form.next_service_odometer !== ''
            ? Number(form.next_service_odometer)
            : null,
        notes: form.notes.trim() || null,
      };

      if (editingRecord) {
        const updatedRecord =
          await updateMaintenanceRecord(
            editingRecord.id,
            maintenanceData,
            user.id
          );

        setRecords((previous) =>
          previous.map((record) =>
            record.id === updatedRecord.id
              ? updatedRecord
              : record
          )
        );

        setSuccess(
          'Maintenance record updated successfully.'
        );
      } else {
        const newRecord =
          await createMaintenanceRecord(
            maintenanceData,
            user.id
          );

        setRecords((previous) => [
          newRecord,
          ...previous,
        ]);

        setSuccess(
          'Maintenance record added successfully.'
        );
      }

      window.setTimeout(() => {
        setShowModal(false);
        setEditingRecord(null);
        setForm({
          ...initialForm,
        });
        setSuccess('');
      }, 700);
    } catch (err) {
      console.error(
        'Maintenance record save failed:',
        err
      );

      setError(
        err.message ||
          'Unable to save the maintenance record.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    const confirmed = window.confirm(
      `Delete "${record.service_type}" for ${getVehicleName(
        record.vehicle_id
      )}?`
    );

    if (!confirmed || !user) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await deleteMaintenanceRecord(
        record.id,
        user.id
      );

      setRecords((previous) =>
        previous.filter(
          (item) => item.id !== record.id
        )
      );

      setSuccess(
        'Maintenance record deleted successfully.'
      );

      window.setTimeout(() => {
        setSuccess('');
      }, 2500);
    } catch (err) {
      console.error(
        'Maintenance record deletion failed:',
        err
      );

      setError(
        err.message ||
          'Unable to delete the maintenance record.'
      );
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading maintenance records...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page maintenance-page">
      <section className="page-header dashboard-header">
        <div>
          <p className="eyebrow">MAINTENANCE</p>

          <h1>Maintenance records</h1>

          <p>
            Keep track of servicing, repairs and upcoming
            maintenance.
          </p>
        </div>

        <button
          type="button"
          className="header-action-button"
          onClick={openAddModal}
          disabled={vehicles.length === 0}
        >
          <Plus size={18} />
          Add service
        </button>
      </section>

      {error && (
        <div
          className="dashboard-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="dashboard-success"
          role="status"
        >
          {success}
        </div>
      )}

      {vehicles.length === 0 ? (
        <section className="dashboard-card maintenance-empty-page">
          <div className="empty-state">
            <div className="large-empty-icon">
              <Car size={42} />
            </div>

            <h2>Add a vehicle first</h2>

            <p>
              You need at least one vehicle before adding
              maintenance records.
            </p>

            <Link
              to="/vehicles"
              className="small-primary-button"
            >
              <Plus size={17} />
              Add vehicle
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="maintenance-toolbar">
            <div className="maintenance-filter">
              <label htmlFor="maintenance-vehicle-filter">
                Vehicle
              </label>

              <select
                id="maintenance-vehicle-filter"
                value={selectedVehicle}
                onChange={(event) =>
                  setSelectedVehicle(
                    event.target.value
                  )
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

            <div className="maintenance-filter-summary">
              {selectedVehicle === 'all'
                ? 'Showing all vehicles'
                : `Showing ${getVehicleName(
                    selectedVehicle
                  )}`}
            </div>
          </section>

          <section className="maintenance-stat-grid">
            <article className="maintenance-stat-card">
              <div className="maintenance-stat-icon blue">
                <Wrench size={21} />
              </div>

              <div>
                <span>Total services</span>
                <strong>
                  {filteredRecords.length}
                </strong>
              </div>
            </article>

            <article className="maintenance-stat-card">
              <div className="maintenance-stat-icon green">
                <IndianRupee size={21} />
              </div>

              <div>
                <span>Total cost</span>
                <strong>
                  {formatCurrency(totalCost)}
                </strong>
              </div>
            </article>

            <article className="maintenance-stat-card">
              <div className="maintenance-stat-icon orange">
                <Wrench size={21} />
              </div>

              <div>
                <span>Upcoming</span>
                <strong>
                  {upcomingRecords.length}
                </strong>
              </div>
            </article>

            <article className="maintenance-stat-card">
              <div className="maintenance-stat-icon red">
                <Wrench size={21} />
              </div>

              <div>
                <span>Overdue</span>
                <strong>
                  {overdueRecords.length}
                </strong>
              </div>
            </article>
          </section>

          {overdueRecords.length > 0 && (
            <section className="maintenance-alert-card">
              <div className="maintenance-alert-icon">
                <Wrench size={19} />
              </div>

              <div>
                <strong>
                  {overdueRecords.length === 1
                    ? '1 service is overdue'
                    : `${overdueRecords.length} services are overdue`}
                </strong>

                <span>
                  Review your maintenance history and
                  schedule the required service.
                </span>
              </div>
            </section>
          )}

          {upcomingRecords.length > 0 && (
            <section className="dashboard-card upcoming-service-card">
              <div className="card-header">
                <div>
                  <h2>Upcoming service</h2>

                  <p>
                    Your next scheduled maintenance.
                  </p>
                </div>

                <Wrench size={20} />
              </div>

              <div className="upcoming-service-list">
                {upcomingRecords
                  .slice(0, 3)
                  .map((record) => (
                    <div
                      className="upcoming-service-item"
                      key={record.id}
                    >
                      <div className="upcoming-service-icon">
                        <Wrench size={18} />
                      </div>

                      <div className="upcoming-service-main">
                        <strong>
                          {record.service_type}
                        </strong>

                        <span>
                          {getVehicleName(
                            record.vehicle_id
                          )}{' '}
                          ·{' '}
                          {formatDate(
                            record.next_service_date
                          )}
                        </span>
                      </div>

                      {record.next_service_odometer && (
                        <span className="service-odometer">
                          {Number(
                            record.next_service_odometer
                          ).toLocaleString('en-IN')}{' '}
                          km
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          <section className="dashboard-card maintenance-records-card">
            <div className="card-header">
              <div>
                <h2>Service history</h2>

                <p>
                  Your latest maintenance records.
                </p>
              </div>

              <Wrench size={20} />
            </div>

            {filteredRecords.length === 0 ? (
              <div className="empty-state compact">
                <Wrench size={32} />

                <h3>No maintenance records</h3>

                <p>
                  Add your first service record to start
                  tracking maintenance.
                </p>

                <button
                  type="button"
                  className="small-primary-button"
                  onClick={openAddModal}
                >
                  <Plus size={16} />
                  Add service
                </button>
              </div>
            ) : (
              <div className="maintenance-table-wrapper">
                <table className="maintenance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Vehicle</th>
                      <th>Service</th>
                      <th>Odometer</th>
                      <th>Cost</th>
                      <th>Service center</th>
                      <th>Next service</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRecords.map((record) => {
                      const isOverdue =
                        record.next_service_date &&
                        getDateValue(
                          record.next_service_date
                        ) < today;

                      return (
                        <tr key={record.id}>
                          <td>
                            {formatDate(record.date)}
                          </td>

                          <td>
                            <strong>
                              {getVehicleName(
                                record.vehicle_id
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {record.service_type}
                            </strong>
                          </td>

                          <td>
                            {Number(
                              record.odometer || 0
                            ).toLocaleString('en-IN')}{' '}
                            km
                          </td>

                          <td>
                            <strong>
                              {formatCurrency(
                                record.cost
                              )}
                            </strong>
                          </td>

                          <td>
                            {record.service_center ||
                              'Not added'}
                          </td>

                          <td>
                            {record.next_service_date ? (
                              <span
                                className={
                                  isOverdue
                                    ? 'service-status-overdue'
                                    : 'service-status-upcoming'
                                }
                              >
                                {formatDate(
                                  record.next_service_date
                                )}
                              </span>
                            ) : (
                              'Not scheduled'
                            )}
                          </td>

                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="icon-action-button"
                                title="Edit service"
                                aria-label="Edit service"
                                onClick={() =>
                                  openEditModal(record)
                                }
                              >
                                <Edit3 size={16} />
                              </button>

                              <button
                                type="button"
                                className="icon-action-button danger"
                                title="Delete service"
                                aria-label="Delete service"
                                onClick={() =>
                                  handleDelete(record)
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
            if (
              event.target === event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <section
            className="maintenance-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="maintenance-modal-title"
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">
                  {editingRecord
                    ? 'EDIT SERVICE'
                    : 'NEW SERVICE'}
                </p>

                <h2 id="maintenance-modal-title">
                  {editingRecord
                    ? 'Edit maintenance'
                    : 'Add maintenance'}
                </h2>

                <p>
                  Record the service or repair performed
                  on your vehicle.
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
                  <label htmlFor="maintenance-vehicle">
                    Vehicle *
                  </label>

                  <select
                    id="maintenance-vehicle"
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
                  <label htmlFor="service-type">
                    Service type *
                  </label>

                  <input
                    id="service-type"
                    name="service_type"
                    type="text"
                    placeholder="e.g. Engine oil change"
                    value={form.service_type}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="maintenance-date">
                    Service date *
                  </label>

                  <input
                    id="maintenance-date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="maintenance-odometer">
                    Odometer (km) *
                  </label>

                  <input
                    id="maintenance-odometer"
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
                  <label htmlFor="maintenance-cost">
                    Cost
                  </label>

                  <input
                    id="maintenance-cost"
                    name="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 2500"
                    value={form.cost}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="service-center">
                    Service center
                  </label>

                  <input
                    id="service-center"
                    name="service_center"
                    type="text"
                    placeholder="e.g. Maruti Service Center"
                    value={form.service_center}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="next-service-date">
                    Next service date
                  </label>

                  <input
                    id="next-service-date"
                    name="next_service_date"
                    type="date"
                    value={form.next_service_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="next-service-odometer">
                    Next service odometer
                  </label>

                  <input
                    id="next-service-odometer"
                    name="next_service_odometer"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 30000"
                    value={
                      form.next_service_odometer
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="maintenance-notes">
                    Notes
                  </label>

                  <textarea
                    id="maintenance-notes"
                    name="notes"
                    placeholder="Add any service details or notes..."
                    value={form.notes}
                    onChange={handleChange}
                    rows="4"
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
                    : editingRecord
                    ? 'Save changes'
                    : 'Add service'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Maintenance;