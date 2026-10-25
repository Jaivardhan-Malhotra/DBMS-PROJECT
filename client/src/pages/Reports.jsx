import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Shield,
  Zap,
  Target,
  MapPin,
  Calendar,
  Trophy,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsAPI } from '../services/api';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('team-stats');
  const [loading, setLoading] = useState(false);

  // Tab Data States
  const [teamStats, setTeamStats] = useState([]);
  const [topBatsmen, setTopBatsmen] = useState([]);
  const [topBowlers, setTopBowlers] = useState([]);
  const [venueStats, setVenueStats] = useState([]);
  const [seasonSummary, setSeasonSummary] = useState([]);
  const [pomAwards, setPomAwards] = useState([]);

  const loadTabData = useCallback(async (tabKey) => {
    setLoading(true);
    try {
      if (tabKey === 'team-stats') {
        const res = await reportsAPI.getTeamStats();
        setTeamStats(res.data.data || res.data || []);
      } else if (tabKey === 'top-batsmen') {
        const res = await reportsAPI.getTopBatsmen();
        setTopBatsmen(res.data.data || res.data || []);
      } else if (tabKey === 'top-bowlers') {
        const res = await reportsAPI.getTopBowlers();
        setTopBowlers(res.data.data || res.data || []);
      } else if (tabKey === 'venue-stats') {
        const res = await reportsAPI.getVenueStats();
        setVenueStats(res.data.data || res.data || []);
      } else if (tabKey === 'season-summary') {
        const res = await reportsAPI.getSeasonSummary();
        setSeasonSummary(res.data.data || res.data || []);
      } else if (tabKey === 'pom-awards') {
        const res = await reportsAPI.getPomAwards();
        setPomAwards(res.data.data || res.data || []);
      }
    } catch (error) {
      console.error(`Failed to load reports for ${tabKey}:`, error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTabData(activeTab);

    const handleRefresh = () => loadTabData(activeTab);
    window.addEventListener('ipl-data-refresh', handleRefresh);
    return () => window.removeEventListener('ipl-data-refresh', handleRefresh);
  }, [activeTab, loadTabData]);

  const tabs = [
    { key: 'team-stats', label: 'Team Stats', icon: Shield },
    { key: 'top-batsmen', label: 'Top Batsmen', icon: Zap },
    { key: 'top-bowlers', label: 'Top Bowlers', icon: Target },
    { key: 'venue-stats', label: 'Venue Stats', icon: MapPin },
    { key: 'season-summary', label: 'Season Summary', icon: Calendar },
    { key: 'pom-awards', label: 'Player of Match', icon: Trophy },
  ];

  // Column definitions for each report tab
  const teamColumns = [
    {
      key: 'team_name',
      label: 'Franchise Team',
      render: (val, row) => (
        <span className="text-primary">
          {val} {row.short_name ? `(${row.short_name})` : ''}
        </span>
      ),
    },
    { key: 'city', label: 'City' },
    {
      key: 'player_count',
      label: 'Squad Size',
      render: (val, row) => val || row.total_players || 0,
    },
    {
      key: 'matches_played',
      label: 'Matches Played',
      render: (val) => val || 0,
    },
    {
      key: 'win_count',
      label: 'Victories',
      render: (val, row) => {
        const wins = val || row.total_wins || 0;
        return <span style={{ fontWeight: 700, color: 'var(--success)' }}>{wins}</span>;
      },
    },
    {
      key: 'win_percentage',
      label: 'Win Rate',
      render: (_, row) => {
        const played = Number(row.matches_played || 0);
        const wins = Number(row.win_count || row.total_wins || 0);
        const rate = played > 0 ? ((wins / played) * 100).toFixed(1) : '0.0';
        return <Badge variant={Number(rate) > 50 ? 'success' : 'default'} label={`${rate}%`} />;
      },
    },
  ];

  const batsmenColumns = [
    {
      key: 'rank',
      label: 'Rank',
      render: (_, __, idx) => `#${idx + 1}`,
    },
    {
      key: 'player_name',
      label: 'Player Name',
      className: 'text-primary',
    },
    {
      key: 'team_name',
      label: 'Franchise Team',
      render: (val, row) => val || row.short_name || 'Free Agent',
    },
    {
      key: 'total_runs',
      label: 'Total Runs Scored',
      render: (val, row) => (
        <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1rem' }}>
          {Number(val || row.runs_scored || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'fours',
      label: '4s',
      render: (val) => val || 0,
    },
    {
      key: 'sixes',
      label: '6s',
      render: (val) => val || 0,
    },
    {
      key: 'strike_rate',
      label: 'Strike Rate',
      render: (val, row) => {
        if (val) return `${Number(val).toFixed(2)}`;
        const runs = Number(row.total_runs || row.runs_scored || 0);
        const balls = Number(row.balls_faced || 1);
        return ((runs / balls) * 100).toFixed(2);
      },
    },
  ];

  const bowlersColumns = [
    {
      key: 'rank',
      label: 'Rank',
      render: (_, __, idx) => `#${idx + 1}`,
    },
    {
      key: 'player_name',
      label: 'Bowler Name',
      className: 'text-primary',
    },
    {
      key: 'team_name',
      label: 'Franchise Team',
      render: (val, row) => val || row.short_name || 'Free Agent',
    },
    {
      key: 'wickets_taken',
      label: 'Total Wickets',
      render: (val, row) => (
        <span style={{ fontWeight: 700, color: 'var(--accent-secondary)', fontSize: '1.05rem' }}>
          {Number(val || row.total_wickets || 0)}
        </span>
      ),
    },
    {
      key: 'overs_bowled',
      label: 'Overs Bowled',
      render: (val) => val || '0.0',
    },
    {
      key: 'economy_rate',
      label: 'Economy',
      render: (val, row) => {
        if (val) return `${Number(val).toFixed(2)}`;
        const runs = Number(row.runs_conceded || 0);
        const overs = Number(row.overs_bowled || 1);
        return overs > 0 ? (runs / overs).toFixed(2) : '-';
      },
    },
  ];

  const venueColumns = [
    {
      key: 'venue_name',
      label: 'Stadium',
      className: 'text-primary',
    },
    {
      key: 'city',
      label: 'City',
      render: (val, row) => `${val}${row.country && row.country !== 'India' ? `, ${row.country}` : ''}`,
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (val) => (val ? Number(val).toLocaleString() : 'N/A'),
    },
    {
      key: 'pitch_type',
      label: 'Pitch Type',
      render: (val) => <Badge variant="purple" label={val || 'Balanced'} />,
    },
    {
      key: 'match_count',
      label: 'Matches Hosted',
      render: (val, row) => (
        <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
          {val || row.total_matches || 0}
        </span>
      ),
    },
  ];

  const seasonColumns = [
    {
      key: 'season_year',
      label: 'Season',
      render: (val) => <strong style={{ color: 'var(--accent-primary)' }}>IPL {val}</strong>,
    },
    {
      key: 'host_country',
      label: 'Host Country',
    },
    {
      key: 'total_matches',
      label: 'Matches Played',
      render: (val) => val || 0,
    },
    {
      key: 'champion_name',
      label: 'Champion',
      render: (val, row) =>
        val
          ? <span style={{ fontWeight: 700, color: 'var(--warning)' }}>🏆 {val} ({row.champion_short || ''})</span>
          : <span style={{ color: 'var(--text-muted)' }}>TBD</span>,
    },
    {
      key: 'runner_up_name',
      label: 'Runner-Up',
      render: (val, row) =>
        val
          ? `${val} (${row.runner_up_short || ''})`
          : <span style={{ color: 'var(--text-muted)' }}>TBD</span>,
    },
  ];

  const pomColumns = [
    {
      key: 'rank',
      label: 'Rank',
      render: (_, __, idx) => `#${idx + 1}`,
    },
    {
      key: 'player_name',
      label: 'Player Name',
      className: 'text-primary',
    },
    {
      key: 'team_name',
      label: 'Franchise Team',
      render: (val, row) => val || row.short_name || 'Free Agent',
    },
    {
      key: 'pom_count',
      label: 'PoM Awards',
      render: (val, row) => (
        <span style={{ fontWeight: 700, color: '#facc15', fontSize: '1.05rem' }}>
          🏅 {val || row.award_count || 0} Awards
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Analytics & Performance Reports</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Comprehensive tournament data aggregates, leaderboards, and stadium metrics.
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <div className="tabs-nav" style={{ borderBottom: 'none' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={17} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      {loading ? (
        <LoadingSpinner message="Calculating analytics and aggregates..." />
      ) : (
        <div className="animate-fade-in">
          {activeTab === 'team-stats' && (
            <DataTable
              columns={teamColumns}
              data={teamStats}
              emptyMessage="No team statistics available."
            />
          )}

          {activeTab === 'top-batsmen' && (
            <DataTable
              columns={batsmenColumns}
              data={topBatsmen}
              emptyMessage="No batting leaderboard data available."
            />
          )}

          {activeTab === 'top-bowlers' && (
            <DataTable
              columns={bowlersColumns}
              data={topBowlers}
              emptyMessage="No bowling leaderboard data available."
            />
          )}

          {activeTab === 'venue-stats' && (
            <DataTable
              columns={venueColumns}
              data={venueStats}
              emptyMessage="No venue statistics available."
            />
          )}

          {activeTab === 'season-summary' && (
            <DataTable
              columns={seasonColumns}
              data={seasonSummary}
              emptyMessage="No season historical summary available."
            />
          )}

          {activeTab === 'pom-awards' && (
            <DataTable
              columns={pomColumns}
              data={pomAwards}
              emptyMessage="No Player of the Match awards recorded."
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
