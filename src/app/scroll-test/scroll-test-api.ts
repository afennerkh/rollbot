import {gsap} from "gsap/all"




export class ScrollTestApi {

    // This is "this"
    arena: SVGSVGElement
    
    constructor(svgelement,props){
        // props is like...max, min, other properties we need to create a specific puzzle. 
        this.arena = svgelement

        console.log("arena",this.arena)
    }

    init(){
        // do all your stuff here
        
    }

}