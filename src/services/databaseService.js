// src/services/databaseService.js
import { supabase } from '../utils/supabase';

export const DatabaseService = {
  // Profiles
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    if (error) throw error;
    return data;
  },

  // Categories
  async getCategories(userId) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async addCategory(userId, category) {
    const insertData = {
      user_id: userId,
      name: category.name,
      icon: category.icon,
      color: category.color,
      budget: parseFloat(category.budget) || 0,
      cycle: category.cycle || 'monthly'
    };
    const { data, error } = await supabase
      .from('categories')
      .insert([insertData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCategory(categoryId, updates) {
    const sanitizeUpdates = {};
    if (updates.name) sanitizeUpdates.name = updates.name;
    if (updates.icon) sanitizeUpdates.icon = updates.icon;
    if (updates.color) sanitizeUpdates.color = updates.color;
    if (updates.budget !== undefined) sanitizeUpdates.budget = parseFloat(updates.budget);
    if (updates.cycle) sanitizeUpdates.cycle = updates.cycle;

    const { data, error } = await supabase
      .from('categories')
      .update(sanitizeUpdates)
      .eq('id', categoryId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCategory(categoryId) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);
    if (error) throw error;
  },

  // Transactions
  async getTransactions(userId) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    // Map database snake_case to app camelCase if needed (though transactions are mostly flat)
    return data;
  },

  async addTransaction(userId, transaction) {
    const insertData = {
      user_id: userId,
      amount: parseFloat(transaction.amount),
      type: transaction.type,
      category_id: transaction.category_id,
      icon: transaction.icon || '💳',
      color: transaction.color || '#6B7280',
      note: transaction.note || '',
      date: transaction.date
    };
    const { data, error } = await supabase
      .from('transactions')
      .insert([insertData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteTransaction(transactionId) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);
    if (error) throw error;
  },

  // Subscriptions
  async getSubscriptions(userId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    
    // Map snake_case database to camelCase UI
    return (data || []).map(s => ({
      ...s,
      startDate: s.start_date,
      trialDays: s.trial_days
    }));
  },

  async addSubscription(userId, sub) {
    const insertData = {
      user_id: userId,
      name: sub.name,
      icon: sub.icon,
      color: sub.color,
      amount: parseFloat(sub.amount),
      cycle: sub.cycle || 'monthly',
      start_date: sub.startDate || new Date().toISOString(),
      trial_days: sub.trialDays || 0,
      category: sub.category || 'Streaming',
      active: sub.active !== undefined ? sub.active : true
    };
    
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([insertData])
      .select()
      .single();
    if (error) throw error;
    
    // Map back to camelCase for the UI
    return {
      ...data,
      startDate: data.start_date,
      trialDays: data.trial_days
    };
  },

  async updateSubscription(subscriptionId, updates) {
    const sanitizeUpdates = { ...updates };
    if (updates.startDate) {
      sanitizeUpdates.start_date = updates.startDate;
      delete sanitizeUpdates.startDate;
    }
    if (updates.trialDays !== undefined) {
      sanitizeUpdates.trial_days = updates.trialDays;
      delete sanitizeUpdates.trialDays;
    }
    if (updates.leapDayStart !== undefined) {
      sanitizeUpdates.leap_day_start = updates.leapDayStart;
      delete sanitizeUpdates.leapDayStart;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update(sanitizeUpdates)
      .eq('id', subscriptionId)
      .select()
      .single();
    if (error) throw error;
    
    return {
      ...data,
      startDate: data.start_date,
      trialDays: data.trial_days,
      leapDayStart: data.leap_day_start
    };
  },

  async deleteSubscription(subscriptionId) {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId);
    if (error) throw error;
  },

  // Hybrid email discovery
  async getEmailConnections(userId) {
    const { data, error } = await supabase
      .from('email_connections')
      .select('*')
      .eq('user_id', userId)
      .order('connected_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async upsertEmailConnection(userId, connection) {
    const payload = {
      user_id: userId,
      provider: connection.provider,
      email: connection.email,
      provider_user_id: connection.providerUserId || null,
      access_token: connection.accessToken || null,
      refresh_token: connection.refreshToken || null,
      scopes: connection.scopes || [],
      status: connection.status || 'connected',
      last_error: connection.lastError || null,
      last_scanned_at: connection.lastScannedAt || null,
    };

    const { data, error } = await supabase
      .from('email_connections')
      .upsert(payload, { onConflict: 'user_id,provider,email' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getScanHistory(userId) {
    const { data, error } = await supabase
      .from('scan_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data || [];
  },

  async createScanHistory(userId, scan) {
    const payload = {
      user_id: userId,
      connection_id: scan.connectionId || null,
      provider: scan.provider,
      source_email: scan.sourceEmail || null,
      status: scan.status || 'started',
      emails_scanned: scan.emailsScanned || 0,
      subscriptions_found: scan.subscriptionsFound || 0,
      error_message: scan.errorMessage || null,
      metadata: scan.metadata || {},
    };

    const { data, error } = await supabase
      .from('scan_history')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateScanHistory(scanId, updates) {
    const payload = {
      status: updates.status,
      emails_scanned: updates.emailsScanned,
      subscriptions_found: updates.subscriptionsFound,
      error_message: updates.errorMessage,
      metadata: updates.metadata,
    };

    const { data, error } = await supabase
      .from('scan_history')
      .update(payload)
      .eq('id', scanId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getDetectedSubscriptions(userId) {
    const { data, error } = await supabase
      .from('detected_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      startDate: item.start_date,
      trialDays: item.raw_payload?.trialDays || 0,
      trialEndsAt: item.raw_payload?.trialEndsAt || null,
      rawPayload: item.raw_payload,
      importedSubscriptionId: item.imported_subscription_id,
      sourceEmail: item.source_email,
    }));
  },

  async replaceDetectedSubscriptions(userId, items, meta = {}) {
    if (meta.provider || meta.sourceEmail) {
      let query = supabase
        .from('detected_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (meta.provider) query = query.eq('provider', meta.provider);
      if (meta.sourceEmail) query = query.eq('source_email', meta.sourceEmail);

      const { error: deleteError } = await query;
      if (deleteError) throw deleteError;
    }

    if (!items.length) return [];

    const payload = items.map(item => ({
      user_id: userId,
      scan_id: meta.scanId || null,
      provider: item.provider || meta.provider || 'manual',
      source_email: item.sourceEmail || meta.sourceEmail || null,
      external_key: item.externalKey || `${(item.name || '').toLowerCase()}_${item.provider || meta.provider || 'manual'}`,
      name: item.name,
      icon: item.icon || null,
      color: item.color || null,
      amount: parseFloat(item.amount) || 0,
      cycle: item.cycle || 'monthly',
      category: item.category || 'Autre',
      start_date: item.startDate || new Date().toISOString(),
      confidence: item.confidence ?? null,
      raw_payload: item.rawPayload || item,
      status: item.status || 'pending',
    }));

    const { data, error } = await supabase
      .from('detected_subscriptions')
      .insert(payload)
      .select();
    if (error) throw error;

    return (data || []).map(item => ({
      ...item,
      startDate: item.start_date,
      trialDays: item.raw_payload?.trialDays || 0,
      trialEndsAt: item.raw_payload?.trialEndsAt || null,
      rawPayload: item.raw_payload,
      importedSubscriptionId: item.imported_subscription_id,
      sourceEmail: item.source_email,
    }));
  },

  async markDetectedSubscriptionStatus(id, updates) {
    const payload = {};
    if (updates.status) payload.status = updates.status;
    if (updates.importedSubscriptionId !== undefined) {
      payload.imported_subscription_id = updates.importedSubscriptionId;
    }

    const { data, error } = await supabase
      .from('detected_subscriptions')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    return {
      ...data,
      startDate: data.start_date,
      trialDays: data.raw_payload?.trialDays || 0,
      trialEndsAt: data.raw_payload?.trialEndsAt || null,
      rawPayload: data.raw_payload,
      importedSubscriptionId: data.imported_subscription_id,
      sourceEmail: data.source_email,
    };
  },

  async seedDefaultCategories(userId) {
    const { DEFAULT_CATEGORIES } = require('../data/initialData');
    
    const insertData = DEFAULT_CATEGORIES.map(cat => ({
      user_id: userId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      budget: 0,
      cycle: 'monthly'
    }));
    
    const { data, error } = await supabase
      .from('categories')
      .insert(insertData)
      .select();
    if (error) throw error;
    return data;
  },

  // Reset all user data
  async resetAllData(userId) {
    // Delete in order: transactions, subscriptions, categories
    const { error: txError } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId);
    if (txError) throw txError;

    const { error: subError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);
    if (subError) throw subError;

    const { error: catError } = await supabase
      .from('categories')
      .delete()
      .eq('user_id', userId);
    if (catError) throw catError;

    // Optionally delete detected subscriptions and scan history
    await supabase.from('detected_subscriptions').delete().eq('user_id', userId);
    await supabase.from('scan_history').delete().eq('user_id', userId);
  }
};
