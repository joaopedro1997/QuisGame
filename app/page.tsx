import Link from 'next/link';
import { BookOpen, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-700 rounded-3xl mb-6">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-black text-green-800 mb-2">QuisGame</h1>
        <p className="text-gray-500 mb-10">Plataforma de quiz interativo para sala de aula</p>

        <div className="space-y-3">
          <Link href="/play" className="flex items-center justify-center gap-3 w-full bg-green-700 text-white font-semibold py-4 px-6 rounded-xl hover:bg-green-800 transition-colors text-lg">
            <Users className="w-5 h-5" />
            Entrar como Jogador
          </Link>
          <Link href="/admin" className="flex items-center justify-center gap-3 w-full bg-white text-gray-700 border border-gray-300 font-semibold py-4 px-6 rounded-xl hover:bg-gray-50 transition-colors text-lg">
            <BookOpen className="w-5 h-5" />
            Área do Professor
          </Link>
        </div>
      </div>
    </div>
  );
}
