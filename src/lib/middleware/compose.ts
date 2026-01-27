import type { MiddlewareHandler } from "astro";

/**
 * Compose multiple middleware handlers into a single handler
 * Executes middleware in order, passing control to the next one
 *
 * @example
 * ```ts
 * export const onRequest = compose(
 *   setupSupabase,
 *   setupAuth,
 *   handleRedirects
 * );
 * ```
 */
export function compose(...handlers: MiddlewareHandler[]): MiddlewareHandler {
  return async (context, next) => {
    let index = 0;

    const dispatch = async (): Promise<Response> => {
      if (index >= handlers.length) {
        return next();
      }

      const handler = handlers[index++];
      return (await handler(context, dispatch)) as Response;
    };

    return dispatch();
  };
}
