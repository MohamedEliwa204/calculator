import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CaculatorService, HistoryItem } from '../../services/caculator-service';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './side-bar.html',
  styleUrl: './side-bar.css'
})
export class SideBar implements OnInit {
  calc = inject(CaculatorService);

  // Use the shared history signal from the service
  history = this.calc.history;

  ngOnInit() {
    this.calc.loadHistory();
  }

  clearHistory() {
    this.calc.clearHistory();
  }

  useExpression(item: HistoryItem) {
    this.calc.exp.set(item.expression);
    this.calc.value.set(item.result.toString());
  }
}
