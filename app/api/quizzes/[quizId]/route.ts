import { NextResponse } from 'next/server';
const { getQuizById, updateQuiz, deleteQuiz } = require('@/lib/db/queries');

export async function GET(_req: Request, { params }: { params: { quizId: string } }) {
  const quiz = getQuizById(Number(params.quizId));
  if (!quiz) return NextResponse.json({ error: 'Quiz não encontrado' }, { status: 404 });
  return NextResponse.json(quiz);
}

export async function PUT(request: Request, { params }: { params: { quizId: string } }) {
  try {
    const { title, description } = await request.json();
    if (!title?.trim()) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    updateQuiz(Number(params.quizId), { title: title.trim(), description: description?.trim() });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar quiz' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { quizId: string } }) {
  try {
    deleteQuiz(Number(params.quizId));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar quiz' }, { status: 500 });
  }
}
