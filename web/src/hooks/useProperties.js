import areaService from "../services/areaService";
import kontrakanService from "../services/kontrakanService";
import kosService from "../services/kosService";
import { useAsync } from "./useAsync";

// Custom hooks untuk mengambil data dari services.
// Masing-masing mengembalikan { data, loading, error, reload }.

export const useAreas = () => useAsync(() => areaService.getAll(), []);

export const useKosList = (sort = "termurah") =>
  useAsync(() => kosService.getAll(sort), [sort]);

export const useKontrakanList = (sort = "termurah") =>
  useAsync(() => kontrakanService.getAll(sort), [sort]);

export const useKosById = (id) => useAsync(() => kosService.getById(id), [id]);

export const useKontrakanById = (id) =>
  useAsync(() => kontrakanService.getById(id), [id]);
