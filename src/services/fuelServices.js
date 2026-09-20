import { supabase } from '../lib/supabase';

export async function getFuelLogs(userId, vehicleId = null) {
  let query = supabase
    .from('fuel_logs')
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

export async function getFuelLog(fuelId, userId) {
  const { data, error } = await supabase
    .from('fuel_logs')
    .select('*')
    .eq('id', fuelId)
    .eq('user_id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createFuelLog(fuelLog, userId) {
  const { data, error } = await supabase
    .from('fuel_logs')
    .insert({
      ...fuelLog,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateFuelLog(fuelId, fuelLog, userId) {
  const { data, error } = await supabase
    .from('fuel_logs')
    .update(fuelLog)
    .eq('id', fuelId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteFuelLog(fuelId, userId) {
  const { error } = await supabase
    .from('fuel_logs')
    .delete()
    .eq('id', fuelId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}