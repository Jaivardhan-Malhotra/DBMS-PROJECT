const pool = require('../config/database');
const { getPaginationMeta } = require('../middleware/validate');

/**
 * Controller for Teams operations
 */

// GET /api/teams - List all teams with venues, captains, search, and pagination
const getAllTeams = async (req, res, next) => {
  try {
    const page = req.pagination ? req.pagination.page : 1;
    const limit = req.pagination ? req.pagination.limit : 10;
    const offset = req.pagination ? req.pagination.offset : 0;
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;

    let countQuery = 'SELECT COUNT(*) AS total FROM teams t';
    let dataQuery = `
      SELECT 
        t.team_id,
        t.team_name,
        t.short_name,
        t.city,
        t.coach,
        t.jersey_color,
        t.founded_year,
        t.titles_won,
        t.home_venue_id,
        v.venue_name AS home_venue_name,
        v.city AS home_venue_city,
        t.captain_id,
        p.player_name AS captain_name,
        (SELECT COUNT(*) FROM players pl WHERE pl.team_id = t.team_id) AS total_players,
        (SELECT COUNT(*) FROM matches m WHERE m.winner_id = t.team_id AND m.status = 'Completed') AS total_wins
      FROM teams t
      LEFT JOIN venues v ON t.home_venue_id = v.venue_id
      LEFT JOIN players p ON t.captain_id = p.player_id
    `;

    const queryParams = [];
    const countParams = [];

    if (search) {
      const searchClause = ' WHERE (t.team_name LIKE ? OR t.short_name LIKE ? OR t.city LIKE ?)';
      countQuery += searchClause;
      dataQuery += searchClause;
      countParams.push(search, search, search);
      queryParams.push(search, search, search);
    }

    dataQuery += ' ORDER BY t.titles_won DESC, t.team_name ASC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [countRows] = await pool.query(countQuery, countParams);
    const totalItems = countRows[0].total;

    const [teams] = await pool.query(dataQuery, queryParams);

    res.status(200).json({
      success: true,
      message: 'Teams fetched successfully',
      data: teams,
      pagination: getPaginationMeta(totalItems, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/teams/:id - Get single team by ID with captain, venue, and statistics
const getTeamById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        t.*,
        v.venue_name AS home_venue_name,
        v.city AS home_venue_city,
        v.capacity AS home_venue_capacity,
        p.player_name AS captain_name,
        p.role AS captain_role,
        p.jersey_no AS captain_jersey_no,
        o.owner_name,
        o.net_worth AS owner_net_worth,
        (SELECT COUNT(*) FROM players pl WHERE pl.team_id = t.team_id) AS total_players,
        (SELECT COUNT(*) FROM matches m WHERE (m.team1_id = t.team_id OR m.team2_id = t.team_id)) AS total_matches_played,
        (SELECT COUNT(*) FROM matches m WHERE m.winner_id = t.team_id AND m.status = 'Completed') AS total_wins
      FROM teams t
      LEFT JOIN venues v ON t.home_venue_id = v.venue_id
      LEFT JOIN players p ON t.captain_id = p.player_id
      LEFT JOIN owners o ON o.team_id = t.team_id
      WHERE t.team_id = ?
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Team with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Team details retrieved successfully',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/teams - Create a new team
const createTeam = async (req, res, next) => {
  try {
    const {
      team_name,
      short_name,
      city,
      home_venue_id = null,
      coach = null,
      captain_id = null,
      jersey_color = null,
      founded_year = null,
      titles_won = 0
    } = req.body;

    if (!team_name || !short_name || !city) {
      return res.status(400).json({
        success: false,
        message: 'team_name, short_name, and city are required fields'
      });
    }

    const insertQuery = `
      INSERT INTO teams (
        team_name, short_name, city, home_venue_id, coach, 
        captain_id, jersey_color, founded_year, titles_won
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      team_name.trim(),
      short_name.trim().toUpperCase(),
      city.trim(),
      home_venue_id || null,
      coach ? coach.trim() : null,
      captain_id || null,
      jersey_color ? jersey_color.trim() : null,
      founded_year || null,
      titles_won || 0
    ]);

    const [createdRows] = await pool.query('SELECT * FROM teams WHERE team_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: createdRows[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/teams/:id - Update an existing team
const updateTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      team_name,
      short_name,
      city,
      home_venue_id,
      coach,
      captain_id,
      jersey_color,
      founded_year,
      titles_won
    } = req.body;

    // Check if team exists
    const [existing] = await pool.query('SELECT * FROM teams WHERE team_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Team with ID ${id} not found`
      });
    }

    const current = existing[0];

    const updateQuery = `
      UPDATE teams SET
        team_name = ?,
        short_name = ?,
        city = ?,
        home_venue_id = ?,
        coach = ?,
        captain_id = ?,
        jersey_color = ?,
        founded_year = ?,
        titles_won = ?
      WHERE team_id = ?
    `;

    await pool.query(updateQuery, [
      team_name !== undefined ? team_name.trim() : current.team_name,
      short_name !== undefined ? short_name.trim().toUpperCase() : current.short_name,
      city !== undefined ? city.trim() : current.city,
      home_venue_id !== undefined ? home_venue_id : current.home_venue_id,
      coach !== undefined ? (coach ? coach.trim() : null) : current.coach,
      captain_id !== undefined ? captain_id : current.captain_id,
      jersey_color !== undefined ? (jersey_color ? jersey_color.trim() : null) : current.jersey_color,
      founded_year !== undefined ? founded_year : current.founded_year,
      titles_won !== undefined ? titles_won : current.titles_won,
      id
    ]);

    const [updatedRows] = await pool.query('SELECT * FROM teams WHERE team_id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/teams/:id - Delete team with graceful FK error handling
const deleteTeam = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM teams WHERE team_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Team with ID ${id} not found`
      });
    }

    try {
      await pool.query('DELETE FROM teams WHERE team_id = ?', [id]);
      res.status(200).json({
        success: true,
        message: `Team '${existing[0].team_name}' deleted successfully`
      });
    } catch (dbError) {
      if (dbError.code === 'ER_ROW_IS_REFERENCED_2' || dbError.errno === 1451) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete team: The team is currently linked to matches, players, or sponsors. Remove or reassign those associations first.'
        });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/teams/:id/players - Get all players associated with a team
const getTeamPlayers = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [team] = await pool.query('SELECT team_id, team_name, captain_id FROM teams WHERE team_id = ?', [id]);
    if (team.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Team with ID ${id} not found`
      });
    }

    const query = `
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
        CASE WHEN p.player_id = ? THEN 1 ELSE 0 END AS is_captain
      FROM players p
      WHERE p.team_id = ?
      ORDER BY is_captain DESC, p.role ASC, p.player_name ASC
    `;

    const [players] = await pool.query(query, [team[0].captain_id, id]);

    res.status(200).json({
      success: true,
      message: `Players for team '${team[0].team_name}' fetched successfully`,
      data: players
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/teams/:id/matches - Get all matches played by a team
const getTeamMatches = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [team] = await pool.query('SELECT team_id, team_name FROM teams WHERE team_id = ?', [id]);
    if (team.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Team with ID ${id} not found`
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
      JOIN seasons s ON m.season_id = s.season_id
      JOIN venues v ON m.venue_id = v.venue_id
      JOIN teams t1 ON m.team1_id = t1.team_id
      JOIN teams t2 ON m.team2_id = t2.team_id
      LEFT JOIN teams w ON m.winner_id = w.team_id
      LEFT JOIN players pom ON m.player_of_match = pom.player_id
      WHERE m.team1_id = ? OR m.team2_id = ?
      ORDER BY m.match_date DESC, m.match_id DESC
    `;

    const [matches] = await pool.query(query, [id, id]);

    res.status(200).json({
      success: true,
      message: `Matches for team '${team[0].team_name}' fetched successfully`,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamPlayers,
  getTeamMatches
};
