import { Injectable, inject } from "@angular/core";
import { ApiService } from "./api.service";
import { Observable, BehaviorSubject } from "rxjs";

export interface ProductRating {
  id?: number;
  product: number;
  session_id: string;
  rating: number;
  comment?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RatingStats {
  product_id: number;
  ratings: ProductRating[];
  average_rating: number;
  total_reviews: number;
}

@Injectable({
  providedIn: "root",
})
export class RatingService {
  private api = inject(ApiService);
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem("session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("session_id", sessionId);
    }
    return sessionId;
  }

  /**
   * Guardar o actualizar calificación de un producto
   */
  rateProduct(
    productId: number,
    rating: number,
    comment?: string,
  ): Observable<ProductRating> {
    return this.api.post(`/ecommerce/ratings/rate_product/`, {
      product_id: productId,
      session_id: this.sessionId,
      rating,
      comment: comment || "",
    });
  }

  /**
   * Obtener calificaciones de un producto
   */
  getProductRatings(productId: number): Observable<RatingStats> {
    return this.api.get<RatingStats>(
      `/ecommerce/ratings/by_product/?product_id=${productId}`,
    );
  }

  /**
   * Obtener calificación del usuario actual para un producto
   */
  getUserRating(productId: number): Observable<any> {
    return this.api.get(
      `/ecommerce/ratings/user_rating/?product_id=${productId}&session_id=${this.sessionId}`,
    );
  }

  /**
   * Obtener session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}
