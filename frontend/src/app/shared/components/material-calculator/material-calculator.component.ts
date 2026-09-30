import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Calculator,
  Sprout,
  Sun,
  Wind,
  AlertCircle,
  Plus,
  Minus,
  Droplets,
  Zap
} from 'lucide-angular';
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
  calculatorType: 'substrate' | 'light' | 'ventilation' = 'substrate';

  // 1. Calculadora de Sustrato & Macetas
  potCount: number = 4;
  potSize: number = 11; // Litros por maceta
  extraMargin: number = 10; // % margen de asentamiento/relleno
  substrateResult: number = 49; // Litros totales
  bagsResult: number = 1; // Bolsas de 50L

  // 2. Calculadora de Iluminación LED
  tentWidth: number = 80; // cm
  tentLength: number = 80; // cm
  lightResult: number = 240; // Watts recomendados
  plantCapacity: string = '4 a 6 plantas';

  // 3. Calculadora de Extracción & Clima
  tentWidthM: number = 0.8; // m
  tentLengthM: number = 0.8; // m
  tentHeightM: number = 1.6; // m
  ventResult: number = 80; // m3/h extractor recomendado
  tentVolume: number = 1.02; // m3

  Math = Math;

  readonly Calculator = Calculator;
  readonly Sprout = Sprout;
  readonly Sun = Sun;
  readonly Wind = Wind;
  readonly AlertCircle = AlertCircle;
  readonly Droplets = Droplets;
  readonly Zap = Zap;
  readonly Plus = Plus;
  readonly Minus = Minus;

  ngOnInit() {
    this.detectType();
    this.calculateSubstrate();
    this.calculateLight();
    this.calculateVentilation();
  }

  detectType() {
    const cat = (this.categoryName || '').toLowerCase();
    const prod = (this.productName || '').toLowerCase();

    if (cat.includes('sustrato') || cat.includes('tierra') || prod.includes('sustrato') || prod.includes('maceta')) {
      this.calculatorType = 'substrate';
    } else if (cat.includes('luz') || cat.includes('iluminac') || cat.includes('led') || prod.includes('panel') || prod.includes('led')) {
      this.calculatorType = 'light';
    } else if (cat.includes('vent') || cat.includes('clima') || cat.includes('carpa') || prod.includes('extractor') || prod.includes('carpa')) {
      this.calculatorType = 'ventilation';
    } else {
      this.calculatorType = 'substrate';
    }
  }

  showDialog() {
    this.visible = true;
  }

  setPotSize(size: number) {
    this.potSize = size;
    this.calculateSubstrate();
  }

  calculateSubstrate() {
    if (this.potCount <= 0 || this.potSize <= 0) {
      this.substrateResult = 0;
      this.bagsResult = 0;
      return;
    }
    const rawLiters = this.potCount * this.potSize;
    const total = Math.ceil(rawLiters * (1 + this.extraMargin / 100));
    this.substrateResult = total;
    this.bagsResult = Math.max(1, Math.ceil(total / 50));
  }

  setTentDimensions(w: number, l: number, h: number = 1.6) {
    this.tentWidth = w;
    this.tentLength = l;
    this.tentWidthM = w / 100;
    this.tentLengthM = l / 100;
    this.tentHeightM = h;
    this.calculateLight();
    this.calculateVentilation();
  }

  calculateLight() {
    if (this.tentWidth <= 0 || this.tentLength <= 0) {
      this.lightResult = 0;
      return;
    }
    const areaM2 = (this.tentWidth / 100) * (this.tentLength / 100);
    // ~350W-400W LED Quantum Board de alta eficiencia por m2
    const recommendedWatts = Math.round((areaM2 * 360) / 10) * 10;
    this.lightResult = Math.max(60, recommendedWatts);

    if (areaM2 <= 0.4) {
      this.plantCapacity = '1 a 2 plantas';
    } else if (areaM2 <= 0.7) {
      this.plantCapacity = '3 a 6 plantas';
    } else if (areaM2 <= 1.1) {
      this.plantCapacity = '6 a 9 plantas';
    } else {
      this.plantCapacity = '9 a 16 plantas';
    }
  }

  calculateVentilation() {
    if (this.tentWidthM <= 0 || this.tentLengthM <= 0 || this.tentHeightM <= 0) {
      this.ventResult = 0;
      this.tentVolume = 0;
      return;
    }
    const volume = this.tentWidthM * this.tentLengthM * this.tentHeightM;
    this.tentVolume = Math.round(volume * 100) / 100;
    // 60 renovaciones de aire por hora con 25% de resistencia por filtro de carbón
    const flowNeeded = Math.ceil(volume * 60 * 1.25);
    this.ventResult = Math.max(60, flowNeeded);
  }

  get canShow(): boolean {
    return true;
  }
}
