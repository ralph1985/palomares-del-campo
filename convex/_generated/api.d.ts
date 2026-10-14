/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as game from "../game.js";
import type * as geo from "../geo.js";
import type * as identity from "../identity.js";
import type * as leaderboard from "../leaderboard.js";
import type * as palomarenos from "../palomarenos.js";
import type * as palomarenos_notification_content from "../palomarenos_notification_content.js";
import type * as palomarenos_notifications from "../palomarenos_notifications.js";
import type * as palomarenos_validation from "../palomarenos_validation.js";
import type * as presence from "../presence.js";
import type * as score from "../score.js";
import type * as turnstile from "../turnstile.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  game: typeof game;
  geo: typeof geo;
  identity: typeof identity;
  leaderboard: typeof leaderboard;
  palomarenos: typeof palomarenos;
  palomarenos_notification_content: typeof palomarenos_notification_content;
  palomarenos_notifications: typeof palomarenos_notifications;
  palomarenos_validation: typeof palomarenos_validation;
  presence: typeof presence;
  score: typeof score;
  turnstile: typeof turnstile;
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
