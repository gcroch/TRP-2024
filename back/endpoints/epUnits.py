##aca van los endpoints que tienen 
# que ver con las unidades como por ejemplo
# matematicas, geografia, etc.
from flask import Blueprint, request, jsonify
from bson import ObjectId
from extensions import mongo

units_bp = Blueprint('units', __name__)

@units_bp.route('/units', methods=['GET'])
def get_units():
    units_cursor = mongo.db.units.find()
    units_list = []
    for unit in units_cursor:
        unit['_id'] = str(unit['_id'])
        units_list.append(unit)
    return jsonify(units_list), 200

@units_bp.route('/units', methods=['POST'])
def create_unit():
    data = request.get_json()
    title = data.get("title")
    level = data.get("level")
    
    if not title or level is None:
        return jsonify({"error": "Faltan datos"}), 400

    result = mongo.db.units.insert_one({
        "title": title,
        "level": level
    })

    return jsonify({
        "message": "Unidad creada exitosamente",
        "unit_id": str(result.inserted_id)
    }), 201

@units_bp.route('/units/<unit_id>', methods=['PUT'])
def update_unit(unit_id):
    data = request.get_json()
    update_data = {}
    
    if "title" in data:
        update_data["title"] = data["title"]
    if "level" in data:
        update_data["level"] = data["level"]

    if not update_data:
        return jsonify({"error": "No hay datos para actualizar"}), 400

    result = mongo.db.units.update_one(
        {"_id": ObjectId(unit_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Unidad no encontrada"}), 404

    return jsonify({"message": "Unidad actualizada exitosamente"}), 200

@units_bp.route('/units/<unit_id>', methods=['DELETE'])
def delete_unit(unit_id):
    result = mongo.db.units.delete_one({"_id": ObjectId(unit_id)})
    
    if result.deleted_count == 0:
        return jsonify({"error": "Unidad no encontrada"}), 404

    return jsonify({"message": "Unidad eliminada exitosamente"}), 200
@units_bp.route('/units/<unit_id>', methods=['GET'])
def get_unit_by_id(unit_id):
    try:
        obj_id = ObjectId(unit_id)
    except Exception:
        return jsonify({"error": "ID inválido"}), 400

    unit = mongo.db.units.find_one({"_id": obj_id})
    if not unit:
        return jsonify({"error": "Unidad no encontrada"}), 404

    # convertir ObjectId a string
    unit['_id'] = str(unit['_id'])
    return jsonify(unit), 200