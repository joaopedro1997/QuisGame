import { NextResponse } from 'next/server';
const { getSessionByCode, addPlayer } = require('@/lib/db/queries');

export async function POST(request: Request) {
  try {
    const { code, nickname } = await request.json();

    if (!code?.trim() || !nickname?.trim()) {
      return NextResponse.json({ error: 'Código e apelido são obrigatórios' }, { status: 400 });
    }

    const session = getSessionByCode(code.trim());
    if (!session) {
      return NextResponse.json({ error: 'Sessão não encontrada. Verifique o código.' }, { status: 404 });
    }

    if (session.status === 'finished') {
      return NextResponse.json({ error: 'Esta sessão já encerrou.' }, { status: 400 });
    }

    if (session.status !== 'waiting') {
      return NextResponse.json({ error: 'O quiz já começou. Não é possível entrar agora.' }, { status: 400 });
    }

    const playerId = addPlayer(session.id, nickname.trim());
    return NextResponse.json({ playerId, sessionId: session.id, joinCode: session.join_code }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro ao entrar na sessão' }, { status: 500 });
  }
}
