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
  'D': '개인정보 열람·정정 페이지',
  'E': '개인정보 문의 페이지'
};

const privacyModal = document.getElementById('privacy-modal');
const agreeBtn = document.getElementById('agree-btn');
const disagreeBtn = document.getElementById('disagree-btn');
const phoneInput = document.querySelector('.phone-input');
const phoneNumber = document.getElementById('phone-number');
const submitPrivacy = document.getElementById('submit-privacy');

// 순위확인 버튼 클릭 시
checkRankButton.addEventListener('click', submitResult);

// 동의 버튼 클릭 시
agreeBtn.addEventListener('click', function() {
    phoneInput.classList.remove('hidden');
});

// 미동의 버튼 클릭 시
disagreeBtn.addEventListener('click', function() {
    privacyModal.classList.add('hidden');
});






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

  window.scrollTo({
    top: 15,
    behavior: 'smooth'  // 부드러운 스크롤 효과
  });
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
  pageTypeDisplay.innerHTML = `
    <div>${pageTypes[question.left.upper]}</div>
    <div class="select-guide">두 페이지 중 우수 구현 페이지를 선택해주세요!</div>
  `;
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
  checkRankButton.textContent = "등급 확인하고 커피 응모하기";
}

function getScoreAnimation(score) {
  if (score === 10) {
    return {
      message: `
        <div class="perfect-score">
          <div class="firework"></div>
          <div class="firework"></div>
          <div class="firework"></div>
          <p>🎉 완벽해요! 더 가르칠게 없습니다. 하산하세요. 🎉</br></p>
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
          <p>🌟 훌륭합니다! 정보주체의 권리에 대한 높은 이해도를 보여주셨어요. 앞으로도 멋진 활약을 기대할게요! 🌟</br></p>
        </div>`,
      animClass: 'perfect'
    };
  }
  if (score >= 6) {
    return {
      message: `
        <div class="perfect-score">
          <div class="firework"></div>
          <div class="firework"></div>
          <div class="firework"></div>
          <p>👏 좋은 출발이에요! 정보주체의 권리에 대해 더욱 깊이 이해하며 한 단계 더 성장할 수 있어요! 👏</br></p>
        </div>`,
      animClass: 'great'
    };
  }
  return {
    message: '<p>💪 정보주체의 권리를 더욱 이해하기 위해 조금만 더 노력해보세요! 다음 번엔 더 좋은 결과를 기대할게요! 💪</br></p>',
    animClass: 'good'
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

  const explanations = {
    'A': '<strong>개인정보 다운로드</strong>' +
         '1. 다운로드 요청 및 확인 기능이 쉽게 인지할 수 있는 위치에 있어야 해요.🔍\n\n' +
         '2. 다운로드 요청 시 수령 파일의 타입, 기간, 범위 등의 설정을 제공해야 해요.⚙️\n\n' +
         '3. 선택한 서비스 종류에 따라 다운로드 파일 준비를 위한 예상 소요 시간을 제공하길 권장해요.⏱️',

    'B': '<strong>개인정보 동의철회</strong>' +
         '1. 처리정지 및 동의 철회 기능이 쉽게 인지할 수 있는 위치에 있어야 해요.🔍\n\n' +
         '2. 처리정지 및 동의 철회 시, 전후 서비스 차이에 대한 자세한 설명을 제공해야 해요.📋\n\n' +
         '3. 토글, 체크박스 등의 방식으로 각 항목에 대한 설정을 편히 할 수 있어야 해요.✅',

    'C': '<strong>개인정보 삭제</strong>' +
         '1. 개인정보 삭제 기능이 쉽게 인지할 수 있는 위치에 있어야 해요.🔍\n\n' +
         '2. 주의 사항과 삭제 요청 시 해당되는 항목에 대해 명확히 안내해야 해요.📋\n\n' +
         '3. 개인정보 삭제 시 2차 인증을 통해 본인 인증을 재확인하여야 해요.🔐',

    'D': '<strong>개인정보 열람·정정</strong>' +
         '1. 개인정보 열람·정정 기능이 쉽게 인지할 수 있는 위치에 있어야 해요.🔍\n\n' +
         '2. 개인정보 열람 시 주요 개인정보의 경우 마스킹 처리를 적용해야 해요.🔒\n\n' +
         '3. 개인정보 열람 시 마스킹 처리된 정보는 2차 인증을 통해 확인 가능해야 해요.🔑\n\n' +
         '4. 개인정보 정정 시 각 정정 정보에 따른 2차 인증을 통해 진행하여야 해요.✔️',

    'E': '<strong>개인정보 문의</strong>' +
         '1. 개인정보 문의 Form이 쉽게 인지할 수 있는 위치에 있어야 해요.🔍\n\n' +
         '2. 요청 종류와 서비스 종류 선택 옵션을 통해 사용자 요청을 세분화해야 해요.📋\n\n' +
         '3. 선택한 요청과 서비스에 대해 추가 선택이 가능해 상세 문의를 진행할 수 있어야 해요.✏️\n\n' +
         '4. 로그인 없이 문의할 경우, 2차 인증을 진행하여야 해요.🔐'
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
            <div class="explanation-box">
              <h5>📝 문제 해설</h5>
              <p>${explanations[item.left.upper]}</p>
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

function getGrade(percentile) {
  if (percentile <= 4) return 1;
  if (percentile <= 11) return 2;
  if (percentile <= 23) return 3;
  if (percentile <= 40) return 4;
  if (percentile <= 60) return 5;
  if (percentile <= 77) return 6;
  if (percentile <= 89) return 7;
  if (percentile <= 96) return 8;
  return 9;
}

async function submitResult() {
  if (checkRankButton.disabled) {
      return;
  }

  privacyModal.classList.remove('hidden');

  // 개인정보 수집 동의 처리
  const submitData = await new Promise((resolve) => {
      const handleAgree = () => {
          phoneInput.classList.remove('hidden');
      };

      const handleDisagree = () => {
          privacyModal.classList.add('hidden');
          resolve({ agreement: false, phoneNumber: "" });
          // 이벤트 리스너 제거
          agreeBtn.removeEventListener('click', handleAgree);
          disagreeBtn.removeEventListener('click', handleDisagree);
          submitPrivacy.removeEventListener('click', handleSubmit);
      };

      const handleSubmit = () => {
          const phonePattern = /^01[016789]\d{7,8}$/;
          if (!phonePattern.test(phoneNumber.value)) {
              alert('올바른 전화번호 형식이 아닙니다.');
              return;
          }
          privacyModal.classList.add('hidden');
          resolve({ agreement: true, phoneNumber: phoneNumber.value });
          // 이벤트 리스너 제거
          agreeBtn.removeEventListener('click', handleAgree);
          disagreeBtn.removeEventListener('click', handleDisagree);
          submitPrivacy.removeEventListener('click', handleSubmit);
      };

      agreeBtn.addEventListener('click', handleAgree);
      disagreeBtn.addEventListener('click', handleDisagree);
      submitPrivacy.addEventListener('click', handleSubmit);
  });

  checkRankButton.disabled = true;
  checkRankButton.textContent = "등급 확인 중...(최대 20초 소요)";

  const results = quiz.getResults();
  const data = {
      nickname: nickname,
      correct_count: results.correct.length,
      timestamp: Date.now(),
      agreement: submitData.agreement,
      phoneNumber: submitData.phoneNumber
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
          throw new Error("등급 확인 중 오류가 발생했습니다.");
      }

      const rankData = await response.json();

      rankingResult.classList.add("rendered");
      rankingResult.innerHTML = `
          <div class="ranking-info">
              <h3>등급 정보</h3>
              <p class="percentile">당신의 개인정보영역 등급은 ${getGrade(rankData.percentile)}등급입니다! (상위 ${rankData.percentile.toFixed(1)}%)</p>
              <p style="font-size: 0.9rem; color: #666; margin-top: -10px; word-break: keep-all; word-wrap: break-word;">💡 순위에 보이지 않는다면 하단에 새로고침 버튼을 눌러주세요</p>
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
              <button id="refresh-ranking" class="btn-secondary">🔄 순위 새로고침</button>
          </div>
      `;

      // 새로고침 버튼에 이벤트 리스너 추가
      // 새로고침 버튼에 이벤트 리스너 추가
      const refreshButton = document.getElementById('refresh-ranking');
      refreshButton.addEventListener('click', async () => {
          try {
              refreshButton.disabled = true;
              refreshButton.textContent = "새로고침 중...";
              
              // GET 요청으로 변경
              const refreshResponse = await fetch(`https://shiny-resonance-4d3a.yyyy7246.workers.dev?nickname=${encodeURIComponent(nickname)}&correct_count=${results.correct.length}`, {
                  method: "GET",
                  headers: {
                      "Content-Type": "application/json",
                  }
              });

              if (!refreshResponse.ok) {
                  throw new Error("순위 새로고침 중 오류가 발생했습니다.");
              }

              const newRankData = await refreshResponse.json();
              
              // 새로고침 부분의 percentile 업데이트 코드도 수정
              document.querySelector('.percentile').textContent = 
              `당신의 개인정보영역 등급은 ${getGrade(newRankData.percentile)}등급입니다! (상위 ${newRankData.percentile.toFixed(1)}%)`;
              
              document.querySelector('.ranking-list').innerHTML = 
                  newRankData.topTen
                      .map(
                          (player, index) => `
                              <div class="rank-item">
                                  <div class="rank-number">${index + 1}위</div>
                                  <div class="rank-content">${player.nickname} - ${player.correct_count}개</div>
                              </div>
                          `
                      )
                      .join("");
              
              refreshButton.textContent = "🔄 순위 새로고침";
              refreshButton.disabled = false;
          } catch (error) {
              alert("순위 새로고침 중 오류가 발생했습니다.");
              refreshButton.textContent = "🔄 순위 새로고침";
              refreshButton.disabled = false;
              console.error("Error:", error);
          }
      });

      rankingResult.classList.remove("hidden");
      checkRankButton.textContent = "등급 확인 완료";
  } catch (error) {
      checkRankButton.disabled = false;
      checkRankButton.textContent = "등급 확인하고 커피 응모하기";
      rankingResult.classList.remove("rendered");
      
      if (response.status === 429) {
          alert("10초 이내에 동일한 요청이 있었습니다. 잠시 후 다시 시도해주세요.");
      } else {
          alert("등급 확인 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
      console.error("Error:", error);
  }
}

function restartQuiz() {
  quiz.reset();
  showScreen(startScreen);
  privacyModal.classList.add('hidden');
  phoneInput.classList.add('hidden');
  phoneNumber.value = '';  // 전화번호 입력값 초기화
  agreeBtn.disabled = false;  // 동의 버튼 활성화
  disagreeBtn.disabled = false;  // 미동의 버튼 활성화
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
