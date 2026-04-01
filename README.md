# Trimly — App Mobile Complète
> Budget + Abonnements en une seule app. Inspirée du design Luna.

## Stack Technique
- **React Native + Expo** (SDK 51)
- **React Navigation** (Bottom Tabs + Stack)
- **AsyncStorage** (persistance locale)
- **expo-notifications** (alertes prélèvements)
- **expo-haptics** (micro-vibrations)
- **React Native Reanimated** (animations)

## Installation

```bash
cd trimly
npm install
npx expo start
```

Pour iOS : `npm run ios`  
Pour Android : `npm run android`

---

## Structure du projet

```
trimly/
├── App.js                          # Entrée principale
├── src/
│   ├── theme/index.js              # Couleurs, typographie, shadows
│   ├── context/AppContext.js       # State global (useReducer)
│   ├── utils/
│   │   ├── dateUtils.js            # Logique dates (years bissextiles, trials, cycles)
│   │   └── notifications.js       # Scheduler notifications
│   ├── data/initialData.js         # Données initiales, quicksubs, couleurs
│   ├── components/index.js         # Composants réutilisables
│   ├── navigation/AppNavigator.js  # Navigation (Tab + Stack)
│   └── screens/
│       ├── Onboarding/             # 4 étapes d'onboarding
│       ├── Home/                   # Dashboard budget
│       ├── Subscriptions/          # Gestion abonnements + Death Chart
│       ├── Transactions/           # Historique transactions
│       ├── Reports/                # Graphiques & rapports
│       └── Settings/               # Paramètres + Paywall
```

---

## Fonctionnalités implémentées

### Budget (inspiré Luna)
- Catégories hebdomadaires et mensuelles
- Barre de progression colorée (vert → orange → rouge)
- Ajout de transactions avec catégories
- Onboarding : sélection catégories par groupes + allocation budget
- Suggestion de montants basée sur le revenu (règle 50/20/30)

### Abonnements (Trimly)
- Death Chart 12 mois (projection réelle)
- Badge rouge si prélèvement ≤ 2 jours
- Alerte bannière sur le Home
- Bouton "Générer lettre de résiliation"
- Filtres : Tous / Actifs / Essais / Résiliés
- Quick-add : 15+ services populaires

### Logique de dates — tous les cas gérés
- **Années bissextiles** : 29 fév. → 28 fév. en année non-bissextile
- **Mois courts** : 31 jan + 1 mois = 28/29 fév., pas le 3 mars
- **Essais gratuits** : $0 pendant N jours, puis premier prélèvement
- **Cycles** : hebdomadaire, mensuel, trimestriel, annuel
- **Projection 12 mois** : calcule chaque prélèvement futur sur 12 mois

### Notifications
- 2 jours avant chaque prélèvement
- 1 jour avant chaque prélèvement
- Jour du prélèvement
- 3 jours avant fin d'essai gratuit
- Rappels quotidiens dépenses (4 niveaux : silencieux → implacable)

### Monétisation
- Essai gratuit 14 jours (sans carte)
- Paywall avec 3 plans : 4,99€/mois · 49,99€/an · 149,99€ une fois
- Bannière trial sur Home
- Détection expiration essai

---

## Logique dates — exemples concrets

```js
// Abonnement pris le 31 janvier
addMonths('2026-01-31', 1) → '2026-02-28' (pas le 3 mars !)

// Abonnement pris le 29 février (année bissextile)
addYears('2024-02-29', 1) → '2025-02-28' (non-bissextile)
addYears('2024-02-29', 4) → '2028-02-29' (bissextile)

// Essai gratuit 30 jours commencé le 1er mars
// → Gratuit jusqu'au 31 mars
// → Premier prélèvement le 1er avril
// → Prochain prélèvement calculé depuis le 1er avril

// Projection 12 mois
// Netflix 15,99€/mois → 12 mois × 15,99 = 191,88€ dans la Death Chart
// Amazon Prime 69,99€/an → 1 occurrence dans l'année
```

---

## Notifications — architecture

Les notifications sont schedulées à chaque modification des abonnements :
1. Pour chaque abonnement actif, on calcule `getNextBilling(sub)`
2. On programme 3 notifications : J-2, J-1, J-0 à 9h00
3. Si essai en cours ≤ 7j : notification J-3 avant fin d'essai
4. Les rappels quotidiens sont des triggers répétitifs (heure fixe)

---

## Design System

Fidèle à Luna :
- **Fond** : `#F7F7FA` (gris clair)
- **Accent** : `#5B3BF5` (violet)
- **Cartes** : blanc avec bordure `1.5px #EEEEF2`
- **Typographie** : Nunito (800/700/600)
- **Radius** : 14px pour les lignes, 20px pour les grandes cartes
- **Animations** : spring sur press (scale 0.97), slide sur navigation
