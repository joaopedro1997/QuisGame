import Link from 'next/link';
import { BookOpen, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-700 rounded-3xl mb-6">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-black text-green-800 mb-2">QuizGame</h1>
        <p className="text-gray-500 mb-10">Plataforma de quiz interativo para sala de aula</p>

        <div className="space-y-3">
          <Link href="/play" className="flex items-center justify-center gap-3 w-full bg-green-700 text-white font-semibold py-4 px-6 rounded-xl hover:bg-green-800 transition-colors text-lg">
            <Users className="w-5 h-5" />
            Entrar como Jogador
          </Link>
          <Link href="/admin" className="flex items-center justify-center gap-3 w-full bg-white text-gray-700 border border-gray-300 font-semibold py-4 px-6 rounded-xl hover:bg-gray-50 transition-colors text-lg">
            <BookOpen className="w-5 h-5" />
            Área Restrita
          </Link>
        </div>

        <div className="mt-10 text-left bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Integrantes do Grupo</p>
          <p className="text-xs text-gray-500 mb-2">
            <span className="font-medium text-gray-600">Professora:</span> Rebeca Figueiredo Lima Sousa
          </p>
          <p className="text-xs font-medium text-gray-600 mb-1">Alunos:</p>
          <ul className="text-xs text-gray-500 space-y-0.5">
            <li>Maria Luiza</li>
            <li>Stefany Duarte</li>
            <li>Camile Costa</li>
            <li>Mayara Andrade Barros</li>
            <li>Gabriele de Souza Santos</li>
            <li>Moises Dutra</li>
            <li>Kauan Pina</li>
            <li>Eduarda de Carvalho</li>
            <li>Ian Rodrigues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
