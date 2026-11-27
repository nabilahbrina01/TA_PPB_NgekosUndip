import { supabase } from "../config/supabaseClient.js";

export const ACTIVE_STATUSES = ["menunggu", "diterima"];

// Tabel meetings: pengajuan jadwal dari pencari kos
export const MeetingModel = {
  async getById(id) {
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // Pengajuan aktif (menunggu / diterima) pada beberapa jadwal sekaligus
  async getActiveBySlots(slotIds) {
    if (!slotIds.length) return [];
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .in("slot_id", slotIds)
      .in("status", ACTIVE_STATUSES);
    if (error) throw error;
    return data;
  },

  // Semua pengajuan (status apa pun) pada beberapa jadwal
  async getBySlots(slotIds) {
    if (!slotIds.length) return [];
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .in("slot_id", slotIds)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },

  async getBySeeker(seekerId) {
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("seeker_id", seekerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByOwner(ownerId) {
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },

  // Pertemuan yang sudah diterima milik seorang pencari (untuk cek bentrok)
  async getAcceptedBySeeker(seekerId) {
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("seeker_id", seekerId)
      .eq("status", "diterima");
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from("meetings")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Ubah status hanya jika status sekarang masih salah satu dari `fromStatuses`
  // (mencegah dua aksi bersamaan saling menimpa)
  async updateStatus(id, fromStatuses, changes) {
    const { data, error } = await supabase
      .from("meetings")
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq("id", id)
      .in("status", fromStatuses)
      .select();
    if (error) throw error;
    return data?.[0] || null;
  },

  // Tolak otomatis pengajuan lain yang masih menunggu pada jadwal yang sama
  async rejectOtherPending(slotId, exceptId, note) {
    const { data, error } = await supabase
      .from("meetings")
      .update({ status: "ditolak", owner_note: note, updated_at: new Date().toISOString() })
      .eq("slot_id", slotId)
      .eq("status", "menunggu")
      .neq("id", exceptId)
      .select();
    if (error) throw error;
    return data || [];
  },
};
