const pool = require('../config/database');

/**
 * Controller for Venues operations
 */

// GET /api/venues - List all venues with match count, search, and pagination
const getAllVenues = async (req, res, next) => {
  try {
    const [venues] = await pool.query(`
      SELECT venue_id, venue_name, city
      FROM venues
      ORDER BY venue_name
    `);

    res.status(200).json({
      success: true,
      message: 'Available venues retrieved successfully',
      data: venues
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/venues/:id - Get single venue details by ID
const getVenueById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        v.*,
        COUNT(m.match_id) AS total_matches,
        (SELECT t.team_name FROM teams t WHERE t.home_venue_id = v.venue_id LIMIT 1) AS home_team_name,
        (SELECT t.short_name FROM teams t WHERE t.home_venue_id = v.venue_id LIMIT 1) AS home_team_short,
        (SELECT t.team_id FROM teams t WHERE t.home_venue_id = v.venue_id LIMIT 1) AS home_team_id
      FROM venues v
      LEFT JOIN matches m ON v.venue_id = m.venue_id
      WHERE v.venue_id = ?
      GROUP BY v.venue_id
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Venue with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Venue details retrieved successfully',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/venues - Create a new venue
const createVenue = async (req, res, next) => {
  try {
    const {
      venue_name,
      city,
      country = 'India',
      capacity = null,
      pitch_type = null,
      established_year = null
    } = req.body;

    if (!venue_name || !city) {
      return res.status(400).json({
        success: false,
        message: 'venue_name and city are required fields'
      });
    }

    const insertQuery = `
      INSERT INTO venues (
        venue_name, city, country, capacity, pitch_type, established_year
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      venue_name.trim(),
      city.trim(),
      country ? country.trim() : 'India',
      capacity || null,
      pitch_type ? pitch_type.trim() : null,
      established_year || null
    ]);

    const [created] = await pool.query('SELECT * FROM venues WHERE venue_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      data: created[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/venues/:id - Update an existing venue
const updateVenue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      venue_name,
      city,
      country,
      capacity,
      pitch_type,
      established_year
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM venues WHERE venue_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Venue with ID ${id} not found`
      });
    }

    const current = existing[0];

    const updateQuery = `
      UPDATE venues SET
        venue_name = ?,
        city = ?,
        country = ?,
        capacity = ?,
        pitch_type = ?,
        established_year = ?
      WHERE venue_id = ?
    `;

    await pool.query(updateQuery, [
      venue_name !== undefined ? venue_name.trim() : current.venue_name,
      city !== undefined ? city.trim() : current.city,
      country !== undefined ? country.trim() : current.country,
      capacity !== undefined ? capacity : current.capacity,
      pitch_type !== undefined ? (pitch_type ? pitch_type.trim() : null) : current.pitch_type,
      established_year !== undefined ? established_year : current.established_year,
      id
    ]);

    const [updated] = await pool.query('SELECT * FROM venues WHERE venue_id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Venue updated successfully',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/venues/:id - Delete a venue
const deleteVenue = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM venues WHERE venue_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Venue with ID ${id} not found`
      });
    }

    try {
      await pool.query('DELETE FROM venues WHERE venue_id = ?', [id]);
      res.status(200).json({
        success: true,
        message: `Venue '${existing[0].venue_name}' deleted successfully`
      });
    } catch (dbError) {
      if (dbError.code === 'ER_ROW_IS_REFERENCED_2' || dbError.errno === 1451) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete venue: Matches or team home venue associations reference this venue.'
        });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/venues/:id/matches - Matches held at this venue with team and season info
const getVenueMatches = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [venue] = await pool.query('SELECT venue_id, venue_name FROM venues WHERE venue_id = ?', [id]);
    if (venue.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Venue with ID ${id} not found`
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
        s.season_year,
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
      JOIN teams t1 ON m.team1_id = t1.team_id
      JOIN teams t2 ON m.team2_id = t2.team_id
      LEFT JOIN teams w ON m.winner_id = w.team_id
      LEFT JOIN players pom ON m.player_of_match = pom.player_id
      WHERE m.venue_id = ?
      ORDER BY m.match_date DESC, m.match_id DESC
    `;

    const [matches] = await pool.query(query, [id]);

    res.status(200).json({
      success: true,
      message: `Matches held at ${venue[0].venue_name} retrieved successfully`,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/venues/:id/stats - Total matches, wins per team at venue, and scoring insights
const getVenueStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [venue] = await pool.query('SELECT * FROM venues WHERE venue_id = ?', [id]);
    if (venue.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Venue with ID ${id} not found`
      });
    }

    // Match count statistics
    const matchSummaryQuery = `
      SELECT 
        COUNT(m.match_id) AS total_matches,
        COUNT(CASE WHEN m.status = 'Completed' THEN 1 END) AS completed_matches,
        COUNT(CASE WHEN m.win_type = 'Runs' THEN 1 END) AS matches_won_batting_first,
        COUNT(CASE WHEN m.win_type = 'Wickets' THEN 1 END) AS matches_won_chasing
      FROM matches m
      WHERE m.venue_id = ?
    `;
    const [matchSummary] = await pool.query(matchSummaryQuery, [id]);

    // Team wins at this venue
    const teamWinsQuery = `
      SELECT 
        t.team_id,
        t.team_name,
        t.short_name,
        COUNT(m.match_id) AS wins
      FROM matches m
      JOIN teams t ON m.winner_id = t.team_id
      WHERE m.venue_id = ? AND m.status = 'Completed'
      GROUP BY t.team_id, t.team_name, t.short_name
      ORDER BY wins DESC
    `;
    const [teamWins] = await pool.query(teamWinsQuery, [id]);

    // Average 1st & 2nd innings score and highest total
    const inningsStatsQuery = `
      SELECT 
        COALESCE(ROUND(AVG(CASE WHEN i.innings_no = 1 THEN i.total_runs END), 1), 0) AS avg_first_innings_score,
        COALESCE(ROUND(AVG(CASE WHEN i.innings_no = 2 THEN i.total_runs END), 1), 0) AS avg_second_innings_score,
        COALESCE(MAX(i.total_runs), 0) AS highest_innings_score
      FROM innings i
      JOIN matches m ON i.match_id = m.match_id
      WHERE m.venue_id = ?
    `;
    const [inningsStats] = await pool.query(inningsStatsQuery, [id]);

    res.status(200).json({
      success: true,
      message: `Venue statistics for ${venue[0].venue_name} retrieved successfully`,
      data: {
        venue: venue[0],
        match_summary: matchSummary[0],
        scoring_insights: inningsStats[0],
        team_wins: teamWins
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  getVenueMatches,
  getVenueStats
};
