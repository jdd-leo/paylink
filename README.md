# Paylink

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

## Criando o primeiro gerenciador
O registro é protegido pelo `ADMIN_SECRET` definido no `.env` do backend:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "x-admin-secret: <ADMIN_SECRET>" \
  -F "name=Fulano" \
  -F "tradeName=Loja do Fulano" \
  -F "email=fulano@exemplo.com" \
  -F "password=senha123" \
  -F "logo=@/caminho/para/logo.png"
```

## Fluxo
- Gerenciador acessa `/dashboard` (login obrigatório), cadastra chaves Pix em `/dashboard/pix`,
  cria links em `/dashboard/links/new`.
- Cliente abre `/p/:code` (sem login) e vê produto, contador de expiração e QR Code Pix.
