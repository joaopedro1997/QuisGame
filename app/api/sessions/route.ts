import { NextResponse } from 'next/server';
const { createSession, getQuizById } = require('@/lib/db/queries');
const { generateJoinCode } = require('@/lib/utils/joinCode');

export async function POST(request: Request) {
  try {
    const { quizId } = await request.json();
    const quiz = getQuizById(Number(quizId));
    if (!quiz) return NextResponse.json({ error: 'Quiz não encontrado' }, { status: 404 });
    if (quiz.questions.length === 0) {
      return NextResponse.json({ error: 'O quiz precisa ter pelo menos 1 pergunta' }, { status: 400 });
    }

    const joinCode = generateJoinCode(6);
    const sessionId = createSession(Number(quizId), joinCode);
    return NextResponse.json({ sessionId, joinCode }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro ao criar sessão' }, { status: 500 });
  }
}
