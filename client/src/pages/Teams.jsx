import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Eye,
  MapPin,
  User,
  Users,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { teamsAPI, venuesAPI } from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchFilter from '../components/SearchFilter';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';

const initialForm = {
  team_name: '',
  short_name: '',
  city: '',
  home_venue_id: '',
  coach: '',
  jersey_color: '#f97316',
  founded_year: 2008,
};

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // Form state
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchTeamsAndVenues = useCallback(async () => {
    try {
      setLoading(true);
      const [teamsRes, venuesRes] = await Promise.all([
        teamsAPI.getAll(),
        venuesAPI.getAll(),
      ]);
      setTeams(teamsRes.data.data || []);
      setVenues(venuesRes.data.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load teams data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamsAndVenues();
    const handleRefresh = () => fetchTeamsAndVenues();
    window.addEventListener('ipl-data-refresh', handleRefresh);
    return () => window.removeEventListener('ipl-data-refresh', handleRefresh);
  }, [fetchTeamsAndVenues]);

  const handleOpenAdd = () => {
    setSelectedTeam(null);
    setFormData(initialForm);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (team) => {
    setSelectedTeam(team);
    setFormData({
      team_name: team.team_name || '',
      short_name: team.short_name || '',
      city: team.city || '',
      home_venue_id: team.home_venue_id || '',
      coach: team.coach || '',
      jersey_color: team.jersey_color || '#f97316',
      founded_year: team.founded_year || 2008,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenView = async (team) => {
    setSelectedTeam(team);
    setIsViewOpen(true);
    setLoadingPlayers(true);
    try {
      const res = await teamsAPI.getPlayers(team.team_id);
      setTeamPlayers(res.data.data || res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load team players');
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleOpenDelete = (team) => {
    setSelectedTeam(team);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.team_name.trim()) errors.team_name = 'Team name is required';
    if (!formData.short_name.trim()) errors.short_name = 'Short name is required';
    else if (formData.short_name.trim().length > 10) errors.short_name = 'Short name max 10 chars';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (formData.founded_year && (formData.founded_year < 1900 || formData.founded_year > 2099)) {
      errors.founded_year = 'Enter a valid year';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        home_venue_id: formData.home_venue_id ? Number(formData.home_venue_id) : null,
        founded_year: formData.founded_year ? Number(formData.founded_year) : null,
      };

      if (selectedTeam) {
        await teamsAPI.update(selectedTeam.team_id, payload);
        toast.success(`Team "${formData.team_name}" updated successfully!`);
      } else {
        await teamsAPI.create(payload);
        toast.success(`Team "${formData.team_name}" created successfully!`);
      }
      setIsFormOpen(false);
      fetchTeamsAndVenues();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;
    setSubmitting(true);
    try {
      await teamsAPI.delete(selectedTeam.team_id);
      toast.success(`Team "${selectedTeam.team_name}" deleted.`);
      setIsDeleteOpen(false);
      fetchTeamsAndVenues();
    } catch (error) {
      toast.error(error.message || 'Failed to delete team');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter teams by search term & city
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.short_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.coach?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = cityFilter ? team.city?.toLowerCase() === cityFilter.toLowerCase() : true;

    return matchesSearch && matchesCity;
  });

  const cityOptions = Array.from(new Set(teams.map((t) => t.city).filter(Boolean))).map((c) => ({
    label: c,
    value: c,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Teams Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Configure IPL franchise squads, team branding, coaches, and home grounds.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add New Team</span>
        </button>
      </div>

      {/* Filter and Search */}
      <SearchFilter
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search franchise by name, short code, city, coach..."
        filters={[{ key: 'city', label: 'All Cities', options: cityOptions, value: cityFilter }]}
        onFilterChange={(_, val) => setCityFilter(val)}
      />

      {loading ? (
        <LoadingSpinner message="Loading franchise teams..." />
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          message="No franchise teams found matching your query."
          icon={Shield}
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              Add First Team
            </button>
          }
        />
      ) : (
        <div className="grid-3">
          {filteredTeams.map((team) => {
            const venueName =
              venues.find((v) => v.venue_id === team.home_venue_id)?.venue_name ||
              team.venue_name ||
              'Not assigned';

            return (
              <div key={team.team_id} className="card" style={{ padding: 0 }}>
                {/* Banner Header with Jersey Color */}
                <div
                  style={{
                    height: '75px',
                    background: `linear-gradient(135deg, ${team.jersey_color || '#1e293b'} 0%, #0f1629 100%)`,
                    padding: '0.75rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      background: 'rgba(0,0,0,0.4)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: '#ffffff',
                    }}
                  >
                    {team.short_name}
                  </span>
                </div>

                {/* Body Content */}
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                    <div
                      className="team-color-indicator"
                      style={{ backgroundColor: team.jersey_color || '#f97316' }}
                      title={`Jersey Color: ${team.jersey_color}`}
                    />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {team.team_name}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '1rem 0', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                      <MapPin size={15} color="var(--text-muted)" />
                      <span>{team.city} &bull; Home: {venueName}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                      <User size={15} color="var(--text-muted)" />
                      <span>Head Coach: <strong style={{ color: 'var(--text-primary)' }}>{team.coach || 'Unassigned'}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                      <Calendar size={15} color="var(--text-muted)" />
                      <span>Founded: {team.founded_year || 'N/A'}</span>
                    </div>

                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <button
                      type="button"
                      className="btn-icon primary"
                      onClick={() => handleOpenView(team)}
                      title="View Details & Squad"
                    >
                      <Eye size={17} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleOpenEdit(team)}
                      title="Edit Franchise"
                    >
                      <Edit2 size={17} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon danger"
                      onClick={() => handleOpenDelete(team)}
                      title="Delete Franchise"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Team Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedTeam ? `Edit Team: ${selectedTeam.team_name}` : 'Create New IPL Franchise'}
        size="md"
      >
        <form onSubmit={handleSaveTeam}>
          <div className="form-row">
            <FormField label="Franchise Name" error={formErrors.team_name} required>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Mumbai Indians"
                value={formData.team_name}
                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
              />
            </FormField>
            <FormField label="Short Code" error={formErrors.short_name} required>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. MI"
                value={formData.short_name}
                onChange={(e) => setFormData({ ...formData, short_name: e.target.value.toUpperCase() })}
              />
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Home City" error={formErrors.city} required>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Mumbai"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </FormField>
            <FormField label="Home Stadium / Venue">
              <select
                className="form-control"
                value={formData.home_venue_id}
                onChange={(e) => setFormData({ ...formData, home_venue_id: e.target.value })}
              >
                <option value="">Select Home Venue</option>
                {venues.map((venue) => (
                  <option key={venue.venue_id} value={venue.venue_id}>
                    {venue.venue_name} ({venue.city})
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Head Coach">
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Mark Boucher"
                value={formData.coach}
                onChange={(e) => setFormData({ ...formData, coach: e.target.value })}
              />
            </FormField>
            <FormField label="Founded Year" error={formErrors.founded_year}>
              <input
                type="number"
                className="form-control"
                placeholder="2008"
                value={formData.founded_year}
                onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
              />
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Jersey Color Scheme">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={formData.jersey_color}
                  onChange={(e) => setFormData({ ...formData, jersey_color: e.target.value })}
                  style={{ width: '45px', height: '38px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'none' }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="#004BA0"
                  value={formData.jersey_color}
                  onChange={(e) => setFormData({ ...formData, jersey_color: e.target.value })}
                />
              </div>
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
              {submitting ? 'Saving...' : selectedTeam ? 'Update Team' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Team Details & Squad Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={selectedTeam ? `${selectedTeam.team_name} (${selectedTeam.short_name})` : 'Team Profile'}
        size="lg"
      >
        {selectedTeam && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                padding: '1.25rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  backgroundColor: selectedTeam.jersey_color || '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: '#ffffff',
                }}
              >
                {selectedTeam.short_name}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedTeam.team_name}</h4>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} /> {selectedTeam.city}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={13} /> Coach: {selectedTeam.coach || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="var(--accent-secondary)" />
                  Roster Squad Players ({teamPlayers.length})
                </h4>
              </div>

              {loadingPlayers ? (
                <LoadingSpinner message="Fetching roster..." />
              ) : teamPlayers.length === 0 ? (
                <EmptyState message="No players registered under this franchise yet." icon={Users} />
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Player Name</th>
                        <th>Role</th>
                        <th>Nationality</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamPlayers.map((player) => (
                        <tr key={player.player_id}>
                          <td>{player.jersey_no || '-'}</td>
                          <td className="text-primary">{player.player_name}</td>
                          <td>
                            <Badge variant="purple" label={player.role} />
                          </td>
                          <td>{player.nationality}</td>
                          <td>
                            <Badge
                              variant={player.is_active ? 'success' : 'danger'}
                              label={player.is_active ? 'Active' : 'Inactive'}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteTeam}
        title="Delete Franchise"
        message={`Are you sure you want to delete "${selectedTeam?.team_name}"? This may affect associated matches, players, and records.`}
        loading={submitting}
      />
    </div>
  );
};

export default Teams;
