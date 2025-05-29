"""
Voice Transcription Service
Basic placeholder service for Docker Compose
"""

from flask import Flask, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'voice_transcription',
        'version': '1.0.0'
    })

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Voice Transcription Service',
        'status': 'running',
        'endpoints': ['/health']
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 9001))
    app.run(host='0.0.0.0', port=port, debug=True)
