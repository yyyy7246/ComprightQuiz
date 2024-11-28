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
        `images/${question.left.upper}/${question.left.upper}${question.left.mid}${question.left.level}.jpg`;
    document.getElementById('right-image').src = 
        `images/${question.right.upper}/${question.right.upper}${question.right.mid}${question.right.level}.jpg`;
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
        <h3>${nickname}님의 결과</h3>
        <p>정답: ${results.correct.length}개 / 10개</p>
        <p>오답: ${results.incorrect.length}개 / 10개</p>
        <div class="result-details">
            <h4>정답 목록:</h4>
            ${formatAnswers(results.correct)}
            <h4>오답 목록:</h4>
            ${formatAnswers(results.incorrect)}
        </div>
    `;

    // 순위 결과 초기화
    rankingResult.classList.remove('rendered'); // rendered 클래스 제거 추가
    rankingResult.classList.add('hidden');
    rankingResult.innerHTML = '';
    checkRankButton.disabled = false;
    checkRankButton.textContent = '순위 확인하기';
}

function formatAnswers(answers) {
    return answers.map(q => 
        `<div class="result-item">
            ${q.left.upper}${q.left.mid}${q.left.level} vs 
            ${q.right.upper}${q.right.mid}${q.right.level}
        </div>`
    ).join('');
}


function showDetailScreen(type) {
    const results = quiz.getResults();
    const items = type === 'correct' ? results.correct : results.incorrect;
    
    detailTitle.textContent = type === 'correct' ? '정답 문제 목록' : '오답 문제 목록';
    
    detailList.innerHTML = items.map((item, index) => `
        <div class="detail-item">
            <div class="detail-content">
                <h4>${index + 1}번 문제</h4>
                <div class="detail-images">
                    <div>
                        <p>왼쪽 이미지</p>
                        <img class="detail-image" src="images/${item.left.upper}/${item.left.upper}${item.left.mid}${item.left.level}.jpg" 
                            alt="왼쪽 이미지">
                        <p>${item.left.upper}${item.left.mid}${item.left.level}</p>
                    </div>
                    <div>
                        <p>오른쪽 이미지</p>
                        <img class="detail-image" src="images/${item.right.upper}/${item.right.upper}${item.right.mid}${item.right.level}.jpg" 
                            alt="오른쪽 이미지">
                        <p>${item.right.upper}${item.right.mid}${item.right.level}</p>
                    </div>
                </div>
                <p>정답: ${item.correct === 'left' ? '왼쪽' : '오른쪽'}</p>
            </div>
        </div>
    `).join('');
    
    showScreen(detailScreen);
}

async function submitResult() {
    // 이미 제출되었거나 렌더링된 경우 즉시 반환
    if (checkRankButton.disabled || rankingResult.classList.contains('rendered')) {
        return;
    }
    
    // 입력 유효성 검사 추가
    if (!nickname || !results) {
        alert('닉네임과 퀴즈 결과가 필요합니다.');
        return;
    }
    
    // 버튼과 렌더링 상태 즉시 설정
    checkRankButton.disabled = true;
    checkRankButton.textContent = '순위 확인 중...';

    const results = quiz.getResults();
    const data = {
        nickname: nickname.trim(),
        correct_count: results.correct.length,
        timestamp: Date.now(),
        total_questions: 10,  // 전체 문제 수 추가
        incorrect_count: results.incorrect.length  // 오답 수 추가
    };

    try {
        const response = await fetch('https://shiny-resonance-4d3a.yyyy7246.workers.dev', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'  // 캐시 방지
            },
            body: JSON.stringify(data),
            cache: 'no-store'  // 중복 요청 방지
        });

        if (!response.ok) {
            throw new Error(`서버 오류: ${response.status}`);
        }

        const rankData = await response.json();
        
        // 데이터 유효성 검사
        if (!rankData || !rankData.topTen || !rankData.percentile) {
            throw new Error('서버에서 올바른 데이터를 받지 못했습니다.');
        }

        // 결과 표시 전에 rendered 클래스 추가
        if (!rankingResult.classList.contains('rendered')) {
            rankingResult.innerHTML = `
                <div class="ranking-info">
                    <h3>순위 정보</h3>
                    <p>상위 ${rankData.percentile.toFixed(1)}%의 성적입니다!</p>
                    <p>총 ${results.correct.length}문제 맞추셨습니다. (${results.correct.length * 10}%)</p>
                    <div class="top-rankers">
                        <h4>상위 10명</h4>
                        <ol>
                            ${rankData.topTen.length > 0 ? 
                                rankData.topTen.map((player, index) => 
                                    `<li>${index + 1}위: ${player.nickname} - ${player.correct_count}점 
                                     (${new Date(player.timestamp).toLocaleString()})</li>`
                                ).join('') :
                                '<li>아직 등록된 참가자가 없습니다.</li>'
                            }
                            ${Array(Math.max(0, 10 - rankData.topTen.length)).fill()
                                .map((_, index) => `<li>${rankData.topTen.length + index + 1}위: -</li>`).join('')}
                        </ol>
                    </div>
                </div>
            `;
            rankingResult.classList.add('rendered');
        }
        
        rankingResult.classList.remove('hidden');
        checkRankButton.textContent = '순위 확인 완료';

        // 로컬 스토리지에 결과 저장
        try {
            localStorage.setItem('lastQuizResult', JSON.stringify({
                nickname: nickname,
                score: results.correct.length,
                timestamp: Date.now()
            }));
        } catch (storageError) {
            console.error('결과 저장 실패:', storageError);
        }

    } catch (error) {
        // 에러 발생 시 상태 초기화
        checkRankButton.disabled = false;
        checkRankButton.textContent = '순위 확인하기';
        rankingResult.classList.remove('rendered');
        alert(`순위 확인 중 오류가 발생했습니다: ${error.message}`);
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