import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";

import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { createSupabaseClient, isSupabaseConfigured, supabaseClient } from "../../db/supabase.client";

interface LoginFormProps {
  redirectTo?: string | null;
  supabaseUrl?: string | null;
  supabaseKey?: string | null;
}

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
}

const MIN_PASSWORD_LENGTH = 4;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getSafeRedirectPath = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith("/")) {
    return null;
  }

  if (trimmed.startsWith("//") || trimmed.includes("://")) {
    return null;
  }

  return trimmed;
};

const mapAuthErrorMessage = (message?: string | null) => {
  if (!message) {
    return "Nieprawidłowy email lub hasło.";
  }

  const lowered = message.toLowerCase();

  if (lowered.includes("email not confirmed")) {
    return "Sprawdź skrzynkę i potwierdź adres email.";
  }

  if (lowered.includes("rate limit") || lowered.includes("too many")) {
    return "Zbyt wiele prób. Spróbuj ponownie za chwilę.";
  }

  return "Nieprawidłowy email lub hasło.";
};

const validate = (values: LoginFormValues): LoginFormErrors => {
  const errors: LoginFormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Podaj adres email.";
  }

  if (!errors.email && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Podaj poprawny adres email.";
  }

  if (!values.password) {
    errors.password = "Podaj hasło.";
  }

  if (!errors.password && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Hasło powinno mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`;
  }

  return errors;
};

export default function LoginForm({ redirectTo, supabaseUrl, supabaseKey }: LoginFormProps) {
  const formId = useId();
  const emailErrorId = `${formId}-email-error`;
  const passwordErrorId = `${formId}-password-error`;
  const formErrorId = `${formId}-form-error`;

  const [values, setValues] = useState<LoginFormValues>({
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSupabaseReady, setIsSupabaseReady] = useState(true);
  const isBusy = isSubmitting || isCheckingSession;

  const runtimeSupabaseClient = useMemo(() => {
    if (supabaseClient) {
      return supabaseClient;
    }

    return createSupabaseClient(supabaseUrl ?? undefined, supabaseKey ?? undefined);
  }, [supabaseKey, supabaseUrl]);

  const validationErrors = useMemo(() => validate(values), [values]);
  const canSubmit = !validationErrors.email && !validationErrors.password;

  const showEmailError = touched.email || hasSubmitted ? validationErrors.email : undefined;
  const showPasswordError = touched.password || hasSubmitted ? validationErrors.password : undefined;

  const setEmail = useCallback((value: string) => {
    setValues((prev) => ({ ...prev, email: value }));
  }, []);

  const setPassword = useCallback((value: string) => {
    setValues((prev) => ({ ...prev, password: value }));
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      if ((!isSupabaseConfigured && !runtimeSupabaseClient) || !runtimeSupabaseClient) {
        setIsSupabaseReady(false);
        setFormError("Usługa logowania jest chwilowo niedostępna.");
        setIsCheckingSession(false);
        return;
      }

      try {
        const { data, error } = await runtimeSupabaseClient.auth.getSession();

        if (error) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.error("Błąd sprawdzania sesji:", error);
          }
          setIsCheckingSession(false);
          return;
        }

        if (data.session) {
          const safeRedirect = getSafeRedirectPath(redirectTo);
          window.location.href = safeRedirect ?? "/dashboard";
          return;
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("Nieoczekiwany błąd sprawdzania sesji:", error);
        }
      } finally {
        setIsCheckingSession(false);
      }
    };

    void checkSession();
  }, [redirectTo, runtimeSupabaseClient]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setHasSubmitted(true);
      setFormError(null);

      if (isBusy || !isSupabaseReady) {
        return;
      }

      const errors = validate(values);

      if (errors.email || errors.password) {
        return;
      }

      if ((!isSupabaseConfigured && !runtimeSupabaseClient) || !runtimeSupabaseClient) {
        setFormError("Usługa logowania jest chwilowo niedostępna.");
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("Supabase is not configured.");
        }
        return;
      }

      try {
        setIsSubmitting(true);

        const { data, error } = await runtimeSupabaseClient.auth.signInWithPassword({
          email: values.email.trim(),
          password: values.password,
        });

        if (error) {
          setFormError(mapAuthErrorMessage(error.message));

          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.error("Błąd logowania:", error);
          }

          return;
        }

        if (!data.session) {
          setFormError("Nie udało się zalogować. Spróbuj ponownie.");
          return;
        }

        const safeRedirect = getSafeRedirectPath(redirectTo);
        window.location.href = safeRedirect ?? "/dashboard";
      } catch (error) {
        setFormError("Problem z połączeniem. Sprawdź internet i spróbuj ponownie.");

        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("Nieoczekiwany błąd logowania:", error);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [isBusy, isSupabaseReady, redirectTo, values]
  );

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isBusy}
      aria-describedby={formError ? formErrorId : undefined}
    >
      {isCheckingSession ? (
        <div
          className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
          aria-live="polite"
        >
          <Spinner size="sm" />
          <span>Sprawdzanie sesji...</span>
        </div>
      ) : null}

      {formError ? (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
          aria-live="assertive"
          id={formErrorId}
        >
          {formError}
        </div>
      ) : null}
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={`${formId}-email`}>
          Email
        </label>
        <input
          id={`${formId}-email`}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          value={values.email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
          aria-invalid={Boolean(showEmailError)}
          aria-describedby={showEmailError ? emailErrorId : undefined}
          disabled={isBusy || !isSupabaseReady}
        />
        {showEmailError ? (
          <p className="text-sm text-destructive" id={emailErrorId} role="alert">
            {showEmailError}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={`${formId}-password`}>
          Hasło
        </label>
        <input
          id={`${formId}-password`}
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          value={values.password}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
          aria-invalid={Boolean(showPasswordError)}
          aria-describedby={showPasswordError ? passwordErrorId : undefined}
          disabled={isBusy || !isSupabaseReady}
        />
        {showPasswordError ? (
          <p className="text-sm text-destructive" id={passwordErrorId} role="alert">
            {showPasswordError}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={!canSubmit || isBusy || !isSupabaseReady}>
        {isSubmitting ? "Logowanie..." : "Zaloguj się"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Nie masz konta?{" "}
        <a className="font-medium text-primary hover:underline" href="/register">
          Zarejestruj się
        </a>
      </p>
    </form>
  );
}
