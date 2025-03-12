from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from bittensor_wallet import Wallet

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize wallet
wallet = Wallet()
wallet.create()

@app.route('/get-wallet', methods=['GET'])
def get_wallet():
    """Returns wallet hotkey"""
    try:
        if hasattr(wallet, 'hotkey_str') and callable(wallet.hotkey_str):
            hotkey = str(wallet.hotkey_str())  # Ensure it's callable
        else:
            hotkey = "Hotkey function not found"

        return jsonify({"hotkey": hotkey}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500  # Handle any errors gracefully

@socketio.on("connect")
def handle_connect():
    print("Client connected")
    socketio.emit("message", "Connected to WebSocket server")

@socketio.on("test")
def handle_test(data):
    print(f"Test event received: {data}")
    socketio.emit("test_response", {"message": "Test event processed"})

if __name__ == '__main__':
    print("Starting Flask server on port 5001...")
    socketio.run(app, host="0.0.0.0", port=5001, debug=True, allow_unsafe_werkzeug=True)
