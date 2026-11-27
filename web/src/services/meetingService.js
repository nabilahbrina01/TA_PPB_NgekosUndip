import { apiClient } from "../config/api";

// Endpoint /api/meetings (pengajuan jadwal kunjungan)
const meetingService = {
  request: (data) => apiClient.post("/meetings", data),             // pencari mengajukan
  getMine: () => apiClient.get("/meetings/mine"),                    // pengajuan saya (pencari)
  getIncoming: () => apiClient.get("/meetings/incoming"),            // pengajuan masuk (pemilik)
  setStatus: (id, status, ownerNote) =>
    apiClient.patch(`/meetings/${id}/status`, { status, owner_note: ownerNote }),
  cancel: (id) => apiClient.patch(`/meetings/${id}/cancel`),
};

export default meetingService;
