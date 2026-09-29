# Plano de Implementação: Sincronização Automática Multi-dispositivo com Firebase

## 1. Contexto e Objetivos
Atualmente, o app possui salvamento local em `localStorage` e suporte inicial ao Firebase, mas o progresso não sincroniza automaticamente entre diferentes dispositivos (PC, celular Android, etc.), exigindo exportação/importação manual via JSON. Além disso, é necessário garantir:
- **Login com Google** simples e direto.
- **Detecção de novo dispositivo / conflito de dados**: perguntar ao usuário se deseja **Baixar da Nuvem** ou **Manter dados locais (e enviá-los para a nuvem)**.
- **Economia rigorosa de cotas do Firestore**: estruturar o salvamento em documento único compactado por usuário com salvamento automático com *debounce* (espera alguns segundos após alterações para gravar), evitando leituras/escritas repetitivas e mantendo o app 100% no tier gratuito.
- **Compatibilidade total**: PWA instalável, offline-first e pronto para GitHub Pages.

---

## 2. Etapas de Desenvolvimento

### Etapa 1: Refatoração do Serviço Firebase (`src/services/firebase.ts`)
- Configurar autenticação com Google (`GoogleAuthProvider` + `signInWithPopup` / `signInWithRedirect` para PWA mobile).
- Criar métodos dedicados de sincronização:
  - `fetchCloudProgress(userId)`: busca os dados mais recentes da nuvem em documento único `users/{uid}/game/data`.
  - `saveCloudProgress(userId, data)`: grava com timestamp `updatedAt`.
  - Escuta em tempo real opcional ou verificação na inicialização e retorno de foco da aba/app.
- Adicionar debouncing automático para envio à nuvem após mudanças no jogo (evitando flood de escritas).

### Etapa 2: Modal de Resolução de Conflito de Dados (`SyncConflictModal.tsx`)
- Ao logar com Google em um novo dispositivo ou detectar diferença relevante entre nuvem e local:
  - Exibir modal com comparativo detalhado:
    - **Nuvem**: Nível, EXP, Quests ativas/concluídas, data da última alteração.
    - **Este Dispositivo**: Nível, EXP, Quests ativas/concluídas, data da última alteração.
  - Duas ações claras:
    1. **📥 Baixar da Nuvem**: Substitui os dados locais pelos dados salvos na nuvem.
    2. **🚀 Manter Dados Deste Dispositivo**: Substitui os dados da nuvem pelos dados deste aparelho.

### Etapa 3: Integração no Loop Principal (`src/App.tsx` e `TopBar.tsx`)
- Observar o estado de autenticação do Firebase (`onAuthStateChanged`).
- Ao autenticar:
  - Verificar se já existe save na nuvem.
  - Se a nuvem estiver vazia, faz o primeiro upload automático do progresso local.
  - Se a nuvem tiver dados e os dados locais forem os padrão (novo dispositivo/navegador limpo), baixa automaticamente ou exibe o modal se houver progresso local relevante.
  - Se houver progresso tanto local quanto na nuvem, dispara o diálogo de escolha.
- Indicador discreto no `TopBar`:
  - Avatar / Email do Google conectado.
  - Status do Sync: "Nuvem Sincronizada ☁️✓", "Salvando...", ou "Offline / Local".
  - Botão de "Sincronizar Agora" e "Desconectar".

### Etapa 4: Validação de Regras do Firestore (`firestore.rules`)
- Garantir regras de segurança estritas permitindo que apenas o usuário autenticado (`request.auth.uid == userId`) possa ler e escrever em seus próprios dados.

### Etapa 5: Testes e Validação de Compilação
- Verificar compilação com `compile_applet`.
- Testar fluxos de login, salvamento automático, recarregamento e alternância de estado online/offline.
