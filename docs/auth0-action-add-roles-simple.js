/**
 * Auth0 Action: Add roles to ID token (Post Login) – versão simples.
 *
 * Usa event.authorization.roles, que o Auth0 preenche quando o login pede
 * "audience" de uma API com RBAC. Não precisa de Secrets nem Management API.
 *
 * Configuração:
 * 1. Auth0: Applications → APIs → Create API (identifier ex: https://kumprafacil.com/api).
 * 2. Na API: Enable RBAC. Criar role "admin" e atribuir aos users.
 * 3. Na app Next.js: AUTH0_AUDIENCE=https://kumprafacil.com/api no .env.
 * 4. Colar este código na Action "Add role to token", Deploy, adicionar ao Flow Login.
 *
 * Ver docs/ROLES-AUTH0.md para detalhes.
 */

exports.onExecutePostLogin = async (event, api) => {
  const namespace = "https://kumprafacil.com";
  const claimName = `${namespace}/roles`;

  if (
    event.authorization &&
    Array.isArray(event.authorization.roles) &&
    event.authorization.roles.length > 0
  ) {
    api.idToken.setCustomClaim(claimName, event.authorization.roles);
  }
};
