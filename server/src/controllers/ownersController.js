const pool = require('../config/database');
const { getPaginationMeta } = require('../middleware/validate');

/**
 * Controller for Owners operations
 */

// GET /api/owners - List all owners with team details, search, and pagination
const getAllOwners = async (req, res, next) => {
  try {
    const page = req.pagination ? req.pagination.page : 1;
    const limit = req.pagination ? req.pagination.limit : 10;
    const offset = req.pagination ? req.pagination.offset : 0;
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;

    let countQuery = 'SELECT COUNT(*) AS total FROM owners o LEFT JOIN teams t ON o.team_id = t.team_id WHERE 1=1';
    let dataQuery = `
      SELECT 
        o.owner_id,
        o.owner_name,
        o.net_worth,
        o.nationality,
        o.contact,
        o.since_year,
        o.team_id,
        t.team_name,
        t.short_name AS team_short,
        t.city AS team_city
      FROM owners o
      LEFT JOIN teams t ON o.team_id = t.team_id
      WHERE 1=1
    `;

    const queryParams = [];
    const countParams = [];

    if (search) {
      const searchClause = ' AND (o.owner_name LIKE ? OR t.team_name LIKE ? OR o.nationality LIKE ?)';
      countQuery += searchClause;
      dataQuery += searchClause;
      countParams.push(search, search, search);
      queryParams.push(search, search, search);
    }

    dataQuery += ' ORDER BY o.net_worth DESC, o.owner_name ASC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [countRows] = await pool.query(countQuery, countParams);
    const totalItems = countRows[0].total;

    const [owners] = await pool.query(dataQuery, queryParams);

    res.status(200).json({
      success: true,
      message: 'Owners retrieved successfully',
      data: owners,
      pagination: getPaginationMeta(totalItems, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/owners/:id - Get owner by ID with team details
const getOwnerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        o.*,
        t.team_name,
        t.short_name AS team_short,
        t.city AS team_city,
        t.founded_year AS team_founded_year,
        t.titles_won AS team_titles_won
      FROM owners o
      LEFT JOIN teams t ON o.team_id = t.team_id
      WHERE o.owner_id = ?
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Owner with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Owner details retrieved successfully',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/owners - Create a new owner
const createOwner = async (req, res, next) => {
  try {
    const {
      owner_name,
      net_worth = null,
      nationality = 'Indian',
      team_id = null,
      contact = null,
      since_year = null
    } = req.body;

    if (!owner_name) {
      return res.status(400).json({
        success: false,
        message: 'owner_name is required'
      });
    }

    // Validate 1:1 relationship: ensure team_id is not already owned
    if (team_id) {
      const [teamCheck] = await pool.query('SELECT team_id FROM teams WHERE team_id = ?', [team_id]);
      if (teamCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Team with ID ${team_id} does not exist`
        });
      }

      const [existingOwner] = await pool.query('SELECT owner_id, owner_name FROM owners WHERE team_id = ?', [team_id]);
      if (existingOwner.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Team is already owned by '${existingOwner[0].owner_name}'. Each team can have only one primary owner record.`
        });
      }
    }

    const insertQuery = `
      INSERT INTO owners (
        owner_name, net_worth, nationality, team_id, contact, since_year
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      owner_name.trim(),
      net_worth || null,
      nationality ? nationality.trim() : 'Indian',
      team_id || null,
      contact ? contact.trim() : null,
      since_year || null
    ]);

    const [created] = await pool.query(`
      SELECT o.*, t.team_name, t.short_name AS team_short 
      FROM owners o 
      LEFT JOIN teams t ON o.team_id = t.team_id 
      WHERE o.owner_id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Owner created successfully',
      data: created[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/owners/:id - Update an existing owner
const updateOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      owner_name,
      net_worth,
      nationality,
      team_id,
      contact,
      since_year
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM owners WHERE owner_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Owner with ID ${id} not found`
      });
    }

    const current = existing[0];
    const finalTeamId = team_id !== undefined ? team_id : current.team_id;

    // Check unique team ownership constraint
    if (finalTeamId && Number(finalTeamId) !== Number(current.team_id)) {
      const [teamCheck] = await pool.query('SELECT team_id FROM teams WHERE team_id = ?', [finalTeamId]);
      if (teamCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Team with ID ${finalTeamId} does not exist`
        });
      }

      const [otherOwner] = await pool.query(
        'SELECT owner_id, owner_name FROM owners WHERE team_id = ? AND owner_id != ?',
        [finalTeamId, id]
      );
      if (otherOwner.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Team is already owned by '${otherOwner[0].owner_name}'. Each team can have only one primary owner record.`
        });
      }
    }

    const updateQuery = `
      UPDATE owners SET
        owner_name = ?,
        net_worth = ?,
        nationality = ?,
        team_id = ?,
        contact = ?,
        since_year = ?
      WHERE owner_id = ?
    `;

    await pool.query(updateQuery, [
      owner_name !== undefined ? owner_name.trim() : current.owner_name,
      net_worth !== undefined ? net_worth : current.net_worth,
      nationality !== undefined ? nationality.trim() : current.nationality,
      finalTeamId,
      contact !== undefined ? (contact ? contact.trim() : null) : current.contact,
      since_year !== undefined ? since_year : current.since_year,
      id
    ]);

    const [updated] = await pool.query(`
      SELECT o.*, t.team_name, t.short_name AS team_short 
      FROM owners o 
      LEFT JOIN teams t ON o.team_id = t.team_id 
      WHERE o.owner_id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: 'Owner updated successfully',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/owners/:id - Delete an owner
const deleteOwner = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM owners WHERE owner_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Owner with ID ${id} not found`
      });
    }

    await pool.query('DELETE FROM owners WHERE owner_id = ?', [id]);

    res.status(200).json({
      success: true,
      message: `Owner '${existing[0].owner_name}' deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOwners,
  getOwnerById,
  createOwner,
  updateOwner,
  deleteOwner
};
