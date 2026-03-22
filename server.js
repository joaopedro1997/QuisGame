// @ts-check
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const {
  getSessionById,
  updateSessionStatus,
  updateSessionQuestion,
  getQuizById,
  getPlayersBySession,
  getLeaderboard,
  hasPlayerAnswered,
  savePlayerAnswer,
  getAnswerCountForQuestion,
  getResultsForQuestion,
  getPlayerById,
} = require('./lib/db/queries');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Map to track active question state per session
/** @type {Map<number, { questionId: number, timeoutId: NodeJS.Timeout | null }>} */
const activeQuestions = new Map();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url || '/', true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  // Make io accessible from API routes
  global.io = io;

  io.on('connection', (socket) => {
    // ─── Admin events ──────────────────────────────────────────────────────

    socket.on('admin:join_session', ({ sessionId }) => {
      socket.join(`session:${sessionId}`);
      socket.join(`admin:${sessionId}`);
    });

    socket.on('admin:start_quiz', async ({ sessionId }) => {
      const session = getSessionById(sessionId);
      if (!session || session.status !== 'waiting') return;

      const quiz = getQuizById(session.quiz_id);
      if (!quiz || quiz.questions.length === 0) {
        socket.emit('error', { message: 'Quiz sem perguntas.' });
        return;
      }

      updateSessionStatus(sessionId, 'question');
      updateSessionQuestion(sessionId, 0);

      const question = quiz.questions[0];
      const questionPayload = buildQuestionPayload(question);

      activeQuestions.set(sessionId, { questionId: question.id, timeoutId: null });

      io.to(`session:${sessionId}`).emit('session:question_start', {
        question: questionPayload,
        questionIndex: 0,
        totalQuestions: quiz.questions.length,
        serverTimestamp: Date.now(),
      });
    });

    socket.on('admin:reveal_answer', async ({ sessionId }) => {
      const session = getSessionById(sessionId);
      if (!session || session.status !== 'question') return;

      const active = activeQuestions.get(sessionId);
      if (!active) return;

      if (active.timeoutId) {
        clearTimeout(active.timeoutId);
        active.timeoutId = null;
      }

      updateSessionStatus(sessionId, 'reviewing');

      const quiz = getQuizById(session.quiz_id);
      const question = quiz.questions[session.current_question_index];
      const correctAnswer = question.answers.find((a) => a.is_correct === 1);
      const results = getResultsForQuestion(sessionId, question.id);
      const leaderboard = getLeaderboard(sessionId);

      io.to(`session:${sessionId}`).emit('session:answer_revealed', {
        correctAnswerId: correctAnswer ? correctAnswer.id : null,
        playerResults: results,
      });

      io.to(`session:${sessionId}`).emit('session:score_update', { leaderboard });
    });

    socket.on('admin:next_question', async ({ sessionId }) => {
      const session = getSessionById(sessionId);
      if (!session || session.status !== 'reviewing') return;

      const quiz = getQuizById(session.quiz_id);
      const nextIndex = session.current_question_index + 1;

      if (nextIndex >= quiz.questions.length) {
        // Quiz finished
        updateSessionStatus(sessionId, 'finished');
        const leaderboard = getLeaderboard(sessionId);
        io.to(`session:${sessionId}`).emit('session:quiz_finished', { finalLeaderboard: leaderboard });
        activeQuestions.delete(sessionId);
        return;
      }

      updateSessionStatus(sessionId, 'question');
      updateSessionQuestion(sessionId, nextIndex);

      const question = quiz.questions[nextIndex];
      const questionPayload = buildQuestionPayload(question);

      activeQuestions.set(sessionId, { questionId: question.id, timeoutId: null });

      io.to(`session:${sessionId}`).emit('session:question_start', {
        question: questionPayload,
        questionIndex: nextIndex,
        totalQuestions: quiz.questions.length,
        serverTimestamp: Date.now(),
      });
    });

    // ─── Player events ─────────────────────────────────────────────────────

    socket.on('player:join', ({ sessionId, playerId }) => {
      socket.join(`session:${sessionId}`);
      socket.data.playerId = playerId;
      socket.data.sessionId = sessionId;

      const player = getPlayerById(playerId);
      const players = getPlayersBySession(sessionId);

      io.to(`session:${sessionId}`).emit('session:player_joined', {
        player: { id: player.id, nickname: player.nickname },
        playerCount: players.length,
      });
    });

    socket.on('player:submit_answer', ({ sessionId, playerId, questionId, answerId }) => {
      const session = getSessionById(sessionId);
      if (!session || session.status !== 'question') return;

      const active = activeQuestions.get(sessionId);
      if (!active || active.questionId !== questionId) return;

      if (hasPlayerAnswered(playerId, questionId)) return;

      // Find correct answer
      const quiz = getQuizById(session.quiz_id);
      const question = quiz.questions.find((q) => q.id === questionId);
      if (!question) return;

      const correctAnswer = question.answers.find((a) => a.is_correct === 1);
      const isCorrect = correctAnswer ? correctAnswer.id === answerId : false;
      const pointsEarned = isCorrect ? question.points : 0;

      savePlayerAnswer(playerId, sessionId, questionId, answerId, isCorrect, pointsEarned);

      socket.emit('player:answer_accepted', { questionId, isCorrect, pointsEarned });

      // Send answer count to admin
      const answered = getAnswerCountForQuestion(sessionId, questionId);
      const totalPlayers = getPlayersBySession(sessionId).length;
      io.to(`admin:${sessionId}`).emit('session:answer_count', { answered, total: totalPlayers });
    });
  });

  httpServer.listen(3000, () => {
    console.log('> Pronto em http://localhost:3000');
  });
});

/**
 * Builds a question payload safe to send to players (no is_correct).
 */
function buildQuestionPayload(question) {
  return {
    id: question.id,
    text: question.text,
    timeLimit: question.time_limit,
    points: question.points,
    orderIndex: question.order_index,
    answers: question.answers.map((a) => ({ id: a.id, text: a.text })),
  };
}
