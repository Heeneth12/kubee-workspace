import { Component, Input, Output, EventEmitter, ElementRef, HostListener, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, ChevronDown, Check, Building2 } from 'lucide-angular';
import { BranchService } from './branch.service';

export interface Branch {
  id: number;
  branchName: string;
  branchCode: string;
  isHeadOffice: boolean;
}

@Component({
  selector: 'app-branch-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="relative font-sans inline-flex">
      @if(showLabel){
      <label class="ez-label block mb-1.5">{{ label }} <span class="text-red-500">*</span></label>
      }

      <button 
        type="button" 
        (click)="toggleDropdown()"
        class="ez-btn ez-btn-secondary border border-ez-ash rounded h-8 min-h-0 px-3 flex items-center gap-2 outline-none transition-[border-color,color] duration-ez"
        [ngClass]="isOpen ? 'border-ez-primary text-ez-primary' : ''">
        
        <lucide-icon [img]="BuildingIcon" class="h-4 w-4 shrink-0 transition-colors duration-ez"></lucide-icon>
        
        <div class="flex items-center min-w-0" *ngIf="selectedBranch; else placeholder">
          <span class="text-sm font-medium leading-none truncate max-w-[120px]">{{ selectedBranch.branchName }}</span>
        </div>
        <ng-template #placeholder>
          <span class="text-sm font-medium leading-none opacity-70">Select branch...</span>
        </ng-template>

        <lucide-icon [img]="ChevronDownIcon" 
          class="w-3.5 h-3.5 opacity-50 shrink-0 transition-transform duration-ez ml-1"
          [class.rotate-180]="isOpen">
        </lucide-icon>
      </button>

      <div *ngIf="isOpen" 
        class="absolute top-[calc(100%+8px)] right-0 w-72 bg-white border border-ez-border z-50 flex flex-col max-h-[320px] shadow-xl animate-fade-in origin-top-right">
        
        <div class="p-3 border-b border-ez-border bg-ez-ash shrink-0 relative">
          <div class="absolute inset-y-0 left-3 pl-3 flex items-center pointer-events-none">
            <lucide-icon [img]="SearchIcon" class="w-4 h-4 text-ez-muted"></lucide-icon>
          </div>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="filterBranches()"
            (click)="$event.stopPropagation()"
            placeholder="Search by name or code..." 
            class="w-full pl-9 pr-3 py-2 bg-white border border-ez-border text-ez-sm text-ez-heading placeholder:text-ez-muted focus:outline-none focus:border-ez-primary transition-colors duration-ez"
            autofocus>
        </div>

        <div class="flex-1 overflow-y-auto no-scrollbar">
          
          <div *ngIf="filteredBranches.length === 0" class="p-6 text-center">
            <p class="text-ez-sm text-ez-secondary">No branches found matching "{{ searchQuery }}"</p>
          </div>

          <button *ngFor="let branch of filteredBranches" 
            type="button"
            (click)="selectBranch(branch)"
            class="w-full flex items-start gap-3 p-4 border-b border-ez-border last:border-b-0 text-left transition-colors duration-ez group"
            [ngClass]="selectedBranch?.id === branch.id ? 'bg-ez-primary-tint' : 'hover:bg-ez-ash bg-white'">
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-ez-sm font-medium transition-colors duration-ez truncate"
                  [ngClass]="selectedBranch?.id === branch.id ? 'text-ez-primary' : 'text-ez-heading group-hover:text-ez-primary'">
                  {{ branch.branchName }}
                </span>
                
                <span *ngIf="branch.isHeadOffice" 
                  class="shrink-0 px-1.5 py-0.5 border border-ez-heading bg-ez-heading text-white text-[9px] font-medium uppercase tracking-[0.1em] leading-none">
                  HQ
                </span>
              </div>
              <div class="text-ez-xs text-ez-secondary uppercase tracking-wide">
                {{ branch.branchCode }}
              </div>
            </div>

            <div class="shrink-0 flex items-center justify-center w-5 h-5 mt-0.5">
              <lucide-icon *ngIf="selectedBranch?.id === branch.id" [img]="CheckIcon" class="w-4 h-4 text-ez-primary"></lucide-icon>
            </div>
            
          </button>
        </div>

        <div class="px-4 py-2 border-t border-ez-border bg-ez-ash shrink-0">
          <span class="text-[10px] text-ez-muted uppercase tracking-[0.1em] font-medium">
            Showing {{ filteredBranches.length }} of {{ branches.length }}
          </span>
        </div>

      </div>
    </div>
  `
})
export class BranchSelectorComponent implements OnInit {
  // Icons
  SearchIcon = Search;
  ChevronDownIcon = ChevronDown;
  CheckIcon = Check;
  BuildingIcon = Building2;

  // Inputs & Outputs
  branches: Branch[] = [];
  @Input() preselectedId: number | null = null;
  @Input() showLabel: boolean = true;
  @Input() label: string = 'Operating Branch';
  @Input() placeholder: string = 'Select a branch...';
  @Output() branchSelected = new EventEmitter<Branch>();

  // State
  isOpen = false;
  searchQuery = '';
  filteredBranches: Branch[] = [];
  selectedBranch: Branch | null = null;

  constructor(private eRef: ElementRef, private branchService: BranchService) { }

  ngOnInit() {
    console.log("init branch")
    this.fetchBranches();
  }

  fetchBranches() {
    this.branchService.getBranchSummaries(
      (response: any) => {
        this.branches = response?.data || response || [];
        this.filteredBranches = [...this.branches];

        if (this.preselectedId !== null) {
          this.selectedBranch = this.branches.find(b => b.id === this.preselectedId) || null;
        } else if (this.branches.length > 0 && !this.selectedBranch) {
          this.selectedBranch = this.branches.find(b => b.isHeadOffice) || this.branches[0];
          this.branchSelected.emit(this.selectedBranch);
        }
      },
      (error: any) => {
        console.error('Failed to load branches', error);
      }
    );
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.searchQuery = '';
      this.filterBranches();
    }
  }

  filterBranches() {
    if (!this.searchQuery.trim()) {
      this.filteredBranches = [...this.branches];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredBranches = this.branches.filter(branch =>
      branch.branchName.toLowerCase().includes(query) ||
      branch.branchCode.toLowerCase().includes(query)
    );
  }

  selectBranch(branch: Branch) {
    this.selectedBranch = branch;
    this.branchSelected.emit(branch);
    this.isOpen = false;
    this.searchQuery = '';
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}