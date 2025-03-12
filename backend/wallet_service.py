from flask import Flask, request, jsonify, url_for
from flask_cors import CORS
from flask_socketio import SocketIO
import jwt  # Install using: pip install pyjwt
import os
import time

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")  # WebSocket Support

SECRET_KEY = os.getenv("JWT_SECRET", "your_secret_key_here")


### ✅ Default Home Route
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Bittensor Wallet Service is running",
        "endpoints": {
            "auth_login": url_for("auth_login", _external=True),
            "connect_wallet": url_for("connect_wallet", _external=True),
            "routes": url_for("list_routes", _external=True),
        }
    }), 200


### ✅ Debugging: List All Routes
@app.route("/routes", methods=["GET"])
def list_routes():
    return jsonify({rule.endpoint: rule.rule for rule in app.url_map.iter_rules()})


### ✅ Authentication Route (No Password Required)
@app.route('/auth/login', methods=['POST'])
def auth_login():
    try:
        data = request.get_json()

        if not data or 'address' not in data or 'challenge' not in data or 'signature' not in data:
            return jsonify({"error": "Missing required fields"}), 400

        address = data['address']
        challenge = data['challenge']
        signature = data['signature']

        # 🚀 Assume the signature is valid
        print(f"✅ Auth request from {address} with challenge {challenge}")
        print(f"⚠️ Skipping signature verification for easier debugging...")

        # ✅ Generate Token
        token = jwt.encode({"address": address, "exp": time.time() + 3600}, SECRET_KEY, algorithm="HS256")
        return jsonify({"message": "Authenticated", "token": token}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


### ✅ WebSocket Handlers
@socketio.on("connect")
def handle_connect():
    print("🔗 New WebSocket client connected")


@socketio.on("disconnect")
def handle_disconnect():
    print("❌ WebSocket client disconnected")


### 🚀 Start Flask API
if __name__ == '__main__':
    print("🚀 Starting Flask Auth API on http://127.0.0.1:5001")
    socketio.run(app, host="127.0.0.1", port=5001, debug=True)
