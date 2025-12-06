/* character-loader.js - 캐릭터 이미지 로더 (All 태그 기능 추가됨) */

// 캐릭터 약자 목록
const characters = ['cg', 'mn', 'ry'];

$(document).on(':passagedisplay', function (ev) {
    const passageTags = ev.passage.tags || [];
    const vars = SugarCube.State.variables; // SugarCube 변수 가져오기

    // ----------------------------------------------------
    // [CASE 1] "all" 태그가 있는 경우 (3인 집합)
    // ----------------------------------------------------
    if (passageTags.includes('all')) {
        // 기존 싱글 이미지 제거
        $('#character-image').remove();
        // 기존 그룹 컨테이너 제거 (중복 방지)
        $('#all-chars-container').remove();

        // 새 컨테이너 생성
        const $container = $('<div id="all-chars-container"></div>');

        // 1. 미나 (mn) 체크
        if (vars.minaExit !== true) { // false이거나 설정 안됐을 때 출력
            $container.append('<img src="assets/mn/1.png" class="char-sprite-group" alt="미나">');
        }

        // 2. 채진 (cg) 체크
        if (vars.chaejinExit !== true) {
            $container.append('<img src="assets/cg/1.png" class="char-sprite-group" alt="채진">');
        }

        // 3. 클라라 (ry) 체크
        if (vars.claraExit !== true) {
            $container.append('<img src="assets/ry/1.png" class="char-sprite-group" alt="클라라">');
        }

        // body에 추가
        $('body').append($container);
    } 
    
    // ----------------------------------------------------
    // [CASE 2] "all" 태그가 없는 경우 (기존 로직: 1명만 표시)
    // ----------------------------------------------------
    else {
        // 그룹 컨테이너 제거
        $('#all-chars-container').remove();

        // 기존 로직: 캐릭터 1명 찾기
        let character = null;
        let imageNumber = null;

        passageTags.forEach(tag => {
            if (characters.includes(tag)) {
                character = tag;
            }
            if (/^\d+$/.test(tag)) {
                imageNumber = tag;
            }
        });

        // 기존 싱글 이미지 제거 및 새로 그리기
        $('#character-image').remove();

        if (character && imageNumber) {
            const imagePath = `assets/${character}/${imageNumber}.png`;
            const img = $('<img>')
                .attr('id', 'character-image')
                .attr('src', imagePath)
                .attr('alt', `${character} ${imageNumber}`)
                .on('error', function() {
                    console.log('이미지 로드 실패:', imagePath);
                    $(this).remove(); 
                });
            $('body').append(img);
        }
    }
});