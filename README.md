# QuisGame

Plataforma de quiz interativo multiplayer para sala de aula, desenvolvida como trabalho de faculdade de nutrição.

## Funcionalidades

- **Professor (Admin):** cadastra quizzes com perguntas e múltiplas opções de resposta, inicia sessões e controla o ritmo do quiz em tempo real
- **Alunos (Jogadores):** entram na sessão pelo celular usando um código, respondem as perguntas sincronizadas e veem seu desempenho
- **Placar final:** ranking com destaque para 1º, 2º e 3º lugar com medalhas 🥇🥈🥉

---

## Tech Stack

| Tecnologia | Uso |
|---|---|
| [Next.js 14](https://nextjs.org/) (App Router) | Framework principal |
| [TypeScript](https://www.typescriptlang.org/) | Linguagem |
| [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | Banco de dados |
| [Socket.io](https://socket.io/) | Comunicação em tempo real |
| [Tailwind CSS](https://tailwindcss.com/) | Estilização |
| [Lucide React](https://lucide.dev/) | Ícones |

---

## Instalação e Uso

### Pré-requisitos

- Node.js 18+
- npm

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env.local` na raiz do projeto:

```env
ADMIN_PASSWORD=suasenha
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

> A senha padrão é `admin123`. Troque antes de usar em produção.

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

### 4. Build para produção

```bash
npm run build
npm start
```

---

## Como usar

### Fluxo completo em sala de aula

```
Professor                          Alunos
    |                                |
    | /admin → Criar Quiz            |
    | Adicionar perguntas            |
    | Clicar "Iniciar Sessão"        |
    |                                |
    | Mostrar código no projetor     |
    |                              /play → Código + apelido
    |                                |
    | Ver alunos entrando            |
    | Clicar "Iniciar Quiz" ─────────→ Todos recebem a 1ª pergunta
    |                                |
    | Ver contador de respostas      | Clicam em uma opção
    | Clicar "Revelar Resposta" ─────→ Veem a resposta correta + pontos
    |                                |
    | Clicar "Próxima Pergunta" ─────→ Próxima pergunta aparece
    |           ... repete ...       |
    |                                |
    | Placar final ──────────────────→ Ranking com medalhas
```

### Área do Professor (`/admin`)

1. **Login:** acesse `/admin` com a senha configurada em `ADMIN_PASSWORD`
2. **Criar quiz:** clique em "Novo Quiz", preencha título e descrição
3. **Adicionar perguntas:**
   - 2 a 4 opções de resposta por pergunta
   - Clique no círculo colorido para marcar a resposta correta
   - Configure o tempo (15s–60s) e pontos (50–200) por pergunta
4. **Iniciar sessão:** clique em "Iniciar Sessão" para gerar o código de acesso
5. **Painel de controle:**
   - Código em letras grandes para projetar
   - Lista de jogadores entrando em tempo real
   - Contador de respostas recebidas por pergunta
   - Botões: "Revelar Resposta" → "Próxima Pergunta"

### Área do Aluno (`/play`)

1. Acesse `/play` pelo celular
2. Digite o código (6 caracteres) fornecido pelo professor
3. Escolha um apelido
4. Aguarde o professor iniciar
5. Clique em uma das opções coloridas para responder
6. Veja ✅ ou ❌ e quantos pontos ganhou
7. Confira o placar final com medalhas

---

## Estrutura do Projeto

```
QuisGame/
│
├── server.js                          # Servidor HTTP + Socket.io (lógica de tempo real)
├── middleware.ts                      # Proteção das rotas /admin via cookie
│
├── lib/
│   ├── db/
│   │   ├── index.js                   # Singleton SQLite + inicialização do schema
│   │   └── queries.js                 # Todas as funções de acesso ao banco
│   └── utils/
│       └── joinCode.js                # Gerador de código aleatório de sessão
│
├── app/
│   ├── layout.tsx                     # Layout raiz (HTML, metadata)
│   ├── page.tsx                       # Página inicial (landing)
│   ├── globals.css                    # Estilos globais
│   │
│   ├── admin/
│   │   ├── login/page.tsx             # Tela de login do admin
│   │   ├── page.tsx                   # Dashboard com lista de quizzes
│   │   ├── quizzes/
│   │   │   ├── new/page.tsx           # Formulário de criação de quiz
│   │   │   └── [quizId]/page.tsx      # Editor de quiz (perguntas e respostas)
│   │   └── sessions/
│   │       └── [sessionId]/page.tsx   # Painel de controle da sessão ao vivo
│   │
│   ├── play/
│   │   ├── page.tsx                   # Formulário de entrada (código + apelido)
│   │   └── [sessionId]/page.tsx       # Tela do jogador (todas as fases)
│   │
│   └── api/
│       ├── admin/login/route.ts       # POST /api/admin/login, DELETE (logout)
│       ├── quizzes/
│       │   ├── route.ts               # GET (listar), POST (criar)
│       │   └── [quizId]/
│       │       ├── route.ts           # GET, PUT, DELETE
│       │       └── questions/
│       │           ├── route.ts       # POST (adicionar pergunta)
│       │           └── [questionId]/
│       │               └── route.ts   # PUT, DELETE
│       └── sessions/
│           ├── route.ts               # POST (criar sessão)
│           ├── by-code/join/route.ts  # POST (jogador entra pelo código)
│           └── [sessionId]/
│               ├── route.ts           # GET (estado da sessão)
│               └── join/route.ts      # POST (alternativo por ID)
│
└── components/
    └── ui/
        ├── Button.tsx                 # Botão reutilizável (primary, secondary, danger, ghost)
        └── Card.tsx                   # Card branco com borda e sombra
```

---

## Banco de Dados

O banco SQLite é criado automaticamente em `data/quiz.db` na primeira execução. O diretório `data/` está no `.gitignore`.

### Schema

```sql
-- Quizzes cadastrados pelo professor
CREATE TABLE quizzes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Perguntas de cada quiz
CREATE TABLE questions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id     INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  text        TEXT    NOT NULL,
  time_limit  INTEGER NOT NULL DEFAULT 30,   -- segundos por pergunta
  points      INTEGER NOT NULL DEFAULT 100,  -- pontos pela resposta correta
  order_index INTEGER NOT NULL DEFAULT 0     -- ordem de exibição
);

-- Opções de resposta de cada pergunta
CREATE TABLE answers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text        TEXT    NOT NULL,
  is_correct  INTEGER NOT NULL DEFAULT 0     -- 1 = resposta correta
);

-- Sessões de quiz ao vivo
CREATE TABLE sessions (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id                INTEGER NOT NULL REFERENCES quizzes(id),
  join_code              TEXT    NOT NULL UNIQUE,  -- código de 6 chars (ex: A3F9KL)
  status                 TEXT    NOT NULL DEFAULT 'waiting',
  -- 'waiting' | 'question' | 'reviewing' | 'finished'
  current_question_index INTEGER DEFAULT 0,
  question_started_at    DATETIME
);

-- Jogadores que entraram em uma sessão
CREATE TABLE players (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  nickname   TEXT    NOT NULL,
  score      INTEGER NOT NULL DEFAULT 0
);

-- Respostas enviadas pelos jogadores
CREATE TABLE player_answers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id     INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  session_id    INTEGER NOT NULL,
  question_id   INTEGER NOT NULL REFERENCES questions(id),
  answer_id     INTEGER REFERENCES answers(id),  -- NULL se sem resposta
  is_correct    INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  answered_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Comunicação em Tempo Real (Socket.io)

O servidor Socket.io roda no mesmo processo que o Next.js via `server.js`. Cada sessão usa uma **room** nomeada `session:{id}`. O admin também entra em `admin:{id}` para eventos exclusivos.

### Eventos: Cliente → Servidor

| Evento | Quem emite | Payload |
|--------|-----------|---------|
| `admin:join_session` | Admin | `{ sessionId }` |
| `admin:start_quiz` | Admin | `{ sessionId }` |
| `admin:reveal_answer` | Admin | `{ sessionId }` |
| `admin:next_question` | Admin | `{ sessionId }` |
| `player:join` | Jogador | `{ sessionId, playerId }` |
| `player:submit_answer` | Jogador | `{ sessionId, playerId, questionId, answerId }` |

### Eventos: Servidor → Cliente

| Evento | Destinatário | Payload |
|--------|-------------|---------|
| `session:player_joined` | Sala toda | `{ player: { id, nickname }, playerCount }` |
| `session:question_start` | Sala toda | `{ question, questionIndex, totalQuestions, serverTimestamp }` |
| `session:answer_revealed` | Sala toda | `{ correctAnswerId, playerResults }` |
| `session:score_update` | Sala toda | `{ leaderboard: [{ rank, id, nickname, score }] }` |
| `session:quiz_finished` | Sala toda | `{ finalLeaderboard: [{ rank, id, nickname, score }] }` |
| `session:answer_count` | Apenas admin | `{ answered, total }` |
| `player:answer_accepted` | Apenas o jogador | `{ isCorrect, pointsEarned }` |

> **Segurança:** `is_correct` **nunca** é enviado aos jogadores enquanto a pergunta está ativa. Apenas `id` e `text` de cada opção são transmitidos. O gabarito só aparece no evento `session:answer_revealed`.

### Máquina de estados da sessão

```
[waiting]
    │
    │ admin:start_quiz
    ▼
[question] ──── admin:reveal_answer ──→ [reviewing]
                                              │
                                   admin:next_question
                                         /        \
                               mais perguntas?   última?
                                    │                │
                                    ▼                ▼
                               [question]        [finished]
```

---

## API REST

### Quizzes

| Método | Endpoint | Body | Resposta |
|--------|----------|------|----------|
| `GET` | `/api/quizzes` | — | Lista de quizzes com `question_count` |
| `POST` | `/api/quizzes` | `{ title, description? }` | `{ id }` |
| `GET` | `/api/quizzes/:id` | — | Quiz completo com perguntas e respostas |
| `PUT` | `/api/quizzes/:id` | `{ title, description? }` | `{ ok: true }` |
| `DELETE` | `/api/quizzes/:id` | — | `{ ok: true }` |
| `POST` | `/api/quizzes/:id/questions` | `{ text, time_limit?, points?, answers: [{text, is_correct}] }` | `{ id }` |
| `PUT` | `/api/quizzes/:id/questions/:qid` | `{ text, time_limit, points, order_index, answers? }` | `{ ok: true }` |
| `DELETE` | `/api/quizzes/:id/questions/:qid` | — | `{ ok: true }` |

### Sessões

| Método | Endpoint | Body | Resposta |
|--------|----------|------|----------|
| `POST` | `/api/sessions` | `{ quizId }` | `{ sessionId, joinCode }` |
| `GET` | `/api/sessions/:id` | — | `{ session, quiz, questions, players }` |
| `POST` | `/api/sessions/by-code/join` | `{ code, nickname }` | `{ playerId, sessionId, joinCode }` |

### Autenticação Admin

| Método | Endpoint | Body | Resposta |
|--------|----------|------|----------|
| `POST` | `/api/admin/login` | `{ password }` | `{ ok: true }` + define cookie `admin_auth` |
| `DELETE` | `/api/admin/login` | — | `{ ok: true }` + remove cookie |

---

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `ADMIN_PASSWORD` | Senha da área do professor | `admin` |
| `NEXT_PUBLIC_SOCKET_URL` | URL base para o cliente Socket.io | `http://localhost:3000` |

---

## Pontuação

Regra simples: **resposta correta = pontos cheios** da pergunta. Resposta errada ou sem resposta = 0 pontos. Cada pergunta tem pontos configuráveis (50, 100, 150 ou 200, padrão 100). O placar acumula os pontos de todas as perguntas respondidas corretamente.

---

## Segurança

- Rotas `/admin/*` protegidas por middleware do Next.js (`middleware.ts`)
- Senha armazenada como cookie `httpOnly` (não acessível por JavaScript no browser)
- Respostas corretas nunca expostas nos eventos Socket.io durante a pergunta ativa
- Servidor valida que o jogador só pode responder uma vez por pergunta
- Jogadores só podem entrar em sessões com status `waiting`

---

## Comandos

```bash
npm run dev      # Inicia em desenvolvimento (node server.js com hot-reload)
npm run build    # Compila para produção
npm start        # Inicia em produção (node server.js)
npm run lint     # Verifica erros de lint
```

> **Importante:** `npm run dev` executa `node server.js` em vez de `next dev`. Isso é necessário para o Socket.io funcionar. O hot-reload do Next.js continua funcionando normalmente.
