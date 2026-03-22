# lib/db — Camada de Dados

## Formato dos arquivos

**Estes arquivos são CommonJS (`.js`), não TypeScript.** O `server.js` na raiz faz `require('./lib/db/queries')` diretamente, então eles precisam ser CJS. Não renomear para `.ts` nem usar `import/export`.

## Arquivos

### `index.js` — Singleton do banco
- Abre a conexão com o SQLite em `data/quiz.db`
- Cria o banco e todas as tabelas automaticamente se não existirem (`CREATE TABLE IF NOT EXISTS`)
- Usa pattern de singleton via `global.__db` em dev para evitar múltiplas conexões durante hot-reload
- Chama `PRAGMA foreign_keys = ON` e `PRAGMA journal_mode = WAL` na inicialização

### `queries.js` — Todas as queries SQL
Todo acesso ao banco passa por aqui. Nunca escrever SQL inline em API routes, pages ou server.js.

#### Funções disponíveis

**Quizzes**
- `getAllQuizzes()` — lista com `question_count`
- `getQuizById(id)` — retorna quiz completo com perguntas e respostas (inclui `is_correct`)
- `createQuiz({ title, description })` → `id`
- `updateQuiz(id, { title, description })`
- `deleteQuiz(id)` — cascata apaga perguntas e respostas

**Perguntas**
- `addQuestion(quizId, { text, time_limit, points, order_index, answers })` → `id`
- `updateQuestion(id, { text, time_limit, points, order_index })`
- `deleteQuestion(id)`
- `replaceAnswers(questionId, answers)` — apaga todas e reinicia (em transaction)

**Sessões**
- `createSession(quizId, joinCode)` → `id`
- `getSessionById(id)` → sessão ou `undefined`
- `getSessionByCode(code)` → sessão ou `undefined` (normaliza para UPPERCASE)
- `updateSessionStatus(id, status)` — atualiza `status`
- `updateSessionQuestion(id, questionIndex)` — atualiza índice e `question_started_at = NOW()`

**Jogadores**
- `addPlayer(sessionId, nickname)` → `id`
- `getPlayerById(id)`
- `getPlayersBySession(sessionId)` → ordenado por score desc
- `getLeaderboard(sessionId)` → com campo `rank` via `ROW_NUMBER()`

**Respostas dos jogadores**
- `hasPlayerAnswered(playerId, questionId)` → boolean
- `savePlayerAnswer(playerId, sessionId, questionId, answerId, isCorrect, pointsEarned)` — também atualiza `players.score` se correto
- `getAnswerCountForQuestion(sessionId, questionId)` → número
- `getResultsForQuestion(sessionId, questionId)` → array com nickname, answer_id, is_correct, points_earned

## Schema resumido

```
quizzes → questions → answers
                ↓
            sessions → players → player_answers
```

Todas as relações têm `ON DELETE CASCADE`. Deletar um quiz apaga perguntas, respostas, (mas não sessões — essas ficam).
