// 패시지 텍스트 전처리 (앞뒤 공백 제거)
SugarCube.Config.passages.onProcess = function(p) {
    return p.text.trim();
};

/* vntext 매크로 정의 */

SugarCube.Macro.add('vntext', {
    tags: null,
    handler: function () {
        // 1. 내용 가져오기
        let content = this.payload[0].contents.trim();
      
      	// 정규표현식으로 $로 시작하는 단어를 찾아서 SugarCube 엔진에 값을 물어봅니다.
        content = content.replace(/(\$[a-zA-Z0-9_\.]+)/g, function(match) {
            try {
                // SugarCube의 스크립트 엔진을 통해 변수 값을 가져옴
                let result = SugarCube.Scripting.evalTwineScript(match);
                return result !== undefined ? result : match;
            } catch (e) {
                return match; // 에러 나면 그냥 원래 텍스트($name) 출력
            }
        });
        
        // 2. 텍스트 분석 (Parsing)
        // 줄바꿈으로 나눈 뒤, 각 줄에서 <<name ...>> 패턴을 추출합니다.
        let linesData = content.split('\n\n').filter(line => line.trim() !== '').map(line => {
            let text = line.trim();
            let speaker = null;
         	let charImg = null;

            // 정규표현식: <<name "..." >> 또는 <<name $... >> 찾기
            // match[1]에 이름 데이터가 잡힘
            const nameMatch = text.match(/<<name\s+(.+?)>>/);

            if (nameMatch) {
                let rawName = nameMatch[1]; // 예: "미나" 또는 $name
                
                // 태그를 텍스트에서 제거
                text = text.replace(nameMatch[0], '').trim();

                // 변수($name)인지 문자열("미나")인지 확인하여 값 변환
                try {
                    speaker = SugarCube.Scripting.evalTwineScript(rawName);
                } catch (e) {
                    speaker = rawName.replace(/['"]/g, ''); // 따옴표 제거
                }
            }
            
            // B. [NEW] 이미지 태그 추출 (<<img "mn" "3">>)
            // 정규식 설명: <<img "문자열" "숫자/문자열">> 형태를 찾음
            const imgMatch = text.match(/<<img\s+["'](.+?)["']\s+["'](.+?)["']>>/);
            if (imgMatch) {
                charImg = {
                    char: imgMatch[1], // 캐릭터 코드 (예: mn)
                    num: imgMatch[2]   // 번호 (예: 3)
                };
                text = text.replace(imgMatch[0], '').trim(); // 태그 삭제
            }
            
            // 텍스트 내용, 화자, 이미지 정보를 리턴
            return { text: text, speaker: speaker, charImg: charImg };
        });

        // 3. 출력 박스 생성
        let $container = $('<div id="typewriter-box"></div>').appendTo(this.output);
        
        // 4. 상태 변수
        let lineIndex = 0;      
        let charIndex = 0;      
        let currentText = "";   
        let timerId = null;     
        let isTyping = false;   
        let $currentLineObj = null;

        // 5. 한 글자씩 타이핑
        function typeNextChar() {
            if (charIndex < currentText.length) {
                $currentLineObj.text(currentText.substring(0, charIndex + 1));
                charIndex++;
            } else {
                stopTyping(); 
            }
        }

        // 6. 줄 시작 (이름표 업데이트 & 색상 적용)
        function startTypingLine() {
            if (lineIndex >= linesData.length) {
                $(document).off('.vntext'); 
                $('#next-btn').fadeIn(); 
                return;
            }

            $container.empty();

            let currentData = linesData[lineIndex];
            currentText = currentData.text;
            
            // 변수 치환 ($name -> 철수)
            currentText = currentText.replace(/(\$[a-zA-Z0-9_\.]+)/g, function(match) {
                try {
                    let result = SugarCube.Scripting.evalTwineScript(match);
                    return result !== undefined ? result : match;
                } catch (e) { return match; }
            });

            // [핵심 수정] 이름표 처리 및 색상 적용
            let $nameText = $("#name-text");
            
            if (currentData.speaker) {
                $nameText.text(currentData.speaker);
                $("#name-zone").show();

                // 1. 기존 색상 클래스 초기화 (이전 캐릭터 색 제거)
                $nameText.removeClass("name-mina name-chaejin name-clara");

                // 2. 캐릭터 이름에 따라 색상 클래스 부여
                // (공백 제거 후 비교하여 오타 방지)
                let speaker = currentData.speaker.trim();
                
                if (speaker === "미나") {
                    $nameText.addClass("name-mina");
                } else if (speaker === "채진") {
                    $nameText.addClass("name-chaejin");
                } else if (speaker === "클라라") {
                    $nameText.addClass("name-clara");
                }
                
            } else {
                $("#name-zone").hide();
            }

            // 이미지 변경 처리
            if (currentData.charImg) {
                changeCharacterImage(currentData.charImg.char, currentData.charImg.num);
            }

            isTyping = true;
            charIndex = 0;
            $currentLineObj = $('<div class="typing-line"></div>').appendTo($container);

            // 태그에 glitch가 있으면 조금 천천히(50ms), 없으면 정상 속도(30ms)
            // (State.variables가 아니라 현재 DOM의 태그를 확인해야 함)
            let speed = $("body").attr("data-tags") && $("body").attr("data-tags").includes("glitch") ? 50 : 30;

            timerId = setInterval(typeNextChar, speed);
        }

        // 7. 줄 완성
        function stopTyping() {
            if (timerId) clearInterval(timerId);
            isTyping = false;
            
            $currentLineObj.text(currentText);
            $currentLineObj.append('<span class="next-icon">🍀</span>');
            
            lineIndex++; 
        }

        // 8. 클릭 핸들러
        const clickHandler = function (ev) {
            if ($("#pause-screen").is(":visible")) return;
            if ($(ev.target).is('a, button, input, textarea, .ui-dialog-body')) return;

            if (isTyping) {
                stopTyping(); // 스킵
            } else {
                // 마지막 줄까지 다 본 상태에서 클릭하면 종료 처리 (링크 띄우기)
                if (lineIndex < linesData.length) {
                    startTypingLine();
                } else {
                    $(document).off('.vntext'); 
                    $('.next-icon').remove();
                    $('#next-btn').fadeIn();
                }
            }
        };
      
      	function changeCharacterImage(charCode, num) {
            // 기존 이미지 제거
            $('#character-image').remove();
            
            // 새 이미지 생성 및 추가
            const imagePath = `assets/${charCode}/${num}.png`;
            const img = $('<img>')
                .attr('id', 'character-image')
                .attr('src', imagePath)
                .attr('alt', `${charCode} ${num}`)
                .on('error', function() {
                    console.log('이미지 로드 실패:', imagePath);
                    $(this).remove();
                });
            
            $('body').append(img);
        }

        // 9. 초기 실행
        setTimeout(() => {
            $('#next-btn').hide(); 
            $(document).on('click.vntext', clickHandler);
            startTypingLine(); 
        }, 100);

        // 10. 종료 처리
        $(document).one(':passageend', function () {
            $(document).off('.vntext');
            if (timerId) clearInterval(timerId);
            $("#name-zone").hide();
        });
    }
});
/* ===========================================================
   [매크로] 특수 연출 (Blur & Awake) - 깜빡임 방지 최종판
   =========================================================== */

function ensureOverlays() {
    if ($("#blackout-overlay").length === 0) $("body").append('<div id="blackout-overlay"></div>');
}

// 전역 플래그
window.effectState = null;

/* -----------------------------------------------------------
   1. <<blur "이동할패시지">>
   - 현재 화면 암전 -> (이동 직전 텍스트 숨김) -> 이동 -> (다음 화면) 배경 보임 -> 텍스트 보임
   ----------------------------------------------------------- */
SugarCube.Macro.add("blur", {
    handler: function() {
        ensureOverlays();
        var destination = this.args[0];
        
        window.effectState = 'blur';

        // 1) 3초 동안 화면 암전 (클릭 차단)
        $("#blackout-overlay").css("transition", "opacity 3s ease-in").addClass("active");
        
        // 2) 3초 뒤 페이지 이동
        setTimeout(function() {
            // [중요] 이동하기 직전에 '텍스트 숨김 모드' 발동
            // 다음 페이지가 로딩될 때 아예 안 보이게 함
            $("html").addClass("story-hidden");
            
            if (destination) SugarCube.Engine.play(destination);
        }, 3000);
    }
});

/* -----------------------------------------------------------
   2. <<awake "이동할패시지">>
   - (이동 직전 암전 & 텍스트 숨김) -> 이동 -> (다음 화면) 배경 보임 -> 텍스트 보임
   ----------------------------------------------------------- */
SugarCube.Macro.add("awake", {
    handler: function() {
        ensureOverlays();
        var destination = this.args[0];
        
        window.effectState = 'awake';

        // [중요] 이동하기 전에 미리 화면을 깜깜하게 만들고 텍스트를 숨김
        // transition: none으로 즉시 적용하여 플레이어는 이동 과정을 못 봄
        $("#blackout-overlay").css("transition", "none").addClass("active").css("opacity", "1");
        $("html").addClass("story-hidden");

        if (destination) SugarCube.Engine.play(destination);
    }
});


/* =========================================
   [페이지 전환 후 처리 로직]
   ========================================= */
$(document).on(":passagedisplay", function(ev) {
    ensureOverlays();
    
    var $overlay = $("#blackout-overlay");

    // 시나리오 A: <<blur>>를 통해 넘어온 경우
    if (window.effectState === 'blur') {
        window.effectState = null;

        // 검은 막은 유지(active), 텍스트는 이미 안 보임(story-hidden)

        // 1. 연출 시작 (0.1초 딜레이)
        setTimeout(function() {
            // [단계 1] 2초 동안 검은 막 사라짐 (배경 보임)
            $overlay.css("transition", "opacity 2s ease-out").removeClass("active").css("opacity", "0");
            
            // [단계 2] 2초 뒤에 텍스트 등장
            setTimeout(function() {
                // 숨김 모드 해제 (CSS transition에 의해 부드럽게 나타남)
                $("html").removeClass("story-hidden");
            }, 2001);

        }, 100);
    }

    // 시나리오 B: <<awake>>를 통해 넘어온 경우
    else if (window.effectState === 'awake') {
        window.effectState = null;

        // 이미 검은 막(active) 상태, 텍스트 숨김(story-hidden) 상태임

        // 1. 연출 시작
        setTimeout(function() {
            // CSS 초기화
            $overlay.css("opacity", "");

            // [단계 1] 5초 동안 검은 막 사라짐 (천천히 눈 뜸)
            $overlay.css("transition", "opacity 3s ease-out").removeClass("active");

            // [단계 2] 5초 뒤에 텍스트 등장
            setTimeout(function() {
                $("html").removeClass("story-hidden");
            }, 3001);

        }, 100);
    }

    // 시나리오 C: 일반 이동
    else {
        // 혹시라도 숨김 모드가 남아있다면 즉시 해제
        $("html").removeClass("story-hidden");
        
        if ($overlay.hasClass("active")) {
            $overlay.css("transition", "none").removeClass("active").css("opacity", "0");
            setTimeout(function(){ $overlay.css("transition", ""); }, 100);
        }
    }
});
