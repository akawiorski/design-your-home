import { useState } from "react";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { registerSchema } from "../../lib/validation/auth.schemas";

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface TouchedFields {
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
}

export default function RegisterForm() {
  const [values, setValues] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const validate = () => {
    const result = registerSchema.safeParse(values);

    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        if (field) {
          newErrors[field] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleBlur = (field: keyof TouchedFields) => {
    setTouched({ ...touched, [field]: true });
    validate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    if (!validate()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("[RegisterForm] Sending registration request...");
      }

      const response = await fetch("/api/auth/register", {
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

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("[RegisterForm] Response:", { status: response.status, data });
      }

      if (!response.ok) {
        setFormError(data.error || "Wystąpił błąd. Spróbuj ponownie.");
        if (import.meta.env.DEV && data.debug) {
          // eslint-disable-next-line no-console
          console.error("[RegisterForm] Server error details:", data.debug);
        }
        return;
      }

      // Success
      setRegistrationSuccess(true);
    } catch (error) {
      setFormError("Problem z połączeniem. Sprawdź internet i spróbuj ponownie.");
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Unexpected registration error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="space-y-4">
        <div className="p-4 text-center bg-green-100 border border-green-400 rounded-md text-green-700">
          Konto utworzone! Sprawdź swoją skrzynkę email i kliknij w link aktywacyjny.
        </div>
        <Button asChild className="w-full">
          <a href="/login">Przejdź do logowania</a>
        </Button>
      </div>
    );
  }

  const shouldShowError = (field: keyof TouchedFields) => {
    return (touched[field] || hasSubmitted) && errors[field];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && <p className="text-red-500">{formError}</p>}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
          onBlur={() => handleBlur("email")}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          required
          aria-required
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={shouldShowError("email") ? "email-error" : undefined}
        />
        {shouldShowError("email") && (
          <p id="email-error" className="mt-1 text-sm text-red-600">
            {errors.email}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Hasło
        </label>
        <input
          id="password"
          type="password"
          value={values.password}
          onChange={(e) => setValues({ ...values, password: e.target.value })}
          onBlur={() => handleBlur("password")}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          required
          aria-required
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={shouldShowError("password") ? "password-error" : undefined}
        />
        {shouldShowError("password") && (
          <p id="password-error" className="mt-1 text-sm text-red-600">
            {errors.password}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Potwierdź hasło
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={values.confirmPassword}
          onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })}
          onBlur={() => handleBlur("confirmPassword")}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          required
          aria-required
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={shouldShowError("confirmPassword") ? "confirm-password-error" : undefined}
        />
        {shouldShowError("confirmPassword") && (
          <p id="confirm-password-error" className="mt-1 text-sm text-red-600">
            {errors.confirmPassword}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Spinner /> : "Utwórz konto"}
      </Button>
    </form>
  );
}
