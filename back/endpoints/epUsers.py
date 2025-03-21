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

    msg = Message("Credenciales para el taller de resolución de problemas", recipients=[email])
    text_body = f"Hola {name},\n\nTu DNI para iniciar sesión es: {username}\n\nTu contraseña para iniciar sesión es: {password}\n\n¡Saludos!"
    html_body = f"""
    <p>Hola {name},</p>
    <p>Tu DNI para iniciar sesión es: <strong>{username}</strong></p>
    <p>Tu contraseña para iniciar sesión es: <strong>{password}</strong></p>
    <p>¡Saludos!</p>
    <p><u>Atte</u>: <u>Taller</u> <u>de</u> <u>resolución</u> <u>de</u> <u>problemas</u> <u>UNLu</u></p>
    """
    msg.body = text_body
    msg.html = html_body
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

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    # Obtener la identidad (DNI) del usuario logueado desde el token JWT
    current_dni = get_jwt_identity()
    
    # Recoger los datos enviados en el request
    data = request.get_json()
    update_fields = {}

    # Solo se actualizan los campos que se envíen en el request
    if "name" in data:
        update_fields["name"] = data["name"]
    if "lastname" in data:
        update_fields["lastname"] = data["lastname"]
    if "password" in data:
        # Si se envía una nueva contraseña, la hasheamos antes de actualizar
        update_fields["password"] = generate_password_hash(data["password"])
    
    if not update_fields:
        return jsonify({"error": "No se han enviado campos para actualizar"}), 400

    result = mongo.db.users.update_one(
        {"DNI": current_dni},
        {"$set": update_fields}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Usuario no encontrado"}), 404

    return jsonify({"message": "Usuario actualizado exitosamente"}), 200
