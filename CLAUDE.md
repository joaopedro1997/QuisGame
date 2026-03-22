# QuisGame — Contexto para Claude

## O que é este projeto

Quiz interativo multiplayer para uso em sala de aula. O professor (admin) cria quizzes, abre sessões com código de acesso e controla o ritmo das perguntas. Os alunos entram pelo celular, respondem em tempo real e veem um placar final com 🥇🥈🥉.

Trabalho de faculdade de nutrição — a interface é limpa, acadêmica e sem excessos visuais.

---

## Como rodar

```bash
npm run dev     # desenvolvimento (hot-reload ativo)
npm run build   # compilar para produção
npm start       # produção
```

**IMPORTANTE:** `npm run dev` executa `node server.js`, NÃO `next dev`. Isso é intencional — o Socket.io precisa de um servidor HTTP customizado. Hot-reload do Next.js funciona normalmente mesmo assim.

---

## Arquitetura — decisões críticas

### 1. Servidor customizado (`server.js`)
O `server.js` na raiz cria o servidor HTTP, anexa o Next.js como handler e sobe o Socket.io no mesmo processo. Todo o estado de tempo real (perguntas ativas, timers, broadcasts) fica em `server.js`.

### 2. `lib/db/` é CommonJS puro (`.js`, não `.ts`)
`lib/db/index.js` e `lib/db/queries.js` são CommonJS porque `server.js` precisa fazer `require()` deles diretamente. **Não converter para TypeScript** — vai quebrar o `server.js`. As API routes do Next.js também usam `require()` para importar esses módulos (o ESLint está configurado para permitir isso).

### 3. Timer é manual
O timer no cliente é **apenas visual**. O professor sempre precisa clicar "Revelar Resposta" explicitamente — não há auto-advance no servidor. Não adicionar auto-advance sem pedir confirmação.

### 4. Pontuação simples
Correto = pontos cheios da pergunta (configurável: 50/100/150/200). Errado = 0. Sem bônus de velocidade. Não complicar a fórmula.

### 5. Banco de dados
SQLite em `data/quiz.db` (criado automaticamente, diretório no `.gitignore`). Todas as queries ficam em `lib/db/queries.js` — nunca escrever SQL inline em outros arquivos.

---

## Variáveis de ambiente

Arquivo: `.env.local` (já existe na raiz)

| Variável | Uso |
|----------|-----|
| `ADMIN_PASSWORD` | Senha da área do professor (padrão: `admin123`) |
| `NEXT_PUBLIC_SOCKET_URL` | URL para o cliente Socket.io conectar (padrão: `http://localhost:3000`) |

---

## Segurança (não remover sem motivo)

- `middleware.ts` protege todas as rotas `/admin/*` verificando o cookie `admin_auth`
- A senha do admin é comparada no cookie `httpOnly` (não exposta ao JS do browser)
- Evento `session:question_start` **nunca** inclui `is_correct` nas respostas — só `id` e `text`
- O gabarito só vai para os clientes via `session:answer_revealed`, após o professor revelar
- O servidor verifica se o jogador já respondeu a pergunta antes de aceitar nova resposta

---

## Socket.io — rooms e eventos

Cada sessão usa duas rooms:
- `session:{id}` — todos os participantes (admin + jogadores)
- `admin:{id}` — apenas o admin (para eventos exclusivos como `session:answer_count`)

### Eventos cliente → servidor
| Evento | Emitido por |
|--------|------------|
| `admin:join_session` | Admin ao entrar na página de controle |
| `admin:start_quiz` | Admin ao clicar "Iniciar Quiz" |
| `admin:reveal_answer` | Admin ao clicar "Revelar Resposta" |
| `admin:next_question` | Admin ao clicar "Próxima Pergunta" |
| `player:join` | Jogador ao conectar na página do jogo |
| `player:submit_answer` | Jogador ao clicar em uma opção |

### Eventos servidor → cliente
| Evento | Destinatário |
|--------|-------------|
| `session:player_joined` | Sala toda |
| `session:question_start` | Sala toda |
| `session:answer_revealed` | Sala toda |
| `session:score_update` | Sala toda |
| `session:quiz_finished` | Sala toda |
| `session:answer_count` | Apenas admin |
| `player:answer_accepted` | Apenas o jogador que respondeu |

---

## Estado da sessão (máquina de estados)

```
waiting → question → reviewing → question → ... → finished
              ↑           ↓
         (próxima)   (revelar)
```

O campo `sessions.status` no banco controla o estado. O Socket.io reflete esse estado para todos os clientes conectados.

---

## Estrutura de arquivos — o que cada um faz

```
server.js              ← NÚCLEO: HTTP + Socket.io + toda lógica de tempo real
middleware.ts          ← Proteção de /admin via cookie
lib/db/index.js        ← Singleton do SQLite, cria schema na 1ª execução
lib/db/queries.js      ← TODAS as queries SQL — nunca escrever SQL em outros lugares
lib/utils/joinCode.js  ← Gera código aleatório tipo "A3F9KL"

app/page.tsx                          ← Landing (ir para /admin ou /play)
app/admin/login/page.tsx              ← Login com senha
app/admin/page.tsx                    ← Dashboard com lista de quizzes
app/admin/quizzes/new/page.tsx        ← Criar quiz
app/admin/quizzes/[quizId]/page.tsx   ← Editar quiz + gerenciar perguntas
app/admin/sessions/[sessionId]/page.tsx ← Painel de controle ao vivo (Socket.io client)
app/play/page.tsx                     ← Formulário de entrada (código + apelido)
app/play/[sessionId]/page.tsx         ← Tela do jogador com todos os estados (Socket.io client)

components/ui/Button.tsx  ← Variantes: primary, secondary, danger, ghost | Tamanhos: sm, md, lg
components/ui/Card.tsx    ← Card branco padrão
```

---

## Padrões de código

- API routes usam `require()` para importar de `lib/db/queries.js` (ESLint configurado para permitir)
- Páginas com Socket.io usam `useRef<Socket>` + cleanup em `useEffect` return
- `playerId` do jogador é salvo em `sessionStorage` para sobreviver a refreshes de página
- Cores das respostas: teal (A), blue (B), amber (C), rose (D) — manter consistência entre admin e player
