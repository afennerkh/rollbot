
import {gsap, Linear,Draggable, Power1} from "gsap/all"
import {svgns} from "../api"

//console.log("Draggabe",Draggable)

gsap.registerPlugin(Draggable)

class Loader {
  refs: SVGSVGElement
  constructor(refs){
    this.refs = refs

  }
}

// Data Interface

interface GearData {
  editable: boolean
  numerator: number
  denominator: number 
  direction: boolean
}


interface Puzzle {
  mode: string
  input: string
  shipWidth: number 
  min: number
  max: number
  attempts: Array<boolean>
  numberLineDenominator: number
  allowPartitionEdits: boolean
  batteries: Array<GearData>
  timeStep: number
  shipLocation: number
}

// UI Interface

interface Gear extends SVGGElement {
  wheel: SVGGElement
  ribbon: SVGCircleElement
  texture: SVGUseElement
  direction: boolean
  wrench: SVGUseElement
  fraction: Fraction
  editing: boolean
  data: GearData
  inPlay: boolean
  _x: number
  set: (data?: GearData) => void
}

interface ShipGroup extends SVGGElement {
  ship: SVGUseElement
  beam: SVGUseElement
}

interface Frame {
  width: number | null
  height: number | null
}


interface Fraction extends SVGGElement {
  ticks: Array<SVGGElement>
  lineGroup: SVGGElement
  innerCircle: SVGCircleElement
  outerCircle: SVGCircleElement
  setTicks: (a: number)=>void
}

interface Test {
  set: ()=>void
}


export class RadialLinear {

  // UI Elements
  arena: SVGSVGElement
  overlay: SVGSVGElement
  controls: HTMLElement
  assets: SVGDefsElement
  uiGears: Array<Gear> = []
  robot: SVGUseElement
  ground: SVGUseElement
  menuLeave: SVGUseElement
  menuPeek: SVGUseElement
  menuIncrement: SVGUseElement
  menuDecrement: SVGUseElement
  curtain: SVGRectElement
  positiveEvergy: SVGUseElement
  negativeEnergy: SVGUseElement
  ticks: Array<SVGLineElement> = []
  controlPad: SVGSVGElement
  leave: SVGUseElement
  zoom: SVGUseElement
  ctls: SVGUseElement
  gearsInEditing: Array<Gear> = []
  background: SVGGElement
  spaceShip: SVGUseElement
  beam: SVGUseElement
  gearPool: Array<Gear> = []
  goButton: HTMLElement
  nextButton: HTMLElement
  shipGroup: ShipGroup = document.createElementNS(svgns,"g") as ShipGroup

  // Initial Bounding Boxes
  robotFrame: Frame = {width: 194,height: 393}
  shipFrame: Frame = {width: 300,height: 144}
  beamFrame: Frame = {width: 60, height: null}


  timeline: gsap.timeline
  ctltimeline: gsap.timeline
  wandtimeline: gsap.timeline
  shiptimeline: gsap.timeline
  introtimeline: gsap.timeline
  scoringtimeline: gsap.timeline
  failtimeline: gsap.timeline
  origin: any
  currentPuzzle: Puzzle
  puzzles: Array<Puzzle>
  editArea: any
  point: SVGPoint
  shipLocation: number
  originalPuzzles: Array<Puzzle>
  radioCircle: SVGCircleElement
  numberLine: SVGGElement
  currentShipLocation: number


  // Tweens
  goTween: gsap.tween 





  // State Variables
  puzzleIndex: number = 0
  puzzleCount: number 
  puzzleAttempts: Array<boolean> = []



  // Transient State
  feedbackEnded: boolean = false
  peeking: boolean = false

  // Constants
  PADDING: number = 110
  CIRCUMFRENCE: number = (1280-2*this.PADDING)/3
  DIAMETER: number = this.CIRCUMFRENCE/Math.PI
  RIBBON_WIDTH: number = 10 
  BATTERY_RADIUS: number = 25
  BATTERY_SCALE: number = (this.DIAMETER/2-this.RIBBON_WIDTH)/(this.BATTERY_RADIUS)// Ribbon offset because it doesn't scale with object (and we don't want itinit to)
  STROKE_FRACTION: string =  "#ffffff"
  STROKE_NUMBER_LINE: string = "#ffffff"
  COLOR_BATTERY_FORWARD: string = "#2bff43"
  COLOR_BATTERY_BACKWARD: string = "red"
  NUMBER_LINE_Y: number = 550
  CENTER_X: number = 640




  constructor(dom,puzzles){

    this.arena = dom.arena
    this.controls = dom.controls
    this.assets = dom.assets 
    this.overlay = dom.overlay
    this.controlPad = dom.controlPad
    this.background = dom.background
    this.goButton = dom.goButton
    this.nextButton = dom.nextButton

    // Unadultered puzzles.
    this.puzzles = puzzles

    


    // Initialize puzzles
    this.currentPuzzle = JSON.parse(JSON.stringify(this.puzzles[0]))
    this.puzzleCount = this.puzzles.length
    this.shipLocation = this.currentPuzzle.shipLocation
 
    // Constants
    this.timeline = gsap.timeline({onComplete: this.onFeedBackEnded.bind(this),paused: true})
    this.wandtimeline = gsap.timeline({onComplete: this.onWandComplete.bind(this),paused: true})
    this.ctltimeline = gsap.timeline({paused: true})
    this.shiptimeline = gsap.timeline({paused: true})
    this.introtimeline = gsap.timeline({paused: true})
    this.scoringtimeline = gsap.timeline({onComplete: this.onScoringComplete.bind(this),paused: true})

    this.goTween = gsap.to(this.goButton,{paused: true,duration: 3,ease: "bounce",rotation: 360,repeat: 3})

    this.point = this.arena.createSVGPoint()

    this.init()
  }

  // Assums for now that spaceshipt and beam have already been created.
  createShipGroup(){
    let g = document.createElementNS(svgns,"g") as ShipGroup
    g.appendChild(this.spaceShip)
    g.appendChild(this.beam)
    return g
  }


  // Generators
  getTick(height=20,strokeWidth=4,color="white"){
    let t = document.createElementNS(svgns,"line")
    gsap.set(t,{attr: {y2: height},strokeLinecap: "round", strokeWidth: strokeWidth,stroke: color})
    return t
  }

  onFeedBackEnded(){
    gsap.set(this.arena,{pointerEvents: "none"})
    this.feedbackEnded = true
    this.scorePuzzle()
  }

  onScoringComplete(){

    gsap.set(this.goButton,{pointerEvents: "auto",backgroundImage: `url(${"https://res.cloudinary.com/duim8wwno/image/upload/v1665147162/RetryBtn_jhupgo.svg"})`})

    if (this.puzzleAttempts.includes(true)){
      gsap.to(this.goButton,{scale: 1,duration: 0.5,top: "1%",left: "1%"})
      gsap.to(this.nextButton,{duration: 1,scale: 1,ease: "elastic"})
    } else {
      gsap.set(this.goButton,{top: "25%",left: "45%"})
      gsap.to(this.goButton,{scale: 1.5,duration: 0.5,onComplete: ()=>this.goTween.play()})
    }

  }

  nextPuzzle(){
    this.puzzleAttempts = []
    this.puzzleIndex = (this.puzzleIndex+1)%this.puzzleCount
    let newPuzzle = this.getPuzzle(this.puzzleIndex)
    this.loadPuzzle(newPuzzle)
    this.abandonEditing()
  }

  shipPointerDown(){

  }

  onDragStart(){
    this.abandonEditing()
  }
  
  onDragEnd(e){
    this.cursorPoint(e)
    this.buildWandTimeline()
  }

  cursorPoint(evt) {
    this.point.x = evt.clientX;
    this.point.y = evt.clientY;

    let cursor = this.point.matrixTransform(this.arena.getScreenCTM().inverse());
    this.shipLocation = this.getValForX(cursor.x)

    return cursor
  }



    // need "battery pool" (not to exceed a certain amount)
  loadPuzzle(puzzle){

    this.shipLocation =  puzzle.shipLocation

    // Prepare Arena
    gsap.set(this.arena,{pointerEvents: "auto"})
    gsap.set(this.curtain,{alpha: 0,pointerEvents: "none"})
    gsap.set(this.robot,{x: 0,y: this.NUMBER_LINE_Y-this.robotFrame.height,pointerEvents: "none"})
    gsap.set(this.goButton,{pointerEvents: "auto",backgroundImage: `url(${"https://res.cloudinary.com/duim8wwno/image/upload/v1682434926/BlueGoButton_oqeecj.svg"})`})
    gsap.set(this.shipGroup,{y: -300})
    gsap.set(this.beam,{scaleY: 0})
    gsap.to(this.nextButton,{scale: 0,duration: 0.25})

    if (puzzle.input === "ship"){
      console.log("draggabe")
      gsap.set(this.shipGroup,{pointerEvents: "auto"})
      Draggable.create(this.shipGroup,{type: "x",onDragStart: this.onDragStart.bind(this), onDragEnd: this.onDragEnd.bind(this)});
    } else {
      gsap.set(this.shipGroup,{pointerEvents: "none"})
    }
  

      this.feedbackEnded = false
      this.uiGears = []
      this.currentPuzzle = puzzle
  
      let newBatteries = this.currentPuzzle.batteries
      let numOfBatteries = this.currentPuzzle.batteries.length
      let batteryLength = 100*(numOfBatteries-1)
      let batteryX = 1280/2 - batteryLength/2
  
      // this.batteries is the pool
      this.gearPool.forEach((b,i)=>{
        if (i<numOfBatteries) {
          b.data = newBatteries[i]
          gsap.set(b,{x: batteryX + 100*i,y: this.NUMBER_LINE_Y+75,transformOrigin: "50% 50%"})
          b.set()
          this.arena.append(b)
          this.uiGears.push(b)
          b.inPlay = true
        } else {
          b.inPlay && this.arena.removeChild(b)
          b.inPlay = false
        }
      })

      // Formerly Refresh

      this.wandtimeline.clear()
      this.buildWandTimeline()
  
      // Reset Timelines
      let location = this.PADDING+this.CIRCUMFRENCE*this.currentPuzzle.shipLocation
      this.shiptimeline.clear()
      this.buildSpaceShipTimeline(location)
  
      this.timeline.clear()
  
      // Refresh batteries
      this.uiGears.forEach((b,i)=>{
      
        b._x = batteryX + 100*i // Save original position so we can reset after editing. 
        gsap.set(b,{scale: 1,alpha: 1,x: batteryX + 100*i,y: this.NUMBER_LINE_Y+75})
        gsap.set([b.wheel,b.texture],{alpha: 1})
        gsap.set(b.wheel,{scale: 1})
        gsap.set(b.wrench,{alpha: 0})
        b.set(b.data)
  
      })

  
      this.drawTicks()
      this.playShipIntro(1)
    } 

  playShipIntro(pause: number){
    setTimeout(()=>{
      this.shiptimeline.play()
    },pause*1000)
  }

  buildTimeline(){
    // Convenience Constants: 
    const bs = this.BATTERY_SCALE
    const bc = this.BATTERY_RADIUS*2*Math.PI
    const ts = this.currentPuzzle.timeStep

    
    let head = this.PADDING + this.currentPuzzle.min*this.CIRCUMFRENCE


    this.uiGears.forEach((b,i)=>{

      // Testing Functions 
  
      this.arena.appendChild(b)
      // MOOO this data might change (fixed)
      const bData = b.data
      const {numerator,denominator} = bData
      const frac = Math.abs(numerator/denominator)
      const currentRotation = gsap.getProperty(b.wheel,"rotation")
      
      const gearY = this.NUMBER_LINE_Y - this.DIAMETER/2

      this.timeline.to(b,{duration: ts/3,x: head,y: gearY})
      this.timeline.to(b.wheel,{duration: ts/4,scale: bs})
      

      if (bData.direction){
        this.timeline.to(b.ribbon,{duration: ts/4,scaleX: bs, scaleY: -bs},"<")
      } else {
        this.timeline.to(b.ribbon,{duration: ts/4,scaleX: bs,scaleY: bs},"<")
      }
      this.timeline.to(b.texture,{duration: ts/4,alpha: 0},"<")
      this.timeline.to(b.wrench,{alpha: 1,duration: ts/4})

      // Adjusted time step so small fractions go at the fsame rate as large ones. 
      const adjts = frac*ts

      if (bData.direction == true){
        this.timeline.to(b,{duration: adjts,z: 0.001,x: head+frac*this.CIRCUMFRENCE,ease: Linear.easeNone}) 
        this.timeline.to(this.robot,{duration: adjts,x: head + frac*this.CIRCUMFRENCE - this.PADDING,ease: Linear.easeNone},"<") 
        this.timeline.to(b.wheel,{duration: adjts,rotation: currentRotation+frac*360,ease: Linear.easeNone},"<")
        head = head + frac*this.CIRCUMFRENCE
      } else {
        this.timeline.to(b,{duration: adjts,x: head-frac*this.CIRCUMFRENCE,z: 0.001, ease: Linear.easeNone}) 
        this.timeline.to(this.robot,{duration: adjts,x: head - frac*this.CIRCUMFRENCE - this.PADDING,ease: Linear.easeNone},"<") 
        this.timeline.to(b.wheel,{duration: adjts,rotation: currentRotation-frac*360,ease: Linear.easeNone},"<")
        head = head - frac*this.CIRCUMFRENCE
      }

      this.timeline.to(b.ribbon,{duration: adjts,strokeDashoffset: bc,ease: Linear.easeNone},"<")

      this.timeline.to(b.wheel,{alpha: 0})

    })
  }

  getGear(setup: GearData){

    const num = setup.numerator
    const den = setup.denominator

    // Update Battery State 

    let g = document.createElementNS(svgns,"g") as Gear
    g.data = setup

    let _wheel = document.createElementNS(svgns,"g") 

    let _texture = document.createElementNS(svgns,"use")
    _texture.setAttribute("href","#battery")

    let _wrench = document.createElementNS(svgns,"use")
    _wrench.setAttribute("href","#wrench")
    gsap.set(_wrench,{alpha: 0,scale: 0.85,transformOrigin: "50% 50%",x:-36,y:-35})

    // MOOOOOOOO - Manual texture offset. Based on geometry of the battery/gear.
    gsap.set(_texture,{x:-38,y:-40})

    const _circumfrence = 2*this.BATTERY_RADIUS*Math.PI

    let _ribbon = document.createElementNS(svgns,"circle")

    g.fraction = this.getFraction(this.BATTERY_RADIUS+this.RIBBON_WIDTH/2,0.65,setup.denominator)

    _wheel.appendChild(g.fraction)
    _wheel.appendChild(_wrench)

    gsap.set(_wheel,{scale: 1,transformOrigin: "50% 50%"})
    
    g.ribbon = _ribbon
    g.wheel = _wheel
    g.texture = _texture
    g.wrench = _wrench


    g.appendChild(_texture)
    g.appendChild(_ribbon)
    g.appendChild(_wheel)

  
    g.set = (newData?: GearData | null)=>{
      if (newData){
        g.data = newData
      }

      if (g.data.numerator < 0){
        g.data.direction = false
      } else  {
        g.data.direction = true
      }

      const a = Math.abs(g.data.numerator)
      const b = Math.abs(g.data.denominator)

      g.fraction.setTicks(b)

          // Direction is boolean. (Forward,true,backward, false)
    let _color = g.data.direction ? this.COLOR_BATTERY_FORWARD : this.COLOR_BATTERY_BACKWARD

      const arc = _circumfrence*(1-a/b)

      gsap.set(g.wheel,{rotation: 0})

      if (g.data.direction){
        gsap.set(_wrench,{rotation: -a/b*360})
        gsap.set(_ribbon,{attr: {r: this.BATTERY_RADIUS},scaleY: -1,scaleX: 1,rotation: 90,stroke: _color,strokeWidth: 10,strokeDashoffset: arc,strokeDasharray: _circumfrence,fillOpacity: 0})
      } else {
        gsap.set(_wrench,{rotation: a/b*360})
        gsap.set(_ribbon,{attr: {r: this.BATTERY_RADIUS},scaleY: 1,scaleX: 1,rotation: 90,stroke: _color,strokeWidth: 10,strokeDashoffset: arc,strokeDasharray: _circumfrence,fillOpacity: 0})
      }
    }

    g.set()

    return g
  }


  createTicks() {
    for(let i=0;i<=26;i++){
      let _t = this.getTick()
      this.ticks.push(_t)
    }
  }

  drawTicks(){
    const step = this.CIRCUMFRENCE/this.currentPuzzle.numberLineDenominator
    this.ticks.forEach((t,i)=>{
      gsap.set(t,{transformOrigin: "50% 0%"})
      if (i>this.currentPuzzle.numberLineDenominator*3){
        gsap.set(t,{scaleX:1,scaleY:1,alpha : 0})
      }
      else if (i%this.currentPuzzle.numberLineDenominator === 0 ){
        gsap.set(t,{alpha: 1,scaleX: 1,scaleY: 1.2,x: this.PADDING+i*step,y: this.NUMBER_LINE_Y+this.STROKE_NUMBER_LINE})
      } else {
        gsap.set(t,{alpha: 1,scaleX: 0.75,scaleY: 0.65,x: this.PADDING+i*step,y: this.NUMBER_LINE_Y})
      }
      this.arena.appendChild(t)
    })
  }

  doSomethingWithMyInterface(arg) {
    console.log("this",arg)
  }


  // we might not need offset anumore
  getFraction(r: number,hole: number,den: number,offset: number=0){
    let sf = this.STROKE_FRACTION
    let g = document.createElementNS(svgns,"g") as Fraction
    g.ticks = []
    const innerCircleOrigin = {
      x: r - hole*r,
      y: r - hole*r
    }

    const _strokeWidth = r/20

    g.innerCircle = document.createElementNS(svgns,"circle")
    gsap.set(g.innerCircle,{attr: {r: r*hole},fillOpacity: 0,strokeWidth: _strokeWidth,stroke: sf})

    g.outerCircle = document.createElementNS(svgns,"circle")
    gsap.set(g.outerCircle,{attr: {r: r},fillOpacity: 0,strokeWidth: _strokeWidth,stroke: sf})

    for (let i=0;i<12;i++){

      g.lineGroup = document.createElementNS(svgns,"g")

      let shortline = document.createElementNS(svgns,"line")
      gsap.set(shortline,{attr: {x1:0,y1:r*hole,y2: r},stroke: sf,strokeWidth: _strokeWidth})

      let longline = document.createElementNS(svgns,"line")
      gsap.set(longline,{attr: {x1:0,y1:r},strokeOpacity: 0.001,stroke: "white",strokeWidth: _strokeWidth})

      g.lineGroup.appendChild(shortline)
      g.lineGroup.appendChild(longline)

      g.ticks.push(g.lineGroup)

      g.appendChild(g.lineGroup)
    }
    g.appendChild(g.innerCircle)
    g.appendChild(g.outerCircle)

    g.setTicks = (den)=> {

      g.ticks.forEach((t,i)=>{
       if (den == 1) {
          gsap.set(t,{alpha: 0})
       } else if (i>den){
          gsap.set(t,{rotation: offset,alpha: 0})
        } else {
          g.appendChild(t)
          gsap.set(t,{rotation: offset + 360/den*i,alpha: 1})
        }
      })
    }

    return g
  }

  // UI Actions 



  feedbackPlay(){
    this.buildTimeline()
    setTimeout(()=>{
      this.timeline.play()
    },1000)
  }

  focusGear(e,i){

    const padBBox = this.controlPad.getBBox()
    
    let b = this.uiGears[i]
  
      this.wandtimeline.kill()
    if (this.currentPuzzle.mode == "mult"){
      gsap.set(this.curtain,{pointerEvents: "auto"})
      this.gearsInEditing = this.uiGears
      let gcount = this.gearsInEditing.length 

      let spreadWidth = 1.5*this.DIAMETER*(gcount-1)

      this.gearsInEditing.forEach((g,i)=>{
         gsap.to(g,{scale: 2,x: this.CENTER_X - spreadWidth/2+i*1.5*this.DIAMETER, y: this.NUMBER_LINE_Y-250,transformOrigin: "50% 50%"})
         this.arena.appendChild(g)
      })
      gsap.to(this.curtain,{alpha: 0.5})
      gsap.set(this.controlPad,{x: 640 - padBBox.width/2})
      gsap.to(this.controlPad,{y: 400})
      this.arena.appendChild(this.controlPad)
    }
    else if (!b.editing && b.data.editable) {
      gsap.set(this.curtain,{pointerEvents: "auto"})
        const bBBox = b.getBBox()
        gsap.to(b,{scale: 2,x: 640, y: this.NUMBER_LINE_Y-250,transformOrigin: "50% 50%"})
        b.editing = true
        this.peeking = false
        this.gearsInEditing = [b]
        gsap.to(this.curtain,{alpha: 0.5})
        gsap.set(this.controlPad,{x: 640 - padBBox.width/2})
        gsap.to(this.controlPad,{y: 400})
        this.arena.appendChild(this.controlPad)
    } else if (!b.data.editable) {
      
      const onComplete = ()=>{
        gsap.to(b,{scaleY: 1, scaleX: 1,duration: 0.5,ease: "elastic"})
      }
      gsap.to(b,{scaleY: 1.3,scaleX: 0.7,duration: 0.15,onComplete: onComplete})
      
    } 
  }


  controlPadDown(e){

    this.gearsInEditing.forEach(g=>{

      let _id = gsap.getProperty(e.target,"id")
      let num = g.data.numerator
      let den = g.data.denominator
  
      let absNum = Math.abs(num)
      let absDen = Math.abs(den)
  
      console.log("control pad down",_id)
  
      switch(_id){
        case "right": 
          num = (num < den) || num == -den ? num + 1 : num
          break;
        case "left": 
          num = (absNum < den) || num == den ? num - 1 : num
          break;
        case "up": 
          den = den < 12 ? den + 1 : den
          break;
        case "down": 
        if (den == num){
          den = den == 1 ? 1: den - 1 
          num = num == 1 ? 1: num - 1
        } else if (absNum == den) {
          den = den == 1 ? 1: den - 1 
          num = num == 1 ? 1: num + 1
        } else {
          den = (den > 0) ? den -1 : den 
        }
          break;
        case "center":
          g.data.direction = !g.data.direction
          num = -num
          break;
        default: 
          console.log('no valid identifier found')
        }
  
        g.data.numerator = num 
        g.data.denominator = den
  
        console.log("num,den beofre set",num,den)
  
       g.set()
    })

  }

  // On curtain pointer down. Should abaondon all editing. 
  abandonEditing(){
    this.uiGears.forEach((b,i)=>{
      gsap.to(b,{scale: 1,x: b._x,y: this.NUMBER_LINE_Y+75,onComplete: ()=>gsap.set(this.curtain,{pointerEvents: "none"})})
      b.editing = false
    })
    gsap.to(this.curtain,{alpha: 0})
    gsap.to(this.controlPad,{y: 1000})
  }



  feedbackPause(e){
    this.timeline.pause()
  }

  // Drawing Functions


  buildWandTimeline(){
      const editableBatteries = this.uiGears.filter(e=>e.data.editable == true && this.arena.appendChild(e))
      if (editableBatteries.length != 0){
        this.wandtimeline.clear()
        this.wandtimeline.to(this.curtain,{duration: 0.5,alpha: 0.5})
        this.wandtimeline.to(editableBatteries,{duration: 0.3,scaleX: 1.3,scaleY: 0.7},"<")
        this.wandtimeline.to(editableBatteries,{duration: 0.3,scaleX: 0.7,scaleY: 1.3})
        this.wandtimeline.to(editableBatteries,{duration: 0.5,scale: 1,ease: "elastic"})
        this.wandtimeline.pause()
      } else if (this.currentPuzzle.input == "ship"){
        gsap.set(this.curtain,{pointerEvents: "none"})
        this.wandtimeline.clear()
        this.wandtimeline.to(this.curtain,{duration: 0.5,alpha: 0.5})
        this.wandtimeline.to(this.shipGroup,{x: "+=25",duration: 0.5,ease: Power1.easeOut },"<")
        this.wandtimeline.to(this.shipGroup,{duration: 0.5,x: "-=50",ease: Power1.easeOut})
        this.wandtimeline.to(this.shipGroup,{duration: 0.5,x: "+=25",ease: "back"})
        this.wandtimeline.pause()
      }
  }


  getValForX(x){
    return (x-this.PADDING)/this.CIRCUMFRENCE
  }

  getWidthForVal(){
    
  }



  buildSpaceShipTimeline(to: number){
    let w = this.currentPuzzle.shipWidth*this.CIRCUMFRENCE
    let s = w/this.beamFrame.width

    this.shiptimeline.clear()
    gsap.set(this.shipGroup,{x: 0,y: -this.shipFrame.height,scale: 1})
    gsap.set(this.beam,{scaleX: s,y: this.shipFrame.height,x: this.shipFrame.width/2-w/2,scaleY: 0})
    this.shiptimeline.to(this.shipGroup,{duration: 1,y: 0})
    this.shiptimeline.to(this.shipGroup,{duration: 1.5,x: to-this.shipFrame.width/2,ease: "elastic"})
    this.shiptimeline.to(this.beam,{duration: 1,scaleY: 1})
    this.shiptimeline.to(this.shipGroup,{duration: 1,y: -1.05*this.shipFrame.height},"<")
  }


  getPuzzle(index){
    return JSON.parse(JSON.stringify(this.puzzles[index]))
  }

  scorePuzzle(){
    let rbox = this.robotFrame
    let rx = gsap.getProperty(this.robot,"x")
    let ry = gsap.getProperty(this.robot,"y")

    // new score method
    let c = this.shipLocation
    let valMin = c-this.currentPuzzle.shipWidth/2
    let valMax = c+this.currentPuzzle.shipWidth/2
    let centerVal = rx/this.CIRCUMFRENCE // because robot starts at zero
    let centerX = rx+this.PADDING 

    this.scoringtimeline.clear()

    if (centerVal<=valMax && centerVal>=valMin){
       this.scoringtimeline.to(this.robot,{y: -rbox.height,duration: 2.5})
       this.scoringtimeline.to(this.beam,{scaleY: 0,duration: 0.5})
       this.scoringtimeline.to(this.shipGroup,{duration: 1,y: 250})
       this.scoringtimeline.to(this.shipGroup,{duration: 1.5,x: 200,y: 100,ease: "elastic"})
       this.scoringtimeline.to(this.shipGroup,{duration: 0.7,scale: 0},"<")
       this.puzzleAttempts.push(true)
    } else {
      gsap.set(this.radioCircle,{x: centerX,y: ry,scale: 0,alpha: 1})
      this.scoringtimeline.to(this.radioCircle,{scale: 20,alpha: 0,duration: 1})
      this.scoringtimeline.set(this.radioCircle,{scale: 1,alpha: 1})
      this.scoringtimeline.to(this.radioCircle,{scale: 20,alpha: 0,duration: 1})
      this.scoringtimeline.set(this.radioCircle,{scale: 1,alpha: 1})
      this.scoringtimeline.to(this.radioCircle,{scale: 20,alpha: 0,duration: 1})
      this.scoringtimeline.set(this.radioCircle,{scale: 1,alpha: 1})
      this.scoringtimeline.to(this.radioCircle,{scale: 20,alpha: 0,duration: 1})
      this.scoringtimeline.set(this.radioCircle,{scale: 0,alpha: 1})
      this.puzzleAttempts.push(false)
    }

    this.scoringtimeline.play()
  }

  onWandComplete(){
    gsap.set(this.curtain,{pointerEvents: "auto"})
  }

  onGroundDown(e){
    let sw = this.shipFrame.width
    if(this.currentPuzzle.input == "ship"){
      this.buildWandTimeline()
      let _x = this.cursorPoint(e).x
      this.shipLocation = this.getValForX(_x)
      gsap.set(this.shipGroup,{x: _x-sw/2})
    }
  }

  onBackgroundDown(e){

    // Peeking Deprecated
    if (this.peeking){
      this.uiGears.forEach(g=>{
        gsap.to(g,{duration: 0.5,scale: 1})
        this.peeking = false
      })
    } else if (false){
      /*
      let _x = this.cursorPoint(e).x
      this.shipLocation = this.getValForX(_x)
      gsap.set(this.shipGroup,{x: _x-sw/2})
      */
    } else {
      this.arena.appendChild(this.shipGroup)
      this.wandtimeline.restart()
    }
  }

  goButtonClicked(){
    this.abandonEditing()

    if (this.feedbackEnded){
      let p = this.getPuzzle(this.puzzleIndex%this.puzzleCount) as Puzzle
      p.attempts = []
      this.loadPuzzle(p)
      this.feedbackEnded = false
      this.playShipIntro(1.5)
      this.goTween.restart()
      this.goTween.pause()
      gsap.set(this.goButton,{scale: 1,top: "1%",left: "1%",rotation: 0})
    } else {
      this.arena.appendChild(this.robot)
      gsap.to(this.goButton,{duration: 0.25,scale: 0})
      gsap.set(this.goButton,{pointerEvents: "none"})
      gsap.set(this.arena,{pointerEvents: "none"})
      this.feedbackPlay()
    }
  }





  init(){

    /*
    
    const indicatorGroup = document.createElementNS(svgns,"g")
    const indicatorCircle = document.createElementNS(svgns,"circle")
    const rectBackground = document.createElementNS(svgns,"rect")

    indicatorGroup.appendChild(rectBackground)
    indicatorGroup.appendChild(indicatorCircle)

    gsap.set(rectBackground,{width: 500,height: 500,fill: "white"})
    gsap.set(indicatorCircle,{attr: {cx: 250, cy:250, r: 200}, strokeLinecap: "round", stroke: "#40c3f7",fill: "white",strokeDasharray: 1256,strokeWidth: 60})
    gsap.set(indicatorGroup,{x: 200,y: 200})


    setTimeout(()=>{
      this.arena.appendChild(indicatorGroup)
      gsap.to(indicatorCircle,{ease: Linear.easeNone,duration: 10,strokeDashoffset: 1256})
    },3000)
    */

  
    // ------- CONSTANTS ----------
    let numOfBatteries = this.currentPuzzle.batteries.length
    let batteryLength = 100*(numOfBatteries-1)
    let batteryX = 1280/2 - batteryLength/2

    // ------- CREATE ----------

    // Radio Circle 
    this.radioCircle = document.createElementNS(svgns,"circle")


    // Gears
    let dum = this.currentPuzzle.batteries[0]
    for (let i = 0;i<6;i++){
      let g = this.getGear(dum)
      gsap.set(g,{transformOrigin: "50% 50%"})
      this.gearPool.push(g)
      g.addEventListener('pointerdown',e=>this.focusGear(e,i))
    }

    // Gears (Formerly Battery)
    this.currentPuzzle.batteries.forEach((d,i) => {
      let b = this.gearPool[i]
      b.set(d)
      gsap.set(b,{transformOrigin: "50% 50%",x: batteryX + 100*i,y: this.NUMBER_LINE_Y+75})
      this.uiGears.push(b)
    });

    // Ground
    this.ground = document.createElementNS(svgns,"use")
    this.ground.setAttribute("href","#ground")

    // Robot
    this.robot = document.createElementNS(svgns,"use")
    this.spaceShip = document.createElementNS(svgns,"use")

    // Beam
    this.beam = document.createElementNS(svgns,"use")

    // ShipGroup
    this.shipGroup = this.createShipGroup()

    // Ticks
    this.createTicks()

    // ------- APPEND ----------


    // Group
    this.arena.appendChild(this.shipGroup)

    // Radio 
    this.arena.appendChild(this.radioCircle)

    // Robot
    this.arena.appendChild(this.robot)

    // Ground
    this.arena.appendChild(this.ground)

    //  -------  INITIALIZE -------
    
    gsap.set(this.ground,{y: this.NUMBER_LINE_Y,scaleY: 1.55})
    gsap.set(this.beam,{transformOrigin: "50% 0%",scale: 0})
    gsap.set(this.shipGroup,{y: -1.1*this.shipFrame.height})
    gsap.set(this.radioCircle,{attr: {r: 4},scale: 0,stroke: "red", strokeWidth: 4,transformOrigin: "50% 50%"})
    gsap.set(this.robot,{y: this.NUMBER_LINE_Y-this.robotFrame.height})

    // SpaceShip and Beam
    this.spaceShip.setAttribute("href","#spaceship")
    this.beam.setAttribute("href","#beam")

    // Robot set
    this.robot.setAttribute("href","#robot")

    // Also in load puzzle

    //--------- EVENTS ---------
    this.goButton.addEventListener('pointerdown',this.goButtonClicked.bind(this))


    this.nextButton.addEventListener('pointerdown',this.nextPuzzle.bind(this))


    this.background.addEventListener('pointerdown',this.onBackgroundDown.bind(this))

    this.ground.addEventListener('pointerdown',this.onGroundDown.bind(this))

    let controlsImage = document.createElementNS(svgns,"use")
    controlsImage.setAttribute("href","#controlsImage")

    this.curtain = document.createElementNS(svgns,"rect")
    gsap.set(this.curtain,{pointerEvents: "none",width: 1280,height: 720,fill: "#000000",alpha:0})

    this.curtain.addEventListener('pointerdown',()=>this.abandonEditing())
    this.arena.appendChild(this.curtain)
    

    // ----- SETTING PROPERTIES

    gsap.set(this.nextButton,{scale: 0,transformOrigin: "100% 100%"})

    let nl = document.createElementNS(svgns,"line")
    gsap.set(nl,{attr: {y1: 0,x1:0,y2: 0,x2:1280},strokeWidth:4,y: this.NUMBER_LINE_Y,stroke: "#ffffff"})
    this.arena.appendChild(nl)

    this.controlPad.appendChild(controlsImage)
    gsap.set(controlsImage,{pointerEvents: "none"})

    gsap.set(this.controlPad,{scale: 1,y:1000,x: 200})

    // 

    // Generate UI Elements
   

    // Drawing 
    this.drawTicks()

    this.uiGears.forEach(b=>{this.arena.append(b)})

    this.controlPad.addEventListener('pointerdown',this.controlPadDown.bind(this))
    this.arena.appendChild(this.controlPad)

    this.loadPuzzle(this.currentPuzzle)


  }

}