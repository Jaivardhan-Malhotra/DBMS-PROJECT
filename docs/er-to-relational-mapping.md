# ER-to-Relational Mapping — IPL Management System

## 1. Overview

This document explains how each entity and relationship from the ER diagram has been translated into the MySQL relational schema for the IPL Management System.

---

## 2. Entity Mapping

### 2.1 PLAYER
| ER Attribute | SQL Column | Type | Constraints |
|---|---|---|---|
| player_id (PK) | player_id | INT AUTO_INCREMENT | PRIMARY KEY |
| name | player_name | VARCHAR(150) | NOT NULL |
| dob | dob | DATE | |
| nationality | nationality | VARCHAR(100) | DEFAULT 'Indian' |
| role | role | ENUM | NOT NULL; Batsman/Bowler/All-Rounder/Wicket-Keeper |
| batting_style | batting_style | ENUM | Right-Hand/Left-Hand |
| bowling_style | bowling_style | VARCHAR(100) | |
| jersey_no | jersey_no | TINYINT UNSIGNED | |
| matches_played | matches_played | SMALLINT UNSIGNED | |
| runs_scored | runs_scored | INT UNSIGNED | |
| wickets_taken | wickets_taken | SMALLINT UNSIGNED | |
| base_price | base_price | DECIMAL(10,2) | Auction value in crores |
| is_active | is_active | TINYINT(1) | 0=Retired, 1=Active |

**FK:** `team_id` → `teams.team_id` (ON DELETE SET NULL — player can exist without a team)

---

### 2.2 TEAM
| ER Attribute | SQL Column | Type | Constraints |
|---|---|---|---|
| team_id (PK) | team_id | INT AUTO_INCREMENT | PRIMARY KEY |
| team_name | team_name | VARCHAR(150) | UNIQUE NOT NULL |
| short_name | short_name | VARCHAR(10) | UNIQUE NOT NULL |
| city | city | VARCHAR(100) | NOT NULL |
| coach | coach | VARCHAR(100) | |
| jersey_color | jersey_color | VARCHAR(50) | |
| founded_year | founded_year | YEAR | |
| titles_won | titles_won | TINYINT UNSIGNED | |

**FKs:**
- `home_venue_id` → `venues.venue_id` (ON DELETE SET NULL)
- `captain_id` → `players.player_id` (ON DELETE SET NULL — circular ref resolved by deferring ALTER)

---

### 2.3 MATCH
| ER Attribute | SQL Column | Type | Constraints |
|---|---|---|---|
| match_id (PK) | match_id | INT AUTO_INCREMENT | PRIMARY KEY |
| match_date | match_date | DATE | NOT NULL |
| match_time | match_time | TIME | |
| match_type | match_type | ENUM | League/Qualifier/Eliminator/Final/Super Over |
| status | status | ENUM | Scheduled/Live/Completed/Cancelled/No Result |
| win_margin | win_margin | SMALLINT UNSIGNED | |
| win_type | win_type | ENUM | Runs/Wickets/Super Over/No Result |

**FKs:**
- `season_id` → `seasons.season_id` (ON DELETE RESTRICT — match belongs to a season)
- `venue_id` → `venues.venue_id` (ON DELETE RESTRICT)
- `team1_id` → `teams.team_id` (ON DELETE RESTRICT)
- `team2_id` → `teams.team_id` (ON DELETE RESTRICT)
- `winner_id` → `teams.team_id` (ON DELETE SET NULL — result nullable)
- `toss_winner_id` → `teams.team_id` (ON DELETE SET NULL)
- `player_of_match` → `players.player_id` (ON DELETE SET NULL)

**CHECK:** `team1_id <> team2_id` — enforces different teams

---

### 2.4 SEASON
| ER Attribute | SQL Column | Type | Constraints |
|---|---|---|---|
| season_id (PK) | season_id | INT AUTO_INCREMENT | PRIMARY KEY |
| season_year | season_year | YEAR | UNIQUE NOT NULL |
| start_date | start_date | DATE | NOT NULL |
| end_date | end_date | DATE | NOT NULL |
| host_country | host_country | VARCHAR(100) | |
| total_teams | total_teams | TINYINT UNSIGNED | |
| total_matches | total_matches | TINYINT UNSIGNED | |

**FKs:**
- `champion_team_id` → `teams.team_id` (ON DELETE SET NULL)
- `runner_up_team_id` → `teams.team_id` (ON DELETE SET NULL)

---

### 2.5 VENUE
| ER Attribute | SQL Column | Type | Constraints |
|---|---|---|---|
| venue_id (PK) | venue_id | INT AUTO_INCREMENT | PRIMARY KEY |
| venue_name | venue_name | VARCHAR(150) | UNIQUE NOT NULL |
| city | city | VARCHAR(100) | NOT NULL |
| country | country | VARCHAR(100) | |
| capacity | capacity | INT UNSIGNED | |
| pitch_type | pitch_type | VARCHAR(50) | |
| established_year | established_year | YEAR | |

---

### 2.6 UMPIRE
| ER Attribute | SQL Column | Type | Constraints |
|---|---|---|---|
| umpire_id (PK) | umpire_id | INT AUTO_INCREMENT | PRIMARY KEY |
| umpire_name | umpire_name | VARCHAR(150) | NOT NULL |
| nationality | nationality | VARCHAR(100) | |
| experience_years | experience_years | TINYINT UNSIGNED | |
| matches_officiated | matches_officiated | SMALLINT UNSIGNED | |
| umpire_type | umpire_type | ENUM | On-Field/Third Umpire/Match Referee |
| is_active | is_active | TINYINT(1) | |

---

### 2.7 SPONSOR
| ER Attribute | SQL Column | Type | Constraints |
|---|---|---|---|
| sponsor_id (PK) | sponsor_id | INT AUTO_INCREMENT | PRIMARY KEY |
| sponsor_name | sponsor_name | VARCHAR(150) | UNIQUE NOT NULL |
| industry | industry | VARCHAR(100) | |
| website | website | VARCHAR(255) | |
| country | country | VARCHAR(100) | |

---

### 2.8 AWARDS
| ER Attribute | SQL Column | Type | Constraints |
|---|---|---|---|
| award_id (PK) | award_id | INT AUTO_INCREMENT | PRIMARY KEY |
| award_name | award_name | VARCHAR(150) | NOT NULL |
| award_type | award_type | ENUM | Batting/Bowling/Fielding/Overall/Team/Special |
| description | description | TEXT | |

**FK:** `season_id` → `seasons.season_id` (ON DELETE SET NULL)

---

### 2.9 INNINGS
| ER Attribute | SQL Column | Type | Constraints |
|---|---|---|---|
| innings_id (PK) | innings_id | INT AUTO_INCREMENT | PRIMARY KEY |
| innings_no | innings_no | TINYINT | 1 or 2 |
| total_runs | total_runs | SMALLINT UNSIGNED | |
| total_wickets | total_wickets | TINYINT UNSIGNED | |
| total_overs | total_overs | DECIMAL(4,1) | |
| extras | extras | SMALLINT UNSIGNED | |
| is_completed | is_completed | TINYINT(1) | |

**FKs:**
- `match_id` → `matches.match_id` (ON DELETE CASCADE)
- `batting_team_id` → `teams.team_id` (ON DELETE RESTRICT)
- `bowling_team_id` → `teams.team_id` (ON DELETE RESTRICT)

**UNIQUE:** `(match_id, innings_no)` — only one innings 1 and one innings 2 per match
**CHECK:** `batting_team_id <> bowling_team_id`

---

### 2.10 OWNER
| ER Attribute | SQL Column | Type | Constraints |
|---|---|---|---|
| owner_id (PK) | owner_id | INT AUTO_INCREMENT | PRIMARY KEY |
| owner_name | owner_name | VARCHAR(150) | NOT NULL |
| net_worth | net_worth | DECIMAL(15,2) | In USD |
| nationality | nationality | VARCHAR(100) | |
| since_year | since_year | YEAR | |
| contact | contact | VARCHAR(150) | |

**FK:** `team_id` → `teams.team_id` (UNIQUE — 1:1 relationship with team)

---

## 3. Relationship Mapping

### 3.1 Many-to-Many Relationships (Junction Tables)

#### PLAYER ↔ MATCH: `player_match`
Records individual player performance in each match.

| Column | Type | Description |
|---|---|---|
| match_id | INT (FK) | References matches |
| player_id | INT (FK) | References players |
| team_id | INT (FK) | Player's team in this match |
| runs_scored, balls_faced, fours, sixes | stats | Batting stats |
| wickets_taken, overs_bowled, runs_conceded | stats | Bowling stats |
| catches, stumpings | stats | Fielding stats |
| is_out | TINYINT(1) | Dismissal flag |

**PK:** UNIQUE `(match_id, player_id)`

#### MATCH ↔ UMPIRE: `match_umpires`
Records which umpires officiated each match and their role.

| Column | Description |
|---|---|
| match_id (FK) | Match reference |
| umpire_id (FK) | Umpire reference |
| role | On-Field 1 / On-Field 2 / Third Umpire / Match Referee |

**PK:** `(match_id, umpire_id)`

#### TEAM ↔ SPONSOR: `team_sponsors`
Records sponsorship deals between teams and sponsors.

| Column | Description |
|---|---|
| team_id (FK) | Team reference |
| sponsor_id (FK) | Sponsor reference |
| contract_value | Deal value (DECIMAL) |
| start_year, end_year | Contract period |
| sponsorship_type | Title / Kit / Associate / Official Partner |

**PK:** `(team_id, sponsor_id)`

#### PLAYER ↔ AWARD: `player_awards`
Records which players received which awards in which seasons.

| Column | Description |
|---|---|
| player_id (FK) | Player reference |
| award_id (FK) | Award reference |
| season_id (FK) | Season of award |
| awarded_on | Date of ceremony |

**UNIQUE:** `(player_id, award_id, season_id)`

---

## 4. Referential Integrity Decisions

| Scenario | Decision | Reason |
|---|---|---|
| Delete a team | RESTRICTED — FKs in matches prevent deletion if matches exist | Preserves match history |
| Delete a player | Sets FK to NULL in team captain and match PoM | Player can be removed without breaking match records |
| Delete a venue | RESTRICTED if matches exist | Venue history preserved |
| Delete a season | RESTRICTED if matches exist | Season integrity |
| Delete a match | CASCADE to innings and player_match | Match sub-records are meaningless without the match |
| Delete a sponsor | CASCADE in team_sponsors | Sponsor removal clears associations |

---

## 5. Views Created

| View | Purpose |
|---|---|
| `v_match_details` | Pre-JOINed match data with team/venue/season names |
| `v_player_details` | Players with team names |
| `v_team_win_counts` | Aggregate win count per team |

---

## 6. Normalization Notes

The schema is in **Third Normal Form (3NF)**:
- All attributes depend on the primary key (1NF)
- No partial dependencies on composite keys (2NF)
- No transitive dependencies (3NF)

Exception: `matches_played`, `runs_scored`, `wickets_taken` in the `players` table are denormalized aggregate columns for performance. They should be updated via the `player_match` junction table in a real production system using triggers or application logic.
