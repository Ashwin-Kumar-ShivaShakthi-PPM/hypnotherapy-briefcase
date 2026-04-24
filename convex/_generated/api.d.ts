/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as clients from "../clients.js";
import type * as emailStatus from "../emailStatus.js";
import type * as episodes from "../episodes.js";
import type * as http from "../http.js";
import type * as intake from "../intake.js";
import type * as intakeQueries from "../intakeQueries.js";
import type * as onboarding from "../onboarding.js";
import type * as portal from "../portal.js";
import type * as prep from "../prep.js";
import type * as recaps from "../recaps.js";
import type * as sessionInternal from "../sessionInternal.js";
import type * as sessions from "../sessions.js";
import type * as users from "../users.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  clients: typeof clients;
  emailStatus: typeof emailStatus;
  episodes: typeof episodes;
  http: typeof http;
  intake: typeof intake;
  intakeQueries: typeof intakeQueries;
  onboarding: typeof onboarding;
  portal: typeof portal;
  prep: typeof prep;
  recaps: typeof recaps;
  sessionInternal: typeof sessionInternal;
  sessions: typeof sessions;
  users: typeof users;
  waitlist: typeof waitlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
