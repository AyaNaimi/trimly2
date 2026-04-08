// src/utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getNextBilling, getNotificationMessage } from './dateUtils';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 * Returns true if granted
 */
export async function requestNotificationPermissions() {
  if (!Device.isDevice) {
    // Simulator/emulator - permissions won't work
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('subscriptions', {
      name: 'Prelevements',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#5B3BF5',
    });
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Rappels budget',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return finalStatus === 'granted';
}

/**
 * Schedule all subscription notifications
 * For each active subscription, schedules alerts at:
 * - 2 days before charge
 * - 1 day before charge  
 * - Day of charge
 * Also handles trial end notifications
 */
export async function scheduleAllSubscriptionNotifications(subscriptions) {
  // Cancel all existing subscription notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  for (const sub of subscriptions) {
    if (!sub.active) continue;

    const billing = getNextBilling(sub);

    // Schedule for 2 days before
    if (billing.daysUntilCharge >= 2) {
      const triggerDate = new Date(billing.nextChargeDate);
      triggerDate.setDate(triggerDate.getDate() - 2);
      triggerDate.setHours(9, 0, 0, 0); // 9am

      if (triggerDate > new Date()) {
        const msg = getNotificationMessage(sub, 2);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: msg.title,
            body: msg.body,
            data: { subscriptionId: sub.id, type: 'upcoming' },
            categoryIdentifier: 'subscriptions',
          },
          trigger: { date: triggerDate, channelId: 'subscriptions' },
          identifier: `sub-${sub.id}-2days`,
        });
      }
    }

    // Schedule for 1 day before
    if (billing.daysUntilCharge >= 1) {
      const triggerDate = new Date(billing.nextChargeDate);
      triggerDate.setDate(triggerDate.getDate() - 1);
      triggerDate.setHours(9, 0, 0, 0);

      if (triggerDate > new Date()) {
        const msg = getNotificationMessage(sub, 1);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: msg.title,
            body: msg.body,
            data: { subscriptionId: sub.id, type: 'tomorrow' },
            categoryIdentifier: 'subscriptions',
          },
          trigger: { date: triggerDate, channelId: 'subscriptions' },
          identifier: `sub-${sub.id}-1day`,
        });
      }
    }

    // Schedule for day of charge
    {
      const triggerDate = new Date(billing.nextChargeDate);
      triggerDate.setHours(9, 0, 0, 0);
      if (triggerDate > new Date()) {
        const msg = getNotificationMessage(sub, 0);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: msg.title,
            body: msg.body,
            data: { subscriptionId: sub.id, type: 'today' },
            categoryIdentifier: 'subscriptions',
          },
          trigger: { date: triggerDate, channelId: 'subscriptions' },
          identifier: `sub-${sub.id}-today`,
        });
      }
    }

    // Trial ending soon notification (3 days before trial ends)
    if (billing.isTrial && billing.trialDaysLeft <= 7) {
      const triggerDate = new Date(billing.trialEndsAt);
      triggerDate.setDate(triggerDate.getDate() - 3);
      triggerDate.setHours(10, 0, 0, 0);

      if (triggerDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${sub.name} passe bientot en payant`,
            body: `Essai gratuit: plus que 3 jours. Ensuite ${sub.amount.toFixed(2)} EUR par ${cycleFr(sub.cycle)}.`,
            data: { subscriptionId: sub.id, type: 'trial-ending' },
          },
          trigger: { date: triggerDate, channelId: 'subscriptions' },
          identifier: `sub-${sub.id}-trial`,
        });
      }
    }
  }
}

/**
 * Schedule daily spending reminder based on user's notification level
 * 0 = off, 1 = gentle (1x/day), 2 = aggressive (3x/day), 3 = relentless (6x/day)
 */
export async function scheduleDailyReminders(level) {
  // Cancel existing reminders
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.identifier.startsWith('reminder-')) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  if (level === 0) return;

  const messages = [
    "Ajoutez vos depenses du jour pour garder un journal propre.",
    "Un rapide point budget maintenant peut vous eviter un ecart ce soir.",
    "Quelques secondes suffisent pour mettre vos mouvements a jour.",
    "Votre journal attend peut-etre encore une ou deux depenses.",
  ];

  const times = [
    level >= 1 ? [12, 0] : null,
    level >= 2 ? [18, 0] : null,
    level >= 2 ? [21, 0] : null,
    level >= 3 ? [8, 0] : null,
    level >= 3 ? [15, 0] : null,
    level >= 3 ? [20, 0] : null,
  ].filter(Boolean);

  for (let i = 0; i < times.length; i++) {
    const [hour, minute] = times[i];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Trimly',
        body: messages[i % messages.length],
        data: { type: 'reminder' },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
        channelId: 'reminders',
      },
      identifier: `reminder-${hour}-${minute}`,
    });
  }
}

function cycleFr(cycle) {
  return { weekly: 'semaine', monthly: 'mois', quarterly: 'trimestre', annual: 'an' }[cycle] || 'mois';
}

/**
 * Get push token (for remote notifications)
 */
export async function getPushToken() {
  if (!Device.isDevice) return null;
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}
