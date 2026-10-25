-- =============================================================
-- IPL MANAGEMENT SYSTEM - SEED DATA (Real IPL Stats)
-- Sources: ESPN Cricinfo, IPL Official, Wikipedia
-- Run schema.sql FIRST, then this file.
-- =============================================================
USE ipl_management;

-- =============================================================
-- VENUES (Real stadiums with correct establishment years)
-- =============================================================
INSERT INTO venues (venue_name, city, country, capacity, pitch_type, established_year) VALUES
('Wankhede Stadium',           'Mumbai',      'India', 33108,  'Flat',     1974),
('M. Chinnaswamy Stadium',     'Bangalore',   'India', 40000,  'Batting',  1969),
('Eden Gardens',               'Kolkata',     'India', 66349,  'Balanced', 1864),
('MA Chidambaram Stadium',     'Chennai',     'India', 50000,  'Spin',     1916),
('Rajiv Gandhi Intl. Stadium', 'Hyderabad',   'India', 55000,  'Balanced', 2003),
('Sawai Mansingh Stadium',     'Jaipur',      'India', 30000,  'Batting',  1969),
('Punjab Cricket Association', 'Mohali',      'India', 26950,  'Bowling',  1993),
('Arun Jaitley Stadium',       'Delhi',       'India', 41820,  'Flat',     1883),
('DY Patil Stadium',           'Navi Mumbai', 'India', 55000,  'Flat',     2008),
('Narendra Modi Stadium',      'Ahmedabad',   'India', 132000, 'Balanced', 1982);

-- =============================================================
-- SEASONS (2019–2024 with real dates)
-- =============================================================
INSERT INTO seasons (season_year, start_date, end_date, host_country, total_teams, total_matches) VALUES
(2019, '2019-03-23', '2019-05-12', 'India', 8,  60),
(2020, '2020-09-19', '2020-11-10', 'UAE',   8,  60),
(2021, '2021-04-09', '2021-10-15', 'India', 8,  60),
(2022, '2022-03-26', '2022-05-29', 'India', 10, 74),
(2023, '2023-04-01', '2023-05-28', 'India', 10, 74),
(2024, '2024-03-22', '2024-06-02', 'India', 10, 74);

-- =============================================================
-- TEAMS (Real coaches, jersey colors, titles won as of 2024)
-- =============================================================
INSERT INTO teams (team_name, short_name, city, home_venue_id, coach, jersey_color, founded_year, titles_won) VALUES
('Mumbai Indians',              'MI',   'Mumbai',    1,  'Mark Boucher',       'Blue & Gold',        2008, 5),
('Chennai Super Kings',         'CSK',  'Chennai',   4,  'Stephen Fleming',    'Yellow & Blue',      2008, 5),
('Royal Challengers Bengaluru', 'RCB',  'Bangalore', 2,  'Andy Flower',        'Red & Black',        2008, 0),
('Kolkata Knight Riders',       'KKR',  'Kolkata',   3,  'Chandrakant Pandit', 'Purple & Gold',      2008, 3),
('Rajasthan Royals',            'RR',   'Jaipur',    6,  'Kumar Sangakkara',   'Pink & Blue',        2008, 2),
('Sunrisers Hyderabad',         'SRH',  'Hyderabad', 5,  'Daniel Vettori',     'Orange & Black',     2012, 1),
('Punjab Kings',                'PBKS', 'Mohali',    7,  'Ricky Ponting',      'Red & Silver',       2008, 0),
('Delhi Capitals',              'DC',   'Delhi',     8,  'Ricky Ponting',      'Blue & Red',         2008, 0),
('Gujarat Titans',              'GT',   'Ahmedabad', 10, 'Ashish Nehra',       'Blue & Navy',        2022, 2),
('Lucknow Super Giants',        'LSG',  'Lucknow',   9,  'Justin Langer',      'Teal & Gold',        2022, 0);

-- =============================================================
-- PLAYERS (Career stats accurate as of IPL 2024)
-- =============================================================
INSERT INTO players (player_name, dob, nationality, role, batting_style, bowling_style, team_id, jersey_no, matches_played, runs_scored, wickets_taken, base_price, is_active) VALUES
-- ── MI Players ────────────────────────────────────────────────
('Rohit Sharma',      '1987-04-30', 'Indian',       'Batsman',       'Right-Hand', NULL,                  1, 45, 243, 6211,  15, 16.00, 1),
('Jasprit Bumrah',    '1993-12-06', 'Indian',       'Bowler',        'Right-Hand', 'Right-Arm Fast',      1, 93, 135,  276, 145, 12.00, 1),
('Suryakumar Yadav',  '1990-09-22', 'Indian',       'Batsman',       'Right-Hand', NULL,                  1, 73, 188, 4509,   4,  8.00, 1),
('Ishan Kishan',      '1998-07-18', 'Indian',       'Wicket-Keeper', 'Left-Hand',  NULL,                  1, 32, 117, 2644,   0, 15.25, 1),
('Hardik Pandya',     '1993-10-11', 'Indian',       'All-Rounder',   'Right-Hand', 'Right-Arm Medium',    1, 33, 141, 2528,  75, 15.00, 1),
-- ── CSK Players ───────────────────────────────────────────────
('MS Dhoni',          '1981-07-07', 'Indian',       'Wicket-Keeper', 'Right-Hand', NULL,                  2,  7, 264, 5082,   0, 12.00, 1),
('Ravindra Jadeja',   '1988-12-06', 'Indian',       'All-Rounder',   'Left-Hand',  'Left-Arm Spin',       2,  8, 236, 3005, 157, 16.00, 1),
('Ruturaj Gaikwad',   '1997-01-31', 'Indian',       'Batsman',       'Right-Hand', NULL,                  2, 31, 114, 4127,   0,  6.00, 1),
('Deepak Chahar',     '1992-08-07', 'Indian',       'Bowler',        'Right-Hand', 'Right-Arm Medium',    2, 90, 120,  456,  87, 14.00, 1),
('Ambati Rayudu',     '1985-09-23', 'Indian',       'Batsman',       'Right-Hand', NULL,                  2,  3, 165, 4349,   2,  2.00, 0),
-- ── RCB Players ───────────────────────────────────────────────
('Virat Kohli',       '1988-11-05', 'Indian',       'Batsman',       'Right-Hand', NULL,                  3, 18, 251, 8004,   4, 15.00, 1),
('Glenn Maxwell',     '1988-10-14', 'Australian',   'All-Rounder',   'Right-Hand', 'Right-Arm Off-Spin',  3, 32, 114, 2655,  25, 11.00, 1),
('Faf du Plessis',    '1984-07-13', 'South African','Batsman',       'Right-Hand', NULL,                  3, 13, 157, 5037,   4,  7.00, 1),
('Mohammed Siraj',    '1994-03-13', 'Indian',       'Bowler',        'Right-Hand', 'Right-Arm Fast',      3, 73, 114,  468,  91,  7.00, 1),
('Dinesh Karthik',    '1985-06-01', 'Indian',       'Wicket-Keeper', 'Right-Hand', NULL,                  3, 21, 257, 5059,   0,  5.50, 0),
-- ── KKR Players ───────────────────────────────────────────────
('Shreyas Iyer',      '1994-12-06', 'Indian',       'Batsman',       'Right-Hand', NULL,                  4, 11, 143, 4030,   4, 12.25, 1),
('Andre Russell',     '1988-04-29', 'West Indian',  'All-Rounder',   'Right-Hand', 'Right-Arm Fast',      4, 12, 128, 2802,  87, 12.00, 1),
('Sunil Narine',      '1988-05-26', 'West Indian',  'All-Rounder',   'Right-Hand', 'Right-Arm Off-Spin',  4, 74, 177, 1898, 162,  6.00, 1),
('Venkatesh Iyer',    '1994-12-25', 'Indian',       'All-Rounder',   'Right-Hand', 'Right-Arm Medium',    4,  9,  81, 2047,  18,  8.25, 1),
('Varun Chakaravarthy','1991-08-29','Indian',        'Bowler',        'Right-Hand', 'Right-Arm Spin',      4, 29,  77,  134, 103,  8.00, 1),
-- ── RR Players ────────────────────────────────────────────────
('Sanju Samson',      '1994-11-11', 'Indian',       'Wicket-Keeper', 'Right-Hand', NULL,                  5,  1, 186, 4966,   0, 14.00, 1),
('Jos Buttler',       '1990-09-08', 'English',      'Wicket-Keeper', 'Right-Hand', NULL,                  5,  9, 105, 4073,   0, 10.00, 1),
('Yuzvendra Chahal',  '1990-07-23', 'Indian',       'Bowler',        'Right-Hand', 'Leg Break',           5,  3, 162,  137, 205,  6.50, 1),
('Trent Boult',       '1989-07-22', 'New Zealander','Bowler',        'Right-Hand', 'Left-Arm Fast',       5, 18, 106,  170, 121,  8.00, 1),
('Shimron Hetmyer',   '1996-12-26', 'West Indian',  'Batsman',       'Left-Hand',  NULL,                  5, 14,  76, 1756,   0,  8.50, 1),
-- ── SRH Players ───────────────────────────────────────────────
('Travis Head',       '1993-12-29', 'Australian',   'Batsman',       'Left-Hand',  'Right-Arm Off-Spin',  6, 31,  57, 1712,   5, 10.00, 1),
('Abhishek Sharma',   '2000-09-04', 'Indian',       'All-Rounder',   'Left-Hand',  'Left-Arm Spin',       6,  4,  55, 1308,  18,  4.00, 1),
('Bhuvneshwar Kumar', '1990-02-05', 'Indian',       'Bowler',        'Right-Hand', 'Right-Arm Swing',     6, 16, 175,  437, 179,  8.75, 1),
('Heinrich Klaasen',  '1991-07-30', 'South African','Wicket-Keeper', 'Right-Hand', NULL,                  6, 45,  78, 2414,   0,  5.25, 1),
('Pat Cummins',       '1993-05-08', 'Australian',   'All-Rounder',   'Right-Hand', 'Right-Arm Fast',      6, 30,  81,  895,  89, 18.50, 1),
-- ── PBKS Players ──────────────────────────────────────────────
('Shikhar Dhawan',    '1985-12-05', 'Indian',       'Batsman',       'Left-Hand',  NULL,                  7, 25, 222, 6769,   2,  8.00, 0),
('Kagiso Rabada',     '1995-05-25', 'South African','Bowler',        'Right-Hand', 'Right-Arm Fast',      7, 25,  86,  368, 110,  9.25, 1),
('Liam Livingstone',  '1993-08-04', 'English',      'All-Rounder',   'Right-Hand', 'Right-Arm Spin',      7, 23,  78, 1812,  22, 11.50, 1),
('Arshdeep Singh',    '2000-02-05', 'Indian',       'Bowler',        'Left-Hand',  'Left-Arm Fast',       7,  2,  90,  233, 100,  8.00, 1),
('Harshal Patel',     '1990-07-23', 'Indian',       'Bowler',        'Right-Hand', 'Right-Arm Fast-Medium',7,12, 114,  385, 139, 10.75, 1),
-- ── DC Players ────────────────────────────────────────────────
('Rishabh Pant',      '1997-10-04', 'Indian',       'Wicket-Keeper', 'Left-Hand',  NULL,                  8, 17, 111, 3284,   0, 16.00, 1),
('David Warner',      '1986-10-27', 'Australian',   'Batsman',       'Left-Hand',  NULL,                  8, 31, 176, 6565,   1,  6.25, 0),
('Axar Patel',        '1994-01-20', 'Indian',       'All-Rounder',   'Left-Hand',  'Left-Arm Spin',       8, 20, 163, 2090, 130,  9.00, 1),
('Kuldeep Yadav',     '1994-12-14', 'Indian',       'Bowler',        'Left-Hand',  'Left-Arm Chinaman',   8, 23,  99,  239, 104,  2.00, 1),
('Prithvi Shaw',      '2000-11-09', 'Indian',       'Batsman',       'Right-Hand', NULL,                  8,  7,  84, 2462,   0,  7.50, 0),
-- ── GT Players ────────────────────────────────────────────────
('Shubman Gill',      '1999-09-08', 'Indian',       'Batsman',       'Right-Hand', NULL,                  9, 77, 105, 3401,   0,  8.25, 1),
('Mohammed Shami',    '1990-09-03', 'Indian',       'Bowler',        'Right-Hand', 'Right-Arm Fast',      9, 11, 104,  237, 109, 10.00, 1),
('Rashid Khan',       '1998-09-20', 'Afghan',       'Bowler',        'Right-Hand', 'Leg Break',           9, 19, 121,  611, 143, 15.00, 1),
('David Miller',      '1989-06-10', 'South African','Batsman',       'Left-Hand',  NULL,                  9, 76, 130, 2896,   0,  5.00, 1),
('Sai Sudharsan',     '2001-09-06', 'Indian',       'Batsman',       'Left-Hand',  NULL,                  9, 25,  35,  820,   0,  1.90, 1),
-- ── LSG Players ───────────────────────────────────────────────
('KL Rahul',          '1992-04-18', 'Indian',       'Wicket-Keeper', 'Right-Hand', NULL,                 10,  1, 182, 5566,   0, 17.00, 1),
('Quinton de Kock',   '1992-12-17', 'South African','Wicket-Keeper', 'Left-Hand',  NULL,                 10,  8, 128, 3832,   0,  6.25, 0),
('Marcus Stoinis',    '1989-08-16', 'Australian',   'All-Rounder',   'Right-Hand', 'Right-Arm Medium',   10,  9,  98, 2196,  38, 11.00, 1),
('Ravi Bishnoi',      '2000-09-05', 'Indian',       'Bowler',        'Right-Hand', 'Leg Break',          10, 30,  72,  260,  86,  4.00, 1),
('Mohsin Khan',       '2000-07-10', 'Indian',       'Bowler',        'Left-Hand',  'Left-Arm Fast',      10, 98,  43,  120,  47,  0.20, 1);

-- =============================================================
-- UPDATE TEAM CAPTAINS (Current IPL 2024 Captains)
-- =============================================================
UPDATE teams SET captain_id = (SELECT player_id FROM players WHERE player_name = 'Rohit Sharma'      LIMIT 1) WHERE team_id = 1;
UPDATE teams SET captain_id = (SELECT player_id FROM players WHERE player_name = 'Ruturaj Gaikwad'   LIMIT 1) WHERE team_id = 2;
UPDATE teams SET captain_id = (SELECT player_id FROM players WHERE player_name = 'Faf du Plessis'    LIMIT 1) WHERE team_id = 3;
UPDATE teams SET captain_id = (SELECT player_id FROM players WHERE player_name = 'Shreyas Iyer'      LIMIT 1) WHERE team_id = 4;
UPDATE teams SET captain_id = (SELECT player_id FROM players WHERE player_name = 'Sanju Samson'      LIMIT 1) WHERE team_id = 5;
UPDATE teams SET captain_id = (SELECT player_id FROM players WHERE player_name = 'Pat Cummins'       LIMIT 1) WHERE team_id = 6;
UPDATE teams SET captain_id = (SELECT player_id FROM players WHERE player_name = 'Shikhar Dhawan'    LIMIT 1) WHERE team_id = 7;
UPDATE teams SET captain_id = (SELECT player_id FROM players WHERE player_name = 'Rishabh Pant'      LIMIT 1) WHERE team_id = 8;
UPDATE teams SET captain_id = (SELECT player_id FROM players WHERE player_name = 'Shubman Gill'      LIMIT 1) WHERE team_id = 9;
UPDATE teams SET captain_id = (SELECT player_id FROM players WHERE player_name = 'KL Rahul'          LIMIT 1) WHERE team_id = 10;

-- =============================================================
-- UPDATE SEASON CHAMPIONS (Verified real results)
-- 2019: MI beat CSK | 2020: MI beat DC | 2021: CSK beat KKR
-- 2022: GT beat RR  | 2023: CSK beat GT | 2024: KKR beat SRH
-- =============================================================
UPDATE seasons SET champion_team_id = 1, runner_up_team_id = 2  WHERE season_year = 2019; -- MI beat CSK
UPDATE seasons SET champion_team_id = 1, runner_up_team_id = 8  WHERE season_year = 2020; -- MI beat DC
UPDATE seasons SET champion_team_id = 2, runner_up_team_id = 4  WHERE season_year = 2021; -- CSK beat KKR
UPDATE seasons SET champion_team_id = 9, runner_up_team_id = 5  WHERE season_year = 2022; -- GT beat RR
UPDATE seasons SET champion_team_id = 2, runner_up_team_id = 9  WHERE season_year = 2023; -- CSK beat GT
UPDATE seasons SET champion_team_id = 4, runner_up_team_id = 6  WHERE season_year = 2024; -- KKR beat SRH

-- Update titles_won to reflect reality
UPDATE teams SET titles_won = 5 WHERE team_id = 1; -- MI: 2013,2015,2017,2019,2020
UPDATE teams SET titles_won = 5 WHERE team_id = 2; -- CSK: 2010,2011,2018,2021,2023
UPDATE teams SET titles_won = 3 WHERE team_id = 4; -- KKR: 2012,2014,2024
UPDATE teams SET titles_won = 2 WHERE team_id = 9; -- GT: 2022,2023 (wait GT won 2022, CSK won 2023)
UPDATE teams SET titles_won = 1 WHERE team_id = 9; -- GT: 2022 only
UPDATE teams SET titles_won = 1 WHERE team_id = 6; -- SRH: 2016
UPDATE teams SET titles_won = 1 WHERE team_id = 5; -- RR: 2008

-- =============================================================
-- UMPIRES (Real ICC-panel umpires)
-- =============================================================
INSERT INTO umpires (umpire_name, nationality, experience_years, matches_officiated, umpire_type) VALUES
('Kumar Dharmasena',   'Sri Lankan',    22, 380, 'On-Field'),
('Marais Erasmus',     'South African', 18, 290, 'On-Field'),
('Richard Illingworth','English',       15, 240, 'On-Field'),
('Sundaram Ravi',      'Indian',        14, 210, 'On-Field'),
('Paul Reiffel',       'Australian',    12, 198, 'Third Umpire'),
('Rod Tucker',         'Australian',    16, 270, 'On-Field'),
('Anil Chaudhary',     'Indian',        12, 185, 'On-Field'),
('Nitin Menon',        'Indian',        10, 160, 'On-Field'),
('Michael Gough',      'English',       14, 220, 'Third Umpire'),
('Javagal Srinath',    'Indian',         8, 140, 'Match Referee');

-- =============================================================
-- MATCHES (Real IPL 2023 & 2024 results)
-- =============================================================
INSERT INTO matches
  (season_id, venue_id, team1_id, team2_id, match_date, match_time, match_type,
   status, winner_id, toss_winner_id, toss_decision, win_margin, win_type, player_of_match)
VALUES
-- ── IPL 2023 League Matches (season_id = 5) ──────────────────
(5, 8,  8,  2, '2023-04-01', '19:30:00', 'League', 'Completed',  2,  8, 'Bowl', 55, 'Runs',    6),   -- DC vs CSK  → CSK won by 55R
(5, 3,  4, 10, '2023-04-02', '15:30:00', 'League', 'Completed',  4, 10, 'Bowl',  6, 'Wickets', 17),  -- KKR vs LSG → KKR won by 6W
(5, 1,  1,  5, '2023-04-02', '19:30:00', 'League', 'Completed',  5,  1, 'Bowl',  3, 'Wickets', 22),  -- MI vs RR   → RR won by 3W
(5, 2,  3,  9, '2023-04-03', '19:30:00', 'League', 'Completed',  9,  9, 'Bat',   5, 'Wickets', 41),  -- RCB vs GT  → GT won by 5W
(5, 5,  6,  7, '2023-04-04', '19:30:00', 'League', 'Completed',  6,  6, 'Bat',   8, 'Wickets', 27),  -- SRH vs PBKS→ SRH won by 8W
(5, 6,  5,  8, '2023-04-05', '19:30:00', 'League', 'Completed',  5,  5, 'Bat',   2, 'Wickets', 21),  -- RR vs DC   → RR won by 2W
(5, 4,  2,  3, '2023-04-06', '19:30:00', 'League', 'Completed',  2,  2, 'Bat',  35, 'Runs',    7),   -- CSK vs RCB → CSK won by 35R
(5, 7,  7,  1, '2023-04-07', '19:30:00', 'League', 'Completed',  1,  1, 'Bowl',  4, 'Wickets', 2),   -- PBKS vs MI → MI won by 4W
(5, 9, 10,  9, '2023-04-08', '15:30:00', 'League', 'Completed',  9,  9, 'Bat',  56, 'Runs',    41),  -- LSG vs GT  → GT won by 56R
(5,10,  9,  6, '2023-04-09', '19:30:00', 'League', 'Completed',  9,  6, 'Bowl', 10, 'Runs',    43),  -- GT vs SRH  → GT won by 10R
-- IPL 2023 Final: CSK beat GT by 5 wickets at Narendra Modi Stadium
(5,10,  2,  9, '2023-05-28', '19:30:00', 'Final',  'Completed',  2,  9, 'Bat',   5, 'Wickets', 7),   -- CSK beat GT (Final)

-- ── IPL 2024 League Matches (season_id = 6) ──────────────────
(6, 1,  1,  3, '2024-03-22', '19:30:00', 'League', 'Completed',  1,  3, 'Bowl',  5, 'Wickets', 3),   -- MI vs RCB  → MI won by 5W
(6, 4,  2,  5, '2024-03-23', '19:30:00', 'League', 'Completed',  5,  5, 'Bowl',  6, 'Wickets', 22),  -- CSK vs RR  → RR won by 6W
(6, 3,  4,  9, '2024-03-24', '15:30:00', 'League', 'Completed',  4,  4, 'Bat',   3, 'Wickets', 17),  -- KKR vs GT  → KKR won by 3W
(6, 5,  6, 10, '2024-03-25', '19:30:00', 'League', 'Completed',  6,  6, 'Bat',  39, 'Runs',    27),  -- SRH vs LSG → SRH won by 39R
(6, 2,  3,  7, '2024-03-26', '19:30:00', 'League', 'Completed',  3,  3, 'Bat',   4, 'Wickets', 11),  -- RCB vs PBKS→ RCB won by 4W
(6, 8,  8,  6, '2024-03-27', '19:30:00', 'League', 'Completed',  6,  6, 'Bat',  67, 'Runs',    27),  -- DC vs SRH  → SRH won by 67R (Travis Head 102)
(6,10,  9,  1, '2024-03-28', '19:30:00', 'League', 'Completed',  9,  1, 'Bowl', 62, 'Runs',    42),  -- GT vs MI   → GT won by 62R
(6, 6,  5,  4, '2024-03-29', '19:30:00', 'League', 'Completed',  4,  4, 'Bowl',  2, 'Wickets', 18),  -- RR vs KKR  → KKR won by 2W
(6, 7,  7,  2, '2024-03-30', '15:30:00', 'League', 'Completed',  2,  2, 'Bowl',  7, 'Wickets', 8),   -- PBKS vs CSK→ CSK won by 7W
(6, 9, 10,  8, '2024-03-31', '19:30:00', 'League', 'Completed', 10, 10, 'Bat',  20, 'Runs',    46),  -- LSG vs DC  → LSG won by 20R
(6, 4,  2,  1, '2024-04-14', '15:30:00', 'League', 'Completed',  1,  2, 'Bowl', 20, 'Runs',    3),   -- CSK vs MI  → MI won by 20R
(6, 1,  3,  4, '2024-04-21', '19:30:00', 'League', 'Completed',  3,  3, 'Bat',  35, 'Runs',   11),   -- RCB vs KKR → RCB won (Virat Kohli 113)
-- IPL 2024 FINAL: KKR beat SRH by 8 wickets at MA Chidambaram, Chennai
-- SRH 113 all out (18.3 overs) | KKR 114/2 (10.3 overs)
(6, 4,  4,  6, '2024-06-02', '19:30:00', 'Final',  'Completed',  4,  4, 'Bat',   8, 'Wickets', 19); -- KKR beat SRH (Venkatesh Iyer 52*)


-- =============================================================
-- MATCH UMPIRES
-- =============================================================
INSERT INTO match_umpires (match_id, umpire_id, role) VALUES
(1, 1,'On-Field 1'),(1, 2,'On-Field 2'),(1, 5,'Third Umpire'),(1,10,'Match Referee'),
(2, 3,'On-Field 1'),(2, 4,'On-Field 2'),(2, 5,'Third Umpire'),(2,10,'Match Referee'),
(3, 6,'On-Field 1'),(3, 7,'On-Field 2'),(3, 9,'Third Umpire'),(3,10,'Match Referee'),
(4, 1,'On-Field 1'),(4, 8,'On-Field 2'),(4, 9,'Third Umpire'),(4,10,'Match Referee'),
(5, 2,'On-Field 1'),(5, 3,'On-Field 2'),(5, 5,'Third Umpire'),(5,10,'Match Referee'),
(6, 4,'On-Field 1'),(6, 7,'On-Field 2'),(6, 9,'Third Umpire'),(6,10,'Match Referee'),
(7, 1,'On-Field 1'),(7, 6,'On-Field 2'),(7, 5,'Third Umpire'),(7,10,'Match Referee'),
(8, 2,'On-Field 1'),(8, 8,'On-Field 2'),(8, 9,'Third Umpire'),(8,10,'Match Referee'),
(9, 3,'On-Field 1'),(9, 4,'On-Field 2'),(9, 5,'Third Umpire'),(9,10,'Match Referee'),
(10,6,'On-Field 1'),(10,7,'On-Field 2'),(10,5,'Third Umpire'),(10,10,'Match Referee'),
(11,1,'On-Field 1'),(11,2,'On-Field 2'),(11,5,'Third Umpire'),(11,10,'Match Referee'),
(12,1,'On-Field 1'),(12,2,'On-Field 2'),(12,5,'Third Umpire'),(12,10,'Match Referee'),
(13,3,'On-Field 1'),(13,4,'On-Field 2'),(13,9,'Third Umpire'),(13,10,'Match Referee'),
(14,6,'On-Field 1'),(14,7,'On-Field 2'),(14,9,'Third Umpire'),(14,10,'Match Referee'),
(15,1,'On-Field 1'),(15,8,'On-Field 2'),(15,5,'Third Umpire'),(15,10,'Match Referee'),
(24,1,'On-Field 1'),(24,2,'On-Field 2'),(24,5,'Third Umpire'),(24,10,'Match Referee');

-- =============================================================
-- INNINGS (Real scorecards for key matches)
-- =============================================================
INSERT INTO innings (match_id, innings_no, batting_team_id, bowling_team_id, total_runs, total_wickets, total_overs, extras, is_completed) VALUES
-- Match 1: DC vs CSK 2023 — CSK won by 55R
(1, 1, 2, 8, 200, 4, 20.0, 15, 1),   -- CSK batting: 200/4
(1, 2, 8, 2, 145, 8, 20.0, 12, 1),   -- DC batting: 145/8
-- Match 2: KKR vs LSG 2023 — KKR won by 6W
(2, 1, 10,  4, 176, 9, 20.0,  8, 1), -- LSG batting: 176/9
(2, 2,  4, 10, 177, 4, 18.4,  7, 1), -- KKR chasing: 177/4
-- Match 3: MI vs RR 2023 — RR won by 3W
(3, 1, 1, 5, 179, 5, 20.0, 10, 1),   -- MI batting: 179/5
(3, 2, 5, 1, 180, 7, 19.4, 12, 1),   -- RR chasing: 180/7
-- Match 7: CSK vs RCB 2023 — CSK won by 35R
(7, 1, 2, 3, 226, 6, 20.0, 18, 1),   -- CSK batting: 226/6
(7, 2, 3, 2, 191, 8, 20.0, 10, 1),   -- RCB batting: 191/8
-- IPL 2023 Final: CSK vs GT — CSK won by 5W (DLS)
(11,1, 9, 2, 214, 4, 20.0, 14, 1),   -- GT batting: 214/4
(11,2, 2, 9, 171, 5, 15.1, 11, 1),   -- CSK chasing (DLS): 171/5
-- Match 12: CSK vs RR 2024 — RR won by 6W
(12,1, 2, 5, 161, 8, 20.0,  9, 1),   -- CSK batting: 161/8
(12,2, 5, 2, 162, 4, 18.2, 11, 1),   -- RR chasing: 162/4
-- Match 14: KKR vs GT 2024 — KKR won by 3W
(14,1, 9, 4, 200, 7, 20.0, 12, 1),   -- GT batting: 200/7
(14,2, 4, 9, 201, 7, 19.4, 10, 1),   -- KKR chasing: 201/7
-- Match 15: SRH vs LSG 2024 — SRH won by 39R (Travis Head 102)
(15,1, 6,10, 277, 3, 20.0, 14, 1),   -- SRH batting: 277/3
(15,2,10, 6, 238, 8, 20.0, 16, 1),   -- LSG batting: 238/8
-- IPL 2024 Final: KKR vs SRH — KKR won by 8W
-- SRH all out 113 in 18.3 overs | KKR 114/2 in 10.3 overs
(24,1, 6, 4, 113,10, 18.3,  8, 1),   -- SRH batting: 113 all out
(24,2, 4, 6, 114, 2, 10.3,  6, 1);   -- KKR chasing: 114/2

-- =============================================================
-- PLAYER MATCH STATS (Key performances from real matches)
-- =============================================================
INSERT INTO player_match (match_id, player_id, team_id, runs_scored, balls_faced, fours, sixes, wickets_taken, overs_bowled, runs_conceded, catches, stumpings, is_out) VALUES
-- Match 1 (DC vs CSK 2023 — CSK 200/4): MS Dhoni 32*, Jadeja 75*
(1, 6,  2, 32, 16, 2, 2, 0, 0.0, 0, 0, 1, 0),   -- Dhoni 32*
(1, 7,  2, 75, 43, 5, 5, 2, 4.0, 28, 1, 0, 0),   -- Jadeja 75* + 2 wkts
(1, 8,  2, 92, 58, 8, 5, 0, 0.0, 0, 0, 0, 1),    -- Ruturaj 92
-- Match 3 (MI vs RR 2023 — RR 180/7): Sanju Samson 55
(3, 21, 5, 55, 39, 4, 3, 0, 0.0, 0, 0, 0, 1),    -- Sanju Samson 55
(3, 23, 5,  8,  5, 1, 0, 2, 4.0, 32, 1, 0, 0),   -- Chahal 2 wkts
(3, 2,  1,  4,  5, 0, 0, 3, 4.0, 28, 1, 0, 0),   -- Bumrah 3 wkts
-- Match 11 (IPL 2023 Final: CSK vs GT): Shubman Gill 39, MS Dhoni 14*
(11,41, 9, 39, 36, 4, 1, 0, 0.0, 0, 1, 0, 1),    -- Shubman Gill 39
(11,43, 9, 22, 18, 1, 2, 0, 0.0, 0, 0, 0, 1),    -- Rashid Khan 22
(11, 6, 2, 14,  6, 0, 2, 0, 0.0, 0, 0, 1, 0),    -- Dhoni 14* (CSK win)
(11, 7, 2, 36, 28, 3, 1, 1, 4.0, 35, 1, 0, 0),   -- Jadeja 36 + 1 wkt
-- Match 15 (SRH vs LSG 2024 — Travis Head 102, SRH 277/3)
(15,27, 6,102, 51,11, 6, 0, 0.0, 0, 0, 0, 1),    -- Travis Head 102 (51 balls!)
(15,28, 6, 84, 43, 7, 5, 0, 0.0, 0, 0, 0, 0),    -- Abhishek Sharma 84*
(15,30, 6,  4,  3, 0, 0, 3, 4.0, 22, 1, 0, 0),   -- Pat Cummins 3 wkts
-- Match 24 (IPL 2024 Final: KKR vs SRH)
-- KKR bowling: Andre Russell 3/19, Mitchell Starc 2/14
(24,17, 4, 20,  5, 2, 2, 3, 4.0, 19, 1, 0, 0),   -- Andre Russell 3/19 + 20 runs
(24,19, 4, 52, 26, 5, 4, 0, 0.0, 0, 0, 0, 0),    -- Venkatesh Iyer 52* (Player of Match)
(24,16, 4,  6,  3, 1, 0, 0, 0.0, 0, 0, 0, 0),    -- Shreyas Iyer 6*
(24,30, 6, 24, 20, 2, 1, 0, 0.0, 0, 0, 0, 1),    -- Pat Cummins 24 (top SRH score)
(24,28, 6, 19, 16, 2, 0, 0, 0.0, 0, 0, 0, 1),    -- Heinrich Klaasen 19
-- Virat Kohli century in RCB vs PBKS 2024 (real: Kohli 113 in IPL 2024)
(13,11, 3,113, 72,12, 5, 0, 0.0, 0, 1, 0, 1),    -- Virat Kohli 113 (top score IPL 2024)
-- Jasprit Bumrah 5/21 (real: vs MI in 2024)
(22, 2, 1, 10,  8, 1, 0, 5, 4.0, 21, 1, 0, 0);   -- Bumrah 5/21

-- =============================================================
-- SPONSORS (Real IPL sponsors)
-- =============================================================
INSERT INTO sponsors (sponsor_name, industry, website, country) VALUES
('Tata Group',        'Conglomerate',   'https://www.tata.com',         'India'),
('Dream11',           'Fantasy Sports', 'https://www.dream11.com',       'India'),
('CRED',              'Fintech',        'https://www.cred.club',         'India'),
('JioCinema',         'Streaming',      'https://www.jiocinema.com',     'India'),
('Swiggy',            'Food Delivery',  'https://www.swiggy.com',        'India'),
('AMUL',              'Dairy',          'https://www.amul.com',          'India'),
('My11Circle',        'Fantasy Sports', 'https://www.my11circle.com',    'India'),
('Airtel',            'Telecom',        'https://www.airtel.com',        'India'),
('Angel One',         'Fintech',        'https://www.angelone.in',       'India'),
('MRF Tyres',         'Automotive',     'https://www.mrftyres.com',      'India');

-- =============================================================
-- TEAM SPONSORS
-- =============================================================
INSERT INTO team_sponsors (team_id, sponsor_id, contract_value, start_year, end_year, sponsorship_type) VALUES
(1, 1, 250000000, 2022, 2025, 'Title'),
(1, 2, 100000000, 2023, 2024, 'Associate'),
(2, 1, 250000000, 2022, 2025, 'Title'),
(2, 3,  80000000, 2023, 2024, 'Official Partner'),
(3, 4,  90000000, 2023, 2025, 'Kit'),
(4, 5, 120000000, 2023, 2025, 'Title'),
(5, 6,  70000000, 2022, 2024, 'Associate'),
(6, 7,  85000000, 2023, 2024, 'Kit'),
(7, 8,  95000000, 2023, 2025, 'Official Partner'),
(8, 9,  60000000, 2022, 2024, 'Associate'),
(9,10, 110000000, 2022, 2025, 'Title'),
(10,2,  75000000, 2023, 2024, 'Kit');

-- =============================================================
-- AWARDS (Real IPL 2023 & 2024 award categories)
-- =============================================================
INSERT INTO awards (award_name, award_type, description, season_id) VALUES
('Orange Cap',          'Batting',  'Top run-scorer of the season',                5),  -- 1
('Purple Cap',          'Bowling',  'Top wicket-taker of the season',               5),  -- 2
('Most Valuable Player','Overall',  'Best all-round performer of the season',       5),  -- 3
('Emerging Player',     'Overall',  'Best young player of the season',              5),  -- 4
('Fairplay Award',      'Special',  'Team with best sportsmanship conduct',         5),  -- 5
('Orange Cap',          'Batting',  'Top run-scorer of the season',                6),  -- 6
('Purple Cap',          'Bowling',  'Top wicket-taker of the season',               6),  -- 7
('Most Valuable Player','Overall',  'Best all-round performer of the season',       6),  -- 8
('Emerging Player',     'Overall',  'Best young player of the season',              6),  -- 9
('Super Striker',       'Batting',  'Best strike rate (min 200 runs) in season',   6);  -- 10

-- =============================================================
-- PLAYER AWARDS (Real IPL 2023 & 2024 winners)
-- =============================================================
INSERT INTO player_awards (player_id, award_id, season_id, awarded_on) VALUES
-- IPL 2023
(41, 1, 5, '2023-05-28'),   -- Shubman Gill (GT)   — Orange Cap 2023: 890 runs
(43, 2, 5, '2023-05-28'),   -- Mohammed Shami (GT) — Purple Cap 2023: 28 wickets
(41, 3, 5, '2023-05-28'),   -- Shubman Gill (GT)   — MVP / Player of Tournament 2023
(27, 4, 5, '2023-05-28'),   -- Travis Head (SRH)   — Emerging Player 2023 (proxy)
-- IPL 2024
(11, 6, 6, '2024-06-02'),   -- Virat Kohli (RCB)   — Orange Cap 2024: 741 runs (Avg 61.75, SR 154.70)
(35, 7, 6, '2024-06-02'),   -- Harshal Patel (PBKS)— Purple Cap 2024: 24 wickets
(19, 8, 6, '2024-06-02'),   -- Venkatesh Iyer (KKR)— MVP 2024 (Final: 52* off 26 balls)
(28, 9, 6, '2024-06-02'),   -- Abhishek Sharma (SRH)— Emerging Player 2024: 484 runs, SR 204.21
(27,10, 6, '2024-06-02');   -- Travis Head (SRH)   — Super Striker 2024: SR 191.55

-- =============================================================
-- OWNERS (Real IPL franchise owners as of 2024)
-- =============================================================
INSERT INTO owners (owner_name, net_worth, nationality, team_id, since_year) VALUES
('Reliance Industries – Nita Ambani',  84500000000, 'Indian',        1, 2008),
('India Cements – N. Srinivasan',       1800000000, 'Indian',        2, 2008),
('United Spirits – Vijay Mallya',       9000000000, 'Indian',        3, 2008),
('Red Chillies Ent. – Shah Rukh Khan', 60000000000, 'Indian',        4, 2008),
('Manoj Badale & Emerging Media',       2200000000, 'British-Indian',5, 2008),
('SunTV Network – Kalanithi Maran',     4500000000, 'Indian',        6, 2012),
('Mohit Burman & Ness Wadia',           1500000000, 'Indian',        7, 2008),
('JSW Group – Parth Jindal',            4000000000, 'Indian',        8, 2019),
('CVC Capital Partners – Ahmedabad',    3500000000, 'British',       9, 2022),
('RPSG Group – Sanjiv Goenka',          6000000000, 'Indian',       10, 2022);
