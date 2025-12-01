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
        let linesData = content.split('\n').filter(line => line.trim() !== '').map(line => {
            let text = line.trim();
            let speaker = null;

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
            
            // 텍스트 내용과 화자 정보를 객체로 리턴
            return { text: text, speaker: speaker };
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

        // 6. 줄 시작
        function startTypingLine() {
            // 마지막 줄까지 다 봤으면 종료
            if (lineIndex >= linesData.length) {
                $(document).off('.vntext'); 
                $('#next-btn').fadeIn(); // 링크 표시
                return;
            }

            // 화면 초기화
            $container.empty();

            // 현재 줄의 데이터 가져오기
            let currentData = linesData[lineIndex];
            currentText = currentData.text;
            let currentSpeaker = currentData.speaker;

            // 이름표 UI 갱신
            if (currentSpeaker) {
                $("#name-text").text(currentSpeaker);
                $("#name-zone").show();
            } else {
                $("#name-zone").hide(); // 이름이 없으면(지문) 숨김
            }

            isTyping = true;
            charIndex = 0;
            $currentLineObj = $('<div class="typing-line"></div>').appendTo($container);

            // 타이핑 시작
            timerId = setInterval(typeNextChar, 30);
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

// ... (이하 blur, awake 등 나머지 코드는 그대로 유지) ...
/* =========================================
   [매크로] 특수 연출 (Blur, Awake, Glitch)
   ========================================= */

// 공통: 오버레이 요소 생성 함수
function ensureOverlays() {
    if ($("#blackout-overlay").length === 0) {
        $("body").append('<div id="blackout-overlay"></div>');
    }
    if ($("#glitch-overlay").length === 0) {
        $("body").append('<div id="glitch-overlay">🖱️</div>');
    }
}

// 1. <<blur "이동할패시지">>
// - 화면이 3초간 어두워지고 흐려짐. 이동 후에 천천히 blur 해제.
SugarCube.Macro.add("blur", {
    handler: function() {
        ensureOverlays();
        var destination = this.args[0];
        
        // 1) 효과 시작 (3초 동안)
        $("#blackout-overlay").css("transition", "opacity 3s ease-in").addClass("active");
        $("#story").addClass("blur-active");

        // 2) 3초 뒤 페이지 이동
        setTimeout(function() {
            if (destination) SugarCube.Engine.play(destination);
        }, 3000);
    }
});

// 2. <<awake "이동할패시지">>
// - 이동한 패시지에서 5초간 천천히 밝아지고 선명해짐.
SugarCube.Macro.add("awake", {
    handler: function() {
        var destination = this.args[0];
        
        // 다음 페이지로 "깨어남" 신호를 보냄 (전역 변수 활용)
        SugarCube.setup.isAwaking = true;

        if (destination) SugarCube.Engine.play(destination);
    }
});

// 3. <<glitch "이동할패시지(선택)">>
// - 화면이 3초간 지직거림. 인자가 있으면 이동하고, 없으면 효과만 줌.
// 지금 잘 안됨
SugarCube.Macro.add("glitch", {
    handler: function() {
        ensureOverlays();
        var destination = this.args[0];
        
        // 1) 노이즈 시작
        $("#glitch-overlay").addClass("active");

        // 2) 이동 인자가 있다면 3초 뒤 이동
        if (destination) {
            setTimeout(function() {
                SugarCube.Engine.play(destination);
            }, 3000);
        }
        // 이동 인자가 없다면 그냥 효과만 켜둠 (blur와 같이 쓸 때를 위함)
    }
});


/* [페이지 전환 시 처리 로직] */
$(document).on(":passagedisplay", function(ev) {
    ensureOverlays();

    // A. Awake 효과 처리 (깨어나는 중이라면)
    if (SugarCube.setup.isAwaking) {
        SugarCube.setup.isAwaking = false; // 플래그 초기화

        // 1) 일단 화면을 강제로 어둡고 흐리게 설정 (0초 만에)
        $("#blackout-overlay").css("transition", "none").addClass("active");
        $("#story").css("transition", "none").addClass("blur-active");
        
        // 2) 아주 잠깐 뒤에 트랜지션을 주며 효과 해제 (눈 뜨는 연출)
        setTimeout(function() {
            // 검은 막: 5초 동안 서서히 사라짐
            $("#blackout-overlay").css("transition", "opacity 5s ease-out").removeClass("active");
            
            // 블러: 5초 동안 서서히 선명해짐
            $("#story").css("transition", "filter 5s ease-out").removeClass("blur-active");
        }, 50);
    } 
    
    // B. 일반적인 경우 (Awake가 아님)
    else {
        setTimeout(function() {
            // 검은 막: 2초 동안 서서히 사라짐
            $("#blackout-overlay").css("transition", "opacity 2s ease-out").removeClass("active");
            
            // 블러: 2초 동안 서서히 선명해짐
            $("#story").css("transition", "filter 2s ease-out").removeClass("blur-active");
        }, 50);
        
        // Glitch(노이즈)는 페이지가 바뀌면 꺼주는 게 일반적
        $("#glitch-overlay").removeClass("active");

    }
});