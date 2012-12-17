//  ime.js
//  (c) 2012~ Youngteac Hong
//  ime.js may be freely distributed under the MIT license.
(function(root) {

  /***************************
   * main input method module
   * (dom dependent)
   ***************************/
  var ime = function() {
    /**
     * init module
     * @param fnHandler
     * @param elHolder for eventListener (optional, default: body element)
     */
    this.init = function(fnHandler, elHolder) {
      //Input Methods
      this.aIm = [imH2, imEN];
      this.currentIdx = 0;
      this.setEventListener(elHolder || document.body, fnHandler);
    };

    //next Input Method
    this.nextIm = function() {
      this.currentIdx = (this.currentIdx + 1) % this.aIm.length;
    };

    //get current Input Method
    this.getCurrentImName = function() {
      return this.aIm[this.currentIdx].name;
    };

    //attach event
    var fnAttachEvent = function(elNode, sEvent, fHandler) {
      if(elNode.addEventListener) {
        elNode.addEventListener(sEvent, fHandler, false);
      }else{
        elNode.attachEvent('on'+sEvent, fHandler);
      }
    };

    //set event listener
    this.setEventListener = function(elHolder, fnHandler) {
      var elListener = document.createElement('input'); 
      elListener.setAttribute('type', 'password');
      elListener.style.imeMode = 'disabled';
      elHolder.appendChild(elListener);

      var that = this;
      fnAttachEvent(elListener, 'keypress', function(e) {
        var oCmd = that.parseKeypress(e);
        if(oCmd.name){
          fnHandler(oCmd);
          e.preventDefault();
        }
      });
      fnAttachEvent(elListener, 'keydown', function(e) {
        var oCmd = that.parseKeydown(e);
        if(oCmd.name){
          fnHandler(oCmd);
          e.preventDefault();
        }
      });
      elListener.focus();
    };

    //parse event
    this.parseKeypress = function(e) {
      var oKeyEvent = key.getKeyEvent(e); //native event 2 oKeyEvent
      if(!oKeyEvent.charCode){ return {}; }
      return this.aIm[this.currentIdx].handleKeyEvent(oKeyEvent);
    };

    this.parseKeydown = function(e) {
      var oKeyEvent = key.getKeyEventFromKeydown(e); //native event 2 oKeyEvent
      if(oKeyEvent.shift && key.SPACE == oKeyEvent.charCode){
        this.nextIm();
        return {name: "nextIm"};
      } 
      if(!oKeyEvent.charCode){ return {}; }
      return this.aIm[this.currentIdx].handleKeyEvent(oKeyEvent);
    };
 };

  /***************************
   * key util : predicate
   * (keydown event dependent)
   ***************************/
  var key = new (function() {
    this.BACKSPACE = 8;
    this.ENTER = 13;
    this.SHIFT = 16;
    this.CTRL = 17;
    this.ALT = 18;

    this.SPACE = 32;

    this.PAGEUP = 33;
    this.PAGEDOWN = 34;
    this.END = 35;
    this.HOME = 36;
    this.LEFT = 37;
    this.UP = 38;
    this.RIGHT = 39;
    this.DOWN = 40;

    this.ZERO = 48;
    this.NINE = 57;

    this.A = 65;
    this.Z = 90;

    this.METAKEY = 91;
    this.WIN = 92;

    this.NUM_ZERO = 96;
    this.NUM_NINE = 105;

    var CASE_PADDING = 32; // case_padding alpha upper <->  lower

    //convert native keypress event to key event
    this.getKeyEvent = function(e) {
      //set modifier
      var oKeyEvent = {
        shift : e.shiftKey,
        ctrl : e.ctrlKey,
        alt : e.altKey,
        meta : e.metaKey,
        charCode : e.charCode
      }; 

      return oKeyEvent;
    };

    //convert native keydown event to key event
    this.getKeyEventFromKeydown = function(e) {
     //set modifier
      var oKeyEvent = {
        shift : e.shiftKey,
        ctrl : e.ctrlKey,
        alt : e.altKey,
        meta : e.metaKey
      };

      if(e.keyCode == key.BACKSPACE || e.keyCode == key.SPACE) {
        oKeyEvent.charCode = e.keyCode;
      }

      return oKeyEvent;
    };

    // predicate modifier
    // http://en.wikipedia.org/wiki/Modifier_key
    // shift, ctrl, alt, altgr, meta, win, cmd, fn, super, hyper
    this.isModifier = function(keyCode){
      return [ this.SHIFT, this.CTRL, this.ALT, this.METAKEY, this.WIN ].indexOf(keyCode) != -1;
    };

    //predicate : navigation, arrow, home, end, pageup, pagedown
    this.isNavigation = function(keyCode) {
      return this.PAGEUP <= keyCode && keyCode <= this.DOWN;
    };

    //predicate : A-Z + a-z + 0-9
    this.isAlnum = function(keyCode) {
      return this.isNumeric(keyCode) || this.isAlpha(keyCode);
    };

    //predicate : 0-9
    this.isNumeric = function(keyCode) {
      return (this.ZERO <= keyCode && keyCode <= this.NINE) ||
             (this.NUM_ZERO <= keyCode && keyCode <= this.NUM_NINE);
    };

    //predicate : A-Z + a-z
    this.isAlpha = function(keyCode) {
      return this.isUpperAlpha(keyCode) || this.isLowerAlpha(keyCode);
    };

    //predicate : A-Z
    this.isUpperAlpha = function(keyCode) {
      return this.A <= keyCode && keyCode <= this.Z;
    };

    //predicate : a~z
    this.isLowerAlpha = function(keyCode) {
      return this.isUpperAlpha(keyCode - CASE_PADDING);
    };
  })();

  /***************************
   * English
   ***************************/
  var imEN = new (function() {
    this.name = 'EN';

    //handleKeyEvent for english
    this.handleKeyEvent = function(oKeyEvent) {
      if(oKeyEvent.charCode == key.ENTER) {
        return {name:'insPara'};
      }else if(oKeyEvent.charCode == key.BACKSPACE) {
        return {name:'delChar'};
      }else{
        return {name:'insChar', value:String.fromCharCode(oKeyEvent.charCode)};
      }
    };
  })();

  /***************************
   * buf, string util
   ***************************/
  var buf = function() {
    this.buf = '';
    this.push = function(ch) {
      this.buf += ch;
    };

    this.init = function() {
      this.buf = this.buf.substring(0, this.buf.length -1);
    };

    this.tail = function(nTail) {
      if(nTail > this.buf.length) {
        throw 'IllegalArgument';
      }
      this.buf = this.buf.substring(this.buf.length - nTail);
    };

    this.flush = function() {
      this.buf = '';
    };

    this.size = function() {
      return this.buf.length;
    };

    this.get = function(){
      return this.buf;
    };
  };

  /***************************
   * hangul util
   ***************************/
  var hangul = function() {
    this.init = function(aCho, aVowel, aJong, aJaso){
      this.aCho = aCho;
      this.aVowel = aVowel;
      this.aJong = aJong;
      this.aJaso = aJaso;
    };

    // 0 -> ㄱ
    this.getCho = function( cho ) {
      var idx = this.aJaso.indexOf(this.aCho[cho]);
      return String.fromCharCode(12593 + idx);
    };

    // 0 -> ㅏ
    this.getVowel = function( vowel ) {
      var idx = this.aJaso.indexOf(this.aVowel[vowel]);
      return String.fromCharCode(12593 + idx);
    };

    // 0,0,0 -> 가
    this.get = function( cho, vowel, jong ){
      if (cho >= 0 && vowel >= 0){
        jong = jong == -1 ? 0 : jong;
        return String.fromCharCode((cho * 21 + vowel) * 28 + jong + 44032);
      }else if (cho >= 0){
        return this.getCho(cho);
      }else if (vowel >= 0){
        return this.getVowel(vowel);
      }else{
        throw "IllegalArgument";
      }
    };
  };

  /***************************
   * hangul 2 (KS X 5002)
   ***************************/
  var imH2 = new (function() {
    this.name = 'H2';
    this.buf = new buf();
    this.hangul = new hangul();

    //handleKeyEvent for hangul 2
    this.handleKeyEvent = function(oKeyEvent) {
      if(oKeyEvent.charCode == key.ENTER) {
        this.buf.flush();
        return {name:'insPara'};
      }else if(oKeyEvent.charCode == key.BACKSPACE) {
        if(this.buf.size() > 1) {
          this.buf.init(1);
          return {name:'cmbChar', value:this.parse(this.buf.get())};
        }else{
          this.buf.flush();
          return {name:'delChar'};
        }
      }else if(key.isAlpha(oKeyEvent.charCode)) {
        var sCmd = this.buf.size() == 0 ? 'insChar' : 'cmbChar';
        var aHangul = this.parse(this.buf.get() + String.fromCharCode(oKeyEvent.charCode));
        return {name:sCmd, value:aHangul.join("")};
      }else{
        this.buf.flush();
        return {name:'insChar', value:String.fromCharCode(oKeyEvent.charCode)};
      }
    };

    this.parse = function(stream) {
      this.buf.flush();

      var cho = -1, vowel = -1, jong = -1;
      var flushed = [];
      var aCh = stream.split('');
      for (var idx = 0, len = aCh.length; idx < len; idx++) {
        var ch = aCh[idx];
        this.buf.push(ch);
        var newCho = this.aCho.indexOf(ch);
        var newVowel = this.aVowel.indexOf(ch);

        //0. initial state
        if(cho < 0 && vowel < 0 && jong < 0) {
          if(newCho >= 0) { //01. ㄱ
            cho = newCho;
          }else if(newVowel >= 0) { //02. ㅏ
            vowel = newVowel;
          }
          //1. ㄱ
        }else if(cho >= 0 && vowel < 0 && jong < 0) {
          if(newCho >= 0) { //11. ㄱ+ㄱ, check flush
            var combineCho = this.getCombineCho(cho, newCho);
            if(combineCho >= 0) {
              cho = combineCho;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.getCho(cho));
              cho = newCho;
            }
          }else if(newVowel >= 0) { //12. ㄱ+ㅏ
            vowel = newVowel;
          }
          //2. 가
        }else if(cho >= 0 && vowel >= 0 && jong < 0) {
          if(newCho >= 0) { //21. 가+ㅇ, check flush
            var newJong = this.aJong.indexOf(ch);
            if(newJong >= 0) {
              jong = newJong;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = newCho;
              vowel = -1;
              jong = -1;
            }
          }else if(newVowel >= 0) { //22. 가+ㅣ, check flush
            var combineVowel = this.getCombineVowel(vowel, newVowel);
            if(combineVowel >= 0) {
              vowel = combineVowel;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = -1;
              vowel = newVowel;
            }
          }
          //3. 강
        }else if(cho >= 0 && vowel >= 0 && jong >= 0) {
          if(newCho >= 0) { //31. 뷀+ㄱ, check flush
            var combineJong = this.getCombineJong(jong, newCho);
            if(combineJong >= 0) {
              jong = combineJong;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = newCho;
              vowel = -1;
              jong = -1;
            }
          }else if(newVowel >= 0) { //32. 강+ㅡ, flush
            var aSplited = this.getSplitedJong(jong);
            this.buf.tail(2);
            flushed.push(this.hangul.get(cho, vowel, aSplited[0]));

            cho = aSplited[aSplited.length-1];
            vowel = newVowel;
            jong = -1;
          }
          //4. ㅏ
        }else if(cho < 0 && vowel >= 0 && jong < 0) {
          if(newCho >= 0) { //41. ㅏ + ㄱ = 가, *)adjust typo
            cho = newCho;
          }else if(newVowel >= 0) { //42. ㅗ + ㅐ = ㅙ
            var combineVowel = this.getCombineVowel(vowel, newVowel);
            if(combineVowel >= 0) {
              vowel = newVowel;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = -1;
              vowel = newVowel;
            }
          }
        }
      };

      flushed.push(this.hangul.get(cho, vowel, jong));
      return flushed;
    }

    /**
     * combine chosung (ex: ㄱ+ㄱ=ㄲ)
     **/
    this.getCombineCho = function( cho1, cho2 ) {
      var ch = this.aCho[cho1];
      if(cho1 == cho2 && ch.toLowerCase() == ch) {
        return this.aCho.indexOf(ch.toUpperCase()); //ㄱ -> ㄲ
      }else{
        return -1;
      }
    };

    /**
     * combine chosung (ex: ㅜ+ㅓ=ㅝ)
     **/
    this.getCombineVowel = function( vowel1, vowel2 ) {
      var oMapping = {
        'kl' : 'o' //ㅏ+ㅣ=ㅐ
      }
      var combined = this.aVowel[vowel1] + this.aVowel[vowel2];
      return this.aVowel.indexOf(oMapping[combined] || combined);
    };

    /**
     * combine chosung (ex: ㄴ+ㅈ=ㄴㅈ)
     **/
    this.getCombineJong = function( jong, cho ) {
      return this.aJong.indexOf(this.aJong[jong] + this.aCho[cho]);
    };

    /**
     * splited jong (ex: ㄴㅈ -> [ㅈ(jong), ㄴ(cho)], ㄴ -> [-1(jong), ㄴ(cho)])
     **/
    this.getSplitedJong = function( jong ) {
      var ch = this.aJong[jong];
      if(ch.length > 1) {
        return [this.aJong.indexOf(ch[0]), this.aCho.indexOf(ch[1])];
      }else{
        return [-1, this.aCho.indexOf(ch)];
      }
    };

    this.aCho = [
      'r',//ㄱ
      'R',//ㄲ
      's',//ㄴ
      'e',//ㄷ
      'E',//ㄸ
      'f',//ㄹ
      'a',//ㅁ
      'q',//ㅂ
      'Q',//ㅃ
      't',//ㅅ
      'T',//ㅆ
      'd',//ㅇ
      'w',//ㅈ
      'W',//ㅉ
      'c',//ㅊ
      'z',//ㅋ
      'x',//ㅌ
      'v',//ㅍ
      'g' //ㅎ
    ];

    this.aVowel = [
      'k',//ㅏ
      'o',//ㅐ
      'i',//ㅑ
      'O',//ㅒ
      'j',//ㅓ
      'p',//ㅔ
      'u',//ㅕ
      'P',//ㅖ
      'h',//ㅗ
      'hk',//ㅘ
      'ho',//ㅙ
      'hl',//ㅚ
      'y',//ㅛ
      'n',//ㅜ
      'nj',//ㅝ
      'np',//ㅞ
      'nl',//ㅟ
      'b',//ㅠ
      'm',//ㅡ
      'ml',//ㅢ
      'l' //ㅣ
    ];

    this.aJong = [
      '', //padding
      'r',//ㄱ
      'R',//ㄲ
      'rt',//ㄳ
      's',//ㄴ
      'sw',//ㄵ
      'sg',//ㄶ
      'e',//ㄷ
      'f',//ㄹ
      'fr',//ㄺ
      'fa',//ㄻ
      'fq',//ㄼ
      'ft',//ㄽ
      'fx',//ㄾ
      'fv',//ㄿ
      'fg',//ㅀ
      'a',//ㅁ
      'q',//ㅂ
      'qt',//ㅄ
      't',//ㅅ
      'T',//ㅆ
      'd',//ㅇ
      'w',//ㅈ
      'c',//ㅊ
      'z',//ㅋ
      'x',//ㅌ
      'v',//ㅍ
      'g' //ㅎ
    ];

    //String.fromCharCode(12593 + idx)
    this.aJaso = [
      'r',//ㄱ
      'R',//ㄲ
      'rt',//ㄳ
      's',//ㄴ
      'sw',//ㄵ
      'sg',//ㄶ
      'e',//ㄷ
      'E',//ㄸ
      'f',//ㄹ
      'fr',//ㄺ
      'fa',//ㄻ
      'fq',//ㄼ
      'ft',//ㄽ
      'fx',//ㄾ
      'fv',//ㄿ
      'fg',//ㅀ
      'a',//ㅁ
      'q',//ㅂ
      'Q',//ㅃ
      'qt',//ㅄ
      't',//ㅅ
      'T',//ㅆ
      'd',//ㅇ
      'w',//ㅈ
      'W',//ㅉ
      'c',//ㅊ
      'z',//ㅋ
      'x',//ㅌ
      'v',//ㅍ
      'g',//ㅎ
      'k',//ㅏ
      'o',//ㅐ
      'i',//ㅑ
      'O',//ㅒ
      'j',//ㅓ
      'p',//ㅔ
      'u',//ㅕ
      'P',//ㅖ
      'h',//ㅗ
      'hk',//ㅘ
      'ho',//ㅙ
      'hl',//ㅚ
      'y',//ㅛ
      'n',//ㅜ
      'nj',//ㅝ
      'np',//ㅞ
      'nl',//ㅟ
      'b',//ㅠ
      'm',//ㅡ
      'ml',//ㅢ
      'l' //ㅣ
    ];
    this.hangul.init(this.aCho, this.aVowel, this.aJong, this.aJaso);
  })();

  /***************************
   * hangul 390 (by blueiur)
   * under construction
   ***************************/
  var imH390 = new (function() {
    this.name = 'H390';
    this.buf = new buf();
    this.hangul = new hangul();

    //handleKeyEvent for hangul 390
    this.handleKeyEvent = function(oKeyEvent) {
      if (oKeyEvent.charCode == key.ENTER){
        this.buf.flush();
        return {name:'insPara'};
      }else if (oKeyEvent.charCode == key.BACKSPACE){
        if (this.buf.size() > 1){
          this.buf.init(1);
          return {name:'cmbChar', value:this.parse(this.buf.get())};
        }else{
          this.buf.flush();
          return {name:'delChar'};
        }
      }else if (key.isAlpha(oKeyEvent.charCode)){
        var sCmd = this.buf.size() == 0 ? 'insChar' : 'cmbChar';
        var aHangul = this.parse(this.buf.get() + String.fromCharCode(oKeyEvent.charCode));
        return {name:sCmd, value:aHangul.join("")};
      }else{
        this.buf.flush();
        return {name:'insChar', value:String.fromCharCode(oKeyEvent.charCode)};
      }
    };

    this.parse = function(stream) {
      this.buf.flush();

      var cho = -1, vowel = -1, jong = -1;
      var flushed = [];
      var aCh = stream.split('');
      for (var idx = 0, len = aCh.length; idx < len; idx++) {
        var ch = aCh[idx];
        this.buf.push(ch);
        var newCho = this.getIndex("cho", ch);
        var newVowel = this.getIndex("vowel", ch);
        var newJong = this.getIndex("jong", ch);

        //0. initial state
        if (cho < 0 && vowel < 0 && jong < 0){
          if (newCho >= 0){ //01. ㄱ
            cho = newCho;
          }else if (newVowel >= 0){ //02. ㅏ
            vowel = newVowel;
          }else if (newJong >= 0){
            cho = this.getChoFromJong(newJong);
          }
        }else if (cho >= 0 && vowel < 0 && jong < 0){
          if (newCho >= 0){ //11. ㄱ+ㄱ, check flush
            var combineCho = this.getCombineCho(cho, newCho);
            if (combineCho >= 0){
              cho = combineCho;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.getCho(cho));
              cho = newCho;
            }
          }else if (newVowel >= 0){ //12. ㄱ+ㅏ
            vowel = newVowel;
          }else if(newJong >= 0){
            this.buf.tail(1);
            flushed.push(this.hangul.getCho(cho));
            cho = this.getChoFromJong(newJong);
          }
          //2. 가
        }else if (cho >= 0 && vowel >= 0 && jong < 0){					
          if ( newCho >= 0 ){
            this.buf.tail(1);
            flushed.push(this.hangul.get(cho, vowel, jong));
            cho = newCho;
            vowel = -1;
          }else if ( newVowel >= 0 ){ //22. 가+ㅣ, check flush
            var combineVowel = this.getCombineVowel(vowel, newVowel);
            if (combineVowel >= 0){
              vowel = combineVowel;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = -1;
              vowel = newVowel;
            }
          }else if ( newJong > -1 ){ //21. 가+ㅇ, check flush
            jong = newJong;
          }
          //3. 강
        }else if (cho >= 0 && vowel >= 0 && jong >= 0){
          if (newCho >= 0){ //31. 뷀+ㄱ, check flush
            var combineJong = this.getCombineJong(jong, newJong);
            if (combineJong >= 0){
              jong = combineJong;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = newCho;
              vowel = -1;
              jong = -1;
            }
          }else if (newVowel >= 0){ //32. 강+ㅡ, flush
            this.buf.tail(1);
            flushed.push(this.hangul.get(cho, vowel, jong));
            cho = -1;
            vowel = newVowel;
            jong = -1;
          }else if (newJong > -1){
            var combineJong = this.getCombineJong(jong, newJong);
            if (combineJong >= 0){
              jong = combineJong;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = this.getChoFromJong(newJong);
              vowel = -1;
              jong = -1;
            }
          }
          //4. ㅏ
        }else if (cho < 0 && vowel >= 0 && jong < 0){
          if (newCho >= 0){ //41. ㅏ + ㄱ = 가, *)adjust typo
            cho = newCho;
          }else if (newVowel >= 0){ //42. ㅗ + ㅐ = ㅙ
            var combineVowel = this.getCombineVowel(vowel, newVowel);
            if (combineVowel >= 0){
              vowel = newVowel;
            }else{
              this.buf.tail(1);
              flushed.push(this.hangul.get(cho, vowel, jong));
              cho = -1;
              vowel = newVowel;
            }
          }else if (newJong >= 0){
            cho = this.getChoFromJong(newJong);
          }
        }
      };

      if ( cho > -1 || vowel > -1 || jong > -1){ // jong first
        flushed.push(this.hangul.get(cho, vowel, jong));
      }

      return flushed;
    };

    /**
     * combine chosung (ex: ㄱ+ㄱ=ㄲ)
     **/
    this.getCombineCho = function( cho1, cho2 ){
      var ch = this.aCho[cho1];
      if (cho1 == cho2){
        return this.getIndex("cho", ch + ch); //ㄱ -> ㄲ
      }else{
        return -1;
      }
    };

    /**
     * combine vowel (ex: ㅜ+ㅓ=ㅝ)
     **/
    this.getCombineVowel = function( vowel1, vowel2 ){
      return this.getIndex("vowel", this.aVowel[vowel1] + this.aVowel[vowel2]);
    };

    /**
     * combine jong (ex: ㄴ+ㅈ=ㄴㅈ)
     **/
    this.getCombineJong = function( jong, newJong ){
      return this.getIndex("jong", this.aJong[jong] + this.aJong[newJong]);
    };

    this.getIndex = function(name, ch){
      if (name == "cho"){
        return this.aCho.indexOf(ch);
      }else if (name == "vowel"){
        if (ch == "/"){ ch = "v";};
        if (ch == "9"){ ch = "b";};
        return this.aVowel.indexOf(ch);
      }else if (name == "jong"){
        return this.aJong.indexOf(ch);
      }

      return -1;
    };

    this.getChoFromJong = function(jong){
      var map ={
        "x" : "k", //ㄱ
        "s" : "h", //ㄴ
        "A" : "u",//ㄷ
        "w" : "y", //ㄹ
        "z" : "i",//ㅁ
        "3" : ";",//ㅂ
        "q" : "n",//ㅅ
        "a" : "j",//ㅇ
        "!" : "i",//ㅈ
        "Z" : "o",//ㅊ
        "e" : "0",//ㅋ
        "W" : "'",//ㅌ
        "Q" : "p",//ㅍ
        "1" : "m"//ㅎ
      };
      var ch = map[ this.aJong[jong] ];
      return this.aCho.indexOf( ch );
    };

    this.aCho = [
      "k",//ㄱ
      "kk",//ㄲ
      "h",//ㄴ
      "u",//ㄷ
      "uu",//ㄸ
      "y",//ㄹ
      "i",//ㅁ
      ";",//ㅂ
      ";;",//ㅃ
      "n",//ㅅ
      "nn",//ㅆ
      "j",//ㅇ
      "l",//ㅈ
      "ll",//ㅉ
      "o",//ㅊ
      "0",//ㅋ
      "'",//ㅌ
      "p",//ㅍ
      "m" //ㅎ
    ];

    this.aVowel = [
      "f",//ㅏ
      "r",//ㅐ
      "6",//ㅑ
      "R",//ㅒ
      "t",//ㅓ
      "c",//ㅔ
      "e",//ㅕ
      "7",//ㅖ
      "v",//ㅗ
      "vf",//ㅘ
      "vr",//ㅙ
      "vd",//ㅚ
      "4",//ㅛ
      "b",//ㅜ
      "bt",//ㅝ
      "bc",//ㅞ
      "bd",//ㅟ
      "5",//ㅠ
      "g",//ㅡ
      "gd",//ㅢ
      "d" //ㅣ
    ];

    this.aJong = [
      "", //padding
      "x",//ㄱ
      "F",//ㄲ
      "xq",//ㄳ
      "s",//ㄴ
      "s!",//ㄵ
      "S",//ㄶ
      "A",//ㄷ
      "w",//ㄹ
      "wx",//ㄺ
      "wz",//ㄻ
      "w3",//ㄼ
      "wq",//ㄽ
      "wW",//ㄾ
      "wQ",//ㄿ
      "V",//ㅀ
      "z",//ㅁ
      "3",//ㅂ
      "3q",//ㅄ
      "q",//ㅅ
      "2",//ㅆ
      "a",//ㅇ
      "!",//ㅈ
      "Z",//ㅊ
      "e",//ㅋ
      "W",//ㅌ
      "Q",//ㅍ
      "1" //ㅎ
    ];

    //String.fromCharCode(12593 + idx)
    this.aJaso = [
      "k",//ㄱ
      "kk",//ㄲ
      "xq",//ㄳ
      "h",//ㄴ
      "s!",//ㄵ
      "S",//ㄶ
      "u",//ㄷ
      "uu",//ㄸ
      "y",//ㄹ
      "wx",//ㄺ
      "wz",//ㄻ
      "w3",//ㄼ
      "wq",//ㄽ
      "wW",//ㄾ
      "wQ",//ㄿ
      "V",//ㅀ
      "i",//ㅁ
      ";",//ㅂ
      ";;",//ㅃ
      "3q",//ㅄ
      "n",//ㅅ
      "nn",//ㅆ
      "j",//ㅇ
      "l",//ㅈ
      "ll",//ㅉ
      "o",//ㅊ
      "0",//ㅋ
      "'",//ㅌ
      "p",//ㅍ
      "m",//ㅎ
      "f",//ㅏ
      "r",//ㅐ
      "6",//ㅑ
      "R",//ㅒ
      "t",//ㅓ
      "c",//ㅔ
      "e",//ㅕ
      "7",//ㅖ
      "v",//ㅗ
      "vf",//ㅘ
      "vr",//ㅙ
      "vd",//ㅚ
      "4",//ㅛ
      "b",//ㅜ
      "bt",//ㅝ
      "bc",//ㅞ
      "bd",//ㅟ
      "5",//ㅠ
      "g",//ㅡ
      "gdl",//ㅢ
      "d" //ㅣ
    ];

    this.hangul.init(this.aCho, this.aVowel, this.aJong, this.aJaso);
  })();

  var imejs = new ime();

  // AMD / RequireJS
  if (typeof define !== 'undefined' && define.amd) {
    define('imejs', [], function () {
      return imejs;
    });
  }
  
  // Node.js
  else if (typeof module !== 'undefined' && module.exports) {
    module.exports = imejs;
  }
  
  // included directly via <script> tag
  else {
    root.ime = imejs;
  }
  
})(this); //root object, window in the browser
