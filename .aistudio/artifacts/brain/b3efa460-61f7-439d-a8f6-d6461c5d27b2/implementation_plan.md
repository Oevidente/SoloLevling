# Correção de Alerta de Segurança e Sintaxe do GitHub Actions

Plano de diagnóstico e resolução definitiva para as duas ocorrências reportadas no GitHub: o alerta de vazamento de segredo da chave de API do Firebase no arquivo de configuração (`firebase-applet-config.json`) e a falha de sintaxe YAML no fluxo de implantação do GitHub Pages (`.github/workflows/deploy.yml`).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Diagnóstico das duas falhas identificadas nos prints**:
> 1. **Erro de Sintaxe no GitHub Actions (`deploy.yml` Linha 1)**: O título `name: Deploy System: Solo Leveling to GitHub Pages` contém dois-pontos seguidos de espaço (`System:`), o que o analisador de YAML interpreta como um dicionário/chave mapeada inválida. A solução é colocar aspas duplas na string ou substituir por hífen.
> 2. **Alerta de Secret Scanning no GitHub (`firebase-applet-config.json:4`)**: O arquivo de configuração do Firebase contendo a chave `AIzaSyAtFJkMRreLow6x8...` foi versionado no repositório Git. Como boa prática de segurança e para cessar alertas, o arquivo deve ser adicionado ao `.gitignore`, substituído por um modelo de exemplo no repositório (`firebase-applet-config.example.json`), e o app deve suportar variáveis de ambiente `VITE_FIREBASE_*` com fallback resiliente para build contínuo.

---

## 1. Overview & Core Concept

- **Problema 1 (Sintaxe YAML)**: No arquivo `.github/workflows/deploy.yml`, a linha 1 dispara `Invalid workflow file: You have an error in your yaml syntax`. O GitHub Actions bloqueia a execução completa do workflow de build e deploy no GitHub Pages.
- **Problema 2 (Segredo Exposto)**: O GitHub Secret Scanning detectou a string da chave de API do Google no commit público em `firebase-applet-config.json:4`. Embora chaves de cliente web do Firebase dependam de regras do Firestore e restrições de HTTP Referrer para segurança, o GitHub gera alerta de conformidade que deve ser silenciado via `.gitignore`, template de ambiente e injeção controlada de segredos no workflow.
- **Objetivo**: Corrigir a sintaxe do workflow para que o deploy no GitHub Pages execute com sucesso automático a cada push, proteger os arquivos de configuração contra commit acidental e documentar como fechar o alerta no painel do GitHub.

---

## 2. User Experience & Visual Design

- **Experiência do Desenvolvedor**:
  - Ao realizar `git push`, o workflow do GitHub Actions executa sem falhas de sintaxe e realiza o deploy no GitHub Pages (`https://oevidente.github.io/SoloLevling/`).
  - Nenhum alerta de segredo novo é disparado em futuros commits.
  - Para quem clonar o repositório, o build funciona tanto com variáveis de ambiente do Vite quanto com fallback seguro sem quebrar o TypeScript.
- **Experiência do Caçador no App**:
  - Preserva 100% da integridade da conexão com o Firestore, PWA offline, HUD de status e economia de cotas do banco de dados já construídos.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Correção do nome do Workflow com Aspas e Robustez no Build**
  - *Abordagem*: Alterar linha 1 para `name: "Deploy System: Solo Leveling to GitHub Pages"`. Além disso, garantir que a etapa de build crie um arquivo de fallback caso o repositório clonado no GitHub Actions não tenha o arquivo local de credenciais.
  - *Motivo*: YAML exige aspas quando o valor escalar contém caracteres especiais como dois-pontos seguidos de espaço (`: `).

- **Decisão 2: Proteção do `firebase-applet-config.json` via `.gitignore` e `import.meta.env`**
  - *Abordagem*:
    1. Incluir `firebase-applet-config.json` no `.gitignore`.
    2. Criar `firebase-applet-config.example.json` com chaves vazias ou genéricas para documentação e template de deploy.
    3. Atualizar `src/services/firebase.ts` para mesclar valores de `import.meta.env` (como `VITE_FIREBASE_API_KEY`) com o arquivo local, garantindo compatibilidade total no AI Studio e em builds de CI no GitHub.
    4. Atualizar `.github/workflows/deploy.yml` para gerar o arquivo durante o workflow a partir de GitHub Secrets ou defaults, caso não exista.
  - *Motivo*: Resolve a causa raiz do alerta de vazamento no GitHub e impede que novas credenciais sejam expostas.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Repositório Git / CI/CD                         │
├────────────────────────────────────┬───────────────────────────────────┤
│         GitHub Actions             │          Controle de Git          │
│  (.github/workflows/deploy.yml)    │            (.gitignore)           │
│  - Nome entre aspas [CORRIGIDO]    │  - firebase-applet-config.json    │
│  - Gera config a partir de secrets │    (ignorado em novos commits)    │
│  - Build e Deploy Pages            │  - firebase-applet-config.example │
└─────────────────┬──────────────────┴─────────────────┬─────────────────┘
                  │                                    │
                  ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      src/services/firebase.ts                          │
│  - Lê variáveis import.meta.env.VITE_FIREBASE_*                        │
│  - Fallback resiliente para arquivo local ou objeto de segurança       │
│  - Preserva Firestore testConnection() e otimizações de cota          │
└────────────────────────────────────────────────────────────────────────┘
```

### Arquivos Modificados / Criados:
1. `/.github/workflows/deploy.yml`:
   - Linha 1 corrigida: `name: "Deploy System: Solo Leveling to GitHub Pages"`.
   - Adicionada etapa de criação automática de `firebase-applet-config.json` a partir de segredos/variáveis do GitHub antes de `npm run build`.
2. `/.gitignore`:
   - Adicionada entrada `firebase-applet-config.json`.
3. `/firebase-applet-config.example.json`:
   - Modelo limpo sem chaves expostas para referência no repositório.
4. `/src/services/firebase.ts`:
   - Integração com `import.meta.env` para flexibilidade entre local, AI Studio e GitHub Pages.
5. `/.env.example`:
   - Adicionadas variáveis `VITE_FIREBASE_*` explicativas.

---

## 5. Verification Plan

1. **Validação da Sintaxe YAML**:
   - Verificar estrutura do arquivo `.github/workflows/deploy.yml` garantindo ausência de erros de formatação.
2. **Validação do Build do Applet**:
   - Executar `compile_applet` para certificar que o Vite compila sem erros com a nova configuração de Firebase.
3. **Instruções para o Usuário no GitHub**:
   - Fornecer os comandos Git necessários para remover o arquivo do rastreamento do GitHub (`git rm --cached firebase-applet-config.json`) e o passo a passo para fechar o alerta de segurança no painel do GitHub.
