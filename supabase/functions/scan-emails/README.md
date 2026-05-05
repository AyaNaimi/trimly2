# scan-emails

Fonction Edge qui :

- verifie la session Supabase de l'utilisateur
- reutilise le `provider_token` Google ou un `refresh_token`
- lit Gmail via `gmail.readonly`
- retourne une liste d'abonnements detectes

## Secrets requis

```txt
GMAIL_CLIENT_ID=<google-client-id>
GMAIL_CLIENT_SECRET=<google-client-secret>
GROQ_API_KEY=<optionnel>
```

## Requete attendue

```json
{
  "email": "user@gmail.com",
  "provider": "gmail",
  "providerAccessToken": "ya29....",
  "providerRefreshToken": "1//....",
  "sessionAccessToken": "<supabase-user-session-token>"
}
```

L'appel mobile peut utiliser la cle `anon` dans les headers et transmettre la vraie session utilisateur dans `sessionAccessToken`.

## Reponse

```json
{
  "subscriptions": [
    {
      "serviceName": "Netflix",
      "amount": 15.99,
      "billingFrequency": "monthly",
      "category": "Streaming"
    }
  ],
  "emailCount": 12,
  "connection": {
    "email": "user@gmail.com",
    "providerUserId": "uuid",
    "accessToken": "ya29....",
    "refreshToken": "1//....",
    "scopes": ["https://www.googleapis.com/auth/gmail.readonly"],
    "source": "google-provider-token"
  }
}
```
