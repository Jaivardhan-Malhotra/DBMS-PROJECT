const pool = require('../config/database');
const { getPaginationMeta } = require('../middleware/validate');

const VALID_ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];
const VALID_BATTING_STYLES = ['Right-Hand', 'Left-Hand'];

/**
 * Controller for Players operations
 */

// GET /api/players - List players with team details, filters, search, and pagination
const getAllPlayers = async (req, res, next) => {
  try {
    const page = req.pagination ? req.pagination.page : 1;
    const limit = req.pagination ? req.pagination.limit : 10;
    const offset = req.pagination ? req.pagination.offset : 0;

    const { team_id, role, search, is_active } = req.query;

    let countQuery = 'SELECT COUNT(*) AS total FROM players p LEFT JOIN teams t ON p.team_id = t.team_id WHERE 1=1';
    let dataQuery = `
      SELECT 
        p.player_id,
        p.player_name,
        p.dob,
        p.nationality,
        p.role,
        p.batting_style,
        p.bowling_style,
        p.jersey_no,
        p.matches_played,
        p.runs_scored,
        p.wickets_taken,
        p.base_price,
        p.is_active,
        p.team_id,
        t.team_name,
        t.short_name AS team_short,
        t.jersey_color AS team_color
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.team_id
      WHERE 1=1
    `;

    const queryParams = [];
    const countParams = [];

    if (team_id) {
      countQuery += ' AND p.team_id = ?';
      dataQuery += ' AND p.team_id = ?';
      countParams.push(team_id);
      queryParams.push(team_id);
    }

    if (role) {
      countQuery += ' AND p.role = ?';
      dataQuery += ' AND p.role = ?';
      countParams.push(role);
      queryParams.push(role);
    }

    if (is_active !== undefined) {
      const activeVal = is_active === 'true' || is_active === '1' ? 1 : 0;
      countQuery += ' AND p.is_active = ?';
      dataQuery += ' AND p.is_active = ?';
      countParams.push(activeVal);
      queryParams.push(activeVal);
    }

    if (search) {
      const searchPattern = `%${search.trim()}%`;
      countQuery += ' AND (p.player_name LIKE ? OR p.nationality LIKE ?)';
      dataQuery += ' AND (p.player_name LIKE ? OR p.nationality LIKE ?)';
      countParams.push(searchPattern, searchPattern);
      queryParams.push(searchPattern, searchPattern);
    }

    dataQuery += ' ORDER BY p.runs_scored DESC, p.wickets_taken DESC, p.player_name ASC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [countRows] = await pool.query(countQuery, countParams);
    const totalItems = countRows[0].total;

    const [players] = await pool.query(dataQuery, queryParams);

    res.status(200).json({
      success: true,
      message: 'Players retrieved successfully',
      data: players,
      pagination: getPaginationMeta(totalItems, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/players/:id - Get player details and career performance statistics
const getPlayerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const playerQuery = `
      SELECT 
        p.*,
        t.team_name,
        t.short_name AS team_short,
        t.city AS team_city,
        (SELECT team_name FROM teams WHERE captain_id = p.player_id LIMIT 1) AS captain_of_team
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.team_id
      WHERE p.player_id = ?
    `;

    const [playerRows] = await pool.query(playerQuery, [id]);

    if (playerRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Player with ID ${id} not found`
      });
    }

    const player = playerRows[0];

    // Compute match stats from player_match table
    const statsQuery = `
      SELECT 
        COUNT(pm.id) AS matches_recorded,
        COALESCE(SUM(pm.runs_scored), 0) AS total_runs_match,
        COALESCE(SUM(pm.balls_faced), 0) AS total_balls_faced,
        COALESCE(SUM(pm.fours), 0) AS total_fours,
        COALESCE(SUM(pm.sixes), 0) AS total_sixes,
        COALESCE(MAX(pm.runs_scored), 0) AS highest_score,
        COALESCE(SUM(pm.wickets_taken), 0) AS total_wickets_match,
        COALESCE(SUM(pm.runs_conceded), 0) AS total_runs_conceded,
        COALESCE(SUM(pm.overs_bowled), 0) AS total_overs_bowled,
        COALESCE(SUM(pm.catches), 0) AS total_catches,
        COALESCE(SUM(pm.stumpings), 0) AS total_stumpings,
        COALESCE(SUM(CASE WHEN pm.is_out = 1 THEN 1 ELSE 0 END), 0) AS times_out,
        COALESCE(MAX(pm.wickets_taken), 0) AS best_bowling_wickets
      FROM player_match pm
      WHERE pm.player_id = ?
    `;

    const [statsRows] = await pool.query(statsQuery, [id]);
    const matchStats = statsRows[0];

    // Determine aggregate values using player table as master or match table if higher
    const totalRuns = Math.max(Number(player.runs_scored || 0), Number(matchStats.total_runs_match || 0));
    const totalWickets = Math.max(Number(player.wickets_taken || 0), Number(matchStats.total_wickets_match || 0));
    const matchesPlayed = Math.max(Number(player.matches_played || 0), Number(matchStats.matches_recorded || 0));
    const dismissals = Number(matchStats.times_out || 1);

    const battingAverage = dismissals > 0 ? (totalRuns / dismissals).toFixed(2) : totalRuns.toFixed(2);
    const strikeRate = Number(matchStats.total_balls_faced) > 0 
      ? ((Number(matchStats.total_runs_match) / Number(matchStats.total_balls_faced)) * 100).toFixed(2) 
      : '0.00';
    const bowlingEconomy = Number(matchStats.total_overs_bowled) > 0 
      ? (Number(matchStats.total_runs_conceded) / Number(matchStats.total_overs_bowled)).toFixed(2) 
      : '0.00';

    // Fetch player awards
    const awardsQuery = `
      SELECT 
        a.award_id,
        a.award_name,
        a.award_type,
        s.season_year,
        pa.awarded_on
      FROM player_awards pa
      JOIN awards a ON pa.award_id = a.award_id
      JOIN seasons s ON pa.season_id = s.season_id
      WHERE pa.player_id = ?
      ORDER BY s.season_year DESC
    `;
    const [awards] = await pool.query(awardsQuery, [id]);

    // Fetch player of the match awards
    const pomQuery = `
      SELECT COUNT(*) AS total_pom_awards
      FROM matches
      WHERE player_of_match = ?
    `;
    const [pomRows] = await pool.query(pomQuery, [id]);

    const performanceStats = {
      matches_played: matchesPlayed,
      runs_scored: totalRuns,
      wickets_taken: totalWickets,
      balls_faced: Number(matchStats.total_balls_faced),
      fours: Number(matchStats.total_fours),
      sixes: Number(matchStats.total_sixes),
      highest_score: Number(matchStats.highest_score),
      batting_average: parseFloat(battingAverage),
      strike_rate: parseFloat(strikeRate),
      bowling_economy: parseFloat(bowlingEconomy),
      best_bowling_wickets: Number(matchStats.best_bowling_wickets),
      catches: Number(matchStats.total_catches),
      stumpings: Number(matchStats.total_stumpings),
      player_of_match_count: pomRows[0].total_pom_awards || 0,
      awards_count: awards.length
    };

    res.status(200).json({
      success: true,
      message: 'Player retrieved successfully',
      data: {
        ...player,
        stats: performanceStats,
        awards
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/players - Create new player
const createPlayer = async (req, res, next) => {
  try {
    const {
      player_name,
      dob = null,
      nationality = 'Indian',
      role,
      batting_style = 'Right-Hand',
      bowling_style = null,
      team_id = null,
      jersey_no = null,
      matches_played = 0,
      runs_scored = 0,
      wickets_taken = 0,
      base_price = null,
      is_active = 1
    } = req.body;

    if (!player_name || !role) {
      return res.status(400).json({
        success: false,
        message: 'player_name and role are required fields'
      });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role '${role}'. Role must be one of: ${VALID_ROLES.join(', ')}`
      });
    }

    if (batting_style && !VALID_BATTING_STYLES.includes(batting_style)) {
      return res.status(400).json({
        success: false,
        message: `Invalid batting_style '${batting_style}'. Must be one of: ${VALID_BATTING_STYLES.join(', ')}`
      });
    }

    const insertQuery = `
      INSERT INTO players (
        player_name, dob, nationality, role, batting_style,
        bowling_style, team_id, jersey_no, matches_played,
        runs_scored, wickets_taken, base_price, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      player_name.trim(),
      dob || null,
      nationality ? nationality.trim() : 'Indian',
      role,
      batting_style || 'Right-Hand',
      bowling_style ? bowling_style.trim() : null,
      team_id || null,
      jersey_no || null,
      matches_played || 0,
      runs_scored || 0,
      wickets_taken || 0,
      base_price || null,
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    ]);

    const [createdRows] = await pool.query(`
      SELECT p.*, t.team_name, t.short_name AS team_short 
      FROM players p 
      LEFT JOIN teams t ON p.team_id = t.team_id 
      WHERE p.player_id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Player created successfully',
      data: createdRows[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/players/:id - Update an existing player
const updatePlayer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      player_name,
      dob,
      nationality,
      role,
      batting_style,
      bowling_style,
      team_id,
      jersey_no,
      matches_played,
      runs_scored,
      wickets_taken,
      base_price,
      is_active
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM players WHERE player_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Player with ID ${id} not found`
      });
    }

    const current = existing[0];

    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role '${role}'. Role must be one of: ${VALID_ROLES.join(', ')}`
      });
    }

    if (batting_style && !VALID_BATTING_STYLES.includes(batting_style)) {
      return res.status(400).json({
        success: false,
        message: `Invalid batting_style '${batting_style}'. Must be one of: ${VALID_BATTING_STYLES.join(', ')}`
      });
    }

    const updateQuery = `
      UPDATE players SET
        player_name = ?,
        dob = ?,
        nationality = ?,
        role = ?,
        batting_style = ?,
        bowling_style = ?,
        team_id = ?,
        jersey_no = ?,
        matches_played = ?,
        runs_scored = ?,
        wickets_taken = ?,
        base_price = ?,
        is_active = ?
      WHERE player_id = ?
    `;

    await pool.query(updateQuery, [
      player_name !== undefined ? player_name.trim() : current.player_name,
      dob !== undefined ? dob : current.dob,
      nationality !== undefined ? nationality.trim() : current.nationality,
      role !== undefined ? role : current.role,
      batting_style !== undefined ? batting_style : current.batting_style,
      bowling_style !== undefined ? (bowling_style ? bowling_style.trim() : null) : current.bowling_style,
      team_id !== undefined ? team_id : current.team_id,
      jersey_no !== undefined ? jersey_no : current.jersey_no,
      matches_played !== undefined ? matches_played : current.matches_played,
      runs_scored !== undefined ? runs_scored : current.runs_scored,
      wickets_taken !== undefined ? wickets_taken : current.wickets_taken,
      base_price !== undefined ? base_price : current.base_price,
      is_active !== undefined ? (is_active ? 1 : 0) : current.is_active,
      id
    ]);

    const [updatedRows] = await pool.query(`
      SELECT p.*, t.team_name, t.short_name AS team_short 
      FROM players p 
      LEFT JOIN teams t ON p.team_id = t.team_id 
      WHERE p.player_id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: 'Player updated successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/players/:id - Delete a player
const deletePlayer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM players WHERE player_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Player with ID ${id} not found`
      });
    }

    try {
      await pool.query('DELETE FROM players WHERE player_id = ?', [id]);
      res.status(200).json({
        success: true,
        message: `Player '${existing[0].player_name}' deleted successfully`
      });
    } catch (dbError) {
      if (dbError.code === 'ER_ROW_IS_REFERENCED_2' || dbError.errno === 1451) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete player: Player has associated match performances or awards.'
        });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer
};
