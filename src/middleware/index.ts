import { defineMiddleware } from "astro:middleware";

import { supabaseClient, supabaseServiceClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  context.locals.supabaseAdmin = supabaseServiceClient ?? supabaseClient;
  return next();
});
