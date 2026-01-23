import { useState } from 'react';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!email || !EMAIL_PATTERN.test(email)) {
      setError('Podaj poprawny adres email.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setFormError(null);

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock success
    setSuccess(true);
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="p-4 text-center bg-green-100 border border-green-400 rounded-md text-green-700">
        Jeśli konto z tym adresem istnieje, wyślemy na nie link do resetowania hasła.
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={validate}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          required
          aria-required
          autoComplete="email"
          aria-invalid={!!error}
          aria-describedby={error ? "email-error" : undefined}
        />
        {error && <p id="email-error" className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner /> : 'Wyślij link'}
      </Button>
    </form>
  );
}
