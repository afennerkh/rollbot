import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RadialLinearComponent } from './radial-linear.component';

describe('RadialLinearComponent', () => {
  let component: RadialLinearComponent;
  let fixture: ComponentFixture<RadialLinearComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RadialLinearComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RadialLinearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
