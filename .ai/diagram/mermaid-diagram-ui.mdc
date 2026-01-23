```mermaid
graph TD
    subgraph "Strefa Publiczna"
        A["Użytkownik wchodzi na /"] --> B{AuthRedirector sprawdza sesję};
        B -- Sesja istnieje --> G["/dashboard"];
        B -- Sesja nie istnieje --> C["/login"];

        C -- "Nie masz konta? Zarejestruj się" --> D["/register"];
        C -- "Zapomniałeś hasła?" --> E["/forgot-password"];

        D["/register"] --> D1(RegisterForm);
        D1 -- Wypełnia formularz i wysyła --> D2{supabase.auth.signUp()};
        D2 -- Sukces --> D3["Wyświetla komunikat o konieczności potwierdzenia emaila"];
        D3 -- "Przejdź do logowania" --> C;

        E["/forgot-password"] --> E1(ForgotPasswordForm);
        E1 -- Wprowadza email i wysyła --> E2{supabase.auth.resetPasswordForEmail()};
        E2 -- Sukces --> E3["Wyświetla komunikat o wysłaniu linku"];
        E3 -- "Powrót do logowania" --> C;

        F["Użytkownik klika link w emailu"] --> F1["/reset-password"];
        F1 --> F2(ResetPasswordForm);
        F2 -- Wprowadza nowe hasło i wysyła --> F3{supabase.auth.updateUser()};
        F3 -- Sukces --> F4["Wyświetla toast i przekierowuje"];
        F4 --> C;
    end

    subgraph "Logowanie"
        C --> C1(LoginForm);
        C1 -- Wypełnia formularz i wysyła --> C2{supabase.auth.signInWithPassword()};
        C2 -- Sukces --> G;
        C2 -- Błąd --> C1;
    end

    subgraph "Strefa Prywatna"
        direction LR
        G["/dashboard"] --> H(Layout.astro z UserMenu);
        I["/rooms/[roomId]"] --> H;
        H -- "Wyloguj" --> J{supabase.auth.signOut()};
        J -- Sukces --> C;
    end

    subgraph "Ochrona Tras"
        K["Użytkownik próbuje wejść na /dashboard"] --> L{Middleware};
        L -- Sesja nie istnieje --> C;
        L -- Sesja istnieje --> G;
    end

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style F fill:#f9f,stroke:#333,stroke-width:2px
    style K fill:#f9f,stroke:#333,stroke-width:2px

    classDef astroPage fill:#FFCA78,stroke:#333,stroke-width:2px;
    classDef reactComponent fill:#87CEEB,stroke:#333,stroke-width:2px;
    classDef supabaseAction fill:#98FB98,stroke:#333,stroke-width:2px;
    classDef middleware fill:#DDA0DD,stroke:#333,stroke-width:2px;

    class C,D,E,F1,G,I astroPage;
    class B,C1,D1,E1,F2,H reactComponent;
    class C2,D2,E2,F3,J supabaseAction;
    class L middleware;
```
