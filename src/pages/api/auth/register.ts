import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import logger from "../../../lib/logger";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    logger.debug("[Register API] Incoming registration request");

    const body = await request.json();
    const { email, password } = body;

    logger.debug("[Register API] Request data", { email, passwordLength: password?.length });

    // Validation
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email i hasło są wymagane." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return new Response(JSON.stringify({ error: "Nieprawidłowy format danych." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (password.length < 4) {
      return new Response(JSON.stringify({ error: "Hasło powinno mieć co najmniej 4 znaków." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create server-side Supabase instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    if (!supabase) {
      logger.error("[Register API] Failed to create Supabase instance");
      return new Response(JSON.stringify({ error: "Usługa rejestracji jest niedostępna." }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    logger.debug("[Register API] Calling Supabase signUp...");

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      logger.error(
        {
          err: error,
          status: error.status,
          name: error.name,
        },
        "[Register API] Supabase error"
      );

      // Map Supabase errors to user-friendly messages
      let errorMessage = "Wystąpił błąd. Spróbuj ponownie.";
      const lowerMessage = error.message.toLowerCase();

      if (lowerMessage.includes("already registered") || lowerMessage.includes("user already exists")) {
        errorMessage = "Konto z tym adresem już istnieje.";
      } else if (lowerMessage.includes("rate limit") || lowerMessage.includes("too many")) {
        errorMessage = "Zbyt wiele prób. Spróbuj ponownie za chwilę.";
      } else if (lowerMessage.includes("invalid") || lowerMessage.includes("email")) {
        errorMessage = "Nieprawidłowy adres email.";
      } else if (lowerMessage.includes("password")) {
        errorMessage = "Hasło nie spełnia wymagań.";
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          ...(import.meta.env.DEV && { debug: error.message }),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    logger.info({ email: data.user?.email }, "[Register API] User registered successfully");

    // Success - user needs to confirm email
    return new Response(
      JSON.stringify({
        success: true,
        user: data.user,
        message: "Konto utworzone! Sprawdź swoją skrzynkę email i kliknij w link aktywacyjny.",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logger.error({ err: error }, "[Register API] Unexpected error");

    return new Response(
      JSON.stringify({
        error: "Wystąpił nieoczekiwany błąd.",
        ...(import.meta.env.DEV && { debug: String(error) }),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
