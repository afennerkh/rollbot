import { Component, ViewChild, ElementRef,Input, AfterViewInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { RadialLinear } from "./kh-radial-linear";
import {Levels} from "./levels"

@Component({
  selector: "app-radial-linear",
  templateUrl: "./radial-linear.component.html",
  styleUrls: ["./radial-linear.component.css"],
})
export class RadialLinearComponent implements AfterViewInit {
  @ViewChild("arenaMain") public arenaMain?: ElementRef<SVGSVGElement>;
  @ViewChild("overlay") public overlay?: ElementRef<SVGSVGElement>;
  @ViewChild("controlPad") public controlPad?: ElementRef<SVGSVGElement>;
  @ViewChild("controls") public controls?: ElementRef<HTMLElement>;
  @ViewChild("assets") public assets?: ElementRef<HTMLElement>;
  @ViewChild("elbackground") public background?: ElementRef<HTMLElement>;
  @ViewChild("goButton") public goButton?: ElementRef<HTMLElement>;
  @ViewChild("nextButton") public nextButton?: ElementRef<HTMLElement>;

  id: string
  constructor(private route: ActivatedRoute) {
    
  }

  ngAfterViewInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')
    const puzzles = Levels[this.id] as Array<any>

    const dom = {
      arena: this.arenaMain.nativeElement,
      overlay: this.overlay.nativeElement,
      controls: this.controls.nativeElement,
      assets: this.assets.nativeElement,
      controlPad: this.controlPad.nativeElement,
      background: this.background.nativeElement,
      goButton: this.goButton.nativeElement,
      nextButton: this.nextButton.nativeElement
    };

    let api = new RadialLinear(dom, puzzles);
  }
}
