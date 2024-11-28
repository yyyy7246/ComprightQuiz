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
                            allPossibleQuestions.push({
                                left: { upper, mid, level: level1 },
                                right: { upper, mid, level: level2 },
                                correct: this.getCorrectAnswer(level1, level2)
                            });
                        }
                    });
                });
            });
        });

        this.currentQuestions = [];
        let usedCombinations = new Set();
        
        // 2라운드 진행 (각 5문제씩)
        for (let round = 0; round < rounds; round++) {
            let roundQuestions = 0;
            let tempUpperGroups = new Set();
            
            // 각 라운드당 5문제 선택
            while (roundQuestions < 5) {
                let randomIndex = Math.floor(Math.random() * allPossibleQuestions.length);
                let question = allPossibleQuestions[randomIndex];
                
                // 중복 체크를 위한 키 생성
                const combinationKey = `${question.left.upper}${question.left.mid}-${question.left.level}-${question.right.level}`;
                const reverseCombinationKey = `${question.left.upper}${question.left.mid}-${question.right.level}-${question.left.level}`;
                
                // 해당 라운드에서 중복되지 않는 upper 그룹과 조합 체크
                if (!tempUpperGroups.has(question.left.upper) && 
                    !usedCombinations.has(combinationKey) && 
                    !usedCombinations.has(reverseCombinationKey)) {
                    
                    this.currentQuestions.push(question);
                    tempUpperGroups.add(question.left.upper);
                    usedCombinations.add(combinationKey);
                    roundQuestions++;
                    allPossibleQuestions.splice(randomIndex, 1);
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