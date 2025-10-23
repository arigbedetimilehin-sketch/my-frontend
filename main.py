from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Temporary in-memory storage
users = {}
messages = []

@app.route("/")
def home():
    return {"message": "EchoSignal Cloud backend is running 🚀"}

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if email in users:
        return jsonify({"error": "User already exists"}), 400

    users[email] = {"password": password}
    return jsonify({"message": "Registration successful!"})

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = users.get(email)
    if not user or user["password"] != password:
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({"message": "Login successful!", "email": email})

@app.route("/messages", methods=["GET", "POST"])
def chat_messages():
    if request.method == "POST":
        data = request.get_json()
        sender = data.get("sender")
        receiver = data.get("receiver")
        content = data.get("content")

        if not sender or not receiver or not content:
            return jsonify({"error": "Missing data"}), 400

        messages.append({"sender": sender, "receiver": receiver, "content": content})
        return jsonify({"message": "Sent!"})

    # GET messages
    return jsonify(messages)

if __name__ == "__main__":
    app.run(debug=True)
