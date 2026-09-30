# Plano de Migração: Backup e Sincronização via Google Drive 🛡️📂

## 1. Visão Geral
Substituiremos a persistência anterior do Firestore pela integração direta com a **Google Drive API (v3)** via **Google Workspace OAuth (Firebase Auth + Drive File Scope)**. 

### Vantagens:
- **Zero custo / Zero estouro de cota**: Utiliza o armazenamento do Google Drive do próprio usuário.
- **Arquivo Único e Limpo**: O save será gravado em `hunter_save.json` dentro da pasta `Solo Leveling - Hunter System` no Google Drive, sendo sobrescrito nas atualizações sem gerar arquivos duplicados (como `backup(1).json`).
- **Controle Total (Manual)**: Botões dedicados e intuitivos para **"Salvar no Drive"** e **"Restaurar do Drive"** com confirmação e resumo de status.
- **100% Compatível com GitHub Pages & PWA**: Operação client-side com token OAuth em memória e persistência local `localStorage` de alta velocidade.

---

## 2. Arquitetura e Fluxo de Dados

```
[ Local-First State (LocalStorage) ]
            │
            ├──── [ 📤 Salvar no Drive ] ────► Procura pasta "Solo Leveling - Hunter System"
            │                                 │  ├─ Se não existir: Cria pasta
            │                                 └─ Se existir "hunter_save.json": Atualiza (PATCH)
            │                                    Se não existir: Cria (POST multipart)
            │
            └──── [ 📥 Restaurar do Drive ] ◄── Localiza "hunter_save.json" e baixa (?alt=media)
                                              │  └─ Exibe diálogo de confirmação com dados (Nível, EXP, Quests)
                                              └─ Atualiza estado do Caçador + localStorage
```

---

## 3. Etapas de Implementação

### Etapa 1: Configuração do OAuth e Escopo do Google Drive
- Configurar OAuth com o escopo de menor privilégio necessário:
  - `https://www.googleapis.com/auth/drive.file` (Permite que o app crie a pasta, leia e atualize apenas os arquivos criados pelo próprio app no Google Drive do usuário).
- Gerenciamento de token de acesso em memória (sem gravar credenciais em `localStorage`).

### Etapa 2: Serviço do Google Drive (`src/services/googleDrive.ts`)
- **`getOrCreateBackupFolder(accessToken)`**: Verifica se a pasta `Solo Leveling - Hunter System` existe no Drive raiz (`trashed = false`); se não, cria a pasta.
- **`findBackupFile(accessToken, folderId)`**: Busca pelo arquivo `hunter_save.json` dentro da pasta dedicada.
- **`saveToGoogleDrive(player, quests, accessToken)`**:
  - Prepara o payload JSON com metadados do Caçador.
  - Se o arquivo já existir: executa requisição `PATCH /upload/drive/v3/files/{fileId}?uploadType=media` para sobrescrever o conteúdo diretamente.
  - Se não existir: executa requisição `POST /upload/drive/v3/files?uploadType=multipart` para criar o arquivo dentro da pasta.
- **`fetchFromGoogleDrive(accessToken)`**:
  - Obtém metadados do arquivo (data da última modificação, tamanho) e o conteúdo JSON via `GET /drive/v3/files/{fileId}?alt=media`.
- **`formatDriveDate(dateString)`**: Formatação amigável de data e hora para exibição na interface.

### Etapa 3: Interface do Modal de Nuvem & Backup (`CloudBackupModal.tsx`)
- Substituir a aba do Firebase por um painel moderno e temático de **Google Drive**:
  - **Status da Conexão**: Cartão com estilo oficial "Conectar com Google", exibindo foto/nome/email do usuário logado.
  - **Ação 1: 📤 Salvar no Google Drive**:
    - Botão com feedback sonoro e visual.
    - Exibe status e timestamp da última gravação efetuada no Drive.
    - Confirmação visual de sucesso ou erro claro.
  - **Ação 2: 📥 Restaurar do Google Drive**:
    - Consulta o arquivo existente na nuvem e mostra um resumo comparativo antes de aplicar (Nível no Drive vs Nível atual, Quests concluídas).
    - Diálogo de confirmação para prevenir perda acidental de dados locais mais recentes.
  - **Ação 3: 💾 Backup Local em JSON**: Mantido como alternativa offline imediata (Download do arquivo .json e Upload manual de arquivo .json).

### Etapa 4: Atualização da Barra Superior (`TopBar.tsx`) e `App.tsx`
- Indicador elegante de conexão com o Google Drive no `TopBar`.
- Remoção do código legado do Firestore (`firestore.rules`, endpoints legados do Firestore), limpando a base para ser mais leve e rápida.
- Teste de responsividade em mobile e desktop.

---

## 4. Verificação e Testes
1. **Compilação**: Execução de `compile_applet` e verificação de tipagem TypeScript.
2. **Fluxo de Autenticação**: Conexão/desconexão com Google.
3. **Fluxo de Salvamento**: Criação da pasta no Drive e substituição do arquivo `hunter_save.json` sem duplicação.
4. **Fluxo de Restauração**: Leitura do JSON no Drive, comparação de dados e carregamento no jogo.
5. **Garantia Offline / Local**: Funcionamento normal do app sem login, usando localStorage.
