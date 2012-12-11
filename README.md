imejs(Under Construction)
=========================

* Javascript IME(Input Method Editor) for CJK
* version: 0.01

# 목적
* 운영체제 IME를 사용하지 않으므로 일관성이 있으며 한글 IME가 설치되지 않은 운영체제에도 한글을 입력할 수 있음

# 의존성
* Javascript, DOM(Document Object Model)외 의존성 없음

# 지원 자판
* 표준 두벌식 자판 : hangul 2 (KS X 5002)

# 특징
## 표준 두벌식 자판 오타 자동 수정
* 자음 조합으로 된소리('ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ') 입력하기: ex) ㄱ+ㄱ=ㄲ
* 모음 조합 입력하기: ㅏ+ㅣ= ㅐ
* 모음, 자음 입력순서 보정하기: ex) ㅏ+ㄱ = 가

# 인터페이스
외부에서 라이브러리를 사용하는 예제코드는 jQuery 1.8.3을 사용
```javascript
$(document).ready(function(){
  // 01. keyCommandHandler를 정의한다.
  // @param oCmd 키에 대한 명령객체
  var fnKeyCommandHandler = function(oCmd){
    if(oCmd.name == "insChar"){ //문자입력
      $("#editor").text($("#editor").text() + oCmd.value); 
    }else if(oCmd.name == "cmbChar"){ //문자입력중(조합상태)
      var sContents = $("#editor").text();
      sContents = sContents.substring(0, sContents.length -1) + oCmd.value;
      $("#editor").text(sContents); 
    }else if(oCmd.name == "delChar"){ //문자삭제
      var sContents = $("#editor").text();
      sContents = sContents.substring(0, sContents.length -1);
      $("#editor").text(sContents);
    }else if(oCmd.name == "nextIm"){ //다른 IME를 선택명령, 2벌식>영어>3벌식(390) 순
    }
  } 
  //02. IME 초기화, 키입력에 대한 자체 포커스를 갖음
  var elHolder = $("#status")[0]; //이벤트를 받는 리스너의 홀더 엘리먼트
  ime.init(fnKeyCommandHandler, elHolder);
});
```

# TODO
* 특수기호 지원
* 한글 세벌식 최종, 390 자판 지원
* 한글 두벌식 일부 동시치기 지원
* 한글 세벌식 전부 동시치기 지원
* 일본어 자판 지원