import { TestBed } from '@angular/core/testing';

import { CaculatorService } from './caculator-service';

describe('CaculatorService', () => {
  let service: CaculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CaculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
