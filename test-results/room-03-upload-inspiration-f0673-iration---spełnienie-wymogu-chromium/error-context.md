# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e5]:
      - generic [ref=e6]: test@test.pl
      - button "Wyloguj" [ref=e7]
  - main [ref=e10]:
    - generic [ref=e11]:
      - generic [ref=e12]:
        - heading "Dashboard" [level=1] [ref=e13]
        - paragraph [ref=e14]: Zarządzaj pokojami i szybko przechodź do dodawania zdjęć.
      - button "Utwórz pokój" [disabled]
    - region "Twoje pokoje" [ref=e15]:
      - generic [ref=e17]:
        - heading "Twoje pokoje" [level=2] [ref=e18]
        - paragraph [ref=e19]: Kliknij kartę, aby przejść do szczegółów pokoju.
      - generic [ref=e21]:
        - status "Loading" [ref=e22]
        - generic [ref=e24]: Ładowanie pokoi...
  - generic:
    - region "Notifications (F8)":
      - list
  - generic [ref=e27]:
    - button "Menu" [ref=e28]:
      - img [ref=e30]
      - generic: Menu
    - button "Inspect" [ref=e34]:
      - img [ref=e36]
      - generic: Inspect
    - button "Audit" [ref=e38]:
      - img [ref=e40]
      - generic: Audit
    - button "Settings" [ref=e43]:
      - img [ref=e45]
      - generic: Settings
```