import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Calendar,
  Shield,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ownersAPI, teamsAPI } from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchFilter from '../components/SearchFilter';
import FormField from '../components/FormField';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const initialOwnerForm = {
  owner_name: '',
  net_worth: '',
  nationality: 'Indian',
  team_id: '',
  contact: '',
  since_year: 2008,
};

const Owners = () => {
  const [owners, setOwners] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);

  // Form State
  const [formData, setFormData] = useState(initialOwnerForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [ownersRes, teamsRes] = await Promise.allSettled([
        ownersAPI.getAll(),
        teamsAPI.getAll(),
      ]);

      if (ownersRes.status === 'fulfilled' && ownersRes.value?.data) {
        setOwners(ownersRes.value.data.data || ownersRes.value.data || []);
      }
      if (teamsRes.status === 'fulfilled' && teamsRes.value?.data) {
        setTeams(teamsRes.value.data.data || teamsRes.value.data || []);
      }
    } catch (error) {
      toast.error('Failed to load franchise owners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const handleRefresh = () => fetchData();
    window.addEventListener('ipl-data-refresh', handleRefresh);
    return () => window.removeEventListener('ipl-data-refresh', handleRefresh);
  }, [fetchData]);

  const handleOpenAdd = () => {
    setSelectedOwner(null);
    setFormData(initialOwnerForm);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (owner) => {
    setSelectedOwner(owner);
    setFormData({
      owner_name: owner.owner_name || '',
      net_worth: owner.net_worth ?? '',
      nationality: owner.nationality || 'Indian',
      team_id: owner.team_id || '',
      contact: owner.contact || '',
      since_year: owner.since_year || 2008,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenDelete = (owner) => {
    setSelectedOwner(owner);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.owner_name.trim()) errors.owner_name = 'Owner name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveOwner = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        net_worth: formData.net_worth ? Number(formData.net_worth) : null,
        team_id: formData.team_id ? Number(formData.team_id) : null,
        since_year: formData.since_year ? Number(formData.since_year) : null,
      };

      if (selectedOwner) {
        await ownersAPI.update(selectedOwner.owner_id, payload);
        toast.success(`Franchise owner "${formData.owner_name}" updated!`);
      } else {
        await ownersAPI.create(payload);
        toast.success(`Franchise owner "${formData.owner_name}" registered!`);
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOwner = async () => {
    if (!selectedOwner) return;
    setSubmitting(true);
    try {
      await ownersAPI.delete(selectedOwner.owner_id);
      toast.success(`Owner "${selectedOwner.owner_name}" removed.`);
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete owner');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOwners = owners.filter((owner) => {
    const matchesSearch =
      owner.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.nationality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.team_name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Franchise Owners</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Billionaire investors, consortiums, and ownership stakes of IPL franchises.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add Franchise Owner</span>
        </button>
      </div>

      {/* Search */}
      <SearchFilter
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search franchise owners by name, nationality, or team..."
      />

      {loading ? (
        <LoadingSpinner message="Loading franchise owners..." />
      ) : filteredOwners.length === 0 ? (
        <EmptyState
          message="No franchise owners found matching your query."
          icon={Briefcase}
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              Add Franchise Owner
            </button>
          }
        />
      ) : (
        <div className="grid-3">
          {filteredOwners.map((owner) => {
            const team = teams.find((t) => t.team_id === owner.team_id);
            const teamName = owner.team_name || team?.team_name || 'Independent Investor';

            return (
              <div key={owner.owner_id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <Badge variant="purple" label={owner.nationality || 'Indian'} />
                    {owner.since_year && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Since {owner.since_year}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    {owner.owner_name}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={15} color="var(--accent-primary)" />
                      <span>
                        Owns: <strong style={{ color: 'var(--text-primary)' }}>{teamName}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DollarSign size={15} color="var(--success)" />
                      <span>
                        Est. Net Worth:{' '}
                        <strong style={{ color: 'var(--success)' }}>
                          {owner.net_worth ? `₹ ${Number(owner.net_worth).toLocaleString()}` : 'Confidential'}
                        </strong>
                      </span>
                    </div>

                    {owner.contact && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={15} color="var(--accent-secondary)" />
                        <span>{owner.contact}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    paddingTop: '1rem',
                    marginTop: '1.25rem',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleOpenEdit(owner)}
                    title="Edit Owner"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon danger"
                    onClick={() => handleOpenDelete(owner)}
                    title="Delete Owner"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Owner Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedOwner ? `Edit Owner: ${selectedOwner.owner_name}` : 'Register Franchise Owner'}
        size="md"
      >
        <form onSubmit={handleSaveOwner}>
          <FormField label="Owner / Consortium Name" error={formErrors.owner_name} required>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Mukesh Ambani / Reliance Industries"
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
            />
          </FormField>

          <div className="form-row">
            <FormField label="Associated Franchise">
              <select
                className="form-control"
                value={formData.team_id}
                onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
              >
                <option value="">Independent / Free</option>
                {teams.map((t) => (
                  <option key={t.team_id} value={t.team_id}>
                    {t.team_name} ({t.short_name})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Nationality">
              <input
                type="text"
                className="form-control"
                placeholder="Indian"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              />
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Net Worth (INR)">
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 850000000000"
                value={formData.net_worth}
                onChange={(e) => setFormData({ ...formData, net_worth: e.target.value })}
              />
            </FormField>
            <FormField label="Owner Since (Year)">
              <input
                type="number"
                className="form-control"
                placeholder="2008"
                value={formData.since_year}
                onChange={(e) => setFormData({ ...formData, since_year: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Official Contact / Liaison">
            <input
              type="text"
              className="form-control"
              placeholder="e.g. contact@ril.com or +91 22 2278 5000"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            />
          </FormField>

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
              {submitting ? 'Saving...' : selectedOwner ? 'Update Owner' : 'Add Owner'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteOwner}
        title="Delete Franchise Owner"
        message={`Are you sure you want to remove "${selectedOwner?.owner_name}"?`}
        loading={submitting}
      />
    </div>
  );
};

export default Owners;
