# Roles no Auth0 – equipa e regras de acesso

O backoffice usa **Auth0** para autenticação humana e **roles predefinidas** para controlar o que cada membro da equipa pode fazer.

---

## Roles da equipa

| Role | Nome na UI | Acesso |
|------|------------|--------|
| `owner` | Proprietário | Tudo, incluindo equipa e tokens de API |
| `admin` | Administrador | Tudo, incluindo equipa e tokens de API |
| `manager` | Gestor | Catálogo, vendas, marketing, analytics e definições |
| `operator` | Operador | Pedidos (ver/atualizar), clientes (leitura), dashboard |
| `viewer` | Visualizador | Dashboard, produtos e pedidos (só leitura) |

`owner` e `admin` têm o mesmo nível de acesso. Utilizadores existentes com role `admin` continuam a funcionar sem alterações.

---

## Configuração no Auth0 Dashboard

### 1. API com RBAC (login)

1. **Applications → APIs → Create API**
   - Identifier: `https://Kumprafacil.com/api`
2. Na API → **Settings** → ativar **Enable RBAC**
3. **User Management → Roles** → criar: `owner`, `admin`, `manager`, `operator`, `viewer`
4. Autorizar a aplicação Next.js em **Application Access**

### 2. Machine-to-Machine (convites e gestão de equipa)

1. **Applications → Create Application → Machine to Machine**
2. Authorize **Auth0 Management API** com permissões:
   - `read:users`, `create:users`, `update:users`, `delete:users`
   - `read:roles`, `create:role_members`, `delete:role_members`
   - `create:user_tickets`
3. Guardar **Client ID** e **Client Secret**

### 3. Post-Login Action

**Actions → Library → Post Login**. Código:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = "https://Kumprafacil.com";
  const claimName = `${namespace}/roles`;

  if (event.authorization && Array.isArray(event.authorization.roles) && event.authorization.roles.length > 0) {
    api.idToken.setCustomClaim(claimName, event.authorization.roles);
  }
};
```

Deploy e adicionar ao **Login** flow.

---

## Variáveis de ambiente

No `.env.local` do backoffice:

```env
# Auth0 (login)
AUTH0_SECRET=
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
APP_BASE_URL=
AUTH0_AUDIENCE=https://Kumprafacil.com/api
AUTH0_ROLE_CLAIM=https://Kumprafacil.com/roles

# Auth0 Management API (convites / equipa)
AUTH0_M2M_DOMAIN=
AUTH0_M2M_CLIENT_ID=
AUTH0_M2M_CLIENT_SECRET=
AUTH0_DB_CONNECTION=Username-Password-Authentication
```

---

## Fluxo de convite

1. Owner acede a **Definições → Equipa** e convida por email com uma função
2. O backoffice cria o utilizador no Auth0 (ou reutiliza existente)
3. Atribui a role escolhida
4. Envia email via `POST /api/v2/tickets/password-change` para definir password
5. No primeiro login, a Post-Login Action injeta as roles no ID token
6. O backoffice valida acesso com `hasStoreAccess()` e regras por módulo

---

## Matriz de acesso (resumo)

| Módulo | Visualizador | Operador | Gestor | Proprietário/Admin |
|--------|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Analytics | | | ✓ | ✓ |
| Pedidos (leitura) | ✓ | ✓ | ✓ | ✓ |
| Pedidos (editar) | | ✓ | ✓ | ✓ |
| Clientes (leitura) | ✓ | ✓ | ✓ | ✓ |
| Clientes (editar) | | | ✓ | ✓ |
| Transações | | | ✓ | ✓ |
| Catálogo / Marketing | | | ✓ | ✓ |
| Definições | | | ✓ | ✓ |
| Equipa / Tokens API | | | | ✓ |

---

## O que a app espera

- **Claim no ID token:** `https://Kumprafacil.com/roles` (array de strings)
- **Acesso ao dashboard:** qualquer role de loja ou `admin` legado
- **Gestão de equipa:** `owner` ou `admin`
- O `beforeSessionSaved` em `lib/auth0.ts` garante que o claim fica em `session.user`

Código relevante:

- `lib/auth/roles.ts` — hierarquia e matriz de módulos
- `lib/auth/requireRole.ts` — guards para API routes e server actions
- `lib/auth0/management.ts` — cliente Management API
- `app/dashboard/settings/team/` — UI de equipa

---

## Opção alternativa: Management API na Action

Se `event.authorization.roles` não vier preenchido no login, ver `docs/auth0-action-add-roles-to-token.js` para obter roles via Management API na Post-Login Action.
