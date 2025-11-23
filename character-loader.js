// 캐릭터 이미지 로더

// 캐릭터 약자 목록
const characters = ['cg', 'mn', 'ry'];

// passage가 표시된 후 실행 (DOM에 완전히 추가된 후)
$(document).on(':passagedisplay', function (ev) {
    console.log('Passage display event triggered');

    // 현재 passage의 태그 가져오기 (DOM에서 직접 읽기)
    const passageElement = $('.passage');
    const tagsAttr = passageElement.attr('data-tags');
    console.log('Tags attribute found:', tagsAttr);

    if (!tagsAttr) {
        console.log('No tags found');
        return;
    }

    const passageTags = tagsAttr.split(' ');
    console.log('Tags array:', passageTags);

    // 캐릭터와 번호 찾기
    let character = null;
    let imageNumber = null;

    passageTags.forEach(tag => {
        // 캐릭터 태그 찾기
        if (characters.includes(tag)) {
            character = tag;
            console.log('Character found:', character);
        }
        // 숫자 태그 찾기
        if (/^\d+$/.test(tag)) {
            imageNumber = tag;
            console.log('Image number found:', imageNumber);
        }
    });

    // 기존 캐릭터 이미지 제거
    $('#character-image').remove();

    // 캐릭터와 번호가 모두 있으면 이미지 표시
    if (character && imageNumber) {
        const imagePath = `assets/${character}/${imageNumber}.png`;
        console.log('Loading image:', imagePath);

        // 이미지 요소 생성
        const img = $('<img>')
            .attr('id', 'character-image')
            .attr('src', imagePath)
            .attr('alt', `${character} ${imageNumber}`)
            .on('load', function() {
                console.log('Image loaded successfully:', imagePath);
            })
            .on('error', function() {
                console.error('Failed to load image:', imagePath);
            });

        // body에 이미지 추가
        $('body').append(img);
    } else {
        console.log('Character or image number missing. Character:', character, 'Number:', imageNumber);
    }
});
