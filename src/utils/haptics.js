// src/utils/haptics.js
import * as Haptics from 'expo-haptics';

/**
 * Fancy Premium Haptics
 */
export const PremiumHaptics = {
  // A mechanical double-click feel (chic & precise)
  click: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 40);
  },
  
  // A soft, subtle ripple feel
  selection: () => {
    Haptics.selectionAsync();
  },
  
  // For successful actions (double tap-tap)
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  
  // For opening an item (light then softer)
  open: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => Haptics.selectionAsync(), 60);
  },

  // Specialized Navigation Click (Lock-in feel)
  nav: async () => {
    Haptics.selectionAsync();
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 35);
  }
};
