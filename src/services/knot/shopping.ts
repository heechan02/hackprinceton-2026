import { knotFetch } from "./client";
import type { CartItem } from "@/types/domain";

export async function syncCart(items: CartItem[]): Promise<{ cartId: string }> {
  return knotFetch("/shopping/cart/sync", {
    method: "POST",
    body: JSON.stringify({ items }),
  }) as Promise<{ cartId: string }>;
}

export async function checkout(cartId: string): Promise<{ orderId: string }> {
  return knotFetch("/shopping/checkout", {
    method: "POST",
    body: JSON.stringify({ cartId }),
  }) as Promise<{ orderId: string }>;
}
