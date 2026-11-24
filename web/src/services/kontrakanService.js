import { apiClient } from "../config/api";

// Endpoint /api/kontrakan (tambah/ubah/hapus wajib login sebagai pemilik kos)
const kontrakanService = {
  getAll: (sort = "termurah") => apiClient.get("/kontrakan", { params: { sort } }),
  getById: (id) => apiClient.get(`/kontrakan/${id}`),
  create: (data) => apiClient.post("/kontrakan", data),
  update: (id, data) => apiClient.put(`/kontrakan/${id}`, data),
  remove: (id) => apiClient.delete(`/kontrakan/${id}`),
};

export default kontrakanService;
