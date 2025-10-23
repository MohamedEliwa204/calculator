import {Component, inject, input, signal} from '@angular/core';
import {CaculatorService} from '../../services/caculator-service';
@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.css'
})
export class Button {
  fn = input<string>('');
  symbol = input<string>('');
  color = input<string>('lightgray');
  color2 = input<string>('lightgray');
  calc = inject(CaculatorService);


  onClick(){
    this.calc.append(this.symbol(), this.fn());
  }




}
