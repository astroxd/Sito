import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideAnimeCard } from './side-anime-card';

describe('SideAnimeCard', () => {
  let component: SideAnimeCard;
  let fixture: ComponentFixture<SideAnimeCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideAnimeCard],
    }).compileComponents();

    fixture = TestBed.createComponent(SideAnimeCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
