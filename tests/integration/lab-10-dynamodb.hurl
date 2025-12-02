# tests/integration/lab-10-dynamodb.hurl

# 1. POST a JSON fragment
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
```json
{ "service": "DynamoDB" }
```

HTTP/1.1 201
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# 2. GET fragment1 info
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.fragment.id" == {{fragment1_id}}
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 26

# 3. POST a Markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
`DynamoDB is **great**.`

HTTP/1.1 201
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# 4. GET fragment2 info
GET {{fragment2_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.fragment.id" == {{fragment2_id}}
jsonpath "$.fragment.type" == "text/markdown"

# 5. GET all fragments (ids only)
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.fragments" contains {{fragment1_id}}
jsonpath "$.fragments" contains {{fragment2_id}}

# 6. DELETE fragment1
DELETE {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

# 7. Try to GET deleted fragment1
GET {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404

# 8. GET all fragments again - fragment1 should be gone
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.fragments" not contains {{fragment1_id}}
jsonpath "$.fragments" contains {{fragment2_id}}
