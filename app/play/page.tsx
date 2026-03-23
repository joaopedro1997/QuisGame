'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BookOpen } from 'lucide-react';

function JoinForm() {
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill code from URL param (?code=XXXXXX)
  useState(() => {
    const c = searchParams.get('code');
    if (c) setCode(c.toUpperCase());
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // First resolve the session from code
    const joinRes = await fetch('/api/sessions/by-code/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim().toUpperCase(), nickname: nickname.trim() }),
    });

    setLoading(false);
    if (!joinRes.ok) {
      const err = await joinRes.json();
      setError(err.error);
      return;
    }

    const { playerId, sessionId } = await joinRes.json();
    sessionStorage.setItem('playerId', String(playerId));
    sessionStorage.setItem('sessionId', String(sessionId));
    sessionStorage.setItem('nickname', nickname.trim());
    router.push(`/play/${sessionId}`);
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-700 rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-green-800">QuizGame</h1>
          <p className="text-gray-500 mt-1">Entre no quiz</p>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código da sessão</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-2xl font-bold text-center tracking-widest uppercase"
                placeholder="XXXXXX"
                maxLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seu apelido</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Como quer ser chamado?"
                maxLength={20}
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar no Quiz →'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function PlayPage() {
  return <Suspense><JoinForm /></Suspense>;
}
