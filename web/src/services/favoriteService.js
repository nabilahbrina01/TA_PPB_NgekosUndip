import { apiClient } from "../config/api";

// Endpoint /api/favorites (wajib login)
const favoriteService = {
  getAll: () => apiClient.get("/favorites"),
  add: (item_type, item_id) => apiClient.post("/favorites", { item_type, item_id }),
  remove: (type, id) => apiClient.delete(`/favorites/${type}/${id}`),
};

export default favoriteService;
