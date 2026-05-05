# Script PowerShell pour obtenir l'empreinte SHA-1 du keystore Android
# Utilisé pour configurer Google Sign-In sur Android

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Obtention de l'empreinte SHA-1 Android" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Keystore de débogage
$debugKeystore = "$env:USERPROFILE\.android\debug.keystore"

Write-Host "1. Empreinte SHA-1 du keystore de DÉBOGAGE :" -ForegroundColor Yellow
Write-Host ""

if (Test-Path $debugKeystore) {
    $output = keytool -list -v -keystore $debugKeystore -alias androiddebugkey -storepass android -keypass android 2>$null
    $sha1Line = $output | Select-String "SHA1:"
    
    if ($sha1Line) {
        Write-Host $sha1Line -ForegroundColor Green
        Write-Host ""
        Write-Host "✓ Copiez cette empreinte SHA-1 dans Google Cloud Console" -ForegroundColor Green
    } else {
        Write-Host "❌ Impossible de lire l'empreinte SHA-1" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Keystore de débogage introuvable à : $debugKeystore" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "2. Pour le keystore de PRODUCTION :" -ForegroundColor Yellow
Write-Host ""
Write-Host "Exécutez cette commande avec votre propre keystore :"
Write-Host ""
Write-Host "keytool -list -v -keystore C:\path\to\your\keystore.jks -alias your-key-alias" -ForegroundColor White
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Instructions :" -ForegroundColor Yellow
Write-Host "1. Allez sur https://console.cloud.google.com/"
Write-Host "2. Sélectionnez le projet 'trimly-59589'"
Write-Host "3. Allez dans 'APIs & Services' > 'Credentials'"
Write-Host "4. Créez ou modifiez un 'OAuth 2.0 Client ID' pour Android"
Write-Host "5. Ajoutez :"
Write-Host "   - Package name: com.trimly.app"
Write-Host "   - SHA-1 certificate fingerprint: [collez l'empreinte ci-dessus]"
Write-Host ""
