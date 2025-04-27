from flask import Flask, request, jsonify, url_for
from flask_cors import CORS
from flask_socketio import SocketIO
import jwt  # Install using: pip install pyjwt
import os
import time

app = Flask(__name__)
# Configure CORS properly to handle preflight requests
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})
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


### ✅ Logout Route
@app.route('/auth/logout', methods=['POST'])
def auth_logout():
    try:
        # Get the authorization header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Invalid authorization header"}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            # Verify the token
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            address = payload.get('address')
            
            # In a real implementation, you might:
            # 1. Add the token to a blacklist
            # 2. Notify other services about the logout
            # 3. Clear any server-side session data
            
            print(f"🔒 User {address} logged out successfully")
            
            # Emit a socket event to notify other connected clients
            socketio.emit("wallet_disconnected", {"address": address})
            
            return jsonify({"message": "Logged out successfully"}), 200
            
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
            
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


### ✅ Token Verification Route
@app.route('/auth/verify', methods=['GET'])
def verify_token():
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "No token provided"}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        # Verify the JWT token
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return jsonify({"valid": True, "address": decoded["address"]}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401


# Add this route to handle OPTIONS requests explicitly
@app.route('/auth/verify', methods=['OPTIONS'])
def handle_verify_options():
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response, 200
