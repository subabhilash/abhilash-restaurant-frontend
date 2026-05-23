"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuService } from "@/services/menu.service";

export const menuKeys = {
  categories: (p?: Record<string, string>) => ["menu", "categories", p] as const,
  items: (p?: Record<string, string>) => ["menu", "items", p] as const,
  public: (slug: string) => ["menu", "public", slug] as const,
};

export function useCategories(params?: Record<string, string>) {
  return useQuery({ queryKey: menuKeys.categories(params), queryFn: () => menuService.listCategories(params) });
}
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: menuService.createCategory, onSuccess: () => qc.invalidateQueries({ queryKey: ["menu", "categories"] }) });
}
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => menuService.updateCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu", "categories"] }),
  });
}
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => menuService.deleteCategory(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["menu"] }) });
}
export function useMenuItems(params?: Record<string, string>) {
  return useQuery({ queryKey: menuKeys.items(params), queryFn: () => menuService.listItems(params) });
}
export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: menuService.createItem, onSuccess: () => qc.invalidateQueries({ queryKey: ["menu", "items"] }) });
}
export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => menuService.updateItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu", "items"] }),
  });
}
export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => menuService.deleteItem(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["menu"] }) });
}
export function usePublicMenu(slug: string) {
  return useQuery({ queryKey: menuKeys.public(slug), queryFn: () => menuService.publicMenu(slug), enabled: !!slug, staleTime: 5 * 60 * 1000 });
}
