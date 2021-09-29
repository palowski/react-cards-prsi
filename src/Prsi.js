import React, {useReducer, useEffect, useRef} from "react"
import Card from "./Card"
import { ImSpades, ImClubs, ImDiamonds, ImHeart } from "react-icons/im";

import "./css/Prsi.css"

const CARD_ATTACK =     "7"
const CARD_CHANGE_SUIT= "Q"
const CARD_ACE =        "A"
const CARD_SUIT =       [ 'Hearts', 'Diamonds', 'Spades', 'Clubs' ]
const CARD_NAME =       [ CARD_ATTACK, '8', '9', '10', 'J', CARD_CHANGE_SUIT, 'K', CARD_ACE ]
const SPEED =           1000
const ATTACK =          2       // how many card to take when 7 is played
const STATUS = {
  PlayerMove:           "RUNNING",
  PlayerSelectColor:    "SELECT_COLOR",
  AIMove:               "AI_MOVE",
  EndGame:              "END_GAME"
}
const ACTION = { 
  NewGame:              "NEW_GAME", 
  PlayCard:             "PLAY_CARD",
  PlayStop:             "PLAY_STOP",  
  AIPlay:               "AI_PLAY",
  GetCard:              "GET_CARD", 
  ChangeSuit:           "CHANGE_SUIT"
}
const CARDS = []
for (let suit of CARD_SUIT) 
  for (let name of CARD_NAME) 
    CARDS.push({suit, name})

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
    cardDesk:           cards,
    attackSize:         0,        // 7 count indicator
    isStop:             false,    // Ace indicator
    requiredSuit:       null      // Queen selected suit indicator
  }
}

function getCardIndex(arr, suit, name) {
  let index = null
  for (let i=0; i< arr.length; i++) 
    if (arr[i].suit === suit && arr[i].name === name) index = i
  return index
}

function playCard(from, to, card) {
  let indexFrom = getCardIndex(from, card.suit, card.name)
  let resultFrom = from.filter( (c,i) => i !== indexFrom )
  let resultTo = [...to, card ]
  return [resultFrom, resultTo]
}

function getCardFromHeap(heap, to, count) {
  let outHeap = [...heap]
  let outTo = [...to]
  for (let i=0; i<count; i++) {
    let newCard = outHeap.pop()
    outTo.push(newCard)
  }
  return [outHeap, outTo]
}

function isCardPlayable(state, card) {
  let lastCard = state.cardAlreadyPlayed[state.cardAlreadyPlayed.length - 1]
  return true &&   
      !state.isStop && state.attackSize === 0 && ( (card.suit === lastCard.suit || card.name === lastCard.name) && state.requiredSuit === null )
    || state.requiredSuit !== null && card.suit === state.requiredSuit  
    ||!state.isStop && state.attackSize !== 0 && (card.name === CARD_ATTACK)
    ||!state.isStop && state.attackSize === 0 && (card.name === CARD_CHANGE_SUIT )  
    || state.isStop && (card.name === CARD_ACE ) 
}

function gameReducer(state, action) {
  switch(action.type) {
    case ACTION.NewGame: return getInitialState() 
      break
    case ACTION.PlayCard:   // Player A
      if ( isCardPlayable(state, action.card) ) {   
        let [newPlayerA, newCardAlreadyPlayed ] = playCard( state.playerA, state.cardAlreadyPlayed, action.card )  
        if (newPlayerA.length === 0) {return {    // win
          ...state, 
          status:       STATUS.EndGame, 
          winner:       "you", 
          cardAlreadyPlayed: newCardAlreadyPlayed, 
          playerA:      newPlayerA,
          isStop:       false,
          attackSize:   0,
          requiredSuit: null
        }}
        return {
          ...state,
          status:       action.card.name === CARD_CHANGE_SUIT ? STATUS.PlayerSelectColor : STATUS.AIMove,
          cardAlreadyPlayed:  newCardAlreadyPlayed,
          playerA:      newPlayerA,
          attackSize:   state.attackSize + ( action.card.name === CARD_ATTACK ? ATTACK : 0),
          isStop:       action.card.name === CARD_ACE,
          requiredSuit: null
        }
      }
      return {...state}
    case ACTION.PlayStop: 
      return {
        ...state, 
        status:         STATUS.AIMove,
        isStop:         false
      }
    case ACTION.ChangeSuit: 
      return {
        ...state, 
        status:         STATUS.AIMove, 
        requiredSuit:   action.suit
      }
    case ACTION.AIPlay:   // Player B - computer
      let cardToPlay = state.playerB.find( (card,i) => isCardPlayable(state, card) )
      if (cardToPlay) { // can play
        let [newPlayerB, newCardAlreadyPlayed ] = playCard( state.playerB, state.cardAlreadyPlayed, cardToPlay )  
        if (newPlayerB.length === 0) {return {    // win
          ...state, 
          status:       STATUS.EndGame, 
          winner:       "computer", 
          cardAlreadyPlayed: newCardAlreadyPlayed, 
          playerB:      newPlayerB,
          isStop:       false,
          attackSize:   0,
          requiredSuit: null
        }}
        return {
          ...state, 
          status:       STATUS.PlayerMove, 
          playerB:      newPlayerB,
          cardAlreadyPlayed : newCardAlreadyPlayed,
          attackSize:   state.attackSize + ( cardToPlay.name === CARD_ATTACK ? ATTACK : 0),
          isStop:       cardToPlay.name === CARD_ACE, 
          requiredSuit: cardToPlay.name === CARD_CHANGE_SUIT ? CARD_SUIT[ Math.floor(Math.random() * 4) ] : null  // random suit :-) should be the most suitable...
        }  
      } else if (state.isStop) {
        return {
          ...state, 
          status:       STATUS.PlayerMove,
          isStop:       false
        }  
      } 
      else {          // no playable card...
        let [newCardDesk, newPlayerB] = getCardFromHeap(state.cardDesk, state.playerB, Math.max(1, state.attackSize ) )
        return {
          ...state, 
          cardDesk:     newCardDesk,
          playerB:      newPlayerB,
          status:       STATUS.PlayerMove,
          attackSize:   0
        }  
      }
  case ACTION.GetCard:
      let [newCardDesk, newPlayerA] = getCardFromHeap(state.cardDesk, state.playerA, Math.max(1, state.attackSize ) )
      return {
        ...state,
        cardDesk:       newCardDesk,
        playerA:        newPlayerA,
        status:         STATUS.AIMove,
        attackSize:     0
      }
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

      <div className="extraControls">
        <h1>Prší</h1>
        { game.status === STATUS.EndGame && <React.Fragment><h3>winner: {game.winner}</h3><button onClick={()=>dispatch({type:ACTION.NewGame})}>Play again!</button></React.Fragment>}
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
        )}
      </div>
    </div>
  );
}