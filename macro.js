/* vntext 매크로 정의 */

SugarCube.Macro.add('vntext', {
    tags: null,
    handler: function () {
        let content = this.payload[0].contents.trim();
        let lines = content.split('\n').filter(line => line.trim() !== '');
        
        let $container = $('<div id="typewriter-box"></div>').appendTo(this.output);
        
        let lineIndex = 0;      
        let charIndex = 0;      
        let currentText = "";   
        let timerId = null;     
        let isTyping = false;   
        let $currentLineObj = null;

        function typeNextChar() {
            if (charIndex < currentText.length) {
                $currentLineObj.text(currentText.substring(0, charIndex + 1));
                charIndex++;
            } else {
                stopTyping(); 
            }
        }

        function startTypingLine() {
            $container.empty();
            isTyping = true;
            currentText = lines[lineIndex].trim();
            charIndex = 0;
            $currentLineObj = $('<div class="typing-line"></div>').appendTo($container);
            timerId = setInterval(typeNextChar, 30);
        }

        function stopTyping() {
            if (timerId) clearInterval(timerId);
            isTyping = false;
            $currentLineObj.text(currentText);
            $currentLineObj.append('<span class="next-icon">🖌️</span>');
            lineIndex++; 
        }

        const clickHandler = function (ev) {
            // 메뉴가 열려있으면 작동 중지
            if ($("#pause-screen").is(":visible")) return;
            if ($(ev.target).is('a, button, input, textarea, .ui-dialog-body')) return;

            if (isTyping) {
                stopTyping();
                return;
            }

            if (lineIndex < lines.length) {
                startTypingLine();
            } else {
                $(document).off('.vntext'); 
                $('.next-icon').remove();
                $('#next-btn').fadeIn();
            }
        };

        setTimeout(() => {
            $('#next-btn').hide(); 
            $(document).on('click.vntext', clickHandler);
            startTypingLine(); 
        }, 100);

        $(document).one(':passageend', function () {
            $(document).off('.vntext');
            if (timerId) clearInterval(timerId);
        });
    }
});

/* =========================================
   [매크로] 특수 연출 (Blur, Awake, Glitch)
   ========================================= */

// 공통: 오버레이 요소 생성 함수
function ensureOverlays() {
    if ($("#blackout-overlay").length === 0) {
        $("body").append('<div id="blackout-overlay"></div>');
    }
    if ($("#glitch-overlay").length === 0) {
        $("body").append('<div id="glitch-overlay"></div>');
    }
}

// 1. <<blur "이동할패시지">>
// - 화면이 3초간 어두워지고 흐려짐. 이동 후에도 어두운 상태 유지.
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
// - 이동한 패시지에서 3초간 천천히 밝아지고 선명해짐.
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
            // 검은 막: 3초 동안 서서히 사라짐
            $("#blackout-overlay").css("transition", "opacity 5s ease-out").removeClass("active");
            
            // 블러: 3초 동안 서서히 선명해짐
            $("#story").css("transition", "filter 5s ease-out").removeClass("blur-active");
        }, 50);
    } 
    
    // B. 일반적인 경우 (Awake가 아님)
    else {
        setTimeout(function() {
            // 검은 막: 3초 동안 서서히 사라짐
            $("#blackout-overlay").css("transition", "opacity 2s ease-out").removeClass("active");
            
            // 블러: 3초 동안 서서히 선명해짐
            $("#story").css("transition", "filter 2s ease-out").removeClass("blur-active");
        }, 50);
        
        // Glitch(노이즈)는 페이지가 바뀌면 꺼주는 게 일반적
        $("#glitch-overlay").removeClass("active");

    }
});