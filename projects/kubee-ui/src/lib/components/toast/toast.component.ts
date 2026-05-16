import { Component } from '@angular/core';
import { ToastService } from './toastService';
import { CommonModule } from '@angular/common';

/**
 * @description Toast component to display toast messages
 * 
 * @example
 * ```typescript
 * // Usage in component methods
 * this.toastService.show('Operation completed successfully!', 'success');
 * this.toastService.show('An error occurred.', 'error');
 * this.toastService.show('This is a warning message.', 'warning');
 * this.toastService.show('Just some information.', 'info');
 * ```
 * ```html
 * <app-toast></app-toast>
 * ```
 */

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {

  constructor(public toastService: ToastService) { }

  getBorderClass(type: string): string {
    switch (type) {
      case 'success': return 'border-l-4 border-l-green-500';
      case 'error': return 'border-l-4 border-l-red-500';
      case 'warning': return 'border-l-4 border-l-amber-500';
      default: return 'border-l-4 border-l-blue-500';
    }
  }
}


// @Injectable({
//     providedIn: 'root'
// })
// export class ToastService {
//     private toastsSubject = new BehaviorSubject<Toast[]>([]);
//     public toasts$ = this.toastsSubject.asObservable();
//     private counter = 0;

//     show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 3000) {
//         const id = this.counter++;
//         const toast: Toast = { id, message, type, duration };
//         // Add to stack
//         this.toastsSubject.next([...this.toastsSubject.value, toast]);
//         // Auto remove
//         if (duration > 0) {
//             setTimeout(() => this.remove(id), duration);
//         }
//     }

//     remove(id: number) {
//         const current = this.toastsSubject.value;
//         this.toastsSubject.next(current.filter(t => t.id !== id));
//     }
// }