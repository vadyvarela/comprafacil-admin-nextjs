import { NextResponse } from "next/server";
import { getValidSession } from "@/lib/auth0";
import { hasStoreAccess, isOwner } from "@/lib/auth/config";
import {
  canAccessPath,
  canReadModule,
  canWriteModule,
  hasMinimumRole,
  type AccessModule,
  type StoreRole,
} from "@/lib/auth/roles";

export type StoreSession = NonNullable<Awaited<ReturnType<typeof getValidSession>>>;

async function getSessionOrError(): Promise<
  | { session: StoreSession; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await getValidSession();

  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  if (!hasStoreAccess(session.user)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
    };
  }

  return { session, error: null };
}

export async function requireStoreSession(): Promise<
  | { session: StoreSession; error: null }
  | { session: null; error: NextResponse }
> {
  return getSessionOrError();
}

export async function requireOwnerSession(): Promise<
  | { session: StoreSession; error: null }
  | { session: null; error: NextResponse }
> {
  const result = await getSessionOrError();
  if (result.error) return result;

  if (!isOwner(result.session.user)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Owner access required" }, { status: 403 }),
    };
  }

  return result;
}

export async function requireMinimumRoleSession(
  minimum: StoreRole
): Promise<
  | { session: StoreSession; error: null }
  | { session: null; error: NextResponse }
> {
  const result = await getSessionOrError();
  if (result.error) return result;

  if (!hasMinimumRole(result.session.user, minimum)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
    };
  }

  return result;
}

export async function requireModuleReadSession(
  module: AccessModule
): Promise<
  | { session: StoreSession; error: null }
  | { session: null; error: NextResponse }
> {
  const result = await getSessionOrError();
  if (result.error) return result;

  if (!canReadModule(result.session.user, module)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
    };
  }

  return result;
}

export async function requireModuleWriteSession(
  module: AccessModule
): Promise<
  | { session: StoreSession; error: null }
  | { session: null; error: NextResponse }
> {
  const result = await getSessionOrError();
  if (result.error) return result;

  if (!canWriteModule(result.session.user, module)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
    };
  }

  return result;
}

export async function requirePathSession(
  pathname: string,
  mode: "read" | "write" = "read"
): Promise<
  | { session: StoreSession; error: null }
  | { session: null; error: NextResponse }
> {
  const result = await getSessionOrError();
  if (result.error) return result;

  if (!canAccessPath(result.session.user, pathname, mode)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
    };
  }

  return result;
}

export async function requireStoreSessionOrThrow(): Promise<StoreSession> {
  const session = await getValidSession();
  if (!session) throw new Error("Authentication required");
  if (!hasStoreAccess(session.user)) throw new Error("Insufficient permissions");
  return session;
}

export async function requireOwnerSessionOrThrow(): Promise<StoreSession> {
  const session = await requireStoreSessionOrThrow();
  if (!isOwner(session.user)) throw new Error("Owner access required");
  return session;
}

export async function requireModuleWriteOrThrow(module: AccessModule): Promise<StoreSession> {
  const session = await requireStoreSessionOrThrow();
  if (!canWriteModule(session.user, module)) throw new Error("Insufficient permissions");
  return session;
}
