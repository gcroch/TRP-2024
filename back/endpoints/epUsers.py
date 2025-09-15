import io, csv
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity
from extensions import mongo
from utils import generate_random_password
from flask_mail import Mail, Message
from bson import ObjectId
from werkzeug.utils import secure_filename

mail = Mail()
users_bp = Blueprint('users', __name__)

# -------------------------------
# GET /users (sin JWT, restringido por CORS/origin en app.py)
# -------------------------------
@users_bp.route('/users', methods=['GET'])
def get_users():
    users = mongo.db.users.find()
    all_users_data = []

    # Precargo todas las preguntas en un dict
    questions = {q["_id"]: q for q in mongo.db.questions.find()}

    for user in users:
        totalExp = 0
        # Obtengo todas las respuestas de este usuario
        answers = mongo.db.answers.find({"user_id": user["_id"]})

        for ans in answers:
            q = questions.get(ans["question_id"])
            if not q:
                continue

            # 1) Verifico si la respuesta es correcta
            is_correct = False
            if "selectedOption" in ans:
                try:
                    idx = int(ans["selectedOption"])
                    opts = q.get("options", [])
                    if 0 <= idx < len(opts) and opts[idx].get("isCorrect"):
                        is_correct = True
                except (ValueError, IndexError):
                    continue
            elif "body" in ans:
                if validate_open_entry_answer(q, ans["body"]):
                    is_correct = True

            if not is_correct:
                continue

            # 2) Consulto si usó hints para esta pregunta
            help_doc = mongo.db.question_helps.find_one({
                "user_id": user["_id"],
                "question_id": q["_id"]
            }) or {}

            # 3) Sumo penalizaciones
            total_penalty = 0.0
            if help_doc.get("usedHelp1"):
                total_penalty += q.get("hint1", {}).get("penalty", 0)
            if help_doc.get("usedHelp2"):
                total_penalty += q.get("hint2", {}).get("penalty", 0)
            total_penalty = min(total_penalty, 1.0)

            # 4) Calculo experiencia neta y acumulo
            base_exp = q.get("exp", 0)
            awarded = int(base_exp * (1 - total_penalty))
            totalExp += awarded

        all_users_data.append({
            "user_id": str(user["_id"]),
            "DNI": user.get("DNI"),
            "name": user.get("name"),
            "lastname": user.get("lastname"),
            "email": user.get("email"),
            "role": user.get("role"),
            "exp": totalExp
        })

    return jsonify(all_users_data), 200

# -------------------------------
# Registro y Login
# -------------------------------
@users_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get("DNI")
    name = data.get("name")
    lastname = data.get("lastname")
    email = data.get("email")
    password = generate_random_password(12)

    if not username or not password:
        return jsonify({"error": "Faltan datos"}), 400

    if mongo.db.users.find_one({"DNI": username}):
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
    msg.body = f"Hola {name},\n\nTu DNI es: {username}\nTu contraseña es: {password}\n\n¡Saludos!"
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

# -------------------------------
# Endpoints protegidos con JWT
# -------------------------------
@users_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    current_dni = get_jwt_identity()
    user = mongo.db.users.find_one({"DNI": current_dni})
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    totalExp = 0
    questions = {q["_id"]: q for q in mongo.db.questions.find()}
    answers = mongo.db.answers.find({"user_id": user["_id"]})

    for ans in answers:
        q = questions.get(ans["question_id"])
        if not q:
            continue

        is_correct = False
        if "selectedOption" in ans:
            try:
                idx = int(ans["selectedOption"])
                opts = q.get("options", [])
                if 0 <= idx < len(opts) and opts[idx].get("isCorrect"):
                    is_correct = True
            except (ValueError, IndexError):
                continue
        elif "body" in ans:
            if validate_open_entry_answer(q, ans["body"]):
                is_correct = True

        if not is_correct:
            continue

        help_doc = mongo.db.question_helps.find_one({
            "user_id": user["_id"],
            "question_id": q["_id"]
        }) or {}

        total_penalty = 0.0
        if help_doc.get("usedHelp1"):
            total_penalty += q.get("hint1", {}).get("penalty", 0)
        if help_doc.get("usedHelp2"):
            total_penalty += q.get("hint2", {}).get("penalty", 0)
        total_penalty = min(total_penalty, 1.0)

        base_exp = q.get("exp", 0)
        awarded = int(base_exp * (1 - total_penalty))
        totalExp += awarded

    profile = {
        "userId": str(user["_id"]),
        "DNI": user["DNI"],
        "name": user["name"],
        "lastname": user["lastname"],
        "email": user["email"],
        "role": user.get("role", ""),
        "exp": totalExp,
    }
    return jsonify(profile), 200

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_dni = get_jwt_identity()
    data = request.get_json()

    if "currentPassword" not in data or "password" not in data:
        return jsonify({"error": "Debe proporcionar la contraseña actual y la nueva"}), 400

    current_password = data["currentPassword"]
    new_password = data["password"]

    user = mongo.db.users.find_one({"DNI": current_dni})
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    if not check_password_hash(user.get("password", ""), current_password):
        return jsonify({"error": "Contraseña actual incorrecta"}), 401

    mongo.db.users.update_one(
        {"DNI": current_dni},
        {"$set": {"password": generate_password_hash(new_password)}}
    )

    return jsonify({"message": "Usuario actualizado exitosamente"}), 200

@users_bp.route('/user-progress', methods=['GET'])
@jwt_required()
def get_user_progress():
    current_dni = get_jwt_identity()
    user = mongo.db.users.find_one({"DNI": current_dni})
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    user_id = user["_id"]
    answers = mongo.db.answers.find({"user_id": user_id})
    questions = {q["_id"]: q for q in mongo.db.questions.find()}
    progress_by_unit = {}

    for answer in answers:
        question = questions.get(answer.get("question_id"))
        if not question:
            continue

        unit_id = str(question.get("unit_id"))
        is_correct = False
        if "selectedOption" in answer:
            try:
                idx = int(answer["selectedOption"])
                options = question.get("options", [])
                if 0 <= idx < len(options):
                    is_correct = options[idx].get("isCorrect", False)
            except (ValueError, IndexError):
                continue
        elif "body" in answer:
            is_correct = answer["body"].strip().lower() == question.get("expectedAnswer", "").strip().lower()

        if is_correct:
            progress_by_unit.setdefault(unit_id, []).append(str(question["_id"]))

    return jsonify(progress_by_unit), 200

# -------------------------------
# Utils
# -------------------------------
def validate_open_entry_answer(question, user_answer):
    correct_answer = question.get("expectedAnswer", "").strip().lower()
    return user_answer.strip().lower() == correct_answer
