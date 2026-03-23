'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BookOpen, ArrowLeft } from 'lucide-react';

export default function NewQuizPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    setLoading(false);
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/admin/quizzes/${id}`);
    } else {
      const err = await res.json();
      setError(err.error);
    }
  }

  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-green-700 text-white px-6 py-4 flex items-center gap-3">
        <BookOpen className="w-6 h-6" />
        <h1 className="text-xl font-bold">QuizGame — Admin</h1>
      </header>
      <main className="max-w-2xl mx-auto p-6">
        <Link href="/admin" className="inline-flex items-center gap-1 text-green-700 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Novo Quiz</h2>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: Nutrição Básica"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Breve descrição do conteúdo"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? 'Criando...' : 'Criar e adicionar perguntas'}
              </Button>
              <Link href="/admin">
                <Button variant="secondary" size="lg" type="button">Cancelar</Button>
              </Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
