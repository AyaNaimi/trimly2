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

  async seedDefaultCategories(userId) {
    const defaultCategories = [
      { name: 'Streaming', icon: '🎬', color: '#E50914' },
      { name: 'Musique', icon: '🎵', color: '#1DB954' },
      { name: 'Stockage', icon: '☁️', color: '#4285F4' },
      { name: 'Productivité', icon: '📝', color: '#000000' },
      { name: 'Santé & Sport', icon: '💪', color: '#22C55E' },
      { name: 'Sécurité', icon: '🔒', color: '#4687FF' },
      { name: 'IA', icon: '🤖', color: '#10A37F' },
      { name: 'Shopping', icon: '📦', color: '#FF9900' },
      { name: 'Autre', icon: '📦', color: '#6B7280' },
    ];
    
    const insertData = defaultCategories.map(cat => ({
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
  }
};
