// ----------------------------------------------------//
// Se crean las instancias de las librerias a utilizar //
// ----------------------------------------------------//
try{
  var modbus = require('jsmodbus');
  var fs = require('fs');
  var PubNub = require('pubnub');
//Asignar host, puerto y otros par ametros al cliente Modbus
var client = modbus.client.tcp.complete({
    'host': "192.168.20.28",
    'port': 502,
    'autoReconnect': true,
    'timeout': 60000,
    'logEnabled'    : true,
    'reconnectTimeout': 30000
}).connect();

var intId,timeStop=40,flagONS1=0,flagONS2=0,flagONS3=0,flagONS4=0,flagONS5=0,flagONS6=0;
var Filler,ctFiller=0,speedTempFiller=0,secFiller=0,stopCountFiller=0,flagStopFiller=0,flagPrintFiller=0,speedFiller=0,timeFiller=0;
var actualFiller=0,stateFiller=0;
var Taper,ctTaper=0,speedTempTaper=0,secTaper=0,stopCountTaper=0,flagStopTaper=0,flagPrintTaper=0,speedTaper=0,timeTaper=0;
var actualTaper=0,stateTaper=0;
var Paletizer,ctPaletizer=0,speedTempPaletizer=0,secPaletizer=0,stopCountPaletizer=0,flagStopPaletizer=0,flagPrintPaletizer=0,speedPaletizer=0,timePaletizer=0;
var actualPaletizer=0,statePaletizer=0;
var Paletizer2,ctPaletizer2=0,speedTempPaletizer2=0,secPaletizer2=0,stopCountPaletizer2=0,flagStopPaletizer2=0,flagPrintPaletizer2=0,speedPaletizer2=0,timePaletizer2=0;
var actualPaletizer2=0,statePaletizer2=0;
var Shrinkwrapper,ctShrinkwrapper=0,speedTempShrinkwrapper=0,secShrinkwrapper=0,stopCountShrinkwrapper=0,flagStopShrinkwrapper=0,flagPrintShrinkwrapper=0,speedShrinkwrapper=0,timeShrinkwrapper=0;
var actualShrinkwrapper=0,stateShrinkwrapper=0;
var Filler2,ctFiller2=0,speedTempFiller2=0,secFiller2=0,stopCountFiller2=0,flagStopFiller2=0,flagPrintFiller2=0,speedFiller2=0,timeFiller2=0;
var actualFiller2=0,stateFiller2=0;
var Barcode,secBarcode=0;
var Barcode2,secBarcode2=0;
var secEOL=0,secPubNub=0;
var secEOL2=0,secPubNub2=0;
var publishConfig;
var publishConfig2;
var files = fs.readdirSync("/home/oee/Pulse/BYD_L11_LOGS/"); //Leer documentos
var files2 = fs.readdirSync("/home/oee/Pulse/BYD_L32_LOGS/"); //Leer documentos
var actualdate = Date.now(); //Fecha actual
var text2send=[];//Vector a enviar
var text2send2=[];//Vector a enviar
var flagInfo2Send=0;
var i=0;
var i2=0;

function idle(){
  i=0;
  text2send=[];
  for ( k=0;k<files.length;k++){//Verificar los archivos
    var stats = fs.statSync("/home/oee/Pulse/BYD_L11_LOGS/"+files[k]);
    var mtime = new Date(stats.mtime).getTime();
    if (mtime< (Date.now() - (8*60*1000))&&files[k].indexOf("serialbox")==-1){
      flagInfo2Send=1;
      text2send[i]=files[k];
      i++;
    }
  }
}

function idle2(){
  i2=0;
  text2send=[];
  for ( k=0;k<files2.length;k++){//Verificar los archivos
    var stats = fs.statSync("/home/oee/Pulse/BYD_L32_LOGS/"+files2[k]);
    var mtime = new Date(stats.mtime).getTime();
    if (mtime< (Date.now() - (8*60*1000))&&files2[k].indexOf("serialbox")==-1){
      flagInfo2Send=1;
      text2send2[i2]=files2[k];
      i2++;
    }
  }
}
pubnub = new PubNub({
  publishKey : "pub-c-ac9f95b7-c3eb-4914-9222-16fbcaad4c59",
  subscribeKey : "sub-c-206bed96-8c16-11e7-9760-3a607be72b06",
  uuid : "bydgoszcz-L11-monitoring"
});

pubnub2 = new PubNub({
  publishKey : "pub-c-ac9f95b7-c3eb-4914-9222-16fbcaad4c59",
  subscribeKey : "sub-c-206bed96-8c16-11e7-9760-3a607be72b06",
  uuid : "bydgoszcz-L32-monitoring"
});

function senderData(){
  pubnub.publish(publishConfig, function(status, response) {
});}
function senderData2(){
  pubnub2.publish(publishConfig2, function(status, response) {
});}
// --------------------------------------------------------- //
//Función que realiza las instrucciones de lectura de datos  //
// --------------------------------------------------------- //
var DoRead = function (){
  if(secPubNub>=60*5){
    idle();
    secPubNub=0;
    publishConfig = {
      channel : "BYD_Monitor",
      message : {
            line: "11",
            tt: Date.now(),
            machines: text2send
          }
    };
    senderData();
  }else{
    secPubNub++;
  }
    if(secPubNub2>=60*5){
      idle2();
      secPubNub2=0;
      publishConfig2 = {
        channel : "BYD_Monitor",
        message : {
              line: "32",
              tt: Date.now(),
              machines: text2send2
            }
      };
      senderData2();
    }else{
      secPubNub2++;
    }
    client.readHoldingRegisters(0,99).then(function(resp){
        var statesFiller              = switchData(resp.register[0],resp.register[1]),
            statesTaper               = switchData(resp.register[2],resp.register[3]),
            statesPaletizer           = switchData(resp.register[4],resp.register[5]),
            statesFiller2             = switchData(resp.register[50],resp.register[51]),
            statesShrinkwrapper       = switchData(resp.register[52],resp.register[53]),
            statesPaletizer2          = switchData(resp.register[54],resp.register[55]);

          //Barcode -------------------------------------------------------------------------------------------------------------
          if(resp.register[20]==0&&resp.register[21]==0&&resp.register[22]==0&&resp.register[23]==0&&resp.register[24]==0&&resp.register[25]==0&&resp.register[26]==0&&resp.register[27]==0){
            Barcode='0';
          }else {
            var dig1=hex2a(assignment(resp.register[20]).toString(16));
            var dig2=hex2a(assignment(resp.register[21]).toString(16));
            var dig3=hex2a(assignment(resp.register[22]).toString(16));
            var dig4=hex2a(assignment(resp.register[23]).toString(16));
            var dig5=hex2a(assignment(resp.register[24]).toString(16));
            var dig6=hex2a(assignment(resp.register[25]).toString(16));
            var dig7=hex2a(assignment(resp.register[26]).toString(16));
            var dig8=hex2a(assignment(resp.register[27]).toString(16));
          Barcode=dig1+dig2+dig3+dig4+dig5+dig6+dig7;
          }
          if(isNaN(Barcode)){
            Barcode='0';
          }
	        if(secBarcode>=60&&!isNaN(Barcode)){
              writedataBarcode(Barcode,"BYD_L11_LOGS/pol_byd_Barcode_L11.log");
              secBarcode=0;
          }
          secBarcode++;
          //Barcode -------------------------------------------------------------------------------------------------------------
          //Filler -------------------------------------------------------------------------------------------------------------
            ctFiller = joinWord(resp.register[11],resp.register[10]);
              if(flagONS1===0){
                 speedTempFiller=ctFiller;
                 flagONS1=1;
            }
            if (secFiller>=60){
                if(stopCountFiller===0||flagStopFiller==1){
                   flagPrintFiller=1;
                    secFiller=0;
                    speedFiller=ctFiller-speedTempFiller;
                    speedTempFiller=ctFiller;
                }
                if(flagStopFiller==1){
                    timeFiller=Date.now();
                }
            }
            secFiller++;
            if(ctFiller>actualFiller){
                stateFiller=1;//RUN
                if(stopCountFiller>=timeStop){
                    speedFiller=0;
                    secFiller=0;
                }
                timeFiller=Date.now();
                stopCountFiller=0;
                flagStopFiller=0;


            }else if(ctFiller==actualFiller){
                if(stopCountFiller===0){
                    timeFiller=Date.now();
                }
                stopCountFiller++;
                if(stopCountFiller>=timeStop){
                    stateFiller=2;//STOP
                    speedFiller=0;
                    if(flagStopFiller===0){
                        flagPrintFiller=1;
                        secFiller=0;
                    }
                    flagStopFiller=1;
                }
            }
            if(stateFiller==2){
                speedTempFiller=ctFiller;
            }

            actualFiller=ctFiller;
            if(stateFiller==2){
                if(statesFiller[5]==1){
                    stateFiller=3;//Wait
                }else{
                    if(statesFiller[4]==1){
                        stateFiller=4;//Block
                    }
                }
            }
            Filler = {
                ST: stateFiller,
                CPQO: joinWord(resp.register[11],resp.register[10]),
                SP: speedFiller
            };
            if(flagPrintFiller==1){
                for(var key in Filler){
                    fs.appendFileSync("/home/oee/Pulse/BYD_L11_LOGS/pol_byd_Filler_L11.log","tt="+timeFiller+",var="+key+",val="+Filler[key]+"\n");
                }
                flagPrintFiller=0;
            }
          //Filler -------------------------------------------------------------------------------------------------------------
          //Taper -------------------------------------------------------------------------------------------------------------
            ctTaper = joinWord(resp.register[13],resp.register[12]);
              if(flagONS2===0){
                 speedTempTaper=ctTaper;
                 flagONS2=1;
            }
            if (secTaper>=60){
                if(stopCountTaper===0||flagStopTaper==1){
                   flagPrintTaper=1;
                    secTaper=0;
                    speedTaper=ctTaper-speedTempTaper;
                    speedTempTaper=ctTaper;
                }
                if(flagStopTaper==1){
                    timeTaper=Date.now();
                }
            }
            secTaper++;
            if(ctTaper>actualTaper){
                stateTaper=1;//RUN
                if(stopCountTaper>=timeStop){
                    speedTaper=0;
                    secTaper=0;
                }
                timeTaper=Date.now();
                stopCountTaper=0;
                flagStopTaper=0;


            }else if(ctTaper==actualTaper){
                if(stopCountTaper===0){
                    timeTaper=Date.now();
                }
                stopCountTaper++;
                if(stopCountTaper>=timeStop){
                    stateTaper=2;//STOP
                    speedTaper=0;
                    if(flagStopTaper===0){
                        flagPrintTaper=1;
                        secTaper=0;
                    }
                    flagStopTaper=1;
                }
            }
            if(stateTaper==2){
                speedTempTaper=ctTaper;
            }

            actualTaper=ctTaper;
            if(stateTaper==2){
                if(statesTaper[5]==1){
                    stateTaper=3;//Wait
                }else{
                    if(statesTaper[4]==1){
                        stateTaper=4;//Block
                    }
                }
            }
            Taper = {
                ST: stateTaper,
                CPQO: joinWord(resp.register[13],resp.register[12]),
                SP: speedTaper
            };
            if(flagPrintTaper==1){
                for(var key in Taper){
                    fs.appendFileSync("/home/oee/Pulse/BYD_L11_LOGS/pol_byd_Taper_L11.log","tt="+timeTaper+",var="+key+",val="+Taper[key]+"\n");
                }
                flagPrintTaper=0;
            }
          //Taper -------------------------------------------------------------------------------------------------------------
          //Paletizer -------------------------------------------------------------------------------------------------------------
            ctPaletizer = joinWord(resp.register[15],resp.register[14]);
              if(flagONS3===0){
                 speedTempPaletizer=ctPaletizer;
                 flagONS3=1;
            }
            if (secPaletizer>=60){
                if(stopCountPaletizer===0||flagStopPaletizer==1){
                   flagPrintPaletizer=1;
                    secPaletizer=0;
                    speedPaletizer=ctPaletizer-speedTempPaletizer;
                    speedTempPaletizer=ctPaletizer;
                }
                if(flagStopPaletizer==1){
                    timePaletizer=Date.now();
                }
            }
            secPaletizer++;
            if(ctPaletizer>actualPaletizer){
                statePaletizer=1;//RUN
                if(stopCountPaletizer>=timeStop){
                    speedPaletizer=0;
                    secPaletizer=0;
                }
                timePaletizer=Date.now();
                stopCountPaletizer=0;
                flagStopPaletizer=0;


            }else if(ctPaletizer==actualPaletizer){
                if(stopCountPaletizer===0){
                    timePaletizer=Date.now();
                }
                stopCountPaletizer++;
                if(stopCountPaletizer>=timeStop){
                    statePaletizer=2;//STOP
                    speedPaletizer=0;
                    if(flagStopPaletizer===0){
                        flagPrintPaletizer=1;
                        secPaletizer=0;
                    }
                    flagStopPaletizer=1;
                }
            }
            if(statePaletizer==2){
                speedTempPaletizer=ctPaletizer;
            }

            actualPaletizer=ctPaletizer;
            if(statePaletizer==2){
                if(statesPaletizer[5]==1){
                    statePaletizer=3;//Wait
                }else{
                    if(statesPaletizer[4]==1){
                        statePaletizer=4;//Block
                    }
                }
            }
            Paletizer = {
                ST: statePaletizer,
                CPQI: joinWord(resp.register[15],resp.register[14]),
                SP: speedPaletizer
            };
            if(flagPrintPaletizer==1){
                for(var key in Paletizer){
                    fs.appendFileSync("/home/oee/Pulse/BYD_L11_LOGS/pol_byd_Paletizer_L11.log","tt="+timePaletizer+",var="+key+",val="+Paletizer[key]+"\n");
                }
                flagPrintPaletizer=0;
            }
          //Paletizer -------------------------------------------------------------------------------------------------------------
          //EOL --------------------------------------------------------------------------------------------------------------------
          if(secEOL>=60){
            fs.appendFileSync("../BYD_L11_LOGS/pol_byd_EOL_L11.log","tt="+Date.now()+",var=EOL"+",val="+Paletizer.CPQI+"\n");
            secEOL=0;
          }
          secEOL++;
          //EOL --------------------------------------------------------------------------------------------------------------------
          //Barcode2 -------------------------------------------------------------------------------------------------------------
          if(resp.register[70]==0&&resp.register[71]==0&&resp.register[72]==0&&resp.register[73]==0&&resp.register[74]==0&&resp.register[75]==0&&resp.register[76]==0&&resp.register[77]==0){
            Barcode2='0';
          }else {
            var dig12=hex2a(assignment(resp.register[70]).toString(16));
            var dig22=hex2a(assignment(resp.register[71]).toString(16));
            var dig32=hex2a(assignment(resp.register[72]).toString(16));
            var dig42=hex2a(assignment(resp.register[73]).toString(16));
            var dig52=hex2a(assignment(resp.register[74]).toString(16));
            var dig62=hex2a(assignment(resp.register[75]).toString(16));
            var dig72=hex2a(assignment(resp.register[76]).toString(16));
            var dig82=hex2a(assignment(resp.register[77]).toString(16));
          Barcode2=dig12+dig22+dig32+dig42+dig52+dig62+dig72+dig82;
          }
          if(isNaN(Barcode2)){
            Barcode2='0';
          }
	        if(secBarcode2>=60&&!isNaN(Barcode2)){
              writedataBarcode(Barcode2,"BYD_L32_LOGS/pol_byd_Barcode_L32.log");
              secBarcode2=0;
          }
          secBarcode2++;
          //Barcode2 -------------------------------------------------------------------------------------------------------------
          //Filler2 -------------------------------------------------------------------------------------------------------------
            ctFiller2 = joinWord(resp.register[61],resp.register[60]);
              if(flagONS4===0){
                 speedTempFiller2=ctFiller2;
                 flagONS4=1;
            }
            if (secFiller2>=60){
                if(stopCountFiller2===0||flagStopFiller2==1){
                   flagPrintFiller2=1;
                    secFiller2=0;
                    speedFiller2=ctFiller2-speedTempFiller2;
                    speedTempFiller2=ctFiller2;
                }
                if(flagStopFiller2==1){
                    timeFiller2=Date.now();
                }
            }
            secFiller2++;
            if(ctFiller2>actualFiller2){
                stateFiller2=1;//RUN
                if(stopCountFiller2>=timeStop){
                    speedFiller2=0;
                    secFiller2=0;
                }
                timeFiller2=Date.now();
                stopCountFiller2=0;
                flagStopFiller2=0;


            }else if(ctFiller2==actualFiller2){
                if(stopCountFiller2===0){
                    timeFiller2=Date.now();
                }
                stopCountFiller2++;
                if(stopCountFiller2>=timeStop){
                    stateFiller2=2;//STOP
                    speedFiller2=0;
                    if(flagStopFiller2===0){
                        flagPrintFiller2=1;
                        secFiller2=0;
                    }
                    flagStopFiller2=1;
                }
            }
            if(stateFiller2==2){
                speedTempFiller2=ctFiller2;
            }

            actualFiller2=ctFiller2;
            if(stateFiller2==2){
                if(statesFiller2[5]==1){
                    stateFiller2=3;//Wait
                }else{
                    if(statesFiller2[4]==1){
                        stateFiller2=4;//Block
                    }
                }
            }
            Filler2 = {
                ST: stateFiller2,
                CPQO: joinWord(resp.register[61],resp.register[60]),
                SP: speedFiller2
            };
            if(flagPrintFiller2==1){
                for(var key in Filler2){
                    fs.appendFileSync("/home/oee/Pulse/BYD_L32_LOGS/pol_byd_Filler_L32.log","tt="+timeFiller2+",var="+key+",val="+Filler2[key]+"\n");
                }
                flagPrintFiller2=0;
            }
          //Filler2 -------------------------------------------------------------------------------------------------------------
          //Shrinkwrapper -------------------------------------------------------------------------------------------------------------
            ctShrinkwrapper = joinWord(resp.register[63],resp.register[62]);
              if(flagONS5===0){
                 speedTempShrinkwrapper=ctShrinkwrapper;
                 flagONS5=1;
            }
            if (secShrinkwrapper>=60){
                if(stopCountShrinkwrapper===0||flagStopShrinkwrapper==1){
                   flagPrintShrinkwrapper=1;
                    secShrinkwrapper=0;
                    speedShrinkwrapper=ctShrinkwrapper-speedTempShrinkwrapper;
                    speedTempShrinkwrapper=ctShrinkwrapper;
                }
                if(flagStopShrinkwrapper==1){
                    timeShrinkwrapper=Date.now();
                }
            }
            secShrinkwrapper++;
            if(ctShrinkwrapper>actualShrinkwrapper){
                stateShrinkwrapper=1;//RUN
                if(stopCountShrinkwrapper>=timeStop){
                    speedShrinkwrapper=0;
                    secShrinkwrapper=0;
                }
                timeShrinkwrapper=Date.now();
                stopCountShrinkwrapper=0;
                flagStopShrinkwrapper=0;


            }else if(ctShrinkwrapper==actualShrinkwrapper){
                if(stopCountShrinkwrapper===0){
                    timeShrinkwrapper=Date.now();
                }
                stopCountShrinkwrapper++;
                if(stopCountShrinkwrapper>=timeStop){
                    stateShrinkwrapper=2;//STOP
                    speedShrinkwrapper=0;
                    if(flagStopShrinkwrapper===0){
                        flagPrintShrinkwrapper=1;
                        secShrinkwrapper=0;
                    }
                    flagStopShrinkwrapper=1;
                }
            }
            if(stateShrinkwrapper==2){
                speedTempShrinkwrapper=ctShrinkwrapper;
            }

            actualShrinkwrapper=ctShrinkwrapper;
            if(stateShrinkwrapper==2){
                if(statesShrinkwrapper[5]==1){
                    stateShrinkwrapper=3;//Wait
                }else{
                    if(statesShrinkwrapper[4]==1){
                        stateShrinkwrapper=4;//Block
                    }
                }
            }
            Shrinkwrapper = {
                ST: stateShrinkwrapper,
                CPQO: joinWord(resp.register[63],resp.register[62]),
                SP: speedShrinkwrapper
            };
            if(flagPrintShrinkwrapper==1){
                for(var key in Shrinkwrapper){
                    fs.appendFileSync("/home/oee/Pulse/BYD_L32_LOGS/pol_byd_Shrinkwrapper_L32.log","tt="+timeShrinkwrapper+",var="+key+",val="+Shrinkwrapper[key]+"\n");
                }
                flagPrintShrinkwrapper=0;
            }
          //Shrinkwrapper -------------------------------------------------------------------------------------------------------------
          //Paletizer2 -------------------------------------------------------------------------------------------------------------
            ctPaletizer2 = joinWord(resp.register[65],resp.register[64]);
              if(flagONS6===0){
                 speedTempPaletizer2=ctPaletizer2;
                 flagONS6=1;
            }
            if (secPaletizer2>=60){
                if(stopCountPaletizer2===0||flagStopPaletizer2==1){
                   flagPrintPaletizer2=1;
                    secPaletizer2=0;
                    speedPaletizer2=ctPaletizer2-speedTempPaletizer2;
                    speedTempPaletizer2=ctPaletizer2;
                }
                if(flagStopPaletizer2==1){
                    timePaletizer2=Date.now();
                }
            }
            secPaletizer2++;
            if(ctPaletizer2>actualPaletizer2){
                statePaletizer2=1;//RUN
                if(stopCountPaletizer2>=timeStop){
                    speedPaletizer2=0;
                    secPaletizer2=0;
                }
                timePaletizer2=Date.now();
                stopCountPaletizer2=0;
                flagStopPaletizer2=0;


            }else if(ctPaletizer2==actualPaletizer2){
                if(stopCountPaletizer2===0){
                    timePaletizer2=Date.now();
                }
                stopCountPaletizer2++;
                if(stopCountPaletizer2>=timeStop){
                    statePaletizer2=2;//STOP
                    speedPaletizer2=0;
                    if(flagStopPaletizer2===0){
                        flagPrintPaletizer2=1;
                        secPaletizer2=0;
                    }
                    flagStopPaletizer2=1;
                }
            }
            if(statePaletizer2==2){
                speedTempPaletizer2=ctPaletizer2;
            }

            actualPaletizer2=ctPaletizer2;
            if(statePaletizer2==2){
                if(statesPaletizer2[5]==1){
                    statePaletizer2=3;//Wait
                }else{
                    if(statesPaletizer2[4]==1){
                        statePaletizer2=4;//Block
                    }
                }
            }
            Paletizer2 = {
                ST: statePaletizer2,
                CPQI: joinWord(resp.register[65],resp.register[64]),
                SP: speedPaletizer2
            };
            if(flagPrintPaletizer2==1){
                for(var key in Paletizer2){
                    fs.appendFileSync("/home/oee/Pulse/BYD_L32_LOGS/pol_byd_Paletizer_L32.log","tt="+timePaletizer2+",var="+key+",val="+Paletizer2[key]+"\n");
                }
                flagPrintPaletizer2=0;
            }
          //Paletizer2 -------------------------------------------------------------------------------------------------------------
          //EOL --------------------------------------------------------------------------------------------------------------------
          if(secEOL2>=60){
            fs.appendFileSync("../BYD_L32_LOGS/pol_byd_EOL_L32.log","tt="+Date.now()+",var=EOL"+",val="+Paletizer2.CPQI+"\n");
            secEOL2=0;
          }
          secEOL2++;
          //EOL --------------------------------------------------------------------------------------------------------------------
    });//END Client Read
};

var assignment = function (val){
  var result;
  if(val<4095)
    result = "";
  else
    result = val;
    return result;
};

function hex2a(hex){
   var str = '';
   for (var i = 0; i < hex.length; i += 2)
   str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

var stateMachine = function (data){
	if(data[7]==1){
		return 1;//RUN
	}
	if(data[6]==1){
		return 2;//STOP
	}
	if(data[5]==1){
		return 3;//WAIT
	}
	if(data[4]==1){
		return 4;//BLOCK
	}
	return 2;
};

var counterState = function (actual,temp){
	if(actual!=temp){
		return 1;
	}else {
		return 2;
	}
};


var writedataBarcode = function (barcode,nameFile){
    var timet=Date.now();
    fs.appendFileSync("../"+nameFile,"tt="+timet+",var=bc"+",val="+barcode+"\n");
};

var joinWord = function (num1,num2){
    var bits="00000000000000000000000000000000";
    var  bin1=num1.toString(2),
         bin2=num2.toString(2),
         newNum = bits.split("");

        for(var i=0;i<bin1.length;i++){
            newNum[31-i]=bin1[(bin1.length-1)-i];
        }
        for(var j=0;j<bin2.length;j++){
            newNum[15-j]=bin2[(bin2.length-1)-j];
        }
        bits=newNum.join("");
        return parseInt(bits,2);
};
var switchData = function (num1,num2){
    var bits="00000000000000000000000000000000";
    var  bin1=num1.toString(2),
        bin2=num2.toString(2),
        newNum = bits.split("");

        for(var i=0;i<bin1.length;i++){
            newNum[15-i]=bin1[(bin1.length-1)-i];
        }
        for(var j=0;j<bin2.length;j++){
            newNum[31-j]=bin2[(bin2.length-1)-j];
        }
        bits=newNum.join("");

        return bits;
};

var stop = function () {
    ///This function clean data
    clearInterval(intId);
};

var shutdown = function () {
    ///Use function STOP and close connection
    stop();
    client.close();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);


///*If client is connect call a function "DoRead"*/
client.on('connect', function(err) {
    setInterval(function(){
        DoRead();
    }, 1000);
});

///*If client is in a error ejecute an acction*/
client.on('error', function (err) {
    fs.appendFileSync("error.log","ID 1: "+Date.now()+": "+err+"\n");
    //console.log('Client Error', err);
});
///If client try closed, this metodo try reconnect client to server
client.on('close', function () {
    //console.log('Client closed, stopping interval.');
    fs.appendFileSync("error.log","ID 2: "+Date.now()+": "+'Client closed, stopping interval.'+"\n");
    stop();
});

}catch(err){
    fs.appendFileSync("error.log","ID 3: "+Date.now()+": "+err+"\n");
}
