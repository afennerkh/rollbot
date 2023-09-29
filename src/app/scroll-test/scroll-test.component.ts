import { Component, AfterViewInit, ElementRef,ViewChild } from '@angular/core';
import {ScrollTestApi} from "./scroll-test-api"


@Component({
  selector: 'app-scroll-test',
  templateUrl: './scroll-test.component.html',
  styleUrls: ['./scroll-test.component.css']
})
export class ScrollTestComponent implements AfterViewInit {

  @ViewChild('arena') public arena?: ElementRef<SVGSVGElement>;

  constructor() { }

  ngAfterViewInit(): void {
   

    const api = new ScrollTestApi(this.arena,"")
  }

}
