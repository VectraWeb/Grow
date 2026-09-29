import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class NavigationService {
  private searchQuerySubject = new BehaviorSubject<string>("");
  public searchQuery$ = this.searchQuerySubject.asObservable();

  private categorySubject = new BehaviorSubject<string>("todos");
  public category$ = this.categorySubject.asObservable();

  setSearchQuery(query: string): void {
    this.searchQuerySubject.next(query);
  }

  setCategory(category: string): void {
    this.categorySubject.next(category);
  }
}
