# Email Scanner - Backend

## Déploiement

### 1. Variables d'environnement Supabase

Ajoutez ces variables dans votre dashboard Supabase > Edge Functions > Secrets:

```
GROQ_API_KEY=votre_cle_groq
GMAIL_CLIENT_ID=votre_client_id_google
GMAIL_CLIENT_SECRET=votre_client_secret_google
OUTLOOK_CLIENT_ID=votre_client_id_microsoft
OUTLOOK_CLIENT_SECRET=votre_client_secret_microsoft
```

### 2. Déployer la fonction

```bash
supabase functions deploy scan-emails
```

### 3. Configurer OAuth (Gmail)

1. Allez sur https://console.cloud.google.com/
2. Créez un projet ou sélectionnez un existant
3. Activez Gmail API
4. Créez des identifiants OAuth 2.0
5. Ajoutez l'URI de redirection: `https://your-project.supabase.co/functions/v1/callback`

### 4. Configurer OAuth (Outlook)

1. Allez sur https://portal.azure.com/
2. Enregistrez une application
3. Ajoutez les permissions API: `Mail.Read`
4. Ajoutez l'URI de redirection: `https://your-project.supabase.co/functions/v1/callback`

## Endpoints

### POST /functions/v1/scan-emails

```json
{
  "email": "user@gmail.com",
  "accessToken": "ya29.xxx",
  "provider": "gmail"
}
```

Réponse:
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
  "emailCount": 50
}
```
