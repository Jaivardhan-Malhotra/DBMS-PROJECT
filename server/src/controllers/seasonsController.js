const pool = require('../config/database');
const { getPaginationMeta } = require('../middleware/validate');

/**
 * Controller for Seasons operations
 */

// GET /api/seasons - List all seasons with champion and runner-up details
const getAllSeasons = async (req, res, next) => {
  try {
    const page = req.pagination ? req.pagination.page : 1;
    const limit = req.pagination ? req.pagination.limit : 10;
    const offset = req.pagination ? req.pagination.offset : 0;

    const countQuery = 'SELECT COUNT(*) AS total FROM seasons';
    const [countRows] = await pool.query(countQuery);
    const totalItems = countRows[0].total;

    const query = `
      SELECT 
        s.season_id,
        s.season_year,
        s.start_date,
        s.end_date,
        s.host_country,
        s.total_teams,
        s.total_matches,
        s.champion_team_id,
        c.team_name AS champion_name,
        c.short_name AS champion_short,
        s.runner_up_team_id,
        r.team_name AS runner_up_name,
        r.short_name AS runner_up_short,
        (SELECT COUNT(*) FROM matches m WHERE m.season_id = s.season_id) AS matches_scheduled,
        (SELECT COUNT(*) FROM matches m WHERE m.season_id = s.season_id AND m.status = 'Completed') AS matches_completed
      FROM seasons s
      LEFT JOIN teams c ON s.champion_team_id = c.team_id
      LEFT JOIN teams r ON s.runner_up_team_id = r.team_id
      ORDER BY s.season_year DESC
      LIMIT ? OFFSET ?
    `;

    const [seasons] = await pool.query(query, [limit, offset]);

    res.status(200).json({
      success: true,
      message: 'Seasons retrieved successfully',
      data: seasons,
      pagination: getPaginationMeta(totalItems, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/seasons/:id - Get season by ID with full details
const getSeasonById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        s.*,
        c.team_name AS champion_name,
        c.short_name AS champion_short,
        c.city AS champion_city,
        r.team_name AS runner_up_name,
        r.short_name AS runner_up_short,
        r.city AS runner_up_city,
        (SELECT COUNT(*) FROM matches m WHERE m.season_id = s.season_id) AS matches_scheduled,
        (SELECT COUNT(*) FROM matches m WHERE m.season_id = s.season_id AND m.status = 'Completed') AS matches_completed
      FROM seasons s
      LEFT JOIN teams c ON s.champion_team_id = c.team_id
      LEFT JOIN teams r ON s.runner_up_team_id = r.team_id
      WHERE s.season_id = ?
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Season with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Season details retrieved successfully',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/seasons - Create a new season
const createSeason = async (req, res, next) => {
  try {
    const {
      season_year,
      start_date,
      end_date,
      host_country = 'India',
      total_teams = 8,
      total_matches = null,
      champion_team_id = null,
      runner_up_team_id = null
    } = req.body;

    if (!season_year || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'season_year, start_date, and end_date are required fields'
      });
    }

    if (new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: 'end_date must be after start_date'
      });
    }

    const insertQuery = `
      INSERT INTO seasons (
        season_year, start_date, end_date, host_country,
        total_teams, total_matches, champion_team_id, runner_up_team_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      season_year,
      start_date,
      end_date,
      host_country ? host_country.trim() : 'India',
      total_teams || 8,
      total_matches || null,
      champion_team_id || null,
      runner_up_team_id || null
    ]);

    const [created] = await pool.query('SELECT * FROM seasons WHERE season_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Season created successfully',
      data: created[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/seasons/:id - Update an existing season
const updateSeason = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      season_year,
      start_date,
      end_date,
      host_country,
      total_teams,
      total_matches,
      champion_team_id,
      runner_up_team_id
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM seasons WHERE season_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Season with ID ${id} not found`
      });
    }

    const current = existing[0];
    const newStartDate = start_date !== undefined ? start_date : current.start_date;
    const newEndDate = end_date !== undefined ? end_date : current.end_date;

    if (new Date(newEndDate) <= new Date(newStartDate)) {
      return res.status(400).json({
        success: false,
        message: 'end_date must be after start_date'
      });
    }

    const updateQuery = `
      UPDATE seasons SET
        season_year = ?,
        start_date = ?,
        end_date = ?,
        host_country = ?,
        total_teams = ?,
        total_matches = ?,
        champion_team_id = ?,
        runner_up_team_id = ?
      WHERE season_id = ?
    `;

    await pool.query(updateQuery, [
      season_year !== undefined ? season_year : current.season_year,
      newStartDate,
      newEndDate,
      host_country !== undefined ? host_country.trim() : current.host_country,
      total_teams !== undefined ? total_teams : current.total_teams,
      total_matches !== undefined ? total_matches : current.total_matches,
      champion_team_id !== undefined ? champion_team_id : current.champion_team_id,
      runner_up_team_id !== undefined ? runner_up_team_id : current.runner_up_team_id,
      id
    ]);

    const [updated] = await pool.query('SELECT * FROM seasons WHERE season_id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Season updated successfully',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/seasons/:id - Delete a season
const deleteSeason = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM seasons WHERE season_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Season with ID ${id} not found`
      });
    }

    try {
      await pool.query('DELETE FROM seasons WHERE season_id = ?', [id]);
      res.status(200).json({
        success: true,
        message: `Season ${existing[0].season_year} deleted successfully`
      });
    } catch (dbError) {
      if (dbError.code === 'ER_ROW_IS_REFERENCED_2' || dbError.errno === 1451) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete season: Matches or awards reference this season.'
        });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/seasons/:id/matches - Get all matches in a season
const getSeasonMatches = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [season] = await pool.query('SELECT season_id, season_year FROM seasons WHERE season_id = ?', [id]);
    if (season.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Season with ID ${id} not found`
      });
    }

    const query = `
      SELECT 
        m.match_id,
        m.match_date,
        m.match_time,
        m.match_type,
        m.status,
        m.win_margin,
        m.win_type,
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
      JOIN venues v ON m.venue_id = v.venue_id
      JOIN teams t1 ON m.team1_id = t1.team_id
      JOIN teams t2 ON m.team2_id = t2.team_id
      LEFT JOIN teams w ON m.winner_id = w.team_id
      LEFT JOIN players pom ON m.player_of_match = pom.player_id
      WHERE m.season_id = ?
      ORDER BY m.match_date ASC, m.match_id ASC
    `;

    const [matches] = await pool.query(query, [id]);

    res.status(200).json({
      success: true,
      message: `Matches for IPL ${season[0].season_year} retrieved successfully`,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/seasons/:id/stats - Aggregate statistics for a season
const getSeasonStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [season] = await pool.query('SELECT * FROM seasons WHERE season_id = ?', [id]);
    if (season.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Season with ID ${id} not found`
      });
    }

    // Match counts
    const matchCountsQuery = `
      SELECT 
        COUNT(match_id) AS total_matches_scheduled,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) AS total_matches_completed,
        COUNT(CASE WHEN status = 'Scheduled' THEN 1 END) AS total_matches_upcoming,
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) AS total_matches_cancelled,
        COUNT(CASE WHEN status = 'No Result' THEN 1 END) AS total_matches_no_result
      FROM matches
      WHERE season_id = ?
    `;
    const [matchCounts] = await pool.query(matchCountsQuery, [id]);

    // Unique participating teams count
    const teamsCountQuery = `
      SELECT COUNT(DISTINCT team_id) AS teams_participated
      FROM (
        SELECT team1_id AS team_id FROM matches WHERE season_id = ?
        UNION
        SELECT team2_id AS team_id FROM matches WHERE season_id = ?
      ) AS participating_teams
    `;
    const [teamsCount] = await pool.query(teamsCountQuery, [id, id]);

    // Innings aggregate stats: total runs and wickets
    const inningsStatsQuery = `
      SELECT 
        COALESCE(SUM(i.total_runs), 0) AS total_runs_scored,
        COALESCE(SUM(i.total_wickets), 0) AS total_wickets_fallen,
        COALESCE(MAX(i.total_runs), 0) AS highest_team_total
      FROM innings i
      JOIN matches m ON i.match_id = m.match_id
      WHERE m.season_id = ?
    `;
    const [inningsStats] = await pool.query(inningsStatsQuery, [id]);

    // Top Batsman of the season
    const topBatsmanQuery = `
      SELECT 
        p.player_id,
        p.player_name,
        t.team_name,
        t.short_name AS team_short,
        SUM(pm.runs_scored) AS total_runs,
        MAX(pm.runs_scored) AS highest_score,
        SUM(pm.sixes) AS total_sixes,
        SUM(pm.fours) AS total_fours
      FROM player_match pm
      JOIN matches m ON pm.match_id = m.match_id
      JOIN players p ON pm.player_id = p.player_id
      JOIN teams t ON pm.team_id = t.team_id
      WHERE m.season_id = ?
      GROUP BY p.player_id, p.player_name, t.team_name, t.short_name
      ORDER BY total_runs DESC
      LIMIT 1
    `;
    const [topBatsman] = await pool.query(topBatsmanQuery, [id]);

    // Top Bowler of the season
    const topBowlerQuery = `
      SELECT 
        p.player_id,
        p.player_name,
        t.team_name,
        t.short_name AS team_short,
        SUM(pm.wickets_taken) AS total_wickets,
        COALESCE(SUM(pm.runs_conceded), 0) AS runs_conceded
      FROM player_match pm
      JOIN matches m ON pm.match_id = m.match_id
      JOIN players p ON pm.player_id = p.player_id
      JOIN teams t ON pm.team_id = t.team_id
      WHERE m.season_id = ?
      GROUP BY p.player_id, p.player_name, t.team_name, t.short_name
      ORDER BY total_wickets DESC
      LIMIT 1
    `;
    const [topBowler] = await pool.query(topBowlerQuery, [id]);

    // Standings / Wins by team in this season
    const standingsQuery = `
      SELECT 
        t.team_id,
        t.team_name,
        t.short_name,
        COUNT(CASE WHEN m.winner_id = t.team_id THEN 1 END) AS wins,
        COUNT(m.match_id) AS matches_played
      FROM teams t
      JOIN matches m ON (m.team1_id = t.team_id OR m.team2_id = t.team_id)
      WHERE m.season_id = ? AND m.status = 'Completed'
      GROUP BY t.team_id, t.team_name, t.short_name
      ORDER BY wins DESC, matches_played ASC
    `;
    const [standings] = await pool.query(standingsQuery, [id]);

    res.status(200).json({
      success: true,
      message: `Statistics for IPL ${season[0].season_year} retrieved successfully`,
      data: {
        season: season[0],
        matches: matchCounts[0],
        teams_participated: teamsCount[0].teams_participated || season[0].total_teams,
        total_runs_scored: Number(inningsStats[0].total_runs_scored),
        total_wickets_fallen: Number(inningsStats[0].total_wickets_fallen),
        highest_team_total: Number(inningsStats[0].highest_team_total),
        top_batsman: topBatsman[0] || null,
        top_bowler: topBowler[0] || null,
        standings
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSeasons,
  getSeasonById,
  createSeason,
  updateSeason,
  deleteSeason,
  getSeasonMatches,
  getSeasonStats
};
