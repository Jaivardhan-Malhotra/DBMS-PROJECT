import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { umpiresAPI } from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchFilter from '../components/SearchFilter';
import FormField from '../components/FormField';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';

const initialUmpireForm = {
  umpire_name: '',
  nationality: 'Indian',
  experience_years: 5,
  matches_officiated: 0,
  umpire_type: 'On-Field',
  is_active: 1,
};

const umpireTypeOptions = [
  { label: 'On-Field', value: 'On-Field' },
  { label: 'Third Umpire', value: 'Third Umpire' },
  { label: 'Match Referee', value: 'Match Referee' },
];

const Umpires = () => {
  const [umpires, setUmpires] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUmpire, setSelectedUmpire] = useState(null);

  // Form State
  const [formData, setFormData] = useState(initialUmpireForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchUmpires = useCallback(async () => {
    try {
      setLoading(true);
      const res = await umpiresAPI.getAll();
      setUmpires(res.data.data || res.data || []);
    } catch (error) {
      toast.error('Failed to load match officials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUmpires();
    const handleRefresh = () => fetchUmpires();
    window.addEventListener('ipl-data-refresh', handleRefresh);
    return () => window.removeEventListener('ipl-data-refresh', handleRefresh);
  }, [fetchUmpires]);

  const handleOpenAdd = () => {
    setSelectedUmpire(null);
    setFormData(initialUmpireForm);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (umpire) => {
    setSelectedUmpire(umpire);
    setFormData({
      umpire_name: umpire.umpire_name || '',
      nationality: umpire.nationality || 'Indian',
      experience_years: umpire.experience_years ?? 5,
      matches_officiated: umpire.matches_officiated ?? 0,
      umpire_type: umpire.umpire_type || 'On-Field',
      is_active: umpire.is_active !== undefined ? Number(umpire.is_active) : 1,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenDelete = (umpire) => {
    setSelectedUmpire(umpire);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.umpire_name.trim()) errors.umpire_name = 'Official name is required';
    if (!formData.nationality.trim()) errors.nationality = 'Nationality is required';
    if (formData.experience_years < 0) errors.experience_years = 'Experience cannot be negative';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveUmpire = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        experience_years: Number(formData.experience_years),
        matches_officiated: Number(formData.matches_officiated || 0),
        is_active: Number(formData.is_active),
      };

      if (selectedUmpire) {
        await umpiresAPI.update(selectedUmpire.umpire_id, payload);
        toast.success(`Official "${formData.umpire_name}" updated!`);
      } else {
        await umpiresAPI.create(payload);
        toast.success(`Official "${formData.umpire_name}" added!`);
      }
      setIsFormOpen(false);
      fetchUmpires();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUmpire = async () => {
    if (!selectedUmpire) return;
    setSubmitting(true);
    try {
      await umpiresAPI.delete(selectedUmpire.umpire_id);
      toast.success(`Official "${selectedUmpire.umpire_name}" deleted.`);
      setIsDeleteOpen(false);
      fetchUmpires();
    } catch (error) {
      toast.error(error.message || 'Failed to delete umpire');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUmpires = umpires.filter((u) => {
    const matchesSearch =
      u.umpire_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nationality?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter ? u.umpire_type === typeFilter : true;
    const matchesActive = activeFilter !== '' ? String(u.is_active) === activeFilter : true;

    return matchesSearch && matchesType && matchesActive;
  });

  const totalPages = Math.ceil(filteredUmpires.length / itemsPerPage);
  const paginatedUmpires = filteredUmpires.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: 'umpire_name',
      label: 'Official Name',
      className: 'text-primary',
    },
    {
      key: 'umpire_type',
      label: 'Designation / Role',
      render: (val) => {
        let variant = 'info';
        if (val === 'Third Umpire') variant = 'warning';
        if (val === 'Match Referee') variant = 'purple';
        return <Badge variant={variant} label={val} />;
      },
    },
    {
      key: 'nationality',
      label: 'Nationality',
    },
    {
      key: 'experience_years',
      label: 'Experience',
      render: (val) => `${val || 0} Years`,
    },
    {
      key: 'matches_officiated',
      label: 'Matches Officiated',
      render: (val) => val || 0,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (val) => (
        <Badge
          variant={Number(val) === 1 ? 'success' : 'default'}
          label={Number(val) === 1 ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-icon"
            onClick={() => handleOpenEdit(row)}
            title="Edit Official"
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            className="btn-icon danger"
            onClick={() => handleOpenDelete(row)}
            title="Delete Official"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Match Officials & Umpires</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            International and domestic on-field umpires, TV 3rd umpires, and match referees.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add Official</span>
        </button>
      </div>

      {/* Filter and Search */}
      <SearchFilter
        value={searchTerm}
        onChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        placeholder="Search umpires by name or country..."
        filters={[
          {
            key: 'type',
            label: 'All Roles',
            options: umpireTypeOptions,
            value: typeFilter,
          },
          {
            key: 'active',
            label: 'All Statuses',
            options: [
              { label: 'Active', value: '1' },
              { label: 'Inactive', value: '0' },
            ],
            value: activeFilter,
          },
        ]}
        onFilterChange={(key, val) => {
          if (key === 'type') setTypeFilter(val);
          if (key === 'active') setActiveFilter(val);
          setCurrentPage(1);
        }}
      />

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={paginatedUmpires}
        loading={loading}
        emptyMessage="No match officials found matching your criteria."
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedUmpire ? `Edit Official: ${selectedUmpire.umpire_name}` : 'Register Match Official'}
        size="md"
      >
        <form onSubmit={handleSaveUmpire}>
          <div className="form-row">
            <FormField label="Official Name" error={formErrors.umpire_name} required>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Nitin Menon"
                value={formData.umpire_name}
                onChange={(e) => setFormData({ ...formData, umpire_name: e.target.value })}
              />
            </FormField>
            <FormField label="Nationality" error={formErrors.nationality} required>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Indian"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              />
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Designation / Role" required>
              <select
                className="form-control"
                value={formData.umpire_type}
                onChange={(e) => setFormData({ ...formData, umpire_type: e.target.value })}
              >
                {umpireTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Status">
              <select
                className="form-control"
                value={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value })}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Experience (Years)" error={formErrors.experience_years}>
              <input
                type="number"
                min="0"
                className="form-control"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
              />
            </FormField>
            <FormField label="Total Matches Officiated">
              <input
                type="number"
                min="0"
                className="form-control"
                value={formData.matches_officiated}
                onChange={(e) => setFormData({ ...formData, matches_officiated: e.target.value })}
              />
            </FormField>
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsFormOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : selectedUmpire ? 'Update Official' : 'Add Official'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteUmpire}
        title="Delete Official"
        message={`Are you sure you want to remove "${selectedUmpire?.umpire_name}" from the system?`}
        loading={submitting}
      />
    </div>
  );
};

export default Umpires;
