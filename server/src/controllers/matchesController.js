const pool = require('../config/database');
const { getPaginationMeta } = require('../middleware/validate');

const VALID_MATCH_TYPES = ['League', 'Qualifier', 'Eliminator', 'Final', 'Super Over'];
const VALID_MATCH_STATUS = ['Scheduled', 'Live', 'Completed', 'Cancelled', 'No Result'];
const VALID_WIN_TYPES = ['Runs', 'Wickets', 'Super Over', 'No Result'];
const VALID_TOSS_DECISIONS = ['Bat', 'Bowl'];

/**
 * Controller for Matches operations
 */

// GET /api/matches - Retrieve all matches using v_match_details view with filters and pagination
const getAllMatches = async (req, res, next) => {
  try {
    const page = req.pagination ? req.pagination.page : 1;
    const limit = req.pagination ? req.pagination.limit : 10;
    const offset = req.pagination ? req.pagination.offset : 0;

    const { season_id, team_id, status, venue_id, match_type } = req.query;

    let countQuery = 'SELECT COUNT(*) AS total FROM matches m WHERE 1=1';
    let dataQuery = `
      SELECT 
        v.match_id,
        v.match_date,
        v.match_time,
        v.match_type,
        v.status,
        v.win_margin,
        v.win_type,
        v.season_year,
        v.venue_name,
        v.city AS venue_city,
        v.team1_name,
        v.team1_short,
        v.team2_name,
        v.team2_short,
        v.winner_name,
        v.player_of_match_name,
        m.season_id,
        m.venue_id,
        m.team1_id,
        m.team2_id,
        m.winner_id,
        m.toss_winner_id,
        m.toss_decision,
        m.player_of_match
      FROM v_match_details v
      JOIN matches m ON v.match_id = m.match_id
      WHERE 1=1
    `;

    const queryParams = [];
    const countParams = [];

    if (season_id) {
      countQuery += ' AND m.season_id = ?';
      dataQuery += ' AND m.season_id = ?';
      countParams.push(season_id);
      queryParams.push(season_id);
    }

    if (team_id) {
      countQuery += ' AND (m.team1_id = ? OR m.team2_id = ?)';
      dataQuery += ' AND (m.team1_id = ? OR m.team2_id = ?)';
      countParams.push(team_id, team_id);
      queryParams.push(team_id, team_id);
    }

    if (status) {
      countQuery += ' AND m.status = ?';
      dataQuery += ' AND m.status = ?';
      countParams.push(status);
      queryParams.push(status);
    }

    if (venue_id) {
      countQuery += ' AND m.venue_id = ?';
      dataQuery += ' AND m.venue_id = ?';
      countParams.push(venue_id);
      queryParams.push(venue_id);
    }

    if (match_type) {
      countQuery += ' AND m.match_type = ?';
      dataQuery += ' AND m.match_type = ?';
      countParams.push(match_type);
      queryParams.push(match_type);
    }

    dataQuery += ' ORDER BY m.match_date DESC, m.match_id DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [countRows] = await pool.query(countQuery, countParams);
    const totalItems = countRows[0].total;

    const [matches] = await pool.query(dataQuery, queryParams);

    res.status(200).json({
      success: true,
      message: 'Matches retrieved successfully',
      data: matches,
      pagination: getPaginationMeta(totalItems, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/matches/:id - Retrieve single match using v_match_details
const getMatchById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        v.match_id,
        v.match_date,
        v.match_time,
        v.match_type,
        v.status,
        v.win_margin,
        v.win_type,
        v.season_year,
        v.venue_name,
        v.city AS venue_city,
        v.team1_name,
        v.team1_short,
        v.team2_name,
        v.team2_short,
        v.winner_name,
        v.player_of_match_name,
        m.season_id,
        m.venue_id,
        m.team1_id,
        m.team2_id,
        m.winner_id,
        m.toss_winner_id,
        tw.team_name AS toss_winner_name,
        m.toss_decision,
        m.player_of_match
      FROM v_match_details v
      JOIN matches m ON v.match_id = m.match_id
      LEFT JOIN teams tw ON m.toss_winner_id = tw.team_id
      WHERE v.match_id = ?
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Match with ID ${id} not found`
      });
    }

    // Also fetch innings summary for the match
    const inningsQuery = `
      SELECT 
        i.*,
        bt.team_name AS batting_team_name,
        bt.short_name AS batting_team_short,
        bw.team_name AS bowling_team_name,
        bw.short_name AS bowling_team_short
      FROM innings i
      JOIN teams bt ON i.batting_team_id = bt.team_id
      JOIN teams bw ON i.bowling_team_id = bw.team_id
      WHERE i.match_id = ?
      ORDER BY i.innings_no ASC
    `;
    const [innings] = await pool.query(inningsQuery, [id]);

    // Also fetch officiated umpires
    const umpiresQuery = `
      SELECT 
        u.umpire_id,
        u.umpire_name,
        u.nationality,
        mu.role
      FROM match_umpires mu
      JOIN umpires u ON mu.umpire_id = u.umpire_id
      WHERE mu.match_id = ?
      ORDER BY mu.role ASC
    `;
    const [umpires] = await pool.query(umpiresQuery, [id]);

    res.status(200).json({
      success: true,
      message: 'Match details retrieved successfully',
      data: {
        ...rows[0],
        innings,
        umpires
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/matches - Create a new match with validations
const createMatch = async (req, res, next) => {
  try {
    const {
      season_id,
      venue_id,
      team1_id,
      team2_id,
      match_date,
      match_time = null,
      match_type = 'League',
      status = 'Scheduled',
      winner_id = null,
      toss_winner_id = null,
      toss_decision = null,
      win_margin = null,
      win_type = null,
      player_of_match = null
    } = req.body;

    if (!season_id || !venue_id || !team1_id || !team2_id || !match_date) {
      return res.status(400).json({
        success: false,
        message: 'season_id, venue_id, team1_id, team2_id, and match_date are required'
      });
    }

    if (Number(team1_id) === Number(team2_id)) {
      return res.status(400).json({
        success: false,
        message: 'team1_id and team2_id must be different teams'
      });
    }

    // Verify season exists
    const [seasonRows] = await pool.query('SELECT season_id FROM seasons WHERE season_id = ?', [season_id]);
    if (seasonRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Season with ID ${season_id} does not exist`
      });
    }

    // Verify venue exists
    const [venueRows] = await pool.query('SELECT venue_id FROM venues WHERE venue_id = ?', [venue_id]);
    if (venueRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Venue with ID ${venue_id} does not exist`
      });
    }

    // Verify teams exist
    const [team1Rows] = await pool.query('SELECT team_id FROM teams WHERE team_id = ?', [team1_id]);
    const [team2Rows] = await pool.query('SELECT team_id FROM teams WHERE team_id = ?', [team2_id]);
    if (team1Rows.length === 0 || team2Rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'One or both specified teams do not exist'
      });
    }

    // Validate winner if provided
    if (winner_id && Number(winner_id) !== Number(team1_id) && Number(winner_id) !== Number(team2_id)) {
      return res.status(400).json({
        success: false,
        message: 'winner_id must be either team1_id or team2_id'
      });
    }

    // Validate toss winner if provided
    if (toss_winner_id && Number(toss_winner_id) !== Number(team1_id) && Number(toss_winner_id) !== Number(team2_id)) {
      return res.status(400).json({
        success: false,
        message: 'toss_winner_id must be either team1_id or team2_id'
      });
    }

    const insertQuery = `
      INSERT INTO matches (
        season_id, venue_id, team1_id, team2_id, match_date,
        match_time, match_type, status, winner_id, toss_winner_id,
        toss_decision, win_margin, win_type, player_of_match
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      season_id,
      venue_id,
      team1_id,
      team2_id,
      match_date,
      match_time || null,
      match_type || 'League',
      status || 'Scheduled',
      winner_id || null,
      toss_winner_id || null,
      toss_decision || null,
      win_margin !== undefined ? win_margin : null,
      win_type || null,
      player_of_match || null
    ]);

    const [created] = await pool.query('SELECT * FROM v_match_details WHERE match_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      data: created[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/matches/:id - Update an existing match
const updateMatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      season_id,
      venue_id,
      team1_id,
      team2_id,
      match_date,
      match_time,
      match_type,
      status,
      winner_id,
      toss_winner_id,
      toss_decision,
      win_margin,
      win_type,
      player_of_match
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM matches WHERE match_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Match with ID ${id} not found`
      });
    }

    const current = existing[0];
    const finalTeam1 = team1_id !== undefined ? team1_id : current.team1_id;
    const finalTeam2 = team2_id !== undefined ? team2_id : current.team2_id;

    if (Number(finalTeam1) === Number(finalTeam2)) {
      return res.status(400).json({
        success: false,
        message: 'team1_id and team2_id cannot be the same team'
      });
    }

    // Validate winner_id
    if (winner_id !== undefined && winner_id !== null) {
      if (Number(winner_id) !== Number(finalTeam1) && Number(winner_id) !== Number(finalTeam2)) {
        return res.status(400).json({
          success: false,
          message: 'winner_id must be either team1_id or team2_id of this match'
        });
      }
    }

    // Validate toss_winner_id
    if (toss_winner_id !== undefined && toss_winner_id !== null) {
      if (Number(toss_winner_id) !== Number(finalTeam1) && Number(toss_winner_id) !== Number(finalTeam2)) {
        return res.status(400).json({
          success: false,
          message: 'toss_winner_id must be either team1_id or team2_id of this match'
        });
      }
    }

    const updateQuery = `
      UPDATE matches SET
        season_id = ?,
        venue_id = ?,
        team1_id = ?,
        team2_id = ?,
        match_date = ?,
        match_time = ?,
        match_type = ?,
        status = ?,
        winner_id = ?,
        toss_winner_id = ?,
        toss_decision = ?,
        win_margin = ?,
        win_type = ?,
        player_of_match = ?
      WHERE match_id = ?
    `;

    await pool.query(updateQuery, [
      season_id !== undefined ? season_id : current.season_id,
      venue_id !== undefined ? venue_id : current.venue_id,
      finalTeam1,
      finalTeam2,
      match_date !== undefined ? match_date : current.match_date,
      match_time !== undefined ? match_time : current.match_time,
      match_type !== undefined ? match_type : current.match_type,
      status !== undefined ? status : current.status,
      winner_id !== undefined ? winner_id : current.winner_id,
      toss_winner_id !== undefined ? toss_winner_id : current.toss_winner_id,
      toss_decision !== undefined ? toss_decision : current.toss_decision,
      win_margin !== undefined ? win_margin : current.win_margin,
      win_type !== undefined ? win_type : current.win_type,
      player_of_match !== undefined ? player_of_match : current.player_of_match,
      id
    ]);

    const [updated] = await pool.query('SELECT * FROM v_match_details WHERE match_id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Match updated successfully',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/matches/:id - Delete a match
const deleteMatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM matches WHERE match_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Match with ID ${id} not found`
      });
    }

    try {
      await pool.query('DELETE FROM matches WHERE match_id = ?', [id]);
      res.status(200).json({
        success: true,
        message: `Match #${id} deleted successfully`
      });
    } catch (dbError) {
      if (dbError.code === 'ER_ROW_IS_REFERENCED_2' || dbError.errno === 1451) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete match: Innings, player stats, or umpire records reference this match.'
        });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/matches/:id/innings - Get innings for a match with team names
const getMatchInnings = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [match] = await pool.query('SELECT match_id FROM matches WHERE match_id = ?', [id]);
    if (match.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Match with ID ${id} not found`
      });
    }

    const query = `
      SELECT 
        i.innings_id,
        i.match_id,
        i.innings_no,
        i.batting_team_id,
        bt.team_name AS batting_team_name,
        bt.short_name AS batting_team_short,
        i.bowling_team_id,
        bw.team_name AS bowling_team_name,
        bw.short_name AS bowling_team_short,
        i.total_runs,
        i.total_wickets,
        i.total_overs,
        i.extras,
        i.is_completed,
        i.created_at
      FROM innings i
      JOIN teams bt ON i.batting_team_id = bt.team_id
      JOIN teams bw ON i.bowling_team_id = bw.team_id
      WHERE i.match_id = ?
      ORDER BY i.innings_no ASC
    `;

    const [innings] = await pool.query(query, [id]);

    res.status(200).json({
      success: true,
      message: `Innings for match #${id} fetched successfully`,
      data: innings
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/matches/:id/umpires - Get umpires officiating a match
const getMatchUmpires = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [match] = await pool.query('SELECT match_id FROM matches WHERE match_id = ?', [id]);
    if (match.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Match with ID ${id} not found`
      });
    }

    const query = `
      SELECT 
        mu.match_id,
        mu.role,
        u.umpire_id,
        u.umpire_name,
        u.nationality,
        u.umpire_type,
        u.experience_years,
        u.matches_officiated
      FROM match_umpires mu
      JOIN umpires u ON mu.umpire_id = u.umpire_id
      WHERE mu.match_id = ?
      ORDER BY mu.role ASC
    `;

    const [umpires] = await pool.query(query, [id]);

    res.status(200).json({
      success: true,
      message: `Umpires for match #${id} fetched successfully`,
      data: umpires
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
  getMatchInnings,
  getMatchUmpires
};
