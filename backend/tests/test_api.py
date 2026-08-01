"""API contract tests covering validation, privacy, and reviewer authentication."""


def test_health_reports_database_readiness(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_application_is_created_as_pending(client, application_payload):
    response = client.post("/api/applications", json=application_payload)
    body = response.get_json()
    assert response.status_code == 201
    assert body["syncStatus"] == "pending"
    assert body["applicationId"]


def test_domain_and_portfolio_rules_return_field_errors(client, application_payload):
    application_payload["collegeEmail"] = "applicant@gmail.com"
    application_payload["secondaryPortfolio"] = "Technical team"
    response = client.post("/api/applications", json=application_payload)
    body = response.get_json()
    assert response.status_code == 400
    assert "collegeEmail" in body["error"]["fields"]
    assert "secondaryPortfolio" in body["error"]["fields"]


def test_email_and_phone_cannot_be_reused(client, application_payload):
    assert client.post("/api/applications", json=application_payload).status_code == 201
    duplicate = application_payload | {"rollNumber": "CSBS-2026-002"}
    response = client.post("/api/applications", json=duplicate)
    assert response.status_code == 409
    assert response.get_json()["error"]["code"] == "duplicate_application"


def test_reviewer_data_is_not_public_and_requires_login(client, application_payload):
    client.post("/api/applications", json=application_payload)
    assert client.get("/api/admin/applications").status_code == 401

    login = client.post("/api/admin/session", json={"password": "reviewer-password"})
    token = login.get_json()["token"]
    response = client.get("/api/admin/applications", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.get_json()["pagination"]["total"] == 1


def test_cors_allows_only_configured_frontend_origin(client):
    response = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
