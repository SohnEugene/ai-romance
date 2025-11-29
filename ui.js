/* Save & Load 기능 */

// 1. 세이브 슬롯 개수 설정
Config.saves.slots = 5;
Config.saves.autosave = false; 

// 2. 글로벌 변수
window.selectedSlotIndex = null;

// 3. 메뉴 열기/닫기 함수
window.togglePauseMenu = function() {
    var $screen = $("#pause-screen");
    var $story = $("#story"); // 게임 화면 컨테이너
    
    if ($screen.is(":visible")) {
        // [닫기]
        $screen.fadeOut(200);
        $story.removeClass("paused"); // 클릭 차단 해제 & 블러 제거
        window.selectedSlotIndex = null; 
    } else {
        // [열기]
        $screen.fadeIn(200).css("display", "flex");
        $story.addClass("paused"); // 클릭 차단 & 블러 효과
        renderSlots(); 
        $("#pause-message").text(""); 
    }
};

// 4. 슬롯 그리기 함수
window.renderSlots = function() {
    var $container = $("#save-slots-container");
    $container.empty();

    for (var i = 0; i < 5; i++) {
        var hasData = Save.browser.slot.has(i);
        var info = hasData ? Save.browser.slot.get(i) : null;
        
        var $slot = $('<div class="save-slot"></div>');
        $slot.attr('data-index', i);
        
        if (window.selectedSlotIndex === i) {
            $slot.addClass('selected');
        }

        var html = '<div class="slot-id">SLOT ' + (i + 1) + '</div>';
        if (hasData) {
            var date = new Date(info.date);
            var dateStr = (date.getMonth()+1) + "/" + date.getDate() + " " + 
                          date.getHours() + ":" + String(date.getMinutes()).padStart(2, '0');
            html += '<div class="slot-info">' + info.title + '<br>' + dateStr + '</div>';
        } else {
            html += '<div class="slot-empty">Empty</div>';
        }
        
        $slot.html(html);
        
        $slot.on('click', function() {
            var idx = Number($(this).attr('data-index'));
            window.selectedSlotIndex = idx;
            renderSlots(); 
            $("#pause-message").text("슬롯 " + (idx + 1) + "번이 선택되었습니다.");
        });

        $container.append($slot);
    }
};

// 5. 저장하기 버튼 로직
$(document).off("click", "#btn-save").on("click", "#btn-save", function() {
    var emptySlot = -1;
    for (var i = 0; i < 5; i++) {
        if (!Save.browser.slot.has(i)) {
            emptySlot = i;
            break;
        }
    }

    if (emptySlot !== -1) {
        Save.browser.slot.save(emptySlot, State.passage);
        renderSlots();
        $("#pause-message").text("빈 슬롯(" + (emptySlot + 1) + "번)에 저장되었습니다!");
        setTimeout(function(){ window.togglePauseMenu(); }, 800);
    } else {
        if (window.selectedSlotIndex !== null) {
            Save.browser.slot.save(window.selectedSlotIndex, State.passage);
            renderSlots();
            $("#pause-message").text((window.selectedSlotIndex + 1) + "번 슬롯에 덮어썼습니다!");
            setTimeout(function(){ window.togglePauseMenu(); }, 800);
        } else {
            $("#pause-message").text("빈 슬롯이 없습니다. 덮어쓸 슬롯을 선택해주세요.");
        }
    }
});

// 6. 불러오기 버튼 로직
$(document).off("click", "#btn-load").on("click", "#btn-load", function() {
    console.log("불러오기 시도. 선택된 슬롯:", window.selectedSlotIndex);

    if (window.selectedSlotIndex !== null) {
        if (Save.browser.slot.has(window.selectedSlotIndex)) {
            try {
                Save.browser.slot.load(window.selectedSlotIndex)
                    .then(function() {
    console.log("로드 성공!");
    $("#pause-screen").hide(); // 메뉴 닫기
    
    //현재 로드된 상태(State)에 맞춰 화면을 다시 그립니다.
    Engine.show(); 
})
                    .catch(function(err) {
                        console.error("로드 실패:", err);
                        $("#pause-message").text("로드 중 오류가 발생했습니다.");
                    });
            } catch (e) {
                console.error("치명적 오류:", e);
            }
        } else {
            $("#pause-message").text("비어있는 슬롯입니다.");
        }
    } else {
        $("#pause-message").text("불러올 슬롯을 먼저 선택해주세요.");
    }
});

// 7. ESC 키 이벤트
$(document).on("keyup", function(ev) {
    if (ev.key === "Escape") {
        if (tags().includes("title_screen")) return; 
        window.togglePauseMenu();
    }
});