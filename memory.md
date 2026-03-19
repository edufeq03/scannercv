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

4. **Import Errors no Vite/React (`useState is not defined` ou Ícones Faltando)**
   - **Problema:** Tela branca (White Screen of Death) após refatoração ou adição de novas funcionalidades.
   - **Causa:** Ao editar a lista de ícones (ex: `import { ... } from 'lucide-react'`), é comum remover acidentalmente ícones usados em outras partes do arquivo, ou esquecer importações fundamentais como `React`, `useState`, `useEffect`.
   - **Solução Padronizada:** Sempre revisar a lista completa de ícones importados antes de salvar. Se a tela ficar branca, verifique o console do navegador: o erro costuma ser `IconName is not defined`.

5. **URLs de API Hardcoded (`localhost:8080`)**
   - **Problema:** Funcionalidades que funcionam localmente mas falham na VPS (Docker/Easypanel).
   - **Causa:** O uso de `fetch('http://localhost:8080/api/...')` no frontend faz com que o navegador do cliente tente acessar a própria máquina dele (localhost) em vez do servidor.
   - **Solução Padronizada:** **NUNCA** usar a porta ou localhost em URLs de fetch. Use caminhos relativos: `fetch('/api/...')`. O proxy do servidor (ou o próprio ambiente Docker) cuidará do roteamento.

6. **Diferença de Portas Backend vs Frontend (8000 vs 8080)**
   - **Problema:** Backend rodando na 8000 mas Frontend procurando na 8080 (via `vite.config.js`). Ocorre erro "Ocorreu um erro ao processar o arquivo" no upload.
   - **Solução Padronizada:** Subir o backend SEMPRE na porta **8080** para garantir a compatibilidade com o roteamento do proxy do Vite. Use: `uvicorn main:app --port 8080`.

7. **Configuração de Proxy no Vite**
   - **Importante:** O `vite.config.js` está configurado para proxied `/api` para `http://127.0.0.1:8080`. Se o backend mudar de IP ou porta, este arquivo deve ser atualizado.

8. **StoryCarousel - UI e Performance**
   - **Aprendizado:** Carrosséis "full-screen" (fixed inset-0) com fundo branco podem ser opressores. Usar modal-like (dimmed background + card centralizado) melhora a percepção de UX.
   - **Dica:** Para evitar que o slide anterior/próximo "vaze" (overlap), garanta `overflow-hidden` no container pai imediato e evite `gap` se usar `translateX(100%)`.

## 🏗️ Padrões do Projeto

- **Frontend:** React + Vite, Tailwind CSS (estilização puramente inline nas classes, sem CSS externo customizado sempre que possível), Lucide React para ícones.
- **Backend:** FastAPI, SQLAlchemy (SQLite), pdfplumber para leitura de PDFs, OpenAI para extração de dados `gpt-4o-mini`.
- **Roteamento:** `react-router-dom` v6 (`App.jsx` concentra todos os Routes).
- **Relatório AI (Geração)**: O prompt dinâmico é buscado no banco (`PromptConfig`) com fallbacks hardcoded no código para segurança.
- **Memória do Projeto**: Este arquivo foi renomeado de `ai_memory.md` para `memory.md` para facilitar a referência rápida ("leia o memory.md").

---
*Última atualização: Março de 2026 - Sprint 2 Concluído.*
