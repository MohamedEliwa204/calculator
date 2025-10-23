import { Component, signal } from '@angular/core';
import { Result } from './components/result/result';
import { Button } from './components/button/button';
import { SideBar } from './components/side-bar/side-bar';

@Component({
  selector: 'app-root',
  imports: [Result, Button, SideBar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Calculatorf');
}
