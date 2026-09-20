import { useEffect, useMemo, useState } from 'react';
import {
  Car,
  Edit3,
  IndianRupee,
  Plus,
  Receipt,
  Trash2,
  X,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { getCurrentUser } from '../services/authService';
import { getVehicles } from '../services/vehicleService';
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from '../services/expenseService';

const initialForm = {
  vehicle_id: '',
  category: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  description: '',
};

const expenseCategories = [
  'Fuel',
  'Maintenance',
  'Insurance',
  'Parking',
  'Toll',
  'Accessories',
  'Cleaning',
  'Repair',
  'Registration',
  'Fine',
  'Other',
];

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

function Expenses() {
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [selectedVehicle, setSelectedVehicle] =
    useState('all');

  const [selectedCategory, setSelectedCategory] =
    useState('all');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] =
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
    loadExpensesPage();
  }, []);

  async function loadExpensesPage() {
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

      const [vehicleData, expenseData] =
        await Promise.all([
          getVehicles(currentUser.id),
          getExpenses(currentUser.id),
        ]);

      setVehicles(vehicleData);
      setExpenses(expenseData);
    } catch (err) {
      console.error(
        'Expenses page loading failed:',
        err
      );

      setError(
        err.message || 'Unable to load expenses.'
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const vehicleMatches =
        selectedVehicle === 'all' ||
        expense.vehicle_id === selectedVehicle;

      const categoryMatches =
        selectedCategory === 'all' ||
        expense.category === selectedCategory;

      return vehicleMatches && categoryMatches;
    });
  }, [
    expenses,
    selectedVehicle,
    selectedCategory,
  ]);

  const totalAmount = useMemo(
    () =>
      filteredExpenses.reduce(
        (total, expense) =>
          total + Number(expense.amount || 0),
        0
      ),
    [filteredExpenses]
  );

  const averageExpense = useMemo(() => {
    if (!filteredExpenses.length) return 0;

    return totalAmount / filteredExpenses.length;
  }, [filteredExpenses, totalAmount]);

  const categoryBreakdown = useMemo(() => {
    const breakdown = {};

    filteredExpenses.forEach((expense) => {
      const category = expense.category || 'Other';

      breakdown[category] =
        (breakdown[category] || 0) +
        Number(expense.amount || 0);
    });

    return Object.entries(breakdown).sort(
      (a, b) => b[1] - a[1]
    );
  }, [filteredExpenses]);

  const topCategories = useMemo(
    () => categoryBreakdown.slice(0, 5),
    [categoryBreakdown]
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

    setEditingExpense(null);

    setForm({
      ...initialForm,
      vehicle_id: defaultVehicle,
    });

    setError('');
    setSuccess('');
    setShowModal(true);
  }

  function openEditModal(expense) {
    setEditingExpense(expense);

    setForm({
      vehicle_id: expense.vehicle_id || '',
      category: expense.category || '',
      amount: expense.amount ?? '',
      date: expense.date || '',
      description: expense.description || '',
    });

    setError('');
    setSuccess('');
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingExpense(null);
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

    if (!form.category) {
      setError(
        'Please select an expense category.'
      );
      return;
    }

    if (
      form.amount === '' ||
      Number(form.amount) <= 0
    ) {
      setError(
        'Please enter a valid expense amount.'
      );
      return;
    }

    if (!form.date) {
      setError('Please select the expense date.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const expenseData = {
        vehicle_id: form.vehicle_id,
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        description:
          form.description.trim() || null,
      };

      if (editingExpense) {
        const updatedExpense =
          await updateExpense(
            editingExpense.id,
            expenseData,
            user.id
          );

        setExpenses((previous) =>
          previous.map((expense) =>
            expense.id === updatedExpense.id
              ? updatedExpense
              : expense
          )
        );

        setSuccess(
          'Expense updated successfully.'
        );
      } else {
        const newExpense =
          await createExpense(
            expenseData,
            user.id
          );

        setExpenses((previous) => [
          newExpense,
          ...previous,
        ]);

        setSuccess(
          'Expense added successfully.'
        );
      }

      window.setTimeout(() => {
        setShowModal(false);
        setEditingExpense(null);
        setForm({
          ...initialForm,
        });
        setSuccess('');
      }, 700);
    } catch (err) {
      console.error(
        'Expense save failed:',
        err
      );

      setError(
        err.message ||
          'Unable to save the expense.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense) {
    const confirmed = window.confirm(
      `Delete this ${expense.category} expense of ${formatCurrency(
        expense.amount
      )}?`
    );

    if (!confirmed || !user) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await deleteExpense(
        expense.id,
        user.id
      );

      setExpenses((previous) =>
        previous.filter(
          (item) => item.id !== expense.id
        )
      );

      setSuccess(
        'Expense deleted successfully.'
      );

      window.setTimeout(() => {
        setSuccess('');
      }, 2500);
    } catch (err) {
      console.error(
        'Expense deletion failed:',
        err
      );

      setError(
        err.message ||
          'Unable to delete the expense.'
      );
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page expenses-page">
      <section className="page-header dashboard-header">
        <div>
          <p className="eyebrow">EXPENSES</p>

          <h1>Vehicle expenses</h1>

          <p>
            Track every expense related to your vehicles
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
          Add expense
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
        <section className="dashboard-card expenses-empty-page">
          <div className="empty-state">
            <div className="large-empty-icon">
              <Car size={42} />
            </div>

            <h2>Add a vehicle first</h2>

            <p>
              You need at least one vehicle before adding
              expenses.
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
          <section className="expenses-toolbar">
            <div className="expense-filter">
              <label htmlFor="expense-vehicle-filter">
                Vehicle
              </label>

              <select
                id="expense-vehicle-filter"
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

            <div className="expense-filter">
              <label htmlFor="expense-category-filter">
                Category
              </label>

              <select
                id="expense-category-filter"
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All categories
                </option>

                {expenseCategories.map(
                  (category) => (
                    <option
                      value={category}
                      key={category}
                    >
                      {category}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="expense-filter-summary">
              {selectedVehicle === 'all'
                ? 'All vehicles'
                : getVehicleName(selectedVehicle)}
              {' · '}
              {filteredExpenses.length}{' '}
              {filteredExpenses.length === 1
                ? 'record'
                : 'records'}
            </div>
          </section>

          <section className="expense-stat-grid">
            <article className="expense-stat-card">
              <div className="expense-stat-icon blue">
                <IndianRupee size={21} />
              </div>

              <div>
                <span>Total expenses</span>

                <strong>
                  {formatCurrency(totalAmount)}
                </strong>
              </div>
            </article>

            <article className="expense-stat-card">
              <div className="expense-stat-icon purple">
                <Receipt size={21} />
              </div>

              <div>
                <span>Total records</span>

                <strong>
                  {filteredExpenses.length}
                </strong>
              </div>
            </article>

            <article className="expense-stat-card">
              <div className="expense-stat-icon green">
                <IndianRupee size={21} />
              </div>

              <div>
                <span>Average expense</span>

                <strong>
                  {formatCurrency(averageExpense)}
                </strong>
              </div>
            </article>

            <article className="expense-stat-card">
              <div className="expense-stat-icon orange">
                <Receipt size={21} />
              </div>

              <div>
                <span>Top category</span>

                <strong>
                  {topCategories[0]?.[0] ||
                    'No data'}
                </strong>
              </div>
            </article>
          </section>

          <section className="dashboard-card expense-breakdown-card">
            <div className="card-header">
              <div>
                <h2>Expense breakdown</h2>

                <p>
                  Categories with the highest spending.
                </p>
              </div>

              <Receipt size={20} />
            </div>

            {topCategories.length === 0 ? (
              <div className="expense-breakdown-empty">
                <Receipt size={28} />

                <span>
                  No expense data yet.
                </span>
              </div>
            ) : (
              <div className="expense-breakdown-list">
                {topCategories.map(
                  ([category, amount]) => {
                    const percentage =
                      totalAmount > 0
                        ? (amount / totalAmount) *
                          100
                        : 0;

                    return (
                      <div
                        className="expense-breakdown-item"
                        key={category}
                      >
                        <div className="expense-breakdown-top">
                          <span>
                            {category}
                          </span>

                          <strong>
                            {formatCurrency(amount)}
                          </strong>
                        </div>

                        <div className="expense-progress">
                          <div
                            className="expense-progress-fill"
                            style={{
                              width: `${Math.min(
                                percentage,
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        <span className="expense-percentage">
                          {percentage.toFixed(1)}% of
                          total
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>

          <section className="dashboard-card expense-records-card">
            <div className="card-header">
              <div>
                <h2>Expense history</h2>

                <p>
                  Your latest vehicle expenses.
                </p>
              </div>

              <Receipt size={20} />
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="empty-state compact">
                <Receipt size={32} />

                <h3>No expenses found</h3>

                <p>
                  Add your first expense to start tracking
                  your spending.
                </p>

                <button
                  type="button"
                  className="small-primary-button"
                  onClick={openAddModal}
                >
                  <Plus size={16} />
                  Add expense
                </button>
              </div>
            ) : (
              <div className="expense-table-wrapper">
                <table className="expense-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Vehicle</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredExpenses.map(
                      (expense) => (
                        <tr key={expense.id}>
                          <td>
                            {formatDate(
                              expense.date
                            )}
                          </td>

                          <td>
                            <strong>
                              {getVehicleName(
                                expense.vehicle_id
                              )}
                            </strong>
                          </td>

                          <td>
                            <span className="expense-category-badge">
                              {expense.category}
                            </span>
                          </td>

                          <td>
                            <strong className="expense-amount">
                              {formatCurrency(
                                expense.amount
                              )}
                            </strong>
                          </td>

                          <td>
                            <span className="expense-description">
                              {expense.description ||
                                'No description'}
                            </span>
                          </td>

                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="icon-action-button"
                                title="Edit expense"
                                aria-label="Edit expense"
                                onClick={() =>
                                  openEditModal(
                                    expense
                                  )
                                }
                              >
                                <Edit3 size={16} />
                              </button>

                              <button
                                type="button"
                                className="icon-action-button danger"
                                title="Delete expense"
                                aria-label="Delete expense"
                                onClick={() =>
                                  handleDelete(
                                    expense
                                  )
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
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
            className="expense-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-modal-title"
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">
                  {editingExpense
                    ? 'EDIT EXPENSE'
                    : 'NEW EXPENSE'}
                </p>

                <h2 id="expense-modal-title">
                  {editingExpense
                    ? 'Edit expense'
                    : 'Add expense'}
                </h2>

                <p>
                  Record an expense for one of your
                  vehicles.
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
                  <label htmlFor="expense-vehicle">
                    Vehicle *
                  </label>

                  <select
                    id="expense-vehicle"
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
                  <label htmlFor="expense-category">
                    Category *
                  </label>

                  <select
                    id="expense-category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select category
                    </option>

                    {expenseCategories.map(
                      (category) => (
                        <option
                          value={category}
                          key={category}
                        >
                          {category}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="expense-amount">
                    Amount *
                  </label>

                  <div className="currency-input">
                    <span>₹</span>

                    <input
                      id="expense-amount"
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="e.g. 1500"
                      value={form.amount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="expense-date">
                    Date *
                  </label>

                  <input
                    id="expense-date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="expense-description">
                    Description
                  </label>

                  <textarea
                    id="expense-description"
                    name="description"
                    rows="4"
                    placeholder="e.g. Paid for monthly parking..."
                    value={form.description}
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
                    : editingExpense
                    ? 'Save changes'
                    : 'Add expense'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Expenses;