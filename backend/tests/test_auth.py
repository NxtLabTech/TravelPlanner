def test_protected_api_requires_authentication(tmp_path):
    from app import create_app

    client = create_app(str(tmp_path / "auth.db")).test_client()
    response = client.get("/api/trips")
    assert response.status_code == 401
    assert response.get_json() == {"error": "Authentication required"}


def test_register_login_and_logout(client):
    client.post("/api/auth/logout")
    response = client.post(
        "/api/auth/register",
        json={"username": "alice", "password": "secure-password"},
    )
    assert response.status_code == 201
    assert response.get_json() == {"username": "alice"}
    assert client.get("/api/auth/me").get_json() == {"username": "alice"}

    client.post("/api/auth/logout")
    assert client.get("/api/auth/me").status_code == 401
    response = client.post(
        "/api/auth/login",
        json={"username": "alice", "password": "secure-password"},
    )
    assert response.status_code == 200
    assert response.get_json() == {"username": "alice"}


def test_registration_stores_a_password_hash(client):
    client.post(
        "/api/auth/register",
        json={"username": "hashed-user", "password": "secure-password"},
    )
    with client.application.app_context():
        from database import get_db

        password_hash = get_db().execute(
            "SELECT password_hash FROM users WHERE username = ?", ("hashed-user",)
        ).fetchone()["password_hash"]
    assert password_hash != "secure-password"
    assert password_hash.startswith("scrypt:")


def test_registration_validates_password_and_duplicate_username(client):
    assert client.post(
        "/api/auth/register",
        json={"username": "short", "password": "short"},
    ).status_code == 400
    assert client.post(
        "/api/auth/register",
        json={"username": "test-user", "password": "another-password"},
    ).status_code == 409


def test_users_cannot_access_each_others_trips(tmp_path):
    from app import create_app

    app = create_app(str(tmp_path / "ownership.db"))
    alice = app.test_client()
    bob = app.test_client()
    alice.post("/api/auth/register", json={"username": "alice", "password": "secure-password"})
    bob.post("/api/auth/register", json={"username": "bob", "password": "secure-password"})
    trip = alice.post("/api/trips", json={
        "name": "Alice Trip",
        "destination": "Goa",
        "start_date": "2026-12-01",
        "end_date": "2026-12-05",
    }).get_json()

    assert bob.get(f"/api/trips/{trip['id']}").status_code == 404
    assert bob.put(f"/api/trips/{trip['id']}", json={}).status_code == 404
    assert bob.delete(f"/api/trips/{trip['id']}").status_code == 404
    assert bob.get("/api/trips").get_json()["total"] == 0
