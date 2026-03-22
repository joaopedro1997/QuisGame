# app/play — Páginas do Jogador

## Persistência do jogador

O `playerId` e o `nickname` são salvos em `sessionStorage` após o jogador entrar:

```ts
sessionStorage.setItem('playerId', String(playerId));
sessionStorage.setItem('nickname', nickname);
```

Isso permite reconexão ao Socket.io após refresh de página — a página do jogo lê o `playerId` do `sessionStorage` e re-emite `player:join`.

## Páginas

### `page.tsx` — Formulário de Entrada
- Dois campos: código da sessão (6 chars, auto-uppercase) e apelido (máx 20 chars)
- POST para `/api/sessions/by-code/join`
- Pode receber o código pré-preenchido via query param `?code=XXXXXX`
- Usa `Suspense` para poder ler `searchParams`
- Redireciona para `/play/[sessionId]` após entrar com sucesso

### `[sessionId]/page.tsx` — Tela do Jogo
Página única que renderiza fases diferentes baseado no estado `phase`.

**Fases e o que renderiza:**

| Fase | Trigger | O que aparece |
|------|---------|---------------|
| `loading` | Inicial | Spinner de carregamento |
| `waiting` | `session.status === 'waiting'` | Avatar + apelido + contagem de jogadores + "Aguardando..." |
| `question` | `session:question_start` | Pergunta + 4 botões coloridos + timer progressivo |
| `answered` | `player:answer_accepted` | Botões desabilitados + "Aguardando revelar..." |
| `reviewing` | `session:answer_revealed` | Gabarito destacado + feedback ✅/❌ + pontos ganhos |
| `finished` | `session:quiz_finished` | Placar final com medalhas + "Jogar Novamente" |

**Transições de fase:**
```
loading → waiting (via fetch inicial)
waiting → question (via session:question_start)
question → answered (via player:answer_accepted)
answered → reviewing (via session:answer_revealed)
reviewing → question (via session:question_start)
reviewing → finished (via session:quiz_finished)
```

**Eventos Socket.io emitidos:**
- `player:join` → ao conectar (com `playerId` do sessionStorage)
- `player:submit_answer` → ao clicar em uma opção (só na fase `question`)

**Eventos Socket.io recebidos:**
- `session:player_joined` → atualiza contador na sala de espera
- `session:question_start` → muda para fase `question`
- `player:answer_accepted` → muda para fase `answered`, salva se acertou e pontos
- `session:answer_revealed` → muda para fase `reviewing`, destaca gabarito
- `session:score_update` → atualiza pontuação total
- `session:quiz_finished` → muda para fase `finished`

## Timer visual no jogador

Barra de progresso horizontal que esvazia ao longo de `question.timeLimit` segundos. Cor muda conforme o tempo: verde (>50%) → amarelo (25–50%) → vermelho (<25%). Também mostra o número de segundos restantes com ícone de relógio.

O timer é iniciado com `serverTimestamp` do evento `session:question_start` para compensar latência:
```ts
const elapsed = Math.floor((Date.now() - serverTimestamp) / 1000);
let remaining = Math.max(0, seconds - elapsed);
```

## Cores das respostas

Mesmas cores usadas no painel do admin — importante manter consistência:
- A → `bg-teal-500`
- B → `bg-blue-500`
- C → `bg-amber-500`
- D → `bg-rose-500`

Na fase `reviewing`, respostas incorretas ficam com `opacity-50` e a correta fica `bg-green-500` com anel destacado.

## Placar final

- Entrada do próprio jogador destacada em verde (`bg-green-100`)
- Top 3 com fundo amarelo (`bg-yellow-50`) e ícones 🥇🥈🥉
- Posições 4+ mostram `#N` como prefixo
