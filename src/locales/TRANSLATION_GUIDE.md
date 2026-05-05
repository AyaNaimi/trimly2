# Guide de traduction

## Utilisation du système de traduction

### Dans un composant React

```javascript
import { useLanguage } from '../../context/LanguageContext';

function MyComponent() {
  const { t, locale, changeLanguage } = useLanguage();
  
  return (
    <View>
      <Text>{t('common.save')}</Text>
      <Text>{t('home.welcome')}</Text>
    </View>
  );
}
```

### Avec des variables

Les traductions supportent les variables avec la syntaxe `{{variableName}}` :

```javascript
// Dans le fichier JSON
{
  "transactions": {
    "deleteMessage": "Effacer \"{{name}}\" — {{amount}} {{currency}} ?"
  }
}

// Dans le code
t('transactions.deleteMessage', { 
  name: 'Netflix', 
  amount: 15.99, 
  currency: 'EUR' 
})
// Résultat: "Effacer "Netflix" — 15.99 EUR ?"
```

### Langues disponibles

- 🇫🇷 Français (fr)
- 🇬🇧 English (en)
- 🇪🇸 Español (es)

### Structure des fichiers de traduction

```
src/locales/
├── fr.json  # Français
├── en.json  # Anglais
├── es.json  # Espagnol
└── README.md
```

### Ajouter une nouvelle traduction

1. Ajoutez la clé dans tous les fichiers de langue (fr.json, en.json, es.json)
2. Utilisez la notation par points pour l'organisation : `section.subsection.key`
3. Utilisez `{{variable}}` pour les valeurs dynamiques

Exemple :
```json
{
  "settings": {
    "profile": {
      "greeting": "Bonjour {{name}} !"
    }
  }
}
```

### Fallback

Si une traduction n'est pas trouvée dans la langue actuelle, le système utilise automatiquement la version anglaise. Si elle n'existe pas non plus, la clé elle-même est retournée.

### Changer de langue

```javascript
const { changeLanguage } = useLanguage();

// Changer vers le français
changeLanguage('fr');

// Changer vers l'anglais
changeLanguage('en');

// Changer vers l'espagnol
changeLanguage('es');
```

La langue sélectionnée est automatiquement sauvegardée dans AsyncStorage.
