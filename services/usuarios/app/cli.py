import json
from pathlib import Path
from typing import Optional

import typer
from app.core.config import settings as app_settings
from app.core.db import create_db_and_tables, get_db_session
from app.core.security import get_password_hash
from app.main import app as fastapi_app
from app.models import User
from rich import print, print_json
from rich.console import Console
from rich.table import Table
from sqlmodel import select
from typing_extensions import Annotated

app = typer.Typer(
    name="usuarios",
    help="CLI para la gestión del microservicio de usuarios",
    no_args_is_help=True,
)


@app.command()
def ls():
    """
    Lista los usuarios existentes
    """
    table = Table(title="Usuarios")
    table.add_column("User ID", style="cyan")
    table.add_column("Active", style="magenta")
    table.add_column("Hashed Password", style="yellow")

    session = next(get_db_session())
    statement = select(User)
    users = session.exec(statement).all()

    for user in users:
        table.add_row(user.user_id, str(user.is_active), user.hashed_password)

    console = Console()
    console.print(table)


def _query_user(username: str):
    """
    Comprueba si un usuario existe
    """
    session = next(get_db_session())
    statement = select(User).where(User.user_id == username)
    return session.exec(statement).first()


@app.command()
def add():
    """
    Añade un nuevo usuario
    """
    username = typer.prompt("Nombre del usuario")
    session = next(get_db_session())

    if _query_user(username):
        print(f"[red]Error: El usuario {username} ya existe[/red]")
        return

    password = typer.prompt("Contraseña del usuario", hide_input=True)
    hashed_password = get_password_hash(password)
    user = User(user_id=username, hashed_password=hashed_password)
    session.add(user)
    session.commit()
    print(f"Usuario {username} creado exitosamente")


@app.command()
def update():
    """
    Actualiza un usuario
    """
    username = typer.prompt("Nombre del usuario")
    session = next(get_db_session())

    # Get user from the same session
    statement = select(User).where(User.user_id == username)
    user = session.exec(statement).first()

    if not user:
        print(f"[red]Error: El usuario {username} no existe[/red]")
        return

    # Get new password
    password = typer.prompt("Nueva contraseña del usuario", hide_input=True)
    hashed_password = get_password_hash(password)
    user.hashed_password = hashed_password
    session.commit()
    print(f"Usuario {username} actualizado exitosamente")


@app.command()
def delete():
    """
    Elimina un usuario
    """
    username = typer.prompt("Nombre del usuario")
    session = next(get_db_session())
    # Check if user exists
    statement = select(User).where(User.user_id == username)
    user = session.exec(statement).first()
    if not user:
        print(f"[red]Error: El usuario {username} no existe[/red]")
        return

    # Delete user
    session.delete(user)
    session.commit()
    print(f"Usuario {username} eliminado exitosamente")


@app.command()
def settings():
    """
    Muestra la configuración actual
    """

    table = Table(title="Configuración")
    table.add_column("Setting", style="cyan")
    table.add_column("Value", style="magenta")

    for key, value in app_settings.model_dump().items():
        table.add_row(str(key), str(value))

    console = Console()
    console.print(table)


@app.command()
def init_db():
    """
    Inicializa la base de datos
    """
    create_db_and_tables()
    print(
        f"Base de datos inicializada en [cyan bold]{app_settings.USUARIOS_DB_URI}[/cyan bold]"
    )


@app.command()
def dump_openapi():
    """
    Vuelca la configuracion del API de microservicio de usuarios en formato json/OpenApi
    """
    openapi_schema = fastapi_app.openapi()
    print_json(data=openapi_schema)
