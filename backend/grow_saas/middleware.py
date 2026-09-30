class DevTenantMiddleware:
    """
    Single-tenant app. This middleware is kept as a no-op for backward compatibility.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)
