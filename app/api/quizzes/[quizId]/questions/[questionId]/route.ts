import { NextResponse } from 'next/server';
const { updateQuestion, deleteQuestion, replaceAnswers } = require('@/lib/db/queries');

export async function PUT(request: Request, { params }: { params: { quizId: string; questionId: string } }) {
  try {
    const { text, time_limit, points, order_index, answers } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: 'Texto é obrigatório' }, { status: 400 });

    const questionId = Number(params.questionId);
    updateQuestion(questionId, { text: text.trim(), time_limit, points, order_index });

    if (answers) {
      if (!answers.some((a: { is_correct: boolean }) => a.is_correct)) {
        return NextResponse.json({ error: 'Marque uma resposta correta' }, { status: 400 });
      }
      replaceAnswers(questionId, answers);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar pergunta' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { quizId: string; questionId: string } }) {
  try {
    deleteQuestion(Number(params.questionId));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar pergunta' }, { status: 500 });
  }
}
