import { fromEvent, Subject, merge } from 'rxjs';
import { map, filter, takeUntil } from 'rxjs/operators';
import WORD_LIST from './wordList.json';
import '@styles/main.css';
import green from '@images/green-color.png';
import yellow from '@images/yellow-color.png';


// DOM elements
document.getElementById('warning').style.backgroundImage=`url(${yellow})`; 
document.getElementById('success').style.backgroundImage=`url(${green})`; 
const letterRows = document.getElementsByClassName("letter-row");
const messageText = document.getElementById('message-text');
const clue = document.getElementById('message-clue');
const restartButton = document.getElementById("restart-button");
// Observable
const onKeyDown$ = fromEvent(document,"keydown");
const loadWindow$ = fromEvent(window,'load'); // Evento cuando se reinicie el navegador
const clickButton$ = fromEvent(restartButton,'click'); // Evento cuando haga click en el boton "Reiniciar"
// Subject
const userWinOrLoose$ = new Subject();
// Global Variables
let letterColumnIndex;
let letterRowIndex;
let userAnswer; // Guardar la palabra que introduce el usuario

// Obtener una palabra aleatoria
const getRandomWord = () =>{
    return WORD_LIST[Math.round(Math.random() * WORD_LIST.length)]
}

let wordToPlay;


// Observable
const insertLetter$ = onKeyDown$.pipe(
    map((event) => event.key.toUpperCase()),
    filter(
      (pressedKey) =>
        pressedKey.length === 1 && pressedKey.match(/[a-z]/i) && letterColumnIndex < 5
    )
  );

// Observador
const insertLetter = {
    next: (letter) =>{
        //messageText.textContent = '';
        let letterBox =
        Array.from(letterRows)[letterRowIndex].children[letterColumnIndex];
        letterBox.textContent = letter;
        letterBox.classList.add("filled-letter");
        userAnswer.push(letter);
        letterColumnIndex++;
    }
}

// Observable
const deleteLetter$ = onKeyDown$.pipe(
    map( (event) => event.key.toUpperCase()),
    filter( (letter) => letter === "BACKSPACE" && letterColumnIndex !== 0)
)

// Observador
const deleteLetter = {
    next: () =>{
        letterColumnIndex--;
        let letterBox = Array.from(letterRows)[letterRowIndex].children[letterColumnIndex];
        letterBox.textContent = '';
        letterBox.classList.remove("filled-letter");
        userAnswer.pop();
    }
}

// Observable
const checkWord$ = onKeyDown$.pipe(
    map((event) => event.key),
    filter( (key) => key === "Enter"  && letterRowIndex < 6)
);

// Observador
// Chequeamos si la palabra existe
const checkWord = {
    next: () =>{
        const rightWordToArray = Array.from(wordToPlay.word);

        if(userAnswer.length !== 5){
            messageText.textContent =
                userAnswer.length === 4
                ? "Te falta 1 letra"
                : `Faltan ${ 5 - userAnswer.length }  letras para completar la palabra`;
            
            return;
        }

        /*if(!WORD_LIST.includes(userAnswer.join(""))){
            messageText.textContent = `La palabra ${userAnswer.join("").toLocaleUpperCase()} no está en la lista!!`;
            return;
        }*/

        // CAMBIAR POR UN FOREACH
        for (let i = 0; i < 5; i++) {
            let letterColor = '';
            let letterStatus = Array.from(letterRows)[letterRowIndex].children[i];
            let letterPosition = rightWordToArray.indexOf(userAnswer[i]);
                
            if(letterPosition === -1){
                letterColor = 'letter-grey';
            }else{
                if(rightWordToArray[i] === userAnswer[i]){
                    letterColor = 'letter-green';
                }else{
                    letterColor = 'letter-yellow';
                }
            }

            letterStatus.classList.add(letterColor);
        }

        // Destapamos la pista
        if(letterRowIndex >= 3){
            clue.textContent = `Pista: ${wordToPlay.clue}`;
        }

        if(userAnswer.join('') === wordToPlay.word){
            console.log('gana')
            messageText.textContent = `¡Felicidades! Adivinaste la palabra.`;
            // Ejecuta el Subject
            userWinOrLoose$.next();
            console.log(' boton 1')
            restartButton.disabled = false;
        }else{

            letterColumnIndex = 0;
            userAnswer = [];
            letterRowIndex++;
            if (letterRowIndex === 6){
                console.log('pierde')
                messageText.textContent = `Perdiste!! La palabra correcta es ${ wordToPlay.word}`;
                userWinOrLoose$.next();
                console.log(' boton 2')
                restartButton.disabled = false;
            }
        }
            
    }
}

// 
/*userWinOrLoose$.subscribe(() =>{
    console.log(' subject ')
    let letterRowsWinned = Array.from(letterRows)[letterRowIndex]; 
    // CAMBIAR POR UN FOREACH
    for (let index = 0; index < 5; index++) {
        letterRowsWinned.children[index].classList.add('letter-green');
    }
    //messageText.textContent = `Felicidades acertaste la palabra !!`;
});*/

// Unifica dos observables
const restartBoard$ = merge(loadWindow$, clickButton$);

restartBoard$.subscribe(()=>{
    Array.from(letterRows).map((row)=>{
        Array.from(row.children).map((letterBox)=>{
            letterBox.textContent = "";
            letterBox.classList = "letter";
        })
    });
    letterColumnIndex = 0;
    letterRowIndex = 0;
    userAnswer = [];
    messageText.textContent = "";
    wordToPlay = getRandomWord();
    console.log(wordToPlay.word);
    restartButton.disabled = true;
    clue.textContent="";

    // Subscripciones
    let insertSubscription = insertLetter$.
    pipe(takeUntil(userWinOrLoose$)).subscribe(insertLetter);
    
    let checkSubscription = checkWord$.
    pipe(takeUntil(userWinOrLoose$)).subscribe(checkWord);
    
    let deleteSubscription = deleteLetter$.
    pipe(takeUntil(userWinOrLoose$)).subscribe(deleteLetter);
})
