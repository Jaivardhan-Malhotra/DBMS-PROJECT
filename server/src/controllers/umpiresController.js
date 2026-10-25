const pool = require('../config/database');
const { getPaginationMeta } = require('../middleware/validate');

const VALID_UMPIRE_TYPES = ['On-Field', 'Third Umpire', 'Match Referee'];

/**
 * Controller for Umpires operations
 */

// GET /api/umpires - List umpires with filters, search, and pagination
const getAllUmpires = async (req, res, next) => {
  try {
    const page = req.pagination ? req.pagination.page : 1;
    const limit = req.pagination ? req.pagination.limit : 10;
    const offset = req.pagination ? req.pagination.offset : 0;

    const { nationality, umpire_type, is_active, search } = req.query;

    let countQuery = 'SELECT COUNT(*) AS total FROM umpires u WHERE 1=1';
    let dataQuery = `
      SELECT 
        u.umpire_id,
        u.umpire_name,
        u.nationality,
        u.experience_years,
        u.matches_officiated,
        u.umpire_type,
        u.is_active,
        (SELECT COUNT(*) FROM match_umpires mu WHERE mu.umpire_id = u.umpire_id) AS matches_recorded
      FROM umpires u
      WHERE 1=1
    `;

    const queryParams = [];
    const countParams = [];

    if (nationality) {
      countQuery += ' AND u.nationality = ?';
      dataQuery += ' AND u.nationality = ?';
      countParams.push(nationality.trim());
      queryParams.push(nationality.trim());
    }

    if (umpire_type) {
      countQuery += ' AND u.umpire_type = ?';
      dataQuery += ' AND u.umpire_type = ?';
      countParams.push(umpire_type);
      queryParams.push(umpire_type);
    }

    if (is_active !== undefined) {
      const activeVal = is_active === 'true' || is_active === '1' ? 1 : 0;
      countQuery += ' AND u.is_active = ?';
      dataQuery += ' AND u.is_active = ?';
      countParams.push(activeVal);
      queryParams.push(activeVal);
    }

    if (search) {
      const searchPattern = `%${search.trim()}%`;
      countQuery += ' AND u.umpire_name LIKE ?';
      dataQuery += ' AND u.umpire_name LIKE ?';
      countParams.push(searchPattern);
      queryParams.push(searchPattern);
    }

    dataQuery += ' ORDER BY u.matches_officiated DESC, u.umpire_name ASC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [countRows] = await pool.query(countQuery, countParams);
    const totalItems = countRows[0].total;

    const [umpires] = await pool.query(dataQuery, queryParams);

    res.status(200).json({
      success: true,
      message: 'Umpires retrieved successfully',
      data: umpires,
      pagination: getPaginationMeta(totalItems, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/umpires/:id - Get umpire details by ID
const getUmpireById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        u.*,
        (SELECT COUNT(*) FROM match_umpires mu WHERE mu.umpire_id = u.umpire_id) AS matches_recorded
      FROM umpires u
      WHERE u.umpire_id = ?
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Umpire with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Umpire details retrieved successfully',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/umpires - Create a new umpire
const createUmpire = async (req, res, next) => {
  try {
    const {
      umpire_name,
      nationality = 'Indian',
      experience_years = 0,
      matches_officiated = 0,
      umpire_type = 'On-Field',
      is_active = 1
    } = req.body;

    if (!umpire_name) {
      return res.status(400).json({
        success: false,
        message: 'umpire_name is required'
      });
    }

    if (umpire_type && !VALID_UMPIRE_TYPES.includes(umpire_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid umpire_type '${umpire_type}'. Must be one of: ${VALID_UMPIRE_TYPES.join(', ')}`
      });
    }

    const insertQuery = `
      INSERT INTO umpires (
        umpire_name, nationality, experience_years,
        matches_officiated, umpire_type, is_active
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      umpire_name.trim(),
      nationality ? nationality.trim() : 'Indian',
      experience_years || 0,
      matches_officiated || 0,
      umpire_type || 'On-Field',
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    ]);

    const [created] = await pool.query('SELECT * FROM umpires WHERE umpire_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Umpire created successfully',
      data: created[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/umpires/:id - Update an existing umpire
const updateUmpire = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      umpire_name,
      nationality,
      experience_years,
      matches_officiated,
      umpire_type,
      is_active
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM umpires WHERE umpire_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Umpire with ID ${id} not found`
      });
    }

    const current = existing[0];

    if (umpire_type && !VALID_UMPIRE_TYPES.includes(umpire_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid umpire_type '${umpire_type}'. Must be one of: ${VALID_UMPIRE_TYPES.join(', ')}`
      });
    }

    const updateQuery = `
      UPDATE umpires SET
        umpire_name = ?,
        nationality = ?,
        experience_years = ?,
        matches_officiated = ?,
        umpire_type = ?,
        is_active = ?
      WHERE umpire_id = ?
    `;

    await pool.query(updateQuery, [
      umpire_name !== undefined ? umpire_name.trim() : current.umpire_name,
      nationality !== undefined ? nationality.trim() : current.nationality,
      experience_years !== undefined ? experience_years : current.experience_years,
      matches_officiated !== undefined ? matches_officiated : current.matches_officiated,
      umpire_type !== undefined ? umpire_type : current.umpire_type,
      is_active !== undefined ? (is_active ? 1 : 0) : current.is_active,
      id
    ]);

    const [updated] = await pool.query('SELECT * FROM umpires WHERE umpire_id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Umpire updated successfully',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/umpires/:id - Delete an umpire
const deleteUmpire = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM umpires WHERE umpire_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Umpire with ID ${id} not found`
      });
    }

    try {
      await pool.query('DELETE FROM umpires WHERE umpire_id = ?', [id]);
      res.status(200).json({
        success: true,
        message: `Umpire '${existing[0].umpire_name}' deleted successfully`
      });
    } catch (dbError) {
      if (dbError.code === 'ER_ROW_IS_REFERENCED_2' || dbError.errno === 1451) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete umpire: Umpire is assigned to officiate past or scheduled matches.'
        });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/umpires/:id/matches - Matches officiated by an umpire with role
const getUmpireMatches = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [umpire] = await pool.query('SELECT umpire_id, umpire_name FROM umpires WHERE umpire_id = ?', [id]);
    if (umpire.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Umpire with ID ${id} not found`
      });
    }

    const query = `
      SELECT 
        mu.role,
        m.match_id,
        m.match_date,
        m.match_time,
        m.match_type,
        m.status,
        s.season_year,
        v.venue_name,
        v.city AS venue_city,
        t1.team_name AS team1_name,
        t1.short_name AS team1_short,
        t2.team_name AS team2_name,
        t2.short_name AS team2_short,
        w.team_name AS winner_name
      FROM match_umpires mu
      JOIN matches m ON mu.match_id = m.match_id
      JOIN seasons s ON m.season_id = s.season_id
      JOIN venues v ON m.venue_id = v.venue_id
      JOIN teams t1 ON m.team1_id = t1.team_id
      JOIN teams t2 ON m.team2_id = t2.team_id
      LEFT JOIN teams w ON m.winner_id = w.team_id
      WHERE mu.umpire_id = ?
      ORDER BY m.match_date DESC, m.match_id DESC
    `;

    const [matches] = await pool.query(query, [id]);

    res.status(200).json({
      success: true,
      message: `Matches officiated by ${umpire[0].umpire_name} retrieved successfully`,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUmpires,
  getUmpireById,
  createUmpire,
  updateUmpire,
  deleteUmpire,
  getUmpireMatches
};
