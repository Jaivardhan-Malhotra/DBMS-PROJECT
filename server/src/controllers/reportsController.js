const pool = require('../config/database');

/**
 * Controller for Analytical Reports and Aggregations
 */

// GET /api/reports/team-players - Squad sizes, role distribution, wins, and matches per team
const getTeamPlayerCounts = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        t.team_id,
        t.team_name,
        t.short_name,
        t.city,
        t.titles_won,
        COUNT(DISTINCT p.player_id) AS player_count,
        COUNT(DISTINCT p.player_id) AS total_players,
        COUNT(CASE WHEN p.nationality = 'Indian' THEN 1 END) AS indian_players,
        COUNT(CASE WHEN p.nationality != 'Indian' AND p.player_id IS NOT NULL THEN 1 END) AS overseas_players,
        COUNT(CASE WHEN p.role = 'Batsman' THEN 1 END) AS batsmen_count,
        COUNT(CASE WHEN p.role = 'Bowler' THEN 1 END) AS bowlers_count,
        COUNT(CASE WHEN p.role = 'All-Rounder' THEN 1 END) AS all_rounders_count,
        COUNT(CASE WHEN p.role = 'Wicket-Keeper' THEN 1 END) AS wicket_keepers_count,
        (
          SELECT COUNT(*) FROM matches m
          WHERE m.winner_id = t.team_id AND m.status = 'Completed'
        ) AS win_count,
        (
          SELECT COUNT(*) FROM matches m
          WHERE (m.team1_id = t.team_id OR m.team2_id = t.team_id)
        ) AS matches_played
      FROM teams t
      LEFT JOIN players p ON t.team_id = p.team_id
      GROUP BY t.team_id, t.team_name, t.short_name, t.city, t.titles_won
      ORDER BY matches_played DESC, t.team_name ASC
    `;

    const [rows] = await pool.query(query);

    res.status(200).json({
      success: true,
      message: 'Team player counts report generated successfully',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/matches-per-team - Matches played by each team (home vs away)
const getMatchesPerTeam = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        t.team_id,
        t.team_name,
        t.short_name,
        COUNT(CASE WHEN m.team1_id = t.team_id THEN 1 END) AS home_matches,
        COUNT(CASE WHEN m.team2_id = t.team_id THEN 1 END) AS away_matches,
        COUNT(m.match_id) AS total_matches_played
      FROM teams t
      LEFT JOIN matches m ON (t.team_id = m.team1_id OR t.team_id = m.team2_id)
      GROUP BY t.team_id, t.team_name, t.short_name
      ORDER BY total_matches_played DESC, t.team_name ASC
    `;

    const [rows] = await pool.query(query);

    res.status(200).json({
      success: true,
      message: 'Matches per team report generated successfully',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/wins-per-team - Match wins breakdown per team
const getWinsPerTeam = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        t.team_id,
        t.team_name,
        t.short_name,
        t.titles_won,
        COUNT(m.match_id) AS total_wins,
        COUNT(CASE WHEN m.win_type = 'Runs' THEN 1 END) AS wins_batting_first,
        COUNT(CASE WHEN m.win_type = 'Wickets' THEN 1 END) AS wins_chasing,
        COUNT(CASE WHEN m.win_type = 'Super Over' THEN 1 END) AS wins_super_over
      FROM teams t
      LEFT JOIN matches m ON t.team_id = m.winner_id AND m.status = 'Completed'
      GROUP BY t.team_id, t.team_name, t.short_name, t.titles_won
      ORDER BY total_wins DESC, t.titles_won DESC
    `;

    const [rows] = await pool.query(query);

    res.status(200).json({
      success: true,
      message: 'Wins per team report generated successfully',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/season-summary - One row per season: champion, runner-up, total matches
const getSeasonSummary = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        s.season_id,
        s.season_year,
        s.start_date,
        s.end_date,
        s.host_country,
        s.total_teams,
        (
          SELECT COUNT(*) FROM matches m WHERE m.season_id = s.season_id
        ) AS total_matches,
        champ.team_name  AS champion_name,
        champ.short_name AS champion_short,
        runner.team_name  AS runner_up_name,
        runner.short_name AS runner_up_short
      FROM seasons s
      LEFT JOIN teams champ  ON s.champion_team_id  = champ.team_id
      LEFT JOIN teams runner ON s.runner_up_team_id = runner.team_id
      ORDER BY s.season_year DESC
    `;

    const [rows] = await pool.query(query);

    res.status(200).json({
      success: true,
      message: 'Season summary report generated successfully',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/venue-match-counts - Matches hosted per venue
const getVenueMatchCounts = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        v.venue_id,
        v.venue_name,
        v.city,
        v.country,
        v.capacity,
        v.pitch_type,
        COUNT(m.match_id)                                          AS match_count,
        COUNT(m.match_id)                                          AS total_matches,
        COUNT(CASE WHEN m.status = 'Completed'  THEN 1 END)        AS completed_matches,
        COUNT(CASE WHEN m.status = 'Scheduled'  THEN 1 END)        AS scheduled_matches
      FROM venues v
      LEFT JOIN matches m ON v.venue_id = m.venue_id
      GROUP BY v.venue_id, v.venue_name, v.city, v.country, v.capacity, v.pitch_type
      ORDER BY match_count DESC, v.venue_name ASC
    `;

    const [rows] = await pool.query(query);

    res.status(200).json({
      success: true,
      message: 'Venue match counts report generated successfully',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/top-batsmen - Top 10 run-scorers based on player_match records
const getTopBatsmen = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const query = `
      SELECT 
        p.player_id,
        p.player_name,
        p.nationality,
        t.team_name,
        t.short_name AS team_short,
        COUNT(pm.match_id) AS innings_batted,
        SUM(pm.runs_scored) AS total_runs,
        SUM(pm.balls_faced) AS total_balls,
        SUM(pm.fours) AS total_fours,
        SUM(pm.sixes) AS total_sixes,
        MAX(pm.runs_scored) AS highest_score,
        ROUND(
          CASE 
            WHEN SUM(CASE WHEN pm.is_out = 1 THEN 1 ELSE 0 END) > 0 
            THEN SUM(pm.runs_scored) / SUM(CASE WHEN pm.is_out = 1 THEN 1 ELSE 0 END)
            ELSE SUM(pm.runs_scored)
          END, 2
        ) AS batting_average,
        ROUND(
          CASE 
            WHEN SUM(pm.balls_faced) > 0 
            THEN (SUM(pm.runs_scored) / SUM(pm.balls_faced)) * 100 
            ELSE 0 
          END, 2
        ) AS strike_rate
      FROM player_match pm
      JOIN players p ON pm.player_id = p.player_id
      LEFT JOIN teams t ON p.team_id = t.team_id
      GROUP BY p.player_id, p.player_name, p.nationality, t.team_name, t.short_name
      ORDER BY total_runs DESC, strike_rate DESC
      LIMIT ?
    `;

    const [rows] = await pool.query(query, [limit]);

    res.status(200).json({
      success: true,
      message: `Top ${rows.length} batsmen retrieved successfully`,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/top-bowlers - Top 10 wicket-takers based on player_match records
const getTopBowlers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const query = `
      SELECT 
        p.player_id,
        p.player_name,
        p.nationality,
        t.team_name,
        t.short_name AS team_short,
        COUNT(pm.match_id) AS innings_bowled,
        SUM(pm.wickets_taken) AS total_wickets,
        SUM(pm.overs_bowled) AS total_overs,
        SUM(pm.runs_conceded) AS total_runs_conceded,
        MAX(pm.wickets_taken) AS best_wickets_in_match,
        ROUND(
          CASE 
            WHEN SUM(pm.overs_bowled) > 0 
            THEN SUM(pm.runs_conceded) / SUM(pm.overs_bowled) 
            ELSE 0 
          END, 2
        ) AS economy_rate
      FROM player_match pm
      JOIN players p ON pm.player_id = p.player_id
      LEFT JOIN teams t ON p.team_id = t.team_id
      GROUP BY p.player_id, p.player_name, p.nationality, t.team_name, t.short_name
      HAVING total_wickets > 0
      ORDER BY total_wickets DESC, economy_rate ASC
      LIMIT ?
    `;

    const [rows] = await pool.query(query, [limit]);

    res.status(200).json({
      success: true,
      message: `Top ${rows.length} bowlers retrieved successfully`,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/player-of-match-leaderboard - Players with most Player of the Match awards
const getPlayerOfMatchLeaderboard = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const query = `
      SELECT 
        p.player_id,
        p.player_name,
        p.role,
        p.nationality,
        t.team_name,
        t.short_name AS team_short,
        COUNT(m.match_id) AS pom_count
      FROM matches m
      JOIN players p ON m.player_of_match = p.player_id
      LEFT JOIN teams t ON p.team_id = t.team_id
      WHERE m.player_of_match IS NOT NULL
      GROUP BY p.player_id, p.player_name, p.role, p.nationality, t.team_name, t.short_name
      ORDER BY pom_count DESC, p.player_name ASC
      LIMIT ?
    `;

    const [rows] = await pool.query(query, [limit]);

    res.status(200).json({
      success: true,
      message: `Player of the Match leaderboard retrieved successfully`,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTeamPlayerCounts,
  getMatchesPerTeam,
  getWinsPerTeam,
  getSeasonSummary,
  getVenueMatchCounts,
  getTopBatsmen,
  getTopBowlers,
  getPlayerOfMatchLeaderboard
};
