import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Car,
  Edit3,
  Fuel,
  Gauge,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { getCurrentUser } from '../services/authService';
import {
  createVehicle,
  deleteVehicle,
  getVehicles,
  updateVehicle,
} from '../services/vehicleService';

const initialForm = {
  name: '',
  brand: '',
  model: '',
  year: '',
  registration_number: '',
  fuel_type: 'Petrol',
  current_odometer: '',
  purchase_date: '',
};

function Vehicles() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
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

      const data = await getVehicles(currentUser.id);
      setVehicles(data);
    } catch (err) {
      console.error('Vehicle loading failed:', err);
      setError(
        err.message || 'Unable to load your vehicles.'
      );
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingVehicle(null);
    setForm({ ...initialForm });
    setError('');
    setSuccess('');
    setShowModal(true);
  }

  function openEditModal(vehicle) {
    setEditingVehicle(vehicle);

    setForm({
      name: vehicle.name || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      registration_number:
        vehicle.registration_number || '',
      fuel_type: vehicle.fuel_type || 'Petrol',
      current_odometer:
        vehicle.current_odometer ?? '',
      purchase_date: vehicle.purchase_date || '',
    });

    setError('');
    setSuccess('');
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingVehicle(null);
    setForm({ ...initialForm });
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

    if (!form.name.trim()) {
      setError('Please enter a vehicle name.');
      return;
    }

    if (
      form.current_odometer === '' ||
      Number(form.current_odometer) < 0
    ) {
      setError(
        'Please enter a valid current odometer reading.'
      );
      return;
    }

    if (
      form.year &&
      (Number(form.year) < 1900 ||
        Number(form.year) > new Date().getFullYear() + 1)
    ) {
      setError('Please enter a valid manufacturing year.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const vehicleData = {
        name: form.name.trim(),
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
        year: form.year ? Number(form.year) : null,
        registration_number:
          form.registration_number.trim() || null,
        fuel_type: form.fuel_type,
        current_odometer: Number(form.current_odometer),
        purchase_date: form.purchase_date || null,
      };

      if (editingVehicle) {
        const updatedVehicle = await updateVehicle(
          editingVehicle.id,
          vehicleData,
          user.id
        );

        setVehicles((previous) =>
          previous.map((vehicle) =>
            vehicle.id === updatedVehicle.id
              ? updatedVehicle
              : vehicle
          )
        );

        setSuccess('Vehicle updated successfully.');
      } else {
        const newVehicle = await createVehicle(
          vehicleData,
          user.id
        );

        setVehicles((previous) => [
          newVehicle,
          ...previous,
        ]);

        setSuccess('Vehicle added successfully.');
      }

      window.setTimeout(() => {
        setShowModal(false);
        setEditingVehicle(null);
        setForm({ ...initialForm });
        setSuccess('');
      }, 700);
    } catch (err) {
      console.error('Vehicle save failed:', err);
      setError(
        err.message || 'Unable to save the vehicle.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(vehicle) {
    const confirmed = window.confirm(
      `Delete "${vehicle.name}"? This will also delete its related fuel, maintenance and expense records.`
    );

    if (!confirmed || !user) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await deleteVehicle(vehicle.id, user.id);

      setVehicles((previous) =>
        previous.filter(
          (item) => item.id !== vehicle.id
        )
      );

      setSuccess(
        `${vehicle.name} was deleted successfully.`
      );

      window.setTimeout(() => {
        setSuccess('');
      }, 2500);
    } catch (err) {
      console.error('Vehicle deletion failed:', err);
      setError(
        err.message || 'Unable to delete the vehicle.'
      );
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading your vehicles...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page vehicles-page">
      <section className="page-header dashboard-header">
        <div>
          <p className="eyebrow">MY VEHICLES</p>

          <h1>Your vehicles</h1>

          <p>
            Manage your vehicles and keep all their important
            information in one place.
          </p>
        </div>

        <button
          type="button"
          className="header-action-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add vehicle
        </button>
      </section>

      {error && (
        <div className="dashboard-error" role="alert">
          <span>{error}</span>
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
        <section className="dashboard-card vehicles-empty-page">
          <div className="empty-state">
            <div className="large-empty-icon">
              <Car size={42} />
            </div>

            <h2>No vehicles yet</h2>

            <p>
              Add your first vehicle to start tracking fuel,
              maintenance and expenses.
            </p>

            <button
              type="button"
              className="small-primary-button"
              onClick={openAddModal}
            >
              <Plus size={17} />
              Add your first vehicle
            </button>
          </div>
        </section>
      ) : (
        <section className="vehicles-grid">
          {vehicles.map((vehicle) => (
            <article
              className="vehicle-card"
              key={vehicle.id}
            >
              <div className="vehicle-card-top">
                <div className="vehicle-card-icon">
                  <Car size={25} />
                </div>

                <div className="vehicle-card-actions">
                  <button
                    type="button"
                    className="icon-action-button"
                    aria-label={`Edit ${vehicle.name}`}
                    title="Edit vehicle"
                    onClick={() =>
                      openEditModal(vehicle)
                    }
                  >
                    <Edit3 size={17} />
                  </button>

                  <button
                    type="button"
                    className="icon-action-button danger"
                    aria-label={`Delete ${vehicle.name}`}
                    title="Delete vehicle"
                    onClick={() =>
                      handleDelete(vehicle)
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              <div className="vehicle-card-content">
                <h2>{vehicle.name}</h2>

                <p className="vehicle-card-model">
                  {vehicle.brand || 'Vehicle'}{' '}
                  {vehicle.model || ''}
                </p>

                <div className="vehicle-details-list">
                  <div>
                    <span>Registration</span>

                    <strong>
                      {vehicle.registration_number ||
                        'Not added'}
                    </strong>
                  </div>

                  <div>
                    <span>Fuel type</span>

                    <strong>
                      {vehicle.fuel_type || 'Not set'}
                    </strong>
                  </div>

                  <div>
                    <span>Odometer</span>

                    <strong>
                      {Number(
                        vehicle.current_odometer || 0
                      ).toLocaleString('en-IN')}{' '}
                      km
                    </strong>
                  </div>

                  <div>
                    <span>Year</span>

                    <strong>
                      {vehicle.year || 'Not added'}
                    </strong>
                  </div>
                </div>

                <div className="vehicle-card-highlight">
                  <div>
                    <Gauge size={15} />
                    <span>Current reading</span>
                  </div>

                  <strong>
                    {Number(
                      vehicle.current_odometer || 0
                    ).toLocaleString('en-IN')}{' '}
                    km
                  </strong>
                </div>
              </div>

              <Link
                to={`/vehicles/${vehicle.id}`}
                className="vehicle-card-link"
              >
                View vehicle details
                <ArrowRight size={17} />
              </Link>
            </article>
          ))}
        </section>
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
            className="vehicle-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-modal-title"
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">
                  {editingVehicle
                    ? 'EDIT VEHICLE'
                    : 'NEW VEHICLE'}
                </p>

                <h2 id="vehicle-modal-title">
                  {editingVehicle
                    ? 'Edit vehicle'
                    : 'Add vehicle'}
                </h2>

                <p>
                  Keep your vehicle information accurate and
                  up to date.
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
                  <label htmlFor="name">
                    Vehicle name *
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g. My Swift"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="registration_number">
                    Registration number
                  </label>

                  <input
                    id="registration_number"
                    name="registration_number"
                    type="text"
                    placeholder="e.g. MH12AB1234"
                    value={form.registration_number}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="brand">Brand</label>

                  <input
                    id="brand"
                    name="brand"
                    type="text"
                    placeholder="e.g. Maruti"
                    value={form.brand}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="model">Model</label>

                  <input
                    id="model"
                    name="model"
                    type="text"
                    placeholder="e.g. Swift"
                    value={form.model}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="year">
                    Manufacturing year
                  </label>

                  <input
                    id="year"
                    name="year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    placeholder="e.g. 2024"
                    value={form.year}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fuel_type">
                    Fuel type
                  </label>

                  <select
                    id="fuel_type"
                    name="fuel_type"
                    value={form.fuel_type}
                    onChange={handleChange}
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">
                      Electric
                    </option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="current_odometer">
                    Current odometer (km) *
                  </label>

                  <input
                    id="current_odometer"
                    name="current_odometer"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 24500"
                    value={form.current_odometer}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="purchase_date">
                    Purchase date
                  </label>

                  <input
                    id="purchase_date"
                    name="purchase_date"
                    type="date"
                    value={form.purchase_date}
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
                    : editingVehicle
                    ? 'Save changes'
                    : 'Add vehicle'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Vehicles;