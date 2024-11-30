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

function showQuestion() {
  const question = quiz.getCurrentQuestion();
  
  // 첫 번째 문제일 때만 안내 모달 표시
  if (quiz.currentQuestionIndex === 0) {
    showGuideModal();
  }
  
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

  leftImage.classList.remove("loaded");
  rightImage.classList.remove("loaded");

  leftImage.src = `images/${question.left.upper}/${question.left.upper}${question.left.mid}${question.left.level}.png`;
  rightImage.src = `images/${question.right.upper}/${question.right.upper}${question.right.mid}${question.right.level}.png`;

  leftImage.onload = () => leftImage.classList.add("loaded");
  rightImage.onload = () => rightImage.classList.add("loaded");

  [leftImage, rightImage].forEach(img => {
    img.onclick = function() {
      const modalImg = modal.querySelector('img');
      modalImg.src = this.src;
      modal.classList.remove('hidden');
    };
  });
}

function showGuideModal() {
  const guideModal = document.createElement('div');
  guideModal.className = 'guide-modal';
  guideModal.innerHTML = `
    <div class="guide-content">
      <h3>💡 도움말</h3>
      <p>이미지를 클릭하면 확대된 이미지를 볼 수 있습니다!</p>
      <button class="guide-button">확인</button>
    </div>
  `;
  document.body.appendChild(guideModal);

  const guideButton = guideModal.querySelector('.guide-button');
  guideButton.onclick = () => {
    guideModal.remove();
  };
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

// 모달 초기화 함수
function initializeModal() {
  const modalImg = modal.querySelector('img');
  const closeBtn = modal.querySelector('.close');
  
  // 모든 이미지에 클릭 이벤트 추가 (퀴즈 화면 + 상세 페이지)
  document.querySelectorAll('.image-container img, .detail-image').forEach(img => {
    img.onclick = function() {
      modal.classList.remove('hidden');
      modalImg.src = this.src;
      document.body.style.overflow = 'hidden'; // 스크롤 방지
    };
  });

  // 닫기 버튼 이벤트
  closeBtn.onclick = function() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // 스크롤 복원
  };

  // 모달 외부 클릭 시 닫기
  modal.onclick = function(event) {
    if (event.target === modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = 'auto'; // 스크롤 복원
    }
  };
}

// 터치 이벤트 처리
function initializeTouchEvents() {
  document.querySelectorAll('.image-container, .detail-image').forEach(container => {
    container.addEventListener('touchstart', function(e) {
      this.style.transform = 'scale(0.98)';
    }, { passive: true }); // passive 옵션 추가
    
    container.addEventListener('touchend', function(e) {
      this.style.transform = 'scale(1)';
    }, { passive: true }); // passive 옵션 추가
  });
}

// 초기화 함수 호출
initializeModal();
initializeTouchEvents();

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
  const isMobile = window.innerWidth <= 768;
  const correctCount = results.correct.length;

  // 점수에 따른 메시지와 애니메이션 클래스 결정
  const { message, animClass } = getScoreAnimation(correctCount);

  if (isMobile) {
    document.getElementById("results").innerHTML = `
      <div class="result-header ${animClass}">
        <h3>${nickname}님의 결과</h3>
        <div class="score-box">
          <div class="score-item" style="margin-bottom: 10px;">정답: ${correctCount}개</div>
          <div class="score-item">오답: ${results.incorrect.length}개</div>
        </div>
        <div class="result-message">${message}</div>
      </div>
    `;
  } else {
    document.getElementById("results").innerHTML = `
      <div class="result-header ${animClass}">
        <h3>${nickname}님의 결과</h3>
        <div class="score-summary">
          <p>정답: ${correctCount}개 </p>
          <p>오답: ${results.incorrect.length}개 </p>
        </div>
        <div class="result-message">${message}</div>
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
  }

  rankingResult.classList.remove("rendered");
  rankingResult.classList.add("hidden");
  rankingResult.innerHTML = "";
  checkRankButton.disabled = false;
  checkRankButton.textContent = "순위 확인하기";
}

function getScoreAnimation(score) {
  if (score === 10) {
    return {
      message: `
        <div class="perfect-score">
          <div class="firework"></div>
          <div class="firework"></div>
          <div class="firework"></div>
          <p>🎉 완벽해요! 더 가르칠게 없습니다. 하산하세요. 🎉</p>
        </div>`,
      animClass: 'perfect'
    };
  }
  if (score >= 8) {
    return {
      message: `
        <div class="perfect-score">
          <div class="firework"></div>
          <div class="firework"></div>
          <div class="firework"></div>
          <p>🌟 훌륭합니다! 정보주체의 권리에 대한 높은 이해도를 보여주셨습니다. 앞으로도 멋진 활약을 기대합니다! 🌟</p>
        </div>`,
      animClass: 'great'
    };
  }
  if (score >= 6) {
    return {
      message: `
        <div class="perfect-score">
          <div class="firework"></div>
          <div class="firework"></div>
          <div class="firework"></div>
          <p>👏 좋은 출발입니다! 정보주체의 권리에 대해 더욱 깊이 이해하며 한 단계 더 성장할 수 있어요!  👏</p>
        </div>`,
      animClass: 'good'
    };
  }
  return {
    message: '<p>💪 정보주체의 권리를 더욱 이해하기 위해 조금만 더 노력해보세요! 다음 번엔 더 좋은 결과를 기대할게요! 💪</p>',
    animClass: 'normal'
  };
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
  const isMobile = window.innerWidth <= 768;

  detailTitle.textContent = type === "correct" ? "정답 문제 목록" : "오답 문제 목록";

  // 페이지 타입별 학습 링크 매핑
  const studyLinks = {
    'A': 'https://haijun9.github.io/ComplianceChecklist/download/download_main.html',
    'B': 'https://haijun9.github.io/ComplianceChecklist/withdraw/withdraw_main.html',
    'C': 'https://haijun9.github.io/ComplianceChecklist/delete/delete_main.html',
    'D': 'https://haijun9.github.io/ComplianceChecklist/profile/profile_main.html',
    'E': 'https://haijun9.github.io/ComplianceChecklist/form/form_main.html'
  };

  detailList.innerHTML = items
    .map(
      (item) => `
        <div class="detail-item">
          <div class="detail-content">
            <h4>${item.currentQuestionIndex + 1}번 문제</h4>
            <p class="page-type">${pageTypes[item.left.upper]}</p>
            <div class="${isMobile ? 'detail-images-mobile' : 'detail-images'}">
              ${isMobile ? `
                <img class="detail-image loaded" src="images/${item.left.upper}/${item.left.upper}${item.left.mid}${item.left.level}.png" alt="위쪽 이미지">
                <img class="detail-image loaded" src="images/${item.right.upper}/${item.right.upper}${item.right.mid}${item.right.level}.png" alt="아래쪽 이미지">
              ` : `
                <div>
                  <img class="detail-image loaded" src="images/${item.left.upper}/${item.left.upper}${item.left.mid}${item.left.level}.png" alt="왼쪽 이미지">
                </div>
                <div>
                  <img class="detail-image loaded" src="images/${item.right.upper}/${item.right.upper}${item.right.mid}${item.right.level}.png" alt="오른쪽 이미지">
                </div>
              `}
            </div>
            <div class="answer-row">
                <button class="study-btn" onclick="window.open('${studyLinks[item.left.upper]}', '_blank')">학습하기</button>
              <p class="answer-text">정답: ${item.correct === "left" ? (isMobile ? "위쪽" : "왼쪽") : (isMobile ? "아래쪽" : "오른쪽")}</p>
            </div>
          </div>
        </div>
      `
    )
    .join("");

  showScreen(detailScreen);
  setTimeout(() => {
    initializeModal();
    initializeTouchEvents();
  }, 100);
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
