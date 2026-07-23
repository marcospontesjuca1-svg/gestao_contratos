# Gestão de Contratos — Ativos Imobiliários

Aplicação web para gestão de ativos imobiliários de uma imobiliária com
imóveis em ativo permanente para locação e desenvolvimento imobiliário:
cadastro detalhado, consultas com filtros avançados, comparativo de valores
com o mercado (manual no MVP) e acesso remoto multiusuário.

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router
- **Backend/dados**: Firebase — Firestore (banco de dados), Firebase
  Authentication (login), Firebase Storage (fotos/anexos), Firebase Hosting
  (deploy)
- **Importação de planilha**: biblioteca `xlsx` (SheetJS), executada no
  navegador

Essas escolhas seguem a sugestão original do briefing (React + Firebase) e
o volume real de dados observado na planilha fornecida (~300 imóveis), que
não justifica um banco relacional dedicado nem infraestrutura própria de
servidor no MVP.

## Estrutura do repositório

```
gestao_contratos/
├── app/                      # aplicação React (frontend)
│   ├── src/
│   │   ├── types/            # Imovel, Usuario, Configuracoes (schema Firestore)
│   │   ├── lib/               # firebase.ts, auth.tsx (contexto de autenticação/perfil),
│   │   │                       # importMapping.ts (mapeamento planilha -> Imovel), xlsxReader.ts
│   │   ├── services/          # CRUD Firestore: imoveisService, usuariosService, configuracoesService
│   │   ├── components/        # Layout, ProtectedRoute, FiltroBar, ImoveisTable, ComparativoMercado
│   │   └── pages/              # Login, Lista, Detalhe, Form (cadastro/edição), Importação, Usuários, Configurações
│   └── .env.example           # variáveis de ambiente do Firebase (copiar para .env.local)
├── docs/
│   └── MODELO_DE_DADOS.md     # schema Firestore definitivo + mapeamento coluna a coluna da planilha real
├── firestore.rules            # regras de segurança (perfis admin/operador)
├── firestore.indexes.json     # índices compostos para os filtros combinados
├── storage.rules              # regras de acesso a fotos/anexos
└── firebase.json
```

## Modelo de dados

O schema definitivo do Firestore está documentado em
[`docs/MODELO_DE_DADOS.md`](docs/MODELO_DE_DADOS.md), construído a partir da
planilha real `Lista_Geral_Imóveis_23.07.2026.xls` (301 imóveis, 24 colunas)
enviada para este projeto. O documento traz, coluna a coluna, o mapeamento
entre a planilha e os campos do sistema, além das coleções `imoveis`,
`usuarios`, `configuracoes` e `importacoes`.

## Decisões já alinhadas

- **Perfis de usuário**: dois perfis — `admin` (CRUD completo de imóveis,
  importação, configurações e gestão de usuários) e `operador` (somente
  consulta/leitura). Modelado em `usuarios/{uid}` e refletido nas
  `firestore.rules`.
- **Comparativo de mercado**: manual no MVP. Cada imóvel tem um campo
  `comparativoMercado.valorM2Regiao` preenchido pelo admin (com fonte e data
  de atualização); o sistema calcula e exibe o percentual de diferença.
  Automação via API de dados imobiliários fica para uma fase futura.
- **Campos vazios na planilha original** (`ESTADO`, `MUNICÍPIO`, `BAIRRO`,
  `KMZ`, `SEGMENTO`, valores contábil/mercado, nome fantasia): a importação
  tenta inferir `MUNICÍPIO` a partir do padrão `"..., Nº - CIDADE"` presente
  em parte dos endereços; quando não é possível, o registro é marcado com
  `enderecoRevisado: false` e sinalizado na listagem/detalhe para revisão
  manual.

## Rodando localmente

```bash
cd app
npm install
cp .env.example .env.local   # preencher com as credenciais do seu projeto Firebase
npm run dev
```

### Configurando o projeto Firebase

1. Crie um projeto no [Console do Firebase](https://console.firebase.google.com/).
2. Ative **Authentication** (método E-mail/senha) e **Firestore Database**
   (modo produção).
3. Copie as credenciais do app web para `app/.env.local`.
4. Publique as regras: `firebase deploy --only firestore:rules,storage:rules`
   (requer `firebase-tools` instalado e `firebase login`/`firebase use
   <project-id>`).
5. **Bootstrap do primeiro admin**: como as regras exigem que o usuário já
   tenha um documento em `usuarios/{uid}` com `perfil: 'admin'` para poder
   escrever nessa coleção, o primeiro administrador precisa ser criado
   manualmente uma única vez — crie o usuário em Authentication, copie o UID
   e crie o documento `usuarios/{uid}` direto pelo Console do Firestore
   (`{ nome, email, perfil: "admin", ativo: true }`). Depois disso, novos
   usuários podem ser vinculados pela tela **Usuários** dentro do próprio
   sistema.

### Importando a planilha inicial

Com um usuário `admin` logado, acesse **Importação**, envie o arquivo `.xls`/
`.xlsx` no formato da planilha original — o sistema mostra uma prévia com
avisos (endereços não parseados, campos vazios) antes de confirmar a
gravação em lote no Firestore. A lógica de mapeamento/normalização fica em
`app/src/lib/importMapping.ts`.

## Limitações conhecidas / próximos passos

- **Backup**: a tela de Configurações já guarda a preferência
  (`backupAtivo`, frequência, destino), mas a execução real do backup
  (Cloud Function agendada exportando o Firestore para Cloud Storage) ainda
  não foi implementada — é infraestrutura de backend, fora do escopo do
  frontend deste MVP.
- **Gestão de usuários**: criar uma credencial nova (e-mail/senha) exige o
  Firebase Admin SDK, que não deve rodar no cliente por segurança. Hoje o
  fluxo é: criar a credencial no Console do Firebase → vincular o perfil
  pela tela Usuários. Uma Cloud Function callable (`admin` convida por
  e-mail) resolveria isso numa próxima fase.
- **Comparativo de mercado automático**: integração com API de dados
  imobiliários (FipeZAP ou similar) fica para depois do MVP, conforme
  alinhado.
- **KMZ/coordenadas**: hoje é só uma URL/link; upload e parsing do arquivo
  `.kmz` para extrair coordenadas automaticamente é uma melhoria futura.
- **Fotos/anexos**: os campos e as regras de Storage já existem no schema;
  falta a UI de upload na tela de cadastro (hoje o formulário aceita URLs
  já hospedadas, mas não tem um input de upload de arquivo).
