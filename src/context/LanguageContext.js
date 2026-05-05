// src/context/LanguageContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// Import translations
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import de from '../locales/de.json';
import pt from '../locales/pt.json';
import it from '../locales/it.json';

const LANGUAGE_KEY = '@app_language';

// Simple i18n implementation without external library
const translations = { en, fr, es, de, pt, it };

// Get nested value from object using dot notation
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Simple translation function
const translate = (locale, key, options = {}) => {
  let translation = getNestedValue(translations[locale], key);
  
  // Fallback to English if translation not found
  if (!translation && locale !== 'en') {
    translation = getNestedValue(translations.en, key);
  }
  
  // If still not found, return the key
  if (!translation) {
    return key;
  }
  
  // Replace variables in translation
  if (options && typeof translation === 'string') {
    Object.keys(options).forEach(optionKey => {
      translation = translation.replace(`{{${optionKey}}}`, options[optionKey]);
    });
  }
  
  return translation;
};

// Get device locale
const getDeviceLocale = () => {
  const locale = Localization.locale || Localization.locales?.[0] || 'en';
  return locale.split('-')[0]; // Get language code only (e.g., 'en' from 'en-US')
};

const LanguageContext = createContext();

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

export const LanguageProvider = ({ children }) => {
  const deviceLocale = getDeviceLocale();
  const initialLocale = LANGUAGES.find(lang => lang.code === deviceLocale) ? deviceLocale : 'en';
  const [locale, setLocale] = useState(initialLocale);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage && LANGUAGES.find(lang => lang.code === savedLanguage)) {
        setLocale(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (languageCode) => {
    try {
      if (LANGUAGES.find(lang => lang.code === languageCode)) {
        setLocale(languageCode);
        await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
      }
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key, options = {}) => {
    return translate(locale, key, options);
  };

  const getCurrentLanguage = () => {
    return LANGUAGES.find(lang => lang.code === locale) || LANGUAGES[0];
  };

  const value = {
    locale,
    changeLanguage,
    t,
    getCurrentLanguage,
    isLoading,
    languages: LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
