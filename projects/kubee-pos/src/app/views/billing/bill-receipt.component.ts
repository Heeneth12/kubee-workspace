import { Component, Input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { BillView } from './billing.models';

/** 80 mm thermal-receipt layout of a GST bill (also used on screen). Print it with `printElement`. */
@Component({
  selector: 'app-bill-receipt',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    <div class="receipt relative bg-white text-black font-mono text-[11px] leading-snug w-full max-w-[80mm] mx-auto p-3">
      @if (bill.status === 'CANCELLED') {
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span class="text-[28px] font-bold text-red-600/40 border-4 border-red-600/40 px-3 -rotate-12">CANCELLED</span>
      </div>
      }

      <!-- Seller -->
      <div class="text-center">
        <p class="text-[13px] font-bold uppercase">{{ bill.seller.name }}</p>
        @if (bill.seller.address) { <p class="whitespace-pre-line">{{ bill.seller.address }}</p> }
        @if (bill.seller.gstin) { <p>GSTIN: {{ bill.seller.gstin }}</p> }
        <p class="font-bold mt-1">TAX INVOICE</p>
      </div>

      <div class="border-t border-dashed border-black my-2"></div>
      <div class="flex justify-between"><span>Bill: {{ bill.billNumber }}</span><span>Token: {{ bill.orderNumber }}</span></div>
      <div>Date: {{ bill.billDate | date:'dd-MM-yyyy hh:mm a' }}</div>

      <!-- Buyer -->
      @if (bill.buyer.name || bill.buyer.phone || bill.buyer.gstin) {
      <div class="border-t border-dashed border-black my-2"></div>
      @if (bill.buyer.name) { <div>Customer: {{ bill.buyer.name }}</div> }
      @if (bill.buyer.phone) { <div>Phone: {{ bill.buyer.phone }}</div> }
      @if (bill.buyer.gstin) { <div>GSTIN: {{ bill.buyer.gstin }}</div> }
      @if (bill.buyer.placeOfSupply) { <div>Place of supply: {{ bill.buyer.placeOfSupply }}</div> }
      }

      <!-- Lines -->
      <div class="border-t border-dashed border-black my-2"></div>
      <div class="flex font-bold"><span class="flex-1">Item</span><span class="w-20 text-right">Qty x Rate</span><span class="w-16 text-right">Amt</span></div>
      @for (line of bill.lines; track line.uuid) {
      <div class="mt-1">
        <div>{{ line.itemName }}</div>
        @if (line.addonsText) { <div class="pl-2">{{ line.addonsText }}</div> }
        <div class="flex">
          <span class="flex-1">{{ line.hsnSacCode ? 'HSN ' + line.hsnSacCode : '' }}</span>
          <span class="w-20 text-right">{{ line.quantity | number:'1.0-3' }} x {{ line.unitPrice | number:'1.2-2' }}</span>
          <span class="w-16 text-right">{{ line.totalAmount | number:'1.2-2' }}</span>
        </div>
      </div>
      }

      <!-- Totals -->
      <div class="border-t border-dashed border-black my-2"></div>
      <div class="flex justify-between"><span>Sub total</span><span>{{ bill.subTotal | number:'1.2-2' }}</span></div>
      @if (bill.discountAmount) {
      <div class="flex justify-between"><span>Discount</span><span>-{{ bill.discountAmount | number:'1.2-2' }}</span></div>
      }
      <div class="flex justify-between"><span>Taxable</span><span>{{ bill.taxableAmount | number:'1.2-2' }}</span></div>
      @for (tax of bill.taxSummary; track $index) {
      <div class="flex justify-between"><span>{{ tax.taxType }} {{ tax.rate | number:'1.0-3' }}%</span><span>{{ tax.taxAmount | number:'1.2-2' }}</span></div>
      }
      @if (bill.roundOffAmount) {
      <div class="flex justify-between"><span>Round off</span><span>{{ bill.roundOffAmount | number:'1.2-2' }}</span></div>
      }
      <div class="flex justify-between text-[14px] font-bold border-t border-black mt-1 pt-1">
        <span>TOTAL</span><span>₹{{ bill.grandTotal | number:'1.2-2' }}</span>
      </div>
      <div class="mt-1 italic">{{ bill.amountInWords }}</div>

      <!-- HSN summary (needed for B2B invoices) -->
      @if (showHsn && bill.hsnSummary.length) {
      <div class="border-t border-dashed border-black my-2"></div>
      <div class="flex font-bold"><span class="flex-1">HSN/SAC</span><span class="w-10 text-right">Rate</span><span class="w-16 text-right">Taxable</span><span class="w-14 text-right">Tax</span></div>
      @for (row of bill.hsnSummary; track $index) {
      <div class="flex">
        <span class="flex-1">{{ row.hsnSacCode ?? '-' }}</span>
        <span class="w-10 text-right">{{ row.taxRate | number:'1.0-3' }}%</span>
        <span class="w-16 text-right">{{ row.taxableAmount | number:'1.2-2' }}</span>
        <span class="w-14 text-right">{{ row.taxAmount | number:'1.2-2' }}</span>
      </div>
      }
      }

      @if (bill.status === 'CANCELLED') {
      <div class="border-t border-dashed border-black my-2"></div>
      <div class="font-bold">CANCELLED{{ bill.cancelReason ? ': ' + bill.cancelReason : '' }}</div>
      }
      <div class="border-t border-dashed border-black my-2"></div>
      <p class="text-center">Thank you! Visit again.</p>
    </div>
  `
})
export class BillReceiptComponent {
  @Input({ required: true }) bill!: BillView;
  /** HSN/SAC-wise summary; shown by default for B2B bills (customer GSTIN present). */
  @Input() hsn: boolean | null = null;

  get showHsn(): boolean {
    return this.hsn ?? !!this.bill.buyer.gstin;
  }
}

/**
 * Prints one element through a hidden iframe that carries the page's stylesheets,
 * so the app layout (sidebar, overflow containers) never ends up on the receipt.
 */
export function printElement(element: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(n => n.outerHTML).join('');
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8">${styles}
      <style>@page { size: 80mm auto; margin: 2mm; } body { margin: 0; background: #fff; }</style>
      </head><body>${element.outerHTML}</body></html>`);
    doc.close();

    const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    const loaded = links.map(link => new Promise<void>(done => {
      link.addEventListener('load', () => done());
      link.addEventListener('error', () => done());
    }));
    const timeout = new Promise<void>(done => setTimeout(done, 1500));
    Promise.race([Promise.all(loaded), timeout]).then(() => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      setTimeout(() => { iframe.remove(); resolve(); }, 500);
    });
  });
}
