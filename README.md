# Match! - Plataforma de Reserva de Quadras e Eventos Esportivos

## 📱 Visão Geral

**Match!** é uma plataforma mobile (iOS/Android) desenvolvida em **React Native** com **TypeScript** que conecta jogadores, gestores de quadras e professores de esportes. A aplicação permite:

- 🏸 Reserva de quadras (horários ociosos)
- 🎾 Inscrição em eventos (Day Use)
- 👨‍🏫 Aulas com instrutores (Jogos-Aula)
- 🤝 Matchmaking entre jogadores
- 💰 Split de receita automático
- 📊 Relatórios e análises

---

## 🏗️ Arquitetura

### Stack Tecnológico

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL (banco de dados relacional)
- Redis (cache e filas)
- Stripe (pagamentos em BRL)
- Pino (logging estruturado)

**Frontend:**
- React Native + Expo
- Zustand (state management)
- Axios (HTTP client)
- React Navigation (navegação)

---

## 📦 Estrutura de Diretórios

```
match-project/
├── match-backend/
│   ├── src/
│   │   ├── config.ts              # Configurações
│   │   ├── types.ts               # Tipos TypeScript
│   │   ├── database.ts            # Conexão Knex
│   │   ├── server.ts              # Servidor principal
│   │   ├── controllers/           # Controllers da API
│   │   ├── services/              # Lógica de negócio
│   │   ├── middleware/            # Middleware Express
│   │   ├── routes/                # Rotas da API
│   │   └── utils/                 # Utilitários
│   ├── migrations/                # Migrações Knex
│   ├── seeds/                     # Dados iniciais
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── match-frontend/
│   ├── src/
│   │   ├── api/                   # Cliente HTTP
│   │   ├── components/            # Componentes reutilizáveis
│   │   ├── screens/               # Telas da app
│   │   ├── store/                 # Zustand stores
│   │   ├── types.ts               # Tipos TypeScript
│   │   └── navigation/            # Navegação
│   ├── App.tsx                    # Entry point
│   ├── app.json                   # Config Expo
│   ├── package.json
│   └── tsconfig.json
│
└── README.md                      # Este arquivo
```

---

## 🚀 Setup e Instalação

### Pré-requisitos

- **Node.js** 18+
- **PostgreSQL** 14+
- **Redis** 7+
- **Expo CLI** (para mobile)

### Backend Setup

```bash
cd match-backend

# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env

# Editar .env com suas configurações
# - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# - JWT_SECRET (gerar valor seguro)
# - STRIPE_SECRET_KEY e STRIPE_PUBLIC_KEY

# 3. Executar migrações
npm run migrate

# 4. (Opcional) Carregar dados de seed
npm run seed

# 5. Iniciar servidor (desenvolvimento)
npm run dev

# O servidor estará disponível em http://localhost:3000
```

### Frontend Setup

```bash
cd match-frontend

# 1. Instalar dependências
npm install

# 2. Iniciar Expo
npm start

# 3. Executar no emulador/dispositivo
# Android: Pressionar 'a'
# iOS: Pressionar 'i'

# Ou usar device físico escaneando o QR code
```

---

## 📊 Modelo de Dados

### Principais Entidades

#### User
```typescript
- id: UUID
- name: string
- email: string (unique)
- roles: 'ADMIN' | 'GESTOR_QUADRA' | 'PROFESSOR' | 'JOGADOR'
- status: 'active' | 'suspended'
- consent: { marketing, sms, push }
```

#### Court (Quadra)
```typescript
- id: UUID
- name: string
- geo: { lat, lon } (geospatial index)
- sports: Sport[]
- ownerUserId: UUID (foreign key)
- status: 'active' | 'inactive' | 'blocked'
```

#### IdleSlot (Horário Ocioso)
```typescript
- id: UUID
- courtId: UUID
- startTime, endTime: timestamp
- priceBRL: number (centavos)
- availableSpots: number (lock otimista)
- status: 'open' | 'full' | 'cancelled'
```

#### DayUseEvent
```typescript
- id: UUID
- courtId: UUID
- date: yyyy-mm-dd
- pricePerPlayerBRL: number
- jogosAulaEnabled: boolean
- maxParticipants, currentParticipants: number
```

#### Booking
```typescript
- id: UUID
- userId, itemId: UUID
- type: 'idle_slot' | 'day_use'
- status: 'pending' | 'paid' | 'cancelled' | 'no_show'
- checkInAt: timestamp (nullable)
```

#### Payment
```typescript
- id: UUID
- bookingId: UUID
- totalBRL: number
- status: 'pending' | 'captured' | 'failed' | 'refunded'
- providerRef: string (Stripe ID)
```

---

## 💳 Fluxo de Pagamentos

### Split de Receita

```
Total: R$ 100,00
├─ Plataforma: 15% = R$ 15,00
├─ Quadra: 65% = R$ 65,00
└─ Professor: 20% = R$ 20,00 (se houve aula)
```

Configurável via ENV:
- `PLATFORM_FEE_PCT`
- `COURT_SHARE_PCT`
- `PROFESSOR_SHARE_PCT`

### Cancelamento e Reembolso

| Tipo | Janela | Reembolso |
|------|--------|-----------|
| IdleSlot | 24h | 80% |
| DayUse | 48h | 70% |
| Jogos-Aula (falta prof) | anytime | 100% |
| Jogos-Aula (falta jogador) | anytime | 0% |

### Idempotência

Todas as operações de pagamento aceitam header `Idempotency-Key`:

```bash
curl -X POST /bookings/{id}/pay \
  -H "Idempotency-Key: unique-key-uuid" \
  -H "Authorization: Bearer token" \
  -d '{ ... }'
```

---

## 🔐 Autenticação e Autorização

### JWT

- **TTL:** Configurável via `JWT_TTL_MIN` (padrão 60 min)
- **Algoritmo:** HS256
- **Secret:** `JWT_SECRET` (env)

### Payload

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "roles": ["JOGADOR"],
  "iat": 1234567890,
  "exp": 1234569890
}
```

### Roles e Permissões

| Role | Permissões |
|------|-----------|
| ADMIN | Tudo: users, courts, bookings, settlements, relatórios |
| GESTOR_QUADRA | Gerenciar quadras/slots/day-use próprios |
| PROFESSOR | Aceitar convites de aulas, gerenciar agenda |
| JOGADOR | Reservar, se inscrever, participar de matchmaking |

---

## 🌍 Geolocalização

### Cálculo de Distância

Usa **Haversine formula** para calcular distância entre coordenadas:

```typescript
const distance = calculateDistance(lat1, lon1, lat2, lon2); // em km
```

### Raio Padrão

Configurável via `DEFAULT_RADIUS_KM` (padrão 20km).

---

## 📡 API REST

### Autenticação

```bash
# Registrar
POST /auth/register
{ "name": "João", "email": "joao@example.com", "password": "..." }

# Login
POST /auth/login
{ "email": "joao@example.com", "password": "..." }

# Obter perfil
GET /auth/me
Authorization: Bearer <token>

# Atualizar consentimentos
PATCH /auth/me/consents
{ "marketing": true, "sms": false, "push": true }
```

### Quadras

```bash
# Listar quadras (com filtros)
GET /courts?city=São Paulo&sport=padel&near=23.5505,-46.6333&radiusKm=20

# Obter detalhe
GET /courts/{id}

# Criar (GESTOR_QUADRA | ADMIN)
POST /courts
{ "name": "...", "address": {...}, "geo": {...}, ... }

# Atualizar (owner ou ADMIN)
PATCH /courts/{id}
```

### Reservas

```bash
# Criar booking
POST /bookings
{ "type": "idle_slot", "itemId": "...", "quantity": 1, "unitPriceBRL": 100 }

# Capturar pagamento
POST /bookings/{id}/pay
{ "method": "card", "provider": "stripe", "card": {...} }

# Cancelar
POST /bookings/{id}/cancel

# Check-in
POST /bookings/{id}/check-in
```

### Respostas

Todas as respostas seguem envelope:

```json
{
  "success": true,
  "data": { /* payload */ }
}
```

ou

```json
{
  "success": false,
  "error": {
    "code": "MATCH_CONFLICT",
    "message": "Vaga esgotada durante checkout",
    "details": { /* contexto */ }
  }
}
```

---

## 🔔 Notificações

### Canais

- **Push:** Preferência padrão (ON)
- **E-mail:** Opt-in
- **SMS:** Opt-in (ENV: `ENABLE_SMS`)

### Templates

```
DAYUSE_PURCHASE_CONFIRMED
JOGOSAULA_UPSELL_REMINDER
DAYUSE_CHECKIN_REMINDER_T24 / T3
SLOT_REMINDER_T10
PROFESSOR_INVITE
PAYMENT_FAILED
CANCELLATION_CONFIRMED
```

---

## 📊 Observabilidade

### Structured Logging

Todos os eventos são logados em JSON:

```json
{
  "event": "booking_paid",
  "userId": "uuid",
  "bookingId": "uuid",
  "totalBRL": 250.00,
  "timestamp": "2025-11-02T10:30:00Z"
}
```

### Métricas Importantes

- Taxa de ocupação de IdleSlots (%)
- Receita por origem (idle_slot, day_use, jogos_aula)
- Adesão a Jogos-Aula
- No-show rate
- Tempo médio de venda

### Exportações

```bash
# Bookings
GET /admin/reports/bookings.csv?from=2025-01-01&to=2025-12-31&type=day_use

# Revenue
GET /admin/reports/revenue.csv?from=2025-01-01&to=2025-12-31&origin=day_use

# Engagement
GET /admin/reports/engagement.csv?from=2025-01-01&to=2025-12-31
```

---

## ✅ Checklist de Implementação

### Sprint 1: Autenticação
- [x] Register/Login
- [x] JWT auth
- [x] RBAC middleware
- [x] Courts CRUD (gestor)

### Sprint 2: IdleSlots e Reservas
- [ ] IdleSlots CRUD
- [ ] Listagem com filtros
- [ ] Criar Booking
- [ ] Pagamento (Stripe)
- [ ] Cancelamento + Refund

### Sprint 3: Day Use
- [ ] Day Use CRUD
- [ ] Inscrição em eventos
- [ ] Pagamento
- [ ] Check-in

### Sprint 4: Jogos-Aula
- [ ] Slots de Jogos-Aula
- [ ] Upsell no checkout
- [ ] Convite de professor
- [ ] Alocação automática
- [ ] Repasses (settlements)

### Sprint 5: Matchmaking + Penalidades
- [ ] MatchRequest creation
- [ ] Notificação de proximidade
- [ ] PenaltyLog
- [ ] Impacto no matchmaking

### Sprint 6: Admin + Polimento
- [ ] Relatórios CSV
- [ ] Notificações
- [ ] Logs de auditoria
- [ ] Testes
- [ ] Deployment

---

## 🧪 Testes

### Backend

```bash
# Testes unitários
npm test

# Cobertura
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Frontend

```bash
# Testes com Jest
npm test

# Watch mode
npm test -- --watch
```

### Testes de Aceitação

Cenários críticos a testar:

1. **Reserva Concorrente:** Dois usuários tentam última vaga → um sucesso, outro erro
2. **Day Use + Upsell:** Compra evento + Jogos-Aula → check-in → alocação automática
3. **Reembolso por Falta do Professor:** Cancelar Slot → refund 100%
4. **No-Show:** Usuário não faz check-in → PenaltyLog criada
5. **Pagamento Idempotente:** Repetir pay com mesmo key → sem cobrança duplicada

---

## 🚦 Rate Limiting

```
Público: 60 req/min por IP
Autenticado: 600 req/min por usuário
```

Configurável via ENV:
- `RATE_LIMIT_WINDOW_MIN`
- `RATE_LIMIT_MAX_REQUESTS_PUBLIC`
- `RATE_LIMIT_MAX_REQUESTS_AUTH`

---

## 🔒 LGPD Compliance

- **Consentimentos:** Explícitos no onboarding
- **Dados Pessoais:** Download/exclusão via endpoint ADMIN
- **Logs de Auditoria:** Todas as ações críticas logadas
- **Soft Delete:** Registros não removidos fisicamente

---

## 📝 Variáveis de Ambiente

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=match_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=change-this-in-production
JWT_TTL_MIN=60

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...

# Feature Flags
ENABLE_JOGOS_AULA=true
ENABLE_MATCHMAKING=true
ENABLE_SMS=false

# Split (%)
PLATFORM_FEE_PCT=0.15
COURT_SHARE_PCT=0.65
PROFESSOR_SHARE_PCT=0.20

# Geographic
DEFAULT_RADIUS_KM=20
CITY_PILOT_NAME=São Paulo

# API
PORT=3000
API_URL=http://localhost:3000
```

---

## 🎯 Próximos Passos

1. **Seed de Dados:** Carregar quadras, professores, eventos de exemplo
2. **Testes Automatizados:** Jest para backend, React Testing Library para frontend
3. **CI/CD:** GitHub Actions para build, test, deploy
4. **Deployment:** Heroku/Railway (backend), EAS Build (frontend)
5. **Monitoramento:** Datadog/New Relic para observabilidade
6. **Performance:** Otimização de queries, cache Redis

---

## 📞 Suporte

Para dúvidas, abra uma **issue** no repositório ou entre em contato com o time de desenvolvimento.

---

**Versão:** 1.0.0  
**Última atualização:** Novembro 2025  
**Status:** Em desenvolvimento
