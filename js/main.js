const quiz = new Quiz();
let nickname = '';

// DOM 요소
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const nicknameInput = document.getElementById('nickname');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const detailScreen = document.getElementById('detail-screen');
const showCorrectButton = document.getElementById('show-correct-button');
const showIncorrectButton = document.getElementById('show-incorrect-button');
const backToResultButton = document.getElementById('back-to-result');
const detailTitle = document.getElementById('detail-title');
const detailList = document.getElementById('detail-list');
const checkRankButton = document.getElementById('check-rank-button');
const rankingResult = document.getElementById('ranking-result');

const pageTypes = {
    'A': '개인정보 조회 페이지',
    'B': '개인정보 다운로드 페이지',
    'C': '개인정보 옵트아웃 페이지',
    'D': '개인정보 삭제 페이지',
    'E': '개인정보 수정 페이지'
};


function showScreen(screenElement) {
    [startScreen, quizScreen, resultScreen, detailScreen].forEach(screen => {
        screen.classList.add('hidden');
    });
    screenElement.classList.remove('hidden');
}

function startQuiz() {
    nickname = nicknameInput.value.trim();
    if (!nickname) {
        alert('닉네임을 입력해주세요.');
        return;
    }
    
    quiz.generateQuestions();
    showScreen(quizScreen);
    showQuestion();
}

function showQuestion() {
    const question = quiz.getCurrentQuestion();
    document.getElementById('question-number').textContent = quiz.currentQuestionIndex + 1;
    
    document.getElementById('left-image').src = 
        `images/${question.left.upper}/${question.left.upper}${question.left.mid}${question.left.level}.jpeg`;
    document.getElementById('right-image').src = 
        `images/${question.right.upper}/${question.right.upper}${question.right.mid}${question.right.level}.jpeg`;
}

function selectAnswer(selected) {
    const isFinished = quiz.selectAnswer(selected);
    if (isFinished) {
        showResults();
    } else {
        showQuestion();
    }
}

// showResults 함수도 수정
function showResults() {
    showScreen(resultScreen);
    const results = quiz.getResults();
    
    document.getElementById('results').innerHTML = `
        <div class="result-header">
            <h3>${nickname}님의 결과</h3>
            <div class="score-summary">
                <p>정답: ${results.correct.length}개 / 10개</p>
                <p>오답: ${results.incorrect.length}개 / 10개</p>
            </div>
        </div>
        <div class="result-details">
            <div class="answer-section correct-section">
                <h4>정답 목록:</h4>
                ${formatAnswers(results.correct, quiz.currentQuestionIndex)}
            </div>
            <div class="answer-section incorrect-section">
                <h4>오답 목록:</h4>
                ${formatAnswers(results.incorrect, quiz.currentQuestionIndex)}
            </div>
        </div>
    `;

    rankingResult.classList.remove('rendered');
    rankingResult.classList.add('hidden');
    rankingResult.innerHTML = '';
    checkRankButton.disabled = false;
    checkRankButton.textContent = '순위 확인하기';
}

function formatAnswers(answers) {
    return answers.map((item) => 
        `<div class="question-content">
            <p>${item.currentQuestionIndex + 1}번 문제 : ${pageTypes[item.left.upper]}</p>
        </div>`
    ).join('');
}

function showDetailScreen(type) {
    const results = quiz.getResults();
    const items = type === 'correct' ? results.correct : results.incorrect;
    
    detailTitle.textContent = type === 'correct' ? '정답 문제 목록' : '오답 문제 목록';
    
    detailList.innerHTML = items.map((item) => `
        <div class="detail-item">
            <div class="detail-content">
                <h4>${item.currentQuestionIndex + 1}번 문제</h4>
                <p>${pageTypes[item.left.upper]}</p>
                <div class="detail-images">
                    <div>
                        <img class="detail-image" src="images/${item.left.upper}/${item.left.upper}${item.left.mid}${item.left.level}.jpeg" 
                            alt="왼쪽 이미지">
                    </div>
                    <div>
                        <img class="detail-image" src="images/${item.right.upper}/${item.right.upper}${item.right.mid}${item.right.level}.jpeg" 
                            alt="오른쪽 이미지">
                    </div>
                </div>
                <p>정답: ${item.correct === 'left' ? '왼쪽' : '오른쪽'}</p>
            </div>
        </div>
    `).join('');
    
    showScreen(detailScreen);
}

async function submitResult() {
    if (checkRankButton.disabled) {
        return;
    }
    
    checkRankButton.disabled = true;
    checkRankButton.textContent = '순위 확인 중...';

    const results = quiz.getResults();
    const data = {
        nickname: nickname,
        correct_count: results.correct.length,
        timestamp: Date.now()
    };

    try {
        const response = await fetch('https://shiny-resonance-4d3a.yyyy7246.workers.dev', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('순위 확인 중 오류가 발생했습니다.');
        }

        const rankData = await response.json();
        
        // 데이터를 받은 후에 rendered 클래스 추가
        rankingResult.classList.add('rendered');
        rankingResult.innerHTML = `
            <div class="ranking-info">
                <h3>순위 정보</h3>
                <p>상위 ${rankData.percentile.toFixed(1)}%의 성적입니다!</p>
                <div class="top-rankers">
                    <h4>상위 10명</h4>
                    <ol>
                        ${rankData.topTen.length > 0 ? 
                            rankData.topTen.map((player, index) => 
                                `<li>${index + 1}위: ${player.nickname} - ${player.correct_count}점</li>`
                            ).join('') :
                            '<li>아직 등록된 참가자가 없습니다.</li>'
                        }
                        ${Array(Math.max(0, 10 - rankData.topTen.length)).fill()
                            .map((_, index) => `<li>${rankData.topTen.length + index + 1}위: -</li>`).join('')}
                    </ol>
                </div>
            </div>
        `;
        
        rankingResult.classList.remove('hidden');
        checkRankButton.textContent = '순위 확인 완료';

    } catch (error) {
        checkRankButton.disabled = false;
        checkRankButton.textContent = '순위 확인하기';
        rankingResult.classList.remove('rendered');
        alert('순위 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
        console.error('Error:', error);
    }
}



function restartQuiz() {
    quiz.reset();
    showScreen(startScreen);
    nicknameInput.value = '';
}

// 이벤트 리스너 수정
document.addEventListener('DOMContentLoaded', () => {
    startButton.addEventListener('click', startQuiz);
    restartButton.addEventListener('click', restartQuiz);
    showCorrectButton.addEventListener('click', () => showDetailScreen('correct'));
    showIncorrectButton.addEventListener('click', () => showDetailScreen('incorrect'));
    backToResultButton.addEventListener('click', () => showScreen(resultScreen));
    checkRankButton.addEventListener('click', submitResult);
});