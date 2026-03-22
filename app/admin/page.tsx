'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Plus, BookOpen, Pencil, Trash2, Play, LogOut } from 'lucide-react';

interface Quiz {
  id: number;
  title: string;
  description: string | null;
  question_count: number;
  created_at: string;
}

export default function AdminDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function load() {
    const res = await fetch('/api/quizzes');
    if (res.ok) setQuizzes(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Deletar o quiz "${title}"? Esta ação não pode ser desfeita.`)) return;
    await fetch(`/api/quizzes/${id}`, { method: 'DELETE' });
    load();
  }

  async function handleStart(id: number) {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId: id }),
    });
    if (res.ok) {
      const { sessionId } = await res.json();
      router.push(`/admin/sessions/${sessionId}`);
    } else {
      const err = await res.json();
      alert(err.error);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-green-700 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6" />
          <h1 className="text-xl font-bold">QuisGame — Admin</h1>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1 text-green-200 hover:text-white text-sm">
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Meus Quizzes</h2>
          <Link href="/admin/quizzes/new">
            <Button size="md">
              <Plus className="w-4 h-4" /> Novo Quiz
            </Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : quizzes.length === 0 ? (
          <Card className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Nenhum quiz criado ainda.</p>
            <Link href="/admin/quizzes/new">
              <Button><Plus className="w-4 h-4" /> Criar primeiro quiz</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{quiz.title}</h3>
                  {quiz.description && (
                    <p className="text-sm text-gray-500 truncate">{quiz.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {quiz.question_count} {quiz.question_count === 1 ? 'pergunta' : 'perguntas'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/admin/quizzes/${quiz.id}`}>
                    <Button variant="secondary" size="sm">
                      <Pencil className="w-3 h-3" /> Editar
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => handleStart(quiz.id)}
                    disabled={quiz.question_count === 0}
                    title={quiz.question_count === 0 ? 'Adicione perguntas primeiro' : ''}
                  >
                    <Play className="w-3 h-3" /> Iniciar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(quiz.id, quiz.title)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
