import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable, catchError, of } from "rxjs";
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

  // Categories are loaded from the API. We no longer use hardcoded fallback categories
  // to ensure that the owner has full control over their own category structure.
  
  constructor() {
    this.loadCategories();
  }

  loadCategories(): Observable<Category[]> {
    return this.api.get<Category[]>("/categories/").pipe(
      tap((categories: any) => {
        // Handle both paginated and non-paginated responses
        const data = categories.results || categories;
        this.categoriesSubject.next(data);
      }),
      catchError((error) => {
        console.warn(
          "Failed to load categories from API",
          error,
        );
        this.categoriesSubject.next([]);
        return of([]);
      }),
    );
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
