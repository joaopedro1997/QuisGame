'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { BookOpen, Users, ChevronRight, Eye, Trophy } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface Player { id: number; nickname: string; score: number; }
interface Answer { id: number; text: string; }
interface Question { id: number; text: string; timeLimit: number; points: number; answers: Answer[]; }
interface LeaderboardEntry { rank: number; id: number; nickname: string; score: number; }

type SessionStatus = 'waiting' | 'question' | 'reviewing' | 'finished';

const ANSWER_COLORS = ['bg-teal-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500'];
const ANSWER_LABELS = ['A', 'B', 'C', 'D'];
const MEDAL_COLORS = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
const MEDAL_ICONS = ['🥇', '🥈', '🥉'];

export default function SessionControlPage({ params }: { params: { sessionId: string } }) {
  const sessionId = Number(params.sessionId);
  const socketRef = useRef<Socket | null>(null);

  const [status, setStatus] = useState<SessionStatus>('waiting');
  const [joinCode, setJoinCode] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctAnswerId, setCorrectAnswerId] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then(r => r.json())
      .then(data => {
        setJoinCode(data.session.join_code);
        setQuizTitle(data.quiz?.title || '');
        setPlayers(data.players || []);
        setStatus(data.session.status);
        setTotalQuestions(data.questions.length);
      });

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', { path: '/socket.io' });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('admin:join_session', { sessionId });
    });

    socket.on('session:player_joined', ({ player, playerCount: _playerCount }: { player: Player; playerCount: number }) => {
      setPlayers(prev => {
        if (prev.find(p => p.id === player.id)) return prev;
        return [...prev, { ...player, score: 0 }];
      });
    });

    socket.on('session:question_start', ({ question, questionIndex, totalQuestions, serverTimestamp }: {
      question: Question; questionIndex: number; totalQuestions: number; serverTimestamp: number;
    }) => {
      setCurrentQuestion(question);
      setQuestionIndex(questionIndex);
      setTotalQuestions(totalQuestions);
      setAnsweredCount(0);
      setCorrectAnswerId(null);
      setStatus('question');
      startTimer(question.timeLimit, serverTimestamp);
    });

    socket.on('session:answer_count', ({ answered, total: _total }: { answered: number; total: number }) => {
      setAnsweredCount(answered);
    });

    socket.on('session:answer_revealed', ({ correctAnswerId }: { correctAnswerId: number }) => {
      setCorrectAnswerId(correctAnswerId);
      setStatus('reviewing');
      stopTimer();
    });

    socket.on('session:score_update', ({ leaderboard }: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(leaderboard);
    });

    socket.on('session:quiz_finished', ({ finalLeaderboard }: { finalLeaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(finalLeaderboard);
      setStatus('finished');
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
      setTimer(remaining);
      if (remaining <= 0) stopTimer();
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function emitStart() {
    socketRef.current?.emit('admin:start_quiz', { sessionId });
    setStatus('question');
  }

  function emitReveal() {
    socketRef.current?.emit('admin:reveal_answer', { sessionId });
  }

  function emitNext() {
    socketRef.current?.emit('admin:next_question', { sessionId });
  }

  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-green-700 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold">QuizGame — Painel do Host</h1>
            <p className="text-green-200 text-sm">{quizTitle}</p>
          </div>
        </div>
        {status === 'question' && (
          <div className={`text-4xl font-bold tabular-nums ${timer <= 5 ? 'text-red-300 animate-pulse' : 'text-white'}`}>
            {timer}s
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Waiting Lobby */}
        {status === 'waiting' && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="text-center py-8">
              <p className="text-sm font-medium text-gray-500 mb-2">Código de acesso</p>
              <p className="text-7xl font-black text-green-700 tracking-widest mb-4">{joinCode}</p>
              <p className="text-gray-500 text-sm">
                Acesse: <strong>{typeof window !== 'undefined' ? window.location.origin : ''}/play</strong>
              </p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">Jogadores ({players.length})</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                {players.length === 0
                  ? <p className="text-gray-400 text-sm">Aguardando jogadores...</p>
                  : players.map(p => (
                    <div key={p.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-green-700 text-white text-xs flex items-center justify-center font-bold">
                        {p.nickname[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{p.nickname}</span>
                    </div>
                  ))
                }
              </div>
              <Button className="w-full" size="lg" onClick={emitStart} disabled={players.length === 0}>
                Iniciar Quiz →
              </Button>
            </Card>
          </div>
        )}

        {/* Question Phase */}
        {(status === 'question' || status === 'reviewing') && currentQuestion && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Pergunta {questionIndex + 1} de {totalQuestions} · {currentQuestion.points} pts
              </p>
              {status === 'question' && (
                <p className="text-sm text-gray-500">
                  Respostas: <strong>{answeredCount}/{players.length}</strong>
                </p>
              )}
            </div>

            <Card className="py-8 text-center">
              <p className="text-2xl font-bold text-gray-900">{currentQuestion.text}</p>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.answers.map((answer, i) => {
                const isCorrect = answer.id === correctAnswerId;
                const isWrong = status === 'reviewing' && correctAnswerId !== null && !isCorrect;
                return (
                  <div key={answer.id}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl text-white font-semibold transition-opacity ${ANSWER_COLORS[i]} ${isWrong ? 'opacity-30' : ''} ${isCorrect ? 'ring-4 ring-white ring-offset-2' : ''}`}>
                    <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                      {ANSWER_LABELS[i]}
                    </span>
                    <span className="flex-1">{answer.text}</span>
                    {isCorrect && <span className="text-xl">✓</span>}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3">
              {status === 'question' && (
                <Button size="lg" onClick={emitReveal}>
                  <Eye className="w-5 h-5" /> Revelar Resposta
                </Button>
              )}
              {status === 'reviewing' && (
                <>
                  {leaderboard.length > 0 && (
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">Placar parcial</p>
                      <div className="flex gap-3 overflow-x-auto pb-1">
                        {leaderboard.slice(0, 5).map((entry) => (
                          <div key={entry.id} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shrink-0">
                            <span className="text-xs text-gray-400">#{entry.rank}</span>
                            <span className="text-sm font-medium">{entry.nickname}</span>
                            <span className="text-sm font-bold text-green-700">{entry.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button size="lg" onClick={emitNext}>
                    <ChevronRight className="w-5 h-5" />
                    {questionIndex + 1 >= totalQuestions ? 'Ver Placar Final' : 'Próxima Pergunta'}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Finished */}
        {status === 'finished' && (
          <div className="space-y-4">
            <Card className="text-center py-6">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-gray-900">Quiz Finalizado!</h2>
              <p className="text-gray-500">{quizTitle}</p>
            </Card>

            {leaderboard.length > 0 && (
              <Card>
                <h3 className="font-bold text-gray-800 mb-4">Placar Final</h3>
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div key={entry.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg ${entry.rank <= 3 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                      <span className="text-xl w-8 text-center">
                        {entry.rank <= 3 ? MEDAL_ICONS[entry.rank - 1] : `#${entry.rank}`}
                      </span>
                      <span className={`flex-1 font-semibold ${entry.rank <= 3 ? MEDAL_COLORS[entry.rank - 1] : 'text-gray-700'}`}>
                        {entry.nickname}
                      </span>
                      <span className="font-bold text-gray-900 text-lg">{entry.score} pts</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
