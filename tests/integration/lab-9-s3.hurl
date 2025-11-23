# tests/integration/lab-9-s3.hurl

# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
# We're sending a plain text fragment
Content-Type: text/plain
# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1
# Body of the request goes in ```...``` when it's a string
`Hello S3!`

# We expect to get back an HTTP 201
HTTP/1.1 201
# Capture the Location URL into a variable named `url`
[Captures]
url: header "Location"

# Checking the fragment we just posted by its URL
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" matches "^text/plain"
body == "Hello S3!"

# Trying to delete the fragment
DELETE {{url}}
[BasicAuth]
user1@email.com:password1
HTTP/1.1 200

# Trying to get the fragment again after deleting
GET {{url}}
[BasicAuth]
user1@email.com:password1
HTTP/1.1 404
