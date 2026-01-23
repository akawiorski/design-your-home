# Debug Guide: Authentication Issues

## Quick Diagnostics

Jeśli otrzymujesz błędy podczas rejestracji/logowania, wykonaj poniższe kroki:

### 1. Sprawdź zmienne środowiskowe

Upewnij się, że w pliku `.env` masz poprawnie ustawione:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Jak sprawdzić:**
```bash
# W terminalu
cat .env | grep SUPABASE
```

### 2. Włącz tryb deweloperski i sprawdź konsole

Aplikacja automatycznie loguje szczegółowe informacje w trybie deweloperskim:

**Konsola przeglądarki (F12):**
- `[RegisterForm]` - logi z formularza rejestracji
- Sprawdź network tab dla szczegółów zapytania

**Konsola serwera (terminal z `npm run dev`):**
- `[Register API]` - logi z endpointa rejestracji
- `[Supabase]` - logi konfiguracji Supabase

### 3. Typowe błędy i rozwiązania

#### Błąd: "Usługa rejestracji jest niedostępna" (503)

**Przyczyna:** Brak lub nieprawidłowe zmienne SUPABASE_URL/SUPABASE_KEY

**Rozwiązanie:**
1. Sprawdź plik `.env`
2. Zrestartuj serwer dev (`npm run dev`)
3. Sprawdź konsolę serwera - powinieneś zobaczyć log o konfiguracji

#### Błąd: "Wystąpił błąd. Spróbuj ponownie." (400)

**Przyczyna:** Błąd z Supabase Auth

**Jak debugować:**
1. Otwórz konsolę serwera
2. Szukaj loga: `[Register API] Supabase error:`
3. Sprawdź pole `debug` w odpowiedzi (tylko w dev mode)

**Możliwe przyczyny:**
- Email confirmation disabled w Supabase
- Rate limiting
- Nieprawidłowa konfiguracja Auth w Supabase Dashboard

#### Błąd: Cookies nie są zapisywane

**Przyczyna:** Problem z secure cookies w localhost

**Rozwiązanie:** 
- W development secure cookies są automatycznie wyłączone
- Sprawdź czy używasz `http://localhost` (nie `https://`)

### 4. Sprawdź konfigurację Supabase

W Supabase Dashboard → Authentication → Settings:

1. **Enable Email Confirmations:** 
   - Jeśli włączone: użytkownik musi potwierdzić email
   - Jeśli wyłączone: użytkownik od razu może się logować

2. **Site URL:** Powinien być ustawiony na:
   - Development: `http://localhost:4321`
   - Production: Twoja domena

3. **Redirect URLs:** Dodaj:
   - `http://localhost:4321/reset-password`
   - `http://localhost:4321/**` (wildcard dla development)

### 5. Testowanie połączenia z Supabase

Utwórz plik testowy `test-supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const test = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'test1234',
  });
  
  console.log('Result:', { data, error });
};

test();
```

Uruchom: `tsx test-supabase.ts`

### 6. Sprawdź logi Supabase

W Supabase Dashboard → Logs → Auth Logs:
- Zobacz wszystkie próby rejestracji/logowania
- Sprawdź szczegóły błędów

## Development Logs Reference

### Browser Console

```javascript
[RegisterForm] Sending registration request...
[RegisterForm] Response: { status: 400, data: { error: "...", debug: "..." } }
```

### Server Console

```bash
[Register API] Incoming registration request
[Register API] Request data: { email: 'user@example.com', passwordLength: 8 }
[Register API] Calling Supabase signUp...
[Register API] Supabase error: { message: '...', status: 400, name: 'AuthApiError' }
```

## Need Help?

1. Zbierz wszystkie logi (browser + server)
2. Sprawdź Supabase Dashboard → Auth Logs
3. Sprawdź konfigurację w Supabase Dashboard → Settings → Auth
