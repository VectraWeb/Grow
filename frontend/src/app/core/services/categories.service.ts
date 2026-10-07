import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable, catchError, of, shareReplay } from "rxjs";
import { ApiService } from "./api.service";
import { tap } from "rxjs/operators";

export interface Category {
  id: number | string;
  name: string;
}

@Injectable({
  providedIn: "root",
})
export class CategoriesService {
  private api = inject(ApiService);
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();
  private request$: Observable<Category[]> | null = null;
  private loaded = false;

  // Categories are loaded from the API. We no longer use hardcoded fallback categories
  // to ensure that the owner has full control over their own category structure.

  // Una sola petición compartida (shareReplay): múltiples componentes
  // suscritos reutilizan el mismo request en vuelo y el resultado cacheado.
  loadCategories(force = false): Observable<Category[]> {
    if (this.loaded && !force) {
      return of(this.categoriesSubject.getValue());
    }
    if (this.request$ && !force) {
      return this.request$;
    }
    this.request$ = this.api.get<Category[]>("/categories/").pipe(
      tap((categories: any) => {
        // Handle both paginated and non-paginated responses
        const data = categories.results || categories;
        this.loaded = true;
        this.categoriesSubject.next(data);
      }),
      shareReplay(1),
      catchError((error) => {
        console.warn(
          "Failed to load categories from API",
          error,
        );
        this.request$ = null;
        this.categoriesSubject.next([]);
        return of([]);
      }),
    );
    return this.request$;
  }

  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  getCategoriesArray(): Category[] {
    return this.categoriesSubject.getValue();
  }

  getCategoryName(id: number | string): string {
    const categories = this.categoriesSubject.getValue();
    const category = categories.find((c) => c.id === id || c.id === String(id));
    return category ? category.name : String(id);
  }
}
