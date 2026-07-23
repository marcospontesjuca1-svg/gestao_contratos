# app — Gestão de Contratos (frontend)

Frontend React + TypeScript + Vite + Tailwind CSS v4, com Firebase
(Auth/Firestore/Storage) como backend.

Veja o README na raiz do repositório para visão geral do projeto e o
[modelo de dados](../docs/MODELO_DE_DADOS.md) para o schema do Firestore.

```bash
npm install
cp .env.example .env.local   # preencher com as credenciais do Firebase
npm run dev                  # ambiente de desenvolvimento
npm run build                # build de produção (tsc -b && vite build)
npm run lint                 # oxlint
```
