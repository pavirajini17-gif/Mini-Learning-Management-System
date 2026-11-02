
from flask import Flask, render_template, request, jsonify, session
import sqlite3

app = Flask(__name__)

app.secret_key = "learnhub_demo_secret_2026"

DATABASE = "database.db"


# Connect to database
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


# Create database and tables
def create_tables():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS enrolments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            course_id INTEGER,
            UNIQUE(user_id, course_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            course_id INTEGER,
            lesson_id INTEGER,
            UNIQUE(user_id, course_id, lesson_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quiz_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            course_id INTEGER,
            score INTEGER
        )
    """)

    cursor.execute(
        "INSERT OR IGNORE INTO users (id, name) VALUES (1, 'Demo Student')"
    )

    courses = [
        (1, "Python Programming", "Learn Python basics and programming."),
        (2, "Web Development", "Learn HTML, CSS and JavaScript."),
        (3, "Database Management", "Learn database concepts and SQL.")
    ]

    cursor.executemany(
        "INSERT OR IGNORE INTO courses VALUES (?, ?, ?)",
        courses
    )

    conn.commit()
    conn.close()


# Home page
@app.route("/")
def home():
    return render_template("index.html")

#login
@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/admin")
def admin_dashboard():
    if session.get("role") != "admin":
        return "Access denied. Please login as admin.", 403

    return """
    <h1>Welcome to LearnHub Admin Dashboard!</h1>
    <p>You are logged in as Admin.</p>
    <a href="/login">Logout</a>
    """

# Login authentication
@app.route("/api/login", methods=["POST"])
def authenticate():

    data = request.get_json()

    username = data.get("username", "")
    password = data.get("password", "")
    role = data.get("role", "")

    # Student credentials
    if (role == "student" and
        username == "student" and
        password == "student123"):

        session["username"] = username
        session["role"] = "student"

        return jsonify({
            "success": True,
            "message": "Student login successful!",
            "role": "student"
        })

    # Admin credentials
    elif (role == "admin" and
          username == "admin" and
          password == "admin123"):

        session["username"] = username
        session["role"] = "admin"

        return jsonify({
            "success": True,
            "message": "Admin login successful!",
            "role": "admin"
        })

    return jsonify({
        "success": False,
        "message": "Invalid username or password!"
    }), 401


# Logout
@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully!"})


# Get all courses
@app.route("/api/courses", methods=["GET"])
def get_courses():
    conn = get_db()
    courses = conn.execute("SELECT * FROM courses").fetchall()
    conn.close()

    return jsonify([dict(course) for course in courses])


# Enrol in a course
@app.route("/api/enrol", methods=["POST"])
def enrol():
    data = request.get_json()

    try:
        course_id = int(data["course_id"])
    except (TypeError, ValueError, KeyError):
        return jsonify({"message": "Invalid course ID"}), 400

    conn = get_db()

    course = conn.execute(
        "SELECT id FROM courses WHERE id = ?", (course_id,)
    ).fetchone()

    if not course:
        conn.close()
        return jsonify({"message": "Course not found"}), 404

    conn.execute(
        "INSERT OR IGNORE INTO enrolments (user_id, course_id) VALUES (1, ?)",
        (course_id,)
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Successfully enrolled!"})


# Get enrolled courses
@app.route("/api/my-courses", methods=["GET"])
def my_courses():
    conn = get_db()

    courses = conn.execute("""
        SELECT courses.*
        FROM courses
        JOIN enrolments ON courses.id = enrolments.course_id
        WHERE enrolments.user_id = 1
    """).fetchall()

    conn.close()

    return jsonify([dict(course) for course in courses])


# Get lesson progress
@app.route("/api/progress/<int:course_id>", methods=["GET"])
def get_progress(course_id):
    conn = get_db()

    rows = conn.execute("""
        SELECT lesson_id FROM progress
        WHERE user_id = 1 AND course_id = ?
    """, (course_id,)).fetchall()

    conn.close()

    return jsonify([row["lesson_id"] for row in rows])


# Mark a lesson as completed
@app.route("/api/progress", methods=["POST"])
def save_progress():
    data = request.get_json()

    try:
        course_id = int(data["course_id"])
        lesson_id = int(data["lesson_id"])
    except (TypeError, ValueError, KeyError):
        return jsonify({"message": "Invalid lesson information"}), 400

    if lesson_id < 1 or lesson_id > 5:
        return jsonify({"message": "Invalid lesson number"}), 400

    conn = get_db()

    conn.execute("""
        INSERT OR IGNORE INTO progress
        (user_id, course_id, lesson_id)
        VALUES (1, ?, ?)
    """, (course_id, lesson_id))

    conn.commit()
    conn.close()

    return jsonify({"message": "Progress saved!"})


# Save quiz result
@app.route("/api/quiz-result", methods=["POST"])
def save_quiz_result():
    data = request.get_json()

    try:
        course_id = int(data["course_id"])
        score = int(data["score"])
    except (TypeError, ValueError, KeyError):
        return jsonify({"message": "Invalid quiz result"}), 400

    if score < 0 or score > 100:
        return jsonify({"message": "Invalid score"}), 400

    conn = get_db()

    conn.execute("""
        INSERT INTO quiz_results (user_id, course_id, score)
        VALUES (1, ?, ?)
    """, (course_id, score))

    conn.commit()
    conn.close()

    return jsonify({"message": "Quiz result saved!"})


# Generate certificate
@app.route("/api/certificate/<int:course_id>", methods=["GET"])
def certificate(course_id):
    conn = get_db()

    completed = conn.execute("""
        SELECT COUNT(*) AS total FROM progress
        WHERE user_id = 1 AND course_id = ?
    """, (course_id,)).fetchone()["total"]

    result = conn.execute("""
        SELECT MAX(score) AS score FROM quiz_results
        WHERE user_id = 1 AND course_id = ?
    """, (course_id,)).fetchone()

    course = conn.execute(
        "SELECT title FROM courses WHERE id = ?", (course_id,)
    ).fetchone()

    conn.close()

    if not course:
        return jsonify({"eligible": False, "message": "Course not found"}), 404

    score = result["score"]

    if completed == 5 and score is not None and score >= 60:
        return jsonify({
            "eligible": True,
            "student": "Demo Student",
            "course": course["title"],
            "score": score
        })

    return jsonify({
        "eligible": False,
        "message": "Complete all 5 lessons and pass the quiz with at least 60%."
    })


if __name__ == "__main__":
    create_tables()
    app.run(debug=True)
