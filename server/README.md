# Video Emotions server
contains back-end stack client as Dart

## HTTP endpoints

### PUT /apit/image
image (request body)
sessionId
time


{
  sessionId:"",
  time:"ISO8001",
  image:"Base64"
}

(used by recording-client)

### GET /api/sessions

(used by dashboard-client)

## prepare
`brew tap dart-lang/dart`
`brew install dart`
`pub get`

## start
`dart bin/server.dart`