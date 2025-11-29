/* <<vntext>> 매크로 */
Macro.add('vntext', {
    tags: null,
    handler: function () {
        // 1. 텍스트 내용 가져오기
        let content = this.payload[0].contents.trim();
        let lines = content.split('\n').filter(line => line.trim() !== '');
        
        // 2. 텍스트 박스 생성
        let $container = $('<div id="typewriter-box"></div>').appendTo(this.output);
        
        // 3. 변수 초기화
        let lineIndex = 0;      
        let charIndex = 0;      
        let currentText = "";   
        let timerId = null;     
        let isTyping = false;   
        let $currentLineObj = null;

        // 4. 한 글자씩 출력하는 함수
        function typeNextChar() {
            if (charIndex < currentText.length) {
                $currentLineObj.text(currentText.substring(0, charIndex + 1));
                charIndex++;
            } else {
                stopTyping(); // 문장 끝까지 다 쳤으면 종료
            }
        }

        // 5. 새로운 줄 타이핑 시작 함수
        function startTypingLine() {
            // 이전 텍스트 지우기 (한 줄 교체 방식)
            $container.empty();

            isTyping = true;
            currentText = lines[lineIndex].trim();
            charIndex = 0;
            
            // 텍스트 들어갈 태그 생성
            $currentLineObj = $('<div class="typing-line"></div>').appendTo($container);

            // 타이핑 시작
            timerId = setInterval(typeNextChar, 30);
        }

        // 6. 타이핑 종료 함수 (붓 아이콘 표시 & 인덱스 증가)
        function stopTyping() {
            if (timerId) clearInterval(timerId);
            isTyping = false;
            
            // 텍스트 완성
            $currentLineObj.text(currentText);
            // 붓 아이콘 추가
            $currentLineObj.append('<span class="next-icon">🖌️</span>');
            
            lineIndex++; 
        }

        // 7. 클릭 핸들러
        const clickHandler = function (ev) {
          	if ($("#pause-screen").is(":visible")) return;
            // 링크나 버튼 클릭 시 무시
            if ($(ev.target).is('a, button, input, textarea, .ui-dialog-body')) return;

            // A. 타이핑 중일 때 -> 즉시 완성 (스킵)
            if (isTyping) {
                stopTyping();
                return;
            }

            // B. 타이핑이 끝난 상태일 때
            // 아직 보여줄 줄이 남았으면 -> 다음 줄 출력
            if (lineIndex < lines.length) {
                startTypingLine();
            } 
            // 더 이상 보여줄 줄이 없으면 -> 링크(#next-btn) 보여주기
            else {
                $(document).off('.vntext'); // 클릭 이벤트 제거
                
                // 숨겨진 링크 나타나기
                $('#next-btn').fadeIn();
            }
        };

        // 8. 초기 실행
        // 0.1초 뒤에 버튼 숨기고 첫 줄 시작
        setTimeout(() => {
            $('#next-btn').hide(); // 링크 숨김
            
            $(document).on('click.vntext keydown.vntext', clickHandler);
            startTypingLine(); // 첫 번째 줄 시작
        }, 100);

        // 9. 패시지 이동 시 정리
        $(document).one(':passageend', function () {
            $(document).off('.vntext');
            if (timerId) clearInterval(timerId);
        });
    }
});