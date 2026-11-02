const courseImages = {
    1: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600",
    2: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600",
    3: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600"
};


// =====================================
// LEARNHUB - MINI LMS
// =====================================

const lessons = {
    1: [
        "Introduction to Python",
        "Python Variables and Data Types",
        "Conditional Statements",
        "Loops in Python",
        "Python Functions"
    ],
    2: [
        "Introduction to HTML",
        "HTML Elements and Forms",
        "CSS Basics",
        "JavaScript Introduction",
        "Building a Web Page"
    ],
    3: [
        "Introduction to Databases",
        "Database Tables",
        "SQL Basics",
        "SQL Queries",
        "Database Management"
    ]
};

let currentQuestions = [];


// =====================================
// LOAD COURSES
// =====================================


async function loadCourses() {
    try {
        const response = await fetch("/api/courses");
        const courses = await response.json();

        const courseList = document.getElementById("courseList");
        courseList.innerHTML = "";

        // Course images
        const courseImages = {
            1: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600",
            2: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600",
            3: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600"
        };

        courses.forEach(course => {
            const card = document.createElement("div");
            card.className = "course-card";

            // Course image
            const image = document.createElement("img");
            image.src = courseImages[course.id] ||
                "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600";
            image.alt = course.title;
            image.className = "course-image";

            const title = document.createElement("h3");
            title.textContent = course.title;

            const description = document.createElement("p");
            description.textContent = course.description;

            const button = document.createElement("button");
            button.textContent = "Enrol Now";
            button.addEventListener("click", () => enrolCourse(course.id));

            card.append(image, title, description, button);
            courseList.appendChild(card);
        });

    } catch (error) {
        console.error("Course loading error:", error);
        document.getElementById("courseList").textContent =
            "Unable to load courses.";
    }
}



// =====================================
// ENROL IN COURSE
// =====================================

async function enrolCourse(courseId) {
    try {
        const response = await fetch("/api/enrol", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                course_id: courseId
            })
        });

        const result = await response.json();
        alert(result.message);

        if (response.ok) {
            loadMyCourses();
            loadLessons(courseId);
        }

    } catch (error) {
        alert("Unable to enrol. Please try again.");
    }
}


// =====================================
// LOAD MY COURSES
// =====================================

async function loadMyCourses() {
    try {
        const response = await fetch("/api/my-courses");
        const courses = await response.json();

        const container = document.getElementById("myCourseList");
        container.innerHTML = "";

        if (courses.length === 0) {
            container.textContent = "No courses enrolled yet.";
            return;
        }

        courses.forEach(course => {
            const card = document.createElement("div");
            card.className = "course-card";

            const title = document.createElement("h3");
            title.textContent = course.title;

            const button = document.createElement("button");
            button.textContent = "Continue Learning";
            button.addEventListener("click", () => {
                loadLessons(course.id);
                document.getElementById("lessons").scrollIntoView({
                    behavior: "smooth"
                });
            });

            card.append(title, button);
            container.appendChild(card);
        });

    } catch (error) {
        console.error("My courses error:", error);
    }
}


// =====================================
// LOAD LESSONS
// =====================================

async function loadLessons(courseId) {
    const container = document.getElementById("lessonList");

    document.getElementById("lessonTitle").textContent =
        "Course Lessons";

    container.textContent = "Loading lessons...";

    try {
        const response = await fetch(`/api/progress/${courseId}`);
        const completedLessons = await response.json();

        container.innerHTML = "";

        document.getElementById("lessonTitle").textContent =
            "Lessons - " + getCourseName(courseId);

        lessons[courseId].forEach((lesson, index) => {
            const lessonId = index + 1;
            const completed = completedLessons.includes(lessonId);

            const card = document.createElement("div");
            card.className = "course-card";

            const title = document.createElement("h3");
            title.textContent = `Lesson ${lessonId}: ${lesson}`;

            const status = document.createElement("p");
            status.textContent = completed ? "Completed ✓" : "Not completed";

            const button = document.createElement("button");
            button.textContent = completed ? "Completed" : "Mark as Complete";
            button.disabled = completed;

            button.addEventListener("click", () => {
                completeLesson(courseId, lessonId);
            });

            card.append(title, status, button);
            container.appendChild(card);
        });

        // Progress bar
        const percentage = (completedLessons.length / 5) * 100;

        const progressContainer = document.createElement("div");
        progressContainer.innerHTML = `
            <h3>Course Progress: ${percentage}%</h3>
            <div style="background:#ddd; height:15px; border-radius:10px;">
                <div style="
                    width:${percentage}%;
                    background:#087f8c;
                    height:15px;
                    border-radius:10px;">
                </div>
            </div>
        `;

        container.prepend(progressContainer);

    } catch (error) {
        console.error("Lesson loading error:", error);
        container.textContent = "Unable to load lessons.";
    }
}


// =====================================
// COMPLETE LESSON
// =====================================

async function completeLesson(courseId, lessonId) {
    try {
        const response = await fetch("/api/progress", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                course_id: courseId,
                lesson_id: lessonId
            })
        });

        if (!response.ok) {
            throw new Error("Progress could not be saved.");
        }

        alert("Lesson completed successfully!");
        loadLessons(courseId);

    } catch (error) {
        alert("Unable to save lesson progress.");
    }
}


// =====================================
// COURSE NAME
// =====================================

function getCourseName(courseId) {
    const names = {
        1: "Python Programming",
        2: "Web Development",
        3: "Database Management"
    };

    return names[courseId];
}


// =====================================
// DECODE API TEXT
// =====================================

function decodeHTML(text) {
    const element = document.createElement("textarea");
    element.innerHTML = text;
    return element.value;
}


// =====================================
// SHUFFLE OPTIONS
// =====================================

function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
}


// =====================================
// BACKUP QUIZ QUESTIONS
// =====================================

function backupQuestions() {
    return [
        {
            question: "Which language is used for web page structure?",
            correct_answer: "HTML",
            incorrect_answers: ["Python", "Java", "C"]
        },
        {
            question: "Which keyword defines a function in Python?",
            correct_answer: "def",
            incorrect_answers: ["function", "fun", "define"]
        },
        {
            question: "Which language is used to style web pages?",
            correct_answer: "CSS",
            incorrect_answers: ["SQL", "Python", "C"]
        },
        {
            question: "Which database language is used to retrieve data?",
            correct_answer: "SQL",
            incorrect_answers: ["HTML", "CSS", "XML"]
        },
        {
            question: "What does HTML stand for?",
            correct_answer: "HyperText Markup Language",
            incorrect_answers: [
                "HighText Machine Language",
                "Hyper Transfer Main Language",
                "Home Tool Markup Language"
            ]
        }
    ];
}


// =====================================
// START QUIZ - EXTERNAL API
// =====================================

async function startQuiz() {
    const courseId = Number(
        document.getElementById("quizCourse").value
    );

    const quizArea = document.getElementById("quizArea");

    quizArea.textContent = "Loading quiz questions...";

    try {
        const response = await fetch(
            "https://opentdb.com/api.php?amount=5&type=multiple"
        );

        if (!response.ok) {
            throw new Error("Quiz API unavailable");
        }

        const data = await response.json();

        if (data.response_code !== 0 || data.results.length < 5) {
            throw new Error("No quiz questions available");
        }

        currentQuestions = data.results.map(q => ({
            question: decodeHTML(q.question),
            correct_answer: decodeHTML(q.correct_answer),
            incorrect_answers: q.incorrect_answers.map(decodeHTML)
        }));

    } catch (error) {
        console.log("Using backup quiz questions:", error);
        currentQuestions = backupQuestions();
    }

    displayQuiz(courseId);
}


// =====================================
// DISPLAY QUIZ
// =====================================

function displayQuiz(courseId) {
    const quizArea = document.getElementById("quizArea");
    quizArea.innerHTML = "";

    const heading = document.createElement("h3");
    heading.textContent = "Answer all 5 questions";

    const form = document.createElement("form");

    currentQuestions.forEach((q, index) => {
        const questionBox = document.createElement("div");
        questionBox.className = "course-card";

        const title = document.createElement("h3");
        title.textContent = `${index + 1}. ${q.question}`;

        questionBox.appendChild(title);

        const options = shuffle([
            q.correct_answer,
            ...q.incorrect_answers
        ]);

        options.forEach(option => {
            const label = document.createElement("label");
            label.style.display = "block";
            label.style.margin = "10px";

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = `question${index}`;
            radio.value = option;
            radio.required = true;

            label.append(radio, document.createTextNode(" " + option));
            questionBox.appendChild(label);
        });

        form.appendChild(questionBox);
    });

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Submit Quiz";

    form.appendChild(submit);

    form.addEventListener("submit", event => {
        event.preventDefault();
        submitQuiz(courseId, form);
    });

    quizArea.append(heading, form);
}


// =====================================
// SUBMIT QUIZ
// =====================================

async function submitQuiz(courseId, form) {
    let score = 0;

    currentQuestions.forEach((q, index) => {
        const selected = form.querySelector(
            `input[name="question${index}"]:checked`
        );

        if (selected && selected.value === q.correct_answer) {
            score++;
        }
    });

    const percentage = Math.round(
        (score / currentQuestions.length) * 100
    );

    try {
        const response = await fetch("/api/quiz-result", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                course_id: courseId,
                score: percentage
            })
        });

        if (!response.ok) {
            throw new Error("Could not save quiz result");
        }

        document.getElementById("quizArea").innerHTML = `
            <div class="course-card">
                <h2>Quiz Completed!</h2>
                <h3>Your Score: ${score}/${currentQuestions.length}</h3>
                <h3>Percentage: ${percentage}%</h3>
                <p>${percentage >= 60
                    ? "Congratulations! You passed."
                    : "Keep learning and try again!"}</p>
            </div>
        `;

    } catch (error) {
        alert("Quiz result could not be saved.");
    }
}


// =====================================
// GENERATE CERTIFICATE
// =====================================

async function generateCertificate() {
    const courseId = Number(
        document.getElementById("certificateCourse").value
    );

    const area = document.getElementById("certificateArea");

    area.textContent = "Checking your eligibility...";

    try {
        const response = await fetch(
            `/api/certificate/${courseId}`
        );

        const data = await response.json();

        if (!response.ok || !data.eligible) {
            area.textContent = data.message ||
                "You are not eligible for a certificate yet.";
            return;
        }

        area.innerHTML = `
            <div class="course-card" id="certificateCard"
                 style="text-align:center; padding:40px;">
                <h1>Certificate of Completion</h1>
                <p>This certificate is proudly presented to</p>
                <h2>${data.student}</h2>
                <p>For successfully completing</p>
                <h2>${data.course}</h2>
                <p>Quiz Score: ${data.score}%</p>
                <p>Congratulations on your achievement!</p>
                <button onclick="window.print()">Print Certificate</button>
            </div>
        `;

    } catch (error) {
        area.textContent = "Unable to generate certificate.";
    }
}


// =====================================
// LOAD DATA WHEN PAGE OPENS
// =====================================

document.addEventListener("DOMContentLoaded", () => {
    loadCourses();
    loadMyCourses();
});
