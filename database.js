// ============================================================
//  database.js  — SQLite via sql.js (pure JavaScript)
//  No C++ compiler needed — works on any Windows/Mac/Linux
// ============================================================

const path  = require('path');
const fs    = require('fs');

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH  = path.join(DATA_DIR, 'portfolio.db');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Load sql.js ──
const initSqlJs = require('sql.js');
let db;

// Save DB to disk after every write
function saveToDisk() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ── All SQL tables ──
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS certifications (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    issuer    TEXT    DEFAULT '',
    date      TEXT    DEFAULT '',
    url       TEXT    DEFAULT '',
    emoji     TEXT    DEFAULT '🏅',
    file_data TEXT,
    file_type TEXT,
    file_name TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT   DEFAULT (datetime('now')),
    updated_at TEXT   DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS experience (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    role        TEXT NOT NULL,
    company     TEXT DEFAULT '',
    period      TEXT DEFAULT '',
    description TEXT DEFAULT '',
    tags        TEXT DEFAULT '',
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    github_url  TEXT DEFAULT '',
    stack       TEXT DEFAULT '',
    emoji       TEXT DEFAULT '🚀',
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS skill_groups (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS skill_tags (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id   INTEGER NOT NULL,
    tag        TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS roadmap_progress (
    day        INTEGER PRIMARY KEY,
    status     TEXT DEFAULT 'pending',
    updated_at TEXT DEFAULT (datetime('now'))
  );
`;

// ── Helper: run query + return rows as array of objects ──
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveToDisk();
  return db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0];
}

// ── Seed default data ──
function seedIfEmpty() {
  const certCount = query('SELECT COUNT(*) as c FROM certifications')[0].c;
  if (certCount === 0) {
    run(`INSERT INTO certifications (name,issuer,date,url,emoji,sort_order) VALUES (?,?,?,?,?,?)`,
      ['Crash Course on Python','Google / Coursera','2024','https://coursera.org','🐍',1]);
    run(`INSERT INTO certifications (name,issuer,date,url,emoji,sort_order) VALUES (?,?,?,?,?,?)`,
      ['SQL and Relational Databases 101','IBM / Cognitiveclass.ai','2024','https://cognitiveclass.ai','🗄️',2]);
  }

  const expCount = query('SELECT COUNT(*) as c FROM experience')[0].c;
  if (expCount === 0) {
    run(`INSERT INTO experience (role,company,period,description,tags,sort_order) VALUES (?,?,?,?,?,?)`, [
      'Graphic Designer',
      'Star Prints, Karur — Offset Printing',
      'June 2016 — December 2025',
      'Worked for 9 years 7 months in designing print media, managing layout workflows, and delivering high-quality offset print materials for clients across industries. Built strong attention to detail and deadline discipline — skills that transfer directly into data engineering work.',
      'Print Design,Adobe Suite,Layout,Client Delivery',
      1
    ]);
  }

  const projCount = query('SELECT COUNT(*) as c FROM projects')[0].c;
  if (projCount === 0) {
    run(`INSERT INTO projects (name,description,github_url,stack,emoji,sort_order) VALUES (?,?,?,?,?,?)`,
      ['Student Database Management','A Java-based application using JDBC to manage student records with MySQL — featuring CRUD operations, data validation, and query optimization.','https://github.com/helptamilselvam/Myprofile','Java,JDBC,MySQL','🗄️',1]);
    run(`INSERT INTO projects (name,description,github_url,stack,emoji,sort_order) VALUES (?,?,?,?,?,?)`,
      ['Python Data Automation Script','Automated data extraction and transformation pipeline using Python. Processes raw CSV datasets, cleans data, and generates structured reports with summary statistics.','https://github.com/helptamilselvam/Myprofile','Python,Pandas,CSV','🐍',2]);
    run(`INSERT INTO projects (name,description,github_url,stack,emoji,sort_order) VALUES (?,?,?,?,?,?)`,
      ['SQL Analytics Dashboard','Relational database design and complex SQL queries for business analytics — includes joins, aggregations, window functions, and stored procedures.','https://github.com/helptamilselvam/Myprofile','MySQL,SQL,Analytics','📊',3]);
  }

  const skillCount = query('SELECT COUNT(*) as c FROM skill_groups')[0].c;
  if (skillCount === 0) {
    const groups = [
      { title: 'Languages',        tags: ['Python','SQL','Java','C++'] },
      { title: 'Databases',        tags: ['MySQL','PostgreSQL','MS SQL','JDBC'] },
      { title: 'Data Engineering', tags: ['ETL Pipelines','Data Modeling','Airflow','Kafka','Snowflake'] },
      { title: 'Cloud & Tools',    tags: ['AWS','Azure','Hadoop','Git & GitHub'] },
    ];
    groups.forEach((g, gi) => {
      const gid = run('INSERT INTO skill_groups (title,sort_order) VALUES (?,?)', [g.title, gi+1]);
      g.tags.forEach((tag, ti) => run('INSERT INTO skill_tags (group_id,tag,sort_order) VALUES (?,?,?)', [gid, tag, ti+1]));
    });
  }
}

// ── Init DB (async because sql.js uses WASM) ──
async function initDB() {
  const SQL = await initSqlJs();
  // Load existing DB file if it exists, otherwise create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON;');
  db.run(SCHEMA);
  seedIfEmpty();
  saveToDisk();
  console.log('✅  Database ready →', DB_PATH);
  return db;
}

// ── Helpers exported to server.js ──
const helpers = {
  // CERTIFICATIONS
  getCerts:   () => query('SELECT * FROM certifications ORDER BY sort_order, id'),
  getCert:    (id) => query('SELECT * FROM certifications WHERE id = ?', [id])[0],
  addCert:    (d) => {
    const id = run(
      `INSERT INTO certifications (name,issuer,date,url,emoji,file_data,file_type,file_name) VALUES (?,?,?,?,?,?,?,?)`,
      [d.name, d.issuer||'', d.date||'', d.url||'', d.emoji||'🏅', d.file_data||null, d.file_type||null, d.file_name||null]
    );
    return helpers.getCert(id);
  },
  updateCert: (id, d) => {
    run(`UPDATE certifications SET name=?,issuer=?,date=?,url=?,emoji=?,
         file_data=COALESCE(?,file_data), file_type=COALESCE(?,file_type),
         file_name=COALESCE(?,file_name), updated_at=datetime('now') WHERE id=?`,
      [d.name, d.issuer||'', d.date||'', d.url||'', d.emoji||'🏅', d.file_data||null, d.file_type||null, d.file_name||null, id]);
    return helpers.getCert(id);
  },
  deleteCert: (id) => run('DELETE FROM certifications WHERE id=?', [id]),

  // EXPERIENCE
  getExp:    () => query('SELECT * FROM experience ORDER BY sort_order, id'),
  getExpOne: (id) => query('SELECT * FROM experience WHERE id=?', [id])[0],
  addExp:    (d) => {
    const id = run(
      `INSERT INTO experience (role,company,period,description,tags) VALUES (?,?,?,?,?)`,
      [d.role, d.company||'', d.period||'', d.description||'', d.tags||'']
    );
    return helpers.getExpOne(id);
  },
  updateExp: (id, d) => {
    run(`UPDATE experience SET role=?,company=?,period=?,description=?,tags=?,updated_at=datetime('now') WHERE id=?`,
      [d.role, d.company||'', d.period||'', d.description||'', d.tags||'', id]);
    return helpers.getExpOne(id);
  },
  deleteExp: (id) => run('DELETE FROM experience WHERE id=?', [id]),

  // PROJECTS
  getProjects:   () => query('SELECT * FROM projects ORDER BY sort_order, id'),
  getProject:    (id) => query('SELECT * FROM projects WHERE id=?', [id])[0],
  addProject:    (d) => {
    const id = run(
      `INSERT INTO projects (name,description,github_url,stack,emoji) VALUES (?,?,?,?,?)`,
      [d.name, d.description||'', d.github_url||'', d.stack||'', d.emoji||'🚀']
    );
    return helpers.getProject(id);
  },
  updateProject: (id, d) => {
    run(`UPDATE projects SET name=?,description=?,github_url=?,stack=?,emoji=?,updated_at=datetime('now') WHERE id=?`,
      [d.name, d.description||'', d.github_url||'', d.stack||'', d.emoji||'🚀', id]);
    return helpers.getProject(id);
  },
  deleteProject: (id) => run('DELETE FROM projects WHERE id=?', [id]),

  // SKILLS
  getSkillGroups: () => {
    const groups = query('SELECT * FROM skill_groups ORDER BY sort_order, id');
    return groups.map(g => ({
      ...g,
      tags: query('SELECT * FROM skill_tags WHERE group_id=? ORDER BY sort_order, id', [g.id])
    }));
  },
  addSkillGroup:    (title) => {
    const id = run('INSERT INTO skill_groups (title) VALUES (?)', [title]);
    return { id, title, tags: [] };
  },
  updateSkillGroup: (id, title) => run(`UPDATE skill_groups SET title=?,updated_at=datetime('now') WHERE id=?`, [title, id]),
  deleteSkillGroup: (id) => { run('DELETE FROM skill_tags WHERE group_id=?', [id]); run('DELETE FROM skill_groups WHERE id=?', [id]); },
  addSkillTag:      (groupId, tag) => {
    const id = run('INSERT INTO skill_tags (group_id,tag) VALUES (?,?)', [groupId, tag]);
    return { id, group_id: groupId, tag };
  },
  deleteSkillTag:   (id) => run('DELETE FROM skill_tags WHERE id=?', [id]),

  // ROADMAP
  getRoadmapProgress: () => query('SELECT * FROM roadmap_progress ORDER BY day'),
  setDayStatus: (day, status) => {
    const exists = query('SELECT 1 FROM roadmap_progress WHERE day=?', [day]).length > 0;
    if (exists) run(`UPDATE roadmap_progress SET status=?,updated_at=datetime('now') WHERE day=?`, [status, day]);
    else run('INSERT INTO roadmap_progress (day,status) VALUES (?,?)', [day, status]);
  },
  resetRoadmap: () => run('DELETE FROM roadmap_progress'),
};

module.exports = { initDB, helpers };
