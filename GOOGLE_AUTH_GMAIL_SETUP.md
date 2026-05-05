# Google Auth + Gmail Setup

Cette application utilise maintenant :

- `Supabase Auth` pour la connexion et la creation de compte avec Google
- `Gmail API` pour lire les emails de facturation de chaque utilisateur
- `trimly://auth/callback` comme redirect mobile

## 1. Configurer Google dans Supabase

Dans `Supabase Dashboard > Authentication > Providers > Google` :

- activez le provider Google
- renseignez votre `Google Client ID`
- renseignez votre `Google Client Secret`

L'URL de callback a declarer cote Google est en general :

```txt
https://<votre-project-ref>.supabase.co/auth/v1/callback
```

Pour ce projet, le ref visible dans `.env` est :

```txt
https://xsxgfdmmtqojuduwrwlq.supabase.co/auth/v1/callback
```

## 2. Ajouter les redirect URLs dans Supabase

Dans `Supabase Dashboard > Authentication > URL Configuration`, ajoutez au minimum :

```txt
trimly://auth/callback
```

Si vous utilisez aussi Expo dev build ou web, ajoutez egalement les URLs correspondantes a votre environnement.

## 3. Activer Gmail API dans Google Cloud

Dans `Google Cloud Console` :

- ouvrez le meme projet OAuth
- activez `Gmail API`
- gardez la meme application OAuth 2.0 que celle utilisee par Supabase

## 4. Declarer les secrets de la fonction Edge

Dans `Supabase > Edge Functions > Secrets`, ajoutez :

```txt
GMAIL_CLIENT_ID=<google-client-id>
GMAIL_CLIENT_SECRET=<google-client-secret>
GROQ_API_KEY=<optionnel-si-vous-voulez-l-analyse-IA>
```

`SUPABASE_URL` et `SUPABASE_ANON_KEY` sont utilises par la fonction pour verifier la session utilisateur.

## 5. Deployer la fonction Edge

```bash
supabase functions deploy scan-emails
```

## 6. Important pour Expo

Le flux OAuth mobile est prevu pour un `dev build` ou une app compilee.

`Expo Go` peut etre capricieux avec les redirects OAuth custom scheme. Le chemin attendu ici est :

```txt
trimly://auth/callback
```

## 7. Flux final attendu

1. L'utilisateur clique sur `Se connecter avec Google`
2. Google cree le compte ou connecte l'utilisateur dans Supabase
3. Les scopes Gmail sont demandes pendant le consentement
4. Trimly recupere les `provider_token` Google
5. Le modal email appelle la fonction `scan-emails`
6. La fonction lit Gmail via `gmail.readonly`
7. Les abonnements detectes sont proposes a l'import
