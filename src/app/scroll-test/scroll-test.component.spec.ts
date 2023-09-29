import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrollTestComponent } from './scroll-test.component';

describe('ScrollTestComponent', () => {
  let component: ScrollTestComponent;
  let fixture: ComponentFixture<ScrollTestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScrollTestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScrollTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
