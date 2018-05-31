var tournamentID=142857;
var user_name='Hierba_Perry';

//******NO TOCAR *************
var gameID ;
var playerTurnID ;
var myID;
var rivalID;
var bandera = false ;
var winnerTurnID ;
var movement =7;
var move ;
var board =[];
var board2d =[];
var lastMove;
//*****************************

var chotudo= [];

// var socket = require('socket.io-client')('http://localhost:3000');
var socket = require('socket.io-client')('http://192.168.1.142:4000');
socket.on('connect', function(){
  socket.emit('signin', {
    user_name: user_name,
    tournament_id: tournamentID,
    user_role: 'player'
  });
});

socket.on('ok_signin', function(){
  console.log("Successfully signed in!");
});


socket.on('ready', function(data){
  var gameID = data.game_id;
  var playerTurnID = data.player_turn_id;
  myID=playerTurnID;
  rivalID=rival(myID);
  var board = data.board;

  board2d=transformBoard(board);
  var v= MaxValue(0,board2d,7,-1000,1000);
  move = get1DPos (chotudo[0],chotudo[1]);

  if (move==lastMove){
    move =Math.floor((Math.random() * 63) + 0);
  }
  lastMove=move ;
  console.log(board2d);
  socket.emit('play', {
    tournament_id: tournamentID,
    player_turn_id: playerTurnID,
    game_id: gameID,
    movement: move
  });
});

socket.on('finish', function(data){
  var gameID = data.game_id;
  var playerTurnID = data.player_turn_id;
  var winnerTurnID = data.winner_turn_id;
  var board = data.board;

  socket.emit('player_ready', {
    tournament_id: tournamentID,
    player_turn_id: playerTurnID,
    game_id: gameID
  });
});

//*************************MINIMAX(P AB)**********************************************

function MaxValue(vueltas,ActualBoard1,depth,alpha,beta){
  let ActualBoard= [];
  for (var i=0; i<8;i++){
      ActualBoard.push(ActualBoard1[i]);
  }
  var sho = vueltas+1;
  var v = -1000;
  var tirosValidos = getTirosValidos(ActualBoard,myID);

  if (tirosValidos.length==0) {
    v = finalValue(ActualBoard);
  } else {
    for (var i=0;i<tirosValidos.length;i++) {
      let tiroBoard=getBoard(tirosValidos[i],ActualBoard,myID);
      let tiroValue= value(sho,-1,tiroBoard,depth,alpha,beta);
      v = Math.max(v,tiroValue);
      if (v==tiroValue){
        chotudo=tirosValidos[i];
      }
      if (v>=beta){
        return v;
      }
      alpha = Math.max(alpha,v);
    }
  }
  return v;
}

function MinValue(vueltas,ActualBoard1,depth,alpha,beta) {
  let ActualBoard= [];
  for (var i=0; i<8;i++){
      ActualBoard.push(ActualBoard1[i]);
  }
  var sho = vueltas+1;
  var v = 1000;
  var tirosValidos = getTirosValidos(ActualBoard,rivalID);

  if (tirosValidos.length==0){
    v=finalValue(ActualBoard);
  } else {
    for (var i=0;i<tirosValidos.length;i++) {
      let tiroBoard=getBoard(tirosValidos[i],ActualBoard,rivalID);
      v = Math.min(v,value(sho,1,tiroBoard,depth,alpha,beta));

      if (v<=alpha) {
        return v;
      }
      beta = Math.min(beta,v);
    }
  }
  return v;
}


function value(vueltas,type,ActualBoard1,depth,alpha,beta){
  let ActualBoard= [];
  for (var i=0; i<8;i++){
    ActualBoard.push(ActualBoard1[i]);
  }

  if (vueltas>depth && type==-1 ) {
    bandera=true ;
    return Utility(ActualBoard);
  } else if (type==1) {
    return MaxValue(vueltas,ActualBoard,depth,alpha,beta);
  } else if (type==-1) {
    return MinValue(vueltas,ActualBoard,depth,alpha,beta);
  }

  return "error";
}

function Utility(ActualBoard){
  var flips = flipHeuritic(ActualBoard,myID);
  var movility = -1 *getTirosValidos(ActualBoard,rival);
  var difs = difInBoard(ActualBoard);

  var ww = Weights(ActualBoard);

  return ww+movility+flips;
}

//*********************************HEURISTICAS*****************************************

function Weights(ActualBoard){
  var player = 0;
  var enemy = 0;
  var pesos = [
                [7,2,5,4,4,5,2,7],
                [2,1,3,3,3,3,1,2],
                [5,3,6,5,5,6,3,5],
                [4,3,5,6,6,5,3,4],
                [4,3,5,6,6,5,3,4],
                [5,3,6,5,5,6,3,5],
                [2,1,3,3,3,3,1,2],
                [7,2,5,4,4,5,2,7],
              ];

  latuya=[];
  for (var i=0; i<8; i++){
    for (var j=0; j<8; j++){
      if (ActualBoard[j][i]==myID) {
        player+=pesos[j][i];
      }
      if (ActualBoard[j][i]==rivalID) {
        enemy+=pesos[j][i];
      }
    }
  }
  return player+enemy;
}

function finalValue (ActualBoard){
  var prop=0;
  var otro=0;
  for (var i=0; i<8; i++) {
    for (var j=0; j<8; j++) {
      if (ActualBoard[j][i]==myID) {
        prop++
      } else if (ActualBoard[j][i]!=0) {
        otro++
      }
    }
  }

  if (otro>prop) {
    return 0;
  } else if (prop>otro) {
    return 100;
  } else return 5;
}

//heuristica para la difercia entre cantidad de fichas actual
function difInBoard (ActualBoard){
  var prop=0;
  var otro=0;
  for (var i=0; i<8; i++){
    for (var j=0; j<8; j++){
      if (ActualBoard[j][i]==myID){
        prop++
      }
      else if (ActualBoard[j][i]!=0){
        otro++
      }

    }
  }

  return (prop-otro) ;
}

  //funcion para ver cuantas fichas se voltearian escojiendo el tiro que mas fichas voltea
  function flipHeuritic(ActualBoard,turnID){
    var peso=2;
    var pesotiro=0;

    //move =Math.floor((Math.random() * 63) + 0);
    for (var i = 0; i <=7; i++) {
      for (var j= 0; j <=7; j++){

        if (ActualBoard[j][i]==0){
          var pesotiro=checkAll(j,i,ActualBoard,turnID);

            if(pesotiro>peso){
             // move=get1DPos(j,i);
              peso = pesotiro;
              //console.log("cambia<3");
            }
          }
      }
    }
    return peso ;
  }
//*********************************HEURISTICAS*****************************************
//*************************************************************************************
//*************************************************************************************



//*********************************FUNCIONES DE OTHELLO********************************
//*************************************************************************************
//*************************************************************************************


  function getTirosValidos(ActualBoard,turnID){
    var tirosValidos =[];
    var pesotiro=0;

    //move =Math.floor((Math.random() * 63) + 0);
    for (var i = 0; i <=7; i++) {
      for (var j= 0; j <=7; j++){
       // console.log (j+","+i);
        if (ActualBoard[j][i]==0){
          var pesotiro=checkAll(j,i,ActualBoard,turnID);
          if (pesotiro>0){
            var tiro= [j,i];

            tirosValidos.push(tiro);
          }
        }
      }
    }
    return tirosValidos;

  }



  function get1DPos(x,y){
    return ((x*8)+y);
  }


function checkAll(x,y,ActualBoard,turnID){

  var peso = checkx1(x,y,ActualBoard,turnID)+checkx2(x,y,ActualBoard,turnID)+
             checky1(x,y,ActualBoard,turnID)+checky2(x,y,ActualBoard,turnID)+
             checkv1(x,y,ActualBoard,turnID)+checkv2(x,y,ActualBoard,turnID)+
             checkv3(x,y,ActualBoard,turnID)+checkv4(x,y,ActualBoard,turnID);

  return peso;
}


  function checkx1 (x,y,ActualBoard,turnID){
    var peso=0;
    var mult2 = 0;
    var i=x;
    for(i;i<=7;i++){
      if ((ActualBoard[i][y]==0)&&(i!=x)){
      //	console.log("##############MeApendejo");
      	return 0;

      }
      if (ActualBoard[i][y]==turnID){
        if (mult2==1){

        	return peso ;
        }
        else {
        	//console.log("##############MeApendejo2");
        	return 0;
        }
      }
      if ((ActualBoard[i][y]!=turnID)&&(ActualBoard[i][y]!=0)){
        mult2=1;
      }

      peso++;
    }
    return 0;
  }

  function checkx2 (x,y,ActualBoard,turnID){
    var peso=0;
    var mult2 = 0;
    for(var i=x;i>=0;i--){
      if ((ActualBoard[i][y]==0)&&(i!=x)){
  	    return 0;
      }
      if (ActualBoard[i][y]==turnID){
          if (mult2==1){

        	return peso ;
        }
        else {
        	return 0;
        }
      }
      if ((ActualBoard[i][y]!=turnID)&&(ActualBoard[i][y]!=0)){
        mult2=1;

      }

      peso++;
    }
    return 0;
  }

   function checky1 (x,y,ActualBoard,turnID){
    var peso=0;
    var mult2 = 0;
    for(var i=y;i>=0;i--){

      if ((ActualBoard[x][i]==0)&&(i!=y)){
      	return 0;
      }

      if (ActualBoard[x][i]==turnID){
          if (mult2==1){
        	return peso ;
        }
        else {
        	return 0;
        }
      }
      if ((ActualBoard[x][i]!=turnID)&&(ActualBoard[x][i]!=0)){
        mult2=1;

      }

      peso++;
    }
    return 0;
  }

  function checky2 (x,y,ActualBoard,turnID){
    var peso=0;
    var mult2 = 0;
    for(var i=y;i<=7;i++){

      if ((ActualBoard[x][i]==0)&&(i!=y)){

      	return 0;
      }
      if (ActualBoard[x][i]==turnID){
        if (mult2==1){
        	return peso ;
        }
        else {

        	return 0;
        }
      }
      if ((ActualBoard[x][i]!=turnID)&&(ActualBoard[x][i]!=0)){
        mult2=1;
      }

      peso++;

    }
    return 0;
  }

  function checkv1 (x,y,ActualBoard,turnID){
    var peso=0;
    var mult2 = 0;
    var i=x;
    var j=y;
    for(i;(i<=7 && j<=7);i++){
      if ((ActualBoard[i][j]==0)  &&(i!=x)&&(j!=y)  ){
     	return 0;
      }
      if (ActualBoard[i][j]==turnID){
          if (mult2==1){
        	return peso ;

        }
        else {
        	return 0;
        }
      }
      if ((ActualBoard[i][j]!=turnID)&&(ActualBoard[i][j]!=0)){
        mult2=1;
      }

      peso++;
      j++;
    }
    return 0;

  }

  function checkv2 (x,y,ActualBoard,turnID){
    var peso=0;
    var mult2 = 0;
    var i=x;
    var j=y;
    for(i;(i<=7 && j>=0);i++){
      if ((ActualBoard[i][j]==0)&&(i!=x)&&(j!=y)){
      	return 0;
      }
      if (ActualBoard[i][j]==turnID){
        if (mult2==1){
        	return peso ;
        }
        else {
        	return 0;
        }
      }
      if ((ActualBoard[i][j]!=turnID)&&(ActualBoard[i][j]!=0)){
        mult2=1;
      }

      peso++;
      j--;

    }
    return 0;
  }

  function checkv3 (x,y,ActualBoard,turnID){
    var peso=0;
    var mult2 = 0;
    var i=x;
    var j=y;
    for(i;((j<=7)&(i>=0));i--){
       if ((ActualBoard[i][j]==0)&&(i!=x)&&(j!=y)){
     	return 0;
      }
      if (ActualBoard[i][j]==turnID){
          if (mult2==1){
        	return peso ;
        }
        else {
        	return 0;
        }
      }
      if ((ActualBoard[i][j]!=turnID)&&(ActualBoard[i][j]!=0)){
        mult2=1;
      }
   	  j++;
      peso++;
    }
    return 0;
  }

  function checkv4 (x,y,ActualBoard,turnID){
    var peso=0;
    var mult2 = 0;
    var i=x;
    var j=y;
    for(i;((j>=0)&(i>=0));i--){
       if ((ActualBoard[i][j]==0)&&  (i!=x)&&(j!=y)){
      	return 0;
      }
      if (ActualBoard[i][j]==turnID){
          if (mult2==1){
        	return peso ;
        }
        else {
        	return 0;
        }
      }
      if ((ActualBoard[i][j]!=turnID)&&(ActualBoard[i][j]!=0)){
        mult2=1;
      }

      j--;
      peso++;
    }
    return 0;
  }


function transformBoard(boardE){
	//console.log(boardE);;
	var innerArray = [];
	var returnArray= [];
	for(var i = 0; i < boardE.length+1; i++) {
		if (i%8 == 0 && i != 0) {
			returnArray.push(innerArray);
			//console.log(innerArray);
			innerArray = [];
		}
		innerArray.push(boardE[i]);



	}
	return returnArray;
}
  function rival (myID){
    if (myID==2){
      return 1 ;
    }
    else{
      return 2 ;
    }
  }




function getBoard(tiro,ActualBoard,turnID){
    var newBoard=moveShit(tiro[1],tiro[0],ActualBoard,turnID);
    newBoard[tiro[0]] [tiro[1]]=turnID;
    return newBoard;

}




function moveShit (x,y,ActualBoard,turnID){
    let newBoard =  [];

    for (var z=0 ; z<ActualBoard.length;z++){
      newBoard.push(ActualBoard[z]);
    }

    let pendinChanges= [];

    var posList1= [];
    for(var i=x;i<=7;i++){

      if ((ActualBoard[i][y]===0)&&(i!==x)){
        posList1=[];
        break;

      }
      if (ActualBoard[i][y]===turnID){
        if (posList1.length>0){
          for (var r=0; r<posList1.length;r++){
            pendinChanges.push(posList1[r]);
          }
        }else {

          break;
        }
      }
      if ((ActualBoard[i][y]!==turnID)&&(ActualBoard[i][y]!==0)){
        var test = [i,y];
        posList1.push(test);
      }

    }

    var posList2= [];
    for(var i=x;i>=0;i--){

      if ((ActualBoard[i][y]===0)&&(i!==x)){
        posList2=[];
        break;

      }
      if (ActualBoard[i][y]===turnID){
         if (posList2.length>0){
          for (var r=0; r<posList2.length;r++){
            pendinChanges.push(posList2[r]);
          }
        }else {

          break;
        }
      }
      if ((ActualBoard[i][y]!==turnID)&&(ActualBoard[i][y]!==0)){
        var test = [i,y];
        posList2.push(test);
      }

    }

    var posList3= [];
    for(var i=y;i>=0;i--){

      if ((ActualBoard[x][i]===0)&&(i!==y)){
               posList3=[];

        break;
      }

      if (ActualBoard[x][i]===turnID){

          if (posList3.length>0){
          for (var r=0; r<posList3.length;r++){
            pendinChanges.push(posList3[r]);
          }
        }else {

          break;
        }
      }
      if ((ActualBoard[x][i]!==turnID)&&(ActualBoard[x][i]!==0)){
        var test = [x,i];
        posList3.push(test);

      }

    }


    var posList4= [];
    for(var i=y;i<=7;i++){

      if ((ActualBoard[x][i]===0)&&(i!==y)){
                posList4=[];

        break;
      }
      if (ActualBoard[x][i]===turnID){
         if (posList4.length>0){
          for (var r=0; r<posList4.length;r++){
            pendinChanges.push(posList4[r]);
          }
        }else {

          break;
        }
      }
      if ((ActualBoard[x][i]!==turnID)&&(ActualBoard[x][i]!==0)){
        var test = [x,i];
        posList4.push(test);

      }



    }


    var posList5= [];
    var i=x;
    var j=y;

    for(i;(i<=7 && j<=7);i++){

      if ((ActualBoard[i][j]===0)  &&(i!==x)&&(j!==y)  ){
          posList5=[];

        break;
      }
      if (ActualBoard[i][j]===turnID){

         if (posList5.length>0){
          for (var r=0; r<posList5.length;r++){
            pendinChanges.push(posList5[r]);
          }
        }else {

          break;
        }
      }
      if ((ActualBoard[i][j]!==turnID)&&(ActualBoard[i][j]!==0)){
        var test = [i,j];
        posList5.push(test);
      }


      j++;
    }


  var posList6= [];
    i=x;
    j=y;
    for(i;(i<=7 && j>=0);i++){
       if ((ActualBoard[i][j]===0)  &&(i!==x)&&(j!==y)  ){
        posList6=[];

        break;
      }
      if (ActualBoard[i][j]==turnID){

         if (posList6.length>0){
          for (var r=0; r<posList6.length;r++){
            pendinChanges.push(posList6[r]);
          }
        }else {

          break;
        }
      }
      if ((ActualBoard[i][j]!==turnID)&&(ActualBoard[i][j]!==0)){
        var test = [i,j];
        posList6.push(test);
      }


      j--;

    }

    var posList7= [];
     i=x;
    j=y;
    for(i;((j<=7)&(i>=0));i--){

       if ((ActualBoard[i][j]===0)  &&(i!==x)&&(j!==y)  ){
        posList7=[];

        break;
      }
      if (ActualBoard[i][j]===turnID){

         if (posList7.length>0){
          for (var r=0; r<posList7.length;r++){
            pendinChanges.push(posList7[r]);
          }
        }else {

          break;
        }
      }
      if ((ActualBoard[i][j]!==turnID)&&(ActualBoard[i][j]!==0)){
        var test = [i,j];
        posList7.push(test);
      }

      j++;
    }

    var posList8= [];
    i=x;
    j=y;
    for(i;((j>=0)&(i>=0));i--){
       if ((ActualBoard[i][j]===0)  &&(i!==x)&&(j!==y)  ){
                posList8=[];

        break;
      }
      if (ActualBoard[i][j]===turnID){

         if (posList8.length>0){
          for (var r=0; r<posList8.length;r++){
            pendinChanges.push(posList8[r]);
          }
        }else {

          break;
        }


      }
      if ((ActualBoard[i][j]!==turnID)&&(ActualBoard[i][j]!==0)){
        var test = [i,j];
        posList8.push(test);
      }


      j--;
    }
   // console.log (pendinChanges);
  //  console.log("AA");

   var pendinChanges2 = multiDimensionalUnique(pendinChanges);
     // console.log(pendinChanges2)
    for (var k=0; k<pendinChanges2.length;k++){
//console.log("alo ?");
/*
    console.log ("ALLMIGH77");
    console.log (pendinChanges);
    */

      newBoard[(pendinChanges2[k][1])] [(pendinChanges2[k][0])] = turnID ;

    }


    return newBoard;
}




function multiDimensionalUnique(arr) {
    var uniques = [];
    var itemsFound = {};
    for(var i = 0, l = arr.length; i < l; i++) {
        var stringified = JSON.stringify(arr[i]);
        if(itemsFound[stringified]) { continue; }
        uniques.push(arr[i]);
        itemsFound[stringified] = true;
    }
    return uniques;
}
