import { NextResponse } from 'next/server';
const { addQuestion, getQuizById } = require('@/lib/db/queries');

export async function POST(request: Request, { params }: { params: { quizId: string } }) {
  try {
    const quizId = Number(params.quizId);
    const quiz = getQuizById(quizId);
    if (!quiz) return NextResponse.json({ error: 'Quiz não encontrado' }, { status: 404 });

    const body = await request.json();
    const { text, time_limit = 30, points = 100, answers = [] } = body;

    if (!text?.trim()) return NextResponse.json({ error: 'Texto da pergunta é obrigatório' }, { status: 400 });
    if (answers.length < 2) return NextResponse.json({ error: 'Mínimo de 2 respostas' }, { status: 400 });
    if (!answers.some((a: { is_correct: boolean }) => a.is_correct)) {
      return NextResponse.json({ error: 'Marque uma resposta correta' }, { status: 400 });
    }

    const order_index = quiz.questions.length;
    const id = addQuestion(quizId, { text: text.trim(), time_limit, points, order_index, answers });
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro ao adicionar pergunta' }, { status: 500 });
  }
}
