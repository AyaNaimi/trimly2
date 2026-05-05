// src/utils/i18n.js
// Utility file for i18n helpers

/**
 * Format a date according to the current locale
 * @param {Date} date - The date to format
 * @param {string} locale - The locale code (en, fr, es)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, locale = 'en') => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString(locale, options);
};

/**
 * Format a currency amount according to the current locale
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency symbol
 * @param {string} locale - The locale code (en, fr, es)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = '€', locale = 'en') => {
  const formatted = amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  // Different currency placement based on locale
  if (locale === 'en') {
    return `${currency}${formatted}`;
  }
  return `${formatted} ${currency}`;
};

/**
 * Get the appropriate frequency label based on locale
 * @param {string} frequency - The frequency key (monthly, yearly, etc.)
 * @param {function} t - The translation function
 * @returns {string} Translated frequency
 */
export const getFrequencyLabel = (frequency, t) => {
  const frequencyMap = {
    monthly: t('subscriptions.monthly'),
    yearly: t('subscriptions.yearly'),
    weekly: t('subscriptions.weekly'),
    daily: t('subscriptions.daily'),
  };
  return frequencyMap[frequency] || frequency;
};

/**
 * Get the appropriate category label based on locale
 * @param {string} category - The category key
 * @param {function} t - The translation function
 * @returns {string} Translated category
 */
export const getCategoryLabel = (category, t) => {
  const categoryKey = category.toLowerCase();
  return t(`categories.${categoryKey}`) || category;
};
