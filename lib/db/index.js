// @ts-check
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'quiz.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/** @type {import('better-sqlite3').Database} */
let db;

function getDb() {
  if (db) return db;

  if (process.env.NODE_ENV !== 'production') {
    if (!global.__db) {
      global.__db = new Database(DB_PATH);
      initializeSchema(global.__db);
    }
    db = global.__db;
  } else {
    db = new Database(DB_PATH);
    initializeSchema(db);
  }

  return db;
}

/**
 * @param {import('better-sqlite3').Database} database
 */
function initializeSchema(database) {
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');

  database.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      description TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id     INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      text        TEXT    NOT NULL,
      time_limit  INTEGER NOT NULL DEFAULT 30,
      points      INTEGER NOT NULL DEFAULT 100,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS answers (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      text        TEXT    NOT NULL,
      is_correct  INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id                 INTEGER NOT NULL REFERENCES quizzes(id),
      join_code               TEXT    NOT NULL UNIQUE,
      status                  TEXT    NOT NULL DEFAULT 'waiting',
      current_question_index  INTEGER DEFAULT 0,
      question_started_at     DATETIME,
      created_at              DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS players (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      nickname    TEXT    NOT NULL,
      score       INTEGER NOT NULL DEFAULT 0,
      joined_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS player_answers (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id     INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      session_id    INTEGER NOT NULL,
      question_id   INTEGER NOT NULL REFERENCES questions(id),
      answer_id     INTEGER REFERENCES answers(id),
      is_correct    INTEGER NOT NULL DEFAULT 0,
      points_earned INTEGER NOT NULL DEFAULT 0,
      answered_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = { getDb };
