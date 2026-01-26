/**
 * Application middleware pipeline
 *
 * Middleware composition pattern for better separation of concerns:
 * 1. setupSupabase - Initialize Supabase clients
 * 2. setupAuth - Authenticate user and populate session
 * 3. handleRedirects - Handle authentication-based redirects
 *
 * Each middleware is responsible for a single concern and can be
 * tested, modified, or reordered independently.
 */

import { sequence } from "astro:middleware";
import { setupSupabase } from "../lib/middleware/supabase.middleware";
import { setupAuth } from "../lib/middleware/auth.middleware";
import { handleRedirects } from "../lib/middleware/redirect.middleware";

/**
 * Middleware execution pipeline
 * Executes in order: Supabase setup → Auth → Redirects
 */
export const onRequest = sequence(setupSupabase, setupAuth, handleRedirects);
