import { NextResponse } from 'next/server';
const { getAllQuizzes, createQuiz } = require('@/lib/db/queries');

export async function GET() {
  try {
    const quizzes = getAllQuizzes();
    return NextResponse.json(quizzes);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar quizzes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, description } = await request.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }
    const id = createQuiz({ title: title.trim(), description: description?.trim() });
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro ao criar quiz' }, { status: 500 });
  }
}
