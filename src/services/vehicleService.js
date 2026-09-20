import { supabase } from '../lib/supabase';

export async function getVehicles(userId) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getVehicle(vehicleId, userId) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .eq('user_id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createVehicle(vehicle, userId) {
  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      ...vehicle,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateVehicle(vehicleId, vehicle, userId) {
  const { data, error } = await supabase
    .from('vehicles')
    .update(vehicle)
    .eq('id', vehicleId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteVehicle(vehicleId, userId) {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}