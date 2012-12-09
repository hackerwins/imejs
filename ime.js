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
      this.aIm = [imH2, imEN, imH3];
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
      fnAttachEvent(elListener, 'keydown', function(e) {
        fnHandler(that.parseEvent(e));
        e.preventDefault();
      });
      elListener.focus();
    };

    //parse event
    this.parseEvent = function(e) {
      var oKeyEvent = key.getKeyEvent(e); //native event 2 oKeyEvent
      if(oKeyEvent.shift && key.SPACE == oKeyEvent.ch){
        this.nextIm();
        return {name: "nextIm"};
      } 
      if(!oKeyEvent.ch){ return {}; }
      return this.aIm[this.currentIdx].handleKeyEvent(oKeyEvent);
    };
  }

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

    this.A = 65;
    this.Z = 90;

    this.METAKEY = 91;
    this.WIN = 92;
    var CASE_PADDING = 32; // case_padding alpha upper <->  lower

    //convert native keydown event to key event
    this.getKeyEvent = function(e) {
      //set modifier
      var oKeyEvent = {
        shift : e.shiftKey,
        ctrl : e.ctrlKey,
        alt : e.altKey,
        meta : e.metaKey
      }; 

      //set ch
      var code = e.charCode || e.keyCode;
      if(!this.isModifier(code)){
        if(!e.shiftKey && this.isAlpha(code)) {
          code += CASE_PADDING;
        }
        oKeyEvent.ch = code;
      }

      return oKeyEvent;
    };

    // predicate modifier
    // http://en.wikipedia.org/wiki/Modifier_key
    // shift, ctrl, alt, altgr, meta, win, cmd, fn, super, hyper
    this.isModifier = function(keyCode){
      return [ this.SHIFT, this.CTRL, this.ALT, this.METAKEY, this.WIN ].indexOf(keyCode) != -1;
    };
    
    //predicate : A-Z + a~z
    this.isAlpha = function(keyCode) {
        return this.isUpperAlpha(keyCode) || this.isLowerAlpha(keyCode);
    };

    //predicate : A~Z
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
      if(key.isAlpha(oKeyEvent.ch)) {
        return {name:'insChar', value:String.fromCharCode(oKeyEvent.ch)};
      }else if(oKeyEvent.ch == key.ENTER) {
        return {name:'insPara'};
      }else if(oKeyEvent.ch == key.BACKSPACE) {
        return {name:'delChar'};
      }else{
        throw 'error';
      }
    };
  })();

  /***************************
   * buf
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
    }

    this.get = function(){
      return this.buf;
    }
  };

  /***************************
   * hangul 2 (KS X 5002)
   ***************************/
  var imH2 = new (function() {
    this.name = 'H2';
    this.buf = new buf();

    //handleKeyEvent for hangul 2
    this.handleKeyEvent = function(oKeyEvent) {
      if(key.isAlpha(oKeyEvent.ch)) {
        var sCmd = this.buf.size() == 0 ? 'insChar' : 'cmbChar';
        var aHangul = this.parse(this.buf.get() + String.fromCharCode(oKeyEvent.ch));
        return {name:sCmd, value:aHangul.join("")};
      }else{
        if(oKeyEvent.ch == key.ENTER) {
          this.buf.flush();
          return {name:'insPara'};
        }else if(oKeyEvent.ch == key.BACKSPACE) {
          if(this.buf.size() > 1) {
            this.buf.init(1);
            return {name:'cmbChar', value:this.parse(this.buf.get())};
          }else{
            this.buf.flush();
            return {name:'delChar'};
          }
        }else{
          this.buf.flush();
          return {};
        }
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
              flushed.push(this.getHangulFromCho(cho));
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
              flushed.push(this.getHangul(cho, vowel, jong));
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
              flushed.push(this.getHangul(cho, vowel, jong));
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
              flushed.push(this.getHangul(cho, vowel, jong));
              cho = newCho;
              vowel = -1;
              jong = -1;
            }
          }else if(newVowel >= 0) { //32. 강+ㅡ, flush
            var aSplited = this.getSplitedJong(jong);
            this.buf.tail(2);
            flushed.push(this.getHangul(cho, vowel, aSplited[0]));

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
              flushed.push(this.getHangul(cho, vowel, jong));
              cho = -1;
              vowel = newVowel;
            }
          }
        }
      };

      flushed.push(this.getHangul(cho, vowel, jong));
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

    /**
     * 0 -> ㄱ
     **/
    this.getHangulFromCho = function( cho ) {
      var idx = this.aJaso.indexOf(this.aCho[cho]);
      return String.fromCharCode(12593 + idx);
    };

    /**
     * 0 -> ㅏ
     **/
    this.getHangulFromVowel = function( vowel ) {
      var idx = this.aJaso.indexOf(this.aVowel[vowel]);
      return String.fromCharCode(12593 + idx);
    };

    /**
     * 0,0,0 -> 가
     **/
    this.getHangul = function( cho, vowel, jong ) {
      if(cho >= 0 && vowel >= 0) {
        jong = jong == -1 ? 0 : jong;
        return String.fromCharCode((cho * 21 + vowel) * 28 + jong + 44032);
      }else if(cho >= 0) {
        return this.getHangulFromCho(cho);
      }else if(vowel >= 0) {
        return this.getHangulFromVowel(vowel);
      }else{
        throw 'IllegalArgument';
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
  })();

  /***************************
   * hangul 3
   ***************************/
  var imH3 = new (function() {
    this.name = 'H3';
    this.handleKeyEvent = function(e) {
      return {};
    };
  })();

  root.ime = new ime();
})(this); //root object, window in the browser
