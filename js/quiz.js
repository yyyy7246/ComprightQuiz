class Quiz {
    constructor() {
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.correctAnswers = [];
        this.incorrectAnswers = [];
    }

    generateQuestions() {
        let allPossibleQuestions = [];
        
        quizData.upperGroups.forEach(upper => {
            quizData.midGroups[upper].forEach(mid => {
                quizData.levels.forEach(level1 => {
                    quizData.levels.forEach(level2 => {
                        if (level1 !== level2) {
                            allPossibleQuestions.push({
                                left: { upper, mid, level: level1 },
                                right: { upper, mid: quizData.midGroups[upper][Math.floor(Math.random() * 2)], level: level2 },
                                correct: level1 > level2 ? 'left' : 'right'
                            });
                        }
                    });
                });
            });
        });

        this.currentQuestions = [];
        let usedUpperGroups = new Set();
        
        while (this.currentQuestions.length < 10) {
            let randomIndex = Math.floor(Math.random() * allPossibleQuestions.length);
            let question = allPossibleQuestions[randomIndex];
            
            if (!usedUpperGroups.has(question.left.upper)) {
                this.currentQuestions.push(question);
                usedUpperGroups.add(question.left.upper);
                allPossibleQuestions.splice(randomIndex, 1);
            }
        }
    }

    getCurrentQuestion() {
        return this.currentQuestions[this.currentQuestionIndex];
    }

    selectAnswer(selected) {
        const question = this.getCurrentQuestion();
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