const pool = require('../config/database');
const { getPaginationMeta } = require('../middleware/validate');

const VALID_SPONSORSHIP_TYPES = ['Title', 'Kit', 'Associate', 'Official Partner'];

/**
 * Controller for Sponsors operations
 */

// GET /api/sponsors - List all sponsors with sponsored teams count, search, and pagination
const getAllSponsors = async (req, res, next) => {
  try {
    const page = req.pagination ? req.pagination.page : 1;
    const limit = req.pagination ? req.pagination.limit : 10;
    const offset = req.pagination ? req.pagination.offset : 0;
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;

    let countQuery = 'SELECT COUNT(*) AS total FROM sponsors s';
    let dataQuery = `
      SELECT 
        s.sponsor_id,
        s.sponsor_name,
        s.industry,
        s.website,
        s.country,
        COUNT(ts.team_id) AS total_teams_sponsored,
        COALESCE(SUM(ts.contract_value), 0) AS total_contract_value
      FROM sponsors s
      LEFT JOIN team_sponsors ts ON s.sponsor_id = ts.sponsor_id
    `;

    const queryParams = [];
    const countParams = [];

    if (search) {
      const searchClause = ' WHERE (s.sponsor_name LIKE ? OR s.industry LIKE ? OR s.country LIKE ?)';
      countQuery += searchClause;
      dataQuery += searchClause;
      countParams.push(search, search, search);
      queryParams.push(search, search, search);
    }

    dataQuery += ' GROUP BY s.sponsor_id ORDER BY total_contract_value DESC, s.sponsor_name ASC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [countRows] = await pool.query(countQuery, countParams);
    const totalItems = countRows[0].total;

    const [sponsors] = await pool.query(dataQuery, queryParams);

    res.status(200).json({
      success: true,
      message: 'Sponsors retrieved successfully',
      data: sponsors,
      pagination: getPaginationMeta(totalItems, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sponsors/:id - Get sponsor details and list of sponsored teams
const getSponsorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sponsorQuery = 'SELECT * FROM sponsors WHERE sponsor_id = ?';
    const [sponsorRows] = await pool.query(sponsorQuery, [id]);

    if (sponsorRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Sponsor with ID ${id} not found`
      });
    }

    const teamsQuery = `
      SELECT 
        t.team_id,
        t.team_name,
        t.short_name,
        t.city,
        ts.contract_value,
        ts.start_year,
        ts.end_year,
        ts.sponsorship_type
      FROM team_sponsors ts
      JOIN teams t ON ts.team_id = t.team_id
      WHERE ts.sponsor_id = ?
      ORDER BY ts.contract_value DESC
    `;

    const [teams] = await pool.query(teamsQuery, [id]);

    res.status(200).json({
      success: true,
      message: 'Sponsor details retrieved successfully',
      data: {
        ...sponsorRows[0],
        sponsored_teams: teams
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/sponsors - Create a new sponsor
const createSponsor = async (req, res, next) => {
  try {
    const {
      sponsor_name,
      industry = null,
      website = null,
      country = 'India'
    } = req.body;

    if (!sponsor_name) {
      return res.status(400).json({
        success: false,
        message: 'sponsor_name is required'
      });
    }

    const insertQuery = `
      INSERT INTO sponsors (sponsor_name, industry, website, country)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      sponsor_name.trim(),
      industry ? industry.trim() : null,
      website ? website.trim() : null,
      country ? country.trim() : 'India'
    ]);

    const [created] = await pool.query('SELECT * FROM sponsors WHERE sponsor_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Sponsor created successfully',
      data: created[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/sponsors/:id - Update an existing sponsor
const updateSponsor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      sponsor_name,
      industry,
      website,
      country
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM sponsors WHERE sponsor_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Sponsor with ID ${id} not found`
      });
    }

    const current = existing[0];

    const updateQuery = `
      UPDATE sponsors SET
        sponsor_name = ?,
        industry = ?,
        website = ?,
        country = ?
      WHERE sponsor_id = ?
    `;

    await pool.query(updateQuery, [
      sponsor_name !== undefined ? sponsor_name.trim() : current.sponsor_name,
      industry !== undefined ? (industry ? industry.trim() : null) : current.industry,
      website !== undefined ? (website ? website.trim() : null) : current.website,
      country !== undefined ? (country ? country.trim() : 'India') : current.country,
      id
    ]);

    const [updated] = await pool.query('SELECT * FROM sponsors WHERE sponsor_id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Sponsor updated successfully',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/sponsors/:id - Delete a sponsor
const deleteSponsor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM sponsors WHERE sponsor_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Sponsor with ID ${id} not found`
      });
    }

    try {
      await pool.query('DELETE FROM sponsors WHERE sponsor_id = ?', [id]);
      res.status(200).json({
        success: true,
        message: `Sponsor '${existing[0].sponsor_name}' deleted successfully`
      });
    } catch (dbError) {
      if (dbError.code === 'ER_ROW_IS_REFERENCED_2' || dbError.errno === 1451) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete sponsor: Teams are currently linked to this sponsor.'
        });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/sponsors/:id/teams - Get all teams sponsored by this sponsor
const getSponsorTeams = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [sponsor] = await pool.query('SELECT sponsor_id, sponsor_name FROM sponsors WHERE sponsor_id = ?', [id]);
    if (sponsor.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Sponsor with ID ${id} not found`
      });
    }

    const query = `
      SELECT 
        t.team_id,
        t.team_name,
        t.short_name,
        t.city,
        ts.contract_value,
        ts.start_year,
        ts.end_year,
        ts.sponsorship_type
      FROM team_sponsors ts
      JOIN teams t ON ts.team_id = t.team_id
      WHERE ts.sponsor_id = ?
      ORDER BY ts.contract_value DESC
    `;

    const [teams] = await pool.query(query, [id]);

    res.status(200).json({
      success: true,
      message: `Teams sponsored by ${sponsor[0].sponsor_name} retrieved successfully`,
      data: teams
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/sponsors/:id/teams - Associate team with sponsor
const addTeamSponsor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      team_id,
      contract_value = null,
      start_year = null,
      end_year = null,
      sponsorship_type = 'Associate'
    } = req.body;

    if (!team_id) {
      return res.status(400).json({
        success: false,
        message: 'team_id is required'
      });
    }

    // Verify sponsor exists
    const [sponsor] = await pool.query('SELECT sponsor_id FROM sponsors WHERE sponsor_id = ?', [id]);
    if (sponsor.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Sponsor with ID ${id} not found`
      });
    }

    // Verify team exists
    const [team] = await pool.query('SELECT team_id FROM teams WHERE team_id = ?', [team_id]);
    if (team.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Team with ID ${team_id} not found`
      });
    }

    if (sponsorship_type && !VALID_SPONSORSHIP_TYPES.includes(sponsorship_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sponsorship_type '${sponsorship_type}'. Must be one of: ${VALID_SPONSORSHIP_TYPES.join(', ')}`
      });
    }

    const insertQuery = `
      INSERT INTO team_sponsors (
        team_id, sponsor_id, contract_value, start_year, end_year, sponsorship_type
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        contract_value = VALUES(contract_value),
        start_year = VALUES(start_year),
        end_year = VALUES(end_year),
        sponsorship_type = VALUES(sponsorship_type)
    `;

    await pool.query(insertQuery, [
      team_id,
      id,
      contract_value || null,
      start_year || null,
      end_year || null,
      sponsorship_type || 'Associate'
    ]);

    const query = `
      SELECT 
        ts.*,
        t.team_name,
        t.short_name,
        s.sponsor_name
      FROM team_sponsors ts
      JOIN teams t ON ts.team_id = t.team_id
      JOIN sponsors s ON ts.sponsor_id = s.sponsor_id
      WHERE ts.sponsor_id = ? AND ts.team_id = ?
    `;
    const [associated] = await pool.query(query, [id, team_id]);

    res.status(201).json({
      success: true,
      message: 'Team sponsor relationship recorded successfully',
      data: associated[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/sponsors/:id/teams/:teamId - Remove team sponsorship association
const removeTeamSponsor = async (req, res, next) => {
  try {
    const { id, teamId } = req.params;

    const [existing] = await pool.query(
      'SELECT * FROM team_sponsors WHERE sponsor_id = ? AND team_id = ?',
      [id, teamId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Sponsorship relation between sponsor ${id} and team ${teamId} not found`
      });
    }

    await pool.query(
      'DELETE FROM team_sponsors WHERE sponsor_id = ? AND team_id = ?',
      [id, teamId]
    );

    res.status(200).json({
      success: true,
      message: 'Team sponsorship association removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSponsors,
  getSponsorById,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  getSponsorTeams,
  addTeamSponsor,
  removeTeamSponsor
};
