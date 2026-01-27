import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import logger from "../../../lib/logger";

export const prerender = false;

type LoginResponseBody =
  | { error: string }
  | { success: true; user: { id?: string | null; email?: string | null } | null };

const sanitizeResponseBody = (body: LoginResponseBody) => {
  if ("success" in body) {
    return {
      success: true,
      user: body.user ? { id: body.user.id ?? null, email: body.user.email ?? null } : null,
    };
  }

  return body;
};

const respond = (status: number, body: LoginResponseBody, meta?: Record<string, unknown>) => {
  logger.info(
    {
      status,
      body: sanitizeResponseBody(body),
      ...meta,
    },
    "Login API response"
  );

  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return respond(400, { error: "Email i hasło są wymagane." }, { reason: "missing_credentials" });
    }

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    if (!supabase) {
      return respond(503, { error: "Usługa logowania jest niedostępna." }, { reason: "supabase_unavailable" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return respond(401, { error: error.message }, { reason: "invalid_credentials" });
    }

    if (!data.session) {
      return respond(500, { error: "Nie udało się utworzyć sesji." }, { reason: "missing_session" });
    }

    return respond(
      200,
      { success: true, user: { id: data.user?.id ?? null, email: data.user?.email ?? null } },
      { reason: "success" }
    );
  } catch (error) {
    return respond(500, { error: "Wystąpił nieoczekiwany błąd." }, { reason: "unexpected_error", error });
  }
};
