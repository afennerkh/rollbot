
import { getParseErrors, ThrowStmt } from "@angular/compiler"
import {gsap, Linear} from "gsap/all"
import {svgns} from "../api"



class Loader {
  refs: SVGSVGElement
  constructor(refs){
    this.refs = refs

  }
}

// Data Interface

interface BatteryData {
  editable: boolean
  numerator: number
  denominator: number 
  direction: boolean
}


interface State {
  mode: string
  input: string
  shipWidth: number 
  min: number
  max: number
  numberLineDenominator: number
  allowPartitionEdits: boolean
  batteries: Array<BatteryData>
  timeStep: number
}

// UI Interface

interface Battery extends SVGGElement {
  wheel: SVGGElement
  ribbon: SVGCircleElement
  texture: SVGUseElement
  direction: boolean
  wrench: SVGUseElement
  fraction: Fraction
  editing: boolean
  data: BatteryData
  setFraction: (a: number,b: number)=>void
}


interface Fraction extends SVGGElement {
  ticks: Array<SVGGElement>
  lineGroup: SVGGElement
  innerCircle: SVGCircleElement
  outerCircle: SVGCircleElement
  setTicks: (a: number)=>void
}


export class RadialLinear {

  // UI Elements
  arena: SVGSVGElement
  overlay: SVGSVGElement
  controls: HTMLElement
  assets: SVGDefsElement
  batteries: Array<Battery> = []
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


  timeline: gsap.timeline
  ctltimeline: gsap.timeline
  origin: any
  state: State
  editArea: any
  point: SVGPoint


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


  constructor(dom,state){

    this.arena = dom.arena
    this.controls = dom.controls
    this.assets = dom.assets 
    this.overlay = dom.overlay
    this.controlPad = dom.controlPad
    this.state = state as State

    // Constants
    this.editArea = {x: 100,y: 80,width: 250,height: 140}
    this.state = state as State
    this.timeline = gsap.timeline({paused: true})
    this.ctltimeline = gsap.timeline({paused: true})
    this.point = this.arena.createSVGPoint()

    this.init()
  }

  // TODO

  // Generators
  getTick(height=20,strokeWidth=4,color="white"){
    let t = document.createElementNS(svgns,"line")
    gsap.set(t,{attr: {y2: height},strokeLinecap: "round", strokeWidth: strokeWidth,stroke: color})
    return t
  }

  buildTimeline(){
    // Convenience Constants: 
    const bs = this.BATTERY_SCALE
    const bc = this.BATTERY_RADIUS*2*Math.PI
    const ts = this.state.timeStep

    
    let head = this.PADDING + this.state.min*this.CIRCUMFRENCE


    this.batteries.forEach((b,i)=>{

      // Testing Functions 
  
      this.arena.appendChild(b)
      // MOOO this data might change
      const bData = this.state.batteries[i]
      const {numerator,denominator} = bData
      const frac = numerator/denominator
      const currentRotation = gsap.getProperty(b.wheel,"rotation")
      
      this.timeline.to(b,{duration: ts/3,x: head,y: this.NUMBER_LINE_Y - this.DIAMETER/2})
      this.timeline.to(b.wheel,{duration: ts/4,scale: bs})
      if (bData.direction){
        this.timeline.to(b.ribbon,{duration: ts/4,scaleX: bs, scaleY: -bs},"<")
      } else {
        this.timeline.to(b.ribbon,{duration: ts/4,scaleX: bs,scaleY: bs},"<")
      }
      this.timeline.to(b.texture,{duration: ts/4,alpha: 0},"<")
      this.timeline.to(b.wrench,{alpha: 1,duration: ts/4})


      if (bData.direction == true){
        this.timeline.to(b,{duration: ts,x: head+frac*this.CIRCUMFRENCE,ease: Linear.easeNone}) 
        this.timeline.to(this.robot,{duration: ts,x: head + frac*this.CIRCUMFRENCE - this.PADDING,ease: Linear.easeNone},"<") 
        this.timeline.to(b.wheel,{duration: ts,rotation: currentRotation+frac*360,ease: Linear.easeNone},"<")
        head = head + frac*this.CIRCUMFRENCE
      } else {
        this.timeline.to(b,{duration: ts,x: head-frac*this.CIRCUMFRENCE,ease: Linear.easeNone}) 
        this.timeline.to(this.robot,{duration: ts,x: head - frac*this.CIRCUMFRENCE - this.PADDING,ease: Linear.easeNone},"<") 
        this.timeline.to(b.wheel,{duration: ts,rotation: currentRotation-frac*360,ease: Linear.easeNone},"<")
        head = head - frac*this.CIRCUMFRENCE
      }

      this.timeline.to(b.ribbon,{duration: ts,strokeDashoffset: bc,ease: Linear.easeNone},"<")

      this.timeline.to(b.wheel,{alpha: 0})

    })
  }

  getBattery(setup: BatteryData){

    const num = setup.numerator
    const den = setup.denominator


    // Update Battery State 


    // Direction is boolean. (Forward,true,backward, false)
    let _color = setup.direction ? this.COLOR_BATTERY_FORWARD : this.COLOR_BATTERY_BACKWARD

    let g = document.createElementNS(svgns,"g") as Battery
    g.data = setup

    let _wheel = document.createElementNS(svgns,"g") 

    let _texture = document.createElementNS(svgns,"use")
    _texture.setAttribute("href","#battery")

    let _wrench = document.createElementNS(svgns,"use")
    _wrench.setAttribute("href","#wrench")
    gsap.set(_wrench,{alpha: 0,scale: 0.85,transformOrigin: "50% 50%",x:-36,y:-35})

    // MOOOOOOOO - Manual texture offset. Based on geometry of the battery.
    gsap.set(_texture,{x:-38,y:-40})

    const _circumfrence = 2*this.BATTERY_RADIUS*Math.PI
    const arc = _circumfrence*(1-num/den)

    let _ribbon = document.createElementNS(svgns,"circle")

    // This works for backwardsƒgetBa

    // MOOOOO Hardcoding
    if (setup.direction){
      gsap.set(_wrench,{rotation: -num/den*360})
      gsap.set(_ribbon,{attr: {r: this.BATTERY_RADIUS},scaleY: -1,rotation: 90,stroke: _color,strokeWidth: 10,strokeDashoffset: arc,strokeDasharray: _circumfrence,fillOpacity: 0})
    } else {
      gsap.set(_wrench,{rotation: num/den*360})
      gsap.set(_ribbon,{attr: {r: this.BATTERY_RADIUS},rotation: 90,stroke: _color,strokeWidth: 10,strokeDashoffset: arc,strokeDasharray: _circumfrence,fillOpacity: 0})
    }
    

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

    g.setFraction = (a,b)=>{
      console.log(g,"g.data")
      g.data.numerator = a
      g.data.denominator = b
      g.fraction.setTicks(b)
    }

    g.setFraction(num,den)

    return g
  }


  createTicks() {
    let n = this.state.max*this.state.numberLineDenominator
    for(let i=0;i<=n;i++){
      let _t = this.getTick()
      this.ticks.push(_t)
    }
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
      console.log("setting ticks")
      g.ticks.forEach((t,i)=>{
        if (i>den){
          console.log("removing ticks")
          gsap.set(t,{rotation: offset + 0})
        } else {
          console.log("adding ticks")
          g.appendChild(t)
          gsap.set(t,{rotation: offset + 360/den*i})
        }
      })
    }

    return g
  }

  // UI Actions 

  presentControls(){

  }

  batteryFromTo(from,to){

  }

  feedbackPlay(){
    console.log("feedback")
    this.timeline.play()
  }

  focusBattery(e,b){
  if (!b.editing) {
    this.arena.appendChild(this.curtain)
    this.arena.appendChild(b)
    this.arena.appendChild(this.controlPad)
    let bx = gsap.getProperty(b,"x")
    gsap.to(b,{scale: 2,y: this.NUMBER_LINE_Y-250})
    gsap.to(this.curtain,{alpha: 0.5})
    gsap.set(this.controlPad,{x: bx-138.5})
    gsap.to(this.controlPad,{y: 400})
    b.editing = true
    } 
  }

  // Callbacks
  onAbandonComplete(){
    this.arena.removeChild(this.curtain)
  }

  controlPadDown(e){
    let _id = gsap.getProperty(e.target,"id")
    console.log("id",_id)

  }

  // On curtain pointer down. Should abaondon all editing. 
  abandonEditing(){
    this.batteries.forEach(b=>{
      gsap.to(b,{scale: 1,y: this.NUMBER_LINE_Y+75})
      b.editing = false
    })
    gsap.to(this.curtain,{alpha: 0,onComplete: this.onAbandonComplete.bind(this)})
    gsap.to(this.controlPad,{y: 1000})
  }

  resetBatteries(){

  }

  feedbackReset(){}




  feedbackPause(e){

    console.log("this,e",this,e)

    console.log("boundingbox",e.target.getBBox())

    this.point.x = e.clientX;
    this.point.y = e.clientY;
    console.log(e.clientX,e.clientY)

    // The cursor point, translated into svg coordinates
    var cursorpt =  this.point.matrixTransform(this.arena.getScreenCTM().inverse());
    console.log("(" + cursorpt.x + ", " + cursorpt.y + ")");
  
  }


  // Drawing Functions

  drawTicks(){
    const step = this.CIRCUMFRENCE/this.state.numberLineDenominator
    this.ticks.forEach((t,i)=>{
      gsap.set(t,{x: this.PADDING+i*step,y: this.NUMBER_LINE_Y})
      this.arena.appendChild(t)
    })
  }


  init(){



    let numOfBatteries = this.state.batteries.length
    let batteryLength = 100*(numOfBatteries-1)
    let batteryX = 1280/2 - batteryLength/2

    this.state.batteries.forEach((e,i) => {
      let b = this.getBattery(e)
      this.arena.appendChild(b)
      gsap.set(b,{transformOrigin: "50% 50%",x: batteryX + 100*i,y: this.NUMBER_LINE_Y+75})
      this.batteries.push(b)
      b.addEventListener('pointerdown',e=>this.focusBattery(e,b))
    });


    let {x,y,width,height} = this.editArea

    let vBox = x + " " + y + " " + width + " " + height

    this.leave = document.createElementNS(svgns,"use")
    this.zoom = document.createElementNS(svgns,"use")
    this.ctls = document.createElementNS(svgns,"use")


    this.leave.setAttribute("href","#leave")
    this.zoom.setAttribute("href","#zoom")
    this.ctls.setAttribute("href","#fractioncontrols")

    this.overlay.appendChild(this.leave)
    this.overlay.appendChild(this.zoom)
    this.overlay.appendChild(this.ctls)

    gsap.set([this.leave,this.zoom,this.ctls],{scale: 4,transformOrigin: "50% 50%"})
    gsap.set(this.leave,{x: 50,y: 20})
    gsap.set(this.zoom,{x: 50,y: 600})
    gsap.set(this.ctls,{x: 50,y: 240})
    gsap.set(this.overlay,{x:-170})


    this.robot = document.createElementNS(svgns,"use")
    this.robot.setAttribute("href","#robot")
    gsap.set(this.robot,{y: 174})
    
    
    this.robot.addEventListener('pointerdown',()=>{
      this.feedbackPlay()
    })
    



    this.ground = document.createElementNS(svgns,"use")
    this.ground.setAttribute("href","#ground")
    gsap.set(this.ground,{y: this.NUMBER_LINE_Y,scaleY: 1.55})
    
    this.arena.appendChild(this.robot)
    this.arena.appendChild(this.ground)


    let controlsImage = document.createElementNS(svgns,"use")
    controlsImage.setAttribute("href","#controlsImage")


    this.curtain = document.createElementNS(svgns,"rect")
    gsap.set(this.curtain,{width: 1280,height: 720,fill: "#000000",alpha:0.7})

    this.curtain.addEventListener('pointerdown',()=>this.abandonEditing())





    let nl = document.createElementNS(svgns,"line")
    gsap.set(nl,{attr: {y1: 0,x1:0,y2: 0,x2:1280},strokeWidth:4,y: this.NUMBER_LINE_Y,stroke: "#ffffff"})


    this.arena.appendChild(nl)



    this.zoom.addEventListener('pointerdown',()=>{
      gsap.set(this.arena,{attr: {viewBox: "0 0 1280 720"}})
      gsap.set([this.leave,this.ctls],{alpha: 0})

    })

    this.zoom.addEventListener('pointerup',()=>{
      gsap.set(this.arena,{attr: {viewBox: vBox}})

      gsap.set([this.leave,this.ctls],{alpha: 1})
    })

    this.leave.addEventListener('pointerup',()=>{
      gsap.set(this.arena,{attr: {viewBox: "0 0 1280 720"}})

      gsap.set([this.zoom,this.leave,this.ctls],{scale: 0})
 
    })

    this.controlPad.appendChild(controlsImage)
    gsap.set(controlsImage,{pointerEvents: "none"})

    gsap.set(this.controlPad,{scale: 0.5,y:1000,x: 200})


    this.ctltimeline.to(this.overlay,{duration: 1,x: 0})

    this.buildTimeline()
    this.createTicks()
    this.drawTicks()


    this.controlPad.addEventListener('pointerdown',this.controlPadDown.bind(this))
    this.arena.appendChild(this.controlPad)

    this.batteries[0].setFraction(1,4)

  }
}