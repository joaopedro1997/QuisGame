# app/api — API Routes

## Padrão de importação

As API routes importam do banco com `require()` (não `import`), pois `lib/db/` é CommonJS:

```ts
const { getQuizById, createQuiz } = require('@/lib/db/queries');
```

O ESLint está configurado para permitir `require()` em todo o projeto (`@typescript-eslint/no-require-imports: off`).

## Autenticação

As rotas de API **não verificam autenticação** (exceto `/api/admin/login`). A proteção de `/admin` é feita pelo `middleware.ts` nas rotas de página. As rotas de API são chamadas apenas por código dentro das páginas já protegidas.

## Rotas disponíveis

### Quizzes
```
GET    /api/quizzes                              → lista todos os quizzes
POST   /api/quizzes                              → cria quiz { title, description? }
GET    /api/quizzes/[quizId]                     → quiz completo com perguntas e respostas
PUT    /api/quizzes/[quizId]                     → atualiza título/descrição
DELETE /api/quizzes/[quizId]                     → deleta quiz
POST   /api/quizzes/[quizId]/questions           → adiciona pergunta com respostas
PUT    /api/quizzes/[quizId]/questions/[qId]     → atualiza pergunta (e opcionalmente respostas)
DELETE /api/quizzes/[quizId]/questions/[qId]     → deleta pergunta
```

### Sessões
```
POST /api/sessions                    → cria sessão { quizId } → { sessionId, joinCode }
GET  /api/sessions/[sessionId]        → estado da sessão (perguntas SEM is_correct)
POST /api/sessions/by-code/join       → jogador entra { code, nickname } → { playerId, sessionId }
POST /api/sessions/[sessionId]/join   → alternativo por sessionId (mesmo body e resposta)
```

### Admin
```
POST   /api/admin/login   → login { password } → define cookie admin_auth
DELETE /api/admin/login   → logout → remove cookie admin_auth
```

## Atenção: GET /api/sessions/[sessionId]

Este endpoint **remove `is_correct`** das respostas antes de retornar. É usado pelas páginas do jogador para hidratação inicial. Nunca expor `is_correct` nesse endpoint.

## Transições de estado da sessão

As transições de estado (`waiting → question → reviewing → finished`) **não passam pela API REST**. Elas acontecem exclusivamente via Socket.io no `server.js`. As API routes são apenas para leitura e criação de dados estáticos (quizzes, perguntas, sessões, players).
