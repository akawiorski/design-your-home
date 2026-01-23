import { useState } from "react";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { supabaseClient } from "../../db/supabase.client";

const PASSWORD_MIN_LENGTH = 4;

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

export default function ResetPasswordForm() {
  const [values, setValues] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const validate = () => {
    const newErrors: FormErrors = {};
    if (values.password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = `Hasło powinno mieć co najmniej ${PASSWORD_MIN_LENGTH} znaków.`;
    }
    if (values.password !== values.confirmPassword) {
      newErrors.confirmPassword = "Hasła nie są identyczne.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!supabaseClient) {
      setFormError("Usługa jest chwilowo niedostępna.");
      return;
    }

    setIsLoading(true);
    setFormError(null);

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: values.password,
      });

      if (error) {
        if (error.message.includes("session") || error.message.includes("token")) {
          setFormError("Link wygasł lub jest nieprawidłowy. Spróbuj ponownie.");
        } else {
          setFormError("Wystąpił błąd. Spróbuj ponownie.");
        }
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("Password reset error:", error);
        }
        return;
      }

      // Success
      setResetSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      setFormError("Problem z połączeniem. Sprawdź internet i spróbuj ponownie.");
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Unexpected password reset error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="p-4 text-center bg-green-100 border border-green-400 rounded-md text-green-700">
        Hasło zostało zmienione. Możesz się teraz zalogować.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && <p className="text-red-500">{formError}</p>}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Nowe hasło
        </label>
        <input
          id="password"
          type="password"
          value={values.password}
          onChange={(e) => setValues({ ...values, password: e.target.value })}
          onBlur={validate}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          required
          aria-required
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
        {errors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600">
            {errors.password}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Potwierdź nowe hasło
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={values.confirmPassword}
          onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })}
          onBlur={validate}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          required
          aria-required
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
        />
        {errors.confirmPassword && (
          <p id="confirm-password-error" className="mt-1 text-sm text-red-600">
            {errors.confirmPassword}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner /> : "Ustaw nowe hasło"}
      </Button>
    </form>
  );
}
