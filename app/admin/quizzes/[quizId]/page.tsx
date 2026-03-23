'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { BookOpen, ArrowLeft, Plus, Trash2, Play, Check } from 'lucide-react';

interface Answer { id?: number; text: string; is_correct: boolean; }
interface Question {
  id: number; text: string; time_limit: number; points: number; order_index: number;
  answers: Answer[];
}
interface Quiz { id: number; title: string; description: string | null; questions: Question[]; }

const ANSWER_COLORS = ['bg-teal-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500'];
const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

function QuestionForm({ quizId, onSaved }: { quizId: number; onSaved: () => void }) {
  const [text, setText] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [points, setPoints] = useState(100);
  const [answers, setAnswers] = useState<Answer[]>([
    { text: '', is_correct: true },
    { text: '', is_correct: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function setCorrect(index: number) {
    setAnswers(answers.map((a, i) => ({ ...a, is_correct: i === index })));
  }

  function updateAnswer(index: number, text: string) {
    setAnswers(answers.map((a, i) => i === index ? { ...a, text } : a));
  }

  function addAnswer() {
    if (answers.length >= 4) return;
    setAnswers([...answers, { text: '', is_correct: false }]);
  }

  function removeAnswer(index: number) {
    if (answers.length <= 2) return;
    const next = answers.filter((_, i) => i !== index);
    if (!next.some(a => a.is_correct)) next[0].is_correct = true;
    setAnswers(next);
  }

  async function handleSave() {
    setError('');
    if (!text.trim()) { setError('Digite o texto da pergunta'); return; }
    if (answers.some(a => !a.text.trim())) { setError('Preencha todas as respostas'); return; }

    setLoading(true);
    const res = await fetch(`/api/quizzes/${quizId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), time_limit: timeLimit, points, answers }),
    });
    setLoading(false);
    if (res.ok) {
      setText(''); setPoints(100); setTimeLimit(30);
      setAnswers([{ text: '', is_correct: true }, { text: '', is_correct: false }]);
      onSaved();
    } else {
      const err = await res.json();
      setError(err.error);
    }
  }

  return (
    <Card className="border-2 border-dashed border-green-300 bg-green-50">
      <h3 className="font-semibold text-gray-800 mb-4">Nova Pergunta</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pergunta *</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={2}
            placeholder="Digite a pergunta..."
          />
        </div>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tempo (seg)</label>
            <select value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              {[15, 20, 30, 45, 60].map(t => <option key={t} value={t}>{t}s</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pontos</label>
            <select value={points} onChange={(e) => setPoints(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              {[50, 100, 150, 200].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Respostas (selecione a correta)</label>
            {answers.length < 4 && (
              <button onClick={addAnswer} className="text-sm text-green-700 hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Adicionar opção
              </button>
            )}
          </div>
          <div className="space-y-2">
            {answers.map((answer, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrect(i)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${ANSWER_COLORS[i]} ${answer.is_correct ? 'ring-2 ring-offset-2 ring-green-600' : 'opacity-60'}`}
                  title="Marcar como correta"
                >
                  {answer.is_correct ? <Check className="w-4 h-4" /> : ANSWER_LABELS[i]}
                </button>
                <input
                  type="text"
                  value={answer.text}
                  onChange={(e) => updateAnswer(i, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder={`Opção ${ANSWER_LABELS[i]}`}
                />
                {answers.length > 2 && (
                  <button onClick={() => removeAnswer(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button onClick={handleSave} disabled={loading} size="md">
          {loading ? 'Salvando...' : 'Salvar Pergunta'}
        </Button>
      </div>
    </Card>
  );
}

export default function QuizEditorPage({ params }: { params: { quizId: string } }) {
  const quizId = Number(params.quizId);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  async function load() {
    const res = await fetch(`/api/quizzes/${quizId}`);
    if (res.ok) setQuiz(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDeleteQuestion(questionId: number) {
    if (!confirm('Deletar esta pergunta?')) return;
    await fetch(`/api/quizzes/${quizId}/questions/${questionId}`, { method: 'DELETE' });
    load();
  }

  async function handleStart() {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId }),
    });
    if (res.ok) {
      const { sessionId } = await res.json();
      router.push(`/admin/sessions/${sessionId}`);
    } else {
      const err = await res.json();
      alert(err.error);
    }
  }

  if (loading) return <div className="min-h-screen bg-green-50 flex items-center justify-center"><p>Carregando...</p></div>;
  if (!quiz) return <div className="min-h-screen bg-green-50 flex items-center justify-center"><p>Quiz não encontrado.</p></div>;

  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-green-700 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6" />
          <h1 className="text-xl font-bold">QuizGame — Admin</h1>
        </div>
        <Button onClick={handleStart} size="sm" variant="secondary" disabled={quiz.questions.length === 0}>
          <Play className="w-4 h-4" /> Iniciar Sessão
        </Button>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <Link href="/admin" className="inline-flex items-center gap-1 text-green-700 hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
          {quiz.description && <p className="text-gray-500 mt-1">{quiz.description}</p>}
          <p className="text-sm text-gray-400 mt-1">{quiz.questions.length} {quiz.questions.length === 1 ? 'pergunta' : 'perguntas'}</p>
        </div>

        <div className="space-y-4">
          {quiz.questions.map((q, index) => (
            <Card key={q.id} className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-white bg-green-700 rounded px-2 py-0.5">
                      #{index + 1}
                    </span>
                    <span className="text-xs text-gray-400">{q.time_limit}s · {q.points} pts</span>
                  </div>
                  <p className="font-medium text-gray-900">{q.text}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {q.answers.map((a, i) => (
                      <div key={a.id ?? i}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${a.is_correct ? 'bg-green-100 border border-green-400 font-semibold' : 'bg-gray-50 border border-gray-200'}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${ANSWER_COLORS[i]}`}>
                          {ANSWER_LABELS[i]}
                        </span>
                        {a.text}
                        {a.is_correct && <Check className="w-3 h-3 text-green-600 ml-auto" />}
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="danger" size="sm" onClick={() => handleDeleteQuestion(q.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}

          {showForm ? (
            <QuestionForm quizId={quizId} onSaved={() => { setShowForm(false); load(); }} />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl py-6 text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Adicionar pergunta
            </button>
          )}
        </div>

        {quiz.questions.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Button size="lg" onClick={handleStart}>
              <Play className="w-5 h-5" /> Iniciar Sessão
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
