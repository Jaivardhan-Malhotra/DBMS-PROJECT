# 🏏 IPL Management System

A full-stack web application for managing IPL (Indian Premier League) data — built for a college DBMS/ER Diagram assignment.

**Stack:** React.js · Node.js/Express.js · MySQL · REST API

---

## 📋 Features

- **10 Entity Management Pages:** Teams, Players, Matches, Seasons, Venues, Umpires, Sponsors, Awards, Innings, Owners
- **Dashboard** with live stats from MySQL (totals, recent matches, top teams)
- **Reports** with JOIN/GROUP BY aggregate queries
- **Full CRUD** on every entity with validation and referential integrity
- **Search & Filter** on all major pages
- **Many-to-Many** relationships (Player↔Match, Match↔Umpire, Team↔Sponsor, Player↔Award)
- **Parameterized SQL** queries to prevent SQL injection
- **Connection pooling** with mysql2
- **REST API** with proper HTTP status codes and JSON responses

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + React Router 6 |
| Backend | Node.js + Express.js |
| Database | MySQL 8.x |
| DB Driver | mysql2 (promise-based pool) |
| Styling | Vanilla CSS (dark cricket theme) |
| HTTP Client | Axios |
| Icons | lucide-react |
| Notifications | react-hot-toast |
| Security | helmet, CORS, parameterized queries |

---

## 📦 Prerequisites

Install these before starting:

1. **Node.js v18+** — [nodejs.org](https://nodejs.org)
2. **MySQL 8.x** — [mysql.com](https://dev.mysql.com/downloads/mysql/)
3. **MySQL Workbench** (optional, for visual DB management)
4. **Git** (optional)

Verify installations:
```powershell
node --version    # v18+
npm --version     # 9+
mysql --version   # 8.x
```

---

## 📁 Project Structure

```
ipl-management-system/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── layouts/           # Sidebar, Navbar, MainLayout
│   │   ├── pages/             # Dashboard, Teams, Players, etc.
│   │   ├── services/          # Axios API service (api.js)
│   │   └── index.css          # Global stylesheet
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                    # Express.js backend
│   ├── src/
│   │   ├── config/            # database.js (mysql2 pool)
│   │   ├── controllers/       # Route handlers per entity
│   │   ├── routes/            # Express routers
│   │   └── middleware/        # errorHandler, validate
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── database/
│   ├── schema.sql             # DDL — create all tables
│   └── seed.sql               # Sample data (10 teams, 50 players, 21 matches...)
├── docs/
│   ├── er-to-relational-mapping.md
│   └── api-documentation.md
└── README.md
```

---

## 🚀 Setup Instructions

### Step 1 — Set Up MySQL Database

Open **MySQL Workbench** or the MySQL CLI and run:

```sql
-- Option A: MySQL Workbench
-- File > Open SQL Script > select database/schema.sql > Execute (⚡)
-- File > Open SQL Script > select database/seed.sql > Execute (⚡)

-- Option B: MySQL CLI (run from project root)
```

```powershell
# In VS Code terminal (PowerShell), from the project root:
mysql -u root -p < database\schema.sql
mysql -u root -p < database\seed.sql
```

This creates the `ipl_management` database with all tables and sample data.

---

### Step 2 — Configure Backend Environment

```powershell
# Navigate to server folder
cd server

# Copy the example env file
copy .env.example .env
```

Open `server/.env` and update your MySQL password:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_ACTUAL_MYSQL_PASSWORD
DB_NAME=ipl_management
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

### Step 3 — Install Backend Dependencies

```powershell
# From the server/ directory
cd server
npm install
```

---

### Step 4 — Start the Backend Server

```powershell
# Development mode (auto-restart on file changes)
npm run dev

# OR production mode
npm start
```

You should see:
```
🏏 IPL Management System API
🚀 Server running on http://localhost:5000
📊 Environment: development
✅ MySQL connected: ipl_management
```

---

### Step 5 — Install Frontend Dependencies

Open a **new terminal tab/window**:

```powershell
# From the client/ directory
cd client
npm install
```

---

### Step 6 — Start the Frontend

```powershell
# From the client/ directory
npm run dev
```

Open your browser: **http://localhost:5173**

---

## 🌐 API Endpoints

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/stats` | Dashboard summary stats |
| GET/POST | `/teams` | List / Create teams |
| GET/PUT/DELETE | `/teams/:id` | Get / Update / Delete team |
| GET | `/teams/:id/players` | Players in a team |
| GET | `/teams/:id/matches` | Matches played by team |
| GET/POST | `/players` | List / Create players |
| GET/PUT/DELETE | `/players/:id` | Get / Update / Delete player |
| GET/POST | `/matches` | List / Create matches |
| GET/PUT/DELETE | `/matches/:id` | Get / Update / Delete match |
| GET | `/matches/:id/innings` | Innings for a match |
| GET | `/matches/:id/umpires` | Umpires for a match |
| GET/POST | `/seasons` | List / Create seasons |
| GET/PUT/DELETE | `/seasons/:id` | Get / Update / Delete season |
| GET | `/seasons/:id/matches` | Matches in a season |
| GET/POST | `/venues` | List / Create venues |
| GET/PUT/DELETE | `/venues/:id` | Get / Update / Delete venue |
| GET/POST | `/umpires` | List / Create umpires |
| GET/PUT/DELETE | `/umpires/:id` | Get / Update / Delete umpire |
| GET/POST | `/sponsors` | List / Create sponsors |
| GET/PUT/DELETE | `/sponsors/:id` | Get / Update / Delete sponsor |
| POST | `/sponsors/:id/teams` | Add team association |
| DELETE | `/sponsors/:id/teams/:teamId` | Remove team association |
| GET/POST | `/awards` | List / Create awards |
| GET/PUT/DELETE | `/awards/:id` | Get / Update / Delete award |
| POST | `/awards/:id/players` | Assign award to player |
| GET/POST | `/innings` | List / Create innings |
| GET/PUT/DELETE | `/innings/:id` | Get / Update / Delete innings |
| GET/POST | `/owners` | List / Create owners |
| GET/PUT/DELETE | `/owners/:id` | Get / Update / Delete owner |
| GET | `/reports/team-players` | Players per team |
| GET | `/reports/team-wins` | Wins per team |
| GET | `/reports/venue-matches` | Matches per venue |
| GET | `/reports/top-batsmen` | Top 10 batsmen |
| GET | `/reports/top-bowlers` | Top 10 bowlers |
| GET | `/reports/season-summary` | Season-wise summary |
| GET | `/reports/player-of-match` | PoM leaderboard |

---

## 🗄️ Database Schema Summary

```
venues ←── teams ──→ players ──→ player_match ──→ matches
                ↑                                    │
              owners                           match_umpires
                                                     │
sponsors ──→ team_sponsors                       umpires
                                                     │
awards ──→ player_awards                         innings
                                                     │
seasons ──────────────────────────────────────→ matches
```

**10 Tables:** venues, seasons, teams, players, matches, umpires, match_umpires, innings, player_match, sponsors, team_sponsors, awards, player_awards, owners

**3 Views:** v_match_details, v_player_details, v_team_win_counts

---

## 🔧 Common Errors & Troubleshooting

### ❌ `ER_ACCESS_DENIED_ERROR`
→ Wrong MySQL username or password in `server/.env`

### ❌ `ECONNREFUSED` (port 3306)
→ MySQL service is not running.
```powershell
# Windows — Start MySQL service
net start MySQL80
```

### ❌ `Table doesn't exist`
→ You haven't run `schema.sql` yet. Run it in MySQL Workbench.

### ❌ `Foreign key constraint fails` on seed
→ Run `schema.sql` first, then `seed.sql` in the correct order.

### ❌ Frontend shows 'Network Error'
→ Check the backend is running on port 5000. Check CORS settings.

### ❌ `Cannot GET /api/...`
→ Backend server is not running. Run `npm run dev` in `server/`.

### ❌ `Cannot find module`
→ Run `npm install` in both `server/` and `client/` directories.

---

## 📊 Sample Data Included

| Entity | Count |
|---|---|
| Teams | 10 (all IPL 2024 teams) |
| Players | 50 (5 per team) |
| Venues | 10 |
| Seasons | 6 (2019–2024) |
| Matches | 21 |
| Umpires | 10 |
| Sponsors | 10 |
| Awards | 10 |
| Innings | 12 |
| Owners | 10 |

---

## 📝 Academic Notes

This project demonstrates:
- **ER → Relational Mapping** (see `docs/er-to-relational-mapping.md`)
- **1:1 relationship** — Owner owns exactly one Team
- **1:M relationships** — Team has many Players; Season has many Matches
- **M:N relationships** — Player↔Match (with stats), Match↔Umpire, Team↔Sponsor, Player↔Award
- **Referential Integrity** — ON DELETE CASCADE/RESTRICT/SET NULL as appropriate
- **SQL Injection Prevention** — All queries use `?` placeholders
- **Normalization** — Schema is in 3NF
- **SQL Features Used** — INSERT, SELECT, UPDATE, DELETE, INNER JOIN, LEFT JOIN, GROUP BY, COUNT, SUM, WHERE, HAVING, Views, Transactions

---

*Built for DBMS College Assignment — IPL Management System*
