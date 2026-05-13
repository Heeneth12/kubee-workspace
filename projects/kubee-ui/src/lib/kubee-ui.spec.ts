import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KubeeUi } from './kubee-ui';

describe('KubeeUi', () => {
  let component: KubeeUi;
  let fixture: ComponentFixture<KubeeUi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KubeeUi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KubeeUi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
