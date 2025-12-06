
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


$(document).on(":passagedisplay", function() {
    var $sidebar = $("#right-sidebar");
    var $pause = $("#pause-screen");

    // 사이드바가 존재한다면 body의 직계 자식으로 이동 (패시지 밖으로 꺼냄)
    if ($sidebar.length > 0) {
        $sidebar.appendTo("body");
    }
    
    // 일시정지 메뉴도 안전하게 body로 이동
    if ($pause.length > 0) {
        $pause.appendTo("body");
    }
});

$(document).on(":passagedisplay", function(ev) {
    // 1. 현재 패시지가 'bad_ending' 태그를 가지고 있는지 확인
    if (ev.passage.tags.includes("bad_ending")) {
        
        let lastBgTag = null;

        // 2. 과거 히스토리(기록)를 거슬러 올라가며 배경 태그 찾기
        // State.history는 플레이어가 거쳐온 경로를 담고 있습니다.
        // 맨 뒤(최근)부터 0번(처음)까지 역순으로 탐색합니다.
        for (let i = SugarCube.State.history.length - 1; i >= 0; i--) {
            let turn = SugarCube.State.history[i];
            let passage = SugarCube.Story.get(turn.title);

            if (passage && passage.tags) {
                // 태그 중에 'bg'로 시작하는 것(예: bg1, bg_park)을 찾습니다.
                let found = passage.tags.find(tag => tag.startsWith("bg"));
                if (found) {
                    lastBgTag = found;
                    break; // 찾았으면 탐색 중단
                }
            }
        }

        // 3. 찾은 배경 태그를 현재 패시지(HTML)에 강제로 주입
        if (lastBgTag) {
            // 현재 화면에 떠 있는 .passage 요소의 data-tags 속성에 배경 태그를 추가
            // 이렇게 하면 CSS의 body:has(...) 선택자가 반응하여 배경을 바꿔줍니다.
            $("#passages .passage").attr("data-tags", function(i, val) {
                // 기존 태그 뒤에 공백을 두고 붙임
                return val + " " + lastBgTag;
            });
            
            console.log("배경 계승됨:", lastBgTag); // 확인용 로그
        }
    }
});

/* ui.js - 맨 아래에 추가 */

// 8. Restart (처음부터 다시하기) 버튼 로직
$(document).off("click", "#btn-restart").on("click", "#btn-restart", function() {
    // 1. 확인 창 띄우기 (브라우저 기본 기능 사용)
    var isConfirmed = confirm("정말로 다시 시작하시겠습니까?\n\n❗주의: 저장된 모든 데이터가 삭제됩니다");

    if (isConfirmed) {
        // 2. '예'를 눌렀을 때
        
        // A. 모든 세이브 슬롯 삭제 (요청사항 반영)
        SugarCube.Save.browser.clear(); 
        
        // B. 게임 엔진 리스타트 (변수 초기화 및 첫 페이지로 이동)
        SugarCube.Engine.restart();
        
        // C. 메뉴 닫기 (리스타트 되면 자동으로 닫히지만 안전장치)
        window.togglePauseMenu();
        
    }
});