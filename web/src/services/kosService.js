import { apiClient } from "../config/api";

// Endpoint /api/kos (tambah/ubah/hapus wajib login sebagai pemilik kos)
const kosService = {
  getAll: (sort = "termurah") => apiClient.get("/kos", { params: { sort } }),
  getById: (id) => apiClient.get(`/kos/${id}`),
  create: (data) => apiClient.post("/kos", data),
  update: (id, data) => apiClient.put(`/kos/${id}`, data),
  remove: (id) => apiClient.delete(`/kos/${id}`),
};

export default kosService;
