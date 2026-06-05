# PagFacil

App de criação de links de pagamento via Pix (MVP).

## Stack
- **Backend:** NestJS + Prisma + PostgreSQL
- **Frontend:** React + Vite + Tailwind
- **Pix:** BR Code estático (copia e cola), sem integração com PSP

## Setup

### 1. Infraestrutura (Postgres)
```bash
docker compose up -d
```
> Postgres exposto na porta **5435** para evitar conflitos.

### 2. Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run start:dev      # http://localhost:3000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## Perfis e planos
- **Perfil (`role`):** `ROOT` ou `CREATOR` (default). Só o `ROOT` acessa a tela
  `/dashboard/users` para registrar, editar e excluir usuários.
- **Plano (`plan`):** `FREE` (default), `CREATOR` ou `PRO` — armazenado/exibido,
  sem limites aplicados por enquanto.

## Criando o primeiro root
Não há mais registro por `ADMIN_SECRET`. O primeiro usuário é criado direto no banco
e promovido a `ROOT`. Use o Prisma Studio:

```bash
cd backend
npx prisma studio   # abre em http://localhost:5555
```
Crie um registro em `User` com `role = ROOT` e o `passwordHash` em bcrypt. Para gerar o hash:

```bash
cd backend
node -e "console.log(require('bcryptjs').hashSync('senha123', 10))"
```

Depois de logar como root, todos os demais usuários são criados pela tela `/dashboard/users`.

## Fluxo
- Root acessa `/dashboard/users` para gerenciar (criar/editar/excluir) os gerenciadores.
- Gerenciador acessa `/dashboard` (login obrigatório), cadastra chaves Pix em `/dashboard/pix`,
  cria links em `/dashboard/links/new`.
- Cliente abre `/p/:code` (sem login) e vê produto, contador de expiração e QR Code Pix.
