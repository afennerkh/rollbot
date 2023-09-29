import {gsap} from "gsap/all"
import {svgns} from "../api"



export class ScrollTestApi {

    // This is "this"
    arena: SVGSVGElement
    
    constructor(svgelement,props){
        // props is like...max, min, other properties we need to create a specific puzzle. 
        this.arena = svgelement

        console.log("arena",this.arena)
        this.init()
    }

    init(){
        // do all your stuff here
        let circle = document.createElementNS(svgns,"circle")
        this.arena.appendChild(circle)

        // hey miguel, style this circle.
    }

}