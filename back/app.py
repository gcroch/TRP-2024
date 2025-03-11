from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "¡Hola desde la API Flask!"})

@app.route('/data', methods=['POST'])
def process_data():
    data = request.get_json()
    # Aquí puedes procesar los datos recibidos
    return jsonify({"received": data}), 201

if __name__ == '__main__':
    # Ejecuta la aplicación en modo debug para desarrollo
    app.run(debug=True)
