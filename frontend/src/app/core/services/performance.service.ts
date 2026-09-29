// Performance & Optimization Service for Angular Frontend
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

/**
 * Servicio de optimización y rendimiento
 * Maneja: caching, lazy loading, compresión, etc.
 */
@Injectable({
  providedIn: "root",
})
export class PerformanceService {
  private cacheStore = new Map<string, CacheEntry>();
  private performanceMetrics$ = new BehaviorSubject<PerformanceMetric[]>([]);

  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_CACHE_SIZE = 50;

  constructor() {
    this.initializePerformanceMonitoring();
  }

  /**
   * Obtener datos con caché
   */
  public getWithCache<T>(
    key: string,
    fetcher: () => Observable<T>,
  ): Observable<T> {
    const cached = this.getFromCache<T>(key);
    if (cached) {
      return new Observable((observer) => {
        observer.next(cached);
        observer.complete();
      });
    }

    return new Observable((observer) => {
      fetcher().subscribe(
        (data: T) => {
          this.setCache(key, data);
          observer.next(data);
          observer.complete();
        },
        (error) => observer.error(error),
      );
    });
  }

  /**
   * Compresión de imágenes base64
   */
  public compressImage(dataUrl: string, quality: number = 0.7): string {
    const canvas = document.createElement("canvas");
    const img = document.createElement("img");

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
    };
    img.src = dataUrl;

    return canvas.toDataURL("image/jpeg", quality);
  }

  /**
   * Lazy loading de imágenes
   */
  public setupLazyLoading(): void {
    if ("IntersectionObserver" in window) {
      const images = document.querySelectorAll("img[data-lazy]");
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset["lazy"] || "";
            img.removeAttribute("data-lazy");
            imageObserver.unobserve(entry.target);
          }
        });
      });

      images.forEach((img) => imageObserver.observe(img));
    }
  }

  /**
   * Monitorear rendimiento
   */
  private initializePerformanceMonitoring(): void {
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.logPerformanceMetric({
              name: entry.name,
              duration: (entry as any).duration,
              type: entry.entryType,
            });
          }
        });

        observer.observe({ entryTypes: ["navigation", "resource", "paint"] });
      } catch (e) {
        console.warn("PerformanceObserver no soportado");
      }
    }
  }

  /**
   * Log de métricas
   */
  private logPerformanceMetric(metric: PerformanceMetric): void {
    const metrics = this.performanceMetrics$.value;
    metrics.push(metric);
    if (metrics.length > 100) metrics.shift();
    this.performanceMetrics$.next(metrics);
  }

  /**
   * Obtener métricas de rendimiento
   */
  public getPerformanceMetrics(): Observable<PerformanceMetric[]> {
    return this.performanceMetrics$.asObservable();
  }

  // Private cache methods
  private getFromCache<T>(key: string): T | null {
    const entry = this.cacheStore.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cacheStore.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache(key: string, data: any): void {
    if (this.cacheStore.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cacheStore.keys().next().value;
      this.cacheStore.delete(firstKey);
    }

    this.cacheStore.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Limpiar caché
   */
  public clearCache(): void {
    this.cacheStore.clear();
  }
}

// Interfaces
interface CacheEntry {
  data: any;
  timestamp: number;
}

interface PerformanceMetric {
  name: string;
  duration: number;
  type: string;
}
