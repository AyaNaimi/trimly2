#!/bin/bash

# Script pour obtenir l'empreinte SHA-1 du keystore Android
# Utilisé pour configurer Google Sign-In sur Android

echo "=========================================="
echo "Obtention de l'empreinte SHA-1 Android"
echo "=========================================="
echo ""

# Couleurs pour le terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Keystore de débogage
DEBUG_KEYSTORE="$HOME/.android/debug.keystore"

echo -e "${YELLOW}1. Empreinte SHA-1 du keystore de DÉBOGAGE :${NC}"
echo ""

if [ -f "$DEBUG_KEYSTORE" ]; then
    keytool -list -v -keystore "$DEBUG_KEYSTORE" -alias androiddebugkey -storepass android -keypass android 2>/dev/null | grep "SHA1:"
    echo ""
    echo -e "${GREEN}✓ Copiez cette empreinte SHA-1 dans Google Cloud Console${NC}"
else
    echo "❌ Keystore de débogage introuvable à : $DEBUG_KEYSTORE"
fi

echo ""
echo "=========================================="
echo -e "${YELLOW}2. Pour le keystore de PRODUCTION :${NC}"
echo ""
echo "Exécutez cette commande avec votre propre keystore :"
echo ""
echo "keytool -list -v -keystore /path/to/your/keystore.jks -alias your-key-alias"
echo ""
echo "=========================================="
echo ""
echo "Instructions :"
echo "1. Allez sur https://console.cloud.google.com/"
echo "2. Sélectionnez le projet 'trimly-59589'"
echo "3. Allez dans 'APIs & Services' > 'Credentials'"
echo "4. Créez ou modifiez un 'OAuth 2.0 Client ID' pour Android"
echo "5. Ajoutez :"
echo "   - Package name: com.trimly.app"
echo "   - SHA-1 certificate fingerprint: [collez l'empreinte ci-dessus]"
echo ""
