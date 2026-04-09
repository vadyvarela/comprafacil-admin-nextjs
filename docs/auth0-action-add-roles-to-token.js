/**
 * Auth0 Action: Add roles to ID token (Post Login).
 *
 * As roles atribuídas em User Management → Users → Roles NÃO ficam em
 * app_metadata.roles. É preciso obtê-las via Management API.
 *
 * Configuração no Auth0:
 * 1. Applications → Create Application → Machine to Machine → "Auth0 Management API" →
 *    Authorize e marcar read:users e read:roles (ou read:users já pode chegar para GET user roles).
 * 2. Copiar Client ID e Client Secret dessa M2M app.
 * 3. Actions → Library → esta Action → Secrets:
 *    - AUTH0_M2M_DOMAIN = teu domínio (ex: tenant.auth0.com)
 *    - AUTH0_M2M_CLIENT_ID = Client ID da M2M app
 *    - AUTH0_M2M_CLIENT_SECRET = Client Secret da M2M app
 * 4. Deploy da Action e adicionar ao Flow Login.
 */

exports.onExecutePostLogin = async (event, api) => {
  const namespace = "https://Kumprafacil.com";
  const claimName = `${namespace}/roles`;

  // 1) Tentar app_metadata (caso alguém preencha manualmente)
  let roleNames = (event.user.app_metadata && event.user.app_metadata.roles) || [];
  if (!Array.isArray(roleNames)) roleNames = [];

  // 2) Se vazio, obter roles via Management API (roles atribuídas no Dashboard)
  if (roleNames.length === 0) {
    const domain = event.secrets["AUTH0_M2M_DOMAIN"] || event.request.hostname;
    const clientId = event.secrets["AUTH0_M2M_CLIENT_ID"];
    const clientSecret = event.secrets["AUTH0_M2M_CLIENT_SECRET"];

    if (domain && clientId && clientSecret) {
      try {
        const tokenRes = await fetch(`https://${domain}/oauth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
            audience: `https://${domain}/api/v2/`,
          }).toString(),
        });
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (accessToken) {
          const userId = event.user.user_id;
          const rolesRes = await fetch(
            `https://${domain}/api/v2/users/${encodeURIComponent(userId)}/roles`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          const rolesList = await rolesRes.json();
          if (Array.isArray(rolesList)) {
            roleNames = rolesList.map((r) => r.name).filter(Boolean);
          }
        }
      } catch (e) {
        console.error("Add roles to token: Management API error", e);
      }
    }
  }

  if (roleNames.length > 0) {
    api.idToken.setCustomClaim(claimName, roleNames);
  }
};
