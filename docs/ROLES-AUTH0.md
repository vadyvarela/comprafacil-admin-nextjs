# Roles no Auth0 – como implementar

O backoffice só permite acesso a utilizadores com a role **admin**. Há duas formas de fazer as roles chegarem ao token/sessão.

---

## Opção 1: API + audience (recomendada, sem Secrets)

O Auth0 preenche `event.authorization.roles` no Post-Login quando o login pede **audience** de uma **API com RBAC**. Não é preciso Management API nem Secrets na Action.

### No Auth0 Dashboard

1. **Applications → APIs → Create API**
   - Name: `KumpraFácil API` (ou outro)
   - Identifier: `https://Kumprafacil.com/api` (tem de ser um URL; usa este em todo o lado)
   - Create

2. **Na API que criaste → Settings**
   - **RBAC Settings**: ativa **Enable RBAC**
   - (Opcional) Ativa **Add Permissions in the Access Token** se precisares de permissions no access token
   - Save

3. **User Management → Roles**
   - Cria a role **admin** (já deves ter)

4. **User Management → Users → [teu user] → Roles**
   - Assign Roles → seleciona **admin**

5. **Autorizar a aplicação a aceder à API** (obrigatório)
   - **Applications → APIs** → clica na API `https://Kumprafacil.com/api`
   - Aba **Application Access** (ou **Settings** → Application Access)
   - Se **User Access** estiver em "Allow via client-grant":
     - Clica **Edit** ao lado de **User Access**
     - Encontra a tua aplicação Next.js (nome da app) na lista e ativa o toggle / marca **Authorized** (ou "All" para todas as permissões)
     - **Save**
   - **OU** se quiseres que qualquer app do tenant possa pedir esta API (mais simples para desenvolvimento): muda **User Access** para **Allow** e Save

   Se não autorizares, ao fazer login vês:  
   `Client "..." is not authorized to access resource server "https://Kumprafacil.com/api"`.

### Na aplicação Next.js

No `.env.local`:

```env
AUTH0_AUDIENCE=https://Kumprafacil.com/api
```

O `lib/auth0.ts` já está configurado para usar `authorizationParameters.audience` quando `AUTH0_AUDIENCE` existe.

### Action no Auth0 (simples, sem Secrets)

**Actions → Library → "Add role to token"** (Post Login). Código:

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

### Resumo Opção 1

- Criar **API** com identifier `https://Kumprafacil.com/api`, ativar **RBAC**
- Role **admin** criada e atribuída ao user
- App com `AUTH0_AUDIENCE=https://Kumprafacil.com/api`
- Action só usa `event.authorization.roles`
- Sem M2M, sem Secrets

---

## Opção 2: Management API (quando event.authorization não vem preenchido)

Se o teu tenant não preencher `event.authorization` no login (por exemplo sem audience ou por configuração), podes obter as roles via **Management API** dentro da Action.

### No Auth0

1. **Applications → Create Application → Machine to Machine**
   - Escolhe **Auth0 Management API** → Authorize
   - Permissions: **read:users** (para obter roles do user)
   - Cria e guarda **Client ID** e **Client Secret**

2. **Actions → "Add role to token" → Secrets**
   - `AUTH0_M2M_DOMAIN` = teu domínio (ex: `dev-xxxx.us.auth0.com`)
   - `AUTH0_M2M_CLIENT_ID` = Client ID da M2M
   - `AUTH0_M2M_CLIENT_SECRET` = Client Secret da M2M

3. Usar o código da Action que chama `GET /api/v2/users/{userId}/roles` (ficheiro `docs/auth0-action-add-roles-to-token.js` no projeto).

---

## O que a app espera

- **Claim no ID token:** `https://Kumprafacil.com/roles` (array de strings, ex.: `["admin"]`).
- **Variáveis de ambiente opcionais:** `AUTH0_ADMIN_ROLE` (default `admin`), `AUTH0_ROLE_CLAIM` (default `https://Kumprafacil.com/roles`).

O SDK Next.js filtra custom claims por defeito; o `beforeSessionSaved` em `lib/auth0.ts` garante que este claim fica em `session.user` para o `hasAdminRole()` funcionar.
