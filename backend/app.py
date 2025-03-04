from flask import Flask, request, jsonify, url_for
from flask_cors import CORS
from flask_socketio import SocketIO
import jwt  # Install using: pip install pyjwt
import os
import time
from substrateinterface import Keypair  # For signature verification

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# ✅ Secret Keys (Load from .env)
SECRET_KEY = os.getenv("JWT_SECRET", "your_secret_key_here")
USER_PASSWORD = os.getenv("WALLET_PASSWORD", "your_password_here")


### ✅ Authentication Route (Merge Both Implementations)
@app.route('/auth/login', methods=['POST'])
def auth_login():
    try:
        data = request.get_json()
        print("🔍 Received Auth Request:", data)

        # 🔴 Check for missing fields
        if not data or 'address' not in data or 'challenge' not in data or 'signature' not in data or 'password' not in data:
            return jsonify({"error": "Missing required fields"}), 400

        address = data['address']
        challenge = data['challenge']
        signature = data['signature']
        password = data['password']

        # 🔒 Step 1: Validate password
        if password != USER_PASSWORD:
            print("❌ Invalid password attempt")
            return jsonify({"error": "Invalid password"}), 401

        # 🔑 Step 2: Validate Signature
        try:
            keypair = Keypair(ss58_address=address)
            is_valid = keypair.verify(challenge.encode(), bytes.fromhex(signature))
            if not is_valid:
                print(f"❌ Invalid signature from {address}")
                return jsonify({"error": "Invalid signature"}), 403
        except Exception as e:
            return jsonify({"error": f"Signature verification failed: {str(e)}"}), 403

        # ✅ Step 3: Create JWT Token
        token = jwt.encode({"address": address, "exp": time.time() + 3600}, SECRET_KEY, algorithm="HS256")

        print(f"✅ Authentication Successful for {address}")
        return jsonify({"message": "Authenticated", "token": token}), 200

    except Exception as e:
        print(f"❌ Auth Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# 🚀 Start Flask API
if __name__ == '__main__':
    print("🚀 Starting Flask Auth API on http://127.0.0.1:5001")
    socketio.run(app, host="127.0.0.1", port=5001, debug=True)
