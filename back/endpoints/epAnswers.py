from flask import Blueprint, request, jsonify
from bson import ObjectId
from extensions import mongo

answers_bp = Blueprint('answers', __name__)

@answers_bp.route('/answers', methods=['POST'])
def create_answer():
    """
    Crea una nueva respuesta.
    Se espera recibir un JSON con:
      - question_id: (string) ID de la pregunta asociada.
      - user_id: (string) ID del usuario que responde.
      - body: (opcional) Respuesta para preguntas de tipo OpenEntry.
      - selectedOption: (opcional) Respuesta para preguntas de tipo Choice.
    Se debe enviar solo uno de estos dos campos (body o selectedOption).
    """
    data = request.get_json()
    question_id = data.get("question_id")
    user_id = data.get("user_id")
    body = data.get("body")
    selected_option = data.get("selectedOption")

    # Validar que se envíen los identificadores requeridos
    if not question_id or not user_id:
        return jsonify({"error": "Faltan question_id o user_id"}), 400

    # Se debe enviar únicamente body o selectedOption, pero no ambos
    if (body is None and selected_option is None) or (body is not None and selected_option is not None):
        return jsonify({"error": "Se debe proporcionar únicamente un campo: 'body' para preguntas OpenEntry o 'selectedOption' para preguntas Choice"}), 400

    # Convertir los IDs a ObjectId
    try:
        q_obj_id = ObjectId(question_id)
        u_obj_id = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "question_id o user_id inválido"}), 400

    answer = {
        "question_id": q_obj_id,
        "user_id": u_obj_id,
    }
    if body is not None:
        answer["body"] = body
    if selected_option is not None:
        answer["selectedOption"] = selected_option

    result = mongo.db.answers.insert_one(answer)
    return jsonify({
        "message": "Respuesta creada exitosamente",
        "answer_id": str(result.inserted_id)
    }), 201

@answers_bp.route('/answers', methods=['GET'])
def get_answers():
    """
    Obtiene la lista de todas las respuestas.
    Se pueden filtrar opcionalmente por:
      - question_id: mediante un parámetro de consulta.
      - user_id: mediante un parámetro de consulta.
    """
    query = {}
    question_id = request.args.get("question_id")
    user_id = request.args.get("user_id")

    if question_id:
        try:
            query["question_id"] = ObjectId(question_id)
        except Exception:
            return jsonify({"error": "question_id inválido"}), 400

    if user_id:
        try:
            query["user_id"] = ObjectId(user_id)
        except Exception:
            return jsonify({"error": "user_id inválido"}), 400

    cursor = mongo.db.answers.find(query)
    answers = []
    for ans in cursor:
        ans["_id"] = str(ans["_id"])
        ans["question_id"] = str(ans["question_id"])
        ans["user_id"] = str(ans["user_id"])
        answers.append(ans)
    return jsonify(answers), 200

@answers_bp.route('/answers/<answer_id>', methods=['GET'])
def get_answer(answer_id):
    """
    Obtiene una respuesta específica dado su _id.
    """
    try:
        ans_id = ObjectId(answer_id)
    except Exception:
        return jsonify({"error": "answer_id inválido"}), 400

    answer = mongo.db.answers.find_one({"_id": ans_id})
    if not answer:
        return jsonify({"error": "Respuesta no encontrada"}), 404

    answer["_id"] = str(answer["_id"])
    answer["question_id"] = str(answer["question_id"])
    answer["user_id"] = str(answer["user_id"])
    return jsonify(answer), 200

@answers_bp.route('/answers/<answer_id>', methods=['DELETE'])
def delete_answer(answer_id):
    """
    Elimina una respuesta específica dado su _id.
    """
    try:
        ans_id = ObjectId(answer_id)
    except Exception:
        return jsonify({"error": "answer_id inválido"}), 400

    result = mongo.db.answers.delete_one({"_id": ans_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Respuesta no encontrada"}), 404
    return jsonify({"message": "Respuesta eliminada exitosamente"}), 200
