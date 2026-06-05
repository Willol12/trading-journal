@AGENTS.md

# Modo de trabalho (equilibrado)

Estas regras têm prioridade sobre as skills do superpowers quando houver conflito.

- **Proporcional ao tamanho da tarefa.** Em mudanças pequenas/óbvias (ajuste de UI, copy, um bug localizado), vá direto ao ponto: não exija brainstorming, plano escrito ou worktree. Em mudanças grandes ou arriscadas (nova feature, mudança de schema, refactor amplo), aí sim planeje e alinhe antes.
- **TDD quando fizer sentido.** Há Vitest configurado (`npm test`). Para lógica de domínio (cálculos de P&L, R-multiple, agregações, parsing de CSV) escreva o teste primeiro. Para componentes puramente visuais, teste é opcional.
- **Verificar antes de concluir.** Antes de dizer que algo está pronto: rode `npm run test:run` e, quando a mudança for visível na UI, confirme no preview. Não declare "feito" sem evidência.
- **Não pergunte o óbvio.** Use defaults sensatos e siga; pergunte só quando a decisão for genuinamente do usuário.
- **Português (PT-BR)** nas respostas e comentários, como no resto do projeto.

## Testes

- Runner: Vitest + Testing Library (`vitest.config.mts`, setup em `vitest.setup.ts`).
- Rodar uma vez: `npm run test:run`. Watch: `npm test`.
- Testes ficam em `__tests__/` ao lado do código ou colocados no `app`.
