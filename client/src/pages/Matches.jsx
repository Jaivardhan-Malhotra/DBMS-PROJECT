import React, { useState, useEffect, useCallback } from 'react';
import {
  Swords,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Trophy,
  Activity,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  matchesAPI,
  seasonsAPI,
  venuesAPI,
  teamsAPI,
  playersAPI,
} from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchFilter from '../components/SearchFilter';
import FormField from '../components/FormField';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const initialMatchForm = {
  season_id: '',
  venue_id: '',
  team1_id: '',
  team2_id: '',
  match_date: '',
  match_time: '19:30',
  match_type: 'League',
  status: 'Scheduled',
  winner_id: '',
  win_margin: '',
  win_type: 'Runs',
  player_of_match: '',
};

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [venues, setVenues] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [seasonFilter, setSeasonFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchInnings, setMatchInnings] = useState([]);
  const [matchUmpires, setMatchUmpires] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form State
  const [formData, setFormData] = useState(initialMatchForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [matchesRes, seasonsRes, venuesRes, teamsRes, playersRes] =
        await Promise.allSettled([
          matchesAPI.getAll(),
          seasonsAPI.getAll(),
          venuesAPI.getAll(),
          teamsAPI.getAll(),
          playersAPI.getAll(),
        ]);

      if (matchesRes.status === 'fulfilled' && matchesRes.value?.data) {
        setMatches(matchesRes.value.data.data || matchesRes.value.data || []);
      }
      if (seasonsRes.status === 'fulfilled' && seasonsRes.value?.data) {
        setSeasons(seasonsRes.value.data.data || seasonsRes.value.data || []);
      }
      if (venuesRes.status === 'fulfilled' && venuesRes.value?.data) {
        setVenues(venuesRes.value.data.data || venuesRes.value.data || []);
      }
      if (teamsRes.status === 'fulfilled' && teamsRes.value?.data) {
        setTeams(teamsRes.value.data.data || teamsRes.value.data || []);
      }
      if (playersRes.status === 'fulfilled' && playersRes.value?.data) {
        setPlayers(playersRes.value.data.data || playersRes.value.data || []);
      }
    } catch (error) {
      toast.error('Failed to load match fixtures');
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
    setSelectedMatch(null);
    setFormData({
      ...initialMatchForm,
      season_id: seasons[0]?.season_id || '',
      venue_id: venues[0]?.venue_id || '',
      match_date: new Date().toISOString().split('T')[0],
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (match) => {
    setSelectedMatch(match);
    setFormData({
      season_id: match.season_id || '',
      venue_id: match.venue_id || '',
      team1_id: match.team1_id || '',
      team2_id: match.team2_id || '',
      match_date: match.match_date ? match.match_date.split('T')[0] : '',
      match_time: match.match_time ? match.match_time.substring(0, 5) : '19:30',
      match_type: match.match_type || 'League',
      status: match.status || 'Scheduled',
      winner_id: match.winner_id || '',
      win_margin: match.win_margin ?? '',
      win_type: match.win_type || 'Runs',
      player_of_match: match.player_of_match || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenView = async (match) => {
    setSelectedMatch(match);
    setIsViewOpen(true);
    setLoadingDetails(true);
    try {
      const [inningsRes, umpiresRes] = await Promise.allSettled([
        matchesAPI.getInnings(match.match_id),
        matchesAPI.getUmpires(match.match_id),
      ]);
      if (inningsRes.status === 'fulfilled' && inningsRes.value?.data) {
        setMatchInnings(inningsRes.value.data.data || inningsRes.value.data || []);
      } else {
        setMatchInnings([]);
      }
      if (umpiresRes.status === 'fulfilled' && umpiresRes.value?.data) {
        setMatchUmpires(umpiresRes.value.data.data || umpiresRes.value.data || []);
      } else {
        setMatchUmpires([]);
      }
    } catch (err) {
      setMatchInnings([]);
      setMatchUmpires([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenDelete = (match) => {
    setSelectedMatch(match);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.season_id) errors.season_id = 'Season is required';
    if (!formData.venue_id) errors.venue_id = 'Venue is required';
    if (!formData.team1_id) errors.team1_id = 'Team 1 is required';
    if (!formData.team2_id) errors.team2_id = 'Team 2 is required';
    if (formData.team1_id && formData.team2_id && formData.team1_id === formData.team2_id) {
      errors.team2_id = 'Team 1 and Team 2 must be different franchises';
    }
    if (!formData.match_date) errors.match_date = 'Match date is required';
    if (!formData.match_type) errors.match_type = 'Match type is required';
    if (!formData.status) errors.status = 'Match status is required';

    if (formData.status === 'Completed' && formData.winner_id) {
      if (
        formData.winner_id !== String(formData.team1_id) &&
        formData.winner_id !== String(formData.team2_id)
      ) {
        errors.winner_id = 'Winner must be either Team 1 or Team 2';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveMatch = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        season_id: Number(formData.season_id),
        venue_id: Number(formData.venue_id),
        team1_id: Number(formData.team1_id),
        team2_id: Number(formData.team2_id),
        match_date: formData.match_date,
        match_time: formData.match_time ? `${formData.match_time}:00` : null,
        match_type: formData.match_type,
        status: formData.status,
        winner_id: formData.status === 'Completed' && formData.winner_id ? Number(formData.winner_id) : null,
        win_margin: formData.status === 'Completed' && formData.win_margin !== '' ? Number(formData.win_margin) : null,
        win_type: formData.status === 'Completed' ? formData.win_type : null,
        player_of_match: formData.status === 'Completed' && formData.player_of_match ? Number(formData.player_of_match) : null,
      };

      if (selectedMatch) {
        await matchesAPI.update(selectedMatch.match_id, payload);
        toast.success('Match fixture updated successfully!');
      } else {
        await matchesAPI.create(payload);
        toast.success('Match fixture scheduled successfully!');
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMatch = async () => {
    if (!selectedMatch) return;
    setSubmitting(true);
    try {
      await matchesAPI.delete(selectedMatch.match_id);
      toast.success('Match record removed.');
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete match');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logic
  const filteredMatches = matches.filter((match) => {
    const matchesSearch =
      match.team1_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.team2_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.team1_short?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.team2_short?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.venue_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.match_type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeason = seasonFilter ? String(match.season_id) === String(seasonFilter) : true;
    const matchesStatus = statusFilter ? match.status === statusFilter : true;
    const matchesTeam = teamFilter
      ? String(match.team1_id) === String(teamFilter) || String(match.team2_id) === String(teamFilter)
      : true;

    return matchesSearch && matchesSeason && matchesStatus && matchesTeam;
  });

  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
  const paginatedMatches = filteredMatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Live':
        return 'danger';
      case 'Scheduled':
        return 'info';
      case 'Cancelled':
      case 'No Result':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Selected teams for winner dropdown options
  const eligibleWinners = teams.filter(
    (t) => String(t.team_id) === String(formData.team1_id) || String(t.team_id) === String(formData.team2_id)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Match Fixtures & Results</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Schedule fixtures, assign match venues, score matches, and record official results.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Schedule Match</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <SearchFilter
        value={searchTerm}
        onChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        placeholder="Search matches by teams, venue, stage..."
        filters={[
          {
            key: 'season',
            label: 'All Seasons',
            options: seasons.map((s) => ({ label: `Season ${s.season_year}`, value: String(s.season_id) })),
            value: seasonFilter,
          },
          {
            key: 'status',
            label: 'All Statuses',
            options: [
              { label: 'Scheduled', value: 'Scheduled' },
              { label: 'Live', value: 'Live' },
              { label: 'Completed', value: 'Completed' },
              { label: 'Cancelled', value: 'Cancelled' },
              { label: 'No Result', value: 'No Result' },
            ],
            value: statusFilter,
          },
          {
            key: 'team',
            label: 'All Teams',
            options: teams.map((t) => ({ label: t.team_name, value: String(t.team_id) })),
            value: teamFilter,
          },
        ]}
        onFilterChange={(key, val) => {
          if (key === 'season') setSeasonFilter(val);
          if (key === 'status') setStatusFilter(val);
          if (key === 'team') setTeamFilter(val);
          setCurrentPage(1);
        }}
      />

      {loading ? (
        <LoadingSpinner message="Loading match fixtures..." />
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          message="No matches found matching your filters."
          icon={Swords}
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              Schedule First Match
            </button>
          }
        />
      ) : (
        <div className="grid-2">
          {paginatedMatches.map((match) => {
            const team1 = teams.find((t) => t.team_id === match.team1_id);
            const team2 = teams.find((t) => t.team_id === match.team2_id);
            const venue = venues.find((v) => v.venue_id === match.venue_id);
            const winner = teams.find((t) => t.team_id === match.winner_id);

            const team1Name = match.team1_short || team1?.short_name || match.team1_name || 'Team 1';
            const team2Name = match.team2_short || team2?.short_name || match.team2_name || 'Team 2';
            const venueTitle = match.venue_name || venue?.venue_name || 'Venue TBA';
            const venueCity = match.venue_city || venue?.city || '';

            return (
              <div key={match.match_id} className="match-card">
                <div className="match-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} />
                    <span>{new Date(match.match_date).toLocaleDateString()}</span>
                    {match.match_time && <span>• {match.match_time.substring(0, 5)}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Badge variant="purple" label={match.match_type || 'League'} />
                    <Badge variant={getStatusBadgeVariant(match.status)} label={match.status} />
                  </div>
                </div>

                <div className="match-teams-row">
                  <div className="match-team">
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: team1?.jersey_color || '#3b82f6',
                        display: 'inline-block',
                      }}
                    />
                    <span>{team1Name}</span>
                  </div>
                  <div className="match-vs">VS</div>
                  <div className="match-team">
                    <span>{team2Name}</span>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: team2?.jersey_color || '#f97316',
                        display: 'inline-block',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                    <MapPin size={14} />
                    <span>{venueTitle} {venueCity ? `(${venueCity})` : ''}</span>
                  </div>

                  {match.status === 'Completed' && winner && (
                    <div style={{ fontWeight: 600, color: 'var(--success)' }}>
                      🏆 {winner.short_name || winner.team_name} Won
                      {match.win_margin ? ` (${match.win_margin} ${match.win_type || 'Runs'})` : ''}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Match #{match.match_id}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-icon primary"
                      onClick={() => handleOpenView(match)}
                      title="View Match Details & Innings"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleOpenEdit(match)}
                      title="Edit Match Details"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon danger"
                      onClick={() => handleOpenDelete(match)}
                      title="Delete Match"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Add / Edit Match Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedMatch ? `Edit Match #${selectedMatch.match_id}` : 'Schedule New Match'}
        size="lg"
      >
        <form onSubmit={handleSaveMatch}>
          <div className="form-row">
            <FormField label="Tournament Season" error={formErrors.season_id} required>
              <select
                className="form-control"
                value={formData.season_id}
                onChange={(e) => setFormData({ ...formData, season_id: e.target.value })}
              >
                <option value="">Select Season</option>
                {seasons.map((s) => (
                  <option key={s.season_id} value={s.season_id}>
                    Season {s.season_year} ({s.host_country})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Stadium / Venue" error={formErrors.venue_id} required>
              <select
                className="form-control"
                value={formData.venue_id}
                onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
              >
                <option value="">Select Venue</option>
                {venues.map((v) => (
                  <option key={v.venue_id} value={v.venue_id}>
                    {v.venue_name} ({v.city})
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Team 1" error={formErrors.team1_id} required>
              <select
                className="form-control"
                value={formData.team1_id}
                onChange={(e) => setFormData({ ...formData, team1_id: e.target.value })}
              >
                <option value="">Select Team 1</option>
                {teams.map((t) => (
                  <option key={t.team_id} value={t.team_id}>
                    {t.team_name} ({t.short_name})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Team 2" error={formErrors.team2_id} required>
              <select
                className="form-control"
                value={formData.team2_id}
                onChange={(e) => setFormData({ ...formData, team2_id: e.target.value })}
              >
                <option value="">Select Team 2</option>
                {teams.map((t) => (
                  <option key={t.team_id} value={t.team_id}>
                    {t.team_name} ({t.short_name})
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Match Date" error={formErrors.match_date} required>
              <input
                type="date"
                className="form-control"
                value={formData.match_date}
                onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
              />
            </FormField>
            <FormField label="Match Time">
              <input
                type="time"
                className="form-control"
                value={formData.match_time}
                onChange={(e) => setFormData({ ...formData, match_time: e.target.value })}
              />
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Match Type / Stage" required>
              <select
                className="form-control"
                value={formData.match_type}
                onChange={(e) => setFormData({ ...formData, match_type: e.target.value })}
              >
                <option value="League">League Match</option>
                <option value="Qualifier">Qualifier</option>
                <option value="Eliminator">Eliminator</option>
                <option value="Final">Grand Final</option>
                <option value="Super Over">Super Over</option>
              </select>
            </FormField>
            <FormField label="Status" required>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Live">Live In-Play</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No Result">No Result / Abandoned</option>
              </select>
            </FormField>
          </div>

          {/* Conditional Result Section if Completed */}
          {formData.status === 'Completed' && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1.25rem',
                backgroundColor: 'rgba(34, 197, 94, 0.05)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--success)', marginBottom: '1rem' }}>
                Official Match Outcome
              </h4>

              <div className="form-row">
                <FormField label="Winner Franchise" error={formErrors.winner_id}>
                  <select
                    className="form-control"
                    value={formData.winner_id}
                    onChange={(e) => setFormData({ ...formData, winner_id: e.target.value })}
                  >
                    <option value="">Select Winner</option>
                    {eligibleWinners.map((t) => (
                      <option key={t.team_id} value={t.team_id}>
                        {t.team_name} ({t.short_name})
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Win Type">
                  <select
                    className="form-control"
                    value={formData.win_type}
                    onChange={(e) => setFormData({ ...formData, win_type: e.target.value })}
                  >
                    <option value="Runs">Runs</option>
                    <option value="Wickets">Wickets</option>
                    <option value="Super Over">Super Over</option>
                    <option value="No Result">No Result</option>
                  </select>
                </FormField>
              </div>

              <div className="form-row">
                <FormField label="Win Margin (e.g. 15 runs, 6 wkts)">
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="e.g. 24"
                    value={formData.win_margin}
                    onChange={(e) => setFormData({ ...formData, win_margin: e.target.value })}
                  />
                </FormField>
                <FormField label="Player of the Match">
                  <select
                    className="form-control"
                    value={formData.player_of_match}
                    onChange={(e) => setFormData({ ...formData, player_of_match: e.target.value })}
                  >
                    <option value="">Select Player of Match</option>
                    {players.map((p) => (
                      <option key={p.player_id} value={p.player_id}>
                        {p.player_name} ({p.team_name || 'Free Agent'})
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          )}

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
              {submitting ? 'Saving...' : selectedMatch ? 'Update Fixture' : 'Schedule Fixture'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Match Details & Innings Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={selectedMatch ? `Match #${selectedMatch.match_id} Detailed Scorecard` : 'Match Details'}
        size="lg"
      >
        {selectedMatch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Summary Banner */}
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {new Date(selectedMatch.match_date).toLocaleDateString()} • {selectedMatch.match_type}
                </span>
                <Badge variant={getStatusBadgeVariant(selectedMatch.status)} label={selectedMatch.status} />
              </div>

              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {selectedMatch.team1_name || 'Team 1'} vs {selectedMatch.team2_name || 'Team 2'}
              </div>

              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                📍 {selectedMatch.venue_name || 'Venue TBA'} {selectedMatch.venue_city ? `(${selectedMatch.venue_city})` : ''}
              </div>

              {selectedMatch.winner_name && (
                <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>
                  🏆 Winner: {selectedMatch.winner_name}
                  {selectedMatch.win_margin ? ` by ${selectedMatch.win_margin} ${selectedMatch.win_type || 'Runs'}` : ''}
                </div>
              )}
            </div>

            {/* Innings section */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--accent-primary)" />
                Innings Scores
              </h4>

              {loadingDetails ? (
                <LoadingSpinner message="Loading innings scores..." />
              ) : matchInnings.length === 0 ? (
                <EmptyState message="No innings recorded yet for this fixture." icon={Activity} />
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Innings</th>
                        <th>Batting Team</th>
                        <th>Bowling Team</th>
                        <th>Score</th>
                        <th>Overs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchInnings.map((inn) => (
                        <tr key={inn.innings_id || inn.innings_no}>
                          <td>#{inn.innings_no}</td>
                          <td className="text-primary">{inn.batting_team_name || `Team ${inn.batting_team_id}`}</td>
                          <td>{inn.bowling_team_name || `Team ${inn.bowling_team_id}`}</td>
                          <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                            {inn.total_runs}/{inn.total_wickets}
                          </td>
                          <td>{inn.total_overs} ov</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Umpires section */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={18} color="var(--accent-secondary)" />
                Assigned Match Officials
              </h4>

              {loadingDetails ? (
                <LoadingSpinner message="Loading match officials..." />
              ) : matchUmpires.length === 0 ? (
                <EmptyState message="No match umpires assigned to this fixture." icon={UserCheck} />
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Official Name</th>
                        <th>Officiating Role</th>
                        <th>Nationality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchUmpires.map((ump, idx) => (
                        <tr key={ump.umpire_id || idx}>
                          <td className="text-primary">{ump.umpire_name}</td>
                          <td>
                            <Badge variant="info" label={ump.role || 'On-Field'} />
                          </td>
                          <td>{ump.nationality}</td>
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteMatch}
        title="Delete Match Fixture"
        message="Are you sure you want to delete this match fixture? All associated innings and performance records will also be permanently removed."
        loading={submitting}
      />
    </div>
  );
};

export default Matches;
