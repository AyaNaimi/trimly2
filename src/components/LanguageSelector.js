// src/components/LanguageSelector.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const LanguageSelector = ({ onClose }) => {
  const { locale, changeLanguage, languages, t } = useLanguage();
  const { colors, isDark } = useTheme();

  const handleLanguageSelect = async (languageCode) => {
    await changeLanguage(languageCode);
    if (onClose) {
      onClose();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('settings.selectLanguage')}
        </Text>
      </View>
      
      <ScrollView style={styles.languageList}>
        {languages.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageItem,
              { borderBottomColor: colors.border },
              locale === language.code && {
                backgroundColor: isDark ? colors.primary + '20' : colors.primary + '10',
              },
            ]}
            onPress={() => handleLanguageSelect(language.code)}
          >
            <View style={styles.languageContent}>
              <Text style={styles.flag}>{language.flag}</Text>
              <Text style={[styles.languageName, { color: colors.text }]}>
                {language.name}
              </Text>
            </View>
            {locale === language.code && (
              <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  languageList: {
    flex: 1,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '500',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LanguageSelector;
