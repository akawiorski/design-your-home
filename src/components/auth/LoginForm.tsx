import { useCallback, useId, useMemo, useState, type FormEvent } from "react";

import { Button } from "../ui/button";
import { loginSchema } from "../../lib/validation/auth.schemas";
import logger from "../../lib/logger";

interface LoginFormProps {
  redirectTo?: string | null;
}

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
}

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
  const result = loginSchema.safeParse(values);

  if (result.success) {
    return {};
  }

  const errors: LoginFormErrors = {};
  result.error.errors.forEach((err) => {
    const field = err.path[0] as keyof LoginFormErrors;
    if (field) {
      errors[field] = err.message;
    }
  });

  return errors;
};

export default function LoginForm({ redirectTo }: LoginFormProps) {
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

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setHasSubmitted(true);
      setFormError(null);

      if (isSubmitting) {
        return;
      }

      const errors = validate(values);

      if (errors.email || errors.password) {
        return;
      }

      try {
        setIsSubmitting(true);

        // Use API endpoint for server-side authentication
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: values.email.trim(),
            password: values.password,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          setFormError(mapAuthErrorMessage(data.error));

          logger.error({ error: data.error }, "Błąd logowania");

          setIsSubmitting(false);
          return;
        }

        // Success - do a full page reload to let middleware handle the redirect
        const safeRedirect = getSafeRedirectPath(redirectTo);
        window.location.href = safeRedirect ?? "/dashboard";
        // Don't set isSubmitting to false - we're redirecting
      } catch (error) {
        setFormError("Problem z połączeniem. Sprawdź internet i spróbuj ponownie.");

        logger.error({ err: error }, "Nieoczekiwany błąd logowania");
        setIsSubmitting(false);
      }
    },
    [isSubmitting, redirectTo, values]
  );

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isSubmitting}
      aria-describedby={formError ? formErrorId : undefined}
    >
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
          disabled={isSubmitting}
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
          disabled={isSubmitting}
        />
        {showPasswordError ? (
          <p className="text-sm text-destructive" id={passwordErrorId} role="alert">
            {showPasswordError}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? "Logowanie..." : "Zaloguj się"}
      </Button>

      <div className="mt-4 text-sm text-center">
        <p>
          Nie masz konta?{" "}
          <a href="/register" className="font-medium text-indigo-600 hover:underline">
            Utwórz konto
          </a>
        </p>
        <p>
          <a href="/forgot-password" className="font-medium text-indigo-600 hover:underline">
            Zapomniałeś hasła?
          </a>
        </p>
      </div>
    </form>
  );
}
