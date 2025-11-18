# tests/integration/post-fragments-unauthenticated.hurl
# Confirm that posting a fragment when not authenticated produces a 401 error

POST http://localhost:8080/v1/fragments
Content-Type: text/plain
`This should be unauthorized`

# We expect to get back an HTTP 401 response
HTTP/1.1 401

# Verify we get an error response
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401
jsonpath "$.error.message" == "Unauthorized"
