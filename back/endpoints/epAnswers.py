from flask import Blueprint, request, jsonify
from bson import ObjectId
from extensions import mongo
from flask_jwt_extended import jwt_required, get_jwt_identity

answers_bp = Blueprint('answers', __name__)

@answers_bp.route('/answers', methods=['POST'])
def create_answer():
    """
    Crea una nueva respuesta y, si es correcta, calcula la exp neta
    descontando penalizaciones por hints usados.
    Se espera recibir un JSON con:
      - question_id (string)
      - user_id (string)
      - body: para OpenEntry  OR  selectedOption: para Choice
    """
    data = request.get_json()
    qid = data.get("question_id")
    uid = data.get("user_id")
    body = data.get("body")
    selected = data.get("selectedOption")

    # 1) Validaciones básicas
    if not qid or not uid:
        return jsonify({"error": "Faltan question_id o user_id"}), 400
    if (body is None and selected is None) or (body is not None and selected is not None):
        return jsonify({"error": "Proporciona solo 'body' o 'selectedOption'"}), 400

    # 2) Conversión a ObjectId
    try:
        q_obj = ObjectId(qid)
        u_obj = ObjectId(uid)
    except:
        return jsonify({"error": "ID inválido"}), 400

    # 3) Inserto el registro de la respuesta
    answer_doc = {"question_id": q_obj, "user_id": u_obj}
    if body is not None:
        answer_doc["body"] = body
    else:
        answer_doc["selectedOption"] = selected

    ins = mongo.db.answers.insert_one(answer_doc)

    # 4) Determino si la respuesta es correcta
    q = mongo.db.questions.find_one({"_id": q_obj})
    is_correct = False
    if not q:
        # (en principio no debería pasar)
        return jsonify({"error": "Pregunta no encontrada"}), 404

    if body is not None:
        # comparación case-insensitive
        is_correct = (body.strip().lower() == q.get("expectedAnswer", "").strip().lower())
    else:
        # encuentro la opción dentro de q["options"]
        for opt in q.get("options", []):
            if opt["body"] == selected and opt.get("isCorrect"):
                is_correct = True
                break

    exp_awarded = 0

    if is_correct:
        # 5) Calculo penalizaciones
        base_exp = q.get("exp", 0)
        help_doc = mongo.db.question_helps.find_one({
            "user_id": u_obj,
            "question_id": q_obj
        }) or {}

        total_penalty = 0.0
        if help_doc.get("usedHelp1"):
            total_penalty += q.get("hint1", {}).get("penalty", 0)
        if help_doc.get("usedHelp2"):
            total_penalty += q.get("hint2", {}).get("penalty", 0)
        total_penalty = min(total_penalty, 1.0)

        # exp neta
        exp_awarded = int(base_exp * (1 - total_penalty))

        # 6) Actualizo la exp del usuario
        mongo.db.users.update_one(
            {"_id": u_obj},
            {"$inc": {"exp": exp_awarded}}
        )

    # 7) Respondo al cliente
    return jsonify({
        "answer_id": str(ins.inserted_id),
        "correct": is_correct,
        "expAwarded": exp_awarded
    }), 201

@answers_bp.route('/answers', methods=['GET'])
@jwt_required()
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
