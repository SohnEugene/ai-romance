/* ===========================================================
   [시스템] 배경음악 & 효과음 관리 (audio.js) - 최종 수정본 (v3)
   =========================================================== */

// 1. 태그와 오디오 ID 매핑
const bgmMap = {
    "bgm_intro":   "bgm_intro",
    "bgm_main":    "bgm_main",
    "bgm_mina":    "bgm_mina",
    "bgm_chaejin": "bgm_chaejin",
    "bgm_clara":   "bgm_clara",
    
    // SFX는 여기서 BGM으로 처리되지 않도록 주의
    "sfx_car":     "sfx_car",
    "sfx_glitch":  "sfx_glitch"
};

// 2. 전역 변수 (상태 관리)
window.currentBgmId = null;   // 현재 재생 중(이어야 하는) BGM ID
window.bgmStopTimer = null;   // 페이드아웃 타이머

/* ===========================================================
   [함수] BGM 강제 재생 (핵심 로직)
   - 이 함수는 언제 호출되든 해당 트랙을 '즉시' 들리게 만듭니다.
   =========================================================== */
function forcePlayBgm(trackId) {
    if (!trackId) return;
    
    // 1. 만약 페이드아웃 중인 타이머가 있다면 즉시 제거 (소리 끊김 방지)
    if (window.bgmStopTimer) {
        clearTimeout(window.bgmStopTimer);
        window.bgmStopTimer = null;
    }

    let track = SugarCube.SimpleAudio.tracks.get(trackId);
    if (track) {
        // 2. 기존 효과 제거 및 초기화
        track.fadeStop(); // 페이드 중지
        track.loop(true); // 루프 설정
        track.volume(1);  // 볼륨 최대화 (혹시 0이었다면 복구)
        
        // 3. 재생 시도
        // (이미 재생 중이어도 play() 호출은 안전하며, 
        //  브라우저 정책으로 막힌 경우 풀리면 바로 재생되게 함)
        track.play(); 
        
        console.log(`[Audio] Playing: ${trackId}`);
    }
}

/* ===========================================================
   [이벤트 1] 사용자 클릭 시 오디오 엔진 깨우기 (타이틀 화면 해결)
   - suspended 상태가 아니더라도, 소리가 안 나고 있다면 강제 재생 시도
   =========================================================== */
$(document).on("click keydown", function() {
    // A. 오디오 컨텍스트가 잠겨있다면 풀기
    if (SugarCube.SimpleAudio.context && SugarCube.SimpleAudio.context.state !== "running") {
        SugarCube.SimpleAudio.context.resume().then(() => {
            console.log("[Audio] Context Resumed");
            checkAndPlayCurrentBgm();
        });
    } else {
        // B. 이미 실행 중이라면, 혹시 멈춰있는 BGM이 있는지 확인
        checkAndPlayCurrentBgm();
    }
});

// 현재 설정된 BGM이 있는데 안 들린다면 재생하는 도우미 함수
function checkAndPlayCurrentBgm() {
    // 1. 현재 재생 예정인 ID가 있다면 재생
    if (window.currentBgmId) {
        let track = SugarCube.SimpleAudio.tracks.get(window.currentBgmId);
        if (track && (track.isPaused() || track.volume() < 0.1)) {
            forcePlayBgm(window.currentBgmId);
        }
    } 
    // 2. ID가 없다면(첫 진입), 현재 화면 태그를 뒤져서라도 찾음
    else {
        let currentPassage = SugarCube.Story.get(SugarCube.State.passage);
        if (currentPassage && currentPassage.tags) {
            for (let tag of currentPassage.tags) {
                if (bgmMap[tag] && !tag.startsWith("sfx_")) {
                    window.currentBgmId = bgmMap[tag];
                    forcePlayBgm(window.currentBgmId);
                    break;
                }
            }
        }
    }
}

/* ===========================================================
   [이벤트 2] 패시지 전환 시 BGM 처리 (끊김/유지 해결)
   =========================================================== */
$(document).on(":passagedisplay", function(ev) {
    // 1. 예약된 정지 타이머 취소 (페이지 넘어가면 이전의 페이드아웃 취소)
    if (window.bgmStopTimer) {
        clearTimeout(window.bgmStopTimer);
        window.bgmStopTimer = null;
    }

    // 2. 태그 확인
    let tags = ev.passage.tags;
    let targetBgmId = null;

    for (let tag of tags) {
        if (bgmMap[tag] && !tag.startsWith("sfx_")) {
            targetBgmId = bgmMap[tag];
            break; 
        }
    }

    // 3. BGM 태그가 있는 경우
    if (targetBgmId) {
        // A. 다른 곡으로 바뀜 OR 이전에 소리가 꺼졌음 (null)
        if (window.currentBgmId !== targetBgmId) {
            
            // 기존 곡 끄기 (페이드 없이 즉시 정지 -> 새 곡 강조)
            if (window.currentBgmId) {
                let oldTrack = SugarCube.SimpleAudio.tracks.get(window.currentBgmId);
                if (oldTrack) oldTrack.stop();
            }

            // 새 곡 재생
            window.currentBgmId = targetBgmId;
            forcePlayBgm(targetBgmId);
        } 
        // B. 같은 곡임 (유지)
        else {
            // 같은 곡이라도 볼륨이 줄어있거나 멈춰있으면 복구
            forcePlayBgm(targetBgmId);
        }
    }
    // 4. 태그가 없는 경우 -> 아무것도 안 함 (이전 상태 유지)
});

/* ===========================================================
   [매크로] 효과음 재생 및 BGM 잠시 멈춤/줄임
   =========================================================== */
SugarCube.Macro.add("playsfx", {
    handler: function() {
        let sfxId = this.args[0];

        // 1. 효과음 재생
        if (sfxId) {
            let sfxTrack = SugarCube.SimpleAudio.tracks.get(sfxId);
            if (sfxTrack) {
                sfxTrack.volume(1);
                sfxTrack.play();
                console.log("[Audio] SFX:", sfxId);
            }
        }


        if (window.currentBgmId) {
            let bgmTrack = SugarCube.SimpleAudio.tracks.get(window.currentBgmId);
            if (bgmTrack) {
                bgmTrack.fade(0.5, 0); // 0.5초간 페이드 아웃
                
                // 타이머 설정 (완전히 끄기 위해)
                if (window.bgmStopTimer) clearTimeout(window.bgmStopTimer);
                window.bgmStopTimer = setTimeout(() => {
                    bgmTrack.stop();
                }, 500);
            }
            window.currentBgmId = null; 
        }
    }
});