
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
  batteryInEditing: Battery
  background: SVGGElement
  spaceShip: SVGUseElement
  beam: SVGUseElement
  goButton: HTMLElement


  timeline: gsap.timeline
  ctltimeline: gsap.timeline
  wandtimeline: gsap.timeline
  shiptimeline: gsap.timeline
  introtimeline: gsap.timeline
  origin: any
  state: State
  editArea: any
  point: SVGPoint

  // Transient State
  feedbackEnded: boolean = false



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
    this.background = dom.background
    this.goButton = dom.goButton
    this.state = state as State

    // Constants
    this.state = state as State
    this.timeline = gsap.timeline({onComplete: this.feedbackComplete.bind(this),paused: true})
    this.wandtimeline = gsap.timeline({paused: true})
    this.ctltimeline = gsap.timeline({paused: true})
    this.shiptimeline = gsap.timeline({paused: true})
    this.introtimeline = gsap.timeline({paused: true})
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

  feedbackComplete(){
    console.log('feedback complete')
    gsap.set(this.arena,{pointerEvents: "none"})
    gsap.set(this.goButton,{pointerEvents: "auto",backgroundImage: `url(${"https://res.cloudinary.com/duim8wwno/image/upload/v1665147162/RetryBtn_jhupgo.svg"})`})
    this.feedbackEnded = true
  }

  restartGame(){
    this.timeline.clear()
    this.resetBatteries()
    gsap.set(this.arena,{pointerEvents: "auto"})
    gsap.set(this.robot,{x: 0})
    gsap.set(this.goButton,{pointerEvents: "auto",backgroundImage: `url(${"https://res.cloudinary.com/duim8wwno/image/upload/v1644246521/SpotlightGoBtn_eqeyvr.svg"})`})
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
      // MOOO this data might change (fixed)
      const bData = b.data
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

      // Adjusted time step so small fractions go at the fsame rate as large ones. 
      const adjts = frac*ts

      if (bData.direction == true){
        this.timeline.to(b,{duration: adjts,x: head+frac*this.CIRCUMFRENCE,ease: Linear.easeNone}) 
        this.timeline.to(this.robot,{duration: adjts,x: head + frac*this.CIRCUMFRENCE - this.PADDING,ease: Linear.easeNone},"<") 
        this.timeline.to(b.wheel,{duration: adjts,rotation: currentRotation+frac*360,ease: Linear.easeNone},"<")
        head = head + frac*this.CIRCUMFRENCE
      } else {
        this.timeline.to(b,{duration: adjts,x: head-frac*this.CIRCUMFRENCE,ease: Linear.easeNone}) 
        this.timeline.to(this.robot,{duration: adjts,x: head - frac*this.CIRCUMFRENCE - this.PADDING,ease: Linear.easeNone},"<") 
        this.timeline.to(b.wheel,{duration: adjts,rotation: currentRotation-frac*360,ease: Linear.easeNone},"<")
        head = head - frac*this.CIRCUMFRENCE
      }

      this.timeline.to(b.ribbon,{duration: adjts,strokeDashoffset: bc,ease: Linear.easeNone},"<")

      this.timeline.to(b.wheel,{alpha: 0})

    })
    this.timeline.onComplete = this.feedbackComplete
  }

  getBattery(setup: BatteryData){

    const num = setup.numerator
    const den = setup.denominator


    // Update Battery State 

    let g = document.createElementNS(svgns,"g") as Battery
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

    // This works for backwardsƒgetBa

    // MOOOOO Hardcoding
    

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
      g.data.numerator = a
      g.data.denominator = b
      g.fraction.setTicks(b)

          // Direction is boolean. (Forward,true,backward, false)
    let _color = setup.direction ? this.COLOR_BATTERY_FORWARD : this.COLOR_BATTERY_BACKWARD


      const arc = _circumfrence*(1-a/b)

      if (setup.direction){
        gsap.set(_wrench,{rotation: -a/b*360})
        gsap.set(_ribbon,{attr: {r: this.BATTERY_RADIUS},scaleY: -1,rotation: 90,stroke: _color,strokeWidth: 10,strokeDashoffset: arc,strokeDasharray: _circumfrence,fillOpacity: 0})
      } else {
        gsap.set(_wrench,{rotation: a/b*360})
        gsap.set(_ribbon,{attr: {r: this.BATTERY_RADIUS},scaleY: 1,rotation: 90,stroke: _color,strokeWidth: 10,strokeDashoffset: arc,strokeDasharray: _circumfrence,fillOpacity: 0})
      }
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

      g.ticks.forEach((t,i)=>{
        console.log("den",den)
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

  focusBattery(e,b){
  if (!b.editing) {
    gsap.set(this.curtain,{pointerEvents: "auto"})
    this.arena.appendChild(b)
    this.arena.appendChild(this.controlPad)
    let bx = gsap.getProperty(b,"x")
    gsap.to(b,{scale: 2,y: this.NUMBER_LINE_Y-250})
    gsap.to(this.curtain,{alpha: 0.5})
    gsap.set(this.controlPad,{x: bx-138.5})
    gsap.to(this.controlPad,{y: 400})
    b.editing = true
    this.batteryInEditing = b
    } 
  }


  controlPadDown(e){
    let _id = gsap.getProperty(e.target,"id")
    console.log("id",_id)
    let num = this.batteryInEditing.data.numerator
    let den = this.batteryInEditing.data.denominator

    switch(_id){
      case "right": 
        num = (num < den) ? num + 1 : num
        break;
      case "left": 
        num = (num > 0) ? num - 1 : num
        break;
      case "up": 
        den = den < 12 ? den + 1 : den
        break;
      case "down": 
      if (den == num){
        den = den == 1 ? 1: den - 1 
        num = num == 1 ? 1: num - 1
      } else {
        den = (den > 0) ? den -1 : den 
      }

        break;
      case "center":
        this.batteryInEditing.data.direction = !this.batteryInEditing.data.direction
      default: 
        console.log('no valid identifier found')
      }

      this.batteryInEditing.setFraction(num,den)
  }

  // On curtain pointer down. Should abaondon all editing. 
  abandonEditing(){
    this.batteries.forEach(b=>{
      gsap.to(b,{scale: 1,y: this.NUMBER_LINE_Y+75,onComplete: ()=>gsap.set(this.curtain,{pointerEvents: "none"})})
      b.editing = false
    })
    gsap.to(this.curtain,{alpha: 0})
    gsap.to(this.controlPad,{y: 1000})
  }

  resetBatteries(){
    let numOfBatteries = this.state.batteries.length
    let batteryLength = 100*(numOfBatteries-1)
    let batteryX = 1280/2 - batteryLength/2
    const _circumfrence = 2*this.BATTERY_RADIUS*Math.PI
  



    this.batteries.forEach((b,i)=>{
      let num = b.data.numerator
      let den = b.data.denominator
      const currentRotation = gsap.getProperty(b.wheel,"rotation")
      

      let _color = b.data.direction ? this.COLOR_BATTERY_FORWARD : this.COLOR_BATTERY_BACKWARD
  
      const arc = _circumfrence*(1-num/den)

      gsap.set(b,{scale: 1,alpha: 1,x: batteryX + 100*i,y: this.NUMBER_LINE_Y+75})
      gsap.set([b.wheel,b.texture],{alpha: 1})
      gsap.set(b.wheel,{scale: 1})
      gsap.set(b.wrench,{alpha: 0})
      b.setFraction(b.data.numerator,b.data.denominator)




      if (b.data.direction){
        console.log("rotation",num,den)
        gsap.set(b.wheel,{rotation: currentRotation-num/den*360})
        gsap.set(b.ribbon,{attr: {r: this.BATTERY_RADIUS},scaleY: -1,scaleX: 1,rotation: 90,stroke: _color,strokeWidth: 10,strokeDashoffset: arc,strokeDasharray: _circumfrence,fillOpacity: 0})
      } else {
        gsap.set(b.wheel,{rotation: currentRotation+num/den*360})
        gsap.set(b.ribbon,{attr: {r: this.BATTERY_RADIUS},scaleY: 1,scaleX: 1,rotation: 90,stroke: _color,strokeWidth: 10,strokeDashoffset: arc,strokeDasharray: _circumfrence,fillOpacity: 0})
      }
    })
  }

  feedbackReset(){}




  feedbackPause(e){
    this.timeline
   
  }


  // Drawing Functions

  drawTicks(){
    const step = this.CIRCUMFRENCE/this.state.numberLineDenominator
    this.ticks.forEach((t,i)=>{
      gsap.set(t,{x: this.PADDING+i*step,y: this.NUMBER_LINE_Y})
      this.arena.appendChild(t)
    })
  }

  buildWandTimeline(){
      this.wandtimeline.clear()
      this.wandtimeline.to(this.curtain,{duration: 0.5,alpha: 0.5})
      this.wandtimeline.to(this.batteries,{duration: 0.35,scaleX: 1.3,scaleY: 0.7},"<")
      this.wandtimeline.to(this.batteries,{duration: 0.35,scaleX: 0.7,scaleY: 1.3})
      this.wandtimeline.to(this.batteries,{duration: 1.5,scale: 1,ease: "elastic"})
  }

  buildSpaceShipTimeline(to: number){
    gsap.set(this.beam,{y: -5,x: to+117})
    this.shiptimeline.to(this.spaceShip,{duration: 1,y: 0})
    this.shiptimeline.to(this.spaceShip,{duration: 2.5,x: to,ease: "elastic"})
    this.shiptimeline.to(this.beam,{duration: 1,scaleY: 1})
  }

  setupWand(){
    gsap.set(this.curtain,{pointerEvents: "auto"})
    this.batteries.forEach(b=>{
    this.arena.appendChild(b)})
  }


  init(){



    // Constants
    let numOfBatteries = this.state.batteries.length
    let batteryLength = 100*(numOfBatteries-1)
    let batteryX = 1280/2 - batteryLength/2


    // Scenery
    this.ground = document.createElementNS(svgns,"use")
    this.ground.setAttribute("href","#ground")
    gsap.set(this.ground,{y: this.NUMBER_LINE_Y,scaleY: 1.55})
    this.arena.appendChild(this.ground)


    
    this.state.batteries.forEach((e,i) => {
      let b = this.getBattery(e)
      this.arena.appendChild(b)
      gsap.set(b,{transformOrigin: "50% 50%",x: batteryX + 100*i,y: this.NUMBER_LINE_Y+75})
      this.batteries.push(b)
      b.addEventListener('pointerdown',e=>this.focusBattery(e,b))
    });


    // SpaceShip and Beam
    this.spaceShip = document.createElementNS(svgns,"use")
    this.beam = document.createElementNS(svgns,"use")

    this.spaceShip.setAttribute("href","#spaceship")
    this.beam.setAttribute("href","#beam")

    this.arena.appendChild(this.beam)
    this.arena.appendChild(this.spaceShip)

    gsap.set(this.spaceShip,{y: -300,pointerEvents: "none"})
    gsap.set(this.beam,{scaleY: 0,pointerEvents: "none"})


    // Robot
    this.robot = document.createElementNS(svgns,"use")
    this.robot.setAttribute("href","#robot")
    gsap.set(this.robot,{y: 174,pointerEvents: "none"})
    this.arena.appendChild(this.robot)

    
    // Event listeners
    this.goButton.addEventListener('pointerdown',()=>{
      if (this.feedbackEnded){
        this.restartGame()
        this.feedbackEnded = false
      } else {
        gsap.set(this.goButton,{pointerEvents: "none"})
        this.feedbackPlay()
      }

    })
    
    this.background.addEventListener('pointerdown',()=>{
      gsap.getProperty(this.curtain,"pointer-events")
      console.log('restarting wand timeline')
      this.setupWand()
      this.wandtimeline.restart()
    })


    let controlsImage = document.createElementNS(svgns,"use")
    controlsImage.setAttribute("href","#controlsImage")


    this.curtain = document.createElementNS(svgns,"rect")
    gsap.set(this.curtain,{pointerEvents: "none",width: 1280,height: 720,fill: "#000000",alpha:0})

    this.curtain.addEventListener('pointerdown',()=>this.abandonEditing())
    this.arena.appendChild(this.curtain)
    

    let nl = document.createElementNS(svgns,"line")
    gsap.set(nl,{attr: {y1: 0,x1:0,y2: 0,x2:1280},strokeWidth:4,y: this.NUMBER_LINE_Y,stroke: "#ffffff"})
    this.arena.appendChild(nl)

    this.controlPad.appendChild(controlsImage)
    gsap.set(controlsImage,{pointerEvents: "none"})

    gsap.set(this.controlPad,{scale: 0.5,y:1000,x: 200})


    this.ctltimeline.to(this.overlay,{duration: 1,x: 0})


    // Timelines
    this.buildWandTimeline()
    this.buildSpaceShipTimeline(640)

    // Generate UI Elements
    this.createTicks()
    this.drawTicks()

    this.controlPad.addEventListener('pointerdown',this.controlPadDown.bind(this))
    this.arena.appendChild(this.controlPad)

    setTimeout(()=>{
      this.introtimeline.add(this.shiptimeline.play())
      this.introtimeline.play()
    },1500)

  }
}