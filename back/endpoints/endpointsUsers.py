from flask import Blueprint, request, jsonify,current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity
from extensions import mongo
from utils import generate_random_password
from flask_mail import Mail, Message

users_bp = Blueprint('users', __name__)

@users_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get("DNI")
    name = data.get("name")
    lastname = data.get("lastname")
    email = data.get("email")
    password = generate_random_password(12)
    print(password)
    if not username or not password:
        return jsonify({"error": "Faltan datos"}), 400

    if mongo.db.users.find_one({"username": username}):
        return jsonify({"error": "El usuario ya existe"}), 409

    hashed_password = generate_password_hash(password)
    mongo.db.users.insert_one({
        "DNI": username,
        "name": name,
        "lastname": lastname,
        "email": email,
        "password": hashed_password,
        "role": "user" 
    })

    msg = Message("Tu contraseña de registro", recipients=[email])
    msg.body = f"Hola {name},\n\nTu contraseña para iniciar sesión es: {password}\n\n¡Saludos!"

    current_app.extensions['mail'].send(msg)

    return jsonify({"message": "Usuario registrado exitosamente. Se ha enviado un correo con la contraseña."}), 201

@users_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get("DNI")
    password = data.get("password")
    
    user = mongo.db.users.find_one({"DNI": username})
    
    if user and check_password_hash(user["password"], password):
        access_token = create_access_token(identity=username)
        return jsonify({"access_token": access_token}), 200
    else:
        return jsonify({"error": "Credenciales inválidas"}), 401

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    current_username = get_jwt_identity()
    
    user = mongo.db.users.find_one({"DNI": current_username})
    if user:
        user_data = {
            "DNI": user.get("DNI"),
            "name": user.get("name"),
            "lastname": user.get("lastname"),
            "email": user.get("email"),
            "role": user.get("role"),
        }
        return jsonify(user_data), 200
    return jsonify({"error": "Usuario no encontrado"}), 404
