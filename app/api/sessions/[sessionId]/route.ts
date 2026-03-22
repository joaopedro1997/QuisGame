import { NextResponse } from 'next/server';
const { getSessionById, getQuizById, getPlayersBySession } = require('@/lib/db/queries');

export async function GET(_req: Request, { params }: { params: { sessionId: string } }) {
  const session = getSessionById(Number(params.sessionId));
  if (!session) return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });

  const quiz = getQuizById(session.quiz_id);
  const players = getPlayersBySession(session.id);

  // Don't send correct answers to client
  const safeQuestions = quiz?.questions.map((q: {
    id: number; text: string; time_limit: number; points: number; order_index: number;
    answers: Array<{ id: number; text: string; is_correct: number }>;
  }) => ({
    id: q.id,
    text: q.text,
    timeLimit: q.time_limit,
    points: q.points,
    orderIndex: q.order_index,
    answers: q.answers.map((a) => ({ id: a.id, text: a.text })),
  }));

  return NextResponse.json({
    session,
    quiz: quiz ? { id: quiz.id, title: quiz.title, description: quiz.description } : null,
    questions: safeQuestions || [],
    players,
  });
}
