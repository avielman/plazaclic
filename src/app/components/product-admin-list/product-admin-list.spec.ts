import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductAdminList } from './product-admin-list';

describe('ProductAdminList', () => {
  let component: ProductAdminList;
  let fixture: ComponentFixture<ProductAdminList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductAdminList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductAdminList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
