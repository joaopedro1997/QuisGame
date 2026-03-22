# app/admin — Páginas do Professor

## Proteção

Todas as rotas `/admin/*` são protegidas pelo `middleware.ts` na raiz. Ele verifica o cookie `admin_auth` (httpOnly) e redireciona para `/admin/login` se ausente ou inválido. A senha é comparada com `process.env.ADMIN_PASSWORD`.

## Páginas

### `login/page.tsx`
- Formulário simples com campo de senha
- POST para `/api/admin/login`
- Usa `Suspense` para poder ler `searchParams` (parâmetro `redirect` da URL)
- Após login bem-sucedido, redireciona para o destino original

### `page.tsx` — Dashboard
- Lista todos os quizzes com contagem de perguntas
- Botões: Editar → `/admin/quizzes/[id]`, Iniciar (POST `/api/sessions`), Deletar
- Botão "Iniciar" desabilitado se o quiz não tiver perguntas

### `quizzes/new/page.tsx`
- Formulário de criação (título obrigatório, descrição opcional)
- Após criar, redireciona para `/admin/quizzes/[id]` para adicionar perguntas

### `quizzes/[quizId]/page.tsx` — Editor de Quiz
Componente mais complexo do admin. Contém dois sub-componentes inline:

**`QuestionForm`** (formulário de nova pergunta):
- Estado local: texto, time_limit, points, array de answers
- Mínimo 2, máximo 4 opções de resposta
- Botão circular colorido para marcar resposta correta (substitui radio button)
- Cores: teal (A), blue (B), amber (C), rose (D) — mesmas cores da tela do jogador
- POST para `/api/quizzes/[id]/questions`

**Listagem de perguntas:**
- Exibe perguntas em ordem com badge de número, tempo e pontos
- Respostas em grid 2×2 com destaque verde na correta
- DELETE por pergunta

### `sessions/[sessionId]/page.tsx` — Painel de Controle
Página principal durante o quiz ao vivo. Conecta via Socket.io.

**Fases renderizadas:**
1. `waiting` — código em letras gigantes + lista de jogadores + botão "Iniciar Quiz"
2. `question` — texto da pergunta, respostas coloridas, timer no header, contador de respostas
3. `reviewing` — respostas com gabarito destacado, placar parcial, botão "Próxima Pergunta"
4. `finished` — placar final com medalhas

**Eventos Socket.io emitidos:**
- `admin:join_session` → ao conectar
- `admin:start_quiz` → ao clicar "Iniciar Quiz"
- `admin:reveal_answer` → ao clicar "Revelar Resposta"
- `admin:next_question` → ao clicar "Próxima Pergunta"

**Eventos Socket.io recebidos:**
- `session:player_joined` → atualiza lista de jogadores
- `session:question_start` → muda para fase `question`, inicia timer visual
- `session:answer_count` → atualiza contador de respostas recebidas
- `session:answer_revealed` → muda para fase `reviewing`, destaca gabarito
- `session:score_update` → atualiza placar parcial
- `session:quiz_finished` → muda para fase `finished` com placar final

## Timer visual no admin

O timer exibe os segundos restantes no header durante a fase `question`. Ele é iniciado com `serverTimestamp` recebido em `session:question_start` para compensar latência de rede. Muda para vermelho piscante quando ≤ 5 segundos. É apenas informativo — não dispara nada automaticamente.
