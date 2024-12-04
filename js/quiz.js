class Quiz {
    constructor() {
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.correctAnswers = [];
        this.incorrectAnswers = [];
    }

    generateQuestions() {
        let allPossibleQuestions = [];
        const rounds = 2;
        
        // 가능한 모든 문제 조합 생성
        quizData.upperGroups.forEach(upper => {
            quizData.midGroups[upper].forEach(mid => {
                quizData.levels.forEach(level1 => {
                    quizData.levels.forEach(level2 => {
                        if (level1 !== level2) {
                            // 정렬된 레벨 조합을 사용하여 중복 방지
                            const levels = [level1, level2].sort().join('-');
                            const questionKey = `${upper}-${mid}-${levels}`;
                            
                            allPossibleQuestions.push({
                                key: questionKey,
                                left: { upper, mid, level: level1 },
                                right: { upper, mid, level: level2 },
                                correct: this.getCorrectAnswer(level1, level2)
                            });
                        }
                    });
                });
            });
        });
    
        // 문제 섞기
        for (let i = allPossibleQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPossibleQuestions[i], allPossibleQuestions[j]] = 
            [allPossibleQuestions[j], allPossibleQuestions[i]];
        }
    
        this.currentQuestions = [];
        let usedQuestionKeys = new Set();
        
        // 2라운드 진행
        for (let round = 0; round < rounds; round++) {
            let roundQuestions = 0;
            let tempUpperGroups = new Set();
            
            // 각 라운드 5문제 선택
            for (let i = 0; i < allPossibleQuestions.length && roundQuestions < 5; i++) {
                const question = allPossibleQuestions[i];
                
                if (!tempUpperGroups.has(question.left.upper) && 
                    !usedQuestionKeys.has(question.key)) {
                    
                    this.currentQuestions.push(question);
                    tempUpperGroups.add(question.left.upper);
                    usedQuestionKeys.add(question.key);
                    roundQuestions++;
                    allPossibleQuestions.splice(i, 1);
                    i--; // 배열이 줄어들었으므로 인덱스 조정
                }
            }
        }
    }

    getCorrectAnswer(level1, level2) {
        const levelValues = { '상': 3, '중': 2, '하': 1 };
        return levelValues[level1] > levelValues[level2] ? 'left' : 'right';
    }

    getCurrentQuestion() {
        return this.currentQuestions[this.currentQuestionIndex];
    }

    selectAnswer(selected) {
        const question = this.getCurrentQuestion();
        question.currentQuestionIndex = this.currentQuestionIndex; // 현재 문제 번호 저장
    
        if (selected === question.correct) {
            this.correctAnswers.push(question);
        } else {
            this.incorrectAnswers.push(question);
        }
        
        this.currentQuestionIndex++;
        return this.currentQuestionIndex >= this.currentQuestions.length;
    }

    getResults() {
        return {
            correct: this.correctAnswers,
            incorrect: this.incorrectAnswers
        };
    }

    reset() {
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.correctAnswers = [];
        this.incorrectAnswers = [];
    }
}