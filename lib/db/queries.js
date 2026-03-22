// @ts-check
const { getDb } = require('./index');

// ─── Quizzes ────────────────────────────────────────────────────────────────

function getAllQuizzes() {
  const db = getDb();
  return db.prepare(`
    SELECT q.*, COUNT(qs.id) as question_count
    FROM quizzes q
    LEFT JOIN questions qs ON qs.quiz_id = q.id
    GROUP BY q.id
    ORDER BY q.created_at DESC
  `).all();
}

function getQuizById(id) {
  const db = getDb();
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id);
  if (!quiz) return null;
  const questions = db.prepare(`
    SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index ASC, id ASC
  `).all(id);
  for (const q of questions) {
    q.answers = db.prepare('SELECT * FROM answers WHERE question_id = ? ORDER BY id ASC').all(q.id);
  }
  quiz.questions = questions;
  return quiz;
}

function createQuiz({ title, description }) {
  const db = getDb();
  const result = db.prepare('INSERT INTO quizzes (title, description) VALUES (?, ?)').run(title, description || null);
  return result.lastInsertRowid;
}

function updateQuiz(id, { title, description }) {
  const db = getDb();
  db.prepare('UPDATE quizzes SET title = ?, description = ? WHERE id = ?').run(title, description || null, id);
}

function deleteQuiz(id) {
  const db = getDb();
  db.prepare('DELETE FROM quizzes WHERE id = ?').run(id);
}

// ─── Questions ──────────────────────────────────────────────────────────────

function addQuestion(quizId, { text, time_limit = 30, points = 100, order_index = 0, answers = [] }) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO questions (quiz_id, text, time_limit, points, order_index)
    VALUES (?, ?, ?, ?, ?)
  `).run(quizId, text, time_limit, points, order_index);
  const questionId = result.lastInsertRowid;

  for (const answer of answers) {
    db.prepare('INSERT INTO answers (question_id, text, is_correct) VALUES (?, ?, ?)').run(
      questionId, answer.text, answer.is_correct ? 1 : 0
    );
  }
  return questionId;
}

function updateQuestion(id, { text, time_limit, points, order_index }) {
  const db = getDb();
  db.prepare(`
    UPDATE questions SET text = ?, time_limit = ?, points = ?, order_index = ? WHERE id = ?
  `).run(text, time_limit, points, order_index, id);
}

function deleteQuestion(id) {
  const db = getDb();
  db.prepare('DELETE FROM questions WHERE id = ?').run(id);
}

function replaceAnswers(questionId, answers) {
  const db = getDb();
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM answers WHERE question_id = ?').run(questionId);
    for (const answer of answers) {
      db.prepare('INSERT INTO answers (question_id, text, is_correct) VALUES (?, ?, ?)').run(
        questionId, answer.text, answer.is_correct ? 1 : 0
      );
    }
  });
  transaction();
}

// ─── Sessions ────────────────────────────────────────────────────────────────

function createSession(quizId, joinCode) {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO sessions (quiz_id, join_code) VALUES (?, ?)'
  ).run(quizId, joinCode);
  return result.lastInsertRowid;
}

function getSessionById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
}

function getSessionByCode(code) {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE join_code = ?').get(code.toUpperCase());
}

function updateSessionStatus(id, status) {
  const db = getDb();
  db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run(status, id);
}

function updateSessionQuestion(id, questionIndex) {
  const db = getDb();
  db.prepare(`
    UPDATE sessions SET current_question_index = ?, question_started_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(questionIndex, id);
}

// ─── Players ─────────────────────────────────────────────────────────────────

function addPlayer(sessionId, nickname) {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO players (session_id, nickname) VALUES (?, ?)'
  ).run(sessionId, nickname);
  return result.lastInsertRowid;
}

function getPlayerById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM players WHERE id = ?').get(id);
}

function getPlayersBySession(sessionId) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM players WHERE session_id = ? ORDER BY score DESC'
  ).all(sessionId);
}

function getLeaderboard(sessionId) {
  const db = getDb();
  return db.prepare(`
    SELECT id, nickname, score,
           ROW_NUMBER() OVER (ORDER BY score DESC) as rank
    FROM players
    WHERE session_id = ?
    ORDER BY score DESC
  `).all(sessionId);
}

// ─── Player Answers ───────────────────────────────────────────────────────────

function hasPlayerAnswered(playerId, questionId) {
  const db = getDb();
  const row = db.prepare(
    'SELECT id FROM player_answers WHERE player_id = ? AND question_id = ?'
  ).get(playerId, questionId);
  return !!row;
}

function savePlayerAnswer(playerId, sessionId, questionId, answerId, isCorrect, pointsEarned) {
  const db = getDb();
  db.prepare(`
    INSERT INTO player_answers (player_id, session_id, question_id, answer_id, is_correct, points_earned)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(playerId, sessionId, questionId, answerId, isCorrect ? 1 : 0, pointsEarned);

  if (isCorrect) {
    db.prepare('UPDATE players SET score = score + ? WHERE id = ?').run(pointsEarned, playerId);
  }
}

function getAnswerCountForQuestion(sessionId, questionId) {
  const db = getDb();
  const row = db.prepare(
    'SELECT COUNT(*) as count FROM player_answers WHERE session_id = ? AND question_id = ?'
  ).get(sessionId, questionId);
  return row.count;
}

function getResultsForQuestion(sessionId, questionId) {
  const db = getDb();
  return db.prepare(`
    SELECT pa.player_id, pa.answer_id, pa.is_correct, pa.points_earned, p.nickname
    FROM player_answers pa
    JOIN players p ON p.id = pa.player_id
    WHERE pa.session_id = ? AND pa.question_id = ?
  `).all(sessionId, questionId);
}

module.exports = {
  getAllQuizzes, getQuizById, createQuiz, updateQuiz, deleteQuiz,
  addQuestion, updateQuestion, deleteQuestion, replaceAnswers,
  createSession, getSessionById, getSessionByCode, updateSessionStatus, updateSessionQuestion,
  addPlayer, getPlayerById, getPlayersBySession, getLeaderboard,
  hasPlayerAnswered, savePlayerAnswer, getAnswerCountForQuestion, getResultsForQuestion,
};
