import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Trophy,
  Swords,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { seasonsAPI, teamsAPI } from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const initialSeasonForm = {
  season_year: 2024,
  start_date: '',
  end_date: '',
  host_country: 'India',
  total_teams: 10,
  total_matches: 74,
  champion_team_id: '',
  runner_up_team_id: '',
};

const Seasons = () => {
  const [seasons, setSeasons] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expanded season state for matches
  const [expandedSeasonId, setExpandedSeasonId] = useState(null);
  const [seasonMatches, setSeasonMatches] = useState({});
  const [loadingSeasonMatches, setLoadingSeasonMatches] = useState(false);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(null);

  // Form State
  const [formData, setFormData] = useState(initialSeasonForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchSeasonsAndTeams = useCallback(async () => {
    try {
      setLoading(true);
      const [seasonsRes, teamsRes] = await Promise.allSettled([
        seasonsAPI.getAll(),
        teamsAPI.getAll(),
      ]);

      if (seasonsRes.status === 'fulfilled' && seasonsRes.value?.data) {
        const raw = seasonsRes.value.data.data || seasonsRes.value.data || [];
        // Sort descending by year
        raw.sort((a, b) => Number(b.season_year) - Number(a.season_year));
        setSeasons(raw);
      }
      if (teamsRes.status === 'fulfilled' && teamsRes.value?.data) {
        setTeams(teamsRes.value.data.data || teamsRes.value.data || []);
      }
    } catch (error) {
      toast.error('Failed to load season history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeasonsAndTeams();
    const handleRefresh = () => fetchSeasonsAndTeams();
    window.addEventListener('ipl-data-refresh', handleRefresh);
    return () => window.removeEventListener('ipl-data-refresh', handleRefresh);
  }, [fetchSeasonsAndTeams]);

  const handleToggleExpand = async (seasonId) => {
    if (expandedSeasonId === seasonId) {
      setExpandedSeasonId(null);
      return;
    }
    setExpandedSeasonId(seasonId);
    if (!seasonMatches[seasonId]) {
      setLoadingSeasonMatches(true);
      try {
        const res = await seasonsAPI.getMatches(seasonId);
        setSeasonMatches((prev) => ({
          ...prev,
          [seasonId]: res.data.data || res.data || [],
        }));
      } catch (err) {
        setSeasonMatches((prev) => ({ ...prev, [seasonId]: [] }));
      } finally {
        setLoadingSeasonMatches(false);
      }
    }
  };

  const handleOpenAdd = () => {
    setSelectedSeason(null);
    setFormData(initialSeasonForm);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (season) => {
    setSelectedSeason(season);
    setFormData({
      season_year: season.season_year || 2024,
      start_date: season.start_date ? season.start_date.split('T')[0] : '',
      end_date: season.end_date ? season.end_date.split('T')[0] : '',
      host_country: season.host_country || 'India',
      total_teams: season.total_teams || 10,
      total_matches: season.total_matches || 74,
      champion_team_id: season.champion_team_id || '',
      runner_up_team_id: season.runner_up_team_id || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenDelete = (season) => {
    setSelectedSeason(season);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.season_year) errors.season_year = 'Season year is required';
    if (!formData.start_date) errors.start_date = 'Start date is required';
    if (!formData.end_date) errors.end_date = 'End date is required';
    if (formData.start_date && formData.end_date && formData.end_date <= formData.start_date) {
      errors.end_date = 'End date must be after start date';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveSeason = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        season_year: Number(formData.season_year),
        start_date: formData.start_date,
        end_date: formData.end_date,
        host_country: formData.host_country,
        total_teams: Number(formData.total_teams),
        total_matches: Number(formData.total_matches),
        champion_team_id: formData.champion_team_id ? Number(formData.champion_team_id) : null,
        runner_up_team_id: formData.runner_up_team_id ? Number(formData.runner_up_team_id) : null,
      };

      if (selectedSeason) {
        await seasonsAPI.update(selectedSeason.season_id, payload);
        toast.success(`Season ${formData.season_year} updated!`);
      } else {
        await seasonsAPI.create(payload);
        toast.success(`Season ${formData.season_year} initialized!`);
      }
      setIsFormOpen(false);
      fetchSeasonsAndTeams();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSeason = async () => {
    if (!selectedSeason) return;
    setSubmitting(true);
    try {
      await seasonsAPI.delete(selectedSeason.season_id);
      toast.success(`Season ${selectedSeason.season_year} removed.`);
      setIsDeleteOpen(false);
      fetchSeasonsAndTeams();
    } catch (error) {
      toast.error(error.message || 'Failed to delete season');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>IPL Seasons Archive</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Historical timeline of Indian Premier League tournaments, dates, hosts, and champions.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add Season</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading tournament editions..." />
      ) : seasons.length === 0 ? (
        <EmptyState
          message="No tournament seasons registered yet."
          icon={Calendar}
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              Create First Season
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {seasons.map((season) => {
            const champion = teams.find((t) => t.team_id === season.champion_team_id);
            const runnerUp = teams.find((t) => t.team_id === season.runner_up_team_id);
            const isExpanded = expandedSeasonId === season.season_id;
            const matches = seasonMatches[season.season_id] || [];

            return (
              <div
                key={season.season_id}
                className="card"
                style={{
                  transition: 'all 0.3s ease',
                  borderLeft: '4px solid var(--accent-primary)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
                        border: '1px solid var(--border-light)',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>IPL</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)', lineHeight: 1 }}>
                        {season.season_year}
                      </div>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        IPL Season {season.season_year}
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>
                          📅 {new Date(season.start_date).toLocaleDateString()} &ndash;{' '}
                          {new Date(season.end_date).toLocaleDateString()}
                        </span>
                        <span>🌍 Host: {season.host_country}</span>
                        <span>🏏 {season.total_matches || 0} Matches</span>
                        <span>👥 {season.total_teams || 8} Teams</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {champion ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'rgba(234, 179, 8, 0.12)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-full)',
                          border: '1px solid rgba(234, 179, 8, 0.3)',
                        }}
                      >
                        <Trophy size={16} color="#eab308" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#facc15' }}>
                          Champion: {champion.short_name || champion.team_name}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="default" label="Champion TBD" />
                    )}

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleToggleExpand(season.season_id)}
                        title={isExpanded ? 'Collapse Matches' : 'Expand Matches'}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleOpenEdit(season)}
                        title="Edit Season"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon danger"
                        onClick={() => handleOpenDelete(season)}
                        title="Delete Season"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Matches List */}
                {isExpanded && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Swords size={16} color="var(--accent-secondary)" />
                        Season {season.season_year} Matches ({matches.length})
                      </h4>
                    </div>

                    {loadingSeasonMatches ? (
                      <LoadingSpinner message="Fetching season matches..." />
                    ) : matches.length === 0 ? (
                      <EmptyState message="No fixtures found recorded under this season." icon={Swords} />
                    ) : (
                      <div className="table-container">
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Type</th>
                              <th>Match</th>
                              <th>Venue</th>
                              <th>Winner</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matches.map((m) => (
                              <tr key={m.match_id}>
                                <td>{new Date(m.match_date).toLocaleDateString()}</td>
                                <td>
                                  <Badge variant="purple" label={m.match_type || 'League'} />
                                </td>
                                <td className="text-primary">
                                  {m.team1_short || m.team1_name} vs {m.team2_short || m.team2_name}
                                </td>
                                <td>{m.venue_name || m.city || '-'}</td>
                                <td>
                                  {m.winner_name ? (
                                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                                      🏆 {m.winner_name}
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>{m.status}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Season Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedSeason ? `Edit Season ${selectedSeason.season_year}` : 'Create Tournament Season'}
        size="md"
      >
        <form onSubmit={handleSaveSeason}>
          <div className="form-row">
            <FormField label="Season Year" error={formErrors.season_year} required>
              <input
                type="number"
                className="form-control"
                placeholder="2024"
                value={formData.season_year}
                onChange={(e) => setFormData({ ...formData, season_year: e.target.value })}
              />
            </FormField>
            <FormField label="Host Country" required>
              <input
                type="text"
                className="form-control"
                placeholder="India"
                value={formData.host_country}
                onChange={(e) => setFormData({ ...formData, host_country: e.target.value })}
              />
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Start Date" error={formErrors.start_date} required>
              <input
                type="date"
                className="form-control"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </FormField>
            <FormField label="End Date" error={formErrors.end_date} required>
              <input
                type="date"
                className="form-control"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Total Teams">
              <input
                type="number"
                min="2"
                className="form-control"
                value={formData.total_teams}
                onChange={(e) => setFormData({ ...formData, total_teams: e.target.value })}
              />
            </FormField>
            <FormField label="Total Matches">
              <input
                type="number"
                min="1"
                className="form-control"
                value={formData.total_matches}
                onChange={(e) => setFormData({ ...formData, total_matches: e.target.value })}
              />
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Champion Franchise">
              <select
                className="form-control"
                value={formData.champion_team_id}
                onChange={(e) => setFormData({ ...formData, champion_team_id: e.target.value })}
              >
                <option value="">Undecided / In-Progress</option>
                {teams.map((t) => (
                  <option key={t.team_id} value={t.team_id}>
                    {t.team_name} ({t.short_name})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Runner-Up Franchise">
              <select
                className="form-control"
                value={formData.runner_up_team_id}
                onChange={(e) => setFormData({ ...formData, runner_up_team_id: e.target.value })}
              >
                <option value="">Undecided / None</option>
                {teams.map((t) => (
                  <option key={t.team_id} value={t.team_id}>
                    {t.team_name} ({t.short_name})
                  </option>
                ))}
              </select>
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
              {submitting ? 'Saving...' : selectedSeason ? 'Update Season' : 'Create Season'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteSeason}
        title="Delete Season"
        message={`Are you sure you want to delete Season ${selectedSeason?.season_year}? Matches and records associated with this season may be affected.`}
        loading={submitting}
      />
    </div>
  );
};

export default Seasons;
