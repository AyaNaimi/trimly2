# Guide de test de l'authentification

## Tests à effectuer

### 1. Test de connexion par formulaire classique

#### Test 1.1 : Validation des champs
- [ ] Laisser les champs vides et cliquer sur "Se Connecter"
  - **Résultat attendu** : Alert "Champs requis"

#### Test 1.2 : Validation de l'email
- [ ] Entrer un email invalide (ex: "test@test")
  - **Résultat attendu** : Alert "Email invalide"

#### Test 1.3 : Validation du mot de passe
- [ ] Entrer un mot de passe de moins de 6 caractères
  - **Résultat attendu** : Alert "Mot de passe trop court"

#### Test 1.4 : Compte inexistant
- [ ] Entrer un email qui n'existe pas avec un mot de passe valide
  - **Résultat attendu** : Alert "Identifiants incorrects" ou "Compte introuvable"

#### Test 1.5 : Mot de passe incorrect
- [ ] Entrer un email existant avec un mauvais mot de passe
  - **Résultat attendu** : Alert "Identifiants incorrects" ou "Mot de passe incorrect"

#### Test 1.6 : Connexion réussie
- [ ] Entrer des identifiants valides
  - **Résultat attendu** : Connexion réussie, redirection vers l'app

### 2. Test de création de compte

#### Test 2.1 : Création avec email existant
- [ ] Basculer en mode "Créer un Compte"
- [ ] Entrer un email déjà utilisé
  - **Résultat attendu** : Alert "Compte existant"

#### Test 2.2 : Création réussie
- [ ] Entrer un nouvel email et un mot de passe valide
  - **Résultat attendu** : Alert "Compte créé avec succès"

### 3. Test de connexion Google sur Android

#### Test 3.1 : Flux complet
- [ ] Cliquer sur "Se connecter avec Google"
- [ ] Vérifier que le navigateur s'ouvre
- [ ] Sélectionner un compte Google
- [ ] Vérifier le retour à l'application
- [ ] Vérifier la connexion réussie

#### Test 3.2 : Annulation
- [ ] Cliquer sur "Se connecter avec Google"
- [ ] Annuler dans le navigateur
  - **Résultat attendu** : Retour à l'écran de connexion sans erreur

#### Test 3.3 : Logs de débogage
- [ ] Ouvrir la console de débogage
- [ ] Cliquer sur "Se connecter avec Google"
- [ ] Vérifier les logs suivants :
  ```
  🔐 Tentative de connexion avec: google
  📍 Redirect URI: [URI]
  🌐 Ouverture du navigateur OAuth...
  📱 Résultat du navigateur: success
  ✅ URL de retour reçue
  🔑 Jetons reçus, création de la session...
  💾 Sauvegarde des jetons Google...
  ✅ Connexion réussie !
  ```

### 4. Test de connexion Google sur iOS

#### Test 4.1 : Flux complet
- [ ] Cliquer sur "Se connecter avec Google"
- [ ] Vérifier que le navigateur s'ouvre
- [ ] Sélectionner un compte Google
- [ ] Vérifier le retour à l'application
- [ ] Vérifier la connexion réussie

### 5. Test de connexion Apple (iOS uniquement)

#### Test 5.1 : Flux complet
- [ ] Cliquer sur "Continuer avec Apple"
- [ ] Vérifier que le navigateur s'ouvre
- [ ] S'authentifier avec Apple
- [ ] Vérifier le retour à l'application
- [ ] Vérifier la connexion réussie

## Commandes de test

### Lancer l'application sur Android
```bash
npx expo run:android
```

### Lancer l'application sur iOS
```bash
npx expo run:ios
```

### Voir les logs en temps réel
```bash
npx expo start
# Puis appuyez sur 'j' pour ouvrir les logs
```

### Nettoyer le cache
```bash
npx expo start --clear
```

## Dépannage

### Si la connexion Google ne fonctionne pas sur Android :

1. **Vérifier le SHA-1** :
   ```bash
   # Windows PowerShell
   .\scripts\get-android-sha1.ps1
   
   # macOS/Linux
   bash scripts/get-android-sha1.sh
   ```

2. **Vérifier les logs** :
   - Chercher les messages commençant par 🔐, 📍, 🌐, ❌
   - Noter les erreurs spécifiques

3. **Vérifier la configuration Supabase** :
   - Aller dans Authentication > Providers > Google
   - Vérifier que les Redirect URLs incluent :
     - `trimly://auth/callback`
     - `com.googleusercontent.apps.572874464830-be4rip5fsce1ku3nrep481uhvmuja0to://auth/callback`

4. **Vérifier Google Cloud Console** :
   - Projet : trimly-59589
   - OAuth 2.0 Client ID pour Android configuré
   - Package name : com.trimly.app
   - SHA-1 ajouté

5. **Reconstruire l'application** :
   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```

## Checklist de configuration

### Configuration Supabase
- [ ] Google Provider activé
- [ ] Client ID configuré
- [ ] Client Secret configuré
- [ ] Redirect URLs ajoutées

### Configuration Google Cloud Console
- [ ] Projet trimly-59589 sélectionné
- [ ] OAuth 2.0 Client ID pour Web créé
- [ ] OAuth 2.0 Client ID pour Android créé
- [ ] OAuth 2.0 Client ID pour iOS créé
- [ ] SHA-1 de débogage ajouté (Android)
- [ ] SHA-1 de production ajouté (Android)

### Configuration du projet
- [ ] google-services.json mis à jour avec oauth_client
- [ ] GoogleService-Info.plist présent
- [ ] .env contient les bonnes variables
- [ ] app.json contient les bons intentFilters

### Code
- [ ] LoginScreen.js mis à jour avec validation
- [ ] Alertes spécifiques ajoutées
- [ ] Logs de débogage ajoutés
- [ ] Gestion des erreurs améliorée

## Résultats attendus

✅ **Connexion par formulaire** :
- Validation des champs fonctionnelle
- Messages d'erreur clairs et en français
- Création de compte fonctionnelle
- Connexion fonctionnelle

✅ **Connexion Google Android** :
- Ouverture du navigateur
- Sélection du compte
- Retour à l'application
- Connexion réussie

✅ **Connexion Google iOS** :
- Même comportement qu'Android
- Déjà fonctionnel

✅ **Expérience utilisateur** :
- Messages d'erreur compréhensibles
- Feedback haptique approprié
- Pas de crash
- Logs utiles pour le débogage
