import os
from flask import Flask, jsonify, request
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from extensions import mongo 
from flask_mail import Mail
from flask_cors import CORS

# Cargar variables de entorno (.env ubicado en la raíz del proyecto)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

app = Flask(__name__)
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")

# 🔒 Configuración de CORS: solo permite tu frontend
CORS(app, supports_credentials=True, resources={
    r"/*": {"origins": ["http://localhost:3000", "https://trp.unlu.edu.ar"]}
})

# Configuración de correo (ajusta según tu servidor SMTP)
app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER")
app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))
app.config["MAIL_USE_TLS"] = os.getenv("MAIL_USE_TLS", "true").lower() in ["true", "1", "yes"]
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_DEFAULT_SENDER")

# Inicializamos las extensiones con la app
mongo.init_app(app)
jwt = JWTManager(app)
mail = Mail(app)

# Registrar los blueprints de endpoints
from endpoints.epUsers import users_bp
app.register_blueprint(users_bp)

from endpoints.epUnits import units_bp
app.register_blueprint(units_bp)

from endpoints.epQuestions import questions_bp
app.register_blueprint(questions_bp)

from endpoints.epAnswers import answers_bp
app.register_blueprint(answers_bp)

from endpoints.epUsersReport import report_bp
app.register_blueprint(report_bp)

# 🔒 Middleware para restringir orígenes no permitidos
@app.before_request
def restrict_origin():
    allowed = [
        "http://localhost:3000",
        "https://trp.unlu.edu.ar",
        "http://170.210.103.76"
    ]
    origin = request.headers.get("Origin")
    host = request.headers.get("Host")

    # Bloquear accesos directos sin Origin a rutas sensibles
    if request.path in ["/questions", "/answers", "/users"]:
        if not origin:
            # Si no hay Origin pero el Host coincide con el servidor → permitir
            if host not in ["170.210.103.76", "localhost:5000"]:
                return jsonify({"error": "Acceso directo no permitido"}), 403

    # Si hay Origin pero no está permitido
    if origin and origin not in allowed:
        return jsonify({"error": "Origin not allowed"}), 403


@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "¡Hola desde la API Flask!"})

if __name__ == '__main__':
    app.run(debug=True)
