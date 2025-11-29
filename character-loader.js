// 캐릭터 이미지 로더

// 캐릭터 약자 목록
const characters = ['cg', 'mn', 'ry'];

// passage가 표시된 후 실행 (DOM에 완전히 추가된 후)
$(document).on(':passagedisplay', function (ev) {
    
    // [수정] DOM에서 읽지 않고, 엔진이 주는 passage 객체에서 태그 배열을 직접 가져옵니다.
    // 태그가 없으면 빈 배열 []을 반환하므로 에러가 나지 않습니다.
    const passageTags = ev.passage.tags || [];

    // 캐릭터와 번호 찾기
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

    // 기존 캐릭터 이미지 제거
    $('#character-image').remove();

    // 이미지 파일 로딩
    if (character && imageNumber) {
        const imagePath = `assets/${character}/${imageNumber}.png`;
        const img = $('<img>')
            .attr('id', 'character-image')
            .attr('src', imagePath)
            .attr('alt', `${character} ${imageNumber}`)
            .on('error', function() {
                console.log('이미지 로드 실패:', imagePath);
                $(this).remove(); // 이미지 파일이 없으면 엑박 뜨지 않게 제거
            });
        $('body').append(img);
    } else {
        console.log('Character or image number missing. Character:', character, 'Number:', imageNumber);
    }
});
