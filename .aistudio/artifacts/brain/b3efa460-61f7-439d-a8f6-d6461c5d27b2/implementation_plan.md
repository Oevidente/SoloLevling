# Sistema Solo Leveling - Contador de Pilares, Trava Anti-Repetição, Inventário Expandido e Relatório Compartilhável

Plano de arquitetura e evolução do Sistema Solo Leveling para atender às demandas de usabilidade diária: visualização imediata do progresso nos 3 pilares, bloqueio de re-cumprimento de missões no mesmo ciclo, acesso completo ao inventário com maior diversidade de itens, e geração de card de status com estética Solo Leveling otimizado para prints e compartilhamento.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Decisões confirmadas pelo usuário na fase de alinhamento:
> - **Tela de Compartilhamento / Print**: Modal de Relatório Diário de Alta Fidelidade com suporte nativo a copiar imagem diretamente para a área de transferência (Clipboard API via Canvas) e botão de download PNG.
> - **Prevenção de Repetição**: Missões cumpridas são travadas como concluídas no ciclo atual, impedindo duplo ganho de XP ou múltiplos acionamentos até a ativação de "Renovar Dia".
> - **Diversidade de Baús**: Tabela de itens enriquecida com elixires de produtividade/XP, pergaminhos de pausa sem culpa, relíquias de proteção de streak e títulos honorários equipáveis.

---

## 1. Overview & Core Concept

- **O que faz**:
  1. **Contador de Missões Pendentes nos Pilares**: Insere badges dinâmicos no topo de cada uma das 3 colunas (Físico, Mental, Espiritual) indicando o total de missões restantes (ex: `2 pendentes`, ou `Concluído` quando 100%).
  2. **Bloqueio de Ciclo Diário Anti-Repetição**: Quando uma missão é completada, ela ganha status de travada no ciclo (`lockedInCycle: true`). O botão de alternância é desativado para evitar repetições acidentais e acúmulo desregrado de XP até que o Caçador aperte "Renovar Dia".
  3. **Aba de Inventário Acessível e Recompensas Diversificadas**: Garante acesso evidente à aba de Inventário tanto no Desktop quanto no Mobile (com navegação fluida e bottom tabs/top bar claros), expande o pool do baú com novos itens raros/épicos/lendários e viabiliza a ativação de consumíveis e equipamento de títulos de honra.
  4. **Relatório Visual do Ciclo (Print / Share Ready)**: Renderiza um cartão estilizado "Relatório do Caçador - Ciclo Diário" inspirado nos painéis do Sistema do Solo Leveling com Rank, Nível, Streak, XP ganho, radar dos 3 pilares e botão de copiar como imagem para Instagram Stories/WhatsApp/Twitter.

- **Público-Alvo**: Caçador (foco em produtividade com neurociência para TDA e gamificação da Tríade Físico/Mental/Espiritual).
- **Valor Principal**: Clareza do que falta fazer no dia, integridade das recompensas sem brecha para loop de XP falso, valorização dos drops do baú e celebração social das vitórias diárias com tela feita para print.

---

## 2. User Experience & Visual Design

### Fluxos Chave do Usuário

1. **Visão Geral no Painel de Status**:
   - O Caçador visualiza de imediato no topo de cada coluna de pilar:
     - FÍSICO: badge neon `X pendentes` ou `✓ Concluído`
     - MENTAL: badge teal `X pendentes` ou `✓ Concluído`
     - ESPIRITUAL: badge dourado `X pendentes` ou `✓ Concluído`
   - Ao clicar para completar uma meta, o XP é adicionado, os efeitos sonoros tocam, a missão é marcada com um cadeado sutil de conclusão diária e o contador do pilar subtrai 1 pendência em tempo real.

2. **Acesso e Gestão do Inventário**:
   - O botão de Inventário permanece sempre visível na barra de navegação com indicador numérico de itens acumulados.
   - Tela com abas de filtro (`Todos`, `Consumíveis/Buffs`, `Pergaminhos`, `Relíquias`, `Títulos`).
   - Ao abrir um baú de recompensas (Loot Box), surge a animação com confetes e um botão direto: `[ Guardar e Abrir Inventário ]`.
   - No Inventário, o usuário pode clicar em `[ Equipar Título ]` para atualizar instantaneamente o título exibido no HUD ou `[ Usar ]` para consumíveis.

3. **Geração do Card de Print / Compartilhamento de Ciclo**:
   - Um botão de destaque `[ 📸 Relatório do Ciclo ]` no cabeçalho do HUD e no fluxo de `Renovar Dia`.
   - Abre o modal com um card vertical (aspect ratio ~ 4:5 ou 9:16) no formato padrão de card de caçador:
     - Emblema luminoso do Rank (E a Monarca) e LV atual.
     - Nome e Título do Caçador.
     - Tríade do Ciclo: barra de progresso e contagem de metas de Físico, Mental e Espiritual.
     - Sequência de Dias (Streak) e total de XP do dia.
     - Botão `[ 📋 Copiar Imagem ]` que gera o PNG no canvas do navegador e coloca no Clipboard para colar onde quiser.
     - Botão `[ ⬇ Baixar Imagem (PNG) ]` para salvar direto na galeria do celular ou computador.

### Visual Identity & Theme
- **Estética**: Holographic Hunter HUD (preto profundo `#020804`, cinza obsidiana `#0a120c`, verde neon `#22c55e`, toques de azul mental `#2dd4bf` e dourado místico `#f59e0b`).
- **Tipografia**: Display font imponente e geométrica para números e títulos (`font-display font-black`), fonte mono para telemetria e XP (`tabular-nums font-mono`), e corpo sem serifa ultra legível.
- **Ergonomia Mobile**: Alvos de toque $\ge 44\text{px}$, navegação ágil sem sobreposição ou quebra de linha.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Bloqueio Estrito no Ciclo com Resete pelo "Renovar Dia"**
  - *Abordagem*: Uma vez marcada a missão, ela não pode ser desmarcada repetidas vezes no mesmo ciclo para farmar XP. Apenas quando o usuário aciona a renovação do dia (ou troca de ciclo) as missões voltam a ficar disponíveis para cumprimento.
  - *Motivo*: Atende à solicitação explícita do usuário e protege a gamificação contra desonestidade cognitiva ou cliques duplos involuntários.

- **Decisão 2: Geração de Imagem 100% Client-Side via HTML5 Canvas Nativo**
  - *Abordagem*: Utilizar desenho direto em Canvas 2D sem depender de serviços externos nem bibliotecas pesadas.
  - *Motivo*: Respeita a regra de gastar zero cota, não usar IA nem serviços pagos, e funciona perfeitamente offline e no GitHub Pages via GitHub Actions.

- **Decisão 3: Caching Local-First para Economia de Firestore**
  - *Abordagem*: Manter toda atualização imediata em `localStorage`, sincronizando com Firebase apenas com debounce de 2 segundos. O inventário e histórico de missões persistem mesmo se a cota gratuita do Firebase estiver sob alta demanda.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                               App.tsx                                  │
│  (State: player, quests, lockedQuestsToday, inventory, activeTab)      │
└────────┬───────────────────────────┬──────────────────────────┬────────┘
         │                           │                          │
         ▼                           ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    TopBar.tsx    │       │   StatusHud.tsx  │       │InventoryModal.tsx│
│ - Status tab     │       │ - Contador Pilar │       │ - Filtros & Usar │
│ - Inventário tab │       │ - Bloqueio Ciclo │       │ - Equipar Título │
│ - Baús pendentes │       │ - Botão Relatório│       │ - Drops Guardados│
└──────────────────┘       └─────────┬────────┘       └──────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │ CycleShareModal.tsx  │
                          │ - Card Solo Leveling │
                          │ - Canvas 2D Renderer │
                          │ - Copiar / Baixar PNG│
                          └──────────────────────┘
```

### Entidades e Extensões no Modelo de Dados

1. **Quest (`src/types/hunter.ts`)**:
   - `isCompleted`: boolean indicando conclusão.
   - `completedInCycleDate?: string`: guarda a data/ciclo em que foi cumprida para travar a re-execução até a renovação.

2. **Loot Table (`src/data/lootTable.ts`)**:
   - Expansão de itens (12+ itens balanceados entre buffs de XP, autorizações de descanso, pergaminhos de foco, escudos de streak e títulos raros como "Mestre da Tríade" e "Monarca da Disciplina").

3. **Status HUD (`src/components/StatusHud.tsx`)**:
   - Adição dos contadores no header de cada pilar:
     - `const fisicoPending = fisicoQuests.filter(q => !q.isCompleted).length;`
     - Badge estilizado com estilo e contraste claros.
   - Tratamento do estado travado para itens já concluídos no dia.

---

## 5. Verification Plan

1. **Contador dos Pilares**: Adicionar e alternar missões em Físico, Mental e Espiritual, verificando se o contador no topo de cada coluna decrementa/incrementa com precisão.
2. **Prevenção de Repetição**: Marcar uma missão como cumprida e verificar se ela fica com status de travada para o ciclo atual, impedindo duplo clique/re-cumprimento até o clique em "Renovar Dia".
3. **Aba de Inventário**: Abrir uma Caixa de Recompensas, verificar o recebimento de itens variados (com novos títulos e relíquias), navegar até a aba de Inventário, equipar títulos e usar poções.
4. **Card de Compartilhamento / Print**: Abrir o modal de Relatório de Ciclo, verificar a composição visual (Rank, Nome, Pilares, Streak), testar o botão de Copiar Imagem e Baixar PNG.
5. **Compilação e Lint**: Executar `compile_applet` e garantir zero erros de build TypeScript/Vite.
