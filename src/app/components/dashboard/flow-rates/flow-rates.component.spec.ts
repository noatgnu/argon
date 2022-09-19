import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowRatesComponent } from './flow-rates.component';

describe('FlowRatesComponent', () => {
  let component: FlowRatesComponent;
  let fixture: ComponentFixture<FlowRatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FlowRatesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlowRatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
