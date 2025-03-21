import os
from flask import Flask, jsonify
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from extensions import mongo 
from flask_mail import Mail

# Cargar variables de entorno (.env ubicado en la raíz del proyecto)
load_dotenv(os.path.join(os.path.dirname(__file__),"..", '.env'))

app = Flask(__name__)
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")

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

# Registrar el blueprint de endpoints de usuarios
from endpoints.epUsers import users_bp
app.register_blueprint(users_bp)

# Registrar el blueprint de endpoints de las unidades
from endpoints.epUnits import units_bp
app.register_blueprint(units_bp)

# Registrar el blueprint de endpoints de las preguntas
from endpoints.epQuestions import questions_bp
app.register_blueprint(questions_bp)

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "¡Hola desde la API Flask!"})

if __name__ == '__main__':
    app.run(debug=True)
