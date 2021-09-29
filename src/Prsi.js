import React, {useReducer, useEffect, useRef} from "react"
import Card from "./Card"
import { ImSpades, ImClubs, ImDiamonds, ImHeart } from "react-icons/im";

import "./css/Prsi.css"

const CARD_SUIT = [ 'Hearts', 'Diamonds', 'Spades', 'Clubs' ]
const CARD_NAME = [ '7', '8', '9', '10', 'J', 'Q', 'K', 'A' ]
const CARDS = []
for (let suit of CARD_SUIT) {
  for (let name of CARD_NAME) {
    CARDS.push({suit, name})
  }
}
const SPEED = 1000
const STATUS = {
  PlayerMove:         "RUNNING",
  PlayerSelectColor:  "SELECT_COLOR",
  AIMove:             "AI_MOVE",
  EndGame:            "END_GAME"
}
const ACTION = { 
  NewGame:            "NEW_GAME", 
  PlayCard:           "PLAY_CARD",
  PlayStop:           "PLAY_STOP",  
  AIPlay:             "AI_PLAY",
  GetCard:            "GET_CARD", 
  ChangeSuit:         "CHANGE_SUIT"
}

function getInitialState() {
  
  function getCard(_cards, count) {
    let out = []
    for (let i=0; i<count; i++)
      out.push( _cards.pop() )
    return out
  }

  let cards = [...CARDS].sort( (a,b) => {return (Math.random() < 0.5) ? -1 : 1 } )      // shuffle cards
  return {
    status:             STATUS.PlayerMove,
    playerA:            getCard(cards, 4) ,
    playerB:            getCard(cards, 4),
    cardAlreadyPlayed:  getCard(cards, 1),
    cardDesk: cards,
    attackSize: 0,
    isStop: false,
    requiredSuit: null
  }
}
function getCardIndex(arr, suit, name) {
  let index = null
  for (let i=0; i< arr.length; i++) 
    if (arr[i].suit === suit && arr[i].name === name) index = i
  return index
}
// presun konkretni karty z jednoho pole karet do druheho
function playCard(from, to, card) {
  let indexFrom = getCardIndex(from, card.suit, card.name)
  let resultFrom = from.filter( (c,i) => i !== indexFrom )
  let resultTo = [...to, card ]
  console.log("Playing card = ")
  console.log(card)
  return [resultFrom, resultTo]
}

function getCardFromHeap(heap, to, count) {
  console.log("Beru "+count+" karet z hromady ")
  let outHeap = [...heap]
  let outTo = [...to]
  for (let i=0; i<count; i++) {
    let newCard = outHeap.pop()
    console.log("do seznamu")
    outTo.push(newCard)
  }
  return [outHeap, outTo]
 
}

function isCardPlayable(state, card) {
  let lastCard = state.cardAlreadyPlayed[state.cardAlreadyPlayed.length-1]
  return true &&   
      !state.isStop && state.attackSize === 0 && (
        (card.suit === lastCard.suit || card.name === lastCard.name) && state.requiredSuit === null// kdyz mam, hazu
        )
    || state.requiredSuit !== null && card.suit === state.requiredSuit  
    ||!state.isStop && state.attackSize !== 0 && (card.name === "7")
    ||!state.isStop && state.attackSize === 0 && (card.name === "Q" )    // kdyz nemam, zkusim hrat damou
    || state.isStop && (card.name === "A" ) 
  
  //return cardToPlay
}

function gameReducer(state, action) {


  switch(action.type) {
    case ACTION.NewGame: return getInitialState() 
      break
    case ACTION.PlayCard: 
      console.log("Player A")
      if ( isCardPlayable(state, action.card) ) {   
        let [newPlayerA, newCardAlreadyPlayed ] = playCard( state.playerA, state.cardAlreadyPlayed, action.card )  
        return {
          ...state,
          status:             action.card.name === "Q" ? STATUS.PlayerSelectColor : STATUS.AIMove,
          cardAlreadyPlayed:  newCardAlreadyPlayed,
          playerA:            newPlayerA,
          attackSize:         state.attackSize + ( action.card.name==="7" ? 2 : 0),
          isStop:             action.card.name === "A" ? true : false,
          requiredSuit: null
        }
      }
      console.log("timhle jet nemuzu")
      return {...state}
      break
    case ACTION.PlayStop: 
      return {
        ...state, 
        status: STATUS.AIMove,
        isStop: false
      }
      break  
    case ACTION.ChangeSuit: 
      return {
        ...state, 
        requiredSuit: action.suit, 
        status: STATUS.AIMove 
      }
    case ACTION.AIPlay:
      console.log("Player B")
      
      let lastCard2 = state.cardAlreadyPlayed[state.cardAlreadyPlayed.length-1]
      let cardToPlay = state.playerB.find( (c,i) => 
          !state.isStop && state.attackSize === 0 && ( 
              ( (c.suit === lastCard2.suit || c.name === lastCard2.name) && state.requiredSuit === null  )
              || (state.requiredSuit !== null && c.suit === state.requiredSuit) 
              
              ) // kdyz mam, hazu
        ||!state.isStop && state.attackSize !== 0 && (c.name === "7")
        ||!state.isStop && state.attackSize === 0 && (c.name === "Q" )    // kdyz nemam, zkusim hrat damou
        || state.isStop && (c.name === "A" ) 
      )
      if (cardToPlay) {
        let [newPlayerB, newCardAlreadyPlayed ] = playCard( state.playerB, state.cardAlreadyPlayed, cardToPlay )  
        return {
          ...state, 
          status: STATUS.PlayerMove, 
          playerB:  newPlayerB,
          cardAlreadyPlayed : newCardAlreadyPlayed,
          attackSize:         state.attackSize + ( cardToPlay.name==="7" ? 2 : 0),
          isStop: cardToPlay.name === "A" ? true : false, 
          requiredSuit: cardToPlay.name === "Q" ? "Hearts": null  // TODO vybrat nejlepsi barvu protihrace
        }  
      } else if (state.isStop) {
        return {
          ...state, 
          status: STATUS.PlayerMove,
          isStop: false
        }  
      } 
      else {
        console.log("nemam cim jet, musim pribrat kartu")
        let [newCardDesk, newPlayerB] = getCardFromHeap(state.cardDesk, state.playerB, Math.max(1, state.attackSize ) )
        return {
          ...state, 
          cardDesk: newCardDesk,
          playerB: newPlayerB,
          status: STATUS.PlayerMove,
          attackSize: 0
        }  
      }
  case ACTION.GetCard:
      // bere karty z hromady
      let [newCardDesk, newPlayerA] = getCardFromHeap(state.cardDesk, state.playerA, Math.max(1, state.attackSize ) )

      return {
        ...state,
        cardDesk: newCardDesk,
        playerA: newPlayerA,
        status:             STATUS.AIMove,
        attackSize: 0
      }
      break
    default:
  }
  return {...state}
}

function useInterval(callback, delay) {
  const savedCallback = useRef(callback)
  useEffect(() => { savedCallback.current = callback }, [callback])
  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

export default function Prsi() {

  let [game, dispatch] = useReducer(gameReducer, getInitialState() )
  useInterval(() => dispatch({type: ACTION.AIPlay}), game.status === STATUS.AIMove ? SPEED : null)  



  return (
    <div className="Prsi">
      <div className="extraControls">
        <h1>Prší</h1>
        { game.isStop  && game.status === STATUS.PlayerMove && <React.Fragment><h3>confirm stop</h3><button onClick={()=> dispatch({type:ACTION.PlayStop}) }>OK</button></React.Fragment> }
        { game.requiredSuit !== null && <h3>selected suit</h3>}
        { game.requiredSuit === "Hearts" && <button style={{color:"red"}}><ImHeart/></button> }
        { game.requiredSuit === "Diamonds" && <button style={{color:"red"}}><ImDiamonds/></button> }
        { game.requiredSuit === "Spades" && <button><ImSpades/></button> }
        { game.requiredSuit === "Clubs" && <button><ImClubs/></button> }

        { game.status === STATUS.PlayerSelectColor && <h3>select suit</h3>}
        { game.status === STATUS.PlayerSelectColor &&  CARD_SUIT.map(suit => <button onClick={ ()=>dispatch({type:ACTION.ChangeSuit, suit:suit}) } style={{color: (["Hearts","Diamonds"].includes(suit) ? "red" : "black")}}>
                { suit==="Hearts" && <ImHeart/> }
                { suit==="Diamonds" && <ImDiamonds/>}
                { suit==="Spades" && <ImSpades/> }
                { suit==="Clubs" && <ImClubs/> }
            </button>
 )   }
      </div>
      <div className="playerA" style={{position:"absolute", top:450 }}>
        { game.playerA.map(card => {return <Card playable={ game.status === STATUS.PlayerMove && isCardPlayable(game, card )} visible={true} suit={card.suit} name={card.name} onSelect={()=>dispatch({type:ACTION.PlayCard, card: {suit: card.suit, name: card.name} })}/> }) }        
      </div>


      <div style={{position:"absolute"}}>
        { game.playerB.map(card => {return <Card suit={card.suit} name={card.name} onSelect={(suit,name)=>{}} /> }) }        
      </div>

      <div style={{position:"absolute",top:"220px", left:"50px"}}>
      { game.cardAlreadyPlayed.map( (card,i) => {return <div style={{marginLeft: i*2, transformOrigin:"50px 85px", transform: "rotate("+(5*i % 2 )+"deg)"}}><Card heap={true} suit={card.suit} visible={true} name={card.name} onSelect={(suit,name)=>{}} /></div> }) }        
      </div>

      <div style={{position:"absolute", left:280, top:210}} onClick={ ()=> {
        if (!game.isStop && game.status === STATUS.PlayerMove)
          dispatch({type:ACTION.GetCard}) }}>
        { game.cardDesk.map( (card,i) => {return <div style={{ marginLeft: i*3 + (game.cardDesk.length-game.attackSize>i ? -40 : 0), marginTop:i}}>
          <Card  suit={card.suit} heap={true} name={card.name} onSelect={(suit,name)=>{}} />
          </div> }) }        
      </div>

    </div>
  );
}

