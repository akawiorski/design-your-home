import { useState } from 'react';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 4;

export default function RegisterForm() {
  const [values, setValues] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const validate = () => {
    const newErrors: any = {};
    if (!values.email || !EMAIL_PATTERN.test(values.email)) {
      newErrors.email = 'Podaj poprawny adres email.';
    }
    if (values.password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = `Hasło powinno mieć co najmniej ${PASSWORD_MIN_LENGTH} znaków.`;
    }
    if (values.password !== values.confirmPassword) {
      newErrors.confirmPassword = 'Hasła nie są identyczne.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setFormError(null);

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock success
    setRegistrationSuccess(true);
    setIsLoading(false);
  };

  if (registrationSuccess) {
    return (
      <div className="p-4 text-center bg-green-100 border border-green-400 rounded-md text-green-700">
        Konto utworzone! Sprawdź swoją skrzynkę email i kliknij w link aktywacyjny.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && <p className="text-red-500">{formError}</p>}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
          onBlur={validate}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          required
          aria-required
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && <p id="email-error" className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="password"  className="block text-sm font-medium text-gray-700">Hasło</label>
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
        {errors.password && <p id="password-error" className="mt-1 text-sm text-red-600">{errors.password}</p>}
      </div>
      <div>
        <label htmlFor="confirmPassword"  className="block text-sm font-medium text-gray-700">Potwierdź hasło</label>
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
        {errors.confirmPassword && <p id="confirm-password-error" className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner /> : 'Utwórz konto'}
      </Button>
    </form>
  );
}
