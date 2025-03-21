from flask import Blueprint, request, jsonify
from bson import ObjectId
from extensions import mongo

questions_bp = Blueprint('questions', __name__)

@questions_bp.route('/questions', methods=['POST'])
def create_question():
    """
    Crea una nueva pregunta.
    Se espera recibir un JSON con:
      - type: "OpenEntry" o "Choice"
      - body: El enunciado de la pregunta
      - exp: Puntos de experiencia (int)
      - unit_id: El _id de la unidad asociada (como cadena)
      - expectedAnswer: (obligatorio si type == "OpenEntry")
      - options: (obligatorio si type == "Choice", debe ser una lista de objetos con 'body' y 'isCorrect')
    """
    data = request.get_json()
    qtype = data.get("type")
    body = data.get("body")
    exp = data.get("exp")
    unit_id = data.get("unit_id")
    
    if not qtype or not body or exp is None or not unit_id:
        return jsonify({"error": "Faltan datos"}), 400

    try:
        unit_object_id = ObjectId(unit_id)
    except Exception as e:
        return jsonify({"error": "unit_id no es válido"}), 400

    # Verificar que la unidad exista
    if not mongo.db.units.find_one({"_id": unit_object_id}):
        return jsonify({"error": "La unidad especificada no existe"}), 400

    question = {
        "type": qtype,
        "body": body,
        "exp": exp,
        "unit_id": unit_object_id
    }
    if qtype == "OpenEntry":
        expected_answer = data.get("expectedAnswer")
        if not expected_answer:
            return jsonify({"error": "Falta expectedAnswer para preguntas de tipo OpenEntry"}), 400
        question["expectedAnswer"] = expected_answer
    elif qtype == "Choice":
        options = data.get("options")
        if not options or not isinstance(options, list):
            return jsonify({"error": "Falta o no es válida la lista de opciones para preguntas de tipo Choice"}), 400
        question["options"] = options
    else:
        return jsonify({"error": "Tipo de pregunta no soportado"}), 400

    result = mongo.db.questions.insert_one(question)
    return jsonify({
        "message": "Pregunta creada exitosamente",
        "question_id": str(result.inserted_id)
    }), 201

@questions_bp.route('/questions', methods=['GET'])
def get_questions():
    """
    Lista todas las preguntas.
    Opcionalmente se puede filtrar por unit_id mediante un parámetro de consulta.
    """
    query = {}
    unit_id = request.args.get('unit_id')
    if unit_id:
        try:
            query['unit_id'] = ObjectId(unit_id)
        except Exception as e:
            return jsonify({"error": "unit_id inválido"}), 400

    questions_cursor = mongo.db.questions.find(query)
    questions = []
    for q in questions_cursor:
        q['_id'] = str(q['_id'])
        q['unit_id'] = str(q['unit_id'])
        questions.append(q)
    return jsonify(questions), 200

@questions_bp.route('/questions/<question_id>', methods=['GET'])
def get_question(question_id):
    """
    Obtiene una pregunta específica a partir de su _id.
    """
    try:
        q_id = ObjectId(question_id)
    except Exception as e:
        return jsonify({"error": "question_id inválido"}), 400
    question = mongo.db.questions.find_one({"_id": q_id})
    if not question:
        return jsonify({"error": "Pregunta no encontrada"}), 404
    question['_id'] = str(question['_id'])
    question['unit_id'] = str(question['unit_id'])
    return jsonify(question), 200

@questions_bp.route('/questions/<question_id>', methods=['PUT'])
def update_question(question_id):
    """
    Actualiza una pregunta.
    Se espera un JSON con los campos que se deseen modificar:
      - type, body, exp, unit_id, expectedAnswer y/o options.
    Si se actualiza el unit_id, se verifica que la unidad exista.
    """
    try:
        q_id = ObjectId(question_id)
    except Exception as e:
        return jsonify({"error": "question_id inválido"}), 400

    data = request.get_json()
    update_fields = {}
    
    if "type" in data:
        update_fields["type"] = data["type"]
    if "body" in data:
        update_fields["body"] = data["body"]
    if "exp" in data:
        update_fields["exp"] = data["exp"]
    if "unit_id" in data:
        try:
            new_unit_id = ObjectId(data["unit_id"])
            update_fields["unit_id"] = new_unit_id
            # Verificar que la unidad exista
            if not mongo.db.units.find_one({"_id": new_unit_id}):
                return jsonify({"error": "La unidad especificada no existe"}), 400
        except Exception as e:
            return jsonify({"error": "unit_id inválido"}), 400
    if "expectedAnswer" in data:
        update_fields["expectedAnswer"] = data["expectedAnswer"]
    if "options" in data:
        update_fields["options"] = data["options"]

    if not update_fields:
        return jsonify({"error": "No se han enviado datos para actualizar"}), 400

    result = mongo.db.questions.update_one(
        {"_id": q_id},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Pregunta no encontrada"}), 404
    return jsonify({"message": "Pregunta actualizada exitosamente"}), 200

@questions_bp.route('/questions/<question_id>', methods=['DELETE'])
def delete_question(question_id):
    """
    Elimina una pregunta.
    """
    try:
        q_id = ObjectId(question_id)
    except Exception as e:
        return jsonify({"error": "question_id inválido"}), 400
    result = mongo.db.questions.delete_one({"_id": q_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Pregunta no encontrada"}), 404
    return jsonify({"message": "Pregunta eliminada exitosamente"}), 200
