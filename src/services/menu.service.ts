import { apiClient } from "@/lib/axios";
import type { Category, MenuItem, PublicMenuResponse } from "@/types/menu.types";
import type { PaginatedResponse } from "@/types/api.types";

export const menuService = {
  listCategories: (params?: Record<string, string>) =>
    apiClient.get<PaginatedResponse<Category>>("/menu/categories", { params }).then((r) => r.data),
  createCategory: (data: object) =>
    apiClient.post<Category>("/menu/categories", data).then((r) => r.data),
  updateCategory: (id: number, data: object) =>
    apiClient.patch<Category>(`/menu/categories/${id}`, data).then((r) => r.data),
  deleteCategory: (id: number) =>
    apiClient.delete(`/menu/categories/${id}`).then((r) => r.data),

  listItems: (params?: Record<string, string>) =>
    apiClient.get<PaginatedResponse<MenuItem>>("/menu/items", { params }).then((r) => r.data),
  createItem: (data: object) =>
    apiClient.post<MenuItem>("/menu/items", data).then((r) => r.data),
  updateItem: (id: number, data: object) =>
    apiClient.patch<MenuItem>(`/menu/items/${id}`, data).then((r) => r.data),
  deleteItem: (id: number) =>
    apiClient.delete(`/menu/items/${id}`).then((r) => r.data),

  publicMenu: (slug: string) =>
    apiClient.get<PublicMenuResponse>(`/menu/public/${slug}`).then((r) => r.data),
};
