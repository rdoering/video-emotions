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

  DbConfigValues config = new DbConfigValues();

  api.post('/image', (shelf.Request request) async {

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

      Map entry = {
        'sessionId': sessionId,
        'emotionSet': [{
          'emotionsAt': time,
          'emotions': msResponseMap
        }]
      };
      collection.insert(entry);

      database.close();
    }

    return new shelf.Response.ok(msResonse);
  });

  api.get('/user/{name}/{id}', (shelf.Request request) {
    var id = getPathParameter(request, 'id');
    var name = getPathParameter(request, 'name');
    return new shelf.Response.ok('Success! Found: ' + id + ' ' + name );
  });


  api.get('/sessions-demo', (shelf.Request request) {

    var path = 'sessions-test.json';
    Directory pwd = Directory.current;
    print("PWD: " + pwd.path);
    File file = new File(path);
    var fileContent = file.readAsStringSync();
    return new shelf.Response.ok(fileContent);
  });

  api.get('/sessions', (shelf.Request request) async {
    DbConfigValues config = new DbConfigValues();
    Db database = new Db(config.dbURI + config.dbName);

    await database.open();

    DbCollection collection = new DbCollection(database, config.collectionName);

    var allSessions = await collection.find({}).toList().then((List<Map> maps){
      return(maps);
    });

    database.close();

    Map result = {'sessions': allSessions};

    return new shelf.Response.ok(JSON.encode(result));
  });

  /*api.get('/sessions', (shelf.Request request) {

    DbConfigValues config = new DbConfigValues();
    Db database = new Db(config.dbURI + config.dbName);
    await database.open();
  DbCollection collection = new DbCollection(database, config.collectionName);


  var path = 'sessions-test.json';
    Directory pwd = Directory.current;
    print("PWD: " + pwd.path);
    print(path);
    File file = new File(path);
    var fileContent = file.readAsStringSync();
    return new shelf.Response.ok(fileContent);
  });*/


  var handler = const shelf.Pipeline()
      .addMiddleware(shelf.logRequests())
      .addMiddleware(cors.createCorsHeadersMiddleware())
      .addHandler(primaryRouter.handler);

  io.serve(handler, '0.0.0.0', port).then((server) {
    print('Serving at http://${server.address.host}:${server.port}');
  });
}

void onDataLoaded(HttpClientResponse response) {
  var jsonString = response.bo();
  print(jsonString);
}
