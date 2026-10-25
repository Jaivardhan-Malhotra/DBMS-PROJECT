const pool = require('../config/database');
const { getPaginationMeta } = require('../middleware/validate');

const VALID_AWARD_TYPES = ['Batting', 'Bowling', 'Fielding', 'Overall', 'Team', 'Special'];

/**
 * Controller for Awards operations
 */

// GET /api/awards - List all awards with season details, winner count, and pagination
const getAllAwards = async (req, res, next) => {
  try {
    const page = req.pagination ? req.pagination.page : 1;
    const limit = req.pagination ? req.pagination.limit : 10;
    const offset = req.pagination ? req.pagination.offset : 0;
    const { award_type, season_id, search } = req.query;

    let countQuery = 'SELECT COUNT(*) AS total FROM awards a WHERE 1=1';
    let dataQuery = `
      SELECT 
        a.award_id,
        a.award_name,
        a.award_type,
        a.description,
        a.season_id,
        s.season_year,
        (SELECT COUNT(*) FROM player_awards pa WHERE pa.award_id = a.award_id) AS total_winners
      FROM awards a
      LEFT JOIN seasons s ON a.season_id = s.season_id
      WHERE 1=1
    `;

    const queryParams = [];
    const countParams = [];

    if (award_type) {
      countQuery += ' AND a.award_type = ?';
      dataQuery += ' AND a.award_type = ?';
      countParams.push(award_type);
      queryParams.push(award_type);
    }

    if (season_id) {
      countQuery += ' AND a.season_id = ?';
      dataQuery += ' AND a.season_id = ?';
      countParams.push(season_id);
      queryParams.push(season_id);
    }

    if (search) {
      const searchPattern = `%${search.trim()}%`;
      countQuery += ' AND a.award_name LIKE ?';
      dataQuery += ' AND a.award_name LIKE ?';
      countParams.push(searchPattern);
      queryParams.push(searchPattern);
    }

    dataQuery += ' ORDER BY a.award_id ASC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [countRows] = await pool.query(countQuery, countParams);
    const totalItems = countRows[0].total;

    const [awards] = await pool.query(dataQuery, queryParams);

    res.status(200).json({
      success: true,
      message: 'Awards retrieved successfully',
      data: awards,
      pagination: getPaginationMeta(totalItems, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/awards/:id - Get award by ID with list of winners
const getAwardById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        a.*,
        s.season_year
      FROM awards a
      LEFT JOIN seasons s ON a.season_id = s.season_id
      WHERE a.award_id = ?
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Award with ID ${id} not found`
      });
    }

    const winnersQuery = `
      SELECT 
        pa.id AS player_award_id,
        p.player_id,
        p.player_name,
        p.role,
        t.team_name,
        t.short_name AS team_short,
        s.season_year,
        pa.awarded_on
      FROM player_awards pa
      JOIN players p ON pa.player_id = p.player_id
      JOIN seasons s ON pa.season_id = s.season_id
      LEFT JOIN teams t ON p.team_id = t.team_id
      WHERE pa.award_id = ?
      ORDER BY s.season_year DESC, pa.awarded_on DESC
    `;

    const [winners] = await pool.query(winnersQuery, [id]);

    res.status(200).json({
      success: true,
      message: 'Award details retrieved successfully',
      data: {
        ...rows[0],
        winners
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/awards - Create a new award
const createAward = async (req, res, next) => {
  try {
    const {
      award_name,
      award_type = 'Overall',
      description = null,
      season_id = null
    } = req.body;

    if (!award_name) {
      return res.status(400).json({
        success: false,
        message: 'award_name is required'
      });
    }

    if (award_type && !VALID_AWARD_TYPES.includes(award_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid award_type '${award_type}'. Must be one of: ${VALID_AWARD_TYPES.join(', ')}`
      });
    }

    const insertQuery = `
      INSERT INTO awards (award_name, award_type, description, season_id)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      award_name.trim(),
      award_type || 'Overall',
      description ? description.trim() : null,
      season_id || null
    ]);

    const [created] = await pool.query('SELECT * FROM awards WHERE award_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Award created successfully',
      data: created[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/awards/:id - Update an existing award
const updateAward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      award_name,
      award_type,
      description,
      season_id
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM awards WHERE award_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Award with ID ${id} not found`
      });
    }

    const current = existing[0];

    if (award_type && !VALID_AWARD_TYPES.includes(award_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid award_type '${award_type}'. Must be one of: ${VALID_AWARD_TYPES.join(', ')}`
      });
    }

    const updateQuery = `
      UPDATE awards SET
        award_name = ?,
        award_type = ?,
        description = ?,
        season_id = ?
      WHERE award_id = ?
    `;

    await pool.query(updateQuery, [
      award_name !== undefined ? award_name.trim() : current.award_name,
      award_type !== undefined ? award_type : current.award_type,
      description !== undefined ? (description ? description.trim() : null) : current.description,
      season_id !== undefined ? season_id : current.season_id,
      id
    ]);

    const [updated] = await pool.query('SELECT * FROM awards WHERE award_id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Award updated successfully',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/awards/:id - Delete an award
const deleteAward = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM awards WHERE award_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Award with ID ${id} not found`
      });
    }

    try {
      await pool.query('DELETE FROM awards WHERE award_id = ?', [id]);
      res.status(200).json({
        success: true,
        message: `Award '${existing[0].award_name}' deleted successfully`
      });
    } catch (dbError) {
      if (dbError.code === 'ER_ROW_IS_REFERENCED_2' || dbError.errno === 1451) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete award: Winners have been assigned this award.'
        });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/awards/:id/winners - Get all winners of this award
const getAwardWinners = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [award] = await pool.query('SELECT award_id, award_name FROM awards WHERE award_id = ?', [id]);
    if (award.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Award with ID ${id} not found`
      });
    }

    const query = `
      SELECT 
        pa.id AS player_award_id,
        p.player_id,
        p.player_name,
        p.role,
        t.team_name,
        t.short_name AS team_short,
        s.season_id,
        s.season_year,
        pa.awarded_on
      FROM player_awards pa
      JOIN players p ON pa.player_id = p.player_id
      JOIN seasons s ON pa.season_id = s.season_id
      LEFT JOIN teams t ON p.team_id = t.team_id
      WHERE pa.award_id = ?
      ORDER BY s.season_year DESC, pa.awarded_on DESC
    `;

    const [winners] = await pool.query(query, [id]);

    res.status(200).json({
      success: true,
      message: `Winners of award '${award[0].award_name}' retrieved successfully`,
      data: winners
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/awards/:id/players - Assign award to player for a season
const assignAward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { player_id, season_id, awarded_on = null } = req.body;

    if (!player_id || !season_id) {
      return res.status(400).json({
        success: false,
        message: 'player_id and season_id are required'
      });
    }

    // Verify award exists
    const [award] = await pool.query('SELECT award_id, award_name FROM awards WHERE award_id = ?', [id]);
    if (award.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Award with ID ${id} not found`
      });
    }

    // Verify player exists
    const [player] = await pool.query('SELECT player_id, player_name FROM players WHERE player_id = ?', [player_id]);
    if (player.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Player with ID ${player_id} not found`
      });
    }

    // Verify season exists
    const [season] = await pool.query('SELECT season_id, season_year FROM seasons WHERE season_id = ?', [season_id]);
    if (season.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Season with ID ${season_id} not found`
      });
    }

    const insertQuery = `
      INSERT INTO player_awards (player_id, award_id, season_id, awarded_on)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE awarded_on = VALUES(awarded_on)
    `;

    const [result] = await pool.query(insertQuery, [
      player_id,
      id,
      season_id,
      awarded_on || new Date()
    ]);

    res.status(201).json({
      success: true,
      message: `Award '${award[0].award_name}' assigned to ${player[0].player_name} for season ${season[0].season_year}`
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/awards/:id/players/:playerId - Remove award from player
const removeAward = async (req, res, next) => {
  try {
    const { id, playerId } = req.params;
    const { season_id } = req.query;

    let deleteQuery = 'DELETE FROM player_awards WHERE award_id = ? AND player_id = ?';
    const params = [id, playerId];

    if (season_id) {
      deleteQuery += ' AND season_id = ?';
      params.push(season_id);
    }

    const [result] = await pool.query(deleteQuery, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `Award assignment not found for player ID ${playerId} and award ID ${id}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Award assignment removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAwards,
  getAwardById,
  createAward,
  updateAward,
  deleteAward,
  getAwardWinners,
  assignAward,
  removeAward
};
