import { JsonPipe } from '@angular/common';
import { Component, ElementRef, Input, AfterViewInit, ViewChild } from '@angular/core';
import {puzzleSpotlight} from "./spotlight"
import {PuzzleSpotlight,SpotlightSetup} from "./spotlightClass"

@Component({
  selector: 'app-spotlight',
  templateUrl: './spotlight.component.html',
  styleUrls: ['./spotlight.component.css']
})

// Where does "State" get fetched? 

export class SpotlightComponent implements AfterViewInit {

  // View Children
  @ViewChild('lowerRenderEl') public lowerRenderEl?: ElementRef<SVGSVGElement>;
  @ViewChild('upperRenderEl') public upperRenderEl?: ElementRef<SVGSVGElement>;
  @ViewChild('goBtnRenderEl') public goBtnRenderEl?: ElementRef<SVGSVGElement>;

  // #region INPUTS

  @Input()
  private target: number = null 

  @Input()
  private min = 0

  @Input()
  private max: number = null 

  @Input()
  private spotlightWidth = 0.10 

  @Input()
  private denominator: number = null 

  // #region Reporting Values

  @Input()
  private value = "" // previousy ng-model aka Question.FreeFormAnswers[0]

  @Input()
  private state = ""

  // #endregion

  @Input()
  private decimals: number = null 

  @Input()
  private tickStepSize = 4 

  @Input()
  private labelTicks: boolean = null 

  @Input()
  private timeStep = 1 

  @Input()
  private hints: Array<number> = []

  @Input()
  private majorJumps: number = null 

  @Input()
  private padding = 0.10

  @Input()
  private reduceTicks = false

  @Input()
  private zoom = true

  @Input()
  private reduceHints = false

  @Input()
  private reduceEndpoints = false

  @Input()
  private reduceTarget = false

  // #endregion

  ngAfterViewInit(): void {

    const setup = {
      target: this.target, // Required
      min: this.min, // Optional, Defaults to 0
      max: this.max, // Required
      spotlightWidth: this.spotlightWidth, // Required
      denominator: this.denominator, // Optional, defaults to null.
      decimals: this.decimals, // Optional, defaults to null.
      tickStepSize: this.tickStepSize, // Optional, defaults to null.
      labelTicks: this.labelTicks, // optional, defaults to false
      timeStep: 1, // Optional, defaults to 1
      //hints: [60,30], // optional, defaults to null
      majorJumps: this.majorJumps,
      padding: this.padding, // Optional, Defaults to 0.10
      zoom: this.zoom, // override zoom behavior, Defaults to true.
      reduceTicks: this.reduceTicks,
      reduceHints: true,
      reduceEndpoints: false, 
      reduceTarget: false,
    } as SpotlightSetup

    //console.log("state",state)

    const els = [this.lowerRenderEl.nativeElement,this.upperRenderEl.nativeElement]

    const puzzle = PuzzleSpotlight(els,setup)

    this.goBtnRenderEl.nativeElement.addEventListener("pointerdown", puzzle.goButtonClicked);

    puzzle.onSuccess = ()=>{
      window.alert("Correct!")
    }
    puzzle.onTryAgain = ()=>{
      window.alert("Try Again!")
    }
  }

}
