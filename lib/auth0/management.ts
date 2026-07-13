import {
  isStoreRole,
  isPrivilegedRole,
  ROLE_RANK,
  STORE_ROLES,
  type StoreRole,
} from "@/lib/auth/roles";

type Auth0User = {
  user_id: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
  last_login?: string;
  created_at?: string;
};

type Auth0Role = {
  id: string;
  name: string;
};

export type TeamMember = {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: StoreRole | null;
  status: "active" | "pending";
  emailVerified: boolean;
  lastLogin: string | null;
  createdAt: string | null;
};

const STORE_ROLE_SET = new Set<string>(STORE_ROLES);

let cachedToken: { token: string; expiresAt: number } | null = null;
let cachedRoleIds: Map<string, string> | null = null;

function getM2MConfig() {
  const domain = process.env.AUTH0_M2M_DOMAIN ?? process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_M2M_CLIENT_ID;
  const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET;

  if (!domain || !clientId || !clientSecret) {
    throw new Error(
      "Auth0 Management API não configurada. Defina AUTH0_M2M_DOMAIN, AUTH0_M2M_CLIENT_ID e AUTH0_M2M_CLIENT_SECRET."
    );
  }

  return { domain, clientId, clientSecret };
}

async function getManagementToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }

  const { domain, clientId, clientSecret } = getM2MConfig();

  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
      grant_type: "client_credentials",
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao obter token M2M: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return data.access_token;
}

async function managementFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const { domain } = getM2MConfig();
  const token = await getManagementToken();

  const res = await fetch(`https://${domain}/api/v2${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    signal: init?.signal ?? AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text.slice(0, 300);
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      // keep raw text
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function getRoleIdMap(): Promise<Map<string, string>> {
  if (cachedRoleIds) return cachedRoleIds;

  const roles = await managementFetch<Auth0Role[]>("/roles?per_page=100");
  const map = new Map<string, string>();

  for (const role of roles) {
    if (STORE_ROLE_SET.has(role.name)) {
      map.set(role.name, role.id);
    }
  }

  cachedRoleIds = map;
  return map;
}

function pickStoreRole(roleNames: string[]): StoreRole | null {
  const normalized = roleNames
    .filter((r): r is StoreRole => isStoreRole(r));

  if (normalized.length === 0) return null;

  return normalized.reduce((best, role) =>
    ROLE_RANK[role] > ROLE_RANK[best] ? role : best
  );
}

function toTeamMember(user: Auth0User, roleNames: string[]): TeamMember {
  const role = pickStoreRole(roleNames);
  const email = user.email ?? "";
  const emailVerified = user.email_verified === true;

  return {
    id: user.user_id,
    email,
    name: user.name ?? null,
    picture: user.picture ?? null,
    role,
    status: emailVerified ? "active" : "pending",
    emailVerified,
    lastLogin: user.last_login ?? null,
    createdAt: user.created_at ?? null,
  };
}

async function getUserRoles(userId: string): Promise<string[]> {
  const roles = await managementFetch<Auth0Role[]>(
    `/users/${encodeURIComponent(userId)}/roles`
  );
  return roles.map((r) => r.name);
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const users = await managementFetch<Auth0User[]>(
    '/users?per_page=100&fields=user_id,email,name,picture,email_verified,last_login,created_at&include_fields=true'
  );

  const members: TeamMember[] = [];

  for (const user of users) {
    const roleNames = await getUserRoles(user.user_id);
    const storeRoles = roleNames.filter((r) => STORE_ROLE_SET.has(r));
    if (storeRoles.length === 0) continue;
    members.push(toTeamMember(user, storeRoles));
  }

  return members.sort((a, b) => a.email.localeCompare(b.email));
}

export async function inviteTeamMember(
  email: string,
  role: StoreRole
): Promise<TeamMember> {
  if (!isStoreRole(role)) {
    throw new Error("Role inválida");
  }

  const connection =
    process.env.AUTH0_DB_CONNECTION ?? "Username-Password-Authentication";
  const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  const existing = await managementFetch<Auth0User[]>(
    `/users-by-email?email=${encodeURIComponent(email)}`
  );

  let user: Auth0User;

  if (existing.length > 0) {
    user = existing[0];
  } else {
    user = await managementFetch<Auth0User>("/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        connection,
        email_verified: false,
        password: generateTempPassword(),
      }),
    });
  }

  const roleIds = await getRoleIdMap();
  const roleId = roleIds.get(role);
  if (!roleId) {
    throw new Error(`Role "${role}" não encontrada no Auth0. Crie as roles no dashboard.`);
  }

  const currentRoles = await getUserRoles(user.user_id);
  const storeRoleIds = currentRoles
    .filter((r) => STORE_ROLE_SET.has(r))
    .map((r) => roleIds.get(r) ?? null);

  const idsToRemove = storeRoleIds.filter((id): id is string => id !== null);
  if (idsToRemove.length > 0) {
    await managementFetch(`/users/${encodeURIComponent(user.user_id)}/roles`, {
      method: "DELETE",
      body: JSON.stringify({ roles: idsToRemove }),
    });
  }

  await managementFetch(`/users/${encodeURIComponent(user.user_id)}/roles`, {
    method: "POST",
    body: JSON.stringify({ roles: [roleId] }),
  });

  await managementFetch("/tickets/password-change", {
    method: "POST",
    body: JSON.stringify({
      user_id: user.user_id,
      result_url: `${appBaseUrl}/dashboard`,
      mark_email_as_verified: true,
      includeEmailInRedirect: false,
    }),
  });

  const roleNames = await getUserRoles(user.user_id);
  return toTeamMember(user, roleNames);
}

export async function updateMemberRole(
  userId: string,
  role: StoreRole
): Promise<TeamMember> {
  if (!isStoreRole(role)) {
    throw new Error("Role inválida");
  }

  const roleIds = await getRoleIdMap();
  const roleId = roleIds.get(role);
  if (!roleId) {
    throw new Error(`Role "${role}" não encontrada no Auth0.`);
  }

  const currentRoles = await getUserRoles(userId);
  const idsToRemove = (
    currentRoles
      .filter((r) => STORE_ROLE_SET.has(r))
      .map((r) => roleIds.get(r) ?? null)
  ).filter((id): id is string => id !== null);

  if (idsToRemove.length > 0) {
    await managementFetch(`/users/${encodeURIComponent(userId)}/roles`, {
      method: "DELETE",
      body: JSON.stringify({ roles: idsToRemove }),
    });
  }

  await managementFetch(`/users/${encodeURIComponent(userId)}/roles`, {
    method: "POST",
    body: JSON.stringify({ roles: [roleId] }),
  });

  const user = await managementFetch<Auth0User>(
    `/users/${encodeURIComponent(userId)}?fields=user_id,email,name,picture,email_verified,last_login,created_at`
  );
  const roleNames = await getUserRoles(userId);
  return toTeamMember(user, roleNames);
}

export async function removeTeamMember(userId: string): Promise<void> {
  const roleIds = await getRoleIdMap();
  const currentRoles = await getUserRoles(userId);

  const idsToRemove = (
    currentRoles
      .filter((r) => STORE_ROLE_SET.has(r))
      .map((r) => roleIds.get(r) ?? null)
  ).filter((id): id is string => id !== null);

  if (idsToRemove.length > 0) {
    await managementFetch(`/users/${encodeURIComponent(userId)}/roles`, {
      method: "DELETE",
      body: JSON.stringify({ roles: idsToRemove }),
    });
  }
}

export async function countOwners(excludeUserId?: string): Promise<number> {
  const members = await listTeamMembers();
  return members.filter(
    (m) => m.role !== null && isPrivilegedRole(m.role) && m.id !== excludeUserId
  ).length;
}

function generateTempPassword(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 24; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}
