import secrets
import string

def generate_random_password(length=12):
    # Definir el conjunto de caracteres permitidos: letras y dígitos
    characters = string.ascii_letters + string.digits
    # Generar una contraseña aleatoria utilizando el conjunto definido
    password = ''.join(secrets.choice(characters) for _ in range(length))
    return password