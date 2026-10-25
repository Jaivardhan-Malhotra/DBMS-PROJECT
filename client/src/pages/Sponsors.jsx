import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Globe,
  Briefcase,
  Shield,
  Trash,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sponsorsAPI, teamsAPI } from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchFilter from '../components/SearchFilter';
import FormField from '../components/FormField';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const initialSponsorForm = {
  sponsor_name: '',
  industry: '',
  website: '',
  country: 'India',
};

const initialContractForm = {
  team_id: '',
  contract_value: '',
  sponsorship_type: 'Associate',
  start_year: 2024,
  end_year: 2026,
};

const Sponsors = () => {
  const [sponsors, setSponsors] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [associatedTeams, setAssociatedTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Forms
  const [formData, setFormData] = useState(initialSponsorForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Contract form in view modal
  const [contractData, setContractData] = useState(initialContractForm);
  const [contractSubmitting, setContractSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [sponsorsRes, teamsRes] = await Promise.allSettled([
        sponsorsAPI.getAll(),
        teamsAPI.getAll(),
      ]);

      if (sponsorsRes.status === 'fulfilled' && sponsorsRes.value?.data) {
        setSponsors(sponsorsRes.value.data.data || sponsorsRes.value.data || []);
      }
      if (teamsRes.status === 'fulfilled' && teamsRes.value?.data) {
        setTeams(teamsRes.value.data.data || teamsRes.value.data || []);
      }
    } catch (error) {
      toast.error('Failed to load sponsors');
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
    setSelectedSponsor(null);
    setFormData(initialSponsorForm);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sponsor) => {
    setSelectedSponsor(sponsor);
    setFormData({
      sponsor_name: sponsor.sponsor_name || '',
      industry: sponsor.industry || '',
      website: sponsor.website || '',
      country: sponsor.country || 'India',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const loadSponsorTeams = async (sponsorId) => {
    setLoadingTeams(true);
    try {
      const res = await sponsorsAPI.getTeams(sponsorId);
      setAssociatedTeams(res.data.data || res.data || []);
    } catch (err) {
      setAssociatedTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleOpenView = async (sponsor) => {
    setSelectedSponsor(sponsor);
    setContractData(initialContractForm);
    setIsViewOpen(true);
    loadSponsorTeams(sponsor.sponsor_id);
  };

  const handleOpenDelete = (sponsor) => {
    setSelectedSponsor(sponsor);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.sponsor_name.trim()) errors.sponsor_name = 'Sponsor name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveSponsor = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (selectedSponsor) {
        await sponsorsAPI.update(selectedSponsor.sponsor_id, formData);
        toast.success(`Sponsor "${formData.sponsor_name}" updated!`);
      } else {
        await sponsorsAPI.create(formData);
        toast.success(`Sponsor "${formData.sponsor_name}" registered!`);
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSponsor = async () => {
    if (!selectedSponsor) return;
    setSubmitting(true);
    try {
      await sponsorsAPI.delete(selectedSponsor.sponsor_id);
      toast.success(`Sponsor "${selectedSponsor.sponsor_name}" removed.`);
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete sponsor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTeamContract = async (e) => {
    e.preventDefault();
    if (!contractData.team_id) {
      toast.error('Please select a team');
      return;
    }
    setContractSubmitting(true);
    try {
      const payload = {
        team_id: Number(contractData.team_id),
        contract_value: contractData.contract_value ? Number(contractData.contract_value) : null,
        sponsorship_type: contractData.sponsorship_type,
        start_year: contractData.start_year ? Number(contractData.start_year) : null,
        end_year: contractData.end_year ? Number(contractData.end_year) : null,
      };
      await sponsorsAPI.addTeam(selectedSponsor.sponsor_id, payload);
      toast.success('Team sponsorship contract added!');
      setContractData(initialContractForm);
      loadSponsorTeams(selectedSponsor.sponsor_id);
    } catch (error) {
      toast.error(error.message || 'Failed to associate team');
    } finally {
      setContractSubmitting(false);
    }
  };

  const handleRemoveTeamContract = async (teamId) => {
    try {
      await sponsorsAPI.removeTeam(selectedSponsor.sponsor_id, teamId);
      toast.success('Contract association removed');
      loadSponsorTeams(selectedSponsor.sponsor_id);
    } catch (error) {
      toast.error(error.message || 'Failed to remove contract');
    }
  };

  const filteredSponsors = sponsors.filter((s) => {
    const matchesSearch =
      s.sponsor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.country?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndustry = industryFilter ? s.industry === industryFilter : true;
    return matchesSearch && matchesIndustry;
  });

  const industryOptions = Array.from(new Set(sponsors.map((s) => s.industry).filter(Boolean))).map((ind) => ({
    label: ind,
    value: ind,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Sponsors & Brand Partnerships</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Corporate sponsorship deals, kit partnerships, title sponsorships, and franchise deals.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add New Sponsor</span>
        </button>
      </div>

      {/* Filter and Search */}
      <SearchFilter
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search sponsor by corporate brand or sector..."
        filters={[
          {
            key: 'industry',
            label: 'All Industries',
            options: industryOptions,
            value: industryFilter,
          },
        ]}
        onFilterChange={(_, val) => setIndustryFilter(val)}
      />

      {loading ? (
        <LoadingSpinner message="Loading corporate sponsors..." />
      ) : filteredSponsors.length === 0 ? (
        <EmptyState
          message="No brand sponsors found matching your criteria."
          icon={DollarSign}
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              Add Sponsor
            </button>
          }
        />
      ) : (
        <div className="grid-3">
          {filteredSponsors.map((s) => (
            <div key={s.sponsor_id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <Badge variant="purple" label={s.industry || 'Commercial Partner'} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.country}</span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {s.sponsor_name}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={15} color="var(--accent-primary)" />
                    <span>Industry: {s.industry || 'General Corporate'}</span>
                  </div>
                  {s.website && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe size={15} color="var(--accent-secondary)" />
                      <a
                        href={s.website.startsWith('http') ? s.website : `https://${s.website}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--accent-secondary)', textDecoration: 'underline' }}
                      >
                        {s.website.replace(/^https?:\/\//, '')}
                      </a>
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
                  marginTop: '1rem',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <button
                  type="button"
                  className="btn-icon primary"
                  onClick={() => handleOpenView(s)}
                  title="View Franchise Contracts"
                >
                  <Eye size={16} />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => handleOpenEdit(s)}
                  title="Edit Sponsor"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  className="btn-icon danger"
                  onClick={() => handleOpenDelete(s)}
                  title="Delete Sponsor"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Sponsor Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedSponsor ? `Edit Sponsor: ${selectedSponsor.sponsor_name}` : 'Register Corporate Sponsor'}
        size="md"
      >
        <form onSubmit={handleSaveSponsor}>
          <FormField label="Brand / Sponsor Name" error={formErrors.sponsor_name} required>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Tata Sons, Dream11"
              value={formData.sponsor_name}
              onChange={(e) => setFormData({ ...formData, sponsor_name: e.target.value })}
            />
          </FormField>

          <div className="form-row">
            <FormField label="Industry / Sector">
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Conglomerate, FinTech, Auto"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              />
            </FormField>
            <FormField label="Country of Origin">
              <input
                type="text"
                className="form-control"
                placeholder="India"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Official Website">
            <input
              type="text"
              className="form-control"
              placeholder="https://brand.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
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
              {submitting ? 'Saving...' : selectedSponsor ? 'Update Sponsor' : 'Add Sponsor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Sponsor Contracts Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={selectedSponsor ? `${selectedSponsor.sponsor_name} - Brand Partnerships` : 'Sponsor Details'}
        size="lg"
      >
        {selectedSponsor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header info */}
            <div
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedSponsor.sponsor_name}</h4>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedSponsor.industry} &bull; {selectedSponsor.country}
                </span>
              </div>
              <Badge variant="purple" label={`${associatedTeams.length} Team Deals`} />
            </div>

            {/* List of associated teams */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="var(--accent-primary)" />
                Franchise Sponsorship Contracts
              </h4>

              {loadingTeams ? (
                <LoadingSpinner message="Fetching partnership deals..." />
              ) : associatedTeams.length === 0 ? (
                <EmptyState message="No team contracts registered for this sponsor yet." icon={Shield} />
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Franchise Team</th>
                        <th>Deal Type</th>
                        <th>Contract Value</th>
                        <th>Term</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {associatedTeams.map((ts) => (
                        <tr key={ts.team_id}>
                          <td className="text-primary">{ts.team_name} ({ts.short_name})</td>
                          <td>
                            <Badge variant="info" label={ts.sponsorship_type || 'Associate'} />
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                            {ts.contract_value ? `₹ ${Number(ts.contract_value).toLocaleString()}` : 'Undisclosed'}
                          </td>
                          <td>
                            {ts.start_year || 'N/A'} - {ts.end_year || 'N/A'}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-icon danger"
                              onClick={() => handleRemoveTeamContract(ts.team_id)}
                              title="Terminate Contract"
                            >
                              <Trash size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Form to attach new team contract */}
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: '1rem' }}>
                + Add Franchise Sponsorship Contract
              </h4>
              <form onSubmit={handleAddTeamContract}>
                <div className="form-row">
                  <FormField label="Select Franchise Team" required>
                    <select
                      className="form-control"
                      value={contractData.team_id}
                      onChange={(e) => setContractData({ ...contractData, team_id: e.target.value })}
                    >
                      <option value="">Select Team</option>
                      {teams.map((t) => (
                        <option key={t.team_id} value={t.team_id}>
                          {t.team_name} ({t.short_name})
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Sponsorship Tier">
                    <select
                      className="form-control"
                      value={contractData.sponsorship_type}
                      onChange={(e) => setContractData({ ...contractData, sponsorship_type: e.target.value })}
                    >
                      <option value="Title">Title Sponsor</option>
                      <option value="Kit">Kit Sponsor</option>
                      <option value="Associate">Associate Partner</option>
                      <option value="Official Partner">Official Partner</option>
                    </select>
                  </FormField>
                </div>

                <div className="form-row">
                  <FormField label="Contract Value (INR)">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 50000000"
                      value={contractData.contract_value}
                      onChange={(e) => setContractData({ ...contractData, contract_value: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Start Year">
                    <input
                      type="number"
                      className="form-control"
                      value={contractData.start_year}
                      onChange={(e) => setContractData({ ...contractData, start_year: e.target.value })}
                    />
                  </FormField>
                  <FormField label="End Year">
                    <input
                      type="number"
                      className="form-control"
                      value={contractData.end_year}
                      onChange={(e) => setContractData({ ...contractData, end_year: e.target.value })}
                    />
                  </FormField>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={contractSubmitting}>
                    {contractSubmitting ? 'Linking...' : 'Add Contract'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteSponsor}
        title="Delete Sponsor"
        message={`Are you sure you want to delete "${selectedSponsor?.sponsor_name}"? All associated franchise contract records will be removed.`}
        loading={submitting}
      />
    </div>
  );
};

export default Sponsors;
