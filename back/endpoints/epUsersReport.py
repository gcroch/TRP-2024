from flask import Blueprint, request, jsonify
from bson import ObjectId
from extensions import mongo
from flask_jwt_extended import jwt_required
# Asegúrate de tener importado ObjectId para convertir strings a ObjectId

report_bp = Blueprint('report', __name__)

@report_bp.route('/users/report', methods=['GET'])
# @jwt_required()
def user_report():
    """
    Genera un informe de respuestas.
    - Si se envía el parámetro de consulta `user_id`, genera el informe solo para ese usuario.
    - Si no se envía, genera el informe para todos los usuarios.
    
    El informe de cada usuario contiene:
      - id, name y lastname.
      - Una lista de preguntas respondidas, cada una con:
          - los datos de la pregunta (por ejemplo, _id, type, body, exp, etc.)
          - la respuesta dada por el usuario.
    """
    user_id = request.args.get('user_id')
    report = []

    def build_user_report(user):
        # Obtiene todas las respuestas del usuario y anida la información de la pregunta
        user_obj_id = user["_id"]
        answers_cursor = mongo.db.answers.find({"user_id": user_obj_id})
        questions_list = []
        for answer in answers_cursor:
            q_id = answer.get("question_id")
            question = mongo.db.questions.find_one({"_id": q_id})
            if question:
                question["_id"] = str(question["_id"])
            answer["_id"] = str(answer["_id"])
            answer["question_id"] = str(q_id)
            questions_list.append({
                "question": question,
                "answer": answer
            })
        return {
            "user": {
                "id": str(user_obj_id),
                "name": user.get("name"),
                "lastname": user.get("lastname")
            },
            "questions_answered": questions_list
        }

    if user_id:
        # Informe para un usuario específico
        try:
            user_obj_id = ObjectId(user_id)
        except Exception:
            return jsonify({"error": "user_id inválido"}), 400

        user = mongo.db.users.find_one({"_id": user_obj_id})
        if not user:
            return jsonify({"error": "Usuario no encontrado"}), 404
        report = build_user_report(user)
    else:
        # Informe para todos los usuarios
        users_cursor = mongo.db.users.find()
        for user in users_cursor:
            report.append(build_user_report(user))

    return jsonify(report), 200