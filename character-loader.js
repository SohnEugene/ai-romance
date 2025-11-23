// 캐릭터 이미지 로더

// 캐릭터 약자 목록
const characters = ['cg', 'mn', 'ry'];

// passage가 표시된 후 실행 (DOM에 완전히 추가된 후)
$(document).on(':passagedisplay', function (ev) {
    
    // 현재 passage의 태그 가져오기 (DOM에서 직접 읽기)
    const passageElement = $('.passage');
    const tagsAttr = passageElement.attr('data-tags');
    const passageTags = tagsAttr.split(' ');

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
        $('body').append(img);
    } else {
        console.log('Character or image number missing. Character:', character, 'Number:', imageNumber);
    }
});
