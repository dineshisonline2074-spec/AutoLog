import { supabase } from '../lib/supabase';

export async function getMaintenanceRecords(
  userId,
  vehicleId = null
) {
  let query = supabase
    .from('maintenance_records')
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

export async function getMaintenanceRecord(recordId, userId) {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('id', recordId)
    .eq('user_id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createMaintenanceRecord(record, userId) {
  const { data, error } = await supabase
    .from('maintenance_records')
    .insert({
      ...record,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateMaintenanceRecord(
  recordId,
  record,
  userId
) {
  const { data, error } = await supabase
    .from('maintenance_records')
    .update(record)
    .eq('id', recordId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteMaintenanceRecord(recordId, userId) {
  const { error } = await supabase
    .from('maintenance_records')
    .delete()
    .eq('id', recordId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}