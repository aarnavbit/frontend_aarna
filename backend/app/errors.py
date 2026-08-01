"""Typed API errors that keep JSON failure responses consistent."""


class ApiError(Exception):
    """An expected request failure with a client-safe error body."""

    def __init__(self, code, message, status_code=400, fields=None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.fields = fields or {}

    def to_dict(self):
        data = {"code": self.code, "message": self.message}
        if self.fields:
            data["fields"] = self.fields
        return data
