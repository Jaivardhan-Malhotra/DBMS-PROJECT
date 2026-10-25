const pool = require('../config/database');

/**
 * Controller for Dashboard metrics and overview statistics
 */

// GET /api/dashboard - Summary statistics, recent matches, upcoming matches, and top teams
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Total counts across all key entities
    const countsQuery = `
      SELECT
        (SELECT COUNT(*) FROM teams) AS total_teams,
        (SELECT COUNT(*) FROM players) AS total_players,
        (SELECT COUNT(*) FROM matches) AS total_matches,
        (SELECT COUNT(*) FROM seasons) AS total_seasons,
        (SELECT COUNT(*) FROM venues) AS total_venues,
        (SELECT COUNT(*) FROM umpires) AS total_umpires,
        (SELECT COUNT(*) FROM sponsors) AS total_sponsors
    `;
    const [countsRows] = await pool.query(countsQuery);
    const counts = countsRows[0];

    // 2. Recent completed/live matches (last 5)
    const recentMatchesQuery = `
      SELECT 
        m.match_id,
        m.match_date,
        m.match_time,
        m.match_type,
        m.status,
        m.win_margin,
        m.win_type,
        s.season_year,
        v.venue_name,
        v.city AS venue_city,
        t1.team_id AS team1_id,
        t1.team_name AS team1_name,
        t1.short_name AS team1_short,
        t2.team_id AS team2_id,
        t2.team_name AS team2_name,
        t2.short_name AS team2_short,
        w.team_name AS winner_name,
        w.short_name AS winner_short,
        pom.player_name AS player_of_match_name
      FROM matches m
      JOIN seasons s ON m.season_id = s.season_id
      JOIN venues v ON m.venue_id = v.venue_id
      JOIN teams t1 ON m.team1_id = t1.team_id
      JOIN teams t2 ON m.team2_id = t2.team_id
      LEFT JOIN teams w ON m.winner_id = w.team_id
      LEFT JOIN players pom ON m.player_of_match = pom.player_id
      WHERE m.status IN ('Completed', 'Live')
      ORDER BY m.match_date DESC, m.match_id DESC
      LIMIT 5
    `;
    const [recentMatches] = await pool.query(recentMatchesQuery);

    // 3. Upcoming scheduled matches (next 5)
    const upcomingMatchesQuery = `
      SELECT 
        m.match_id,
        m.match_date,
        m.match_time,
        m.match_type,
        m.status,
        s.season_year,
        v.venue_name,
        v.city AS venue_city,
        t1.team_id AS team1_id,
        t1.team_name AS team1_name,
        t1.short_name AS team1_short,
        t2.team_id AS team2_id,
        t2.team_name AS team2_name,
        t2.short_name AS team2_short
      FROM matches m
      JOIN seasons s ON m.season_id = s.season_id
      JOIN venues v ON m.venue_id = v.venue_id
      JOIN teams t1 ON m.team1_id = t1.team_id
      JOIN teams t2 ON m.team2_id = t2.team_id
      WHERE m.status = 'Scheduled'
      ORDER BY m.match_date ASC, m.match_time ASC
      LIMIT 5
    `;
    const [upcomingMatches] = await pool.query(upcomingMatchesQuery);

    // 4. Top teams ranked by all-time match wins
    const topTeamsQuery = `
      SELECT 
        t.team_id,
        t.team_name,
        t.short_name,
        t.titles_won,
        t.jersey_color,
        COUNT(m.match_id) AS total_wins,
        (SELECT COUNT(*) FROM matches mp WHERE mp.team1_id = t.team_id OR mp.team2_id = t.team_id) AS total_matches_played
      FROM teams t
      LEFT JOIN matches m ON m.winner_id = t.team_id AND m.status = 'Completed'
      GROUP BY t.team_id, t.team_name, t.short_name, t.titles_won, t.jersey_color
      ORDER BY total_wins DESC, t.titles_won DESC
      LIMIT 5
    `;
    const [topTeams] = await pool.query(topTeamsQuery);

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        summary: {
          total_teams: Number(counts.total_teams),
          total_players: Number(counts.total_players),
          total_matches: Number(counts.total_matches),
          total_seasons: Number(counts.total_seasons),
          total_venues: Number(counts.total_venues),
          total_umpires: Number(counts.total_umpires),
          total_sponsors: Number(counts.total_sponsors)
        },
        recent_matches: recentMatches,
        upcoming_matches: upcomingMatches,
        top_teams_by_wins: topTeams.map(t => ({
          ...t,
          win_percentage: t.total_matches_played > 0 
            ? ((t.total_wins / t.total_matches_played) * 100).toFixed(1) + '%' 
            : '0.0%'
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
