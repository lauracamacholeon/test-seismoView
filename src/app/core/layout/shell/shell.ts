import { Component } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'sv-shell',
  imports: [MatToolbar, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {}
