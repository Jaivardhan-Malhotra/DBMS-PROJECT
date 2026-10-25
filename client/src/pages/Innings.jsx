import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Plus,
  Edit2,
  Trash2,
  Swords,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { inningsAPI, matchesAPI, teamsAPI } from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchFilter from '../components/SearchFilter';
import FormField from '../components/FormField';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';

const initialInningsForm = {
  match_id: '',
  innings_no: 1,
  batting_team_id: '',
  bowling_team_id: '',
  total_runs: 0,
  total_wickets: 0,
  total_overs: 20.0,
  extras: 0,
  is_completed: 1,
};

const Innings = () => {
  const [innings, setInnings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [matchFilter, setMatchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedInnings, setSelectedInnings] = useState(null);

  // Form
  const [formData, setFormData] = useState(initialInningsForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [inningsRes, matchesRes, teamsRes] = await Promise.allSettled([
        inningsAPI.getAll(),
        matchesAPI.getAll(),
        teamsAPI.getAll(),
      ]);

      if (inningsRes.status === 'fulfilled' && inningsRes.value?.data) {
        setInnings(inningsRes.value.data.data || inningsRes.value.data || []);
      }
      if (matchesRes.status === 'fulfilled' && matchesRes.value?.data) {
        setMatches(matchesRes.value.data.data || matchesRes.value.data || []);
      }
      if (teamsRes.status === 'fulfilled' && teamsRes.value?.data) {
        setTeams(teamsRes.value.data.data || teamsRes.value.data || []);
      }
    } catch (error) {
      toast.error('Failed to load innings scorecards');
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
    setSelectedInnings(null);
    setFormData({
      ...initialInningsForm,
      match_id: matches[0]?.match_id || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedInnings(item);
    setFormData({
      match_id: item.match_id || '',
      innings_no: item.innings_no || 1,
      batting_team_id: item.batting_team_id || '',
      bowling_team_id: item.bowling_team_id || '',
      total_runs: item.total_runs ?? 0,
      total_wickets: item.total_wickets ?? 0,
      total_overs: item.total_overs ?? 20.0,
      extras: item.extras ?? 0,
      is_completed: item.is_completed !== undefined ? Number(item.is_completed) : 1,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenDelete = (item) => {
    setSelectedInnings(item);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.match_id) errors.match_id = 'Match fixture is required';
    if (!formData.batting_team_id) errors.batting_team_id = 'Batting team is required';
    if (!formData.bowling_team_id) errors.bowling_team_id = 'Bowling team is required';
    if (formData.batting_team_id && formData.bowling_team_id && formData.batting_team_id === formData.bowling_team_id) {
      errors.bowling_team_id = 'Batting and bowling teams must differ';
    }
    if (formData.total_wickets < 0 || formData.total_wickets > 10) {
      errors.total_wickets = 'Wickets fallen must be between 0 and 10';
    }
    if (formData.total_overs < 0 || formData.total_overs > 20.0) {
      errors.total_overs = 'T20 innings overs cannot exceed 20.0';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveInnings = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        match_id: Number(formData.match_id),
        innings_no: Number(formData.innings_no),
        batting_team_id: Number(formData.batting_team_id),
        bowling_team_id: Number(formData.bowling_team_id),
        total_runs: Number(formData.total_runs),
        total_wickets: Number(formData.total_wickets),
        total_overs: Number(formData.total_overs),
        extras: Number(formData.extras || 0),
        is_completed: Number(formData.is_completed),
      };

      if (selectedInnings) {
        await inningsAPI.update(selectedInnings.innings_id, payload);
        toast.success(`Innings #${formData.innings_no} updated!`);
      } else {
        await inningsAPI.create(payload);
        toast.success(`Innings #${formData.innings_no} recorded!`);
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInnings = async () => {
    if (!selectedInnings) return;
    setSubmitting(true);
    try {
      await inningsAPI.delete(selectedInnings.innings_id);
      toast.success('Innings record removed.');
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete innings');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInnings = innings.filter((inn) => {
    const matchesMatch = matchFilter ? String(inn.match_id) === String(matchFilter) : true;
    return matchesMatch;
  });

  const totalPages = Math.ceil(filteredInnings.length / itemsPerPage);
  const paginatedInnings = filteredInnings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const matchOptions = matches.map((m) => {
    const t1 = teams.find((t) => t.team_id === m.team1_id)?.short_name || m.team1_short || m.team1_name || 'T1';
    const t2 = teams.find((t) => t.team_id === m.team2_id)?.short_name || m.team2_short || m.team2_name || 'T2';
    return {
      label: `Match #${m.match_id}: ${t1} vs ${t2} (${new Date(m.match_date).toLocaleDateString()})`,
      value: String(m.match_id),
    };
  });

  const columns = [
    {
      key: 'match_id',
      label: 'Fixture Match',
      render: (_, row) => {
        const m = matches.find((match) => match.match_id === row.match_id);
        if (m) {
          const t1 = teams.find((t) => t.team_id === m.team1_id)?.short_name || m.team1_short || 'Team 1';
          const t2 = teams.find((t) => t.team_id === m.team2_id)?.short_name || m.team2_short || 'Team 2';
          return (
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {t1} vs {t2}
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Match #{m.match_id} &bull; {new Date(m.match_date).toLocaleDateString()}
              </div>
            </div>
          );
        }
        return `Match #${row.match_id}`;
      },
    },
    {
      key: 'innings_no',
      label: 'Innings',
      render: (val) => <Badge variant="purple" label={`Innings ${val}`} />,
    },
    {
      key: 'batting_team_name',
      label: 'Batting Team',
      render: (val, row) => {
        const teamObj = teams.find((t) => t.team_id === row.batting_team_id);
        return <span className="text-primary">{val || teamObj?.team_name || `Team ${row.batting_team_id}`}</span>;
      },
    },
    {
      key: 'bowling_team_name',
      label: 'Bowling Team',
      render: (val, row) => {
        const teamObj = teams.find((t) => t.team_id === row.bowling_team_id);
        return val || teamObj?.team_name || `Team ${row.bowling_team_id}`;
      },
    },
    {
      key: 'score',
      label: 'Score (R/W)',
      render: (_, row) => (
        <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1rem' }}>
          {row.total_runs} / {row.total_wickets}
        </span>
      ),
    },
    {
      key: 'total_overs',
      label: 'Overs Bowled',
      render: (val) => `${val || 0} ov`,
    },
    {
      key: 'extras',
      label: 'Extras',
      render: (val) => val || 0,
    },
    {
      key: 'is_completed',
      label: 'Status',
      render: (val) => (
        <Badge
          variant={Number(val) === 1 ? 'success' : 'warning'}
          label={Number(val) === 1 ? 'Closed' : 'In-Progress'}
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
            title="Edit Innings Score"
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            className="btn-icon danger"
            onClick={() => handleOpenDelete(row)}
            title="Delete Innings"
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Innings Scorecards</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Record and calibrate team innings scores, wickets fallen, overs bowled, and extras.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Record Innings</span>
        </button>
      </div>

      {/* Filter Bar */}
      <SearchFilter
        value=""
        onChange={() => {}}
        placeholder="Filter by match fixture..."
        filters={[
          {
            key: 'match',
            label: 'All Fixtures',
            options: matchOptions,
            value: matchFilter,
          },
        ]}
        onFilterChange={(_, val) => {
          setMatchFilter(val);
          setCurrentPage(1);
        }}
      />

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={paginatedInnings}
        loading={loading}
        emptyMessage="No recorded innings scorecards found."
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Add / Edit Innings Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedInnings ? `Edit Innings #${selectedInnings.innings_no}` : 'Record New Match Innings'}
        size="md"
      >
        <form onSubmit={handleSaveInnings}>
          <FormField label="Match Fixture" error={formErrors.match_id} required>
            <select
              className="form-control"
              value={formData.match_id}
              onChange={(e) => setFormData({ ...formData, match_id: e.target.value })}
            >
              <option value="">Select Match</option>
              {matches.map((m) => {
                const t1 = teams.find((t) => t.team_id === m.team1_id)?.short_name || m.team1_short || 'T1';
                const t2 = teams.find((t) => t.team_id === m.team2_id)?.short_name || m.team2_short || 'T2';
                return (
                  <option key={m.match_id} value={m.match_id}>
                    Match #{m.match_id}: {t1} vs {t2} ({new Date(m.match_date).toLocaleDateString()})
                  </option>
                );
              })}
            </select>
          </FormField>

          <div className="form-row">
            <FormField label="Innings Number" required>
              <select
                className="form-control"
                value={formData.innings_no}
                onChange={(e) => setFormData({ ...formData, innings_no: e.target.value })}
              >
                <option value="1">1st Innings</option>
                <option value="2">2nd Innings</option>
                <option value="3">Super Over (1)</option>
                <option value="4">Super Over (2)</option>
              </select>
            </FormField>
            <FormField label="Innings Status">
              <select
                className="form-control"
                value={formData.is_completed}
                onChange={(e) => setFormData({ ...formData, is_completed: e.target.value })}
              >
                <option value="1">Completed / All Out</option>
                <option value="0">In-Play</option>
              </select>
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Batting Franchise" error={formErrors.batting_team_id} required>
              <select
                className="form-control"
                value={formData.batting_team_id}
                onChange={(e) => setFormData({ ...formData, batting_team_id: e.target.value })}
              >
                <option value="">Select Batting Team</option>
                {teams.map((t) => (
                  <option key={t.team_id} value={t.team_id}>
                    {t.team_name} ({t.short_name})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Bowling Franchise" error={formErrors.bowling_team_id} required>
              <select
                className="form-control"
                value={formData.bowling_team_id}
                onChange={(e) => setFormData({ ...formData, bowling_team_id: e.target.value })}
              >
                <option value="">Select Bowling Team</option>
                {teams.map((t) => (
                  <option key={t.team_id} value={t.team_id}>
                    {t.team_name} ({t.short_name})
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Total Runs">
              <input
                type="number"
                min="0"
                className="form-control"
                value={formData.total_runs}
                onChange={(e) => setFormData({ ...formData, total_runs: e.target.value })}
              />
            </FormField>
            <FormField label="Wickets Fallen (0-10)" error={formErrors.total_wickets}>
              <input
                type="number"
                min="0"
                max="10"
                className="form-control"
                value={formData.total_wickets}
                onChange={(e) => setFormData({ ...formData, total_wickets: e.target.value })}
              />
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Overs Bowled (e.g. 20.0)" error={formErrors.total_overs}>
              <input
                type="number"
                step="0.1"
                min="0"
                max="20.0"
                className="form-control"
                value={formData.total_overs}
                onChange={(e) => setFormData({ ...formData, total_overs: e.target.value })}
              />
            </FormField>
            <FormField label="Extras (Wides, No-balls, Byes)">
              <input
                type="number"
                min="0"
                className="form-control"
                value={formData.extras}
                onChange={(e) => setFormData({ ...formData, extras: e.target.value })}
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
              {submitting ? 'Saving...' : selectedInnings ? 'Update Innings' : 'Save Innings'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteInnings}
        title="Delete Innings Scorecard"
        message="Are you sure you want to remove this innings scorecard from the tournament database?"
        loading={submitting}
      />
    </div>
  );
};

export default Innings;
