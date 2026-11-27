import { supabase } from "../config/supabaseClient.js";

// Tabel schedule_slots: jadwal kosong milik pemilik kos
export const ScheduleModel = {
  // Jadwal milik satu pemilik mulai tanggal tertentu
  async getByOwner(ownerId, fromDate) {
    const { data, error } = await supabase
      .from("schedule_slots")
      .select("*")
      .eq("owner_id", ownerId)
      .gte("slot_date", fromDate)
      .order("slot_date", { ascending: true });
    if (error) throw error;
    return data;
  },

  // Jadwal milik satu pemilik pada satu tanggal (untuk cek tabrakan)
  async getByOwnerAndDate(ownerId, date) {
    const { data, error } = await supabase
      .from("schedule_slots")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("slot_date", date);
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("schedule_slots")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getByIds(ids) {
    if (!ids.length) return [];
    const { data, error } = await supabase.from("schedule_slots").select("*").in("id", ids);
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from("schedule_slots")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase.from("schedule_slots").delete().eq("id", id);
    if (error) throw error;
  },
};
