import { ComponentFactoryResolver } from "@angular/core";
import {gsap} from "gsap/all"
import { InteractionData } from "pixi.js";
import { connectableObservableDescriptor } from "rxjs/internal/observable/ConnectableObservable";
import {applyDecimalOffset,getBoundingBoxWithTransform,bringToFront} from "../api"
const svgns = "http://www.w3.org/2000/svg";

// #region INTERFACES

interface SpotlightState {
  attempts: Array<Attempt>
}

interface Attempt {
  attemptNumber: number
  target: number
  correct: boolean
}

interface StrokeData {
  major: number
  minor: number
  mini: number
}

interface Label extends SVGGElement {
  width: number
}

interface JumpData {
  viewBox: null
  scale: number
  width: number
  count: number
  stepSize: number
  stroke: StrokeData
}

interface SVGJump extends SVGPathElement {
  data: JumpData
}

interface Tick extends SVGPathElement {
  xAnchor: number
}

interface View {
  jumpsMajor: SVGJump
  jumpsMinor: SVGJump
  jumpsMini: SVGJump
  labels: Array<SVGElement>
  ticks: Array<Tick>
  numberLine: SVGElement,
  descriptor: SVGGraphicsElement,
}

interface Jumps {
  major: JumpData
  minor: JumpData
  mini: JumpData
}

interface Marking {
  location: number
  label: number
  reduce: boolean
}

export interface SpotlightSetup {
    height: number
    width: number
    decimals: number
    padding: number
    reduceTicks: boolean
    reduceLabels: boolean
    reduceHints: boolean
    reduceTarget: boolean
    max: number
    min: number
    spotlightWidth: number
    denominator: number
    tickStepSize: number 
    stepSize: number
    labelTicks: boolean | null
    timeStep: number
    hints: Array<number>
    majorJumps: number
    minorJumps: number
    miniJumps: number 
    zoom: boolean
    target: number
    numberLineY: number
    reduceEndpoints: boolean
}

// #endregion

// #region APPLICATION

export function PuzzleSpotlight(els,state){
  let self = {} as PuzzleSpotlightClass

  class PuzzleSpotlightClass {

      // #region CLASS PROPERTIES
      els: (SVGSVGElement)[]
      V: View = {} as View
      gsvg: SVGSVGElement
      gsvgu: SVGSVGElement
      state: SpotlightSetup
      FB: gsap.timeline
      shine: HTMLElement = document.getElementById("Shine");
      light: HTMLElement = document.getElementById("Light");
      flair: HTMLElement = document.getElementById("Flair");
      header: HTMLElement = document.getElementById("Header");
      pt: SVGPoint
      targetInPixels: number
      tickHeight: number
      lineWidthInUnits: number
      fontSize = 30
      aspectRatioHW: number
      range: number
      _numberLineY: number
      lineWidthInPixels: number
      yFromNumberLineToLight: number
      feedbackRunning: false
      feedbackBegun: false
      currentShineTarget: number
      shineCenter: number
      rotation = 0
      shineLeft: number
      markings: Array<Marking>
      shineRight: number
      xStart: number
      xEnd: number
      anchorStroke: number
      anchorWidth: number
      expansion: number
      strokeWidth: number
      awaitingInput = true
      jumps: Jumps
      sessionState: SpotlightState
      feedbackComplete: boolean
      dt: number
      width = 1280
      onSuccess: ()=>void
      onTryAgain: ()=>void
      resetBtnURL = "https://res.cloudinary.com/duim8wwno/image/upload/v1647289526/SpotlightRetryBtn_nwcp3o.svg"
      goBtnURL = "https://res.cloudinary.com/duim8wwno/image/upload/v1644246521/SpotlightGoBtn_eqeyvr.svg"
    

      // #endregion

      // #region CONSTRUCTOR
      constructor(els,state){
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        self = this
        this.els = els 
        this.gsvg = els[0]
        this.gsvgu = els[1]
        this.state = state
        this.state.width = 1280;
        this.state.height = 720;

        this.sessionState = {} as SpotlightState
        this.sessionState.attempts = [] 
        this._numberLineY = 500;
        this.currentShineTarget = 300
        this.state.numberLineY = 500
        this.awaitingInput = true
        this.shineCenter = this.state.width / 2;
        this.pt = this.gsvg.createSVGPoint()
        this.dt = state.timeStep
        this.FB = gsap.timeline({
          paused: true,
          onComplete: this.onFeedbackComplete,
        });
        this.V.ticks = [] 
        this.V.labels = [] 

          // Alert if Invalid
          const attempt = this.validate(this.state);
          if (attempt.valid) {
          //this.generateReport();
          this.init()
          } else {
          window.alert(attempt.message);
          }

      
      }

      // #endregion

      

      
      getPointFromUnits(units) {
        const lineInPixels = (1 - this.state.padding) * this.state.width;
        const ratio = units / (this.state.max - this.state.min);
        const point = (this.state.padding / 2) * this.state.width + lineInPixels * ratio;
        return point;
      }
    
      /* Takes an x value and returns the corresponding numberline value.
          function getUnitsFromPoint(point) {
          const lineUnits = state.max - state.min;
          const pixelsFromZeroToPoint = point - (state.width * state.padding) / 2;
          const lineWidthInPixels = (1 - state.padding) * state.width;
          const ratio = pixelsFromZeroToPoint / lineWidthInPixels;
          const units = lineUnits * ratio;
          return units;
          }
      */
    
      getNumberOfJumpsForEachSize(value, increments) {
        let reducedValue = value;
    
        const jumps = increments;
    
        const majorCount =
          jumps.major == null
            ? 0
            : (reducedValue - (reducedValue % jumps.major)) / jumps.major;
        reducedValue = reducedValue - jumps.major * majorCount;
    
        const minorCount =
          jumps.minor == null
            ? 0
            : (reducedValue - (reducedValue % jumps.minor)) / jumps.minor;
        reducedValue = reducedValue - jumps.minor * minorCount;
    
        const miniCount =
          jumps.mini == null
            ? 0
            : (reducedValue - (reducedValue % jumps.mini)) / jumps.mini;
    
        return {
          miniCount: miniCount,
          minorCount: minorCount,
          majorCount: majorCount,
        };
      }
    
      // Get point in global SVG space
      cursorPoint(evt) {
        this.pt.x = evt.clientX;
        this.pt.y = evt.clientY;
        return this.pt.matrixTransform(this.gsvg.getScreenCTM().inverse());
      }
    
      // #endregion
    
      // #region Event Handlers
    
      testThis(){
        console.log("thistest",this)
      }

      backgroundPointerDown(e) {
  
      if (self.awaitingInput){
          self.currentShineTarget = self.cursorPoint(e).x;
          const dx = self.shineCenter - self.currentShineTarget;
          const theta = Math.atan(dx / self.yFromNumberLineToLight);
          self.rotation = theta;
          gsap.set(self.light, {
            transformOrigin: "50% 0%",
            rotation: (theta * 180) / Math.PI,
          });
          self.drawShine();
          console.log("awaiting input")
        } else if (self.FB.isActive()){
          console.log("pause")
          self.FB.pause()
        } else if (self.FB.paused() && !self.feedbackComplete) {
          console.log("play")
          self.FB.play()
        }
      }
    
      // #endregion
    
      // #region Drawing
    
      drawShine() {

        const dx = (this.state.spotlightWidth * this.state.width) / 2;
  
        const theta = this.rotation;
        const left = this.currentShineTarget - dx;
        const right = this.currentShineTarget + dx;
    
        this.shineLeft = left;
        this.shineRight = right;
    
        const H1 = 75;
        const H2 = 80;
    
        const delta = theta - Math.PI / 5.5;
        const alpha = theta + Math.PI / 5.2;
        const canRightX = this.shineCenter - H1 * Math.sin(delta);
        const canRightY = 129 + H1 * Math.cos(delta);
        const canLeftX = this.shineCenter - H2 * Math.sin(alpha);
        const canLeftY = 129 + H2 * Math.cos(alpha);
    

        const s =
          "M " +
          left +
          " " +
          this._numberLineY +
          " L " +
          right +
          " " +
          this._numberLineY +
          " L " +
          canRightX +
          " " +
          canRightY +
          " L " +
          canLeftX +
          " " +
          canLeftY;
    
        gsap.set(this.shine, { attr: { d: s } });
      }
    
      // #endregion
    
      // #region DOM Constructors
      getJumpsPath(n, size) {
        let hopPath = "M 0 0";
    
        // Creating Jumps:
        for (let i = 0; i < n; i++) {
          hopPath =
            hopPath +
            " " +
            "a " +
            size / 2 +
            " " +
            size / 2 +
            " 0 1 1" +
            size +
            " 0";
        }
        return hopPath;
      }
    
      getTick(h, s) {
        const _d = "M 0 0 L 0 " + h
    
        const tO = "0" + " " + h/2
    
        const tick = document.createElementNS(svgns,"path") as Tick
        
        gsap.set(tick, {
          attr: { d: _d },
          fill: "none",
          strokeLinecap: "round",
          stroke: "white",
          strokeWidth: s,
          scale: 1,
          transformOrigin: tO,
        });
      
    
        return tick;
      }
    
      setTick(tick,location) {
        const _x = this.xStart + (location-this.state.min)/this.lineWidthInUnits*this.lineWidthInPixels
        const _y = this.state.numberLineY - this.tickHeight / 2
       
        gsap.set(tick,{x: _x,y: _y})
      }
    
      setLabel(label,location){
        const labelWidth = label.getBBox().width
        label.width = labelWidth
        const _x = this.xStart + (location-this.state.min)/this.lineWidthInUnits*this.lineWidthInPixels
        gsap.set(label,{x: _x - labelWidth/2,y: this.state.numberLineY + this.fontSize + this.tickHeight / 2 })
      }
    
      reduceFraction(n,d){
        const m = Math.max(n,d)
        let gcf = 1
        for (let i =0;i<m;i++){
          if (d%i==0 && n%i==0){
            gcf = i
          }
        }
        return {n: n/gcf,d: d/gcf}
      }
    
      // #region DOM CONSTRUCTORS
    
      // numerator/denominator f (font size)
      getLabel(f, num, den,reduce) {
    
        let n = num
        let d = den

        const shouldIReduce = reduce != null ? reduce : true
    
        if (shouldIReduce){
          n = this.reduceFraction(num,den).n
          d = this.reduceFraction(num,den).d
        }
    
        const label = document.createElementNS(svgns, "g") as Label
    
        if (n != null){
    
        const nStringLength = n.toString().length;
    
        let dWidth;
    
        const nWidth = 0.6 * nStringLength * f;
        let maxTextWidth = nWidth
    
        if (d) {
          const dl = d.toString().length;
          dWidth = 0.6 * dl * f;
          if (n % d == 0) {
            n = n / d;
            d = null;
          }
        }
    
        maxTextWidth = Math.max(nWidth,dWidth)
    
        const _n = document.createElementNS(svgns, "text");
        const _d = document.createElementNS(svgns, "text");
        const line = document.createElementNS(svgns, "line");
    
        const startLabelText = applyDecimalOffset(n, this.state.decimals);
    
        console.log("f",f)
        gsap.set(_n, {
          x: maxTextWidth/2 - nWidth/2,
          y: 0,
          textContent: startLabelText,
          fill: "white",
          fontFamily: "Arial",
          fontSize: f,
        });
    
        if (d) {
          gsap.set(_d, {
            textContent: d,
            fill: "white",
            fontFamily: "Arial",
            y: f,
            fontSize: f,
            x: maxTextWidth / 2 - dWidth / 2,
          });
          gsap.set(line, {
            attr: { x1: 0, y1: f/10, x2: maxTextWidth, y2: f/10 },
            strokeLinecap: "round",
            stroke: "white",
            fontFamily: "Arial",
            strokeWidth: f/10 ,
          });
          label.appendChild(_d);
        }
    
        label.appendChild(_n);
        label.appendChild(line);
    
      }
    
        return label;
      }
    
      initJumps() {
        const minorStartX =
          (this.state.width * this.state.padding) / 2 +
          this.jumps.major.count * this.jumps.major.width;
        const miniStartX = minorStartX + this.jumps.minor.count * this.jumps.minor.width;
    
        if (this.jumps.major.count != 0) {
          this.V.jumpsMajor = document.createElementNS(svgns, "path") as SVGJump
          const majorJumpPath = this.getJumpsPath(this.jumps.major.count, this.anchorWidth);
    
          gsap.set(this.V.jumpsMajor, {
            attr: { d: majorJumpPath },
          });
    
          const majorLength = this.V.jumpsMajor.getTotalLength();
    
          gsap.set(this.V.jumpsMajor, {
            strokeLinecap: "round",
            fill: "none",
            strokeWidth: this.anchorStroke,
            stroke: "white",
            scale: this.jumps.major.scale / this.expansion,
            y: this.state.numberLineY,
            x: (this.state.width * this.state.padding) / 2,
            strokeDasharray: majorLength,
            strokeDashoffset: majorLength,
            transformOrigin: "0% 100%",
          });
          this.gsvg.appendChild(this.V.jumpsMajor);
    
          // Connecting Data to View HACKY
          this.V.jumpsMajor.data = this.jumps.major;
        } else {
          this.V.jumpsMajor = null;
        }
    
        if (this.jumps.minor.count != 0) {
          this.V.jumpsMinor = document.createElementNS(svgns, "path") as SVGJump
          const minorJumpPath = this.getJumpsPath(this.jumps.minor.count, this.anchorWidth);
    
          gsap.set(this.V.jumpsMinor, {
            attr: { d: minorJumpPath },
          });
    
          const minorLength = this.V.jumpsMinor.getTotalLength();
    
          gsap.set(this.V.jumpsMinor, {
            strokeLinecap: "round",
            fill: "none",
            strokeWidth: this.anchorStroke,
            stroke: "white",
            y: this.state.numberLineY,
            x: minorStartX,
            scale: this.jumps.minor.scale / this.expansion,
            strokeDasharray: minorLength,
            strokeDashoffset: minorLength,
            transformOrigin: "0% 100%",
          });
          this.gsvg.appendChild(this.V.jumpsMinor);
    
          // ALERT: Connecting Data to View, we use this to create our timeline.
          this.V.jumpsMinor.data = this.jumps.minor;
        } else {
          this.V.jumpsMinor = null;
        }
    
        if (this.jumps.mini.count != 0) {
          this.V.jumpsMini = document.createElementNS(svgns, "path") as SVGJump
    
          const miniJumpPath = this.getJumpsPath(this.jumps.mini.count, this.anchorWidth);
    
          /* ALERT: 
            ISSUE: We have to set the path attribute first so we can 
            get the length of the path.
            
            TODO: Find a way to get the length of a path on it's own.
          */
          gsap.set(this.V.jumpsMini, {
            attr: { d: miniJumpPath },
          });
    
          const miniLength = this.V.jumpsMini.getTotalLength();
    
          gsap.set(this.V.jumpsMini, {
            strokeLinecap: "round",
            fill: "none",
            strokeWidth: this.anchorStroke,
            scale: this.jumps.mini.scale / this.expansion,
            stroke: "white",
            y: this.state.numberLineY,
            x: miniStartX,
            strokeDasharray: miniLength,
            strokeDashoffset: miniLength,
            transformOrigin: "0% 100%",
          });
          this.gsvg.appendChild(this.V.jumpsMini);
    
          // Hacky: Connecting Data to View
          this.V.jumpsMini.data = this.jumps.mini;
        } else {
          this.V.jumpsMini = null;
        }
      }
    
      // #endregion
    
      // #region Animations

      onViewBoxUpdate(a){
        
      const tween = this as gsap.Tween
    
        const {animVal} = tween._targets[0].viewBox
        const _x = animVal.x
        const _w = animVal.width

        
        self.V.ticks.forEach((t,i)=>{

          gsap.set(t,{x: (t.xAnchor-_x)/_w*self.state.width},"<")
          const l = self.V.labels[i] as Label // Grabbing the label with index.
          l && gsap.set(l,{x: (t.xAnchor-_x)/_w*self.state.width-l.width/2},"<")
        })
        
      }

      initTimeline() {
        const J = [this.V.jumpsMajor, this.V.jumpsMinor, this.V.jumpsMini];
    
        J.forEach((j, i) => {
          if (j != null) {
            const length = j.getTotalLength();

            if (j != this.V.jumpsMajor && this.state.zoom == true) {
              // No viewbox zoom or stroke adjustment required for jumps major.
              
              this.FB.to(this.gsvg, { duration: this.dt,ease: "power1", attr: { viewBox: j.data.viewBox },onUpdate: this.onViewBoxUpdate});
              
              this.V.jumpsMajor &&
                this.FB.to(
                  this.V.jumpsMajor,
                  { duration: this.dt, strokeWidth: j.data.stroke.major },
                  "<"
                );
              this.V.jumpsMinor &&
                this.FB.to(
                  this.V.jumpsMinor,
                  { duration: this.dt, strokeWidth: j.data.stroke.minor },
                  "<"
                );
              this.V.jumpsMini &&
                this.FB.to(
                  this.V.jumpsMini,
                  { duration: this.dt, strokeWidth: j.data.stroke.mini },
                  "<"
                );
            }
    
            this.FB.fromTo(
              j,
              j.data.count * this.dt,
              { strokeDashoffset: length },
              {
                strokeDashoffset: 0,
                ease: "linear",
                duration: j.data.count * this.dt,
              }
            );
          }
        });
      }
    
      checkAnswer() {
        if (this.targetInPixels > this.shineLeft && this.targetInPixels < this.shineRight) {
          this.onSuccess();
          return true;
        } else {
          this.onTryAgain();
          return false;
        }
      }
    
      onFeedbackComplete() {
        const _attemptNumber = self.sessionState.attempts.length + 1;
        const _correct = self.checkAnswer();
        const thisAttempt = {attemptNumber: _attemptNumber,target: self.currentShineTarget,correct: _correct}

        self.feedbackComplete = true;
        self.sessionState.attempts.push(thisAttempt);
      }
    
      // #endregion
    
      // #region LifeCycle Methods
    
      validate(state) {
        let _message = "State validation failed";
    
    
        const customIncrementsValid = true;

    
        const minLessThanMax = this.state.min < this.state.max;
        const spotlightNotTooBig = this.state.spotlightWidth < 1;
        const spotlightNotTooSmall = this.state.spotlightWidth > 0.005;
        const denominatorIsProvided = this.state.denominator || false;
        const denominatorIsInRange =
          !denominatorIsProvided || this.state.denominator >= 1;
    
        if (!minLessThanMax) {
          _message += " Invalid Min/Max";
        }
    
        const _valid =
          minLessThanMax &&
          spotlightNotTooBig &&
          spotlightNotTooSmall &&
          denominatorIsInRange &&
          customIncrementsValid;
    
        return { valid: _valid, message: _message };
      }
    
      // Should probably be resetGame
      reset() {
        const onComplete = () => {
          this.FB.restart();
          this.FB.pause();
          this.resetShine().play();
        };
    
        gsap.to(this.gsvg, {
          duration: this.dt,
          onComplete: onComplete,
          onUpdate: this.onViewBoxUpdate,
          ease: "linear",
          attr: { viewBox: "0 0 1280 720" },
        });
    
    
        // Reset Jumps
        if (this.V.jumpsMajor) {
          const majorLength = this.V.jumpsMajor.getTotalLength();
          gsap.set(this.V.jumpsMajor, {
            strokeDasharray: majorLength,
            strokeDashoffset: majorLength,
            strokeWidth: this.anchorStroke,
          });
        }
    
        if (this.V.jumpsMinor) {
          const minorLength = this.V.jumpsMinor.getTotalLength();
          gsap.set(this.V.jumpsMinor, {
            strokeDasharray: minorLength,
            strokeDashoffset: minorLength,
            strokeWidth: this.anchorStroke,
          });
        }
    
        if (this.V.jumpsMini) {
          const miniLength = this.V.jumpsMini.getTotalLength();
          gsap.set(this.V.jumpsMini, {
            strokeDasharray: miniLength,
            strokeDashoffset: miniLength,
            strokeWidth: this.anchorStroke,
          });
        }
      }
    
      resetShine() {
        const T = gsap.timeline();
        const onUpdate = () => {
          this.drawShine();
        };
        const onComplete = ()=>{
          this.awaitingInput = true
          this.feedbackComplete = false
        }
        T.to(this, {
          duration: 1,
          ease: "elastic",
          rotation: 0,
          currentShineTarget: this.shineCenter,
          onUpdate: onUpdate,
          onComplete: onComplete
        });
        T.to(this.light, { duration: 1, rotation: 0, ease: "elastic" }, "<");
        return T;
      }
    
      initNumberLineParams(){
    
        const start = {location: this.state.min, label: this.state.min,reduce: this.state.reduceEndpoints} as Marking
        const end = {location: this.state.max, label: this.state.max,reduce: this.state.reduceEndpoints} as Marking
    
        this.markings = [start]
    
        if (this.state.tickStepSize){
          console.log("this.state.tickStepSize",this.state.tickStepSize)
    
          let sum: number = Number(this.state.tickStepSize) + Number(this.state.min)
          console.log("start sum,this.state.min",typeof(sum),typeof(this.state.min))
          do {
            console.log("doing")
            const _label = this.state.labelTicks ? sum : null
            this.markings.push({location: sum,label: _label,reduce: this.state.reduceTicks})
            sum += Number(this.state.tickStepSize)
            console.log("sum",sum,this.state.max)
          } while (sum < this.state.max)
      }
    
      const hints = this.state.hints ? this.state.hints : []
    
        const hintMarkings = hints.map(h=>{
          return {location: h,label: h,reduce: this.state.reduceHints}
        })
    
        hintMarkings && this.markings.push(...hintMarkings)
        this.markings.push(end)
    
      }
    
      initView() {
    
        this.markings.forEach(m=>{
    
          const tick = this.getTick(this.tickHeight,this.strokeWidth)
          this.gsvgu.appendChild(tick)
          this.setTick(tick,m.location)
    
          /* ALERT
            REASON: we're attaching the original tick location to the tick element 
            to reference later
    
            TODO: Dynamically calculate it from target value when needed.
          */
          const xA = gsap.getProperty(tick,"x")
          tick.xAnchor = xA
          this.V.ticks.push(tick)
    
          // This returns null if there is no m.label provided.
          const label = this.getLabel(this.fontSize, m.label, this.state.denominator,m.reduce)
          this.gsvgu.appendChild(label)
          const isThereALabel = (m.label != null) 
          if (isThereALabel){
            this.setLabel(label,m.location)
            label.setAttribute("xAnchor",gsap.getProperty(label,"x"))
          }
    
          /* ALERT
            REASON: by design, some labels of the view can be null. 
    
            TODO: Nothing at the moment, we want each marking to have a 
            label,tick pair, even if the label is null. 
          */
          this.V.labels.push(label)
    
        })
    
        this.V.descriptor = this.getLabel(60,this.state.target,this.state.denominator,this.state.reduceTarget)
        this.gsvg.appendChild(this.V.descriptor);
        const w = this.V.descriptor.getBBox().width;
        const h = this.V.descriptor.getBBox().height;
    
        // HARDCODED
        gsap.set(this.V.descriptor, { y: 140/2, x: this.shineCenter - w / 2 });
    
        this.initJumps();
    
        // Number Line
    
        this.V.numberLine = document.createElementNS(svgns, "line");
    
        console.log(
          "numberlineY",this,this._numberLineY)
        gsap.set(this.V.numberLine, {
          attr: {
            x1: 0,
            y1: this._numberLineY,
            x2: this.state.width,
            y2: this._numberLineY,
          },
          fill: "none",
          strokeWidth: 5,
          stroke: "white",
        });
        this.gsvgu.appendChild(this.V.numberLine);
    
        // Can we do this before initView so we can put it in updateLayoutParams
        const numberLineY = this.state.numberLineY;
        const lightY = getBoundingBoxWithTransform(this.light).y;
        this.yFromNumberLineToLight = numberLineY - lightY;
    
    
        // View
        bringToFront(this.light);
        bringToFront(this.header);
    
    
        // Misc.
        const scale = Math.min(1, Math.sqrt(this.state.spotlightWidth / 0.06));
        gsap.set(this.flair, { scaleX: scale, transformOrigin: "50% 0%" });
      }
    
      initLayoutParams() {
        // Legacy name change:
        const steps = {major: 100,minor: 10,mini: 1}
    
        // State Variables
        this.feedbackComplete = false
        this.feedbackRunning = false
        this.feedbackBegun = false
    
        this.awaitingInput = true
    
        this.fontSize = 30
        this.strokeWidth = 5
    
        this.xStart = (this.state.width * this.state.padding) / 2;
        this.xEnd = this.state.width * (1 - this.state.padding / 2);
    
        this.range = this.state.min - this.state.max
        this.currentShineTarget = this.state.width / 2;
        this.targetInPixels = this.getPointFromUnits(this.state.target-this.state.min);
        this.tickHeight = this.state.width / 50
        this._numberLineY = this.state.numberLineY
    
        const increments = steps;
    
        const adjustedTarget = this.state.target - this.state.min
    
        const counts = this.getNumberOfJumpsForEachSize(adjustedTarget, increments);
    
        const widthInPixels = (1 - this.state.padding) * this.state.width;
    
        this.lineWidthInPixels = widthInPixels;
        this.lineWidthInUnits = this.state.max - this.state.min;
    
        const widthInUnits = this.state.max - this.state.min;
        const majorJumpWidth = (steps.major / widthInUnits) * widthInPixels;
        const minorJumpWidth = (steps.minor / widthInUnits) * widthInPixels;
        const miniJumpWidth = (steps.mini / widthInUnits) * widthInPixels;
    
        const majorJumpScale = steps.major / widthInUnits;
        const minorJumpScale = steps.minor / widthInUnits;
        const miniJumpScale = steps.mini / widthInUnits;
    
    
        // No longer needed.
        this.expansion = 1; // To prevent from fractional stroke widths. Cause: Unknown
        this.aspectRatioHW = this.state.height / this.state.width;
    
        // Helps for scaling
        this.anchorWidth = (1 - this.state.padding) * this.state.width * this.expansion;
        this.anchorStroke = 5 / majorJumpScale;
    
        const jumps = {
          major: {
            viewBox: null,
            scale: majorJumpScale,
            width: majorJumpWidth,
            count: counts.majorCount,
            stepSize: steps.major,
            stroke: {
              major: this.anchorStroke,
              minor: this.anchorStroke,
              mini: this.anchorStroke,
            },
          },
          minor: {
            viewBox: null,
            scale: minorJumpScale,
            width: minorJumpWidth,
            count: counts.minorCount,
            stepSize: steps.minor,
            stroke: {
              major: this.anchorStroke / (steps.major / steps.minor),
              minor: this.anchorStroke,
              mini: this.anchorStroke,
            },
          },
          mini: {
            viewBox: null,
            scale: miniJumpScale,
            width: miniJumpWidth,
            count: counts.miniCount,
            stepSize: steps.mini,
            stroke: {
              major: this.anchorStroke / (steps.major / steps.mini),
              minor: this.anchorStroke / (steps.minor / steps.mini),
              mini: this.anchorStroke,
            },
          },
        };
    
        let head = (this.state.padding / 2) * this.state.width;
        const majorViewBox = [0, 0, this.state.width, this.state.height].join(" ");
    
        const countMax = Math.max(jumps.minor.count, jumps.mini.count);
    
        head = head + jumps.major.width * jumps.major.count;
        const minorViewBoxWidth = 1.5 * jumps.minor.width * countMax;
        const minorViewBoxHeight = minorViewBoxWidth * this.aspectRatioHW;
        const minorViewBoxX = head - 0.2 * minorJumpWidth;
        const minorViewBoxY = this.state.numberLineY - this._numberLineY/this.state.height*minorViewBoxHeight;
    
        console.log("minorViewBoxX",minorViewBoxX)
    
        const minorViewBox = [
          minorViewBoxX,
          minorViewBoxY,
          minorViewBoxWidth,
          minorViewBoxHeight,
        ].join(" ");
    
        head = head + jumps.minor.width * jumps.minor.count;
        const miniViewBoxWidth = 1.5 * jumps.mini.width * countMax;
        const miniViewBoxHeight = miniViewBoxWidth * this.aspectRatioHW;
        const miniViewBoxX = head - 0.2 * miniJumpWidth;
        const miniViewBoxY = this.state.numberLineY - this._numberLineY/this.state.height*miniViewBoxHeight
        const miniViewBox = [
          miniViewBoxX,
          miniViewBoxY,
          miniViewBoxWidth,
          miniViewBoxHeight,
        ].join(" ");
    
        jumps.major.viewBox = majorViewBox;
        jumps.minor.viewBox = minorViewBox;
        jumps.mini.viewBox = miniViewBox;
    
        this.jumps = jumps;
    
        this.initNumberLineParams()

      }
    
      attachEvents() {
        // Event Listeners
        //this.gsvg.addEventListener("pointerdown", this.backgroundPointerDown);
        this.gsvg.addEventListener("pointerdown",this.backgroundPointerDown)
      }
    
      generateReport(){
        this.initLayoutParams();
        this.initNumberLineParams()
        this.initView()
        this.drawShine()
      }

      init() {
        this.initLayoutParams();
        this.initView();
    
        // Animations
        this.initTimeline(); 

        this.drawShine();
    
        this.attachEvents();
      }
    
      // #endregion
    
      // #region PUBLIC METHODS
    
      goButtonClicked(e) {
        console.log("this",this)
        console.log("self",self.goBtnURL)
        const btn = this as any

        if (self.feedbackComplete) {
          btn.style.backgroundImage = `url(${self.goBtnURL})`;
          self.reset();
        } else if (self.awaitingInput) {
          btn.style.backgroundImage = `url(${self.resetBtnURL})`;
          self.awaitingInput = false
          self.FB.play();
        } else {
          console.log("You can't click me!")
        } 
      }
    
      // Object Functions

    
      // Sent to server "onSubmit"
      getSessionState = function () {
        return this.sessionState;
      };
    
      // #endregion
    

  }

  return new PuzzleSpotlightClass(els,state)
}

