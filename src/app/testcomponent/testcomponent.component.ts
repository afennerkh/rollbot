import { AfterViewInit, Component, OnInit ,ViewChild,ElementRef, Input} from '@angular/core';
import { PuzzleSpotlight } from '../spotlight/spotlightClass';

@Component({
  selector: 'app-testcomponent',
  templateUrl: './testcomponent.component.html',
  styleUrls: ['./testcomponent.component.css']
})
export class TestcomponentComponent implements AfterViewInit {
  @ViewChild('renderEl') public renderEl?: ElementRef<SVGSVGElement>;
  
  @Input()
  private value = 5


  ngAfterViewInit(): void {
    console.log("myinput",this.value)
  }

}
