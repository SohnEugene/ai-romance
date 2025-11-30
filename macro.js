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
            $(document).on('click.vntext keydown.vntext', clickHandler);
            startTypingLine(); 
        }, 100);

        $(document).one(':passageend', function () {
            $(document).off('.vntext');
            if (timerId) clearInterval(timerId);
        });
    }
});