# ScannerCV Project - AI Knowledge Base & Rules

Este arquivo serve como um registro de aprendizados e padrões arquiteturais do projeto ScannerCV, para que o assistente AI consulte antes de propor soluções ou ao tentar debugar problemas recorrentes.

## 🐛 Bugs Recorrentes e Aprendizados

1. **Destructuring de Responses no React (`.map is not a function`)**
   - **Problema:** A tela de Admin (AdminDashboard.jsx) ou outras listagens ficaram brancas (White Screen of Death no React).
   - **Causa:** O endpoint `/api/admin/leads` não retorna um array diretamente. Ele retorna um dicionário: `{"leads": [...], "total_scans": X}`. O Frontend fazia `setLeads(data)` e tentava rodar `leads.map()`, crachando a página.
   - **Solução Padronizada:** Sempre validar a resposta. Ao dar `setLeads(...)`, prefira `setLeads(data.leads || data)` ou garanta a desestruturação no momento do `await response.json()`.
   
2. **Adição de Novas Colunas no SQLite (Erro `no such column`)**
   - **Problema:** Ao adicionar a coluna `source` no SQLAlchemy, o banco `scannercv.db` não foi migrado e isso quebrou o backend ao tentar acessar a tabela.
   - **Causa:** O SQLite não suporta migrations nativas fáceis (via `Base.metadata.create_all()` ele não dá ALTER TABLE em colunas novas, apenas cria tabelas caso não existam).
   - **Solução Padronizada:** Se estamos no ambiente local de dev, podemos deletar o `scannercv.db` e reiniciar o Uvicorn, OU criar um script python que use `sqlite3` para rodar os `ALTER TABLE` das colunas novas. Sempre avise o usuário ao modificar os Models do `main.py`.

3. **Arquivos do Backend Bloqueados pelo Windows**
   - **Problema:** Tentativa de apagar `scannercv.db` por terminal falhou porque o Windows travou o arquivo em uso.
   - **Causa:** O processo `uvicorn` (ou processo `python.exe` interno) segurou a lock do arquivo de banco.
   - **Solução Padronizada:** Rodar um comando PowerShell forte para matar os processos antes de apagar arquivos lockados: `Stop-Process -Name uvicorn -Force -ErrorAction SilentlyContinue; Stop-Process -Name python -Force -ErrorAction SilentlyContinue`.

4. **Import Errors no Vite/React (`useState is not defined`)**
   - **Problema:** Tela branca após refatoração de componentes.
   - **Causa:** Ao mover código de um arquivo para outro ou unificar bibliotecas de ícones, as importações fundamentais como `React`, `useState`, `useEffect` foram removidas acidentalmente.
   - **Solução Padronizada:** Sempre verificar se `import React, { useState, useEffect } from 'react';` está presente se o componente utilizar estados ou efeitos. Não confiar no auto-import do IDE durante edições em lote.

5. **URLs de API Hardcoded (`localhost:8080`)**
   - **Problema:** Funcionalidades que funcionam localmente mas falham na VPS (Docker/Easypanel).
   - **Causa:** O uso de `fetch('http://localhost:8080/api/...')` no frontend faz com que o navegador do cliente tente acessar a própria máquina dele (localhost) em vez do servidor.
   - **Solução Padronizada:** **NUNCA** usar a porta ou localhost em URLs de fetch. Use caminhos relativos: `fetch('/api/...')`. O proxy do servidor (ou o próprio ambiente Docker) cuidará do roteamento.

6. **Blog Post Detail 404 (Link Quebrado)**
   - **Problema:** Postagem aparece na lista mas dá erro ao "Ler Mais".
   - **Causa:** Diferenças de maiúsculas/minúsculas no slug ou caracteres especiais não tratados.
   - **Solução Padronizada:** 
       - Backend: Usar `func.lower()` no SQLAlchemy para comparação case-insensitive. 
       - Backend: Sanitizar slugs ao salvar (remover acentos, espaços -> hífen, lowercase). 
       - Frontend: Usar `encodeURIComponent(slug)` no fetch do post individual.

## 🏗️ Padrões do Projeto

- **Frontend:** React + Vite, Tailwind CSS (estilização puramente inline nas classes, sem CSS externo customizado sempre que possível), Lucide React para ícones.
- **Backend:** FastAPI, SQLAlchemy (SQLite), pdfplumber para leitura de PDFs, OpenAI para extração de dados `gpt-4o-mini`.
- **Roteamento:** `react-router-dom` v6 (`App.jsx` concentra todos os Routes).
- **ScrollToTop Pattern**: Use the `ScrollToTop.jsx` component in `App.jsx` within the router to ensure every page transition resets the scroll position to the top.
- **Autenticação Padronizada**: Prefira **Authorization: Bearer <token>** no Header em vez de parâmetros de URL. Já implementado para Admin e Consultores/Parceiros.
- **Blog System**: Dynamic blog using `BlogPost` model. Includes a CMS in `AdminDashboard.jsx` with an AI-generation feature (`/api/admin/blog/generate`) that uses GPT-4o-mini to draft content based on topics.
- **Markdown Rendering**: The frontend uses `react-markdown` to render blog post content, allowing for rich text formatting diretamente do banco.
- **Estética Sênior:** Os Dashboards (Recruiter/Admin) devem tentar manter o uso da cor principal (`#094074`) combinada com tons de cinza do Tailwind (`slate-50`, `slate-900`) e bordas estéticas (`rounded-2xl`, sombreamentos sutis).

## 📝 Sistema de Blog (CMS)

- **Model:** `BlogPost` no `main.py` (slug único, markdown no content).
- **Public API:** `GET /api/blog` e `GET /api/blog/{slug}`.
- **Admin CMS:** Aba dedicada no `AdminDashboard.jsx` com suporte a listagem, edição e geração de conteúdo via IA.
- **IA Generation:** Endpoint `/api/admin/blog/generate` usa o GPT-4o-mini para criar posts estruturados a partir de um tópico.

## Integrações
A IA não precisa se preocupar com permissões diárias via OpenAI do lado Backend quando testa scripts em `localhost`. Inserimos uma branch condicional `client_ip in ["127.0.0.1", "::1", "localhost"]` no Rate Limiter.

## 🎓 Módulo de Treinamento para Entrevistas

- **Arquivos:** `interview.py` (lógica core, rotas, prompts), `audio_handler.py` (download/transcrição de áudio via Whisper).
- **Padrão de rotas:** prefixo `/api/interview/` com endpoints `start`, `answer`, `webhook`, `report/:id`, `status/:id`.
- **Modelos:** `InterviewSession` (sessão com estado), `InterviewMessage` (cada msg texto/áudio), `InterviewReport` (relatório final).
- **Multi-idioma:** prompts em PT/EN/ES armazenados em dicionário `PROMPTS` no `interview.py`. Cada sessão tem `language` fixo.
- **Web Simulation:** endpoint `/api/interview/answer` permite responder via web (sem WhatsApp). Útil para dev e testes.
- **WhatsApp:** integração via Evolution API (self-hosted). Webhook em `/api/interview/webhook`. Suporta texto e áudio.
- **Frontend:** `InterviewLanding.jsx` (formulário + simulação), `InterviewReport.jsx` (relatório visual). Rotas `/entrevista` e `/entrevista/resultado/:id`.
