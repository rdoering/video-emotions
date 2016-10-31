// Copyright (c) 2016, rdoering. All rights reserved. Use of this source code

// is governed by a BSD-style license that can be found in the LICENSE file.

import 'dart:io';

import 'package:args/args.dart';
import 'package:shelf/shelf.dart' as shelf;
import 'package:shelf/shelf_io.dart' as io;
import 'package:shelf_cors/shelf_cors.dart' as cors;
import 'package:shelf_route/shelf_route.dart';

//import 'dart:html' as html;
import 'dart:io';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:server/db_config.dart';
import 'package:mongo_dart/mongo_dart.dart';

DbConfigValues config;

void main(List<String> args) {
  var parser = new ArgParser()
    ..addOption('port', abbr: 'p', defaultsTo: '8091');

  var result = parser.parse(args);

  var port = int.parse(result['port'], onError: (val) {
    stdout.writeln('Could not parse port value "$val" into a number.');
    exit(1);
  });

  Router primaryRouter = router();
  Router api = primaryRouter.child('/api');

  config = new DbConfigValues();

  api.post('/image', updateEntry);
  api.get('/user/{name}/{id}', getUser);
  api.get('/sessions-demo', getSessionDemoEntry);
  api.get('/sessions', getSessionEntry);

  var handler = const shelf.Pipeline()
      .addMiddleware(shelf.logRequests())
      .addMiddleware(cors.createCorsHeadersMiddleware())
      .addHandler(primaryRouter.handler);

  io.serve(handler, '0.0.0.0', port).then((server) {
    print('Serving at http://${server.address.host}:${server.port}');
  });
}


updateEntry(shelf.Request request) async {
  Map requestBody = await request.readAsString().then((String body) {
    return body.isNotEmpty ? JSON.decode(body) : {};
  });

  String sessionId = requestBody['sessionId'];
  String time = requestBody['time'];
  String fileBase64Encoded = requestBody["image"];

  var file = BASE64.decode(fileBase64Encoded);

  var msUrl = "https://api.projectoxford.ai/emotion/v1.0/recognize";

  var header = {
    "Content-Type": "application/octet-stream",
    "Ocp-Apim-Subscription-Key": "3540bced93c14791b5aa56bfa07f4278"
  };
  String msResonse = "{}";
  int msResponseCode;
  await http.post(msUrl, headers: header, body: file)
      .then((response) {
    msResonse = response.body;
    msResponseCode = response.statusCode;
  });

  if (msResponseCode == 200) {
    Db database = new Db(config.dbURI + config.dbName);
    await database.open();
    DbCollection collection = new DbCollection(database, config.collectionName);

    var msResponseMap = JSON.decode(msResonse);

    Map existingEntry = await collection.findOne({"sessionId" : sessionId});
    if (existingEntry == null || existingEntry.length < 1) {
      print("Add new Entry");
      Map entry = {
        'sessionId': sessionId,
        'emotionSet': [{
          'emotionsAt': time,
          'emotions': msResponseMap
        }
        ]
      };
      collection.insert(entry);
    } else {
      print("Update existing Entry");
      existingEntry["emotionSet"].add({
        'emotionsAt': time,
        'emotions': msResponseMap
      });
      await collection.save(existingEntry);
    }
  }

  return new shelf.Response.ok(msResonse);
}

getUser(shelf.Request request) {
  var id = getPathParameter(request, 'id');
  var name = getPathParameter(request, 'name');
  return new shelf.Response.ok('Success! Found: ' + id + ' ' + name);
}

getSessionDemoEntry(shelf.Request request) {
  var path = 'sessions-test.json';
  Directory pwd = Directory.current;
  print("PWD: " + pwd.path);
  File file = new File(path);
  var fileContent = file.readAsStringSync();
  return new shelf.Response.ok(fileContent);
}

getSessionEntry(shelf.Request request) async {
  DbConfigValues config = new DbConfigValues();
  Db database = new Db(config.dbURI + config.dbName);

  await database.open();

  DbCollection collection = new DbCollection(database, config.collectionName);

  var allSessions = await collection.find({}).toList().then((List<Map> maps) {
    return (maps);
  });

  database.close();

  Map result = {'sessions': allSessions};

  return new shelf.Response.ok(JSON.encode(result));
}