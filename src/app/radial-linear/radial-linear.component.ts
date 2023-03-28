import { Component, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { RadialLinear } from "./kh-radial-linear";

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


  constructor() {}

  ngAfterViewInit(): void {
    const state = {
      mode: "multiplying/combining",
      input: "battery/ship",
      numberLineDenominator: 1,
      batteries: [
        {
          editable: true,
          numerator: 1,
          denominator: 3,
          direction: true,
        },
        {
          editable: true,
          numerator: 1,
          denominator: 4,
          direction: false,
        },
        {
          editable: true,
          numerator: 4,
          denominator: 4,
          direction: true,
        },
        {
          editable: true,
          numerator: 3,
          denominator: 4,
          direction: false,
        },
      ],
      shipWidth: 0.34, // A decimal or fraction in "Number line" coordinate space.
      min: 0, // Usually zero,
      max: 3,
      timeStep: 3,
      allowPartitionEdits: true,
    };

    const dom = {
      arena: this.arenaMain.nativeElement,
      overlay: this.overlay.nativeElement,
      controls: this.controls.nativeElement,
      assets: this.assets.nativeElement,
      controlPad: this.controlPad.nativeElement
    };

    let api = new RadialLinear(dom, state);
  }
}
