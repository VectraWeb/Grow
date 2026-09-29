import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Calculator, Paintbrush, Grid3X3, Hammer, Ruler, AlertCircle, ShoppingCart, Plus, Minus } from 'lucide-angular';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-material-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DialogModule],
  templateUrl: './material-calculator.component.html',
  styleUrls: ['./material-calculator.component.css']
})
export class MaterialCalculatorComponent implements OnInit {
  @Input() categoryName: string = '';
  @Input() productName: string = '';
  
  visible: boolean = false;
  calculatorType: 'paint' | 'tiles' | 'mix' | 'none' = 'none';

  // Paint Calculator
  paintArea: number = 0;
  paintLayers: number = 2;
  paintYield: number = 10; // m2 per liter
  paintResult: number = 0;

  // Tiles Calculator
  tilesArea: number = 0;
  tilesWaste: number = 10; // percentage
  tilesBoxSize: number = 1.8; // m2 per box
  tilesResult: number = 0;

  // Mix Calculator (Contrapiso)
  mixArea: number = 0;
  mixThickness: number = 5; // cm
  mixResult: number = 0; // bags of cement

  Math = Math;

  readonly Calculator = Calculator;
  readonly Paintbrush = Paintbrush;
  readonly Grid3X3 = Grid3X3;
  readonly Hammer = Hammer;
  readonly Ruler = Ruler;
  readonly AlertCircle = AlertCircle;
  readonly ShoppingCart = ShoppingCart;
  readonly Plus = Plus;
  readonly Minus = Minus;

  ngOnInit() {
    this.detectType();
  }

  detectType() {
    const cat = this.categoryName.toLowerCase();
    const prod = this.productName.toLowerCase();

    if (cat.includes('pintura') || prod.includes('pintura') || prod.includes('latex')) {
      this.calculatorType = 'paint';
    } else if (cat.includes('piso') || cat.includes('ceramico') || cat.includes('porcelanato')) {
      this.calculatorType = 'tiles';
    } else if (cat.includes('construccion') || cat.includes('cemento') || prod.includes('cemento') || prod.includes('mezcla')) {
      this.calculatorType = 'mix';
    } else {
      // Default to one or allow selection if not detected
      this.calculatorType = 'paint'; 
    }
  }

  showDialog() {
    this.visible = true;
  }

  calculatePaint() {
    if (this.paintArea <= 0) {
      this.paintResult = 0;
      return;
    }
    this.paintResult = Math.ceil((this.paintArea / this.paintYield) * this.paintLayers);
  }

  calculateTiles() {
    if (this.tilesArea <= 0) {
      this.tilesResult = 0;
      return;
    }
    const totalArea = this.tilesArea * (1 + (this.tilesWaste / 100));
    this.tilesResult = Math.ceil(totalArea / this.tilesBoxSize);
  }

  calculateMix() {
    if (this.mixArea <= 0) {
      this.mixResult = 0;
      return;
    }
    // Standard contrapiso: ~6 bags of cement (50kg) per m3
    const volumeM3 = this.mixArea * (this.mixThickness / 100);
    this.mixResult = Math.ceil(volumeM3 * 6);
  }

  get canShow(): boolean {
    return true;
  }
}
