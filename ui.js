
SugarCube.Config.saves.slots = 5;
SugarCube.Config.saves.autosave = false; 

window.selectedSlotIndex = null;

window.togglePauseMenu = function() {
    var $screen = $("#pause-screen");
    var $story = $("#story");
    
    if ($screen.is(":visible")) {
        $screen.fadeOut(200);
        $story.removeClass("paused");
        window.selectedSlotIndex = null; 
    } else {
        $screen.fadeIn(200).css("display", "flex");
        $story.addClass("paused");
        renderSlots(); 
        $("#pause-message").text(""); 
    }
};

window.renderSlots = function() {
    var $container = $("#save-slots-container");
    $container.empty();

    for (var i = 0; i < 5; i++) {
        // [수정] Save -> SugarCube.Save
        var hasData = SugarCube.Save.browser.slot.has(i);
        var info = hasData ? SugarCube.Save.browser.slot.get(i) : null;
        
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

// 저장하기 버튼
$(document).off("click", "#btn-save").on("click", "#btn-save", function() {
    var emptySlot = -1;
    for (var i = 0; i < 5; i++) {
        // [수정] SugarCube.Save
        if (!SugarCube.Save.browser.slot.has(i)) {
            emptySlot = i;
            break;
        }
    }

    if (emptySlot !== -1) {
        // [수정] SugarCube.Save, SugarCube.State
        SugarCube.Save.browser.slot.save(emptySlot, SugarCube.State.passage);
        renderSlots();
        $("#pause-message").text("빈 슬롯(" + (emptySlot + 1) + "번)에 저장되었습니다!");
        setTimeout(function(){ window.togglePauseMenu(); }, 800);
    } else {
        if (window.selectedSlotIndex !== null) {
            SugarCube.Save.browser.slot.save(window.selectedSlotIndex, SugarCube.State.passage);
            renderSlots();
            $("#pause-message").text((window.selectedSlotIndex + 1) + "번 슬롯에 덮어썼습니다!");
            setTimeout(function(){ window.togglePauseMenu(); }, 800);
        } else {
            $("#pause-message").text("빈 슬롯이 없습니다. 덮어쓸 슬롯을 선택해주세요.");
        }
    }
});

// 불러오기 버튼
$(document).off("click", "#btn-load").on("click", "#btn-load", function() {
    if (window.selectedSlotIndex !== null) {
        // [수정] SugarCube.Save
        if (SugarCube.Save.browser.slot.has(window.selectedSlotIndex)) {
            try {
                SugarCube.Save.browser.slot.load(window.selectedSlotIndex)
                    .then(function() {
                        console.log("로드 성공!");
                        $("#pause-screen").hide();
                        // [수정] SugarCube.Engine
                        SugarCube.Engine.show(); 
                    })
                    .catch(function(err) {
                        console.error("로드 실패:", err);
                        $("#pause-message").text("로드 중 오류가 발생했습니다.");
                    });
            } catch (e) {
                console.error("오류:", e);
            }
        } else {
            $("#pause-message").text("비어있는 슬롯입니다.");
        }
    } else {
        $("#pause-message").text("불러올 슬롯을 먼저 선택해주세요.");
    }
});

// ESC 키
$(document).on("keyup", function(ev) {
    if (ev.key === "Escape") {
        // tags() 함수도 SugarCube 내부 함수이므로 window.tags 가 아니면 접근이 안될 수 있음.
        // 안전하게 jQuery로 body 태그 확인
        if ($('body').attr('data-tags') && $('body').attr('data-tags').includes("title_screen")) return; 
        
        window.togglePauseMenu();
    }
});