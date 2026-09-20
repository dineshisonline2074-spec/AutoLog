import { supabase } from '../lib/supabase';

export async function getExpenses(userId, vehicleId = null) {
  let query = supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getExpense(expenseId, userId) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', expenseId)
    .eq('user_id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createExpense(expense, userId) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      ...expense,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateExpense(expenseId, expense, userId) {
  const { data, error } = await supabase
    .from('expenses')
    .update(expense)
    .eq('id', expenseId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteExpense(expenseId, userId) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}