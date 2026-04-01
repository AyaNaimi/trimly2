// src/utils/dateUtils.js
// Handles ALL date edge cases: leap years, free trials, different cycles

/**
 * Check if a year is a leap year
 * A year is a leap year if:
 * - divisible by 4 AND
 * - NOT divisible by 100, OR divisible by 400
 */
export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get days in a specific month of a year
 * Handles February in leap years (29 days) vs non-leap years (28 days)
 */
export function daysInMonth(year, month) { // month is 0-indexed
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month];
}

/**
 * Safely add months to a date, handling month-end edge cases
 * e.g., Jan 31 + 1 month = Feb 28 (or 29 in leap year), NOT March 2
 * e.g., Feb 29 (leap year) + 12 months = Feb 28 (non-leap year)
 */
export function addMonths(date, months) {
  const d = new Date(date);
  const originalDay = d.getDate();
  d.setMonth(d.getMonth() + months);
  
  // If the day changed, it means we overflowed into next month
  // e.g., Jan 31 + 1 = Mar 2 (overflow) → should be Feb 28/29
  if (d.getDate() !== originalDay) {
    d.setDate(0); // Set to last day of previous month
  }
  return d;
}

/**
 * Safely add years to a date
 * Handles Feb 29 → Feb 28 in non-leap target years
 */
export function addYears(date, years) {
  const d = new Date(date);
  const month = d.getMonth();
  const day = d.getDate();
  d.setFullYear(d.getFullYear() + years);
  
  // Handle Feb 29 → Feb 28 in non-leap year
  if (month === 1 && day === 29 && !isLeapYear(d.getFullYear())) {
    d.setDate(28);
  }
  return d;
}

/**
 * Add weeks to a date
 */
export function addWeeks(date, weeks) {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

/**
 * Advance a date by one billing cycle
 */
export function advanceByCycle(date, cycle) {
  switch (cycle) {
    case 'weekly': return addWeeks(date, 1);
    case 'monthly': return addMonths(date, 1);
    case 'quarterly': return addMonths(date, 3);
    case 'annual': return addYears(date, 1);
    default: return addMonths(date, 1);
  }
}

/**
 * Calculate the next billing date for a subscription
 * Handles:
 * - Free trial periods (returns trial info if still in trial)
 * - All cycle types (weekly, monthly, quarterly, annual)
 * - Leap year edge cases
 * - Feb 29 subscriptions
 */
export function getNextBilling(subscription) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(subscription.startDate);
  startDate.setHours(0, 0, 0, 0);

  // ── FREE TRIAL HANDLING ──
  if (subscription.trialDays > 0) {
    const trialEndDate = new Date(startDate);
    trialEndDate.setDate(trialEndDate.getDate() + subscription.trialDays);
    trialEndDate.setHours(0, 0, 0, 0);
    
    if (today <= trialEndDate) {
      const daysLeft = Math.ceil((trialEndDate - today) / (1000 * 60 * 60 * 24));
      return {
        isTrial: true,
        trialEndsAt: trialEndDate,
        trialDaysLeft: daysLeft,
        nextChargeDate: trialEndDate,
        nextChargeAmount: subscription.amount,
        daysUntilCharge: daysLeft,
        urgency: daysLeft <= 2 ? 'urgent' : daysLeft <= 7 ? 'soon' : 'trial',
        label: daysLeft === 1 
          ? 'Essai se termine demain !' 
          : daysLeft === 0 
          ? "Essai se termine aujourd'hui !"
          : `Essai: ${daysLeft}j restants`,
      };
    }
    
    // Trial is over – first billing was on trial end date
    // Find next billing after trial
    let nextDate = new Date(trialEndDate);
    while (nextDate <= today) {
      nextDate = advanceByCycle(nextDate, subscription.cycle);
    }
    const days = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    return buildBillingResult(nextDate, days, subscription.amount, false);
  }

  // ── REGULAR BILLING ──
  // Find the next billing date by advancing from start until > today
  let nextDate = new Date(startDate);
  
  // If subscription started in the future, that IS the next billing
  if (nextDate > today) {
    const days = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    return buildBillingResult(nextDate, days, subscription.amount, false);
  }
  
  // Advance until we pass today
  let safety = 0;
  while (nextDate <= today && safety < 200) {
    nextDate = advanceByCycle(nextDate, subscription.cycle);
    safety++;
  }

  const days = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
  return buildBillingResult(nextDate, days, subscription.amount, false);
}

function buildBillingResult(date, daysUntil, amount, isTrial) {
  const urgency = daysUntil <= 0 ? 'today' : daysUntil <= 2 ? 'urgent' : daysUntil <= 7 ? 'soon' : 'ok';
  let label = '';
  if (daysUntil <= 0) label = "Aujourd'hui !";
  else if (daysUntil === 1) label = 'Demain';
  else if (daysUntil <= 7) label = `Dans ${daysUntil} jours`;
  else label = formatDate(date);
  
  return { isTrial, nextChargeDate: date, nextChargeAmount: amount, daysUntilCharge: daysUntil, urgency, label };
}

/**
 * Generate 12-month billing projection for Death Chart
 * Returns array of 12 monthly totals
 * Handles all cycle types, free trials, and non-active subs
 */
export function generate12MonthProjection(subscriptions) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Build month labels (current month + 11 more)
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + i);
    d.setDate(1);
    return { 
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth(),
      total: 0,
    };
  });

  subscriptions
    .filter(s => s.active)
    .forEach(sub => {
      const billing = getNextBilling(sub);
      
      // Cursor = first billing after today
      let cursor = new Date(billing.nextChargeDate);
      cursor.setHours(0, 0, 0, 0);
      
      let safety = 0;
      while (safety++ < 200) {
        const diffMonths = 
          (cursor.getFullYear() - today.getFullYear()) * 12 + 
          (cursor.getMonth() - today.getMonth());
        
        if (diffMonths >= 12) break;
        if (diffMonths >= 0) {
          months[diffMonths].total += billing.isTrial ? 0 : sub.amount;
        }
        
        cursor = advanceByCycle(cursor, sub.cycle);
      }
    });

  return months;
}

/**
 * Get the "period" date range label (weekly or monthly)
 */
export function getPeriodLabel(period) {
  const now = new Date();
  if (period === 'weekly') {
    const day = now.getDay(); // 0=Sun, 1=Mon
    const mon = new Date(now);
    mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return `${mon.getDate()} – ${sun.getDate()} ${sun.toLocaleDateString('fr-FR', { month: 'short' })}`;
  } else {
    return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }
}

/**
 * Days remaining in current period
 */
export function daysLeftInPeriod(period) {
  const now = new Date();
  if (period === 'weekly') {
    const day = now.getDay();
    return day === 0 ? 0 : 7 - day;
  } else {
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDay - now.getDate();
  }
}

/**
 * Format a date for display
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function formatDateFull(date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Check if a date is Feb 29
 * Used to show "leap year notice" on subscription detail
 */
export function isLeapDaySubscription(dateString) {
  const d = new Date(dateString);
  return d.getMonth() === 1 && d.getDate() === 29;
}

/**
 * Get the notification message for an upcoming subscription
 */
export function getNotificationMessage(sub, daysUntil) {
  const amount = sub.amount.toFixed(2);
  if (daysUntil <= 0) {
    return {
      title: `💳 Prélèvement aujourd'hui`,
      body: `${sub.name} – ${amount}€ sera débité aujourd'hui`,
    };
  }
  if (daysUntil === 1) {
    return {
      title: `⚠️ Prélèvement demain`,
      body: `${sub.name} – ${amount}€ sera débité demain`,
    };
  }
  return {
    title: `🔔 Prélèvement dans ${daysUntil} jours`,
    body: `${sub.name} – ${amount}€ le ${formatDate(new Date())}`,
  };
}

/**
 * Trial expiry warning
 */
export function getTrialWarning(sub) {
  const billing = getNextBilling(sub);
  if (!billing.isTrial) return null;
  if (billing.trialDaysLeft <= 3) {
    return `⏰ Essai gratuit se termine dans ${billing.trialDaysLeft} jour${billing.trialDaysLeft > 1 ? 's' : ''} !`;
  }
  return null;
}

/**
 * Format currency
 */
export function formatCurrency(amount, currency = '€') {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k${currency}`;
  }
  return `${amount.toFixed(2)}${currency}`;
}

export function formatCurrencyShort(amount) {
  return `${amount.toFixed(2)} €`;
}

/**
 * Compute annual equivalent of any cycle
 */
export function annualEquivalent(amount, cycle) {
  switch (cycle) {
    case 'weekly': return amount * 52;
    case 'monthly': return amount * 12;
    case 'quarterly': return amount * 4;
    case 'annual': return amount;
    default: return amount * 12;
  }
}

/**
 * Compute monthly equivalent of any cycle
 */
export function monthlyEquivalent(amount, cycle) {
  switch (cycle) {
    case 'weekly': return (amount * 52) / 12;
    case 'monthly': return amount;
    case 'quarterly': return amount / 3;
    case 'annual': return amount / 12;
    default: return amount;
  }
}

/**
 * Get today's ISO string for default date inputs
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Budget period multiplier (how many times weekly budget fits in current month)
 * Handles months with 4 or 5 weeks, and accounts for exact days
 */
export function weeklyBudgetForCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDays = daysInMonth(year, month);
  return totalDays / 7;
}
