import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Users,
  Compass,
  Calendar,
  Swords,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { venuesAPI } from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchFilter from '../components/SearchFilter';
import FormField from '../components/FormField';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const initialVenueForm = {
  venue_name: '',
  city: '',
  country: 'India',
  capacity: '',
  pitch_type: 'Batting Friendly',
  established_year: 1980,
};

const pitchTypeOptions = [
  { label: 'Batting Friendly', value: 'Batting Friendly' },
  { label: 'Bowling Friendly (Pace)', value: 'Bowling Friendly (Pace)' },
  { label: 'Spin Friendly', value: 'Spin Friendly' },
  { label: 'Balanced', value: 'Balanced' },
];

const Venues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pitchFilter, setPitchFilter] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [venueMatches, setVenueMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Form
  const [formData, setFormData] = useState(initialVenueForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true);
      const res = await venuesAPI.getAll();
      setVenues(res.data.data || res.data || []);
    } catch (error) {
      toast.error('Failed to load venue stadiums');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
    const handleRefresh = () => fetchVenues();
    window.addEventListener('ipl-data-refresh', handleRefresh);
    return () => window.removeEventListener('ipl-data-refresh', handleRefresh);
  }, [fetchVenues]);

  const handleOpenAdd = () => {
    setSelectedVenue(null);
    setFormData(initialVenueForm);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (venue) => {
    setSelectedVenue(venue);
    setFormData({
      venue_name: venue.venue_name || '',
      city: venue.city || '',
      country: venue.country || 'India',
      capacity: venue.capacity ?? '',
      pitch_type: venue.pitch_type || 'Batting Friendly',
      established_year: venue.established_year || 1980,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenView = async (venue) => {
    setSelectedVenue(venue);
    setIsViewOpen(true);
    setLoadingMatches(true);
    try {
      const res = await venuesAPI.getMatches(venue.venue_id);
      setVenueMatches(res.data.data || res.data || []);
    } catch (err) {
      setVenueMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleOpenDelete = (venue) => {
    setSelectedVenue(venue);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.venue_name.trim()) errors.venue_name = 'Venue name is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (formData.capacity && Number(formData.capacity) <= 0) {
      errors.capacity = 'Capacity must be greater than 0';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveVenue = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        capacity: formData.capacity ? Number(formData.capacity) : null,
        established_year: formData.established_year ? Number(formData.established_year) : null,
      };

      if (selectedVenue) {
        await venuesAPI.update(selectedVenue.venue_id, payload);
        toast.success(`Venue "${formData.venue_name}" updated!`);
      } else {
        await venuesAPI.create(payload);
        toast.success(`Venue "${formData.venue_name}" created!`);
      }
      setIsFormOpen(false);
      fetchVenues();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVenue = async () => {
    if (!selectedVenue) return;
    setSubmitting(true);
    try {
      await venuesAPI.delete(selectedVenue.venue_id);
      toast.success(`Stadium "${selectedVenue.venue_name}" deleted.`);
      setIsDeleteOpen(false);
      fetchVenues();
    } catch (error) {
      toast.error(error.message || 'Failed to delete stadium');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVenues = venues.filter((venue) => {
    const matchesSearch =
      venue.venue_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.country?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPitch = pitchFilter ? venue.pitch_type === pitchFilter : true;
    return matchesSearch && matchesPitch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Stadiums & Venues</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            International and domestic cricket grounds, pitch characteristics, and seating capacities.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add New Venue</span>
        </button>
      </div>

      {/* Filter and Search */}
      <SearchFilter
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search venues by stadium name, city, or country..."
        filters={[
          {
            key: 'pitch',
            label: 'All Pitch Types',
            options: pitchTypeOptions,
            value: pitchFilter,
          },
        ]}
        onFilterChange={(_, val) => setPitchFilter(val)}
      />

      {loading ? (
        <LoadingSpinner message="Loading venues..." />
      ) : filteredVenues.length === 0 ? (
        <EmptyState
          message="No venues match your criteria."
          icon={MapPin}
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              Add Venue
            </button>
          }
        />
      ) : (
        <div className="grid-3">
          {filteredVenues.map((venue) => (
            <div key={venue.venue_id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <Badge variant="purple" label={venue.pitch_type || 'Cricket Ground'} />
                  {venue.match_count !== undefined && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {venue.match_count} Matches Hosted
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  {venue.venue_name}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={15} color="var(--accent-primary)" />
                    <span>{venue.city}, {venue.country}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={15} color="var(--accent-secondary)" />
                    <span>Capacity: {venue.capacity ? Number(venue.capacity).toLocaleString() : 'N/A'} seats</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={15} color="var(--text-muted)" />
                    <span>Est: {venue.established_year || 'Historical'}</span>
                  </div>
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
                  onClick={() => handleOpenView(venue)}
                  title="View Stadium Matches"
                >
                  <Eye size={16} />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => handleOpenEdit(venue)}
                  title="Edit Stadium"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  className="btn-icon danger"
                  onClick={() => handleOpenDelete(venue)}
                  title="Delete Stadium"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Venue Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedVenue ? `Edit Venue: ${selectedVenue.venue_name}` : 'Register New Stadium'}
        size="md"
      >
        <form onSubmit={handleSaveVenue}>
          <FormField label="Stadium / Ground Name" error={formErrors.venue_name} required>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Wankhede Stadium"
              value={formData.venue_name}
              onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
            />
          </FormField>

          <div className="form-row">
            <FormField label="City" error={formErrors.city} required>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Mumbai"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </FormField>
            <FormField label="Country">
              <input
                type="text"
                className="form-control"
                placeholder="India"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Seating Capacity" error={formErrors.capacity}>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 33000"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </FormField>
            <FormField label="Pitch Surface / Condition">
              <select
                className="form-control"
                value={formData.pitch_type}
                onChange={(e) => setFormData({ ...formData, pitch_type: e.target.value })}
              >
                {pitchTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Established Year">
            <input
              type="number"
              className="form-control"
              placeholder="1974"
              value={formData.established_year}
              onChange={(e) => setFormData({ ...formData, established_year: e.target.value })}
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
              {submitting ? 'Saving...' : selectedVenue ? 'Update Stadium' : 'Add Stadium'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Venue Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={selectedVenue ? `${selectedVenue.venue_name} - Fixture History` : 'Venue Details'}
        size="lg"
      >
        {selectedVenue && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{selectedVenue.venue_name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  📍 {selectedVenue.city}, {selectedVenue.country}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Badge variant="info" label={selectedVenue.pitch_type || 'Balanced'} />
                <Badge
                  variant="default"
                  label={`Capacity: ${selectedVenue.capacity ? Number(selectedVenue.capacity).toLocaleString() : 'N/A'}`}
                />
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Swords size={16} color="var(--accent-primary)" />
                Matches Played Here ({venueMatches.length})
              </h4>

              {loadingMatches ? (
                <LoadingSpinner message="Fetching matches at this venue..." />
              ) : venueMatches.length === 0 ? (
                <EmptyState message="No recorded matches played at this stadium." icon={Swords} />
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Teams</th>
                        <th>Winner</th>
                        <th>Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {venueMatches.map((m) => (
                        <tr key={m.match_id}>
                          <td>{new Date(m.match_date).toLocaleDateString()}</td>
                          <td className="text-primary">
                            {m.team1_short || m.team1_name} vs {m.team2_short || m.team2_name}
                          </td>
                          <td>
                            {m.winner_name ? (
                              <span style={{ color: 'var(--success)', fontWeight: 600 }}>🏆 {m.winner_name}</span>
                            ) : (
                              m.status
                            )}
                          </td>
                          <td>{m.win_margin ? `${m.win_margin} ${m.win_type || 'Runs'}` : '-'}</td>
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
        onConfirm={handleDeleteVenue}
        title="Delete Stadium"
        message={`Are you sure you want to delete "${selectedVenue?.venue_name}"? Scheduled fixtures linked to this stadium may be affected.`}
        loading={submitting}
      />
    </div>
  );
};

export default Venues;
