import React from "react";

import "./css/Card.css"

import { ImSpades, ImClubs, ImDiamonds, ImHeart } from "react-icons/im";


export default function Card({suit, name, heap=false, onSelect, visible=false,playable=false}) {
    return (
        <div className="Card" style={{
                position: heap ? "absolute" : null,
                color: visible ? (["Hearts","Diamonds"].includes(suit) ? "red" : "black") : "#aaa", 
                backgroundColor: visible ? "#fff" : "#bbb",
                transform: playable ? "scale(1.1) translate(0,-15px)" : "",
                boxShadow: playable ? "10px 10px 6px #444" : ""
            }}
            key={`${suit}-${name}`} onClick={() => onSelect(suit,name) }>
            <div style={{ top:6, margin:"6px"}}>
                { suit==="Hearts" && <ImHeart/> }
                { suit==="Diamonds" && <ImDiamonds/> }
                { suit==="Spades" && <ImSpades/> }
                { suit==="Clubs" && <ImClubs/> }
            </div>
            <div style={{top:"25px", textAlign:"center", fontSize:"55px"}}>
                {name}
            </div>
            <div style={{ top:120, margin:"8px", paddingLeft:"50px"}}>
                { suit==="Hearts" && <ImHeart/> }
                { suit==="Diamonds" && <ImDiamonds/> }
                { suit==="Spades" && <ImSpades/> }
                { suit==="Clubs" && <ImClubs/> }
            </div>
        </div>
    )
}