import { Component, Input, OnChanges } from '@angular/core';

export interface ColumnPoint {
  key: string;
  value: number;
  /** Tooltip: first line bold. */
  tooltip: string[];
}

/**
 * Single-series column chart: one hue (the brand primary), no legend (the section title names the series),
 * hairline gridlines with clean ticks, 4px rounded caps on columns at most 24px wide, and a per-column
 * hover tooltip whose target is the whole slot. Pair it with a table of the same numbers.
 */
@Component({
  selector: 'app-column-chart',
  standalone: true,
  template: `
    <div class="relative" role="img" [attr.aria-label]="ariaLabel">
      <div class="flex">
        <div class="relative w-14 shrink-0 h-48 text-ez-2xs text-ez-muted">
          @for (tick of ticks; track tick) {
          <span class="absolute right-2 translate-y-1/2 tabular-nums" [style.bottom.%]="tick / niceMax * 100">{{ format(tick) }}</span>
          }
        </div>
        <div class="relative flex-1 h-48 min-w-0">
          @for (tick of ticks; track tick) {
          <div class="absolute inset-x-0 border-t border-ez-border" [style.bottom.%]="tick / niceMax * 100"></div>
          }
          <div class="absolute inset-0 flex items-end gap-[2px]">
            @for (point of points; track point.key; let i = $index) {
            <div class="relative flex-1 h-full flex items-end justify-center cursor-default"
              (mouseenter)="hover = i" (mouseleave)="hover = null">
              @if (point.value > 0) {
              <div class="w-full max-w-6 rounded-t bg-ez-primary transition-opacity duration-ez"
                [class.opacity-60]="hover !== null && hover !== i"
                [style.height.%]="point.value / niceMax * 100"></div>
              }
              @if (hover === i) {
              <div class="absolute bottom-full mb-1 z-10 px-2.5 py-1.5 bg-ez-carbon text-white text-ez-xs whitespace-nowrap pointer-events-none"
                [class]="i > points.length / 2 ? 'right-0' : 'left-0'">
                @for (line of point.tooltip; track $index; let first = $first) {
                <p [class.font-medium]="first">{{ line }}</p>
                }
              </div>
              }
            </div>
            }
          </div>
        </div>
      </div>
      <div class="flex ml-14 mt-1 text-ez-2xs text-ez-muted">
        @for (label of axisLabels; track $index; let first = $first; let last = $last) {
        <span class="flex-1" [class.text-center]="!first && !last" [class.text-right]="last && !first">{{ label }}</span>
        }
      </div>
    </div>
  `
})
export class ColumnChartComponent implements OnChanges {
  @Input({ required: true }) points: ColumnPoint[] = [];
  /** A few evenly spaced x-axis labels (first, middle, last ...). */
  @Input() axisLabels: string[] = [];
  @Input() ariaLabel = '';
  /** Tick label formatter; defaults to compact rupees. */
  @Input() format: (value: number) => string = compactInr;

  ticks: number[] = [];
  niceMax = 1;
  hover: number | null = null;

  ngOnChanges() {
    const max = Math.max(0, ...this.points.map(p => p.value));
    // Clean ticks: 0 and 3–5 round steps (1, 2 or 5 × 10^n)
    const rough = (max || 1) / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
    const step = [1, 2, 5, 10].map(m => m * magnitude).find(s => s >= rough)!;
    this.niceMax = Math.ceil((max || 1) / step) * step;
    this.ticks = [];
    for (let t = 0; t <= this.niceMax + step / 2; t += step) this.ticks.push(+t.toFixed(6));
  }
}

/** 12,500 -> ₹12.5K; 1,20,000 -> ₹1.2L (Indian grouping). */
export function compactInr(value: number): string {
  if (value >= 1e7) return `₹${+(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `₹${+(value / 1e5).toFixed(1)}L`;
  if (value >= 1e3) return `₹${+(value / 1e3).toFixed(1)}K`;
  return `₹${value}`;
}
