import {Component, inject, input} from '@angular/core';
import {CaculatorService} from '../../services/caculator-service';

@Component({
  selector: 'app-result',
  imports: [],
  templateUrl: './result.html',
  styleUrl: './result.css'
})
export class Result {
   calc = inject(CaculatorService);

}
