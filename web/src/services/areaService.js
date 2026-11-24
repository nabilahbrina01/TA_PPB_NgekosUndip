import { apiClient } from "../config/api";

// Endpoint /api/areas
const areaService = {
  getAll: () => apiClient.get("/areas"),
};

export default areaService;
