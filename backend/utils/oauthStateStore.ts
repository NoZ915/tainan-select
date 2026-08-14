import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import type OAuth2Strategy from "passport-oauth2";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const MAX_OAUTH_ATTEMPTS = 10_000;
const OWNER_PATTERN = /^[A-Za-z0-9-]{20,128}$/;
const isProd = process.env.NODE_ENV === "production";

type StoreCallback = OAuth2Strategy.StateStoreStoreCallback;
type VerifyCallback = OAuth2Strategy.StateStoreVerifyCallback;
type StateMetadata = OAuth2Strategy.Metadata;
type OAuthAttemptStatus = "pending" | "processing" | "completed";

type OAuthAttempt = {
  stateHash: string;
  ownerHash: string;
  status: OAuthAttemptStatus;
  expiresAt: number;
};

export type OAuthAttemptResult = {
  status: "completed" | "cancelled" | "expired" | "not_found";
  stateHash?: string;
};

const attemptsByStateHash = new Map<string, OAuthAttempt>();
const stateHashByOwnerHash = new Map<string, string>();

const hashValue = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const statesMatch = (first: string, second: string): boolean => {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return firstBuffer.length === secondBuffer.length
    && timingSafeEqual(firstBuffer, secondBuffer);
};

const deleteAttempt = (attempt: OAuthAttempt): void => {
  attemptsByStateHash.delete(attempt.stateHash);
  if (stateHashByOwnerHash.get(attempt.ownerHash) === attempt.stateHash) {
    stateHashByOwnerHash.delete(attempt.ownerHash);
  }
};

const cleanupExpiredAttempts = (now = Date.now()): void => {
  for (const attempt of attemptsByStateHash.values()) {
    if (attempt.expiresAt <= now) deleteAttempt(attempt);
  }
};

const createOAuthAttempt = (req: Request): { state: string; stateHash: string } => {
  cleanupExpiredAttempts();
  if (attemptsByStateHash.size >= MAX_OAUTH_ATTEMPTS) {
    throw new Error("OAUTH_STATE_CAPACITY_REACHED");
  }

  const owner = getOAuthOwner(req);
  if (!owner) throw new Error("INVALID_OAUTH_OWNER");

  const ownerHash = hashValue(owner);
  if (stateHashByOwnerHash.has(ownerHash)) {
    throw new Error("OAUTH_ATTEMPT_ALREADY_EXISTS");
  }

  const state = randomBytes(32).toString("base64url");
  const stateHash = hashValue(state);
  const attempt: OAuthAttempt = {
    stateHash,
    ownerHash,
    status: "pending",
    expiresAt: Date.now() + OAUTH_STATE_TTL_MS,
  };
  attemptsByStateHash.set(stateHash, attempt);
  stateHashByOwnerHash.set(ownerHash, stateHash);
  return { state, stateHash };
};

const claimOAuthAttempt = (state: string): boolean => {
  const stateHash = hashValue(state);
  const attempt = attemptsByStateHash.get(stateHash);
  if (!attempt) return false;
  if (attempt.expiresAt <= Date.now()) {
    deleteAttempt(attempt);
    return false;
  }
  if (attempt.status !== "pending") return false;

  attempt.status = "processing";
  return true;
};

export const getOAuthOwner = (req: Request): string | null => {
  const owner = typeof req.query.owner === "string" ? req.query.owner : "";
  return OWNER_PATTERN.test(owner) ? owner : null;
};

export const completeOAuthAttempt = (state: string): boolean => {
  if (!state) return false;
  const attempt = attemptsByStateHash.get(hashValue(state));
  if (!attempt) return false;
  if (attempt.expiresAt <= Date.now()) {
    deleteAttempt(attempt);
    return false;
  }
  if (attempt.status !== "processing") return false;

  attempt.status = "completed";
  attempt.expiresAt = Date.now() + OAUTH_STATE_TTL_MS;
  return true;
};

export const failClaimedOAuthAttempt = (state: string): string | null => {
  if (!state) return null;
  const stateHash = hashValue(state);
  const attempt = attemptsByStateHash.get(stateHash);
  if (!attempt || attempt.status !== "processing") return null;
  deleteAttempt(attempt);
  return attempt.stateHash;
};

export const cancelOAuthAttempt = (owner: string): OAuthAttemptResult => {
  if (!OWNER_PATTERN.test(owner)) return { status: "not_found" };

  const ownerHash = hashValue(owner);
  const stateHash = stateHashByOwnerHash.get(ownerHash);
  if (!stateHash) return { status: "not_found" };

  const attempt = attemptsByStateHash.get(stateHash);
  if (!attempt) {
    stateHashByOwnerHash.delete(ownerHash);
    return { status: "not_found" };
  }
  if (attempt.expiresAt <= Date.now()) {
    deleteAttempt(attempt);
    return { status: "expired", stateHash };
  }
  if (attempt.status === "completed") {
    return { status: "completed", stateHash };
  }

  deleteAttempt(attempt);
  return { status: "cancelled", stateHash };
};

export const getOAuthStateCookieName = (stateHash: string): string =>
  `oauth_state_${stateHash.slice(0, 16)}`;

export const getOAuthStateCookieOptions = () => ({
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/api/auth/google/callback",
});

export class OAuthStateStore {
  store(req: Request, callback: StoreCallback): void;
  store(req: Request, metadata: StateMetadata, callback: StoreCallback): void;
  store(
    req: Request,
    metadataOrCallback: StateMetadata | StoreCallback,
    providedCallback?: StoreCallback,
  ): void {
    const callback = typeof metadataOrCallback === "function"
      ? metadataOrCallback
      : providedCallback;
    if (!callback) return;

    try {
      const { state, stateHash } = createOAuthAttempt(req);
      req.res?.cookie(getOAuthStateCookieName(stateHash), state, {
        ...getOAuthStateCookieOptions(),
        maxAge: OAUTH_STATE_TTL_MS,
      });
      callback(null, state);
    } catch (error) {
      callback(
        error instanceof Error ? error : new Error("OAUTH_STATE_CREATE_FAILED"),
        undefined,
      );
    }
  }

  verify(req: Request, state: string, callback: VerifyCallback): void;
  verify(
    req: Request,
    state: string,
    metadata: StateMetadata,
    callback: VerifyCallback,
  ): void;
  verify(
    req: Request,
    state: string,
    metadataOrCallback: StateMetadata | VerifyCallback,
    providedCallback?: VerifyCallback,
  ): void {
    const callback = typeof metadataOrCallback === "function"
      ? metadataOrCallback
      : providedCallback;
    if (!callback) return;

    const stateHash = typeof state === "string" ? hashValue(state) : "";
    const cookieName = getOAuthStateCookieName(stateHash);
    const cookieState = req.cookies?.[cookieName];
    if (
      typeof state !== "string"
      || typeof cookieState !== "string"
      || !statesMatch(state, cookieState)
    ) {
      callback(null as unknown as Error, false, { message: "invalid_oauth_state" });
      return;
    }

    req.res?.clearCookie(cookieName, getOAuthStateCookieOptions());
    const claimed = claimOAuthAttempt(state);
    if (claimed) {
      (req as Request & { oauthStateClaimed?: boolean }).oauthStateClaimed = true;
    }
    callback(
      null as unknown as Error,
      claimed,
      claimed ? undefined : { message: "invalid_oauth_state" },
    );
  }
}
