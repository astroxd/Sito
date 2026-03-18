import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideSection } from './side-section';

describe('SideSection', () => {
  let component: SideSection;
  let fixture: ComponentFixture<SideSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideSection],
    }).compileComponents();

    fixture = TestBed.createComponent(SideSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
