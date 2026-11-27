import { apiClient } from "../config/api";

// Endpoint /api/schedules (jadwal kosong pemilik kos)
const scheduleService = {
  getByOwner: (ownerId) => apiClient.get(`/schedules/owner/${ownerId}`), // dilihat pencari
  getMine: () => apiClient.get("/schedules/mine"),                       // milik pemilik
  create: (data) => apiClient.post("/schedules", data),
  remove: (id) => apiClient.delete(`/schedules/${id}`),
};

export default scheduleService;
