import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Trophy,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { awardsAPI, seasonsAPI, playersAPI } from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchFilter from '../components/SearchFilter';
import FormField from '../components/FormField';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const initialAwardForm = {
  award_name: '',
  award_type: 'Overall',
  description: '',
  season_id: '',
};

const initialAssignForm = {
  player_id: '',
  season_id: '',
  awarded_on: new Date().toISOString().split('T')[0],
};

const awardTypeOptions = [
  { label: 'Batting (Orange Cap)', value: 'Batting' },
  { label: 'Bowling (Purple Cap)', value: 'Bowling' },
  { label: 'Fielding', value: 'Fielding' },
  { label: 'Overall (MVP)', value: 'Overall' },
  { label: 'Team Fairplay', value: 'Team' },
  { label: 'Special / Emerging', value: 'Special' },
];

const Awards = () => {
  const [awards, setAwards] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAward, setSelectedAward] = useState(null);
  const [awardWinners, setAwardWinners] = useState([]);
  const [loadingWinners, setLoadingWinners] = useState(false);

  // Forms
  const [formData, setFormData] = useState(initialAwardForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Assign award form
  const [assignData, setAssignData] = useState(initialAssignForm);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [awardsRes, seasonsRes, playersRes] = await Promise.allSettled([
        awardsAPI.getAll(),
        seasonsAPI.getAll(),
        playersAPI.getAll(),
      ]);

      if (awardsRes.status === 'fulfilled' && awardsRes.value?.data) {
        setAwards(awardsRes.value.data.data || awardsRes.value.data || []);
      }
      if (seasonsRes.status === 'fulfilled' && seasonsRes.value?.data) {
        setSeasons(seasonsRes.value.data.data || seasonsRes.value.data || []);
      }
      if (playersRes.status === 'fulfilled' && playersRes.value?.data) {
        setPlayers(playersRes.value.data.data || playersRes.value.data || []);
      }
    } catch (error) {
      toast.error('Failed to load awards catalog');
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
    setSelectedAward(null);
    setFormData(initialAwardForm);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (award) => {
    setSelectedAward(award);
    setFormData({
      award_name: award.award_name || '',
      award_type: award.award_type || 'Overall',
      description: award.description || '',
      season_id: award.season_id || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const loadWinners = async (awardId) => {
    setLoadingWinners(true);
    try {
      const res = await awardsAPI.getWinners(awardId);
      setAwardWinners(res.data.data || res.data || []);
    } catch (err) {
      setAwardWinners([]);
    } finally {
      setLoadingWinners(false);
    }
  };

  const handleOpenView = (award) => {
    setSelectedAward(award);
    setAssignData({
      player_id: '',
      season_id: award.season_id || seasons[0]?.season_id || '',
      awarded_on: new Date().toISOString().split('T')[0],
    });
    setIsViewOpen(true);
    loadWinners(award.award_id);
  };

  const handleOpenDelete = (award) => {
    setSelectedAward(award);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.award_name.trim()) errors.award_name = 'Award name is required';
    if (!formData.award_type) errors.award_type = 'Award type is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAward = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        season_id: formData.season_id ? Number(formData.season_id) : null,
      };

      if (selectedAward) {
        await awardsAPI.update(selectedAward.award_id, payload);
        toast.success(`Award "${formData.award_name}" updated!`);
      } else {
        await awardsAPI.create(payload);
        toast.success(`Award "${formData.award_name}" created!`);
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAward = async () => {
    if (!selectedAward) return;
    setSubmitting(true);
    try {
      await awardsAPI.delete(selectedAward.award_id);
      toast.success(`Award "${selectedAward.award_name}" removed.`);
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete award');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignAward = async (e) => {
    e.preventDefault();
    if (!assignData.player_id) {
      toast.error('Please select a player to confer the award');
      return;
    }
    if (!assignData.season_id) {
      toast.error('Please select the season year');
      return;
    }

    setAssignSubmitting(true);
    try {
      const payload = {
        player_id: Number(assignData.player_id),
        season_id: Number(assignData.season_id),
        awarded_on: assignData.awarded_on || null,
      };
      await awardsAPI.assignAward(selectedAward.award_id, payload);
      toast.success('Award conferred upon player successfully!');
      setAssignData({ ...assignData, player_id: '' });
      loadWinners(selectedAward.award_id);
    } catch (error) {
      toast.error(error.message || 'Failed to assign award');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const filteredAwards = awards.filter((a) => {
    const matchesSearch =
      a.award_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter ? a.award_type === typeFilter : true;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredAwards.length / itemsPerPage);
  const paginatedAwards = filteredAwards.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getBadgeVariant = (type) => {
    switch (type) {
      case 'Batting':
        return 'warning';
      case 'Bowling':
        return 'purple';
      case 'Overall':
        return 'success';
      case 'Special':
        return 'info';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      key: 'award_name',
      label: 'Award Honor',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={16} color="var(--accent-primary)" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.award_name}</span>
        </div>
      ),
    },
    {
      key: 'award_type',
      label: 'Category',
      render: (val) => <Badge variant={getBadgeVariant(val)} label={val} />,
    },
    {
      key: 'season_year',
      label: 'Season Edition',
      render: (val, row) => {
        const s = seasons.find((season) => season.season_id === row.season_id);
        return val ? `Season ${val}` : s ? `Season ${s.season_year}` : 'Annual / All Seasons';
      },
    },
    {
      key: 'description',
      label: 'Criteria & Description',
      render: (val) => (
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {val || 'Prestigious tournament award'}
        </span>
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
            className="btn-icon primary"
            onClick={() => handleOpenView(row)}
            title="View Winners & Confer Award"
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => handleOpenEdit(row)}
            title="Edit Award"
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            className="btn-icon danger"
            onClick={() => handleOpenDelete(row)}
            title="Delete Award"
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Tournament Awards & Honors</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Orange Cap, Purple Cap, MVP, Fairplay, and seasonal individual player accolades.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Create New Award</span>
        </button>
      </div>

      {/* Filter and Search */}
      <SearchFilter
        value={searchTerm}
        onChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        placeholder="Search awards by title or description..."
        filters={[
          {
            key: 'type',
            label: 'All Categories',
            options: awardTypeOptions,
            value: typeFilter,
          },
        ]}
        onFilterChange={(_, val) => {
          setTypeFilter(val);
          setCurrentPage(1);
        }}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={paginatedAwards}
        loading={loading}
        emptyMessage="No tournament awards found matching your criteria."
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Add / Edit Award Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedAward ? `Edit Award: ${selectedAward.award_name}` : 'Create Tournament Award'}
        size="md"
      >
        <form onSubmit={handleSaveAward}>
          <FormField label="Award Title / Name" error={formErrors.award_name} required>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Orange Cap (Leading Run Scorer)"
              value={formData.award_name}
              onChange={(e) => setFormData({ ...formData, award_name: e.target.value })}
            />
          </FormField>

          <div className="form-row">
            <FormField label="Award Category" error={formErrors.award_type} required>
              <select
                className="form-control"
                value={formData.award_type}
                onChange={(e) => setFormData({ ...formData, award_type: e.target.value })}
              >
                {awardTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Tournament Season">
              <select
                className="form-control"
                value={formData.season_id}
                onChange={(e) => setFormData({ ...formData, season_id: e.target.value })}
              >
                <option value="">All Seasons / Perpetual</option>
                {seasons.map((s) => (
                  <option key={s.season_id} value={s.season_id}>
                    Season {s.season_year}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Award Description / Qualifying Criteria">
            <textarea
              className="form-control"
              placeholder="e.g. Awarded to the highest run-scorer throughout the IPL season tournament."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              {submitting ? 'Saving...' : selectedAward ? 'Update Award' : 'Save Award'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Award & Assign Player Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={selectedAward ? `${selectedAward.award_name}` : 'Award Details'}
        size="lg"
      >
        {selectedAward && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedAward.award_name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {selectedAward.description || 'Tournament accolade honors exceptional cricket prowess.'}
                </p>
              </div>
              <Badge variant={getBadgeVariant(selectedAward.award_type)} label={selectedAward.award_type} />
            </div>

            {/* Winners List */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={18} color="#facc15" />
                Past Recipients & Winners ({awardWinners.length})
              </h4>

              {loadingWinners ? (
                <LoadingSpinner message="Fetching recipients..." />
              ) : awardWinners.length === 0 ? (
                <EmptyState message="No players have been conferred this honor yet." icon={Award} />
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Player Name</th>
                        <th>Franchise Team</th>
                        <th>Season</th>
                        <th>Awarded Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {awardWinners.map((w, idx) => (
                        <tr key={w.id || idx}>
                          <td className="text-primary">{w.player_name}</td>
                          <td>{w.team_name || 'Free Agent'}</td>
                          <td>
                            <Badge variant="purple" label={`Season ${w.season_year || ''}`} />
                          </td>
                          <td>{w.awarded_on ? new Date(w.awarded_on).toLocaleDateString() : 'Official Ceremony'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Assign Award to Player Form */}
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'rgba(249, 115, 22, 0.05)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '1rem' }}>
                🏆 Confer Award upon Player
              </h4>
              <form onSubmit={handleAssignAward}>
                <div className="form-row">
                  <FormField label="Recipient Player" required>
                    <select
                      className="form-control"
                      value={assignData.player_id}
                      onChange={(e) => setAssignData({ ...assignData, player_id: e.target.value })}
                    >
                      <option value="">Select Recipient Player</option>
                      {players.map((p) => (
                        <option key={p.player_id} value={p.player_id}>
                          {p.player_name} ({p.team_name || 'Free Agent'})
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Season Edition" required>
                    <select
                      className="form-control"
                      value={assignData.season_id}
                      onChange={(e) => setAssignData({ ...assignData, season_id: e.target.value })}
                    >
                      <option value="">Select Season</option>
                      {seasons.map((s) => (
                        <option key={s.season_id} value={s.season_id}>
                          Season {s.season_year}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div className="form-row">
                  <FormField label="Conferral Date">
                    <input
                      type="date"
                      className="form-control"
                      value={assignData.awarded_on}
                      onChange={(e) => setAssignData({ ...assignData, awarded_on: e.target.value })}
                    />
                  </FormField>
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '1.25rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={assignSubmitting}>
                      {assignSubmitting ? 'Conferring...' : 'Confer Award'}
                    </button>
                  </div>
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
        onConfirm={handleDeleteAward}
        title="Delete Award"
        message={`Are you sure you want to remove the "${selectedAward?.award_name}" award? Historical player honors may be erased.`}
        loading={submitting}
      />
    </div>
  );
};

export default Awards;
