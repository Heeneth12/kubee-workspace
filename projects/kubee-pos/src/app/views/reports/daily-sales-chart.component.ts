import { Component, Input, OnChanges } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

export interface DailyPoint {
  date: string;
  orders: number;
  netSales: number;
}

/**
 * Single-series column chart of net sales per day. One hue (the brand primary), no legend (the title
 * names the series), hairline gridlines, 4px rounded column caps, and a per-column hover tooltip.
 * Days without sales are filled in as empty slots so the time axis stays even.
 */
@Component({
  selector: 'app-daily-sales-chart',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="relative" role="img" [attr.aria-label]="'Net sales per day, highest ' + (max | currency:'INR':'symbol':'1.0-0')">
      <div class="flex">
        <!-- Y axis ticks -->
        <div class="relative w-14 shrink-0 h-48 text-ez-2xs text-ez-muted">
          @for (tick of ticks; track tick) {
          <span class="absolute right-2 -translate-y-1/2 tabular-nums" [style.bottom.%]="tick / niceMax * 100">{{ compact(tick) }}</span>
          }
        </div>
        <!-- Plot -->
        <div class="relative flex-1 h-48 min-w-0">
          @for (tick of ticks; track tick) {
          <div class="absolute inset-x-0 border-t border-ez-border" [style.bottom.%]="tick / niceMax * 100"></div>
          }
          <div class="absolute inset-0 flex items-end gap-[2px]">
            @for (point of points; track point.date; let i = $index) {
            <!-- The whole slot is the hover target, not just the column -->
            <div class="relative flex-1 h-full flex items-end justify-center cursor-default"
              (mouseenter)="hover = i" (mouseleave)="hover = null">
              @if (point.netSales > 0) {
              <div class="w-full max-w-6 rounded-t bg-ez-primary transition-opacity duration-ez"
                [class.opacity-60]="hover !== null && hover !== i"
                [style.height.%]="point.netSales / niceMax * 100"></div>
              }
              @if (hover === i) {
              <div class="absolute bottom-full mb-1 z-10 px-2.5 py-1.5 bg-ez-carbon text-white text-ez-xs whitespace-nowrap pointer-events-none"
                [class]="i > points.length / 2 ? 'right-0' : 'left-0'">
                <p class="font-medium">{{ point.date | date:'EEE d MMM' }}</p>
                <p>{{ point.netSales | currency:'INR' }} · {{ point.orders }} {{ point.orders === 1 ? 'order' : 'orders' }}</p>
              </div>
              }
            </div>
            }
          </div>
        </div>
      </div>
      <!-- X axis: first, middle and last day only -->
      <div class="flex ml-14 mt-1 text-ez-2xs text-ez-muted">
        <span class="flex-1">{{ points[0]?.date | date:'d MMM' }}</span>
        @if (points.length > 2) { <span class="flex-1 text-center">{{ points[midIndex]?.date | date:'d MMM' }}</span> }
        @if (points.length > 1) { <span class="flex-1 text-right">{{ points[points.length - 1]?.date | date:'d MMM' }}</span> }
      </div>
    </div>
  `
})
export class DailySalesChartComponent implements OnChanges {
  @Input({ required: true }) days: DailyPoint[] = [];
  @Input({ required: true }) from!: string;
  @Input({ required: true }) to!: string;

  points: DailyPoint[] = [];
  ticks: number[] = [];
  max = 0;
  niceMax = 1;
  hover: number | null = null;

  get midIndex(): number {
    return Math.floor((this.points.length - 1) / 2);
  }

  ngOnChanges() {
    // One slot per calendar day in the period; the API only returns days that had sales
    const byDate = new Map(this.days.map(d => [d.date, d]));
    const points: DailyPoint[] = [];
    const cursor = new Date(this.from + 'T00:00:00');
    const end = new Date(this.to + 'T00:00:00');
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      points.push(byDate.get(key) ?? { date: key, orders: 0, netSales: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    this.points = points;
    this.max = Math.max(0, ...points.map(p => p.netSales));

    // Clean ticks: 0 and 3–5 round steps (1, 2 or 5 × 10^n)
    const rough = (this.max || 1) / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
    const step = [1, 2, 5, 10].map(m => m * magnitude).find(s => s >= rough)!;
    this.niceMax = Math.ceil((this.max || 1) / step) * step;
    this.ticks = [];
    for (let t = 0; t <= this.niceMax + step / 2; t += step) this.ticks.push(Math.round(t));
  }

  /** 12,500 -> ₹12.5K; 1,20,000 -> ₹1.2L (Indian grouping). */
  compact(value: number): string {
    if (value >= 1e7) return `₹${+(value / 1e7).toFixed(1)}Cr`;
    if (value >= 1e5) return `₹${+(value / 1e5).toFixed(1)}L`;
    if (value >= 1e3) return `₹${+(value / 1e3).toFixed(1)}K`;
    return `₹${value}`;
  }
}
