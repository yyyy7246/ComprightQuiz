const quiz = new Quiz();
let nickname = "";
let imagePreloadPromise = null;

// DOM 요소
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const nicknameInput = document.getElementById("nickname");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const detailScreen = document.getElementById("detail-screen");
const showCorrectButton = document.getElementById("show-correct-button");
const showIncorrectButton = document.getElementById("show-incorrect-button");
const backToResultButton = document.getElementById("back-to-result");
const detailTitle = document.getElementById("detail-title");
const detailList = document.getElementById("detail-list");
const checkRankButton = document.getElementById("check-rank-button");
const rankingResult = document.getElementById("ranking-result");
const loadingIndicator = document.getElementById("loading-indicator");
const imagePreloader = document.getElementById("image-preloader");

const pageTypes = {
  'A': '개인정보 다운로드 페이지',
  'B': '개인정보 동의철회 페이지',
  'C': '개인정보 삭제 페이지',
  'D': '개인정보 열람 정정 페이지',
  'E': '개인정보 문의 페이지'
};

// 모든 가능한 이미지 경로 생성
function generateAllImagePaths() {
  const paths = [];
  quizData.upperGroups.forEach((upper) => {
    quizData.midGroups[upper].forEach((mid) => {
      quizData.levels.forEach((level) => {
        paths.push(`images/${upper}/${upper}${mid}${level}.png`);
      });
    });
  });
  return paths;
}

// 이미지 프리로딩 함수
function preloadImages() {
  if (imagePreloadPromise) {
    return imagePreloadPromise;
  }

  const imagePaths = generateAllImagePaths();
  const loadPromises = imagePaths.map((path) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(path);
      img.onerror = () => reject(path);
      img.src = path;
      imagePreloader.appendChild(img);
    });
  });

  imagePreloadPromise = Promise.allSettled(loadPromises);
  return imagePreloadPromise;
}

function showScreen(screenElement) {
  [startScreen, quizScreen, resultScreen, detailScreen].forEach((screen) => {
    screen.classList.add("hidden");
  });
  screenElement.classList.remove("hidden");
}

async function startQuiz() {
  nickname = nicknameInput.value.trim();
  if (!nickname) {
    alert("닉네임을 입력해주세요.");
    return;
  }

  // 로딩 인디케이터 표시
  loadingIndicator.classList.remove("hidden");
  startButton.disabled = true;

  try {
    // 이미지 프리로딩
    await preloadImages();

    quiz.generateQuestions();
    loadingIndicator.classList.add("hidden");
    showScreen(quizScreen);
    showQuestion();
  } catch (error) {
    console.error("이미지 로딩 중 오류 발생:", error);
    alert("이미지를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.");
    loadingIndicator.classList.add("hidden");
  } finally {
    startButton.disabled = false;
  }
}

// 모달 관련 DOM 요소 추가
const modal = document.createElement('div');
modal.className = 'modal hidden';
modal.innerHTML = `
  <div class="modal-content">
    <span class="close">&times;</span>
    <img src="" alt="확대된 이미지" />
  </div>
`;
document.body.appendChild(modal);

function showQuestion() {
    const question = quiz.getCurrentQuestion();
    document.getElementById("question-number").textContent = `${quiz.currentQuestionIndex + 1} / 10`;
    
    // 기존 페이지 타입 제거
    const existingPageType = document.querySelector('.page-type-display');
    if (existingPageType) {
        existingPageType.remove();
    }
    
    // 새로운 페이지 타입 추가
    const pageTypeDisplay = document.createElement('div');
    pageTypeDisplay.className = 'page-type-display';
    pageTypeDisplay.textContent = pageTypes[question.left.upper];
    document.querySelector('.quiz-header').appendChild(pageTypeDisplay);

    const leftImage = document.getElementById("left-image");
    const rightImage = document.getElementById("right-image");

    // 페이드인 효과 적용
    leftImage.classList.remove("loaded");
    rightImage.classList.remove("loaded");

    leftImage.src = `images/${question.left.upper}/${question.left.upper}${question.left.mid}${question.left.level}.png`;
    rightImage.src = `images/${question.right.upper}/${question.right.upper}${question.right.mid}${question.right.level}.png`;

    leftImage.onload = () => leftImage.classList.add("loaded");
    rightImage.onload = () => rightImage.classList.add("loaded");

    // 이미지 클릭 시 모달 표시 (유지)
    [leftImage, rightImage].forEach(img => {
        img.onclick = function() {
            const modalImg = modal.querySelector('img');
            modalImg.src = this.src;
            modal.classList.remove('hidden');
        };
    });
}

// 모달 닫기 이벤트
const closeBtn = modal.querySelector('.close');
closeBtn.onclick = function() {
  modal.classList.add('hidden');
};

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
  if (event.target === modal) {
    modal.classList.add('hidden');
  }
};

function selectAnswer(selected) {
  const isFinished = quiz.selectAnswer(selected);
  if (isFinished) {
    showResults();
  } else {
    showQuestion();
  }
}

function showResults() {
  showScreen(resultScreen);
  const results = quiz.getResults();

  document.getElementById("results").innerHTML = `
        <div class="result-header">
            <h3>${nickname}님의 결과</h3>
            <div class="score-summary">
                <p>정답: ${results.correct.length}개 </p>
                <p>오답: ${results.incorrect.length}개 </p>
            </div>
        </div>
        <div class="result-details">
            <div class="answer-section correct-section">
                <h4>정답 목록:</h4>
                ${formatAnswers(results.correct)}
            </div>
            <div class="answer-section incorrect-section">
                <h4>오답 목록:</h4>
                ${formatAnswers(results.incorrect)}
            </div>
        </div>
    `;

  rankingResult.classList.remove("rendered");
  rankingResult.classList.add("hidden");
  rankingResult.innerHTML = "";
  checkRankButton.disabled = false;
  checkRankButton.textContent = "순위 확인하기";
}

function formatAnswers(answers) {
  return answers
    .map(
      (item) =>
        `<div class="question-content">
                    <p>${item.currentQuestionIndex + 1}번 문제 : ${pageTypes[item.left.upper]}</p>
                </div>`
    )
    .join("");
}

function showDetailScreen(type) {
  const results = quiz.getResults();
  const items = type === "correct" ? results.correct : results.incorrect;

  detailTitle.textContent = type === "correct" ? "정답 문제 목록" : "오답 문제 목록";

  detailList.innerHTML = items
    .map(
      (item) => `
                <div class="detail-item">
                    <div class="detail-content">
                        <h4>${item.currentQuestionIndex + 1}번 문제</h4>
                        <p>${pageTypes[item.left.upper]}</p>
                        <div class="detail-images">
                            <div>
                                <img class="detail-image loaded" src="images/${item.left.upper}/${item.left.upper}${item.left.mid}${item.left.level}.png" 
                                    alt="왼쪽 이미지">
                            </div>
                            <div>
                                <img class="detail-image loaded" src="images/${item.right.upper}/${item.right.upper}${item.right.mid}${item.right.level}.png" 
                                    alt="오른쪽 이미지">
                            </div>
                        </div>
                        <p>정답: ${item.correct === "left" ? "왼쪽" : "오른쪽"}</p>
                    </div>
                </div>
            `
    )
    .join("");

  showScreen(detailScreen);
}

async function submitResult() {
  if (checkRankButton.disabled) {
    return;
  }

  checkRankButton.disabled = true;
  checkRankButton.textContent = "순위 확인 중...(최대 20초 소요)";

  const results = quiz.getResults();
  const data = {
    nickname: nickname,
    correct_count: results.correct.length,
    timestamp: Date.now(),
  };

  try {
    const response = await fetch("https://shiny-resonance-4d3a.yyyy7246.workers.dev", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("순위 확인 중 오류가 발생했습니다.");
    }

    const rankData = await response.json();

    rankingResult.classList.add("rendered");
    rankingResult.innerHTML = `
            <div class="ranking-info">
                <h3>순위 정보</h3>
                <p class="percentile">상위 ${rankData.percentile.toFixed(1)}%의 성적입니다!</p>
                <div class="top-rankers">
                    <h4>상위 10명</h4>
                    <div class="ranking-list">
                        ${rankData.topTen
                          .map(
                            (player, index) => `
                                <div class="rank-item">
                                    <div class="rank-number">${index + 1}위</div>
                                    <div class="rank-content">${player.nickname} - ${player.correct_count}개</div>
                                </div>
                            `
                          )
                          .join("")}
                    </div>
                </div>
            </div>
        `;

    rankingResult.classList.remove("hidden");
    checkRankButton.textContent = "순위 확인 완료";
  } catch (error) {
    checkRankButton.disabled = false;
    checkRankButton.textContent = "순위 확인하기";
    rankingResult.classList.remove("rendered");
    alert("순위 확인 중 오류가 발생했습니다. 다시 시도해주세요.");
    console.error("Error:", error);
  }
}

function restartQuiz() {
  quiz.reset();
  showScreen(startScreen);
  nicknameInput.value = "";
}

// 페이지 로드 시 바로 이미지 프리로딩 시작
window.addEventListener("load", () => {
  preloadImages().catch((error) => {
    console.error("Initial image preloading failed:", error);
  });
});

// 이벤트 리스너
document.addEventListener("DOMContentLoaded", () => {
  startButton.addEventListener("click", startQuiz);
  restartButton.addEventListener("click", restartQuiz);
  showCorrectButton.addEventListener("click", () => showDetailScreen("correct"));
  showIncorrectButton.addEventListener("click", () => showDetailScreen("incorrect"));
  backToResultButton.addEventListener("click", () => showScreen(resultScreen));
  checkRankButton.addEventListener("click", submitResult);
});
