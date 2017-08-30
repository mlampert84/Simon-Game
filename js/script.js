//I am indebted to the following discussion on the fcc forum for coming up with this sound solution:
// https://forum.freecodecamp.org/t/better-audiocontext-frequencies-for-simon/69483

var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();
var vol = audioCtx.createGain();
vol.gain.value = .02;

var osc1 = audioCtx.createOscillator();
osc1.frequency.value = 440;
osc1.type = 'square';
osc1.start();

var osc2 = audioCtx.createOscillator();
osc2.frequency.value = 349;
osc2.type = 'square';
osc2.start();

var osc3 = audioCtx.createOscillator();
osc3.frequency.value = 523;
osc3.type = 'square';
osc3.start();

var osc4 = audioCtx.createOscillator();
osc4.frequency.value = 466;
osc4.type = 'square';
osc4.start();

var errorOSC = audioCtx.createOscillator();
errorOSC.frequency.value = 210;
errorOSC.type = 'square';
errorOSC.start();

var machineOn = false;
var buttonsOn = false;
//turningOff prevents the on off switch from beging toggled again while it is in the shutdown sequence.
var turningOff = false;
var strictMode = false;
var playerSequence = undefined;
var computerSequence = [];
//playerIsPlaying is necessarily to decide where to manipluate the playerSequence array
var playerIsPlaying = false;
var myGlobalInterval;

var currentTone = undefined;


var buttonTones = {
      button1: osc1,
      button2: osc2,
      button3: osc3,
      button4: osc4
                  }

var keyToTones ={
  37: osc3,
  38: osc4,
  39: osc1,
  40: osc2
}

var keyToButtons ={
  37: "button3",
  38: "button4",
  39: "button1",
  40: "button2"
}




function oscToButton(myOscillator){
  switch(myOscillator){
   case(osc1):
   return  "button1";
    case(osc2):
   return  "button2";
    case(osc3):
   return  "button3";
    case(osc4):
  return  "button4";
    case(errorOSC):
  return  "errorTone";

    default: return "";
         }

}

function startTone(myOscillator){
if(machineOn){
myOscillator.connect(vol);
vol.connect(audioCtx.destination);

$("#"+oscToButton(myOscillator)).addClass('active');
currentTone = myOscillator;
}
}

function stopTone(myOscillator){

   // This forEach() loop is to try to prevent a DOM exception by making sure all tones are disconnected. As it is, I still get the "DOM exception failed to execute disconnect" error sometimes.
 var possibleTones = [osc1,osc2,osc3,osc4,errorOSC];
 possibleTones.forEach(function(toneToStop){
      if(currentTone == toneToStop){
       myOscillator.disconnect(vol);
      vol.disconnect(audioCtx.destination);
      }
     });
currentTone = undefined;

  if(machineOn){
$("#"+oscToButton(myOscillator)).removeClass('active');
}
}




$("#toggle-switch").click(function(){
  if($('input').prop('checked')){
    machineOn = true;
    buttonsOn = true;
    playSequence([1,2,3,4],100,100);
   $('#count-panel').text("--");
  }
  else if(!$('input').prop('checked')){
    turningOff = true;
    clearInterval(myGlobalInterval);
    //this is to make sure to shut of the error tone or any other tones if they are running when the player hits the on off switch.  A better solution would be to stop all audio tones, but if I do that, I get a dom exception error with I try to disconnect those audio nones that are not connected, and I don't know how to check first if the audio nodes are connected. As it is, I still get the "DOM exception failed to execute disconnect' error sometimes.
    var possibleTones = [osc1,osc2,osc3,osc4,errorOSC];
    possibleTones.forEach(function(toneToStop){
      if(currentTone == toneToStop)
        stopTone(currentTone);
    });

    buttonsOn = false;
    playerIsPlaying = false;
    playerSequence = undefined;
    playSequence([4,3,2,1],100,100);

    setTimeout(function(){


if(! $('input').prop('checked')){

     if(strictMode)
     $('#strict-button').click();

       $('#count-panel').text("");
    computerSequence = [];
    machineOn=false;
    turningOff = false;
}
      },800);
   }
});


$("#strict-button").click(function(){
  if(machineOn){
   strictMode=!strictMode;
  if(strictMode)
  $("#strict-indicator-light").css("background-color","darkred");

  else
     $("#strict-indicator-light").css("background-color","black");


  }
  });


$(document).keydown(function(key){
  if(buttonsOn){
    if(key.which in keyToTones)
      startTone(keyToTones[key.which]);
  }
  key.preventDefault();
});

$(document).keyup(function(key){
 if(buttonsOn){
    if(key.which in keyToTones)
      stopTone(keyToTones[key.which]);
  }
  if(playerIsPlaying)
   checkPlayer(keyToButtons[key.which]);
  key.preventDefault();
});

$("#button1,#button2,#button3,#button4").mousedown(function(){
 if(buttonsOn)
   startTone(buttonTones[this.id]);
});
$("#button1,#button2,#button3,#button4").mouseup(function(){
 if(buttonsOn)
  stopTone(buttonTones[this.id]);
 if(playerIsPlaying){
   checkPlayer(this.id);
 }
});

$('#start-button').click(function(){
  if(machineOn && buttonsOn)
    signalGameStart(2);
});


function playSequence(notes,playDuration,pauseDuration){
  var whichButton;
  switch(notes[0]){
    case 1:
    whichButton ="#button1";
    break;
     case 2:
    whichButton ="#button2";
    break;
  case 3:
    whichButton ="#button3";
    break;
  case 4:
    whichButton ="#button4";
    break;
    default: return;
                 }

  startTone(eval("osc"+notes[0]));
  setTimeout(function(){
  stopTone(eval("osc"+notes[0]));
  notes.shift();
  setTimeout(function(){
  playSequence(notes,playDuration,pauseDuration);
  },pauseDuration);
  },playDuration);
 }

function errorSequence(){
  var blinkCount = 5;
  errorOSC.connect(vol);
  vol.connect(audioCtx.destination);
  currentTone = errorOSC;
  buttonsOn = false;
  myGlobalInterval = setInterval(
    function(){
      if(blinkCount===0){
        clearInterval(myGlobalInterval);
        errorOSC.disconnect(vol);
        vol.disconnect(audioCtx.destination);
        currentTone = undefined;
        if(strictMode)
          signalGameStart(2);
        else
         showAndTestPlayer();
      }
      else if(blinkCount%2===1){
        $('#count-panel').text("!!");
        blinkCount--;
      }
      else{
         $('#count-panel').text("");
        blinkCount--;
      }

    },300);
 }

function checkPlayer(buttonPlayed){
  var buttonNumber = parseInt(buttonPlayed.charAt(6));
  console.log(buttonNumber);
  if(buttonNumber===computerSequence[playerSequence.length]){
    playerSequence.push(buttonNumber);
  }
  else
    playerSequence = undefined;

}

function random1to4(){
  return (Math.floor(Math.random()*4) + 1);
}

function showAndTestPlayer(){
   var sequenceToPlay = [];
  for(var i=0;i<computerSequence.length;i++)
  sequenceToPlay[i] = computerSequence[i];

  //showing the player the sequence
  setTimeout(function(){
   $('#count-panel').text(computerSequence.length);
  playSequence(sequenceToPlay,420,50);
                       },1000);

   myGlobalInterval = setInterval(function(){
    if(sequenceToPlay.length===0){
       clearInterval(myGlobalInterval);
       console.log("Computer showed sequence. Waiting for player.");
       buttonsOn = true;
       playerSequence = [];
       playerIsPlaying = true;
       myGlobalInterval = setInterval(function(){

         if(playerSequence === undefined){
           clearInterval(myGlobalInterval);
           console.log("Player messed up sequence.");
           playerIsPlaying = false;
           buttonsOn = false;
           errorSequence();
         }
         else if(playerSequence.length===computerSequence.length){

           clearInterval(myGlobalInterval);
           console.log("Player correctly entered the sequence.  Now adding one more.");
           playerIsPlaying = false;
           buttonsOn = false;
           playOneRound();
         }
         else if(playerSequence.length>computerSequence.length){
           clearInterval(myGlobalInterval);
           console.log("Player messed up sequence.");
           playerIsPlaying = false;
           buttonsOn = false;
           errorSequence();

         }

       },10);
    }
  },10);

}

function winSequence(blinkNumber){
  buttonsOn = false;
   $('#count-panel').text("");

  setTimeout(function(){
   $('#count-panel').text("**");

  if(blinkNumber>1)
    setTimeout(function(){
    winSequence(blinkNumber-1);
    },300);
  else{
    computerSequence = [];
    buttonsOn = true;
    signalGameStart(2);
  }
  },300);

}

function playOneRound(){
  computerSequence.push(random1to4());
  if(computerSequence.length>20){
    playSequence([2,4,4,4,4,4,1,3,1,1],300,5);
    winSequence(8);
  }
  else{
  console.log("Adding a button to the sequence.");
  console.log(computerSequence);
  showAndTestPlayer();
  }
}


function signalGameStart(blinkNumber){
buttonsOn = false;
  $('#count-panel').text("");

  setTimeout(function(){
   $('#count-panel').text("--");

  if(blinkNumber>1)
    setTimeout(function(){
    signalGameStart(blinkNumber-1);
    },400);
  else{
    computerSequence = [];
    playOneRound();
  }
  },400);

}
