'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { BookOpen, Trophy, Clock } from 'lucide-react';
import Link from 'next/link';

interface Answer { id: number; text: string; }
interface Question { id: number; text: string; timeLimit: number; points: number; answers: Answer[]; }
interface LeaderboardEntry { rank: number; id: number; nickname: string; score: number; }

type Phase = 'loading' | 'waiting' | 'question' | 'answered' | 'reviewing' | 'finished';

const ANSWER_COLORS = [
  'bg-teal-500 hover:bg-teal-600 active:bg-teal-700',
  'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
  'bg-amber-500 hover:bg-amber-600 active:bg-amber-700',
  'bg-rose-500 hover:bg-rose-600 active:bg-rose-700',
];
const ANSWER_LABELS = ['A', 'B', 'C', 'D'];
const MEDAL_ICONS = ['🥇', '🥈', '🥉'];

export default function PlayerGamePage({ params }: { params: { sessionId: string } }) {
  const sessionId = Number(params.sessionId);
  const socketRef = useRef<Socket | null>(null);

  const [phase, setPhase] = useState<Phase>('loading');
  const [playerCount, setPlayerCount] = useState(0);
  const [nickname, setNickname] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  const [correctAnswerId, setCorrectAnswerId] = useState<number | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playerId = useRef<number | null>(null);

  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem('playerId');
    // storedNickname not needed: nickname comes from session data
    if (storedPlayerId) playerId.current = Number(storedPlayerId);

    fetch(`/api/sessions/${sessionId}`)
      .then(r => r.json())
      .then(data => {
        setQuizTitle(data.quiz?.title || '');
        setJoinCode(data.session.join_code);
        setPlayerCount(data.players.length);
        setTotalQuestions(data.questions.length);

        const myPlayer = data.players.find((p: { id: number; nickname: string }) =>
          p.id === Number(storedPlayerId)
        );
        if (myPlayer) setNickname(myPlayer.nickname);

        if (data.session.status === 'waiting') setPhase('waiting');
        else if (data.session.status === 'finished') setPhase('finished');
      });

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', { path: '/socket.io' });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (playerId.current) {
        socket.emit('player:join', { sessionId, playerId: playerId.current });
      }
    });

    socket.on('session:player_joined', ({ playerCount }: { playerCount: number }) => {
      setPlayerCount(playerCount);
    });

    socket.on('session:question_start', ({ question, questionIndex, totalQuestions, serverTimestamp }: {
      question: Question; questionIndex: number; totalQuestions: number; serverTimestamp: number;
    }) => {
      setCurrentQuestion(question);
      setQuestionIndex(questionIndex);
      setTotalQuestions(totalQuestions);
      setSelectedAnswerId(null);
      setCorrectAnswerId(null);
      setIsCorrect(null);
      setPointsEarned(0);
      setPhase('question');
      startTimer(question.timeLimit, serverTimestamp);
    });

    socket.on('player:answer_accepted', ({ isCorrect: correct, pointsEarned: pts }: {
      questionId: number; isCorrect: boolean; pointsEarned: number;
    }) => {
      setIsCorrect(correct);
      setPointsEarned(pts);
      setPhase('answered');
    });

    socket.on('session:answer_revealed', ({ correctAnswerId }: { correctAnswerId: number }) => {
      setCorrectAnswerId(correctAnswerId);
      setPhase('reviewing');
      stopTimer();
    });

    socket.on('session:score_update', ({ leaderboard }: { leaderboard: LeaderboardEntry[] }) => {
      const myEntry = leaderboard.find(e => e.id === playerId.current);
      if (myEntry) setTotalScore(myEntry.score);
    });

    socket.on('session:quiz_finished', ({ finalLeaderboard }: { finalLeaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(finalLeaderboard);
      const myEntry = finalLeaderboard.find(e => e.id === playerId.current);
      if (myEntry) setTotalScore(myEntry.score);
      setPhase('finished');
      stopTimer();
    });

    return () => { socket.disconnect(); stopTimer(); };
  }, [sessionId]);

  function startTimer(seconds: number, serverTimestamp: number) {
    stopTimer();
    const elapsed = Math.floor((Date.now() - serverTimestamp) / 1000);
    let remaining = Math.max(0, seconds - elapsed);
    setTimer(remaining);
    timerRef.current = setInterval(() => {
      remaining--;
      setTimer(Math.max(0, remaining));
      if (remaining <= 0) stopTimer();
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function submitAnswer(answerId: number) {
    if (phase !== 'question' || !currentQuestion || !playerId.current) return;
    setSelectedAnswerId(answerId);
    socketRef.current?.emit('player:submit_answer', {
      sessionId,
      playerId: playerId.current,
      questionId: currentQuestion.id,
      answerId,
    });
  }

  const timerPercent = currentQuestion ? (timer / currentQuestion.timeLimit) * 100 : 0;

  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      {/* Header */}
      <header className="bg-green-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          <span className="font-bold text-sm">{quizTitle || 'QuisGame'}</span>
        </div>
        {nickname && <span className="text-green-200 text-sm">{nickname} · {totalScore} pts</span>}
      </header>

      <main className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">

        {/* Loading */}
        {phase === 'loading' && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Carregando...</p>
          </div>
        )}

        {/* Waiting Lobby */}
        {phase === 'waiting' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-green-700 text-white text-2xl font-bold flex items-center justify-center">
              {nickname ? nickname[0].toUpperCase() : '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{nickname || 'Jogador'}</h2>
              <p className="text-gray-500 text-sm mt-1">Código: <strong>{joinCode}</strong></p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{playerCount}</p>
              <p className="text-gray-500 text-sm">jogadores na sala</p>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm">Aguardando o professor iniciar...</p>
            </div>
          </div>
        )}

        {/* Question */}
        {(phase === 'question' || phase === 'answered') && currentQuestion && (
          <div className="flex flex-col gap-4">
            {/* Progress & Timer */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{questionIndex + 1}/{totalQuestions}</span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className={`font-bold tabular-nums ${timer <= 5 ? 'text-red-500' : ''}`}>{timer}s</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${timerPercent > 50 ? 'bg-green-500' : timerPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${timerPercent}%` }}
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-lg font-bold text-gray-900 text-center">{currentQuestion.text}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.answers.map((answer, i) => {
                const isSelected = selectedAnswerId === answer.id;
                const disabled = phase === 'answered';
                return (
                  <button
                    key={answer.id}
                    onClick={() => submitAnswer(answer.id)}
                    disabled={disabled}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-white font-semibold transition-all min-h-[90px] text-sm
                      ${ANSWER_COLORS[i]}
                      ${isSelected ? 'ring-4 ring-white ring-offset-2 scale-95' : ''}
                      ${disabled && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                      {ANSWER_LABELS[i]}
                    </span>
                    <span className="text-center leading-tight">{answer.text}</span>
                  </button>
                );
              })}
            </div>

            {phase === 'answered' && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-gray-500 text-sm animate-pulse">Aguardando o professor revelar a resposta...</p>
              </div>
            )}
          </div>
        )}

        {/* Reviewing (answer revealed) */}
        {phase === 'reviewing' && currentQuestion && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.answers.map((answer, i) => {
                const isCorrect = answer.id === correctAnswerId;
                return (
                  <div
                    key={answer.id}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl font-semibold min-h-[90px] text-sm transition-opacity
                      ${isCorrect ? 'bg-green-500 text-white ring-4 ring-green-300' : 'bg-gray-200 text-gray-500 opacity-50'}
                    `}
                  >
                    <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                      {isCorrect ? '✓' : ANSWER_LABELS[i]}
                    </span>
                    <span className="text-center leading-tight">{answer.text}</span>
                  </div>
                );
              })}
            </div>

            <div className={`rounded-xl p-6 text-center ${isCorrect ? 'bg-green-100 border border-green-300' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-4xl mb-2`}>{isCorrect ? '✅' : '❌'}</p>
              <p className={`text-xl font-bold ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                {isCorrect ? 'Correto!' : 'Errado!'}
              </p>
              {isCorrect && pointsEarned > 0 && (
                <p className="text-green-600 font-semibold mt-1">+{pointsEarned} pontos</p>
              )}
              <p className="text-gray-500 text-sm mt-2">Total: {totalScore} pts</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-gray-500 text-sm animate-pulse">Aguardando a próxima pergunta...</p>
            </div>
          </div>
        )}

        {/* Finished - Final Scoreboard */}
        {phase === 'finished' && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-gray-900">Fim do Quiz!</h2>
              {nickname && <p className="text-gray-600 mt-1">Sua pontuação: <strong className="text-green-700">{totalScore} pts</strong></p>}
            </div>

            {leaderboard.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-3">Placar Final</h3>
                <div className="space-y-2">
                  {leaderboard.map((entry) => {
                    const isMe = entry.id === playerId.current;
                    return (
                      <div key={entry.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isMe ? 'bg-green-100 border border-green-300' : entry.rank <= 3 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                        <span className="text-lg w-7 text-center">
                          {entry.rank <= 3 ? MEDAL_ICONS[entry.rank - 1] : `#${entry.rank}`}
                        </span>
                        <span className={`flex-1 font-medium text-sm ${isMe ? 'text-green-700 font-bold' : 'text-gray-700'}`}>
                          {entry.nickname} {isMe && '(você)'}
                        </span>
                        <span className="font-bold text-gray-900">{entry.score} pts</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Link href="/play" className="w-full">
              <button className="w-full bg-green-700 text-white font-semibold py-3 rounded-xl hover:bg-green-800 transition-colors">
                Jogar Novamente
              </button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
