// Copyright (c) 2016, rdoering. All rights reserved. Use of this source code
// is governed by a BSD-style license that can be found in the LICENSE file.

import 'dart:io';

import 'package:args/args.dart';
import 'package:shelf/shelf.dart' as shelf;
import 'package:shelf/shelf_io.dart' as io;
import 'package:shelf_cors/shelf_cors.dart' as cors;
import 'package:shelf_route/shelf_route.dart';

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

  api.post('/user', (shelf.Request request) async {
    return new shelf.Response.ok('Success!' + await request.readAsString() );
  });

  api.get('/user/{name}/{id}', (shelf.Request request) {
    var id = getPathParameter(request, 'id');
    var name = getPathParameter(request, 'name');
    return new shelf.Response.ok('Success! Found: ' + id + ' ' + name );
  });


  var handler = const shelf.Pipeline()
      .addMiddleware(shelf.logRequests())
      .addMiddleware(cors.createCorsHeadersMiddleware())
      .addHandler(primaryRouter.handler);
      //.addHandler(_echoRequest);

  io.serve(handler, '0.0.0.0', port).then((server) {
    print('Serving at http://${server.address.host}:${server.port}');
  });
}

shelf.Response _echoRequest(shelf.Request request) {
  return new shelf.Response.ok('Request for "${request.url}"');
}
