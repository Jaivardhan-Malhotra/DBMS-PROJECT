-- =============================================================
-- IPL MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Database: ipl_management
-- =============================================================

DROP DATABASE IF EXISTS ipl_management;
CREATE DATABASE ipl_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ipl_management;

-- =============================================================
-- TABLE: venues
-- =============================================================
CREATE TABLE venues (
    venue_id    INT AUTO_INCREMENT PRIMARY KEY,
    venue_name  VARCHAR(150) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    country     VARCHAR(100) NOT NULL DEFAULT 'India',
    capacity    INT UNSIGNED,
    pitch_type  VARCHAR(50),
    established_year SMALLINT UNSIGNED,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_venue_name (venue_name)
) ENGINE=InnoDB;

-- =============================================================
-- TABLE: seasons
-- =============================================================
CREATE TABLE seasons (
    season_id       INT AUTO_INCREMENT PRIMARY KEY,
    season_year     YEAR NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    host_country    VARCHAR(100) NOT NULL DEFAULT 'India',
    total_teams     TINYINT UNSIGNED DEFAULT 8,
    total_matches   TINYINT UNSIGNED,
    champion_team_id INT NULL,          -- FK added after teams table
    runner_up_team_id INT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_season_year (season_year),
    CONSTRAINT chk_season_dates CHECK (end_date > start_date)
) ENGINE=InnoDB;

-- =============================================================
-- TABLE: teams
-- =============================================================
CREATE TABLE teams (
    team_id         INT AUTO_INCREMENT PRIMARY KEY,
    team_name       VARCHAR(150) NOT NULL,
    short_name      VARCHAR(10)  NOT NULL,
    city            VARCHAR(100) NOT NULL,
    home_venue_id   INT NULL,
    coach           VARCHAR(100),
    captain_id      INT NULL,           -- FK added after players table
    jersey_color    VARCHAR(50),
    founded_year    SMALLINT UNSIGNED,
    titles_won      TINYINT UNSIGNED DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_team_name (team_name),
    UNIQUE KEY uk_short_name (short_name),
    CONSTRAINT fk_team_home_venue FOREIGN KEY (home_venue_id) REFERENCES venues(venue_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Add champion/runner-up FKs to seasons now that teams exists
ALTER TABLE seasons
    ADD CONSTRAINT fk_season_champion  FOREIGN KEY (champion_team_id)   REFERENCES teams(team_id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT fk_season_runner_up FOREIGN KEY (runner_up_team_id)  REFERENCES teams(team_id) ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================
-- TABLE: players
-- =============================================================
CREATE TABLE players (
    player_id       INT AUTO_INCREMENT PRIMARY KEY,
    player_name     VARCHAR(150) NOT NULL,
    dob             DATE,
    nationality     VARCHAR(100) NOT NULL DEFAULT 'Indian',
    role            ENUM('Batsman','Bowler','All-Rounder','Wicket-Keeper') NOT NULL,
    batting_style   ENUM('Right-Hand','Left-Hand') DEFAULT 'Right-Hand',
    bowling_style   VARCHAR(100),
    team_id         INT NULL,
    jersey_no       TINYINT UNSIGNED,
    matches_played  SMALLINT UNSIGNED DEFAULT 0,
    runs_scored     INT UNSIGNED DEFAULT 0,
    wickets_taken   SMALLINT UNSIGNED DEFAULT 0,
    base_price      DECIMAL(10,2),
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_player_team FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Add captain FK to teams now that players exists
ALTER TABLE teams
    ADD CONSTRAINT fk_team_captain FOREIGN KEY (captain_id) REFERENCES players(player_id) ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================
-- TABLE: matches
-- =============================================================
CREATE TABLE matches (
    match_id        INT AUTO_INCREMENT PRIMARY KEY,
    season_id       INT NOT NULL,
    venue_id        INT NOT NULL,
    team1_id        INT NOT NULL,
    team2_id        INT NOT NULL,
    match_date      DATE NOT NULL,
    match_time      TIME,
    match_type      ENUM('League','Qualifier','Eliminator','Final','Super Over') NOT NULL DEFAULT 'League',
    status          ENUM('Scheduled','Live','Completed','Cancelled','No Result') NOT NULL DEFAULT 'Scheduled',
    winner_id       INT NULL,
    toss_winner_id  INT NULL,
    toss_decision   ENUM('Bat','Bowl') NULL,
    win_margin      SMALLINT UNSIGNED NULL,
    win_type        ENUM('Runs','Wickets','Super Over','No Result') NULL,
    player_of_match INT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_match_season       FOREIGN KEY (season_id)        REFERENCES seasons(season_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_match_venue        FOREIGN KEY (venue_id)         REFERENCES venues(venue_id)   ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_match_team1        FOREIGN KEY (team1_id)         REFERENCES teams(team_id)     ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_match_team2        FOREIGN KEY (team2_id)         REFERENCES teams(team_id)     ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_match_winner       FOREIGN KEY (winner_id)        REFERENCES teams(team_id)     ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_match_toss_winner  FOREIGN KEY (toss_winner_id)   REFERENCES teams(team_id)     ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_match_pom          FOREIGN KEY (player_of_match)  REFERENCES players(player_id) ON DELETE SET NULL ON UPDATE CASCADE
    -- NOTE: team1_id <> team2_id is enforced in the backend controller (MySQL 8 forbids CHECK on FK columns)
) ENGINE=InnoDB;

-- Index for common queries
CREATE INDEX idx_match_season  ON matches(season_id);
CREATE INDEX idx_match_date    ON matches(match_date);
CREATE INDEX idx_match_status  ON matches(status);

-- =============================================================
-- TABLE: umpires
-- =============================================================
CREATE TABLE umpires (
    umpire_id           INT AUTO_INCREMENT PRIMARY KEY,
    umpire_name         VARCHAR(150) NOT NULL,
    nationality         VARCHAR(100) NOT NULL DEFAULT 'Indian',
    experience_years    TINYINT UNSIGNED DEFAULT 0,
    matches_officiated  SMALLINT UNSIGNED DEFAULT 0,
    umpire_type         ENUM('On-Field','Third Umpire','Match Referee') DEFAULT 'On-Field',
    is_active           TINYINT(1) NOT NULL DEFAULT 1,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================================
-- TABLE: match_umpires (M:N — Match <-> Umpire)
-- =============================================================
CREATE TABLE match_umpires (
    match_id    INT NOT NULL,
    umpire_id   INT NOT NULL,
    role        ENUM('On-Field 1','On-Field 2','Third Umpire','Match Referee') NOT NULL DEFAULT 'On-Field 1',
    PRIMARY KEY (match_id, umpire_id),
    CONSTRAINT fk_mu_match  FOREIGN KEY (match_id)  REFERENCES matches(match_id)  ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_mu_umpire FOREIGN KEY (umpire_id) REFERENCES umpires(umpire_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- TABLE: innings
-- =============================================================
CREATE TABLE innings (
    innings_id      INT AUTO_INCREMENT PRIMARY KEY,
    match_id        INT NOT NULL,
    innings_no      TINYINT NOT NULL,
    batting_team_id INT NOT NULL,
    bowling_team_id INT NOT NULL,
    total_runs      SMALLINT UNSIGNED DEFAULT 0,
    total_wickets   TINYINT UNSIGNED DEFAULT 0,
    total_overs     DECIMAL(4,1) DEFAULT 0.0,
    extras          SMALLINT UNSIGNED DEFAULT 0,
    is_completed    TINYINT(1) DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inn_match        FOREIGN KEY (match_id)        REFERENCES matches(match_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_inn_batting_team FOREIGN KEY (batting_team_id) REFERENCES teams(team_id)   ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_inn_bowling_team FOREIGN KEY (bowling_team_id) REFERENCES teams(team_id)   ON DELETE RESTRICT ON UPDATE CASCADE,
    -- NOTE: batting_team_id <> bowling_team_id is enforced in the backend controller (MySQL 8 forbids CHECK on FK columns)
    UNIQUE KEY uk_innings (match_id, innings_no)
) ENGINE=InnoDB;

-- =============================================================
-- TABLE: player_match (M:N — Player <-> Match performance)
-- =============================================================
CREATE TABLE player_match (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    match_id        INT NOT NULL,
    player_id       INT NOT NULL,
    team_id         INT NOT NULL,
    runs_scored     SMALLINT UNSIGNED DEFAULT 0,
    balls_faced     SMALLINT UNSIGNED DEFAULT 0,
    fours           TINYINT UNSIGNED DEFAULT 0,
    sixes           TINYINT UNSIGNED DEFAULT 0,
    wickets_taken   TINYINT UNSIGNED DEFAULT 0,
    overs_bowled    DECIMAL(4,1) DEFAULT 0.0,
    runs_conceded   SMALLINT UNSIGNED DEFAULT 0,
    catches         TINYINT UNSIGNED DEFAULT 0,
    stumpings       TINYINT UNSIGNED DEFAULT 0,
    is_out          TINYINT(1) DEFAULT 0,
    UNIQUE KEY uk_player_match (match_id, player_id),
    CONSTRAINT fk_pm_match  FOREIGN KEY (match_id)  REFERENCES matches(match_id)  ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pm_player FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pm_team   FOREIGN KEY (team_id)   REFERENCES teams(team_id)     ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- TABLE: sponsors
-- =============================================================
CREATE TABLE sponsors (
    sponsor_id      INT AUTO_INCREMENT PRIMARY KEY,
    sponsor_name    VARCHAR(150) NOT NULL,
    industry        VARCHAR(100),
    website         VARCHAR(255),
    country         VARCHAR(100) DEFAULT 'India',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_sponsor_name (sponsor_name)
) ENGINE=InnoDB;

-- =============================================================
-- TABLE: team_sponsors (M:N — Team <-> Sponsor)
-- =============================================================
CREATE TABLE team_sponsors (
    team_id         INT NOT NULL,
    sponsor_id      INT NOT NULL,
    contract_value  DECIMAL(15,2),
    start_year      YEAR,
    end_year        YEAR,
    sponsorship_type ENUM('Title','Kit','Associate','Official Partner') DEFAULT 'Associate',
    PRIMARY KEY (team_id, sponsor_id),
    CONSTRAINT fk_ts_team    FOREIGN KEY (team_id)    REFERENCES teams(team_id)       ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ts_sponsor FOREIGN KEY (sponsor_id) REFERENCES sponsors(sponsor_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- TABLE: awards
-- =============================================================
CREATE TABLE awards (
    award_id        INT AUTO_INCREMENT PRIMARY KEY,
    award_name      VARCHAR(150) NOT NULL,
    award_type      ENUM('Batting','Bowling','Fielding','Overall','Team','Special') NOT NULL DEFAULT 'Overall',
    description     TEXT,
    season_id       INT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_award_season FOREIGN KEY (season_id) REFERENCES seasons(season_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- TABLE: player_awards (M:N — Player <-> Award)
-- =============================================================
CREATE TABLE player_awards (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    player_id   INT NOT NULL,
    award_id    INT NOT NULL,
    season_id   INT NOT NULL,
    awarded_on  DATE,
    UNIQUE KEY uk_player_award_season (player_id, award_id, season_id),
    CONSTRAINT fk_pa_player FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pa_award  FOREIGN KEY (award_id)  REFERENCES awards(award_id)   ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pa_season FOREIGN KEY (season_id) REFERENCES seasons(season_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- TABLE: owners
-- =============================================================
CREATE TABLE owners (
    owner_id    INT AUTO_INCREMENT PRIMARY KEY,
    owner_name  VARCHAR(150) NOT NULL,
    net_worth   DECIMAL(15,2),
    nationality VARCHAR(100) DEFAULT 'Indian',
    team_id     INT UNIQUE NULL,
    contact     VARCHAR(150),
    since_year  SMALLINT UNSIGNED,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_owner_team FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- VIEWS for common JOIN queries
-- =============================================================

CREATE VIEW v_match_details AS
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
    t1.team_name  AS team1_name,
    t1.short_name AS team1_short,
    t2.team_name  AS team2_name,
    t2.short_name AS team2_short,
    w.team_name   AS winner_name,
    p.player_name AS player_of_match_name
FROM matches m
JOIN seasons  s  ON m.season_id = s.season_id
JOIN venues   v  ON m.venue_id  = v.venue_id
JOIN teams    t1 ON m.team1_id  = t1.team_id
JOIN teams    t2 ON m.team2_id  = t2.team_id
LEFT JOIN teams   w  ON m.winner_id = w.team_id
LEFT JOIN players p  ON m.player_of_match = p.player_id;

CREATE VIEW v_player_details AS
SELECT
    p.player_id,
    p.player_name,
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
    t.team_name,
    t.short_name AS team_short
FROM players p
LEFT JOIN teams t ON p.team_id = t.team_id;

CREATE VIEW v_team_win_counts AS
SELECT
    t.team_id,
    t.team_name,
    t.short_name,
    COUNT(m.match_id) AS total_wins
FROM teams t
LEFT JOIN matches m ON m.winner_id = t.team_id AND m.status = 'Completed'
GROUP BY t.team_id, t.team_name, t.short_name;
