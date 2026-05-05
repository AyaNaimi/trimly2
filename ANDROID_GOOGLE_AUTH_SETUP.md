# Configuration de l'authentification Google pour Android

## Problème résolu
La connexion Google fonctionnait sur iOS mais pas sur Android. Les modifications suivantes ont été apportées :

## 1. Configuration du fichier google-services.json

Le fichier `google-services.json` a été mis à jour pour inclure le client OAuth :

```json
"oauth_client": [
  {
    "client_id": "572874464830-be4rip5fsce1ku3nrep481uhvmuja0to.apps.googleusercontent.com",
    "client_type": 3
  }
]
```

## 2. Vérification de la configuration Supabase

Assurez-vous que dans votre projet Supabase :

1. Allez dans **Authentication** > **Providers** > **Google**
2. Vérifiez que le **Client ID** et **Client Secret** sont configurés
3. Ajoutez les **Redirect URLs** suivantes :
   - `trimly://auth/callback`
   - `com.googleusercontent.apps.572874464830-be4rip5fsce1ku3nrep481uhvmuja0to://auth/callback`

## 3. Configuration dans Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet **trimly-59589**
3. Allez dans **APIs & Services** > **Credentials**
4. Vérifiez que vous avez un **OAuth 2.0 Client ID** pour Android avec :
   - **Package name**: `com.trimly.app`
   - **SHA-1 certificate fingerprint**: Ajoutez votre empreinte de débogage et de production

### Obtenir l'empreinte SHA-1 pour le débogage :

```bash
# Pour Windows avec bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Pour macOS/Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Obtenir l'empreinte SHA-1 pour la production :

```bash
keytool -list -v -keystore /path/to/your/keystore.jks -alias your-key-alias
```

## 4. Améliorations apportées au code

### LoginScreen.js

✅ **Validation des champs** :
- Validation de l'email avec regex
- Validation de la longueur du mot de passe (minimum 6 caractères)

✅ **Alertes spécifiques** :
- "Identifiants incorrects" pour les mauvais identifiants
- "Compte introuvable" si l'email n'existe pas
- "Mot de passe incorrect" pour un mauvais mot de passe
- "Compte existant" si l'utilisateur essaie de créer un compte avec un email déjà utilisé
- "Email non confirmé" si l'email n'a pas été vérifié

✅ **Logs de débogage** :
- Ajout de logs console pour suivre le processus d'authentification OAuth
- Facilite le débogage sur Android

✅ **Gestion des erreurs réseau** :
- Détection des erreurs réseau
- Messages d'erreur plus clairs

## 5. Test de la configuration

### Sur Android :

1. Compilez l'application :
   ```bash
   npx expo run:android
   ```

2. Testez la connexion Google :
   - Cliquez sur "Se connecter avec Google"
   - Vérifiez les logs dans la console
   - La connexion devrait ouvrir le navigateur et revenir à l'app

3. Testez la connexion par formulaire :
   - Essayez avec un email invalide → devrait afficher "Email invalide"
   - Essayez avec un mot de passe court → devrait afficher "Mot de passe trop court"
   - Essayez avec de mauvais identifiants → devrait afficher "Identifiants incorrects"
   - Essayez avec un compte inexistant → devrait afficher "Compte introuvable"

### Sur iOS :

La configuration existante devrait continuer à fonctionner normalement.

## 6. Dépannage

### Si la connexion Google ne fonctionne toujours pas sur Android :

1. **Vérifiez les logs** :
   ```bash
   npx expo start
   # Puis appuyez sur 'j' pour ouvrir les logs
   ```

2. **Vérifiez le Redirect URI** :
   - Dans le code, vérifiez que `makeRedirectUri` génère le bon URI
   - Comparez avec ce qui est configuré dans Supabase

3. **Vérifiez le SHA-1** :
   - Assurez-vous que le SHA-1 de votre keystore de débogage est ajouté dans Google Cloud Console

4. **Nettoyez le cache** :
   ```bash
   npx expo start --clear
   ```

5. **Reconstruisez l'application** :
   ```bash
   npx expo run:android --device
   ```

## 7. Variables d'environnement

Vérifiez que votre fichier `.env` contient :

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=572874464830-1l7u3fehqfsiblak812aul3fgqu09l6q.apps.googleusercontent.com
EXPO_PUBLIC_GMAIL_CLIENT_ID=572874464830-be4rip5fsce1ku3nrep481uhvmuja0to.apps.googleusercontent.com
```

## 8. Configuration app.json

Vérifiez que `app.json` contient les bonnes configurations pour Android :

```json
"android": {
  "package": "com.trimly.app",
  "intentFilters": [
    {
      "action": "VIEW",
      "autoVerify": true,
      "data": [
        {
          "scheme": "trimly"
        },
        {
          "scheme": "com.googleusercontent.apps.572874464830-be4rip5fsce1ku3nrep481uhvmuja0to"
        }
      ],
      "category": [
        "BROWSABLE",
        "DEFAULT"
      ]
    }
  ]
}
```

## Résumé des modifications

1. ✅ Ajout du client OAuth dans `google-services.json`
2. ✅ Amélioration de la validation des champs de connexion
3. ✅ Ajout d'alertes spécifiques pour chaque type d'erreur
4. ✅ Ajout de logs de débogage pour OAuth
5. ✅ Meilleure gestion des erreurs réseau
6. ✅ Messages d'erreur en français et plus clairs

## Prochaines étapes

1. Testez sur un appareil Android réel ou un émulateur
2. Vérifiez les logs pour identifier tout problème restant
3. Ajoutez le SHA-1 de production avant de publier sur le Play Store
