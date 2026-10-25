const pool = require('../config/database');
const { getPaginationMeta } = require('../middleware/validate');

/**
 * Controller for Innings operations
 */

// GET /api/innings - List innings with team names, match date, filters, and pagination
const getAllInnings = async (req, res, next) => {
  try {
    const page = req.pagination ? req.pagination.page : 1;
    const limit = req.pagination ? req.pagination.limit : 10;
    const offset = req.pagination ? req.pagination.offset : 0;
    const { match_id, batting_team_id, bowling_team_id } = req.query;

    let countQuery = 'SELECT COUNT(*) AS total FROM innings i WHERE 1=1';
    let dataQuery = `
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
        m.match_date,
        m.status AS match_status,
        m.match_type,
        s.season_year
      FROM innings i
      JOIN matches m ON i.match_id = m.match_id
      JOIN seasons s ON m.season_id = s.season_id
      JOIN teams bt ON i.batting_team_id = bt.team_id
      JOIN teams bw ON i.bowling_team_id = bw.team_id
      WHERE 1=1
    `;

    const queryParams = [];
    const countParams = [];

    if (match_id) {
      countQuery += ' AND i.match_id = ?';
      dataQuery += ' AND i.match_id = ?';
      countParams.push(match_id);
      queryParams.push(match_id);
    }

    if (batting_team_id) {
      countQuery += ' AND i.batting_team_id = ?';
      dataQuery += ' AND i.batting_team_id = ?';
      countParams.push(batting_team_id);
      queryParams.push(batting_team_id);
    }

    if (bowling_team_id) {
      countQuery += ' AND i.bowling_team_id = ?';
      dataQuery += ' AND i.bowling_team_id = ?';
      countParams.push(bowling_team_id);
      queryParams.push(bowling_team_id);
    }

    dataQuery += ' ORDER BY m.match_date DESC, i.match_id DESC, i.innings_no ASC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [countRows] = await pool.query(countQuery, countParams);
    const totalItems = countRows[0].total;

    const [innings] = await pool.query(dataQuery, queryParams);

    res.status(200).json({
      success: true,
      message: 'Innings retrieved successfully',
      data: innings,
      pagination: getPaginationMeta(totalItems, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/innings/:id - Get innings by ID
const getInningsById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        i.*,
        bt.team_name AS batting_team_name,
        bt.short_name AS batting_team_short,
        bw.team_name AS bowling_team_name,
        bw.short_name AS bowling_team_short,
        m.match_date,
        m.match_type,
        m.status AS match_status,
        s.season_year,
        v.venue_name
      FROM innings i
      JOIN matches m ON i.match_id = m.match_id
      JOIN seasons s ON m.season_id = s.season_id
      JOIN venues v ON m.venue_id = v.venue_id
      JOIN teams bt ON i.batting_team_id = bt.team_id
      JOIN teams bw ON i.bowling_team_id = bw.team_id
      WHERE i.innings_id = ?
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Innings with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Innings details retrieved successfully',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/innings - Create a new innings record
const createInnings = async (req, res, next) => {
  try {
    const {
      match_id,
      innings_no,
      batting_team_id,
      bowling_team_id,
      total_runs = 0,
      total_wickets = 0,
      total_overs = 0.0,
      extras = 0,
      is_completed = 0
    } = req.body;

    if (!match_id || !innings_no || !batting_team_id || !bowling_team_id) {
      return res.status(400).json({
        success: false,
        message: 'match_id, innings_no, batting_team_id, and bowling_team_id are required fields'
      });
    }

    // Validate innings_no is 1 or 2
    const parsedInningsNo = parseInt(innings_no, 10);
    if (parsedInningsNo !== 1 && parsedInningsNo !== 2) {
      return res.status(400).json({
        success: false,
        message: 'innings_no must be either 1 or 2'
      });
    }

    // Validate batting_team_id != bowling_team_id
    if (Number(batting_team_id) === Number(bowling_team_id)) {
      return res.status(400).json({
        success: false,
        message: 'batting_team_id and bowling_team_id must be different teams'
      });
    }

    // Verify match exists
    const [matchRows] = await pool.query(
      'SELECT match_id, team1_id, team2_id FROM matches WHERE match_id = ?',
      [match_id]
    );

    if (matchRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Match with ID ${match_id} not found`
      });
    }

    const match = matchRows[0];
    const matchTeams = [Number(match.team1_id), Number(match.team2_id)];

    if (!matchTeams.includes(Number(batting_team_id)) || !matchTeams.includes(Number(bowling_team_id))) {
      return res.status(400).json({
        success: false,
        message: 'Both batting and bowling teams must belong to this match'
      });
    }

    // Check if innings_no already exists for this match
    const [existing] = await pool.query(
      'SELECT innings_id FROM innings WHERE match_id = ? AND innings_no = ?',
      [match_id, parsedInningsNo]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Innings #${parsedInningsNo} already exists for match ID ${match_id}`
      });
    }

    const insertQuery = `
      INSERT INTO innings (
        match_id, innings_no, batting_team_id, bowling_team_id,
        total_runs, total_wickets, total_overs, extras, is_completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      match_id,
      parsedInningsNo,
      batting_team_id,
      bowling_team_id,
      total_runs || 0,
      total_wickets || 0,
      total_overs || 0.0,
      extras || 0,
      is_completed ? 1 : 0
    ]);

    const [created] = await pool.query(`
      SELECT 
        i.*,
        bt.team_name AS batting_team_name,
        bw.team_name AS bowling_team_name
      FROM innings i
      JOIN teams bt ON i.batting_team_id = bt.team_id
      JOIN teams bw ON i.bowling_team_id = bw.team_id
      WHERE i.innings_id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Innings created successfully',
      data: created[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/innings/:id - Update an existing innings
const updateInnings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      total_runs,
      total_wickets,
      total_overs,
      extras,
      is_completed,
      batting_team_id,
      bowling_team_id
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM innings WHERE innings_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Innings with ID ${id} not found`
      });
    }

    const current = existing[0];
    const finalBatting = batting_team_id !== undefined ? batting_team_id : current.batting_team_id;
    const finalBowling = bowling_team_id !== undefined ? bowling_team_id : current.bowling_team_id;

    if (Number(finalBatting) === Number(finalBowling)) {
      return res.status(400).json({
        success: false,
        message: 'batting_team_id and bowling_team_id must be different teams'
      });
    }

    const updateQuery = `
      UPDATE innings SET
        batting_team_id = ?,
        bowling_team_id = ?,
        total_runs = ?,
        total_wickets = ?,
        total_overs = ?,
        extras = ?,
        is_completed = ?
      WHERE innings_id = ?
    `;

    await pool.query(updateQuery, [
      finalBatting,
      finalBowling,
      total_runs !== undefined ? total_runs : current.total_runs,
      total_wickets !== undefined ? total_wickets : current.total_wickets,
      total_overs !== undefined ? total_overs : current.total_overs,
      extras !== undefined ? extras : current.extras,
      is_completed !== undefined ? (is_completed ? 1 : 0) : current.is_completed,
      id
    ]);

    const [updated] = await pool.query(`
      SELECT 
        i.*,
        bt.team_name AS batting_team_name,
        bw.team_name AS bowling_team_name
      FROM innings i
      JOIN teams bt ON i.batting_team_id = bt.team_id
      JOIN teams bw ON i.bowling_team_id = bw.team_id
      WHERE i.innings_id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: 'Innings updated successfully',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/innings/:id - Delete an innings
const deleteInnings = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM innings WHERE innings_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Innings with ID ${id} not found`
      });
    }

    await pool.query('DELETE FROM innings WHERE innings_id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Innings deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllInnings,
  getInningsById,
  createInnings,
  updateInnings,
  deleteInnings
};
