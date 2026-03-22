# components — Componentes Reutilizáveis

## `ui/Button.tsx`

Botão com variantes e tamanhos. Todas as propriedades de `<button>` são passadas via spread.

```tsx
<Button variant="primary" size="md">Texto</Button>
```

| Prop | Valores | Padrão |
|------|---------|--------|
| `variant` | `primary` \| `secondary` \| `danger` \| `ghost` | `primary` |
| `size` | `sm` \| `md` \| `lg` | `md` |

- **primary** — fundo verde (`bg-green-700`), texto branco
- **secondary** — fundo branco, borda cinza, texto escuro
- **danger** — fundo vermelho, texto branco
- **ghost** — sem fundo, texto cinza, hover com fundo cinza claro

`disabled` aplica `opacity-50 cursor-not-allowed` automaticamente.

## `ui/Card.tsx`

Container branco com borda, cantos arredondados e sombra leve. Aceita `className` para customização.

```tsx
<Card className="py-8 text-center">
  Conteúdo aqui
</Card>
```

Estilos base: `bg-white rounded-xl shadow-sm border border-gray-200 p-6`

## Nota sobre componentes inline

Alguns componentes maiores (como `QuestionForm` dentro de `app/admin/quizzes/[quizId]/page.tsx`) foram definidos inline na própria page por serem usados em apenas um lugar. Só extrair para `components/` se o componente precisar ser reutilizado em outra página.
