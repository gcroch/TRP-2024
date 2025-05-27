# epQuestions.py

import os
from flask import Blueprint, request, jsonify, url_for, current_app, send_from_directory
from flask_jwt_extended import jwt_required
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename
from bson import ObjectId
from extensions import mongo

questions_bp = Blueprint('questions', __name__)
# Habilita CORS y OPTIONS en todas las rutas de este blueprint 
CORS(questions_bp, resources={r"/questions/*": {"origins": "*"}})

# Define UPLOAD_FOLDER relativo al archivo, no a current_app :contentReference[oaicite:2]{index=2}
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'img')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@questions_bp.route('/questions', methods=['POST'])
@cross_origin()
def create_question():
    data = request.get_json() or {}

    # Validaciones mínimas
    required_fields = ["type", "body", "exp", "unit_id"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Falta el campo requerido: {field}"}), 400

    try:
        unit_id = ObjectId(data["unit_id"])
    except:
        return jsonify({"error": "unit_id inválido"}), 400

    question = {
        "type": data["type"],
        "body": data["body"],
        "exp": data["exp"],
        "unit_id": unit_id
    }

    if data.get("imagePath"):
        question["imagePath"] = data["imagePath"]

    # Campos específicos según tipo de pregunta
    if data["type"] == "Choice":
        if "options" not in data or not isinstance(data["options"], list):
            return jsonify({"error": "Faltan las opciones para pregunta tipo Choice"}), 400
        question["options"] = data["options"]
    elif data["type"] == "OpenEntry":
        if "expectedAnswer" not in data:
            return jsonify({"error": "Falta la respuesta esperada para pregunta tipo OpenEntry"}), 400
        question["expectedAnswer"] = data["expectedAnswer"]
    else:
        return jsonify({"error": "Tipo de pregunta no válido"}), 400

    # Procesar los hints, si vienen
    for i in (1,2):
        key = f"hint{i}"
        if key in data:
            if not validate_hint(data[key]):
                return jsonify({"error": f"{key} inválido. Debe tener 'text' y 'penalty' entre 0 y 1"}), 400
            question[key] = {
                "text": data[key]["text"].strip(),
                "penalty": float(data[key]["penalty"])
            }



    res = mongo.db.questions.insert_one(question)
    return jsonify({"message": "Pregunta creada", "question_id": str(res.inserted_id)}), 201

@questions_bp.route('/questions', methods=['GET'])
@cross_origin()
def get_questions():
    query = {}
    uid = request.args.get('unit_id')
    if uid:
        try:
            query['unit_id'] = ObjectId(uid)
        except:
            return jsonify({"error":"unit_id inválido"}), 400
    out = []
    for q in mongo.db.questions.find(query):
        q['_id'], q['unit_id'] = str(q['_id']), str(q['unit_id'])
        if "imagePath" in q:
            q['imagePath'] = q['imagePath']
        out.append(q)
    return jsonify(out), 200

@questions_bp.route('/questions/<question_id>', methods=['GET'])
@cross_origin()
def get_question(question_id):
    try:
        q_id = ObjectId(question_id)
    except:
        return jsonify({"error":"question_id inválido"}), 400
    q = mongo.db.questions.find_one({"_id": q_id})
    if not q:
        return jsonify({"error":"Pregunta no encontrada"}), 404
    q['_id'], q['unit_id'] = str(q['_id']), str(q['unit_id'])
    if "imagePath" in q:
        q['imagePath'] = q['imagePath']
    return jsonify(q), 200

@questions_bp.route('/questions/<question_id>', methods=['PUT'])
@cross_origin()
def update_question(question_id):
    try:
        q_id = ObjectId(question_id)
    except:
        return jsonify({"error":"question_id inválido"}), 400

    data = request.get_json() or {}
    updates = {}
    # Campos JSON + imagePath :contentReference[oaicite:4]{index=4}
    for f in ("type","body","exp","expectedAnswer","options","imagePath"):
        if f in data:
            updates[f] = data[f]

    # actualizar hints si vienen
    for i in (1,2):
        key = f"hint{i}"
        if key in data:
            if not validate_hint(data[key]):
                return jsonify({"error": f"{key} inválido"}), 400
            updates[key] = {
                "text": data[key]["text"].strip(),
                "penalty": float(data[key]["penalty"])
            }
    if "unit_id" in data:
        try:
            nu = ObjectId(data["unit_id"])
            if not mongo.db.units.find_one({"_id":nu}):
                return jsonify({"error":"Unidad no existe"}), 400
            updates["unit_id"] = nu
        except:
            return jsonify({"error":"unit_id inválido"}), 400

    if not updates:
        return jsonify({"error":"Nada que actualizar"}), 400

    res = mongo.db.questions.update_one({"_id":q_id}, {"$set":updates})
    if res.matched_count == 0:
        return jsonify({"error":"Pregunta no encontrada"}), 404
    return jsonify({"message":"Actualizada exitosamente"}), 200

@questions_bp.route('/questions/<question_id>', methods=['DELETE'])
@cross_origin()
def delete_question(question_id):
    try:
        q_id = ObjectId(question_id)
    except:
        return jsonify({"error":"question_id inválido"}), 400
    res = mongo.db.questions.delete_one({"_id":q_id})
    if res.deleted_count == 0:
        return jsonify({"error":"Pregunta no encontrada"}), 404
    return jsonify({"message":"Eliminada exitosamente"}), 200

@questions_bp.route('/questions/<id>/image', methods=['POST','OPTIONS'])
@cross_origin(headers=['Content-Type','Authorization'])
@jwt_required()
def upload_question_image(id):
    # Atiende preflight OPTIONS 
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    if 'image' not in request.files:
        return jsonify({"error":"No se envió imagen"}), 400
    file = request.files['image']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({"error":"Archivo no válido"}), 400

    filename = secure_filename(file.filename)  # sanitiza nombre :contentReference[oaicite:5]{index=5}
    file.save(os.path.join(UPLOAD_FOLDER, filename))

    mongo.db.questions.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"imagePath": filename}}
    )

    public_url = url_for('static', filename=f'../img/{filename}', _external=True)
    return jsonify({"imageUrl": public_url}), 200
@questions_bp.route("/back/img/<filename>")
def serve_question_image(filename):
    # Ruta absoluta al directorio donde están las imágenes
    image_dir = os.path.join(current_app.root_path, "img")
    return send_from_directory(image_dir, filename)


def validate_hint(h):
    """Devuelve True si h tiene {'text': str, 'penalty': float entre 0 y 1}"""
    return (
        isinstance(h, dict)
        and isinstance(h.get("text"), str)
        and isinstance(h.get("penalty"), (int, float))
        and 0 <= h["penalty"] <= 1
    )

